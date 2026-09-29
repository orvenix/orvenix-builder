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

// TEST-ONLY SSR shim (COMMERCE-1): node has no DOM here, and zustand's
// server snapshot is the store's INITIAL state, so a server render would
// only ever show EditorProvider's loading skeleton. Wrapping `create` so the
// server snapshot is the CURRENT state reproduces what the client sees after
// EditorProvider initializes -- the render path itself (PublicRenderer ->
// EditorProvider -> DynamicRenderer -> block registry -> ProductCard/Cart*)
// is the real, unmodified one. Installed before any app module loads.
{
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  let shimmed: unknown
  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function loadWithZustandShim(request: unknown, parent: unknown, isMain: unknown) {
    const loaded = originalLoad.call(this, request, parent, isMain)
    if (request !== "zustand") return loaded
    if (!shimmed) {
      const real = loaded as { useStore: (api: unknown, selector?: unknown) => unknown }
      const vanilla = originalLoad.call(this, "zustand/vanilla", parent, isMain) as { createStore: (init: unknown) => Record<string, unknown> & { getState: () => unknown } }
      const createImpl = (init: unknown) => {
        const api = vanilla.createStore(init)
        api.getInitialState = api.getState
        const hook = (selector?: unknown) => real.useStore(api, selector)
        return Object.assign(hook, api)
      }
      shimmed = { ...real, create: (init?: unknown) => (init ? createImpl(init) : createImpl) }
    }
    return shimmed
  }
}

// COMMERCE-1: zero Anthropic / Pexels / Mercado Pago / network / DB. Real
// credentials are only deleted (never read); fetch is a counting tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-1 test: network is forbidden")
}) as typeof fetch

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime"
import {
  bindStoreProductRecordsV1,
  commerceCategoryKeyV1,
  executableVariantForProductV1,
  isExecutableCommerceProductV1,
  normalizeCommercePresentationProductsV1,
  type StoreProductRecordV1,
} from "../../lib/orvenix-ai/commerce/product-facts"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { validateEditorTreeSafety } from "../../lib/orvenix-ai/safety"
import { buildAssistedSiteGenerationRequestContextV1, type AssistedSiteGenerationRequestContextV1 } from "../../lib/orvenix-ai/assisted-generation/request-context"
import { resolveAssistedSiteGenerationV1 } from "../../lib/orvenix-ai/assisted-generation/architecture-bridge"
import { validateAssistedSiteGenerationProposalV1 } from "../../lib/orvenix-ai/assisted-generation/validator"
import {
  buildNovaMarketBuilderInputBaseV1,
  buildNovaMarketMockExecutableBuilderInputV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import {
  NOVAMARKET_MOCK_SITE_ID_V1,
  NOVAMARKET_PRODUCTS_V1,
  buildNovaMarketMockStoreRecordsV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import { buildCartItemFromProductCardV1, isProductCardBoundV1 } from "../../components/editor/blocks/store/product-card-binding"
import { useCartStore } from "../../store/useCartStore"
import { StoreCheckoutSchemaV1, buildStoreCheckoutBaseItemsV1, type StoreCheckoutVariantRowV1 } from "../../lib/commerce/checkout-pricing"
import { PublicRenderer } from "../../components/PublicRenderer"
import { useEditorStore } from "../../components/editor/store/useEditorStore"
import type { AssistedSiteGenerationProviderV1 } from "../../lib/orvenix-ai/assisted-generation/contract"
import type { EditorNode, EditorTree } from "../../types/editor"

// ---------------------------------------------------------------- helpers

/** Render order (DFS from root) -- the validated plan does not preserve `nodes` key order. */
function orderedNodes(tree: EditorTree): EditorNode[] {
  const out: EditorNode[] = []
  const walk = (id: string) => {
    const node = tree.nodes[id] as EditorNode | undefined
    if (!node) return
    out.push(node)
    for (const child of node.children) walk(child)
  }
  walk(tree.rootId)
  return out
}

function nodesOf(run: AutonomousMultiPageSiteBuilderResult, slug?: string): EditorNode[] {
  return run.plan.pages.filter((page) => !slug || page.slug === slug).flatMap((page) => orderedNodes(page.tree))
}

function storeNodes(run: AutonomousMultiPageSiteBuilderResult, type: string, slug?: string) {
  return nodesOf(run, slug).filter((node) => node.type === type)
}

function allText(run: AutonomousMultiPageSiteBuilderResult, slug?: string): string {
  return nodesOf(run, slug).map((node) => String(node.props?.text ?? node.props?.content ?? "")).join(" | ")
}

function assertValidPlanAndSafe(run: AutonomousMultiPageSiteBuilderResult) {
  assert.equal(run.ok, true)
  const revalidation = validateSiteCreationPlanV2(run.plan, { maxPages: Math.max(run.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(revalidation.ok, true)
  for (const page of run.plan.pages) {
    const safety = validateEditorTreeSafety(page.tree)
    assert.equal(safety.safe, true, `${page.slug}: ${safety.issues.map((issue) => issue.message).join("; ")}`)
  }
}

function mockProvider(respond: (input: unknown) => unknown): AssistedSiteGenerationProviderV1 & { calls: unknown[] } {
  const calls: unknown[] = []
  return {
    calls,
    async request(input: unknown) {
      calls.push(structuredClone(input))
      return respond(input)
    },
  }
}

const MOCK_RECORDS = buildNovaMarketMockStoreRecordsV1()
const MOCK_PAIRS = new Set(MOCK_RECORDS.flatMap((record) => record.variants.map((variant) => `${record.id}|${variant.id}`)))

// ---------------------------------------------------------------- 1) commerce fact normalization

test("normalization: legacy {name, description} products pass through unchanged in content", () => {
  const legacy = [{ name: "Tacos al pastor", description: "Clasicos de la casa" }, { name: "Agua fresca" }]
  assert.deepEqual(normalizeCommercePresentationProductsV1(legacy), [{ name: "Tacos al pastor", description: "Clasicos de la casa" }, { name: "Agua fresca" }])
  assert.equal(normalizeCommercePresentationProductsV1(undefined), undefined)
  assert.equal(normalizeCommercePresentationProductsV1([{ name: "   " }]), undefined)
})

test("normalization: presentation facts can NEVER become executable (binding/ids/stock stripped, never inferred)", () => {
  const hostile = [{
    name: "Tablet",
    category: "Tecnología",
    storeBinding: { productId: "real-looking-id" },
    productId: "x",
    variants: [{ label: "64 GB", priceMxn: 549900, variantId: "cku123", stock: 50, availability: "in_stock", url: "https://x" }],
  }]
  const [product] = normalizeCommercePresentationProductsV1(hostile)!
  assert.equal("storeBinding" in product, false)
  assert.equal("productId" in product, false)
  assert.deepEqual(product.variants, [{ label: "64 GB", priceMxn: 549900, availability: "in_stock" }])
  assert.equal(isExecutableCommerceProductV1(product), false)
  assert.equal(executableVariantForProductV1(product), null)
})

test("normalization: price/variant grounding drops invalid prices, keeps compare price only when higher", () => {
  const [product] = normalizeCommercePresentationProductsV1([{
    name: "Silla",
    variants: [
      { label: "Gris", priceMxn: 329900, comparePriceMxn: 389900 },
      { label: "Negra", priceMxn: 329900, comparePriceMxn: 100 },
      { label: "Gratis", priceMxn: 0 },
      { label: "Decimal", priceMxn: 12.5 },
      { label: "Texto", priceMxn: "999" },
      { label: "", priceMxn: 1000 },
    ],
  }])!
  assert.deepEqual(product.variants, [
    { label: "Gris", priceMxn: 329900, comparePriceMxn: 389900, availability: "in_stock" },
    { label: "Negra", priceMxn: 329900, availability: "in_stock" },
  ])
})

test("category grounding: stable closed-world keys", () => {
  assert.equal(commerceCategoryKeyV1("Tecnología"), "tecnologia")
  assert.equal(commerceCategoryKeyV1("  Audio & Video "), "audio-video")
})

// ---------------------------------------------------------------- 2) trusted store binding

test("binding: only active products of THE site with valid variants are bound; real ids copied verbatim", () => {
  const records: StoreProductRecordV1[] = [
    { id: "prod_a", siteId: "site-1", name: "Producto A", status: "active", metadata: { category: "Audio" }, variants: [{ id: "var_a1", sku: "A1", name: "Negro", priceMxn: 10000, comparePriceMxn: 12000, stock: 3 }] },
    { id: "prod_b", siteId: "site-2", name: "Otro sitio", status: "active", variants: [{ id: "var_b1", sku: "B1", name: "U", priceMxn: 5000, stock: 9 }] },
    { id: "prod_c", siteId: "site-1", name: "Borrador", status: "draft", variants: [{ id: "var_c1", sku: "C1", name: "U", priceMxn: 5000, stock: 9 }] },
    { id: "prod_d", siteId: "site-1", name: "Sin variantes validas", status: "active", variants: [{ id: "var_d1", sku: "D1", name: "U", priceMxn: 0, stock: 9 }] },
    { id: "bad id!", siteId: "site-1", name: "Id invalido", status: "active", variants: [{ id: "var_e1", sku: "E1", name: "U", priceMxn: 5000, stock: 9 }] },
  ]
  const bound = bindStoreProductRecordsV1("site-1", records)
  assert.equal(bound.length, 1)
  assert.deepEqual(bound[0], {
    name: "Producto A",
    category: "Audio",
    variants: [{ label: "Negro", priceMxn: 10000, comparePriceMxn: 12000, availability: "low_stock", sku: "A1", variantId: "var_a1", stock: 3 }],
    storeBinding: { productId: "prod_a" },
  })
  assert.equal(executableVariantForProductV1(bound[0])?.variantId, "var_a1")
  assert.deepEqual(bindStoreProductRecordsV1("", records), [])
})

test("binding: the card variant is the first purchasable one, else the first bound variant", () => {
  const [product] = bindStoreProductRecordsV1("s", [{ id: "p", siteId: "s", name: "P", status: "active", variants: [
    { id: "v1", sku: "1", name: "Agotado", priceMxn: 100, stock: 0 },
    { id: "v2", sku: "2", name: "Disponible", priceMxn: 200, stock: 7 },
  ] }])
  assert.equal(executableVariantForProductV1(product)?.variantId, "v2")
})

// ---------------------------------------------------------------- 3) builder: legacy / presentation / executable

test("legacy compatibility: a non-commerce business compiles exactly as before (no store nodes, no price text)", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para una agencia de marketing",
    business: { name: "Agencia C1", industry: "agencia de marketing", services: [{ name: "Estrategia" }, { name: "Contenido" }] },
    forceFreshComposition: true,
  })
  assert.equal(nodesOf(run).some((node) => /^store-/.test(node.type)), false)
  assert.equal(allText(run).includes("MXN"), false)
  assertValidPlanAndSafe(run)
})

test("NovaMarket PRESENTATION: grounded price/category facts render as static text; zero functional store nodes", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketBuilderInputBaseV1())
  assert.equal(run.architecture.siteType, "ecommerce")
  assert.equal(nodesOf(run).some((node) => /^store-/.test(node.type)), false, "presentation products must never emit store blocks")
  assert.equal(run.architecture.products?.every((product) => !product.storeBinding), true)
  assert.equal(run.architecture.products?.[0].category, "Tecnología")
  const catalog = allText(run, "productos")
  assert.ok(catalog.includes("Tablet Nova 10"))
  assert.ok(catalog.includes("Desde $5,499.00 MXN"), "multi-variant product shows grounded 'Desde' price")
  assert.ok(catalog.includes("Agotado"), "out-of-stock presentation product is labelled, not sold")
  assertValidPlanAndSafe(run)
})

test("presentation cannot be upgraded by payload: business.products carrying fake bindings still emit no store nodes", async () => {
  const base = buildNovaMarketBuilderInputBaseV1()
  const hostileProducts = base.business.products.map((product, index) => ({
    ...product,
    storeBinding: { productId: `forged-${index}` },
    variants: product.variants.map((variant) => ({ ...variant, variantId: `forged-var-${index}`, stock: 99 })),
  }))
  const run = await runAutonomousMultiPageSiteBuilder({ ...base, business: { ...base.business, products: hostileProducts } })
  assert.equal(nodesOf(run).some((node) => /^store-/.test(node.type)), false)
  assert.equal(JSON.stringify(run.plan).includes("forged"), false)
})

test("NovaMarket MOCK EXECUTABLE: existing store-product-card nodes carry the grounded mock ids; one cart shell per page", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  assertValidPlanAndSafe(run)

  const catalogCards = storeNodes(run, "store-product-card", "productos")
  assert.equal(catalogCards.length, 24, "catalog page binds every mock product")
  for (const card of catalogCards) {
    assert.ok(MOCK_PAIRS.has(`${card.props.productId}|${card.props.variantId}`), `ungrounded binding ${card.props.productId}|${card.props.variantId}`)
    assert.notEqual(card.props.variantId, "demo-v1")
    assert.equal(typeof card.props.priceMxn, "number")
  }
  const tablet = catalogCards.find((card) => card.props.productName === "Tablet Nova 10")!
  assert.deepEqual(
    { productId: tablet.props.productId, variantId: tablet.props.variantId, priceMxn: tablet.props.priceMxn, comparePriceMxn: tablet.props.comparePriceMxn },
    { productId: "nm-mock-prod-001", variantId: "nm-mock-var-001-1", priceMxn: 549900, comparePriceMxn: 629900 },
  )

  // PCE-2: the cart entry lives in the site navigation (SiteNav showCart) + one off-canvas drawer; no detached button band.
  for (const page of run.plan.pages) {
    const hasCards = storeNodes(run, "store-product-card", page.slug).length > 0
    const navNode = Object.values(page.tree.nodes as Record<string, EditorNode>).find((node) => node.type === "siteNav")
    assert.equal(storeNodes(run, "store-cart-button", page.slug).length, 0, `${page.slug}: no detached cart button band`)
    assert.equal(storeNodes(run, "store-cart-drawer", page.slug).length, hasCards ? 1 : 0, `${page.slug} cart drawer`)
    assert.equal(navNode?.props.showCart === true, hasCards, `${page.slug}: cart in navigation exactly when the page sells`)
    if (hasCards) {
      const root = page.tree.nodes[page.tree.rootId]
      const drawerId = root.children.find((id) => page.tree.nodes[id]?.type === "store-cart-drawer")
      assert.ok(drawerId, `${page.slug}: drawer is a root child (no wrapper section)`)
    }
  }
})

// ---------------------------------------------------------------- 4) Assisted: bounded context + category grounding

test("Assisted context: id-free bounded product views, grounded categories, category mode only when categories exist", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture: run.architecture })
  const serialized = JSON.stringify(context)
  assert.equal(serialized.includes("nm-mock-"), false, "no store ids in the prompt context")
  assert.equal(/storeBinding|variantId|"sku"|"stock"/.test(serialized), false)
  assert.equal(context.offerings.products?.length, 24)
  assert.deepEqual(context.offerings.products?.[0], {
    name: "Tablet Nova 10",
    description: "Tablet de 10 pulgadas para lectura, video y trabajo ligero.",
    category: "tecnologia",
    priceMxn: 549900,
    comparePriceMxn: 629900,
    availability: "in_stock",
    variantCount: 2,
    variantLabels: ["64 GB", "128 GB"],
    purchasable: true,
  })
  assert.deepEqual(context.categories?.map((category) => category.key), ["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"])
  assert.ok(context.capabilities.selectionModes.includes("category"))

  const legacy = buildAssistedSiteGenerationRequestContextV1({ architecture: { ...run.architecture, products: [{ name: "Solo nombre" }] } })
  assert.equal(legacy.categories, undefined)
  assert.equal(legacy.capabilities.selectionModes.includes("category"), false)
})

function categoryProposal(catalogSlug: string, instances: unknown[]) {
  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: catalogSlug, instances }],
  }
}

test("Assisted category grouping: accepted, resolved to that category's products only, compiled to bound store cards", async () => {
  const provider = mockProvider((input) => {
    const context = input as AssistedSiteGenerationRequestContextV1
    const catalog = context.pages.find((page) => page.slug !== "home" && page.roles.includes("products"))!
    return categoryProposal(catalog.slug, catalog.roles.flatMap((role): unknown[] =>
      role === "products"
        ? [{ role, selection: { mode: "category", category: "audio" } }, { role, selection: { mode: "category", category: "gaming" } }]
        : [{ role, selection: { mode: "all" } }],
    ))
  })
  const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketMockExecutableBuilderInputV1(), assistedGeneration: { mode: "anthropic", provider } })

  assert.equal(provider.calls.length, 1)
  assert.equal(run.assistedGeneration.status, "applied")
  const names = storeNodes(run, "store-product-card", "productos").map((card) => card.props.productName)
  const expected = NOVAMARKET_PRODUCTS_V1.filter((product) => product.category === "audio" || product.category === "gaming").map((product) => product.name)
  assert.deepEqual(names, expected)
  assert.equal(storeNodes(run, "store-cart-drawer", "productos").length, 1, "two product instances still share ONE cart shell")
  assertValidPlanAndSafe(run)
})

test("Assisted cannot invent commerce: unknown category, category on a non-product role, variant/price/id keys all rejected", async () => {
  const base = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const catalogSlug = base.architecture.pages.find((page) => page.slug !== "home" && page.sections.some((section) => section.role === "products"))!.slug
  const cases: Array<[string, unknown]> = [
    ["invented category", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "category", category: "juguetes" } }])],
    ["category on cta", categoryProposal(catalogSlug, [{ role: "cta", selection: { mode: "category", category: "audio" } }])],
    ["category without mode", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "all", category: "audio" } }])],
    ["invented product index", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "single-item", itemIndex: 24 } }])],
    ["variantId key", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "all" }, variantId: "nm-mock-var-001-1" }])],
    ["price key", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "all", priceMxn: 1 } }])],
    ["productId in composition", categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "all" }, composition: { productId: "x" } }])],
  ]
  for (const [name, proposal] of cases) {
    const result = await resolveAssistedSiteGenerationV1({ mode: "anthropic", architecture: base.architecture, provider: mockProvider(() => proposal) })
    assert.equal(result.lifecycle.status, "rejected", name)
    assert.equal(result.architecture, base.architecture, `${name}: architecture untouched`)
  }
  assert.equal(validateAssistedSiteGenerationProposalV1(categoryProposal(catalogSlug, [{ role: "products", selection: { mode: "category", category: "Audio!" } }])).ok, false)
})

// ---------------------------------------------------------------- 5) ProductCard binding / cart ids

test("ProductCard binding: generated card props produce a CartItem with the exact bound ids; demo/unbound cards cannot add", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const card = storeNodes(run, "store-product-card", "productos").find((node) => node.props.productName === "Audífonos inalámbricos Aria")!
  const item = buildCartItemFromProductCardV1(card.props)
  assert.deepEqual(item && { productId: item.productId, variantId: item.variantId, quantity: item.quantity }, { productId: "nm-mock-prod-017", variantId: "nm-mock-var-017-1", quantity: 1 })

  useCartStore.getState().clear()
  useCartStore.getState().addItem(item!)
  useCartStore.getState().addItem(item!)
  assert.deepEqual(useCartStore.getState().items.map((entry) => [entry.variantId, entry.quantity]), [["nm-mock-var-017-1", 2]])
  useCartStore.getState().clear()

  assert.equal(buildCartItemFromProductCardV1({ productName: "Sin ids", priceMxn: 100 }), null)
  assert.equal(buildCartItemFromProductCardV1({ productId: "demo", variantId: "demo-v1", priceMxn: 100 }), null, "retired demo ids are never bindable")
  assert.equal(buildCartItemFromProductCardV1({ productId: "p", variantId: "v", stock: 0 }), null, "out of stock cannot add")
  assert.equal(isProductCardBoundV1({ productId: "p", variantId: "v" }), true)
  assert.equal(isProductCardBoundV1({ productId: "p", variantId: "<script>" }), false)
})

// ---------------------------------------------------------------- 6) real PublicRenderer path

// Inert app-router context for SiteNav's next/navigation hooks (no navigation ever happens in SSR).
const INERT_ROUTER = { back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} }

function renderPage(siteId: string, tree: EditorTree, slug: string): string {
  useEditorStore.getState().initialize(siteId, tree, undefined, { activePageSlug: slug, activePageName: slug, availablePages: [] })
  const page = createElement(PublicRenderer, { siteId, tree, activePageSlug: slug, activePageName: slug, availablePages: [] })
  const withSearchParams = createElement(SearchParamsContext.Provider, { value: new URLSearchParams() as never }, page)
  const withPathname = createElement(PathnameContext.Provider, { value: `/p/${siteId}/${slug}` }, withSearchParams)
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: INERT_ROUTER as never }, withPathname))
}

test("PublicRenderer: bound generated cards render the EXISTING functional store card + cart; presentation renders no add-to-cart", async () => {
  const executable = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const executablePage = executable.plan.pages.find((page) => page.slug === "productos")!
  const executableHtml = renderPage(NOVAMARKET_MOCK_SITE_ID_V1, executablePage.tree, "productos")
  assert.ok(executableHtml.includes("Tablet Nova 10"))
  assert.ok((executableHtml.match(/data-store-card-state="bound"/g) ?? []).length >= 1, "bound cards render an enabled add-to-cart")
  assert.ok(executableHtml.includes("Añadir al carrito"))
  assert.ok(executableHtml.includes("Carrito"), "existing cart button renders")
  assert.equal(executableHtml.includes('data-store-card-state="unbound"'), false)

  const presentation = await runAutonomousMultiPageSiteBuilder(buildNovaMarketBuilderInputBaseV1())
  const presentationPage = presentation.plan.pages.find((page) => page.slug === "productos")!
  const presentationHtml = renderPage("nm-presentation-site", presentationPage.tree, "productos")
  assert.ok(presentationHtml.includes("Tablet Nova 10"))
  assert.equal(presentationHtml.includes("Añadir al carrito"), false)
  assert.equal(presentationHtml.includes("data-store-card-state"), false)

  const unboundTree: EditorTree = {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["card"], version: 1 },
      card: { id: "card", type: "store-product-card", props: { productName: "Tarjeta manual" }, children: [], version: 1, parentId: "root" },
    },
  } as EditorTree
  const unboundHtml = renderPage("manual-site", unboundTree, "home")
  assert.ok(unboundHtml.includes('data-store-card-state="unbound"'), "a manual card without ids is presentation-only")
  assert.equal(unboundHtml.includes("Añadir al carrito"), false)
})

// ---------------------------------------------------------------- 7) checkout authority (pure boundary, no DB / MP)

const DB_VARIANTS: StoreCheckoutVariantRowV1[] = [
  { id: "var_1", productId: "prod_1", name: "64 GB", sku: "S1", priceMxn: 549900, stock: 10, product: { name: "Tablet", siteId: "site-1", status: "active" } },
  { id: "var_2", productId: "prod_2", name: "Unica", sku: "S2", priceMxn: 64900, stock: 10, product: { name: "Cargador", siteId: "site-1", status: "active" } },
]

test("checkout authority: browser price/name/productId are stripped by the schema; DB prices are charged", () => {
  const parsed = StoreCheckoutSchemaV1.parse({
    customerEmail: "comprador@example.com",
    items: [
      { variantId: "var_1", quantity: 2, priceMxn: 1, productName: "manipulado", productId: "otro" },
      { variantId: "var_2", quantity: 1, priceMxn: 1 },
    ],
  })
  assert.deepEqual(parsed.items, [{ variantId: "var_1", quantity: 2 }, { variantId: "var_2", quantity: 1 }])

  const pricing = buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: parsed.items, variants: DB_VARIANTS })
  assert.equal(pricing.ok, true)
  if (pricing.ok) {
    assert.equal(pricing.totalMxn, 549900 * 2 + 64900)
    assert.deepEqual(pricing.items.map((item) => [item.variantId, item.priceMxn, item.productName]), [["var_1", 549900, "Tablet"], ["var_2", 64900, "Cargador"]])
  }
})

test("checkout authority: a manipulated generated card price never changes what checkout computes", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const card = storeNodes(run, "store-product-card", "productos")[0]
  const tampered = buildCartItemFromProductCardV1({ ...card.props, priceMxn: 1 })!
  const requestBody = { customerEmail: "c@example.com", items: [{ variantId: tampered.variantId, quantity: 1 }] } // exactly CartDrawer's shape
  const parsed = StoreCheckoutSchemaV1.parse(requestBody)
  const dbRow: StoreCheckoutVariantRowV1 = { id: tampered.variantId, productId: tampered.productId, name: "Real", sku: "R", priceMxn: 549900, stock: 10, product: { name: "Real", siteId: NOVAMARKET_MOCK_SITE_ID_V1, status: "active" } }
  const pricing = buildStoreCheckoutBaseItemsV1({ siteId: NOVAMARKET_MOCK_SITE_ID_V1, requestedItems: parsed.items, variants: [dbRow] })
  assert.equal(pricing.ok && pricing.totalMxn, 549900)
})

test("checkout authority: foreign-site, inactive, missing or duplicated variants are INVALID_ITEMS", () => {
  const requested = [{ variantId: "var_1", quantity: 1 }]
  assert.deepEqual(buildStoreCheckoutBaseItemsV1({ siteId: "site-2", requestedItems: requested, variants: [DB_VARIANTS[0]] }), { ok: false, error: "INVALID_ITEMS" })
  assert.deepEqual(buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: requested, variants: [{ ...DB_VARIANTS[0], product: { ...DB_VARIANTS[0].product, status: "draft" } }] }), { ok: false, error: "INVALID_ITEMS" })
  assert.deepEqual(buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: requested, variants: [] }), { ok: false, error: "INVALID_ITEMS" })
  assert.deepEqual(
    buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: [{ variantId: "var_1", quantity: 1 }, { variantId: "var_1", quantity: 3 }], variants: [DB_VARIANTS[0]] }),
    { ok: false, error: "INVALID_ITEMS" },
  )
})

test("checkout route delegates to the pure pricing boundary (no client price path left in the route)", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/store/[siteId]/checkout/route.ts"), "utf8")
  assert.ok(source.includes("buildStoreCheckoutBaseItemsV1({ siteId, requestedItems, variants })"))
  assert.ok(source.includes("const CheckoutSchema = StoreCheckoutSchemaV1"))
  assert.equal(/parsed\.data\.items\[[^\]]*\]\.priceMxn|item\.priceMxn\s*\?\?/.test(source), false)
})

// ---------------------------------------------------------------- 8) COMMERCE-1 security pass: stock + duplicates + ordering

const STOCK_ROW = (stock: number): StoreCheckoutVariantRowV1 => ({ id: "var_x", productId: "prod_x", name: "X", sku: "SX", priceMxn: 1000, stock, product: { name: "X", siteId: "site-1", status: "active" } })

test("stock: quantity <= current stock passes; more than stock is INSUFFICIENT_STOCK", () => {
  assert.equal(buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: [{ variantId: "var_x", quantity: 3 }], variants: [STOCK_ROW(3)] }).ok, true)
  assert.deepEqual(
    buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: [{ variantId: "var_x", quantity: 4 }], variants: [STOCK_ROW(3)] }),
    { ok: false, error: "INSUFFICIENT_STOCK", variantId: "var_x" },
  )
})

test("stock semantics: 0 and negative stock are unavailable (no invented 'unlimited')", () => {
  for (const stock of [0, -1, -5]) {
    const result = buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: [{ variantId: "var_x", quantity: 1 }], variants: [STOCK_ROW(stock)] })
    assert.deepEqual(result, { ok: false, error: "INSUFFICIENT_STOCK", variantId: "var_x" }, `stock ${stock}`)
  }
})

test("duplicates: stock=3 with X qty 2 + X qty 2 is NOT accepted as 4 (rejected INVALID_ITEMS, whatever the DB returns)", () => {
  const requestedItems = [{ variantId: "var_x", quantity: 2 }, { variantId: "var_x", quantity: 2 }]
  // findMany de-duplicates ids -> one row; also prove it with a (hypothetical) duplicated row set.
  for (const variants of [[STOCK_ROW(3)], [STOCK_ROW(3), STOCK_ROW(3)]]) {
    assert.deepEqual(buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems, variants }), { ok: false, error: "INVALID_ITEMS" })
  }
  assert.equal(StoreCheckoutSchemaV1.safeParse({ customerEmail: "c@example.com", items: requestedItems }).success, true, "schema accepts the shape; the pricing boundary is what rejects it")
})

test("quantity bounds: schema accepts 1..99 integers only; the pure boundary re-checks them", () => {
  for (const quantity of [0, -1, 100, 1.5]) {
    assert.equal(StoreCheckoutSchemaV1.safeParse({ customerEmail: "c@example.com", items: [{ variantId: "v", quantity }] }).success, false, `quantity ${quantity}`)
    assert.deepEqual(buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: [{ variantId: "var_x", quantity }], variants: [STOCK_ROW(500)] }), { ok: false, error: "INVALID_ITEMS" })
  }
  assert.equal(StoreCheckoutSchemaV1.safeParse({ customerEmail: "c@example.com", items: [{ variantId: "v", quantity: 99 }] }).success, true)
})

test("price authority: browser price/comparePrice/productId/productName/total/sku cannot alter the charge", () => {
  const parsed = StoreCheckoutSchemaV1.parse({
    customerEmail: "c@example.com",
    totalMxn: 1,
    items: [{ variantId: "var_x", quantity: 2, priceMxn: 1, comparePriceMxn: 2, productId: "evil", productName: "evil", sku: "evil", subtotalMxn: 1 }],
  })
  assert.equal("totalMxn" in parsed, false)
  assert.deepEqual(parsed.items, [{ variantId: "var_x", quantity: 2 }])
  const pricing = buildStoreCheckoutBaseItemsV1({ siteId: "site-1", requestedItems: parsed.items, variants: [STOCK_ROW(10)] })
  assert.ok(pricing.ok)
  if (pricing.ok) {
    assert.equal(pricing.totalMxn, 2000)
    assert.deepEqual(pricing.items[0], { variantId: "var_x", productId: "prod_x", productName: "X", variantName: "X", sku: "SX", quantity: 2, priceMxn: 1000, subtotalMxn: 2000 })
  }
})

test("order/payment boundary: the route returns on any pricing/stock failure BEFORE Order creation and BEFORE the MP preference", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/store/[siteId]/checkout/route.ts"), "utf8")
  const pricingAt = source.indexOf("buildStoreCheckoutBaseItemsV1({ siteId, requestedItems, variants })")
  const guardAt = source.indexOf('if ("error" in pricing)', pricingAt)
  const insufficientAt = source.indexOf('"INSUFFICIENT_STOCK"', guardAt)
  const orderCreateAt = source.indexOf("editorPrisma.order.create(")
  const preferenceAt = source.indexOf("createStoreMpPreference({")
  assert.ok(pricingAt > 0 && guardAt > pricingAt && insufficientAt > guardAt)
  assert.ok(orderCreateAt > guardAt, "Order is created only after the pricing/stock guard")
  assert.ok(preferenceAt > orderCreateAt, "MP preference is created only after the Order")
  assert.equal(source.indexOf("editorPrisma.order.create("), source.lastIndexOf("editorPrisma.order.create("), "exactly one Order creation site")
  assert.ok(source.slice(guardAt, orderCreateAt).includes("const baseItems = pricing.items"), "order items come only from the pricing boundary")
})

test("zz) zero network attempts across the COMMERCE-1 suite", () => {
  assert.equal(networkAttempts, 0)
})
