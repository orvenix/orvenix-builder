import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"

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

// PCE-4B is fully offline. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("PCE-4B test: network is forbidden")
}) as typeof fetch

import type { EditorNode, EditorTree } from "../../types/editor"
import type { CartItem } from "../../store/useCartStore"

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8")
const GLOBALS_CSS = read("app/globals.css")

function editorNode(id: string, type: string, props: Record<string, unknown> = {}, children: string[] = []): EditorNode {
  return { id, type, props, children, version: 1 }
}

function pageTree(nodes: EditorNode[], rootChildren: string[]): EditorTree {
  const map: Record<string, EditorNode> = {}
  for (const entry of nodes) map[entry.id] = entry
  map.root = editorNode("root", "section", {}, rootChildren)
  return { rootId: "root", nodes: map }
}

const boundCard = (id: string) => editorNode(id, "store-product-card", { productId: "prod_1", variantId: "var_1", productName: "Taza" })
const pendingCard = (id: string) => editorNode(id, "store-product-card", { provisioningRef: "product-ref:0", productName: "Taza" })

async function shell() {
  return import("../../lib/orvenix-ai/commerce/store-shell")
}

async function injectInto(tree: EditorTree) {
  const { injectStoreCartShellNodesV1 } = await shell()
  const nodes = structuredClone(tree.nodes) as Record<string, EditorNode>
  const children = injectStoreCartShellNodesV1(nodes, tree.rootId, [...nodes[tree.rootId].children], "#16a34a")
  nodes[tree.rootId] = { ...nodes[tree.rootId], children }
  return { rootId: tree.rootId, nodes } satisfies EditorTree
}

// ─── 1. Cart shell invariant ───────────────────────────────────────────────────

test("selling page with a nav: nav cart ON + exactly one drawer; idempotent (no duplicate drawer)", async () => {
  const { auditStoreCartShellV1 } = await shell()
  const tree = pageTree([editorNode("nav", "siteNav"), editorNode("grid", "section", {}, ["c1", "c2"]), boundCard("c1"), boundCard("c2")], ["nav", "grid"])
  assert.equal(auditStoreCartShellV1(tree).ok, false)
  const once = await injectInto(tree)
  assert.equal(once.nodes.nav.props.showCart, true)
  assert.deepEqual(auditStoreCartShellV1(once), { actionableTriggers: 3, reachableDrawers: 1, ok: true })
  const twice = await injectInto(once)
  assert.equal(auditStoreCartShellV1(twice).reachableDrawers, 1)
  assert.equal(Object.values(twice.nodes).filter((entry) => entry.type === "store-cart-drawer").length, 1)
})

test("an ORPHANED drawer (in nodes, not rendered) no longer satisfies the invariant", async () => {
  const { auditStoreCartShellV1 } = await shell()
  const tree = pageTree([editorNode("nav", "siteNav"), boundCard("c1"), editorNode("orphan-drawer", "store-cart-drawer")], ["nav", "c1"])
  assert.deepEqual(auditStoreCartShellV1(tree), { actionableTriggers: 1, reachableDrawers: 0, ok: false })
  const fixed = await injectInto(tree)
  assert.deepEqual(auditStoreCartShellV1(fixed), { actionableTriggers: 2, reachableDrawers: 1, ok: true })
})

test("existing cart entries without a drawer (nav showCart, CartButton) get exactly one drawer; nav is not otherwise changed", async () => {
  const { auditStoreCartShellV1 } = await shell()
  const navOnly = pageTree([editorNode("nav", "siteNav", { showCart: true, title: "Tienda" })], ["nav"])
  const fixedNav = await injectInto(navOnly)
  assert.deepEqual(auditStoreCartShellV1(fixedNav), { actionableTriggers: 1, reachableDrawers: 1, ok: true })
  assert.deepEqual(fixedNav.nodes.nav.props, { showCart: true, title: "Tienda" })

  const buttonOnly = pageTree([editorNode("bar", "genericWrapper", {}, ["cart-button"]), editorNode("cart-button", "store-cart-button")], ["bar"])
  const fixedButton = await injectInto(buttonOnly)
  assert.deepEqual(auditStoreCartShellV1(fixedButton), { actionableTriggers: 1, reachableDrawers: 1, ok: true })
})

test("non-commerce and pending-only pages are untouched", async () => {
  const { auditStoreCartShellV1 } = await shell()
  for (const tree of [
    pageTree([editorNode("nav", "siteNav", { title: "Estudio" }), editorNode("hero", "section")], ["nav", "hero"]),
    pageTree([editorNode("nav", "siteNav"), pendingCard("p1"), pendingCard("p2")], ["nav", "p1", "p2"]),
  ]) {
    const after = await injectInto(tree)
    assert.deepEqual(after, tree)
    assert.deepEqual(auditStoreCartShellV1(after), { actionableTriggers: 0, reachableDrawers: 0, ok: true })
  }
})

test("selling page WITHOUT a nav keeps the original shell band (button + one drawer)", async () => {
  const { auditStoreCartShellV1, STORE_CART_SHELL_DISPLAY_NAME_V1 } = await shell()
  const after = await injectInto(pageTree([boundCard("c1")], ["c1"]))
  assert.ok(Object.values(after.nodes).some((entry) => entry.displayName === STORE_CART_SHELL_DISPLAY_NAME_V1))
  assert.deepEqual(auditStoreCartShellV1(after), { actionableTriggers: 2, reachableDrawers: 1, ok: true })
})

test("real generation: every page of a bound NovaMarket build and the dynamic detail page satisfy the invariant", async () => {
  const { auditStoreCartShellV1 } = await shell()
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { buildNovaMarketMockExecutableBuilderInputV1 } = await import("../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness")
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  let sellingPages = 0
  for (const page of run.plan.pages) {
    const audit = auditStoreCartShellV1(page.tree)
    assert.ok(audit.ok, `${page.slug}: ${JSON.stringify(audit)}`)
    if (audit.actionableTriggers > 0) sellingPages += 1
  }
  assert.ok(sellingPages > 0, "the bound build has selling pages")

  const { buildDynamicProductDetailTreeV1 } = await import("../../lib/commerce/dynamic-product-detail-tree")
  const home = run.plan.pages.find((page) => page.slug === "home")!
  const detailTree = buildDynamicProductDetailTreeV1({
    baseTree: home.tree,
    product: { productId: "prod_1", name: "Taza", variants: [{ variantId: "var_1", label: "Única", priceMxn: 10000, stock: 5 }] },
  })
  assert.deepEqual(auditStoreCartShellV1(detailTree).reachableDrawers, 1)
  assert.ok(auditStoreCartShellV1(detailTree).ok)
  assert.equal(networkAttempts, 0)
})

// ─── 2. CartDrawer structure (clipping fix) ────────────────────────────────────

async function renderDrawerWith(items: CartItem[], isOpen = true) {
  const { useCartStore } = await import("../../store/useCartStore")
  const { CartDrawer } = await import("../../components/editor/blocks/store/CartDrawer")
  const Drawer = CartDrawer as unknown as ComponentType<Record<string, unknown>>
  // Zustand's SSR snapshot is the store's initial-state object.
  const initialState = useCartStore.getInitialState() as { isOpen: boolean; items: CartItem[] }
  const saved = { isOpen: initialState.isOpen, items: initialState.items }
  try {
    initialState.isOpen = isOpen
    initialState.items = items
    return renderToStaticMarkup(createElement(Drawer, {}))
  } finally {
    Object.assign(initialState, saved)
  }
}

const LONG_NAME = "Tablet Nova 10 edición extendida con un nombre deliberadamente largo para revisar el ajuste de línea del carrito"

test("CartDrawer: viewport-high column, one min-h-0 scroll region owning items AND a sticky footer", async () => {
  const items: CartItem[] = Array.from({ length: 8 }, (_, index) => ({
    variantId: `var_${index}`, productId: `prod_${index}`, productName: index === 0 ? LONG_NAME : `Producto ${index}`,
    variantName: index === 0 ? "Variante con una descripción también larga: 128 GB · Wi-Fi · grafito" : "Única", priceMxn: 1299900, quantity: index === 0 ? 99 : 1,
  }))
  const html = await renderDrawerWith(items)
  const aside = html.match(/<aside[^>]*>/)![0]
  assert.match(aside, /class="[^"]*\bflex flex-col\b/)
  assert.match(aside, /height:100dvh/)
  assert.doesNotMatch(html, /\btruncate\b/, "names are never cut with an ellipsis")

  const scrollAt = html.indexOf("orvenix-cart-scroll")
  assert.notEqual(scrollAt, -1)
  const scrollClass = html.slice(html.lastIndexOf("class=\"", scrollAt), html.indexOf("\"", scrollAt))
  for (const cls of ["min-h-0", "flex-1", "overflow-y-auto"]) assert.ok(scrollClass.includes(cls), cls)
  // The footer (checkout) lives INSIDE the scroll region and is sticky + opaque.
  const footerAt = html.indexOf("sticky bottom-0")
  assert.ok(footerAt > scrollAt, "footer is inside the scroll region")
  assert.match(html.slice(footerAt, html.indexOf(">", footerAt)), /background:#0f1b2c/)
  assert.ok(html.indexOf("con Mercado Pago") > footerAt, "checkout button is in the sticky footer")

  // Long content stays fully representable (wraps), price/qty stay intact.
  assert.ok(html.includes(LONG_NAME))
  assert.match(html, /break-words \[overflow-wrap:anywhere\]/)
  assert.match(html, /flex flex-wrap items-center justify-between/)
  assert.match(html, /whitespace-nowrap[^>]*>\$1,286,901\.00</)
  assert.ok(html.includes(">99<"), "quantity visible")
  assert.equal((html.match(/aria-label="Quitar /g) ?? []).length, 8, "every item rendered")
})

test("CartDrawer: empty state intact; portal only after hydration and never on the editor canvas", async () => {
  const empty = await renderDrawerWith([])
  assert.match(empty, /Tu carrito está vacío/)
  assert.doesNotMatch(empty, /sticky bottom-0/)
  // SSR renders in place, inside the token-carrying wrapper.
  assert.match(empty, /^<div class="orvenix-cart-portal contents" data-motion="(none|subtle|expressive)">/)

  const source = read("components/editor/blocks/store/CartDrawer.tsx")
  assert.match(source, /useSyncExternalStore\(subscribeNothing, \(\) => true, \(\) => false\)/)
  assert.match(source, /return hydrated && !isEditorCanvas \? createPortal\(drawer, document\.body\) : drawer;/)
  assert.match(source, /isEditorCanvas = Boolean\(pathname\?\.startsWith\("\/editor\/"\) \|\| pathname\?\.startsWith\("\/constructor"\)\)/)
  // Portal wrapper carries the PCE-4A tokens.
  assert.match(GLOBALS_CSS, /\.editor-render-scope,\s*\n\.orvenix-cart-portal \{/)
  assert.match(GLOBALS_CSS, /\.orvenix-cart-portal\[data-motion="none"\]/)
})

// ─── 3. Add-to-Cart feedback (truthful) ────────────────────────────────────────

test("addItemWithResultV1 reports success ONLY when the store really added; repeated adds stay correct", async () => {
  const { useCartStore, CART_MAX_ITEM_QUANTITY_V1 } = await import("../../store/useCartStore")
  const { addItemWithResultV1, subscribeCartAddedV1, addToCartAnnouncementV1 } = await import("../../components/editor/blocks/store/cart-feedback")
  useCartStore.setState({ siteId: null, storageKey: null, items: [], isOpen: false })
  let emitted = 0
  const unsubscribe = subscribeCartAddedV1(() => { emitted += 1 })
  const item: CartItem = { variantId: "var_1", productId: "prod_1", productName: "Taza", priceMxn: 10000, quantity: 1 }

  const first = addItemWithResultV1(useCartStore, item)
  assert.deepEqual(first, { added: true, productName: "Taza", quantity: 1 })
  const second = addItemWithResultV1(useCartStore, item)
  assert.deepEqual(second, { added: true, productName: "Taza", quantity: 2 })
  assert.equal(emitted, 2)
  assert.equal(addToCartAnnouncementV1(second), "Taza añadido al carrito. Cantidad en el carrito: 2.")

  // Store authority: quantity cap -> no success, no emission.
  useCartStore.setState({ items: [{ ...item, quantity: CART_MAX_ITEM_QUANTITY_V1 }] })
  assert.equal(addItemWithResultV1(useCartStore, item).added, false)
  // Invalid item rejected by the store -> no success.
  assert.equal(addItemWithResultV1(useCartStore, { ...item, variantId: "bad id!" }).added, false)
  assert.equal(emitted, 2)
  unsubscribe()
  useCartStore.setState({ items: [], isOpen: false })
})

test("ProductCard/ProductDetail: feedback only via the truthful add; polite live region outside the button; copy unchanged at rest", async () => {
  for (const file of ["components/editor/blocks/store/ProductCard.tsx", "components/editor/blocks/store/ProductDetail.tsx"]) {
    const source = read(file)
    assert.match(source, /feedback\.report\(addItemWithResultV1\(useCartStore, /, file)
    assert.doesNotMatch(source, /\baddItem\(/, `${file} never bypasses the truthful add`)
    assert.match(source, /feedback\.added \? <>Añadido <span aria-hidden="true">✓<\/span><\/> : "Añadir al carrito"/, file)
    assert.match(source, /data-cart-feedback=\{feedback\.added \? "added" : undefined\}/, file)
  }
  const { ADD_TO_CART_FEEDBACK_MS_V1 } = await import("../../components/editor/blocks/store/cart-feedback")
  assert.ok(ADD_TO_CART_FEEDBACK_MS_V1 >= 1000 && ADD_TO_CART_FEEDBACK_MS_V1 <= 3000, "short bounded interval")

  const { ProductCard } = await import("../../components/editor/blocks/store/ProductCard")
  const Card = ProductCard as unknown as ComponentType<Record<string, unknown>>
  const html = renderToStaticMarkup(createElement(Card, { productId: "prod_1", variantId: "var_1", productName: "Taza", priceMxn: 12900, treatment: "compact-catalog" }))
  const button = html.match(/<button[^>]*data-commerce-cta="primary-purchase"[^>]*>[\s\S]*?<\/button>/)![0]
  assert.match(button, /Añadir al carrito/)
  assert.doesNotMatch(button, /role="status"|data-cart-feedback/)
  assert.match(html.slice(html.indexOf(button) + button.length), /^<span class="sr-only" role="status" aria-live="polite"><\/span>/)
})

// ─── 4. Cart count feedback ────────────────────────────────────────────────────

test("count emphasis: only on a real local add, never on hydration/restoration or re-render", async () => {
  const source = read("components/editor/blocks/store/cart-feedback.ts")
  const hook = source.slice(source.indexOf("export function useCartCountPulseV1"))
  assert.match(hook, /useEffect\(\(\) => subscribeCartAddedV1\(\(\) => setPulse\(\(value\) => value \+ 1\)\), \[\]\)/)
  assert.doesNotMatch(hook, /items|count|useCartStore/, "the pulse never derives from cart contents")

  for (const file of ["components/editor/primitives/SiteNav.tsx", "components/editor/blocks/store/CartButton.tsx", "components/editor/blocks/store/CartDrawer.tsx"]) {
    const badge = read(file)
    assert.match(badge, /key=\{countPulse\}/, file)
    assert.match(badge, /countPulse \? " orvenix-cart-count-pulse" : ""/, file)
  }

  // A restored cart (initial state with items) renders the count with NO emphasis.
  const { useCartStore } = await import("../../store/useCartStore")
  const { CartButton } = await import("../../components/editor/blocks/store/CartButton")
  // CartButton reads totalItems() from live state; set both live and SSR snapshot.
  const restoredItems: CartItem[] = [{ variantId: "var_1", productId: "prod_1", productName: "Taza", priceMxn: 100, quantity: 3 }]
  const initialState = useCartStore.getInitialState() as { items: CartItem[] }
  const saved = initialState.items
  try {
    initialState.items = restoredItems
    useCartStore.setState({ items: restoredItems })
    const restored = renderToStaticMarkup(createElement(CartButton as unknown as ComponentType<Record<string, unknown>>, {}))
    assert.match(restored, />3<\/span>/)
    assert.doesNotMatch(restored, /orvenix-cart-count-pulse/)
    assert.match(restored, /data-cart-trigger=""/)
  } finally {
    initialState.items = saved
    useCartStore.setState({ items: [] })
  }
  // The review seeder uses setState (like restoration), never the add path.
  assert.doesNotMatch(read("app/dev-interaction-review/ReviewCartSeeder.tsx"), /addItem|addItemWithResultV1/)
})

test("motion: feedback is token-driven, one-shot, and zeroed under none/reduced motion while semantics remain", () => {
  const rule = (selector: string) => {
    const at = GLOBALS_CSS.indexOf(`\n${selector} {`)
    assert.notEqual(at, -1, selector)
    return GLOBALS_CSS.slice(at, GLOBALS_CSS.indexOf("}", at))
  }
  for (const [selector, keyframes] of [['[data-cart-feedback="added"]', "orv-cart-confirm"], [".orvenix-cart-count-pulse", "orv-cart-count-pulse"]] as const) {
    const body = rule(selector)
    assert.match(body, new RegExp(`animation: ${keyframes} var\\(--orv-feedback-duration`))
    assert.doesNotMatch(body, /\b(both|forwards|infinite)\b/, `${selector} is one-shot and leaves nothing behind`)
  }
  const none = GLOBALS_CSS.slice(GLOBALS_CSS.indexOf('.orvenix-cart-portal[data-motion="none"] {'))
  assert.match(none.slice(0, none.indexOf("}")), /--orv-feedback-duration: 0ms;[\s\S]*--orv-feedback-scale: 1;[\s\S]*--orv-count-pulse-scale: 1;/)
  const reducedAt = GLOBALS_CSS.indexOf("  .orvenix-cart-portal[data-motion] {")
  assert.notEqual(reducedAt, -1)
  assert.match(GLOBALS_CSS.slice(reducedAt, GLOBALS_CSS.indexOf("}", reducedAt)), /--orv-feedback-duration: 0ms;[\s\S]*--orv-feedback-scale: 1;[\s\S]*--orv-count-pulse-scale: 1;/)
  const expressive = GLOBALS_CSS.slice(GLOBALS_CSS.indexOf('.orvenix-cart-portal[data-motion="expressive"] {'))
  const scale = Number(expressive.slice(0, expressive.indexOf("}")).match(/--orv-feedback-scale: ([\d.]+)/)?.[1])
  assert.ok(scale > 1 && scale <= 1.05, "bounded")
})

// ─── 5. Variant interaction states ─────────────────────────────────────────────

test("ProductDetail variants: unmistakable selected state, keyboard focus outline, authoritative unavailability only", async () => {
  const { ProductDetail } = await import("../../components/editor/blocks/store/ProductDetail")
  const Detail = ProductDetail as unknown as ComponentType<Record<string, unknown>>
  const variants = [
    { variantId: "v_black", label: "Negro", priceMxn: 10000, stock: 4 },
    { variantId: "v_sand", label: "Arena", priceMxn: 10000, stock: 0 },
    { variantId: "v_blue", label: "Azul", priceMxn: 11000, stock: -1 },
  ]
  const html = renderToStaticMarkup(createElement(Detail, { productId: "prod_1", productName: "Audífonos", variants }))
  const labels = html.match(/<label[^>]*data-variant-state="[^"]+"[^>]*>[\s\S]*?<\/label>/g) ?? []
  assert.equal(labels.length, 3, "exactly the authoritative variants, nothing invented")
  const [black, sand, blue] = labels
  assert.match(black, /data-variant-state="selected"/)
  assert.match(black, /box-shadow:inset 0 0 0 1px/)
  assert.match(black, /<input[^>]*type="radio"[^>]*checked=""/)
  assert.match(sand, /data-variant-state="unavailable"/)
  assert.match(sand, /line-through/)
  assert.match(sand, /<span class="sr-only"> \(sin stock\)<\/span>/)
  assert.match(blue, /data-variant-state="available"/)
  assert.doesNotMatch(blue, /box-shadow:inset/)
  for (const label of labels) {
    assert.match(label, /has-\[:focus-visible\]:outline-2/)
    assert.match(label, /hover:\[border-color:var\(--orv-variant-accent\)\]/)
    assert.doesNotMatch(label, /focus-within:ring/)
  }
  // Native radios in one group: arrow keys / Space work without custom handlers.
  const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? []
  assert.equal(radios.length, 3)
  const names = new Set(radios.map((radio) => radio.match(/name="([^"]+)"/)?.[1]))
  assert.equal(names.size, 1)
  assert.ok([...names][0], "radios share one real group name")
  assert.match(html, /<span class="sr-only" role="status" aria-live="polite"><\/span>/)
})

// ─── 6. Authority regressions ──────────────────────────────────────────────────

test("Cart Continuity and checkout authority are untouched by PCE-4B", () => {
  const drawer = read("components/editor/blocks/store/CartDrawer.tsx")
  assert.match(drawer, /const resolvedPersistenceSiteId = pathname\?\.startsWith\("\/p\/"\) \? \(siteId \|\| storeSiteId\) : null;/)
  assert.match(drawer, /setCartSite\(resolvedPersistenceSiteId\);/)
  assert.match(drawer, /if \(event\.key === storageKey\) syncCartFromStorage\(\);/)
  assert.match(drawer, /items: items\.map\(\(i\) => \(\{\s*\n\s*variantId: i\.variantId,\s*\n\s*quantity: i\.quantity,\s*\n\s*\}\)\),/)
  assert.doesNotMatch(drawer, /priceMxn: i\.priceMxn/, "client prices never reach checkout")
  // The store module is not modified by PCE-4B feedback (read-only use).
  assert.doesNotMatch(read("components/editor/blocks/store/cart-feedback.ts"), /useCartStore\.setState|persistCart|localStorage/)
})

// ─── 7. Review fixture ─────────────────────────────────────────────────────────

test("review fixture: canonical shell (one drawer), real variant detail, bounded cart presets", async () => {
  const { auditStoreCartShellV1 } = await shell()
  const { buildVocabularyReviewTree, buildReviewCartItems, REVIEW_CART_PRESETS } = await import("../../app/dev-interaction-review/review-fixtures")
  const tree = buildVocabularyReviewTree("subtle")
  const audit = auditStoreCartShellV1(tree)
  assert.ok(audit.ok && audit.reachableDrawers === 1 && audit.actionableTriggers > 1, JSON.stringify(audit))
  const detail = Object.values(tree.nodes).find((entry) => entry.type === "store-product-detail")
  assert.ok(detail && Array.isArray(detail.props.variants) && (detail.props.variants as unknown[]).length > 1, "variant selection is reviewable")

  const { CART_MAX_ITEM_QUANTITY_V1, parsePersistedCartPayloadV1 } = await import("../../store/useCartStore")
  assert.deepEqual([...REVIEW_CART_PRESETS], ["empty", "one", "several", "long"])
  assert.equal(buildReviewCartItems("empty").length, 0)
  assert.equal(buildReviewCartItems("one").length, 1)
  assert.ok(buildReviewCartItems("several").length >= 5)
  const long = buildReviewCartItems("long")
  assert.ok(long[0].productName.length > 80)
  for (const preset of REVIEW_CART_PRESETS) {
    const items = buildReviewCartItems(preset)
    assert.ok(items.every((item) => item.quantity >= 1 && item.quantity <= CART_MAX_ITEM_QUANTITY_V1), preset)
    // Presets are valid under Cart Continuity's own storage validation.
    const parsed = parsePersistedCartPayloadV1(JSON.stringify({ version: 1, siteId: "review", items }), "review")
    assert.equal(parsed?.length ?? 0, items.length, preset)
  }
})
