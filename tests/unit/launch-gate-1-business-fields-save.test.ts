import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { compileCommercialDesignV1 } from "../../lib/orvenix-ai/commercial-designs"
import { materializeBusinessFieldsV1, readBusinessFieldsV1 } from "../../lib/commercial/business-fields"
import { calculateSiteCreationTreeHash } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { EditorTree } from "../../types/editor"

/*
 * LAUNCH-GATE-1 (P1, found in the E2E gate): a customer who only gives a
 * WhatsApp number -- the normal case of the start form -- could not save the
 * editor. Materializing Business Fields wrote brand.contact.phone/email/address
 * as `undefined`, and the strict hash every save computes rejected the tree.
 */

async function whatsappOnlyConstructionHome(): Promise<EditorTree> {
  const compiled = await compileCommercialDesignV1({
    mode: "customer",
    designId: "construction",
    version: 2,
    facts: { businessName: "Constructora Solo WhatsApp", contact: { whatsapp: "5512345678" } },
  })
  const home = compiled.generated.plan.pages.find((page) => page.isHome)!
  // What the editor sends back: plain JSON.
  return JSON.parse(JSON.stringify(home.tree)) as EditorTree
}

test("LAUNCH-GATE-1: a WhatsApp-only Orvenix site can be saved (materialized tree is strict JSON)", async () => {
  const home = await whatsappOnlyConstructionHome()
  const fields = readBusinessFieldsV1(home as EditorTree & Record<string, unknown>)
  assert.ok(fields, "the home page carries the Business Fields authority")
  assert.equal(fields.phone, undefined)

  const saved = materializeBusinessFieldsV1(home, fields)
  assert.doesNotThrow(() => calculateSiteCreationTreeHash(saved))
  const contact = saved.brand?.contact ?? {}
  for (const [key, value] of Object.entries(contact)) assert.notEqual(value, undefined, `brand.contact.${key}`)
  assert.equal(contact.whatsapp, fields.whatsapp)
})

test("LAUNCH-GATE-1: the brand contact still mirrors the authority (stale values removed, given values kept)", async () => {
  const home = await whatsappOnlyConstructionHome()
  const fields = readBusinessFieldsV1(home as EditorTree & Record<string, unknown>)!
  const stale = { ...home, brand: { ...(home.brand ?? {}), contact: { phone: "5599999999", email: "viejo@example.test", whatsapp: "5500000000" } } } as EditorTree

  const contact = materializeBusinessFieldsV1(stale, fields).brand?.contact ?? {}
  assert.equal("phone" in contact, false)
  assert.equal("email" in contact, false)
  assert.equal(contact.whatsapp, fields.whatsapp)

  const withPhone = materializeBusinessFieldsV1(home, { ...fields, phone: "5511112222" })
  assert.equal(withPhone.brand?.contact?.phone, "5511112222")
  assert.doesNotThrow(() => calculateSiteCreationTreeHash(withPhone))
})
