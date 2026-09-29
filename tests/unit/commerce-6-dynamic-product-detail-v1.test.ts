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

// COMMERCE-6: offline only. Credentials are deleted (never read); fetch is a counting tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-6 test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import {
  buildNovaMarketMockExecutableBuilderInputV1,
  runNovaMarketFullSiteDryRunV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { NOVAMARKET_PRODUCTS_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import { createDeterministicFullSiteCreativeTestingProviderV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import type { FullSiteCreativeBlueprintProviderV1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import { findProhibitedFullSiteRequestValuesV1 } from "../../lib/orvenix-ai/full-site-generation/request-guard"
import { resolveProductDetailTargetV1 } from "../../lib/orvenix-ai/commerce/product-detail-target"
import { bindProvisionedCommerceIntoPlanV1 } from "../../lib/orvenix-ai/commerce/provisioning-binding"
import type { CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { isValidSectionInstancePlan } from "../../lib/orvenix-ai/architect/composition-plan"
import { getBlockCapabilities } from "../../lib/orvenix-ai/capabilities/block-capabilities"
import { blockRegistry, CATEGORY_ORDER } from "../../components/editor/blocks/registry"
import { buildCartItemFromProductCardV1, resolveProductCardDetailHrefV1 } from "../../components/editor/blocks/store/product-card-binding"
import { toPublicProductDetailV1, type PublicProductRowV1 } from "../../lib/commerce/public-product-detail"
import { buildDynamicProductDetailTreeV1, DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1 } from "../../lib/commerce/dynamic-product-detail-tree"
import { rewriteTreeForAssistedViewerV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/viewer-links"
import type { EditorNode, EditorTree } from "../../types/editor"

type Run = AutonomousMultiPageSiteBuilderResult
const REQUEST_FINGERPRINT_4F = "cfb5aee3520b398011d10bca2fd3e9a07cc36688ba732f590726ee261abe0ec8"

const nodesOf = (tree: EditorTree) => Object.values(tree.nodes as Record<string, EditorNode>)
const cardsOf = (tree: EditorTree) => nodesOf(tree).filter((node) => node.type === "store-product-card")

async function executableRun(): Promise<Run> {
  return runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketMockExecutableBuilderInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce") },
  })
}

/** Per-product coverage, read from the generated catalog page (every product appears there). */
function catalogCoverage(run: Run) {
  const catalog = run.plan.pages.find((page) => page.slug === "productos")
  assert.ok(catalog, "catalog page exists")
  const creativePages = new Map(run.plan.pages.filter((page) => page.slug.startsWith("producto-")).map((page) => [page.name, page.slug]))
  const byProduct = new Map<string, string | undefined>()
  for (const card of cardsOf(catalog.tree)) byProduct.set(String(card.props.productName), card.props.detailHref as string | undefined)
  let creative = 0
  let dynamic = 0
  let invalid = 0
  let crossStore = 0
  for (const card of cardsOf(catalog.tree)) {
    const href = card.props.detailHref
    const creativeSlug = creativePages.get(String(card.props.productName))
    if (typeof href !== "string") continue
    if (href.startsWith("page:")) {
      creative += 1
      if (href !== `page:${creativeSlug}`) invalid += 1
    } else if (href.startsWith("product:")) {
      dynamic += 1
      if (creativeSlug) invalid += 1
      if (href !== `product:${String(card.props.productId)}`) crossStore += 1
    } else invalid += 1
  }
  return { products: byProduct.size, withTarget: [...byProduct.values()].filter(Boolean).length, creative, dynamic, invalid, crossStore, creativePages }
}

// --- the one authority ---

const bound = (name: string, productId: string): CommerceProductFactV1 => ({ name, storeBinding: { productId }, variants: [{ label: "U", priceMxn: 100, availability: "in_stock" }] } as CommerceProductFactV1)
const pending = (name: string, sourceIndex: number): CommerceProductFactV1 => ({ name, pendingProvisioning: { sourceIndex, variantIndex: 0 } } as CommerceProductFactV1)

test("resolver: creative detail page wins over the dynamic fallback", () => {
  const creative = new Map([[0, "producto-a"]])
  assert.equal(resolveProductDetailTargetV1({ product: bound("A", "prod_A1"), productIndex: 0, creativeSlugByIndex: creative, currentPage: { slug: "productos" } }), "page:producto-a")
})

test("resolver: dynamic fallback when no creative page (bound -> product:, pending -> product-ref:)", () => {
  const none = new Map<number, string>()
  assert.equal(resolveProductDetailTargetV1({ product: bound("B", "prod_B2"), productIndex: 1, creativeSlugByIndex: none, currentPage: { slug: "productos" } }), "product:prod_B2")
  assert.equal(resolveProductDetailTargetV1({ product: pending("C", 7), productIndex: 2, creativeSlugByIndex: none, currentPage: { slug: "productos" } }), "product-ref:7")
})

test("resolver: never self, never invented, never by name, invalid identity fails closed", () => {
  const creative = new Map([[0, "producto-a"]])
  // own product on its own creative page -> no target (not even the dynamic one)
  assert.equal(resolveProductDetailTargetV1({ product: bound("A", "prod_A1"), productIndex: 0, creativeSlugByIndex: creative, currentPage: { slug: "producto-a", productIndex: 0 } }), undefined)
  // presentation-only product (no store identity) -> nothing invented
  assert.equal(resolveProductDetailTargetV1({ product: { name: "Solo texto" }, productIndex: 3, creativeSlugByIndex: creative, currentPage: { slug: "productos" } }), undefined)
  assert.equal(resolveProductDetailTargetV1({ product: undefined, productIndex: 9, creativeSlugByIndex: creative, currentPage: { slug: "productos" } }), undefined)
  // same NAME as the creative product, different index -> its own dynamic target, never the creative page
  assert.equal(resolveProductDetailTargetV1({ product: bound("A", "prod_A2"), productIndex: 4, creativeSlugByIndex: creative, currentPage: { slug: "productos" } }), "product:prod_A2")
  // hostile / malformed ids
  for (const productId of ["../x", "a b", "", "x".repeat(192), "id?x=1"]) {
    assert.equal(resolveProductDetailTargetV1({ product: bound("D", productId), productIndex: 5, creativeSlugByIndex: new Map(), currentPage: { slug: "productos" } }), undefined, productId)
  }
  assert.equal(resolveProductDetailTargetV1({ product: pending("E", -1), productIndex: 6, creativeSlugByIndex: new Map(), currentPage: { slug: "productos" } }), undefined)
})

test("CompositionPlan accepts only canonical detail targets", () => {
  const plan = (href: string) => ({ id: "p:products:0", role: "products", selection: { mode: "all" }, composition: { productDetailLinks: [{ productIndex: 0, href }] }, provenance: "deterministic" })
  for (const ok of ["page:producto-a", "product:prod_A1", "product-ref:7"]) assert.equal(isValidSectionInstancePlan(plan(ok)), true, ok)
  for (const bad of ["product:", "product:../x", "product:a b", "product-ref:-1", "product-ref:01", "/p/x/producto/y", "https://evil.example", "/dev-assisted-generation-e2e/view/assisted/home"]) {
    assert.equal(isValidSectionInstancePlan(plan(bad)), false, bad)
  }
})

// --- NovaMarket offline coverage ---

test("NovaMarket (bound store): all 24 products get a detail target -- creative first, dynamic for the rest, exact identity", async () => {
  const run = await executableRun()
  const coverage = catalogCoverage(run)
  assert.equal(coverage.products, NOVAMARKET_PRODUCTS_V1.length)
  assert.equal(coverage.withTarget, coverage.products, "PRODUCTS_WITHOUT_DETAIL_TARGET=0")
  assert.equal(coverage.creative, coverage.creativePages.size, "every creative page is used for its own product")
  assert.equal(coverage.creative + coverage.dynamic, coverage.products)
  assert.equal(coverage.invalid, 0)
  assert.equal(coverage.crossStore, 0)
})

test("NovaMarket (bound store): every card on every page has a valid target except its own product page; Add to Cart preserved", async () => {
  const run = await executableRun()
  const creativeByName = new Map(run.plan.pages.filter((page) => page.slug.startsWith("producto-")).map((page) => [page.name, page.slug]))
  let related = 0
  for (const page of run.plan.pages) {
    for (const card of cardsOf(page.tree)) {
      const creative = creativeByName.get(String(card.props.productName))
      const expected = creative === page.slug ? undefined : creative ? `page:${creative}` : `product:${String(card.props.productId)}`
      assert.equal(card.props.detailHref, expected, `${page.slug}: ${String(card.props.productName)}`)
      if (page.slug.startsWith("producto-") && expected) related += 1
      if (card.props.stock !== 0) assert.ok(buildCartItemFromProductCardV1(card.props), "Add to Cart still builds a cart item")
    }
  }
  assert.ok(related > 0, "related-product cards on creative detail pages are clickable")
})

test("NovaMarket (new store preview -> confirm): pending targets bind to the card's own created product", async () => {
  const dry = await runNovaMarketFullSiteDryRunV1({ mode: "mock-editorial" })
  assert.equal(dry.status, "completed")
  if (dry.status !== "completed") return
  const plan = dry.run.plan
  const provisioning = plan.commerce?.provisioning
  assert.ok(provisioning)
  let pendingTargets = 0
  for (const page of plan.pages) {
    for (const card of cardsOf(page.tree)) {
      if (typeof card.props.detailHref === "string" && card.props.detailHref.startsWith("product-ref:")) {
        pendingTargets += 1
        assert.equal(card.props.detailHref, `product-ref:${String(card.props.provisioningRef).split(":")[1]}`, "pending target is the card's own product")
      }
      assert.equal(String(card.props.detailHref ?? "").startsWith("product:"), false, "no runtime id before provisioning")
    }
  }
  assert.ok(pendingTargets > 0)

  const provisioned = provisioning.products.map((product) => ({
    productId: `fake_prod_${product.sourceIndex}`,
    sourceIndex: product.sourceIndex,
    variants: product.variants.map((variant) => ({ variantIndex: variant.variantIndex, variantId: `fake_var_${product.sourceIndex}_${variant.variantIndex}` })),
  }))
  const final = bindProvisionedCommerceIntoPlanV1(plan, provisioned)
  for (const page of final.pages) {
    for (const card of cardsOf(page.tree)) {
      const href = card.props.detailHref
      if (typeof href === "string" && !href.startsWith("page:")) assert.equal(href, `product:${String(card.props.productId)}`, "bound to the same product the card sells")
    }
  }
})

// --- provider isolation ---

test("provider request: 4F fingerprint unchanged, guard clean, and no runtime ids even for a bound store", async () => {
  let captured: unknown = null
  const capture = { async generate(input: unknown) { captured = input; throw new Error("capture_only") } } as FullSiteCreativeBlueprintProviderV1
  const dry = await runNovaMarketFullSiteDryRunV1({ mode: "real", env: { NODE_ENV: "test", ORVENIX_DEV_ASSISTED_E2E: "1" }, authorizeRealProviderCall: true, realProvider: capture })
  assert.equal(dry.status, "completed")
  assert.equal(crypto.createHash("sha256").update(JSON.stringify(captured)).digest("hex"), REQUEST_FINGERPRINT_4F)
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(captured), [])

  let boundRequest: unknown = null
  await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketMockExecutableBuilderInputV1(),
    commerceArchitecture: { provider: { async generate(input: unknown) { boundRequest = input; throw new Error("capture_only") } } as FullSiteCreativeBlueprintProviderV1 },
  })
  assert.ok(boundRequest)
  const serialized = JSON.stringify(boundRequest)
  assert.deepEqual(findProhibitedFullSiteRequestValuesV1(boundRequest), [])
  assert.equal(/nm-mock|product:|product-ref:|storeBinding|productId|variantId/.test(serialized), false)
})

// --- runtime data / isolation ---

const row = (overrides: Partial<PublicProductRowV1> = {}): PublicProductRowV1 => ({
  id: "prod_A1",
  siteId: "site_1",
  name: "Silla ergonómica",
  description: "Respaldo de malla.",
  status: "active",
  media: ["https://cdn.example.invalid/silla.jpg"],
  variants: [
    { id: "var_1", name: "Negro", priceMxn: 199900, comparePriceMxn: 249900, stock: 4 },
    { id: "var_2", name: "Gris", priceMxn: 189900, comparePriceMxn: 100, stock: 0 },
  ],
  ...overrides,
})

test("public product: authoritative variant data copied as-is; no SKU/metadata; compare price only when valid", () => {
  const detail = toPublicProductDetailV1(row(), "site_1")
  assert.deepEqual(detail, {
    productId: "prod_A1",
    name: "Silla ergonómica",
    description: "Respaldo de malla.",
    imageUrl: "https://cdn.example.invalid/silla.jpg",
    variants: [
      { variantId: "var_1", label: "Negro", priceMxn: 199900, comparePriceMxn: 249900, stock: 4 },
      { variantId: "var_2", label: "Gris", priceMxn: 189900, stock: 0 },
    ],
  })
})

test("public product: cross-store, draft, malformed or unsellable rows fail closed", () => {
  assert.equal(toPublicProductDetailV1(row(), "site_OTHER"), null, "product of another store")
  assert.equal(toPublicProductDetailV1(row({ status: "draft" }), "site_1"), null)
  assert.equal(toPublicProductDetailV1(row({ id: "../x" }), "site_1"), null)
  assert.equal(toPublicProductDetailV1(row({ variants: [] }), "site_1"), null)
  assert.equal(toPublicProductDetailV1(row({ variants: [{ id: "v", name: "x", priceMxn: -1, comparePriceMxn: null, stock: 1 }] }), "site_1"), null)
  assert.equal(toPublicProductDetailV1(null, "site_1"), null)
  assert.equal(toPublicProductDetailV1(row({ media: ["javascript:alert(1)", "//evil.example/x.png"] }), "site_1")?.imageUrl, undefined)
})

test("repository query is scoped to (id, siteId, status active) and never selects SKU", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/commerce/public-product-detail-repository.ts"), "utf8")
  assert.match(source, /where:\s*\{\s*id:\s*productId,\s*siteId,\s*status:\s*"active"\s*\}/)
  assert.equal(/\bsku\b/.test(source), false)
  assert.match(source, /isValidDynamicProductId\(productId\)/, "malformed ids never reach the DB")
})

// --- dynamic detail page composition ---

test("dynamic detail tree inherits the site's nav, cart shell, footer and theme; one authoritative detail block", async () => {
  const run = await executableRun()
  const home = run.plan.pages.find((page) => page.isHome)!
  const base = { ...home.tree, theme: { colors: { accent: "#123456" } } } as EditorTree
  const before = JSON.stringify(base)
  const detail = toPublicProductDetailV1(row(), "site_1")!
  const tree = buildDynamicProductDetailTreeV1({ baseTree: base, product: detail, catalogSlug: "productos", accentColor: "#123456" })

  assert.equal(JSON.stringify(base), before, "base tree not mutated")
  const types = nodesOf(tree).map((node) => node.type)
  assert.equal(types.filter((type) => type === "siteNav").length, 1)
  assert.equal(types.filter((type) => type === "store-product-detail").length, 1)
  assert.equal(types.filter((type) => type === "store-cart-drawer").length, 1)
  assert.equal(types.includes("store-product-card"), false, "no generated cards leak into the detail page")
  const baseRoot = base.nodes[base.rootId]
  const root = tree.nodes[tree.rootId]
  assert.equal(root.children.at(-1), baseRoot.children.at(-1), "site footer kept last")
  assert.equal(root.children[0], baseRoot.children[0], "site navigation kept first")
  assert.deepEqual(tree.theme, base.theme)

  const block = tree.nodes[DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1]
  assert.deepEqual(block.props.variants, detail.variants)
  assert.equal(block.props.productId, "prod_A1")
  const back = nodesOf(tree).find((node) => node.type === "ctaButton" && node.props.href === "page:productos")
  assert.ok(back, "back to catalog through the canonical page: contract")
  assert.equal(JSON.stringify(tree).includes("/dev-assisted-generation-e2e"), false)
  assert.equal(tree.seo?.title, "Silla ergonómica")
  // no back link when the site has no catalog page
  const noCatalog = buildDynamicProductDetailTreeV1({ baseTree: base, product: detail })
  assert.equal(nodesOf(noCatalog).some((node) => node.type === "ctaButton" && String(node.props.href).startsWith("page:")), false)
})

// --- routing contexts ---

test("runtime hrefs: published and preview routes; export, pending, unknown site and hostile ids render no link", () => {
  assert.equal(resolveProductCardDetailHrefV1("site_1", "product:prod_A1", "published"), "/p/site_1/producto/prod_A1")
  assert.equal(resolveProductCardDetailHrefV1("site_1", "product:prod_A1", "preview"), "/preview/site_1?product=prod_A1")
  assert.equal(resolveProductCardDetailHrefV1("site_1", "product:prod_A1", "export"), null)
  assert.equal(resolveProductCardDetailHrefV1(null, "product:prod_A1", "published"), null)
  assert.equal(resolveProductCardDetailHrefV1("site_1", "product-ref:3", "published"), null, "not yet provisioned")
  for (const hostile of ["product:../x", "product:a%2Fb", "product:", "product:x y"]) assert.equal(resolveProductCardDetailHrefV1("site_1", hostile, "published"), null, hostile)
  // creative targets unchanged
  assert.equal(resolveProductCardDetailHrefV1("site_1", "page:producto-a", "published"), "/p/site_1/producto-a")
})

test("editor canvas stays safe: ProductCard never renders a live detail link there", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/editor/blocks/store/ProductCard.tsx"), "utf8")
  assert.match(source, /const detailLink = isEditorCanvas \? null : resolveProductCardDetailHrefV1\(/)
})

test("dev viewer isolation: dynamic targets are inert in the artifact viewer; page targets still map", () => {
  const tree = {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: [], version: 1 },
      a: { id: "a", type: "store-product-card", props: { detailHref: "product:prod_A1" }, children: [], version: 1 },
      b: { id: "b", type: "store-product-card", props: { detailHref: "product-ref:3" }, children: [], version: 1 },
      c: { id: "c", type: "store-product-card", props: { detailHref: "page:productos" }, children: [], version: 1 },
    },
  } as EditorTree
  const { tree: viewer } = rewriteTreeForAssistedViewerV1(tree, "assisted", new Set(["home", "productos"]))
  assert.equal(viewer.nodes.a.props.detailHref, "#")
  assert.equal(viewer.nodes.b.props.detailHref, "#")
  assert.equal(viewer.nodes.c.props.detailHref, "/dev-assisted-generation-e2e/view/assisted/productos")
})

test("runtime-only detail block: rendered by the registry, never offered to AI generation or the editor palette", () => {
  assert.ok(blockRegistry["store-product-detail"], "registered for rendering")
  assert.equal(CATEGORY_ORDER.includes(blockRegistry["store-product-detail"].category as string), false, "not in the block palette")
  assert.equal(getBlockCapabilities().some((block) => block.type === "store-product-detail"), false, "not an AI capability")
  assert.ok(getBlockCapabilities().some((block) => block.type === "store-product-card"), "existing store blocks unaffected")
})

test("zz) zero network attempts across the COMMERCE-6 suite", () => {
  assert.equal(networkAttempts, 0)
})
