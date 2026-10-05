import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  COMMERCIAL_DESIGN_REGISTRY_V1,
  compileCommercialDesignV1,
  isHiddenCommercialPageV1,
  stripCommercialEmptyStatesV1,
  type BusinessFactsInputV1,
} from "../../lib/orvenix-ai/commercial-designs"
import type { EditorTree } from "../../types/editor"

/*
 * COMMERCIAL PURCHASE E2E (P1, found in the gate): the start form does not ask
 * for projects, team or plans, so construction, clinica and contabilidad
 * publish with pages hidden as empty states. The runtime already 404s those
 * pages and drops buttons to them, but SiteNav renders its inline `pages`
 * (`page:<slug>` items), so the published main navigation kept dead links.
 */

const FORM_FACTS: BusinessFactsInputV1 = {
  businessName: "Negocio Formulario",
  contact: { whatsapp: "8112345678" },
  services: [{ name: "Uno" }, { name: "Dos" }],
  location: "Monterrey",
  serviceArea: ["Centro"],
}

const FIDELITY_DESIGNS = Object.values(COMMERCIAL_DESIGN_REGISTRY_V1).filter((design) => design.composition?.fidelity === "demo-shape")

function navHrefs(tree: EditorTree): string[] {
  return Object.values(tree.nodes)
    .filter((node) => node.type === "siteNav" && Array.isArray(node.props.pages))
    .flatMap((node) => (node.props.pages as Array<{ href?: string }>).map((item) => String(item.href ?? "")))
}

test("COMMERCIAL E2E: the published navigation never links a hidden page; visible pages stay in it", async () => {
  let designsWithHiddenPages = 0
  for (const design of FIDELITY_DESIGNS) {
    const compiled = await compileCommercialDesignV1({ mode: "customer", designId: design.id, version: design.version, facts: FORM_FACTS })
    const hidden = new Set(compiled.plan.pages.filter((page) => isHiddenCommercialPageV1(page.tree)).map((page) => page.slug))
    if (hidden.size) designsWithHiddenPages += 1
    for (const page of compiled.plan.pages.filter((entry) => !hidden.has(entry.slug))) {
      const before = navHrefs(page.tree)
      const published = stripCommercialEmptyStatesV1(page.tree, { hiddenPageSlugs: hidden })
      const after = navHrefs(published)
      for (const slug of hidden) assert.ok(!after.includes(`page:${slug}`), `${design.id}/${page.slug}: nav links hidden page ${slug}`)
      assert.deepEqual(after, before.filter((href) => ![...hidden].some((slug) => href === `page:${slug}`)), `${design.id}/${page.slug}: visible nav items kept in order`)
      // The stored (editor) tree is never mutated by the public strip.
      assert.deepEqual(navHrefs(page.tree), before, `${design.id}/${page.slug}: editor tree untouched`)
    }
  }
  assert.ok(designsWithHiddenPages >= 1, "the form facts must exercise at least one design with hidden pages")
})

test("COMMERCIAL E2E: construction from the start form publishes a 4-item navigation", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "construction", version: 2, facts: FORM_FACTS })
  const hidden = new Set(compiled.plan.pages.filter((page) => isHiddenCommercialPageV1(page.tree)).map((page) => page.slug))
  assert.deepEqual([...hidden].sort(), ["proyecto-destacado", "proyectos"])
  const home = compiled.plan.pages.find((page) => page.isHome)!
  assert.deepEqual(navHrefs(stripCommercialEmptyStatesV1(home.tree, { hiddenPageSlugs: hidden })), ["page:home", "page:servicios", "page:nosotros", "page:contacto"])
})

test("COMMERCIAL E2E: SiteNav renders inline page: items, so the public strip is what removes them", () => {
  const siteNav = readFileSync(path.join(process.cwd(), "components/editor/primitives/SiteNav.tsx"), "utf8")
  assert.match(siteNav, /const usesRealSitePages = resolvedPages\.length > 1 && inlinePagesAreAnchors/)
  assert.match(siteNav, /const navPages = usesInlinePages \? inlinePages : resolvedPages/)
})
