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

// PCE-2: offline only. Credentials are deleted (never read); fetch is a counting tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("PCE-2 test: network is forbidden")
}) as typeof fetch

import {
  LEGACY_DARK_COMMERCE_SURFACE_V1,
  productMonogramV1,
  resolveCommerceSurfaceV1,
  sanitizeCommerceSurfaceV1,
  type CommerceThemePaletteV1,
} from "../../lib/orvenix-ai/commerce/commerce-surface"
import { contrastRatio } from "../../lib/orvenix-ai/theme/visual-direction"
import { bindStoreProductRecordsV1, type StoreProductRecordV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { isSafeProductMediaUrlV1, sanitizeProductMediaUrlsV1 } from "../../lib/commerce/product-media"
import { composeSection } from "../../lib/orvenix-ai/composer/section-composer"
import { collapseEmptyImageSlotsV1 } from "../../lib/orvenix-ai/assets/collapse-empty-image-slots"
import { isValidSectionInstancePlan } from "../../lib/orvenix-ai/architect/composition-plan"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import {
  buildNovaMarketBuilderInputBaseV1,
  buildNovaMarketMockExecutableBuilderInputV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import { toPublicProductDetailV1 } from "../../lib/commerce/public-product-detail"
import { buildDynamicProductDetailTreeV1, DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1 } from "../../lib/commerce/dynamic-product-detail-tree"
import type { EditorNode, EditorTree } from "../../types/editor"

const LEGACY_NAVY = ["#0f172a", "#020617", "#111827", "#0a3e57", "#071826"]
const LIGHT: CommerceThemePaletteV1 = { primary: "#16a34a", secondary: "#166534", background: "#eef9ff", text: "#062f44", accent: "#4ade80" }
const DARK: CommerceThemePaletteV1 = { primary: "#a78bfa", secondary: "#7c3aed", background: "#0c0a14", text: "#f5f3ff", accent: "#c4b5fd" }

const ratio = (a: string, b: string) => contrastRatio(a, b) ?? 0
const nodesOf = (tree: EditorTree) => Object.values(tree.nodes as Record<string, EditorNode>)

/** Compiled trees keep no displayName: the footer is the last root section; its links are its page: ctaButtons. */
function footerLinksOf(tree: EditorTree): EditorNode[] {
  const root = tree.nodes[tree.rootId]
  const footerId = [...root.children].reverse().find((id) => tree.nodes[id]?.type === "section")
  const out: EditorNode[] = []
  const stack = footerId ? [footerId] : []
  while (stack.length) {
    const node = tree.nodes[stack.pop()!]
    if (!node) continue
    if (node.type === "ctaButton" && String(node.props.href).startsWith("page:")) out.push(node)
    stack.push(...node.children)
  }
  return out
}

function assertReadable(surface: ReturnType<typeof resolveCommerceSurfaceV1>, label: string) {
  assert.ok(ratio(surface.heading, surface.card) >= 4.5, `${label}: heading readable on card`)
  assert.ok(ratio(surface.body, surface.card) >= 4.5, `${label}: body readable on card`)
  assert.ok(ratio(surface.muted, surface.card) >= 3, `${label}: muted readable on card`)
  assert.ok(ratio(surface.accent, surface.card) >= 3, `${label}: price/action accent visible on card`)
  assert.ok(ratio(surface.onAccent, surface.accent) >= 3, `${label}: action text readable`)
}

// --- theme surface contract ---

test("LIGHT theme: continuous surface is the site's own background; contrast is a dark brand band; all readable, no fixed navy", () => {
  const continuous = resolveCommerceSurfaceV1(LIGHT)
  assert.equal(continuous.tone, "light")
  assert.equal(continuous.background, LIGHT.background)
  const soft = resolveCommerceSurfaceV1(LIGHT, { relation: "soft" })
  const contrast = resolveCommerceSurfaceV1(LIGHT, { relation: "contrast" })
  assert.equal(contrast.tone, "dark")
  assert.equal(contrast.background, LIGHT.text, "dark band = the theme's own dark text color")
  assert.equal(new Set([continuous.background, soft.background, contrast.background]).size, 3)
  for (const [label, surface] of [["continuous", continuous], ["soft", soft], ["contrast", contrast]] as const) {
    assertReadable(surface, `light/${label}`)
    assert.equal(LEGACY_NAVY.includes(surface.background), false, `light/${label}: not a fixed commerce navy`)
  }
})

test("DARK theme: continuous surface stays dark and readable; contrast becomes a light brand tint", () => {
  const continuous = resolveCommerceSurfaceV1(DARK)
  assert.equal(continuous.tone, "dark")
  assert.equal(continuous.background, DARK.background)
  assert.equal(continuous.heading, "#ffffff")
  const contrast = resolveCommerceSurfaceV1(DARK, { relation: "contrast" })
  assert.equal(contrast.tone, "light")
  for (const [label, surface] of [["continuous", continuous], ["contrast", contrast]] as const) assertReadable(surface, `dark/${label}`)
})

test("surfaces are Orvenix-computed hex only; anything else is rejected (no arbitrary AI colors)", () => {
  const surface = resolveCommerceSurfaceV1(LIGHT)
  assert.deepEqual(sanitizeCommerceSurfaceV1(surface), surface)
  for (const value of Object.entries(surface)) if (value[0] !== "tone") assert.match(String(value[1]), /^#[0-9a-f]{6}$/)
  assert.equal(sanitizeCommerceSurfaceV1({ ...surface, card: "red" }), null)
  assert.equal(sanitizeCommerceSurfaceV1({ ...surface, accent: "url(javascript:alert(1))" }), null)
  assert.equal(sanitizeCommerceSurfaceV1({ ...surface, tone: "neon" }), null)
  assert.equal(sanitizeCommerceSurfaceV1({ tone: "light" }), null)
  // invalid theme tokens fall back safely rather than emitting garbage
  const fallback = resolveCommerceSurfaceV1({ primary: "nope", secondary: "", background: "blue", text: "x", accent: "#zzzzzz" })
  assert.ok(sanitizeCommerceSurfaceV1(fallback))
})

// --- product media pipeline ---

const record = (media: unknown): StoreProductRecordV1 => ({
  id: "prod_A1", siteId: "site_1", name: "Silla ergonómica", description: "Malla.", status: "active", metadata: { category: "Oficina" }, media,
  variants: [{ id: "var_1", sku: "SKU-1", name: "Negro", priceMxn: 199900, comparePriceMxn: null, stock: 4 }],
})

test("media rule: only https or site-relative URLs; hostile/unsafe values dropped; order kept, de-duplicated, bounded", () => {
  for (const ok of ["https://cdn.example.invalid/a.jpg", "/uploads/a.png"]) assert.equal(isSafeProductMediaUrlV1(ok), true, ok)
  for (const bad of ["", "http://x.test/a.jpg", "//evil.test/a.jpg", "javascript:alert(1)", "data:image/png;base64,AA", "https://x.test/a b.jpg", 42, null]) {
    assert.equal(isSafeProductMediaUrlV1(bad), false, String(bad))
  }
  assert.deepEqual(sanitizeProductMediaUrlsV1(["/b.png", "javascript:x", "/a.png", "/b.png"]), ["/b.png", "/a.png"])
  assert.equal(sanitizeProductMediaUrlsV1(Array.from({ length: 20 }, (_, i) => `/m${i}.png`)).length, 8)
  assert.deepEqual(sanitizeProductMediaUrlsV1("not-an-array"), [])
})

test("authoritative Product.media reaches bound facts; absent media adds nothing", () => {
  const [withMedia] = bindStoreProductRecordsV1("site_1", [record(["https://cdn.example.invalid/silla.jpg", "javascript:x", "/silla-2.jpg"])])
  assert.deepEqual(withMedia.imageUrls, ["https://cdn.example.invalid/silla.jpg", "/silla-2.jpg"])
  const [without] = bindStoreProductRecordsV1("site_1", [record([])])
  assert.equal("imageUrls" in without, false)
  const source = fs.readFileSync(path.join(process.cwd(), "lib/commerce/prisma-commerce-provisioning-repository.ts"), "utf8")
  assert.match(source, /media: product\.media,/, "store loader carries Product.media")
})

test("PRODUCT WITH MEDIA: the generated card carries the authoritative image; PRODUCT WITHOUT MEDIA: no invented image", async () => {
  const input = buildNovaMarketMockExecutableBuilderInputV1()
  const records = buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1).map((entry, index) => (index === 0 ? { ...entry, media: ["https://cdn.example.invalid/tablet.jpg"] } : entry))
  const run = await runAutonomousMultiPageSiteBuilder({ ...input, commerceStore: { siteId: NOVAMARKET_MOCK_SITE_ID_V1, records } })
  const cards = run.plan.pages.flatMap((page) => nodesOf(page.tree)).filter((node) => node.type === "store-product-card")
  const withImage = cards.filter((card) => card.props.productId === records[0].id)
  assert.ok(withImage.length > 0)
  for (const card of withImage) assert.equal(card.props.imageUrl, "https://cdn.example.invalid/tablet.jpg")
  for (const card of cards.filter((card) => card.props.productId !== records[0].id)) assert.equal(card.props.imageUrl, undefined, "no stock/decorative image ever stands in for a product")
})

test("ProductCard/ProductDetail render contract: image only when safe, else an honest monogram (never stock photography)", () => {
  for (const file of ["ProductCard.tsx", "ProductDetail.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), "components/editor/blocks/store", file), "utf8")
    assert.match(source, /isSafeProductMediaUrlV1/, `${file}: media gated by the shared rule`)
    assert.match(source, /data-store-media="fallback"/, `${file}: explicit non-photographic fallback`)
    assert.match(source, /productMonogramV1\(productName\)/)
    assert.equal(/pexels|unsplash|placeholder\.com/i.test(source), false, `${file}: no stock imagery`)
  }
  const detail = fs.readFileSync(path.join(process.cwd(), "components/editor/blocks/store/ProductDetail.tsx"), "utf8")
  assert.match(detail, /if \(!primaryImage\) \{[\s\S]*max-w-3xl/, "no image -> single-column reflow, no giant empty square")
  assert.equal(productMonogramV1("Silla ergonómica Base"), "SE")
  assert.equal(productMonogramV1("Ñandú"), "Ñ")
  assert.equal(productMonogramV1("  "), "•")
})

// --- empty image safety ---

test("empty image slots collapse: node + emptied wrappers removed, split reflows to one column, real images untouched", () => {
  const tree: EditorTree = {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["sec"], version: 1 },
      sec: { id: "sec", type: "section", props: { background: "#fff" }, children: ["split"], version: 1 },
      split: { id: "split", type: "genericWrapper", props: { className: "grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]" }, children: ["text", "media"], version: 1 },
      text: { id: "text", type: "text", props: { content: "Hola" }, children: [], version: 1 },
      media: { id: "media", type: "genericWrapper", props: { className: "relative min-h-72" }, children: ["img"], version: 1 },
      img: { id: "img", type: "image", props: { src: "", alt: "Imagen principal del negocio" }, children: [], version: 1 },
      keep: { id: "keep", type: "image", props: { src: "https://cdn.example.invalid/x.jpg", alt: "x" }, children: [], version: 1 },
    },
  }
  const before = JSON.stringify(tree)
  const out = collapseEmptyImageSlotsV1(tree)
  assert.equal(JSON.stringify(tree), before, "pure")
  assert.equal(out.nodes.img, undefined)
  assert.equal(out.nodes.media, undefined)
  assert.deepEqual(out.nodes.split.children, ["text"])
  assert.equal(out.nodes.split.props.className, "grid items-center gap-12")
  assert.ok(out.nodes.sec && out.nodes.root && out.nodes.keep, "sections, root and real images survive")
  assert.equal(collapseEmptyImageSlotsV1(out), out, "idempotent / no-op without empty slots")
})

test("Image primitive never emits <img src=\"\"> outside the editor canvas", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/editor/primitives/Image.tsx"), "utf8")
  assert.match(source, /if \(typeof src !== "string" \|\| !src\.trim\(\)\) \{[\s\S]*if \(!isEditorCanvas\) return null;/)
})

// --- full offline commerce site (light theme default) ---

async function executableRun() {
  return runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
}

test("offline store: theme-derived product surfaces + card surface; no fixed navy; no empty image slots", async () => {
  const run = await executableRun()
  const theme = run.plan.theme.colors!
  for (const page of run.plan.pages) {
    const nodes = nodesOf(page.tree)
    assert.equal(nodes.some((node) => node.type === "image" && !String(node.props.src ?? "").trim()), false, `${page.slug}: no empty image slot`)
    for (const card of nodes.filter((node) => node.type === "store-product-card")) {
      const surface = sanitizeCommerceSurfaceV1(card.props.surface)
      assert.ok(surface, `${page.slug}: card carries an Orvenix surface`)
      assert.equal(LEGACY_NAVY.includes(surface.background), false)
    }
    const root = page.tree.nodes[page.tree.rootId]
    for (const id of root.children) {
      const section = page.tree.nodes[id]
      if (section?.type !== "section") continue
      assert.equal(LEGACY_NAVY.includes(String(section.props.background).toLowerCase()), false, `${page.slug}: section ${String(section.props.background)} is not a fixed commerce color`)
    }
  }
  const catalogSection = run.plan.pages.find((page) => page.slug === "productos")!
  const firstCard = nodesOf(catalogSection.tree).find((node) => node.type === "store-product-card")!
  assert.deepEqual(firstCard.props.surface, resolveCommerceSurfaceV1({ primary: theme.primary, secondary: theme.secondary, background: theme.background, text: theme.text, accent: theme.accent }))
})

test("offline store: cart lives in the navigation (no detached band); footer links are real pages only", async () => {
  const run = await executableRun()
  const universe = new Set(run.plan.pages.map((page) => page.slug))
  for (const page of run.plan.pages) {
    const nodes = nodesOf(page.tree)
    const sells = nodes.some((node) => node.type === "store-product-card")
    const nav = nodes.find((node) => node.type === "siteNav")!
    assert.equal(nav.props.showCart === true, sells)
    assert.equal(nodes.some((node) => node.type === "store-cart-button"), false, `${page.slug}: no cart-only band`)
    const footerLinks = footerLinksOf(page.tree)
    assert.ok(footerLinks.length > 0, `${page.slug}: footer exposes store navigation`)
    for (const link of footerLinks) {
      assert.match(String(link.props.href), /^page:[a-z0-9-]+$/)
      assert.ok(universe.has(String(link.props.href).slice(5)), `${page.slug}: footer link ${String(link.props.href)} exists`)
      assert.equal(String(link.props.href).startsWith("page:producto-"), false, "no product-page flooding")
    }
  }
})

test("cart prominence: bounded values produce materially distinct nav treatments", async () => {
  const { navCartTreatment } = await import("../../components/editor/primitives/SiteNav")
  const treatments = new Set([navCartTreatment("subtle"), navCartTreatment(undefined), navCartTreatment("prominent")])
  assert.equal(treatments.size, 3)
  assert.equal(navCartTreatment("none"), "compact", "never hides the only checkout path")
  const plan = (cartProminence: unknown) => ({ id: "home:navigation", role: "navigation", selection: { mode: "all" }, composition: { cartProminence }, provenance: "deterministic" })
  for (const ok of ["none", "subtle", "prominent"]) assert.equal(isValidSectionInstancePlan(plan(ok)), true)
  for (const bad of ["huge", "<b>", 1]) assert.equal(isValidSectionInstancePlan(plan(bad)), false)
})

test("legacy/non-commerce: composer without a theme palette keeps the pre-PCE-2 store surface; non-commerce sites unchanged", async () => {
  const products = bindStoreProductRecordsV1("site_1", [record([])])
  const legacy = composeSection("products", { products })!
  assert.equal(legacy.nodes[legacy.rootId].props.background, LEGACY_DARK_COMMERCE_SURFACE_V1.background)
  assert.equal(Object.values(legacy.nodes).find((node) => node.type === "store-product-card")!.props.surface, undefined)
  const themed = composeSection("products", { products, themePalette: LIGHT })!
  assert.equal(themed.nodes[themed.rootId].props.background, LIGHT.background)
  // closing/footer adopt theme surfaces only for commerce-architecture sites
  const footerPlain = composeSection("footer", { themePalette: LIGHT })!
  assert.equal(footerPlain.nodes[footerPlain.rootId].props.background, "#071826")
  const footerCommerce = composeSection("footer", { themePalette: LIGHT, commerceSurfaces: true })!
  assert.notEqual(footerCommerce.nodes[footerCommerce.rootId].props.background, "#071826")
  const presentation = await runAutonomousMultiPageSiteBuilder(buildNovaMarketBuilderInputBaseV1())
  assert.equal(presentation.plan.pages.flatMap((page) => nodesOf(page.tree)).some((node) => node.props.showCart === true), false, "no store -> no cart")
})

test("dynamic detail inherits the site theme surface (continuous) and drops no footer behind the nav drawer", async () => {
  const run = await executableRun()
  const home = run.plan.pages.find((page) => page.isHome)!
  const base = { ...home.tree, globalTheme: run.plan.theme, theme: run.plan.theme } as EditorTree
  const detail = toPublicProductDetailV1({ id: "prod_A1", siteId: "s", name: "Silla", description: null, status: "active", media: [], variants: [{ id: "v1", name: "U", priceMxn: 100, comparePriceMxn: null, stock: 2 }] }, "s")!
  const tree = buildDynamicProductDetailTreeV1({ baseTree: base, product: detail, catalogSlug: "productos" })
  const block = tree.nodes[DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1]
  const surface = sanitizeCommerceSurfaceV1(block.props.surface)
  assert.ok(surface)
  assert.equal(surface.background, run.plan.theme.colors!.background.toLowerCase())
  assert.deepEqual(footerLinksOf(tree).map((node) => node.props.href), footerLinksOf(base).map((node) => node.props.href), "site footer (with its links) kept")
  assert.ok(footerLinksOf(tree).length > 0)
})

test("zz) zero network attempts across the PCE-2 suite", () => {
  assert.equal(networkAttempts, 0)
})
