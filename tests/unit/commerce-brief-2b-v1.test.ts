import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

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

// COMMERCE-2B: pure form-model tests + server-contract integration. Zero
// network (tripwire), zero DB, zero providers.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-2B test: network is forbidden")
}) as typeof fetch

import {
  COMMERCE_BRIEF_LIMITS_V1,
  commerceBriefFieldKeyV1,
  countPlannedStoreProductsInTreesV1,
  createCommerceBriefDraftV1,
  createCommerceProductDraftV1,
  createCommerceVariantDraftV1,
  isValidCommerceSkuV1,
  parseInitialStockV1,
  parseMxnToCentsV1,
  validateCommerceBriefV1,
  type CommerceBriefDraftV1,
  type CommerceBriefProductDraftV1,
} from "../../lib/orvenix-ai/commerce/commerce-brief"
import { COMMERCE_FACT_LIMITS_V1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { COMMERCE_SKU_PATTERN_V1, validateSiteCreationPlanV2CommerceV1 } from "../../lib/orvenix-ai/commerce/provisioning-plan"
import { SITE_CREATION_OFFERING_LIMITS_V1 } from "../../lib/orvenix-ai/site-creation/offering-limits"
import { normalizeSiteCreationBusiness } from "../../lib/orvenix-ai/site-creation/business-normalization"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { DISABLED_ASSET_PROVIDER_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { OrvenixSiteCreationActionInput } from "../../app/actions/ai"
import { shouldConsumeCommerceBriefEnterV1 } from "../../app/dashboard/CommerceBriefEditor"
import type { EditorNode } from "../../types/editor"

// ---------------------------------------------------------------- helpers

function product(overrides: Partial<CommerceBriefProductDraftV1> = {}, variant: Partial<ReturnType<typeof createCommerceVariantDraftV1>> = {}): CommerceBriefProductDraftV1 {
  const base = createCommerceProductDraftV1()
  return { ...base, name: "Audífonos", ...overrides, variants: overrides.variants ?? [{ ...base.variants[0], price: "5499.00", initialStock: "10", ...variant }] }
}

function brief(products: CommerceBriefProductDraftV1[]): CommerceBriefDraftV1 {
  return { enabled: true, products }
}

function variantErrors(draft: CommerceBriefDraftV1, field: string): string | undefined {
  const result = validateCommerceBriefV1(draft)
  if (!("errors" in result)) return undefined
  return result.errors[commerceBriefFieldKeyV1(draft.products[0].variants[0].uiId, field)]
}

// ---------------------------------------------------------------- MXN -> cents

test("MXN -> cents: deterministic integer conversion (no float math)", () => {
  const cases: Array<[string, number]> = [
    ["5499", 549900], ["5499.00", 549900], ["5499.9", 549990], ["0.01", 1], ["$ 5499.90", 549990],
    ["  12.5 ", 1250], ["0.29", 29], ["1.10", 110], ["10000000", 1_000_000_000], ["19.99", 1999],
  ]
  for (const [input, cents] of cases) assert.deepEqual(parseMxnToCentsV1(input), { ok: true, cents }, input)
})

test("MXN -> cents: malformed, >2 decimals, scientific, signed, zero, NaN/Infinity and over-max are rejected", () => {
  for (const input of ["", "abc", "5,499.00", "5499,00", "5499.999", "1e3", "5.4e2", "-10", "+10", "0", "0.00", "NaN", "Infinity", ".5", "5.", "0x10", "10000000.01", "999999999"]) {
    assert.equal(parseMxnToCentsV1(input).ok, false, JSON.stringify(input))
  }
})

test("limits are the server's, never re-declared", () => {
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxPriceMxn, COMMERCE_FACT_LIMITS_V1.maxPriceMxn)
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxInitialStock, COMMERCE_FACT_LIMITS_V1.maxInitialStock)
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct, COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct)
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxProducts, SITE_CREATION_OFFERING_LIMITS_V1.maxItems)
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxNameLength, SITE_CREATION_OFFERING_LIMITS_V1.maxNameLength)
  assert.equal(COMMERCE_BRIEF_LIMITS_V1.maxDescriptionLength, SITE_CREATION_OFFERING_LIMITS_V1.maxDescriptionLength)
})

// ---------------------------------------------------------------- compare price / stock / sku

test("compare price: must be > price; <= price shows an inline error; blank is omitted", () => {
  assert.equal(variantErrors(brief([product({}, { comparePrice: "6299.00" })]), "comparePrice"), undefined)
  assert.match(variantErrors(brief([product({}, { comparePrice: "5499.00" })]), "comparePrice")!, /mayor/)
  assert.match(variantErrors(brief([product({}, { comparePrice: "100" })]), "comparePrice")!, /mayor/)
  const ok = validateCommerceBriefV1(brief([product({}, { comparePrice: "   " })]))
  assert.ok("products" in ok && ok.products && !("comparePriceMxn" in ok.products[0].variants[0]))
})

test("stock: whole numbers 0..max; 0 valid; blank, negative, decimal and over-max rejected (never invented)", () => {
  assert.deepEqual(parseInitialStockV1("0"), { ok: true, units: 0 })
  assert.deepEqual(parseInitialStockV1("25"), { ok: true, units: 25 })
  assert.deepEqual(parseInitialStockV1("1000000"), { ok: true, units: 1_000_000 })
  for (const input of ["", "  ", "-1", "2.5", "1e3", "1000001", "abc", "+3"]) assert.equal(parseInitialStockV1(input).ok, false, JSON.stringify(input))
  assert.match(variantErrors(brief([product({}, { initialStock: "" })]), "initialStock")!, /inventario inicial/)
})

test("sku: same rule as the server; unsafe rejected; blank omitted; duplicates in the brief flagged on BOTH rows", () => {
  assert.equal(COMMERCE_SKU_PATTERN_V1.source, "^[A-Za-z0-9._-]{1,128}$")
  assert.equal(isValidCommerceSkuV1("NM-001_a.b"), true)
  for (const sku of ["bad sku", "a;DROP", "ñ", "x".repeat(129)]) assert.equal(isValidCommerceSkuV1(sku), false, sku)
  assert.match(variantErrors(brief([product({}, { sku: "bad sku" })]), "sku")!, /SKU inválido/)

  const blank = validateCommerceBriefV1(brief([product({}, { sku: "  " })]))
  assert.ok("products" in blank && blank.products && !("sku" in blank.products[0].variants[0]))

  const first = product({}, { sku: "SAME" })
  const second = product({ name: "Bocina" }, { sku: "SAME" })
  const result = validateCommerceBriefV1(brief([first, second]))
  assert.ok("errors" in result)
  if ("errors" in result) {
    assert.match(result.errors[commerceBriefFieldKeyV1(first.variants[0].uiId, "sku")], /ya se usa/)
    assert.match(result.errors[commerceBriefFieldKeyV1(second.variants[0].uiId, "sku")], /ya se usa/)
  }
})

// ---------------------------------------------------------------- limits / strings

test("limits: >8 products, >8 variants, empty brief and over-long strings are validation errors (no silent truncation)", () => {
  const nine = Array.from({ length: 9 }, (_, index) => product({ name: `P${index}` }))
  assert.match(("errors" in validateCommerceBriefV1(brief(nine)) && (validateCommerceBriefV1(brief(nine)) as { firstError: string }).firstError) || "", /Máximo 8 productos/)

  const manyVariants = product({ variants: Array.from({ length: 9 }, (_, index) => ({ ...createCommerceVariantDraftV1(`V${index}`), price: "10", initialStock: "1" })) })
  const variantResult = validateCommerceBriefV1(brief([manyVariants]))
  assert.ok("errors" in variantResult && variantResult.errors[commerceBriefFieldKeyV1(manyVariants.uiId, "variants")])

  assert.ok("errors" in validateCommerceBriefV1(brief([])))
  const tooLong = product({ name: "N".repeat(91), description: "D".repeat(181), category: "C".repeat(61) })
  const stringResult = validateCommerceBriefV1(brief([tooLong]))
  assert.ok("errors" in stringResult)
  if ("errors" in stringResult) {
    for (const field of ["name", "description", "category"]) assert.ok(stringResult.errors[commerceBriefFieldKeyV1(tooLong.uiId, field)], field)
  }
  const punctuationCategory = validateCommerceBriefV1(brief([product({ category: "!!!" })]))
  assert.ok("errors" in punctuationCategory)
  assert.match(variantErrors(brief([product({}, { label: "" })]), "label")!, /variante/)
  assert.equal(("errors" in validateCommerceBriefV1(brief([product({ name: " " })]))), true)
})

// ---------------------------------------------------------------- payload

test("payload: disabled brief -> products omitted (no fake empty store)", () => {
  const draft = createCommerceBriefDraftV1()
  assert.equal(draft.enabled, false)
  assert.deepEqual(validateCommerceBriefV1({ ...draft, products: [product()] }), { ok: true, products: undefined })
})

test("payload: valid brief -> exact public business.products shape, no UI ids, no execution fields", () => {
  const tablet = product(
    { name: "  Tablet Nova 10 ", description: " Para leer ", category: " Tecnología ", variants: [] },
  )
  tablet.variants = [
    { ...createCommerceVariantDraftV1("64 GB"), price: "5499", comparePrice: "6299.00", initialStock: "25", sku: "NM-001-64" },
    { ...createCommerceVariantDraftV1("128 GB"), price: "6499.50", initialStock: "0", sku: "" },
  ]
  const result = validateCommerceBriefV1(brief([tablet]))
  assert.deepEqual(result, {
    ok: true,
    products: [{
      name: "Tablet Nova 10",
      description: "Para leer",
      category: "Tecnología",
      variants: [
        { label: "64 GB", priceMxn: 549900, comparePriceMxn: 629900, initialStock: 25, sku: "NM-001-64" },
        { label: "128 GB", priceMxn: 649950, initialStock: 0 },
      ],
    }],
  })
  const serialized = JSON.stringify(result)
  assert.equal(serialized.includes("ui-"), false, "UI-only temporary ids are never submitted")
  for (const forbidden of ["uiId", "productId", "variantId", "siteId", "sourceIndex", "variantIndex", "provisioningRef", "storeBinding", "metadata", "status", "commerceStore", "repository", "provider", "pendingProvisioning"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden)
  }
})

test("payload: hostile draft fields (smuggled via a manipulated client object) are never copied", () => {
  const hostile = product() as CommerceBriefProductDraftV1 & Record<string, unknown>
  hostile.productId = "forged"
  hostile.storeBinding = { productId: "forged" }
  ;(hostile.variants[0] as unknown as Record<string, unknown>).variantId = "forged"
  const result = validateCommerceBriefV1(brief([hostile]))
  assert.equal(JSON.stringify(result).includes("forged"), false)
})

test("stable UI ids: distinct per row, so removing a row never shifts values between rows", () => {
  const ids = new Set(Array.from({ length: 50 }, () => createCommerceProductDraftV1().uiId))
  assert.equal(ids.size, 50)
  const draft = brief([product({ name: "A" }), product({ name: "B" }), product({ name: "C" })])
  const withoutB = draft.products.filter((entry) => entry.name !== "B")
  assert.deepEqual(withoutB.map((entry) => entry.uiId), [draft.products[0].uiId, draft.products[2].uiId])
})

test("action contract: the brief payload type-checks as public business.products; execution fields do not", () => {
  const result = validateCommerceBriefV1(brief([product()]))
  const products = "products" in result ? result.products : undefined
  const input: OrvenixSiteCreationActionInput = { message: "x", business: { name: "Tienda", ...(products ? { products } : {}) } }
  void input
  // @ts-expect-error -- no store ids in the public product contract.
  const forged: OrvenixSiteCreationActionInput = { message: "x", business: { products: [{ name: "P", productId: "x" }] } }
  void forged
})

// ---------------------------------------------------------------- server integration (authoritative normalization)

test("integration: brief payload -> server normalization -> builder -> hash-covered provisioning plan + pending cards", async () => {
  const draft = brief([
    product({ name: "Audífonos Aria", category: "Audio" }, { price: "2499.00", comparePrice: "2999.00", initialStock: "12", sku: "ARIA-1" }),
    product({ name: "Bocina Pulse", category: "Audio" }, { price: "1399", initialStock: "0" }),
  ])
  const validated = validateCommerceBriefV1(draft)
  assert.ok("products" in validated && validated.products)
  const payloadProducts = (validated as { products: NonNullable<typeof validated["products"]> }).products

  const business = normalizeSiteCreationBusiness({ name: "Tienda Brief", industry: "tienda en linea", products: payloadProducts }, "Crea un sitio. Tienda en linea con productos: Audífonos Aria, Bocina Pulse.")
  assert.deepEqual(business.products, [
    { name: "Audífonos Aria", description: "", category: "Audio", variants: [{ label: "Única", priceMxn: 249900, comparePriceMxn: 299900, availability: "in_stock", sku: "ARIA-1", initialStock: 12 }] },
    { name: "Bocina Pulse", description: "", category: "Audio", variants: [{ label: "Única", priceMxn: 139900, availability: "in_stock", initialStock: 0 }] },
  ])

  const request = "Crea un sitio desde cero. Negocio: Tienda Brief. Tienda en linea con productos: Audífonos Aria, Bocina Pulse."
  const withIntent = await runAutonomousMultiPageSiteBuilder({ request, business: { name: business.name, industry: business.industry, products: business.products }, forceFreshComposition: true, assetProvider: DISABLED_ASSET_PROVIDER_V1, commerceProvisioning: { mode: "new_store" } })
  assert.equal(withIntent.architecture.siteType, "ecommerce")
  assert.deepEqual(validateSiteCreationPlanV2CommerceV1(withIntent.plan.commerce), [])
  assert.deepEqual(withIntent.plan.commerce!.provisioning.products.map((entry) => entry.variants.map((variant) => [variant.priceMxn, variant.initialStock, variant.sku])), [[[249900, 12, "ARIA-1"]], [[139900, 0, "ORV-002-1"]]])
  const trees = withIntent.plan.pages.map((page) => page.tree)
  assert.ok(countPlannedStoreProductsInTreesV1(trees as never) > 0, "pending cards the preview UX will describe")
  assert.equal(JSON.stringify(withIntent.plan).includes('"variantId"'), false, "preview carries no executable ids")

  // Entitlement stays server-authoritative: without the server-decided intent the SAME payload is presentation only.
  const withoutIntent = await runAutonomousMultiPageSiteBuilder({ request, business: { name: business.name, industry: business.industry, products: business.products }, forceFreshComposition: true, assetProvider: DISABLED_ASSET_PROVIDER_V1 })
  assert.equal(withoutIntent.plan.commerce, undefined)
  assert.equal(countPlannedStoreProductsInTreesV1(withoutIntent.plan.pages.map((page) => page.tree) as never), 0)
  assert.equal(withoutIntent.plan.pages.flatMap((page) => Object.values(page.tree.nodes as Record<string, EditorNode>)).some((node) => node.type.startsWith("store-")), false)
})

test("integration: the server still strips hostile ids/bindings even if a client bypasses the brief", () => {
  const business = normalizeSiteCreationBusiness({
    products: [{ name: "P", productId: "x", storeBinding: { productId: "x" }, variants: [{ label: "U", priceMxn: 100, initialStock: 1, variantId: "v", sourceIndex: 3 }] } as never],
  }, "x")
  assert.equal(JSON.stringify(business.products).match(/productId|variantId|storeBinding|sourceIndex/), null)
})

test("entitlement UX is display-only: CreateSiteWithAI never forwards it, and the dashboard derives it server-side from the user's own plan", () => {
  const component = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CreateSiteWithAI.tsx"), "utf8")
  const actionCall = component.slice(component.indexOf("runOrvenixSiteCreationAction({\n        mode: \"preview\""), component.indexOf("if (!result.success)", component.indexOf("mode: \"preview\"")))
  assert.equal(/commerceAvailable|commerceProvisioning|commerceStore/.test(actionCall), false)
  assert.ok(actionCall.includes("...(commerceProducts?.length ? { products: commerceProducts } : {})"))
  const dashboard = fs.readFileSync(path.join(process.cwd(), "app/dashboard/page.impl.tsx"), "utf8")
  assert.ok(dashboard.includes("commerceAvailable={Boolean(planAccess.isActive && canUseEcommerce(planAccess.plan?.id))}"))
  assert.ok(dashboard.includes("await getUserPlanAccess(session.user.id)"))
  const editor = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CommerceBriefEditor.tsx"), "utf8")
  for (const internal of ["productId", "variantId", "siteId", "sourceIndex", "variantIndex", "provisioningRef", "storeBinding", "metadata", "commerceStore", "repository"]) {
    assert.equal(editor.includes(internal), false, `editor never exposes ${internal}`)
  }
})

test("Enter safety: Enter in any commerce input is consumed; buttons, textareas, IME and other keys are untouched", () => {
  assert.equal(shouldConsumeCommerceBriefEnterV1({ key: "Enter", targetTagName: "INPUT" }), true)
  assert.equal(shouldConsumeCommerceBriefEnterV1({ key: "Enter", targetTagName: "INPUT", isComposing: true }), false, "IME composition keeps working")
  assert.equal(shouldConsumeCommerceBriefEnterV1({ key: "Enter", targetTagName: "BUTTON" }), false, "buttons keep native Enter activation")
  assert.equal(shouldConsumeCommerceBriefEnterV1({ key: "Enter", targetTagName: "TEXTAREA" }), false, "textareas keep newlines")
  for (const key of ["Tab", " ", "a", "Escape", "ArrowDown"]) assert.equal(shouldConsumeCommerceBriefEnterV1({ key, targetTagName: "INPUT" }), false, key)
})

test("Enter safety: the guard sits on the commerce editor root only; the parent form's submission is untouched", () => {
  const editor = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CommerceBriefEditor.tsx"), "utf8")
  assert.equal((editor.match(/onKeyDown=\{consumeEnterFromInputs\}/g) ?? []).length, 1)
  assert.ok(/return \(\n    <div className="[^"]*" onKeyDown=\{consumeEnterFromInputs\}>/.test(editor), "handler is on the editor's outermost element")
  assert.equal(editor.includes("<textarea"), false)
  assert.equal(/type="submit"/.test(editor), false, "the editor adds no submit buttons")
  const form = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CreateSiteWithAI.tsx"), "utf8")
  assert.ok(form.includes("<form onSubmit={handlePreview}"), "normal form submission elsewhere is unchanged")
  assert.equal(form.includes("onKeyDown"), false, "no global Enter suppression in the Create Site form")
})

test("dialog layout: viewport-bounded dialog, ONE scrolling form region, persistent footer INSIDE the form with every action", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CreateSiteWithAI.tsx"), "utf8")
  const content = source.match(/<Dialog\.Content className="([^"]+)"/)![1]
  assert.ok(/\bmax-h-\[calc\(100dvh-24px\)\]/.test(content) && /\blg:max-h-\[90dvh\]/.test(content), "dialog never exceeds the viewport")
  assert.ok(/\bflex\b/.test(content) && /\bflex-col\b/.test(content) && /\boverflow-hidden\b/.test(content))
  assert.equal(/\bgrid\b/.test(content), false, "content-sized grid rows (the root cause) are gone")

  const formStart = source.indexOf('<form onSubmit={handlePreview} className="flex min-h-0 flex-1 flex-col">')
  const formEnd = source.indexOf("</form>", formStart)
  assert.ok(formStart > 0 && formEnd > formStart, "the form itself is the bounded flex column")
  const form = source.slice(formStart, formEnd)
  const scrollAt = form.indexOf('className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden')
  const footerAt = form.indexOf('className="shrink-0 space-y-2 border-t')
  assert.ok(scrollAt > 0 && footerAt > scrollAt, "scroll region first, persistent footer after it")
  assert.equal((form.match(/overflow-y-auto/g) ?? []).length, 1, "exactly one scroll region inside the form")
  const commerceAt = form.indexOf("<CommerceBriefEditor")
  assert.ok(commerceAt > scrollAt && commerceAt < footerAt, "the commerce brief scrolls inside the single region")
  const footer = form.slice(footerAt)
  for (const marker of ['type="submit"', "handleCreate", "resetPreview", 'role="alert"', "commerceChangedSincePreview"]) {
    assert.ok(footer.includes(marker), `footer (inside the form) keeps ${marker}`)
  }

  const editor = fs.readFileSync(path.join(process.cwd(), "app/dashboard/CommerceBriefEditor.tsx"), "utf8")
  assert.equal(/overflow-y-(auto|scroll)/.test(editor), false, "no competing nested scrollbar in the commerce editor")
  assert.ok(editor.includes("onKeyDown={consumeEnterFromInputs}"), "Enter protection intact")
})

test("zz) zero network attempts across the COMMERCE-2B suite", () => {
  assert.equal(networkAttempts, 0)
})
