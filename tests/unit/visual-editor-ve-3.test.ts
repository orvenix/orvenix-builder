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

// Server-render harness (zustand server snapshot must read the live store state).
const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function harnessLoad(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "zustand/vanilla") {
    const real = originalLoad.call(this, request, parent, isMain) as { createStore: (fn: unknown) => { getState: () => unknown; getInitialState: () => unknown } }
    return { ...real, createStore: (fn: unknown) => { const api = real.createStore(fn); api.getInitialState = api.getState; return api } }
  }
  return originalLoad.call(this, request, parent, isMain)
}
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined, clear: () => undefined },
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { useEditorStore } from "../../components/editor/store/useEditorStore"
import { DynamicRenderer } from "../../components/editor/DynamicRenderer"
import {
  PROTECTED_NAV_SLUGS,
  canChangeSectionBackground,
  canHideOnMobile,
  canReorderWithinParent,
  computeBackgroundTreatmentPatch,
  computeCompositionSwap,
  computeSiblingDrop,
  computeSiblingStep,
  findSplitComposition,
  getBackgroundTreatments,
  getStructureCapabilities,
  getTextSizeOptions,
  parseHiddenNavSlugs,
  serializeHiddenNavSlugs,
} from "../../lib/editor/structure-rules"
import { resolveSelectionKeyAction } from "../../lib/editor/selection-model"
import { getNodeEditCapabilities } from "../../lib/editor/context-capabilities"
import { createVe1ReviewTree } from "../../lib/editor/fixtures/ve1-review-tree"
import { detectImageMetadataV1, sanitizeImageMetadataV1 } from "../../lib/upload-metadata"
import { validateImageUploadV1 } from "../../lib/upload-policy"
import { DRAFT_UPLOAD_MESSAGE, canUploadForWebsite, uploadEditorImageV1 } from "../../lib/editor/upload-client"
import { CLIENT_VIEWPORT_WIDTHS } from "../../components/editor/client-shell/IsolatedViewportFrame"
import { contrastRatio } from "../../lib/orvenix-ai/theme/visual-direction"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Fixture + a media/content split, a card with its own surface, and protected nodes. */
function tree(): EditorTree {
  const base = createVe1ReviewTree()
  const add = (id: string, type: string, props: Record<string, unknown>, children: string[] = []) => {
    base.nodes[id] = { id, type, props, children, version: 1 }
    return id
  }
  const split = add("split", "genericWrapper", { tag: "div", className: "grid gap-8 md:grid-cols-2" }, [
    add("split-media", "genericWrapper", { tag: "div", className: "relative overflow-hidden" }, [add("split-image", "image", { src: "/uploads/a.webp", alt: "Obra" })]),
    add("split-copy", "genericWrapper", { tag: "div", className: "space-y-3" }, [add("split-title", "heading", { text: "Proyecto", level: 2, size: "3xl", color: "#0f172a" }), add("split-text", "text", { content: "Detalle", color: "#475569" })]),
  ])
  base.nodes.services.children.push(split)
  add("product-card", "store-product-card", { productId: "p1", variantId: "v1", sku: "S1", priceMxn: 10000, stock: 3 })
  add("bound-title", "heading", { text: "Ligado", level: 3, _bindings: { text: { collectionSlug: "negocio", fieldSlug: "nombre" } } })
  base.nodes["services-grid"].children.push("product-card")
  base.nodes.process.children.push("bound-title")
  return base
}

async function freshStore(initial: EditorTree) {
  useEditorStore.setState({ websiteId: "draft:ve3-test", tree: initial, selectedId: null, selectedIds: [], editingNodeId: null, hoveredId: null, undoStack: [], redoStack: [], rev: 0, lastSavedRev: 0, saveStatus: "saved", currentDevice: "desktop" })
  return useEditorStore
}

/* 1-5, 27 */
test("VE-3 #1-5/27: sibling reorder is same-container only; invalid and no-op drops mutate nothing; one undo restores", async () => {
  const t = tree()
  assert.equal(canReorderWithinParent(t, "hero-title"), true)
  assert.deepEqual(computeSiblingDrop(t, "hero-copy", "hero-title", "before"), ["hero-eyebrow", "hero-copy", "hero-title", "hero-actions"])
  assert.deepEqual(computeSiblingDrop(t, "hero-eyebrow", "hero-actions", "after"), ["hero-title", "hero-copy", "hero-actions", "hero-eyebrow"])
  assert.deepEqual(computeSiblingStep(t, "hero-copy", "before"), ["hero-eyebrow", "hero-copy", "hero-title", "hero-actions"])
  assert.equal(computeSiblingDrop(t, "hero-title", "services-title", "before"), null, "cross-container refused")
  assert.equal(computeSiblingDrop(t, "hero-title", "hero-title", "after"), null, "onto itself refused")
  assert.equal(computeSiblingDrop(t, "hero-title", "hero-copy", "before"), null, "no-op refused")
  assert.equal(canReorderWithinParent(t, "hero"), false, "top-level sections use the section rules")
  assert.equal(canReorderWithinParent(t, "service-card-1"), false, "a container holding commerce cards is locked")
  assert.equal(canReorderWithinParent(t, "product-card"), false)

  const store = await freshStore(t)
  const before = clone(store.getState().tree.nodes["hero-content"].children)
  const next = computeSiblingStep(store.getState().tree, "hero-copy", "before")!
  store.getState().reorderChildren("hero-content", next)
  assert.deepEqual(store.getState().tree.nodes["hero-content"].children, next)
  assert.equal(store.getState().undoStack.length, 1)
  assert.equal(store.getState().saveStatus, "dirty")
  store.getState().undo()
  assert.deepEqual(store.getState().tree.nodes["hero-content"].children, before, "exact structure restored")

  const drag = read("components/editor/selection/useSiblingDrag.ts")
  assert.match(drag, /if \(!commit \|\| !drop\) return/, "cancelled/invalid drags commit nothing")
  assert.match(drag, /const next = computeSiblingDrop\(useEditorStore\.getState\(\)\.tree, id, drop\.targetId, drop\.position\)\n\s+if \(next\) useEditorStore\.getState\(\)\.reorderChildren\(parentId, next\)/)
  assert.doesNotMatch(drag, /updateNodeProps|positionMode|moveFreeNodesByDelta/)
})

/* 6, 7 */
test("VE-3 #6/7: image left/right composition is a bounded child-order swap with one undo", async () => {
  const t = tree()
  assert.deepEqual(findSplitComposition(t, "split-image"), { containerId: "split", mediaFirst: true })
  assert.deepEqual(findSplitComposition(t, "split-title"), { containerId: "split", mediaFirst: true })
  assert.equal(findSplitComposition(t, "hero-title"), null)
  const store = await freshStore(t)
  store.getState().reorderChildren("split", computeCompositionSwap(store.getState().tree, "split")!)
  assert.deepEqual(store.getState().tree.nodes.split.children, ["split-copy", "split-media"])
  assert.equal(store.getState().tree.nodes.split.props.className, "grid gap-8 md:grid-cols-2", "no class or style rewrite")
  assert.deepEqual(findSplitComposition(store.getState().tree, "split"), { containerId: "split", mediaFirst: false })
  store.getState().undo()
  assert.deepEqual(store.getState().tree.nodes.split.children, ["split-media", "split-copy"])
})

/* 8-12 */
test("VE-3 #8-12: responsive intent is one global semantic prop in one tree; viewports unchanged", async () => {
  const t = tree()
  assert.equal(canHideOnMobile(t, "split-image"), true)
  assert.equal(canHideOnMobile(t, "hero-title"), false, "essential text is not hidden per device")
  const store = await freshStore(t)
  store.getState().setDevice("mobile")
  store.getState().updateNodeProps("split-image", { hideOnMobile: true })
  const node = store.getState().tree.nodes["split-image"]
  assert.equal(node.props.hideOnMobile, true)
  assert.equal("responsive" in node.props, false, "stored once, not as a device override")
  assert.equal(store.getState().undoStack.length, 1)
  assert.deepEqual(CLIENT_VIEWPORT_WIDTHS, { desktop: 1280, tablet: 834, mobile: 390 })

  const small: EditorTree = { rootId: "r", nodes: { r: { id: "r", type: "section", props: {}, children: ["s"], version: 1 }, s: { id: "s", type: "section", props: {}, children: ["img"], version: 1 }, img: { id: "img", type: "image", props: { src: "/uploads/a.webp", alt: "a", hideOnMobile: true }, children: [], version: 1 } } }
  useEditorStore.setState({ tree: small, currentDevice: "desktop" })
  const html = renderToStaticMarkup(createElement(DynamicRenderer, { nodeId: "r", mode: "preview" }))
  assert.match(html, /<div class="contents max-md:hidden">/, "CSS-based, box-free, first-paint correct")
  small.nodes.img.props = { src: "/uploads/a.webp", alt: "a" }
  useEditorStore.setState({ tree: clone(small) })
  assert.doesNotMatch(renderToStaticMarkup(createElement(DynamicRenderer, { nodeId: "r", mode: "preview" })), /max-md:hidden/, "absent prop -> unchanged markup")
})

/* 13 */
test("VE-3 #13: visual size options never change the heading level", async () => {
  const t = tree()
  assert.deepEqual(getTextSizeOptions(t.nodes["split-title"]).map((option) => option.label), ["Pequeño", "Normal", "Grande"])
  assert.deepEqual(getTextSizeOptions(t.nodes["split-text"]).map((option) => option.label), ["Compacto", "Normal", "Destacado"])
  assert.deepEqual(getTextSizeOptions(t.nodes["hero-title"]).map((option) => option.value), ["4xl", "5xl", "6xl"], "h1 scale")
  const store = await freshStore(t)
  store.getState().updateNodeProps("split-title", { size: "4xl" })
  assert.equal(store.getState().tree.nodes["split-title"].props.level, 2)
  assert.match(read("components/editor/selection/CustomerContextBar.tsx"), /onChange=\{\(value\) => commit\(\{ size: value \}\)\}/)
})

/* 14, 15 */
test("VE-3 #14/15: theme-derived section backgrounds keep text readable, skip own-surface cards, and undo as one step", async () => {
  const t = tree()
  t.globalTheme = { colors: { primary: "#1C1917", secondary: "#9A3412", background: "#F5F3EF", text: "#1C1917", accent: "#C2410C" } } as EditorTree["globalTheme"]
  const options = getBackgroundTreatments(t)
  assert.ok(options.length >= 3)
  assert.ok(options.every((option) => /^#[0-9a-f]{6}$/i.test(option.color)))
  // Duplicates are folded (here the theme primary IS the dark tone), so pick whichever treatment is dark.
  const dark = options.find((option) => (contrastRatio("#ffffff", option.color) ?? 0) >= 4.5)!
  assert.ok(dark, "a dark treatment exists")
  assert.equal(new Set(options.map((option) => option.color.toLowerCase())).size, options.length, "no duplicate colours")
  const patch = computeBackgroundTreatmentPatch(t, "services", dark.color)!
  assert.equal(patch.services.background, dark.color)
  for (const [id, props] of Object.entries(patch)) {
    if (id === "services") continue
    assert.ok((contrastRatio(String(props.color), dark.color) ?? 0) >= 4.5, `${id} readable`)
  }
  assert.ok(patch["services-title"], "text on the section is recoloured")
  assert.equal(patch["service-title-1"], undefined, "text inside a card with its own bg-white surface is untouched")
  // Generic: a different theme works too.
  const other = clone(t)
  other.globalTheme = { colors: { primary: "#0E7490", secondary: "#0F172A", background: "#F6F8FB", text: "#0F172A", accent: "#0E7490" } } as EditorTree["globalTheme"]
  for (const option of getBackgroundTreatments(other)) {
    for (const [id, props] of Object.entries(computeBackgroundTreatmentPatch(other, "services", option.color) ?? {})) {
      if (id !== "services") assert.ok((contrastRatio(String(props.color), option.color) ?? 0) >= 4.5, `${option.id}:${id}`)
    }
  }
  const heroLike = clone(t)
  heroLike.nodes["hero-content"].props.className = "absolute inset-0"
  assert.equal(canChangeSectionBackground(heroLike, "hero"), false, "photo-backed sections are not recoloured")

  const store = await freshStore(t)
  const beforeTitle = store.getState().tree.nodes["services-title"].props.color
  store.getState().execute("section-background:services", (draft) => {
    for (const [nodeId, props] of Object.entries(patch)) draft.tree.nodes[nodeId].props = { ...draft.tree.nodes[nodeId].props, ...props }
  })
  assert.equal(store.getState().undoStack.length, 1, "one logical edit")
  store.getState().undo()
  assert.equal(store.getState().tree.nodes.services.props.background, "#ffffff")
  assert.equal(store.getState().tree.nodes["services-title"].props.color, beforeTitle)
  assert.match(read("components/editor/selection/CustomerContextBar.tsx"), /execute\(`section-background:\$\{selectedId\}`/)
})

/* ---------------- media hardening (synthetic metadata only) ---------------- */

const bytes = (...parts: Array<number[] | string>) => new Uint8Array(parts.flatMap((part) => (typeof part === "string" ? Array.from(part, (char) => char.charCodeAt(0)) : part)))
const u16be = (value: number) => [value >> 8, value & 0xff]

function syntheticJpeg(): Uint8Array {
  const tiff = bytes("II", [0x2a, 0x00, 0x08, 0, 0, 0], [0x02, 0x00], [0x12, 0x01, 0x03, 0x00, 0x01, 0, 0, 0, 0x06, 0x00, 0, 0], [0x25, 0x88, 0x04, 0x00, 0x01, 0, 0, 0, 0x26, 0, 0, 0], [0, 0, 0, 0], [0x01, 0x00], [0x02, 0x00, 0x05, 0x00, 0x03, 0, 0, 0, 0x99, 0, 0, 0], [0, 0, 0, 0])
  const app1 = bytes("Exif", [0, 0], Array.from(tiff))
  const com = bytes("SYNTHETIC-SECRET")
  return bytes([0xff, 0xd8], [0xff, 0xe0], u16be(16), "JFIF", [0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [0xff, 0xe1], u16be(app1.length + 2), Array.from(app1), [0xff, 0xed], u16be(8), "IPTC12", [0xff, 0xfe], u16be(com.length + 2), Array.from(com), [0xff, 0xda], u16be(8), [1, 1, 0, 0, 0x3f, 0], [0x12, 0x34, 0x56], [0xff, 0xd9])
}

const pngChunk = (type: string, data: number[]) => [...[0, 0, 0, data.length], ...Array.from(type, (char) => char.charCodeAt(0)), ...data, 0, 0, 0, 0]
const syntheticPng = () => bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], pngChunk("IHDR", Array(13).fill(1)), pngChunk("tEXt", Array.from("Comment\0SYNTHETIC-SECRET", (c) => c.charCodeAt(0))), pngChunk("eXIf", [1, 2, 3, 4]), pngChunk("IDAT", [9, 9]), pngChunk("IEND", []))

function riff(chunks: Array<[string, number[]]>): Uint8Array {
  const body = chunks.flatMap(([id, data]) => [...Array.from(id, (c) => c.charCodeAt(0)), data.length & 0xff, (data.length >> 8) & 0xff, 0, 0, ...data, ...(data.length & 1 ? [0] : [])])
  const size = body.length + 4
  return bytes("RIFF", [size & 0xff, (size >> 8) & 0xff, 0, 0], "WEBP", body)
}
const syntheticWebp = () => riff([["VP8X", [0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0]], ["VP8 ", [1, 2, 3, 4]], ["EXIF", Array.from("SYNTHETIC-SECRET", (c) => c.charCodeAt(0))], ["XMP ", [1, 2]]])
const syntheticGif = () => bytes("GIF89a", [1, 0, 1, 0, 0, 0, 0], [0x21, 0xfe, 6], "SECRET", [0], [0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0], [2, 2, 0x4c, 0x01, 0], [0x3b])

/* 16, 17 */
test("VE-3 #16/17: uploads accept only verified raster bytes (no SVG/HTML, no MIME spoofing)", () => {
  assert.equal(validateImageUploadV1({ declaredType: "image/svg+xml", size: 10, bytes: bytes("<svg onload=x>") }).ok, false)
  assert.equal(validateImageUploadV1({ declaredType: "text/html", size: 10, bytes: bytes("<html>") }).ok, false)
  const spoofed = validateImageUploadV1({ declaredType: "image/png", size: 10, bytes: bytes("<script>alert(1)</script>") })
  assert.equal(spoofed.ok, false)
  assert.equal(validateImageUploadV1({ declaredType: "image/jpeg", size: 30, bytes: syntheticJpeg() }).ok, true)
  const route = read("app/api/editor/upload/route.ts")
  assert.ok(route.indexOf("validateImageUploadV1(") < route.indexOf("sanitizeImageMetadataV1(") && route.indexOf("sanitizeImageMetadataV1(") < route.indexOf("writeFile("), "validate -> strip -> write")
  assert.match(route, /await writeFile\(join\(UPLOAD_DIR, safeName\), cleanBytes\)/, "only the stripped bytes are stored")
  assert.match(route, /detectImageMetadataV1\(sanitized\.bytes, validation\.type\.mime\)\.length > 0/, "final check before storing")
  assert.doesNotMatch(route, /serverError\([^)]*exif|console\.log/i, "metadata is never logged")
})

/* 18 */
test("VE-3 #18: stored images carry no EXIF/GPS/XMP/IPTC/comments (synthetic fixtures); JPEG orientation survives", () => {
  const jpeg = syntheticJpeg()
  assert.ok(detectImageMetadataV1(jpeg, "image/jpeg").length >= 3, "fixture really carries metadata")
  const cleanJpeg = sanitizeImageMetadataV1(jpeg, "image/jpeg")
  assert.ok(cleanJpeg.ok)
  if (!cleanJpeg.ok) return
  assert.deepEqual(detectImageMetadataV1(cleanJpeg.bytes, "image/jpeg"), [])
  const text = String.fromCharCode(...cleanJpeg.bytes)
  assert.equal(text.includes("SYNTHETIC-SECRET") || text.includes("IPTC12"), false)
  assert.equal(text.includes("%\u0088") || text.includes("\u0088%"), false, "no GPS IFD pointer")
  assert.ok(text.includes("Exif\0\0MM"), "orientation-only EXIF kept")
  assert.equal(cleanJpeg.bytes[cleanJpeg.bytes.indexOf(0x12, text.indexOf("MM")) + 8], 6, "orientation 6 preserved")
  assert.deepEqual(Array.from(cleanJpeg.bytes.slice(-3)), [0x56, 0xff, 0xd9], "image data untouched")

  for (const [type, input] of [["image/png", syntheticPng()], ["image/webp", syntheticWebp()], ["image/gif", syntheticGif()]] as const) {
    assert.ok(detectImageMetadataV1(input, type).length > 0, `${type} fixture carries metadata`)
    const clean = sanitizeImageMetadataV1(input, type)
    assert.ok(clean.ok, type)
    if (!clean.ok) continue
    assert.deepEqual(detectImageMetadataV1(clean.bytes, type), [], type)
    assert.equal(String.fromCharCode(...clean.bytes).includes("SECRET"), false, type)
  }
  const webp = sanitizeImageMetadataV1(syntheticWebp(), "image/webp")
  assert.ok(webp.ok)
  if (webp.ok) assert.equal(webp.bytes[4] | (webp.bytes[5] << 8), webp.bytes.length - 8, "RIFF size rewritten")
  const avif = bytes([0, 0, 0, 0x18], "ftypavif", Array(12).fill(0), "meta", Array(8).fill(0), "infe", Array(8).fill(0), "Exif")
  assert.equal(sanitizeImageMetadataV1(avif, "image/avif").ok, false, "AVIF with an Exif item is refused, never stored")
  assert.equal(sanitizeImageMetadataV1(bytes([0xff, 0xd8, 0x00]), "image/jpeg").ok, false, "malformed is refused")
})

test("VE-3 #16: editor uploads use the hardened route; drafts never upload; no base64 copies of raw files", async () => {
  assert.equal(canUploadForWebsite("draft:ve1-review-construction"), false)
  assert.equal(canUploadForWebsite("site_123"), true)
  const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "foto.jpg", { type: "image/jpeg" })
  assert.deepEqual(await uploadEditorImageV1(file, "draft:x"), { ok: false, error: DRAFT_UPLOAD_MESSAGE })
  for (const source of ["components/editor/MediaCenter.tsx", "components/editor/primitives/Image.tsx"]) {
    const code = read(source)
    assert.match(code, /uploadEditorImageV1\(/, source)
    assert.doesNotMatch(code, /readAsDataURL/, source)
  }
  assert.match(read("lib/editor/upload-client.ts"), /fetch\("\/api\/editor\/upload", \{ method: "POST", body \}\)/)
})

/* 19-21 */
test("VE-3 #19-21: data-bound and commerce content cannot enter editing from any entry point", async () => {
  const store = await freshStore(tree())
  store.getState().setEditingNode("bound-title")
  assert.equal(store.getState().editingNodeId, null, "double-click / primitive shortcut path blocked at the store")
  store.getState().setEditingNode("product-card")
  assert.equal(store.getState().editingNodeId, null)
  store.getState().setEditingNode("hero-title")
  assert.equal(store.getState().editingNodeId, "hero-title", "ordinary text still edits")
  const t = tree()
  assert.equal(resolveSelectionKeyAction(t, { selectedId: "bound-title", editingNodeId: null }, "Enter"), null)
  assert.equal(getNodeEditCapabilities(t, "bound-title").protected, "data-bound")
  assert.equal(getNodeEditCapabilities(t, "product-card").protected, "commerce")
  assert.deepEqual(getStructureCapabilities(t, "product-card"), { reorder: false, split: null, sizes: [], background: [], hideOnMobile: false })
})

/* 22, 23 */
test("VE-3 #22/23: menu visibility never alters routes and keeps protected pages", () => {
  const pages = ["home", "servicios", "proyectos", "contacto"]
  assert.equal(serializeHiddenNavSlugs(["proyectos", "home", "fantasma", "SERVICIOS"], pages), "servicios,proyectos")
  assert.deepEqual([...parseHiddenNavSlugs("servicios, proyectos")], ["servicios", "proyectos"])
  assert.equal(PROTECTED_NAV_SLUGS.has("home"), true)
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  assert.match(bar, /disabled=\{isProtected\}/)
  assert.doesNotMatch(bar, /setActivePageContext|availablePages\.(push|splice)|showHome/)
})

/* 24-26 */
test("VE-3 #24-26: frame-aware menu Escape, anchors and drag auto-scroll", () => {
  const nav = read("components/editor/primitives/SiteNav.tsx")
  assert.match(nav, /const navDocument = mobileTriggerRef\.current\?\.ownerDocument \?\? document;\n\s+navDocument\.addEventListener\("keydown", handleKeyDown\)/)
  assert.match(nav, /\(mobileTriggerRef\.current\?\.ownerDocument \?\? document\)\.getElementById\(href\.slice\(1\)\)/)
  assert.doesNotMatch(nav, /\bdocument\.(addEventListener|getElementById)\(/)
  const drag = read("components/editor/selection/useSiblingDrag.ts")
  assert.match(drag, /const view = doc\.defaultView \?\? window/)
  assert.match(drag, /view\.scrollBy\(0, -AUTOSCROLL_STEP\)/, "the website frame scrolls, not the editor page")
  assert.match(drag, /doc\.addEventListener\("pointermove", onMove\)/)
})

/* 28-31 */
test("VE-3 #28-31: context bar extensions, clean preview, Construction parity and Studio compatibility", () => {
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  for (const label of ["Mover antes", "Mover después", "Tamaño", "Fondo", "Ocultar en celular", "Imagen a la derecha", "Imagen a la izquierda", "Arrastrar para reordenar"]) assert.ok(bar.includes(label), label)
  assert.match(read("components/editor/client-shell/ClientShell.tsx"), /\{!isPreviewMode && <CustomerSelectionOverlay containerRef=\{canvasRef\} \/>\}/)
  assert.match(read("components/editor/DynamicRenderer.tsx"), /const shownContent = !isRoot && resolvedProps\.hideOnMobile === true/)
  assert.match(read("tests/unit/visual-editor-ve-1-open-parity.test.ts"), /website markup parity/)
  assert.doesNotMatch(read("components/editor/shell/EditorShell.tsx"), /CustomerContextBar|useSiblingDrag/)
})
