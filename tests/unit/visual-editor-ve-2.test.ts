import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"
import type { EditorTree } from "../../types/editor"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  getNodeEditCapabilities,
  getProtectedReason,
  isCommerceAuthoritativeNode,
  isSafeEditorImageSrcV1,
  parseNavLabelOverrides,
  sanitizeCustomerHrefV1,
  serializeNavLabelOverrides,
} from "../../lib/editor/context-capabilities"
import { computeSectionStep, isInlineEditable, resolveSelectionKeyAction } from "../../lib/editor/selection-model"
import { createVe1ReviewTree } from "../../lib/editor/fixtures/ve1-review-tree"
import { CLIENT_VIEWPORT_WIDTHS } from "../../components/editor/client-shell/IsolatedViewportFrame"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const PAGES = ["home", "servicios", "contacto"]

function installLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value) }, removeItem: (key: string) => { store.delete(key) }, clear: () => store.clear() },
  })
}

async function storeWith(tree: EditorTree) {
  installLocalStorage()
  const compiled = path.join(process.cwd(), ".tmp/unit/components/editor/store/useEditorStore.js")
  delete require.cache[compiled]
  const { useEditorStore } = await import("../../components/editor/store/useEditorStore")
  useEditorStore.setState({ websiteId: "draft:ve2-test", tree, selectedId: null, selectedIds: [], editingNodeId: null, hoveredId: null, undoStack: [], redoStack: [], rev: 0, lastSavedRev: 0, saveStatus: "saved", currentDevice: "desktop", assetPicker: { isOpen: false, target: null } })
  return useEditorStore
}

/** Fixture + a product card and an image, to exercise every capability family. */
function richTree(): EditorTree {
  const tree = createVe1ReviewTree()
  tree.nodes["hero-image"] = { id: "hero-image", type: "image", props: { src: "/uploads/hero.webp", alt: "Obra", objectFit: "cover" }, children: [], version: 1 }
  tree.nodes["product-card"] = { id: "product-card", type: "store-product-card", props: { productId: "prod_1", variantId: "var_1", productName: "Taladro", priceMxn: 129900, stock: 4, sku: "TAL-01" }, children: [], version: 1 }
  tree.nodes["price-text"] = { id: "price-text", type: "text", props: { content: "$1,299", priceMxn: 129900, productId: "prod_1" }, children: [], version: 1 }
  tree.nodes["bound-text"] = { id: "bound-text", type: "text", props: { content: "Nombre", _bindings: { content: { collectionSlug: "negocio", fieldSlug: "nombre" } } }, children: [], version: 1 }
  tree.nodes["hero-content"].children.push("hero-image", "product-card", "price-text", "bound-text")
  return tree
}

/* 1 */
test("VE-2 #1: context actions derive from the selected node's capabilities", () => {
  const tree = richTree()
  assert.deepEqual(getNodeEditCapabilities(tree, "hero-title"), { label: "Título", text: { key: "text" }, align: true })
  assert.deepEqual(getNodeEditCapabilities(tree, "hero-copy"), { label: "Texto", text: { key: "content" }, align: true })
  assert.deepEqual(getNodeEditCapabilities(tree, "hero-cta"), { label: "Botón", text: { key: "label" }, link: { key: "href" }, buttonVariant: true })
  assert.deepEqual(getNodeEditCapabilities(tree, "hero-image"), { label: "Imagen", image: { srcKey: "src", altKey: "alt" }, imageFit: true })
  assert.deepEqual(getNodeEditCapabilities(tree, "nav"), { label: "Menú", navigation: true })
  assert.deepEqual(getNodeEditCapabilities(tree, "services"), { label: "Servicios", section: { movable: true, removable: true } })
  assert.deepEqual(getNodeEditCapabilities(tree, "hero-content"), { label: "Contenedor" }, "containers expose no unrelated controls")
  assert.deepEqual(getNodeEditCapabilities(tree, "root"), { label: "Página" })
  const locked = clone(tree)
  locked.nodes["hero-title"].locked = true
  assert.deepEqual(getNodeEditCapabilities(locked, "hero-title"), { label: "Título" })
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /const capabilities = getNodeEditCapabilities\(tree, selectedId\)/)
  assert.doesNotMatch(bar, /node\.type ===|"heading"|"ctaButton"|genericWrapper/, "the bar renders capabilities, not raw block types")
})

/* 2, 3, 4, 10, 11, 12 */
test("VE-2 #2-4/10-12: heading, text and button label edits are one history entry each, mark dirty, undo, and never change structure", async () => {
  const tree = richTree()
  const store = await storeWith(tree)
  const childrenBefore = JSON.stringify(Object.fromEntries(Object.entries(tree.nodes).map(([id, node]) => [id, node.children])))
  store.getState().updateNodeProps("hero-title", { text: "Constructora Torres" })
  store.getState().updateNodeProps("hero-copy", { content: "Obra residencial" })
  store.getState().updateNodeProps("hero-cta", { label: "Cotizar" })
  const state = store.getState()
  assert.equal(state.tree.nodes["hero-title"].props.text, "Constructora Torres")
  assert.equal(state.tree.nodes["hero-copy"].props.content, "Obra residencial")
  assert.equal(state.tree.nodes["hero-cta"].props.label, "Cotizar")
  assert.equal(state.undoStack.length, 3)
  assert.equal(state.saveStatus, "dirty")
  assert.equal(JSON.stringify(Object.fromEntries(Object.entries(state.tree.nodes).map(([id, node]) => [id, node.children]))), childrenBefore, "no structural mutation")
  store.getState().undo()
  store.getState().undo()
  store.getState().undo()
  assert.equal(store.getState().tree.nodes["hero-title"].props.text, "Haz clic en este título para seleccionarlo")
})

test("VE-2 #2-4: inline editing commits once on Enter/blur, Escape cancels, and an unchanged edit records nothing", () => {
  for (const [file, key] of [["components/editor/primitives/Heading.tsx", "text"], ["components/editor/primitives/Text.tsx", "content"], ["components/editor/primitives/CtaButton.tsx", "label"]] as const) {
    const source = read(file)
    assert.match(source, new RegExp(`textContent = ${key} \\?\\? ""`), `${file}: Escape restores the saved value`)
    assert.match(source, new RegExp(`if \\(next !== \\(${key} \\?\\? ""\\)\\) updateNodeProps\\(id, \\{ ${key}: next \\}\\)`), `${file}: commit only real changes`)
  }
  const tree = createVe1ReviewTree()
  assert.deepEqual(resolveSelectionKeyAction(tree, { selectedId: "hero-title", editingNodeId: null }, "Enter"), { type: "edit", id: "hero-title" })
  assert.equal(resolveSelectionKeyAction(tree, { selectedId: "hero-title", editingNodeId: "hero-title" }, "ArrowDown"), null, "no structural shortcuts while typing")
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /filter\(\(\[key, value\]\) => node\?\.props\[key\] !== value\)/, "bar commits only changed values")
})

/* 5 */
test("VE-2 #5: button destinations accept site pages, anchors, https, mailto and tel", () => {
  assert.equal(sanitizeCustomerHrefV1("page:contacto", PAGES), "page:contacto")
  assert.equal(sanitizeCustomerHrefV1("page:no-existe", PAGES), null, "only real pages")
  assert.equal(sanitizeCustomerHrefV1("#contacto", PAGES), "#contacto")
  assert.equal(sanitizeCustomerHrefV1("https://wa.me/525512345678?text=Hola", PAGES), "https://wa.me/525512345678?text=Hola")
  assert.equal(sanitizeCustomerHrefV1("mailto:hola@obras.example", PAGES), "mailto:hola@obras.example")
  assert.equal(sanitizeCustomerHrefV1("tel:+52 55 1234 5678", PAGES), "tel:+52 55 1234 5678")
})

/* 6 */
test("VE-2 #6: unsafe destination protocols and tricks are rejected", () => {
  for (const unsafe of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\tscript:alert(1)", " javascript:alert(1)", "data:text/html,<script>x</script>", "vbscript:msgbox", "//evil.example", "/\\evil.example", "ftp://files.example", "file:///etc/passwd", "https://", "mailto:nobody", "tel:abc", "", "contacto"]) {
    assert.equal(sanitizeCustomerHrefV1(unsafe, PAGES), null, JSON.stringify(unsafe))
  }
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /const safe = validate\(value\)\n\s+if \(!safe\) return setError\(INVALID_DESTINATION\)/)
})

/* 7 */
test("VE-2 #7: image replacement uses the existing picker and only writes safe image sources", async () => {
  for (const ok of ["/uploads/obra.webp", "/commercial-demo/construction/construction-demo-hero-lg.webp", "https://cdn.example.com/a.jpg", "data:image/png;base64,iVBORw0KGgo="]) assert.equal(isSafeEditorImageSrcV1(ok), true, ok)
  for (const bad of ["javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4=", "data:text/html;base64,PGI+", "//evil.example/x.png", "http://insecure.example/x.png", "/\\evil", " /uploads/x.webp ", "/uploads/a b.webp"]) {
    assert.equal(isSafeEditorImageSrcV1(bad), false, bad)
  }
  const store = await storeWith(richTree())
  store.getState().openAssetPicker({ nodeId: "hero-image", propKey: "src" })
  store.getState().selectAsset("javascript:alert(1)")
  assert.equal(store.getState().tree.nodes["hero-image"].props.src, "/uploads/hero.webp", "unsafe source never written")
  assert.equal(store.getState().undoStack.length, 0)
  store.getState().openAssetPicker({ nodeId: "hero-image", propKey: "src" })
  store.getState().selectAsset("/uploads/nueva.webp")
  assert.equal(store.getState().tree.nodes["hero-image"].props.src, "/uploads/nueva.webp")
  assert.equal(store.getState().undoStack.length, 1)
  store.getState().undo()
  assert.equal(store.getState().tree.nodes["hero-image"].props.src, "/uploads/hero.webp")
  assert.match(read("components/editor/selection/CustomerContextBar.tsx"), /openAssetPicker\(\{ nodeId: selectedId, propKey: capabilities\.image!\.srcKey \}\)/)
})

/* 8, 9 */
test("VE-2 #8/9: section actions reorder, duplicate and delete with confirmation; the site menu is protected", async () => {
  const store = await storeWith(createVe1ReviewTree())
  const next = computeSectionStep(store.getState().tree, "process", "up")!
  store.getState().reorderChildren("root", next)
  assert.deepEqual(store.getState().tree.nodes.root.children, next)
  const before = store.getState().tree.nodes.root.children.length
  store.getState().duplicateNode("services")
  assert.equal(store.getState().tree.nodes.root.children.length, before + 1)
  store.getState().undo()
  store.getState().undo()
  assert.deepEqual(store.getState().tree.nodes.root.children, ["nav", "hero", "services", "process", "cta", "footer"])
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /if \(window\.confirm\("¿Eliminar esta sección de la página\?"\)\) removeNode\(selectedId\)/)
  assert.equal(getNodeEditCapabilities(createVe1ReviewTree(), "nav").section, undefined, "the menu cannot be moved or deleted from the bar")
})

/* 13, 14, 15 */
test("VE-2 #13-15: the context bar lives in the customer overlay inside the isolated viewport and disappears in preview", () => {
  const overlay = read("components/editor/selection/CustomerSelectionOverlay.tsx")
  assert.match(overlay, /<CustomerContextBar key=\{selectedId\} selectedId=\{selectedId\} dragHandle=\{dragHandle\} \/>/)
  const shell = read("components/editor/client-shell/ClientShell.tsx")
  const inside = shell.slice(shell.indexOf("<IsolatedViewportFrame"), shell.indexOf("</IsolatedViewportFrame>"))
  assert.match(inside, /\{!isPreviewMode && <CustomerSelectionOverlay containerRef=\{canvasRef\} \/>\}/)
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.doesNotMatch(bar, /\bdocument\.|getComputedStyle|position: ?"fixed"|className="fixed/, "no editor-window coordinates or globals")
  assert.match(bar, /role="dialog"/, "panels are dialogs: canvas shortcuts stay quiet while typing in them")
  assert.match(bar, /if \(event\.key === "Escape"\) \{\n\s+event\.preventDefault\(\)\n\s+event\.stopPropagation\(\)\n\s+setPanel\(null\)/)
  assert.deepEqual(CLIENT_VIEWPORT_WIDTHS, { desktop: 1280, tablet: 834, mobile: 390 })
})

/* 16, 17, 18 */
test("VE-2 #16-18: commerce price, stock and SKU can never be edited through the visual editor", () => {
  const tree = richTree()
  for (const id of ["product-card", "price-text"]) {
    const capabilities = getNodeEditCapabilities(tree, id)
    assert.equal(capabilities.protected, "commerce", id)
    assert.equal(capabilities.text, undefined, id)
    assert.equal(capabilities.link, undefined, id)
    assert.equal(capabilities.image, undefined, id)
    assert.equal(isCommerceAuthoritativeNode(tree.nodes[id]), true, id)
  }
  for (const key of ["priceMxn", "stock", "sku", "productId", "variantId"]) {
    assert.equal(isCommerceAuthoritativeNode({ id: "x", type: "text", props: { content: "1", [key]: 1 }, children: [], version: 1 }), true, key)
  }
  assert.equal(isInlineEditable(tree.nodes["product-card"]), false)
  assert.equal(resolveSelectionKeyAction(tree, { selectedId: "product-card", editingNodeId: null }, "Enter"), null)
  assert.equal(getProtectedReason(tree.nodes["bound-text"]), "data-bound")
  assert.equal(isInlineEditable(tree.nodes["bound-text"]), false, "data-bound text is not hand-edited")
  assert.match(read("components/editor/experience/client/ClientContentPanel.tsx"), /if \(getProtectedReason\(node\)\) return/, "sidebar never lists protected content")
  assert.match(read("components/editor/selection/CustomerEditableNode.tsx"), /if \(isInlineEditable\(useEditorStore\.getState\(\)\.tree\.nodes\[id\]\)\) setEditingNode\(id\)/)
  for (const file of ["components/editor/blocks/store/ProductCard.tsx"]) assert.doesNotMatch(read(file), /contentEditable/, file)
})

test("VE-2 navigation: only labels, brand and the menu button are editable; page routes stay authoritative", () => {
  assert.deepEqual(parseNavLabelOverrides("home=Inicio\nservicios: Qué hacemos\n\n=bad"), { home: "Inicio", servicios: "Qué hacemos" })
  assert.equal(serializeNavLabelOverrides({ home: "Inicio", servicios: "Obras\n=x", fantasma: "Hack" }, PAGES), "home=Inicio\nservicios=Obras x")
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /labelOverrides: serializeNavLabelOverrides\(values\.labels, pageSlugs\)/)
  assert.match(bar, /const safeHref = values\.ctaHref\.trim\(\) \? validate\(values\.ctaHref\) : ctaHref/)
  assert.doesNotMatch(bar, /hiddenSlugs|showHome|availablePages\.push/, "no route identity edits")
  const navCommit = bar.slice(bar.indexOf("onSubmit={(values) => {"), bar.indexOf("setPanel(null)", bar.indexOf("onSubmit={(values) => {")))
  assert.deepEqual([...navCommit.matchAll(/^\s+(\w+):/gm)].map((match) => match[1]), ["title", "labelOverrides", "ctaLabel", "ctaHref"], "the menu form writes only these props")
})

/* 19, 20 */
test("VE-2 #19/20: Studio is untouched; Construction parity is guarded by the VE-1 parity suite", () => {
  assert.doesNotMatch(read("components/editor/shell/EditorShell.tsx"), /CustomerContextBar/)
  assert.match(read("components/editor/EditableNode.tsx"), /: <StudioEditableNode id=\{id\}>\{children\}<\/StudioEditableNode>/)
  assert.match(read("tests/unit/visual-editor-ve-1-open-parity.test.ts"), /assert\.equal\(result\.edit, result\.preview, `\$\{slug\}: website markup parity`\)/)
  assert.match(read("components/editor/store/useEditorStore.ts"), /isSafeEditorImageSrcV1\(url\)/)
})
