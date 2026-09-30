import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// FULL-SITE-5C: offline, synthetic values only. Credentials are deleted (never read); fetch is a counting tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("FULL-SITE-5C test: network is forbidden")
}) as typeof fetch

import {
  findProhibitedFullSiteRequestValuesV1,
  isFullSiteRequestFreeOfInternalValuesV1,
} from "../../lib/orvenix-ai/full-site-generation/request-guard"
import { buildFullSiteCreativeRequestV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import { buildFullSiteCommerceCapabilityManifestV1 } from "../../lib/orvenix-ai/full-site-generation/capability-manifest"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  type FullSiteCreativeBlueprintProviderV1,
} from "../../lib/orvenix-ai/full-site-generation/contract"
import { runNovaMarketFullSiteDryRunV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"

/** The accepted FULL-SITE-4F request fingerprint (sha256 of the serialized context). */
const REQUEST_FINGERPRINT_4F = "7c17ffffd3011c056c8ad4c0911640d0e8aa5fedd96d7fa946009dbfe4f631a1"

async function captureNovaMarketRequest(): Promise<unknown> {
  let captured: unknown = null
  const capture: FullSiteCreativeBlueprintProviderV1 = {
    async generate(input: unknown) {
      captured = input
      throw new Error("capture_only")
    },
  } as FullSiteCreativeBlueprintProviderV1
  const result = await runNovaMarketFullSiteDryRunV1({
    mode: "real",
    env: { NODE_ENV: "test", ORVENIX_DEV_ASSISTED_E2E: "1" },
    authorizeRealProviderCall: true,
    realProvider: capture,
  })
  assert.equal(result.status, "completed")
  assert.ok(captured, "request captured without any network")
  return captured
}

// Synthetic, obviously-fake values -- never real credentials or records.
const SYNTHETIC: Record<string, { value: string; rule: string }> = {
  internalSiteId: { value: "site_Zz9Fake0001", rule: "internal_id" },
  internalPreviewId: { value: "scp_0fake0fake0fake", rule: "internal_id" },
  internalProductId: { value: "prod_FAKE1234", rule: "internal_id" },
  internalVariantId: { value: "var_fake5678", rule: "internal_id" },
  mockStoreId: { value: "nm-mock-product-7", rule: "internal_id" },
  cuid: { value: "cfakefakefakefakefake0000", rule: "database_id" },
  uuid: { value: "12345678-1234-4234-8234-123456789abc", rule: "uuid" },
  hash: { value: "deadbeef".repeat(8), rule: "hash" },
  unixPath: { value: "/home/example/secret.json", rule: "filesystem_path" },
  windowsPath: { value: "C:\\Users\\example\\file.txt", rule: "filesystem_path" },
  relativePath: { value: "../lib/internal.ts", rule: "filesystem_path" },
  apiRoute: { value: "/api/internal/sites", rule: "internal_route" },
  devRoute: { value: "/dev-assisted-generation-e2e/view/assisted/home", rule: "internal_route" },
  previewRoute: { value: "/preview/abc123?page=home", rule: "internal_route" },
  url: { value: "https://example.invalid/x", rule: "url" },
  wwwUrl: { value: "www.example.invalid", rule: "url" },
  email: { value: "someone@example.invalid", rule: "email" },
  anthropicShape: { value: "sk-ant-FAKEFAKEFAKE", rule: "credential" },
  stripeShape: { value: "sk_test_FAKEFAKE", rule: "credential" },
  bearer: { value: "Bearer FAKEFAKEFAKEFAKE", rule: "credential" },
  envName: { value: "DATABASE_URL", rule: "secret_env_name" },
}

test("5C: current offline NovaMarket request is byte-identical to the accepted PCE-3 request and has zero findings", async () => {
  const context = await captureNovaMarketRequest()
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex")
  assert.equal(fingerprint, REQUEST_FINGERPRINT_4F)
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(context), [])
})

test("5C false-positive regression: public output-contract keys are not internal ids (an unanchored guard flagged them)", () => {
  const outputContract = { roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 }
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1({ outputContract }), [])
  // Documents the 4F trigger: the unanchored alternation matches inside "full_site_...".
  assert.equal(/(site_|scp_|prod_|var_)/.test(JSON.stringify(outputContract)), true)
  // ...while real ids with the same prefixes are still caught.
  assert.equal(isFullSiteRequestFreeOfInternalValuesV1({ business: { industry: "site_Zz9Fake0001" } }), false)
})

test("5C guard sensitivity: every synthetic internal/secret category is detected with its rule and path", () => {
  for (const [name, { value, rule }] of Object.entries(SYNTHETIC)) {
    const findings = findProhibitedFullSiteRequestValuesV1({ catalog: { products: [{ description: `texto ${value} texto` }] } })
    assert.ok(findings.some((finding) => finding.rule === rule && finding.path === "$.catalog.products[].description"), `${name}: ${JSON.stringify(findings)}`)
  }
})

test("5C guard output never contains the matched value", () => {
  const all = Object.values(SYNTHETIC).map(({ value }) => value).join(" ")
  const findings = findProhibitedFullSiteRequestValuesV1({ business: { objective: all } })
  assert.ok(findings.length > 0)
  const serialized = JSON.stringify(findings)
  for (const { value } of Object.values(SYNTHETIC)) assert.equal(serialized.includes(value), false)
})

test("5C guard: internal record keys are flagged even with harmless values", () => {
  for (const key of ["productId", "variantId", "siteId", "storeBinding", "sku", "stock", "rootId", "nodes", "provisioningRef"]) {
    const findings = findProhibitedFullSiteRequestValuesV1({ catalog: { products: [{ [key]: 1 }] } })
    assert.deepEqual(findings, [{ rule: "internal_key", path: `$.catalog.products[].${key}`, count: 1 }], key)
  }
})

test("5C guard: ordinary Spanish commerce copy is not flagged", () => {
  const context = {
    business: { industry: "Tienda en línea de tecnología, hogar y oficina", objective: "Vender productos con envío nacional", location: "Ciudad de México" },
    catalog: { products: [{ name: "Silla ergonómica Base", description: "Respaldo de malla, ajuste de altura y precio accesible.", variantLabels: ["Negro", "Gris"] }] },
    outputContract: { roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 },
  }
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(context), [])
})

test("5C guard allowlist is exact and path-aware: canonical vocabulary only where Orvenix puts it", () => {
  // STATIC CONTRACT: canonical manifest + output contract, in place -> no finding.
  const manifest = buildFullSiteCommerceCapabilityManifestV1()
  assert.ok((manifest.notAvailable as readonly string[]).includes("order_history"), "canonical value exists")
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1({ capabilities: manifest }), [])
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1({ outputContract: { roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 } }), [])

  // SAME STRING OUTSIDE THE TRUSTED STRUCTURE -> finding.
  for (const context of [
    { business: { industry: "order_history" } },
    { catalog: { products: [{ name: "order_history" }] } },
    { catalog: { categories: [{ label: "order_history" }] } },
    { capabilities: { pagePurposes: ["order_history"] } },
    { outputContract: { strategyKey: "order_history" } },
  ]) {
    assert.deepEqual(findProhibitedFullSiteRequestValuesV1(context).map((finding) => finding.rule), ["internal_id"], JSON.stringify(Object.keys(context)))
  }

  // UNKNOWN value at the trusted path, or inside a longer trusted-path string -> finding.
  assert.equal(isFullSiteRequestFreeOfInternalValuesV1({ capabilities: { notAvailable: ["order_anythingelse"] } }), false)
  assert.equal(isFullSiteRequestFreeOfInternalValuesV1({ capabilities: { notAvailable: ["order_history prod_FAKE1234"] } }), false)
  assert.equal(isFullSiteRequestFreeOfInternalValuesV1({ business: { objective: "order_anythingelse" } }), false)
})

test("5C sanitizer: order_history in business free text is redacted (free text never inherits the vocabulary exemption)", () => {
  const { context } = buildFullSiteCreativeRequestV1({
    industry: "Tienda order_history",
    products: [{ name: "Producto order_history", category: "Hogar", variants: [{ label: "Único", priceMxn: 1000, availability: "in_stock" }] }],
  })
  assert.equal(JSON.stringify(context.business).includes("order_history"), false)
  assert.equal(JSON.stringify(context.catalog).includes("order_history"), false)
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(context), [])
})

test("5C sanitizer: synthetic leaks in every free-text input are removed before the provider request is built", () => {
  // nm-mock-* is a test-fixture id prefix, deliberately NOT a sanitizer rule (the guard still reports it).
  const leaks = Object.entries(SYNTHETIC).filter(([name]) => name !== "mockStoreId").map(([, { value }]) => value)
  const leakText = (label: string) => `${label} ${leaks.join(" ")}`
  const products: CommerceProductFactV1[] = [
    {
      name: leakText("Producto"),
      description: leakText("Descripción"),
      category: "Tecnología",
      variants: [{ label: leakText("Variante"), priceMxn: 10000, availability: "in_stock", sku: "SKU-FAKE-1", variantId: "var_fake5678", stock: 3 }],
      storeBinding: { productId: "prod_FAKE1234" },
      pendingProvisioning: { sourceIndex: 0, variantIndex: 0 },
    } as CommerceProductFactV1,
    { name: "Otro", category: "Hogar", variants: [{ label: "Único", priceMxn: 5000, availability: "in_stock" }] },
  ]
  const { context } = buildFullSiteCreativeRequestV1({
    industry: leakText("Industria"),
    objective: leakText("Objetivo"),
    location: leakText("Ubicación"),
    products,
  })
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(context), [])
  const serialized = JSON.stringify(context)
  for (const value of [...leaks, "SKU-FAKE-1"]) assert.equal(serialized.includes(value), false, "synthetic value removed")
})

test("zz) zero network attempts across the FULL-SITE-5C suite", () => {
  assert.equal(networkAttempts, 0)
})
