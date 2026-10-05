import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"
import crypto from "node:crypto"
import type { EditorTree } from "../../types/editor"

/*
 * VE-1 EDITOR OPEN PARITY: the approved site and the same site inside the
 * customer editor must render the same website markup before any mutation.
 */

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

// Server rendering harness: no Next router in node, and zustand's server snapshot must read the live store state.
const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function harnessLoad(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "next/navigation") {
    return { useRouter: () => ({ push() {}, replace() {}, prefetch() {} }), usePathname: () => "/dev-editor-review/ve1", useSearchParams: () => new URLSearchParams() }
  }
  if (request === "zustand/vanilla") {
    const real = originalLoad.call(this, request, parent, isMain) as { createStore: (fn: unknown) => { getState: () => unknown; getInitialState: () => unknown } }
    return {
      ...real,
      createStore: (fn: unknown) => {
        const api = real.createStore(fn)
        api.getInitialState = api.getState
        return api
      },
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined, clear: () => undefined },
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { DndContext } from "@dnd-kit/core"
import { useEditorStore } from "../../components/editor/store/useEditorStore"
import { DynamicRenderer } from "../../components/editor/DynamicRenderer"
import { EditorExperienceContext } from "../../components/editor/experience/ExperienceContext"
import { getExperienceCapabilities } from "../../components/editor/experience/experience-config"
import type { EditorExperienceMode } from "../../components/editor/experience/types"
import { compileCommercialDesignV1 } from "../../lib/orvenix-ai/commercial-designs"
import { getVe1ReviewSitePages, createVe1ReviewTree } from "../../lib/editor/fixtures/ve1-review-tree"
import { computeSectionStep, getAncestorPath } from "../../lib/editor/selection-model"
import { validateTree } from "../../types/validateTree"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/* ------------------------------ helpers ------------------------------ */

function experience(mode: EditorExperienceMode) {
  return { mode, profile: mode === "studio" ? ("pro" as const) : ("simple" as const), isClient: mode === "client", isStudio: mode === "studio", canSwitchMode: false, setMode: () => undefined, capabilities: getExperienceCapabilities(mode) }
}

function render(tree: EditorTree, mode: "preview" | "edit", experienceMode: EditorExperienceMode = "client"): string {
  useEditorStore.setState({ tree, websiteId: "draft:parity", currentDevice: "desktop", selectedId: null, selectedIds: [], hoveredId: null, editingNodeId: null, isPreviewMode: false })
  const renderer = createElement(DynamicRenderer, { nodeId: tree.rootId, mode })
  if (mode === "preview") return renderToStaticMarkup(renderer)
  return renderToStaticMarkup(createElement(EditorExperienceContext.Provider, { value: experience(experienceMode) }, createElement(DndContext, null, renderer)))
}

type HtmlNode = { text: string } | { tag: string; attrs: string; children: HtmlNode[] }
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])

/** Minimal parser for React's well-formed static markup. */
function parseHtml(html: string): HtmlNode[] {
  const root: { tag: string; attrs: string; children: HtmlNode[] } = { tag: "#root", attrs: "", children: [] }
  const stack = [root]
  const pattern = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^\s>"'=/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html))) {
    if (match[1]) stack.pop()
    else if (match[2]) {
      const element = { tag: match[2], attrs: match[3] ?? "", children: [] as HtmlNode[] }
      stack[stack.length - 1].children.push(element)
      if (!VOID.has(match[2]) && !match[4]) stack.push(element)
    } else if (match[5]) stack[stack.length - 1].children.push({ text: match[5] })
  }
  return root.children
}

const EDITOR_ATTR = /\s+data-editor-node-id="[^"]*"/

/** Removes ONLY legitimate customer-editor wrappers: box-free (`display:contents`) or unstyled section boxes. */
function unwrapCustomerEditor(nodes: HtmlNode[], stats: { contents: number; sectionBoxes: number; other: number }): HtmlNode[] {
  return nodes.flatMap((node): HtmlNode[] => {
    if ("text" in node) return [node]
    const children = unwrapCustomerEditor(node.children, stats)
    if (!EDITOR_ATTR.test(node.attrs)) return [{ ...node, children }]
    const rest = node.attrs.replace(EDITOR_ATTR, "").trim()
    if (rest === 'style="display:contents"') { stats.contents += 1; return children }
    if (rest === "") { stats.sectionBoxes += 1; return children }
    stats.other += 1
    return [{ ...node, attrs: ` ${rest}`, children }]
  })
}

function serialize(nodes: HtmlNode[]): string {
  return nodes.map((node) => ("text" in node ? node.text : `<${node.tag}${node.attrs}>${serialize(node.children)}${VOID.has(node.tag) ? "" : `</${node.tag}>`}`)).join("")
}

/** React useId values depend on component depth; they are not website content. */
const canonicalIds = (html: string) => html.replace(/_R_[A-Za-z0-9]+_/g, "_R_")

function parity(tree: EditorTree) {
  const preview = canonicalIds(render(tree, "preview"))
  const stats = { contents: 0, sectionBoxes: 0, other: 0 }
  const edit = canonicalIds(serialize(unwrapCustomerEditor(parseHtml(render(tree, "edit")), stats)))
  return { preview: canonicalIds(serialize(parseHtml(preview))), edit, stats }
}

/** Content/structure fingerprint independent of random node ids. */
function canonicalFingerprint(tree: EditorTree): string {
  const pathOf = new Map<string, string>()
  const walk = (id: string, at: string) => {
    pathOf.set(id, at)
    ;(tree.nodes[id]?.children ?? []).forEach((child, index) => walk(child, `${at}/${index}`))
  }
  walk(tree.rootId, "r")
  const swap = (value: unknown): unknown =>
    typeof value === "string" && pathOf.has(value) ? `@${pathOf.get(value)}`
      : Array.isArray(value) ? value.map(swap)
        : value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort().map(([key, entry]) => [key, swap(entry)]))
          : value
  const nodes = [...pathOf.entries()].map(([id, at]) => ({ at, type: tree.nodes[id].type, props: swap(tree.nodes[id].props), children: tree.nodes[id].children.length }))
  const rest = Object.fromEntries(Object.entries(tree).filter(([key]) => key !== "nodes" && key !== "rootId").sort())
  return crypto.createHash("sha256").update(JSON.stringify({ nodes, rest: swap(rest) })).digest("hex")
}

let reviewPages: Awaited<ReturnType<typeof getVe1ReviewSitePages>> | undefined
const review = async () => (reviewPages ??= await getVe1ReviewSitePages())
const pageTree = async (slug: string) => (await review()).find((page) => page.slug === slug)!.tree

/* ------------------------------- tests -------------------------------- */

test("PARITY A/R/S: the same authoritative Construction tree enters the showcase and the customer editor", async () => {
  const showcase = await compileCommercialDesignV1({ mode: "demo", designId: "construction", version: 1 })
  for (const slug of ["home", "proyectos"]) {
    const approved = showcase.plan.pages.find((page) => page.slug === slug)!.tree
    const editor = await pageTree(slug)
    assert.equal(canonicalFingerprint(editor), canonicalFingerprint(approved), slug)
    assert.equal(Object.keys(editor.nodes).length, Object.keys(approved.nodes).length, slug)
  }
})

test("PARITY B/9: customer edit markup equals preview markup once editor wrappers are removed (Construction home + projects)", async () => {
  for (const slug of ["home", "proyectos", "servicios", "nosotros"]) {
    const tree = await pageTree(slug)
    const result = parity(tree)
    // The only positioned editor wrappers allowed are preview's own free-position wrappers (legacy fill-frame images).
    const freeNodes = Object.values(tree.nodes).filter((node) => node.props.positionMode === "free").length
    assert.equal(result.stats.other, freeNodes, `${slug}: no other editor wrapper may carry layout attributes`)
    assert.ok(result.stats.contents > 10, `${slug}: nested nodes use box-free wrappers`)
    const topLevelSections = tree.nodes[tree.rootId].children.filter((id) => tree.nodes[id].type === "section").length
    assert.equal(result.stats.sectionBoxes, topLevelSections, `${slug}: only top-level sections keep an (unstyled) box`)
    assert.equal(result.edit, result.preview, `${slug}: website markup parity`)
  }
})

test("PARITY B: the immersive hero keeps its photo and gradient layers as direct children of the hero layout", async () => {
  const home = await pageTree("home")
  const html = render(home, "edit")
  const layout = html.indexOf('class="relative w-full overflow-hidden"')
  assert.ok(layout > 0)
  const afterLayout = html.slice(layout, layout + 600)
  assert.match(afterLayout, /^class="relative w-full overflow-hidden"[^>]*><div data-editor-node-id="[^"]+" style="display:contents"><div class="absolute inset-0 h-full w-full bg-slate-900"/)
})

test("PARITY 9: the markup check detects a layout-changing wrapper around every node (Studio wrapper)", async () => {
  const tree = await pageTree("home")
  const preview = canonicalIds(serialize(parseHtml(render(tree, "preview"))))
  const stats = { contents: 0, sectionBoxes: 0, other: 0 }
  const studio = canonicalIds(serialize(unwrapCustomerEditor(parseHtml(render(tree, "edit", "studio")), stats)))
  assert.notEqual(studio, preview, "studio wrappers change layout and must be detected")
})

test("PARITY O: Studio keeps its existing positioned EditableNode wrapper", async () => {
  const html = render(createVe1ReviewTree(), "edit", "studio")
  assert.match(html, /id="node-hero-title"[^>]*class="[^"]*\brelative\b/)
  assert.doesNotMatch(html, /display:contents/)
  const node = read("components/editor/EditableNode.tsx")
  assert.match(node, /: <StudioEditableNode id=\{id\}>\{children\}<\/StudioEditableNode>/)
  assert.match(node, /isFreePosition \? \(isEditing \? "absolute cursor-text editor-free-node"/)
})

test("PARITY P: legacy free-position nodes render exactly like preview in customer mode and are not mutated", () => {
  const tree = createVe1ReviewTree()
  tree.nodes["hero-title"].props = { ...tree.nodes["hero-title"].props, positionMode: "free", x: 40, y: 80, width: 320, zIndex: 3 }
  const before = JSON.stringify(tree)
  const result = parity(tree)
  assert.equal(result.edit, result.preview)
  assert.equal(result.stats.other, 1, "the free node keeps preview's positioned wrapper (with the editor marker)")
  assert.match(render(tree, "edit"), /data-editor-node-id="hero-title" style="position:absolute;left:40px;top:80px;width:320px;z-index:3"/)
  assert.equal(JSON.stringify(tree), before)
  assert.equal(getExperienceCapabilities("client").allowFreePosition, false)
})

test("PARITY C/D/E: nested click selects the node, hover is innermost, section controls live in the shared overlay", () => {
  const customer = read("components/editor/selection/CustomerEditableNode.tsx")
  const onClick = customer.slice(customer.indexOf("onClick: (event: MouseEvent) => {"), customer.indexOf("onDoubleClick"))
  assert.ok(onClick.indexOf("event.stopPropagation()") < onClick.indexOf("select(id)"))
  const onMouseOver = customer.slice(customer.indexOf("onMouseOver: (event: MouseEvent) => {"))
  assert.match(onMouseOver, /event\.stopPropagation\(\)\s+if \(useEditorStore\.getState\(\)\.hoveredId !== id\) hover\(id\)/)
  assert.match(read("components/editor/client-shell/ClientShell.tsx"), /onMouseLeave=\{\(\) => useEditorStore\.getState\(\)\.hover\(null\)\}/)
  const overlay = read("components/editor/selection/CustomerSelectionOverlay.tsx")
  // VE-2: section controls render in the context bar, inside the shared overlay.
  const bar = read("components/editor/selection/CustomerContextBar.tsx")
  for (const label of ["Subir sección", "Bajar sección", "Duplicar sección", "Eliminar sección", "Arrastrar sección"]) assert.ok(bar.includes(label), label)
  assert.match(overlay, /canvas\?\.sectionDragHandles\.get\(selectedId\)/)
  assert.match(overlay, /<CustomerContextBar key=\{selectedId\} selectedId=\{selectedId\} dragHandle=\{dragHandle\}[^>]*\/>/)
  assert.match(overlay, /pointer-events-none absolute inset-0/)
  assert.doesNotMatch(overlay, /setInterval|onMouseMove|querySelectorAll/)
})

test("PARITY F/G/H: breadcrumb selection, section reorder and undo still work on the authoritative tree", async () => {
  const tree = clone(await pageTree("home"))
  useEditorStore.setState({ tree, selectedId: null, selectedIds: [], undoStack: [], redoStack: [], rev: 0, saveStatus: "saved" })
  const deep = Object.keys(tree.nodes).find((id) => getAncestorPath(tree, id).length >= 5)!
  useEditorStore.getState().select(deep)
  const section = getAncestorPath(tree, deep)[1]
  useEditorStore.getState().select(section)
  assert.equal(useEditorStore.getState().selectedId, section)
  const order = [...tree.nodes[tree.rootId].children]
  const movable = order.filter((id) => tree.nodes[id].type === "section")
  const next = computeSectionStep(useEditorStore.getState().tree, movable[1], "up")!
  useEditorStore.getState().reorderChildren(tree.rootId, next)
  assert.deepEqual(useEditorStore.getState().tree.nodes[tree.rootId].children, next)
  assert.equal(useEditorStore.getState().saveStatus, "dirty")
  useEditorStore.getState().undo()
  assert.deepEqual(useEditorStore.getState().tree.nodes[tree.rootId].children, order)
})

test("PARITY I/J/K/L: opening, selecting, hovering and changing device never change the site", async () => {
  const approved = await pageTree("home")
  const fingerprint = canonicalFingerprint(approved)
  useEditorStore.getState().initialize("draft:parity-open", clone(approved), undefined, { activePageSlug: "home", activePageName: "Inicio" })
  const opened = useEditorStore.getState().tree
  assert.equal(canonicalFingerprint(opened), fingerprint, "opening the editor keeps the authoritative tree")
  assert.equal(canonicalFingerprint(validateTree(clone(approved))), fingerprint)
  const any = Object.keys(opened.nodes).find((id) => id !== opened.rootId)!
  useEditorStore.getState().select(any)
  useEditorStore.getState().hover(any)
  for (const device of ["tablet", "mobile", "desktop"] as const) useEditorStore.getState().setDevice(device)
  useEditorStore.getState().select(null)
  assert.equal(useEditorStore.getState().tree, opened, "same tree object")
  assert.equal(canonicalFingerprint(useEditorStore.getState().tree), fingerprint)
  assert.equal(useEditorStore.getState().undoStack.length, 0)
})

test("PARITY M/N: customer preview renders through preview mode with no editor chrome", async () => {
  assert.match(read("components/editor/client-app/ClientPageRenderer.tsx"), /mode=\{isPreviewMode \? "preview" : "edit"\}/)
  assert.match(read("components/editor/client-shell/ClientShell.tsx"), /\{!isPreviewMode && <CustomerSelectionOverlay containerRef=\{canvasRef\} \/>\}/)
  const html = render(await pageTree("home"), "preview")
  assert.doesNotMatch(html, /data-editor-node-id|display:contents|editor-glow-ring|editor-hover-ring|role="toolbar"/)
})

test("PARITY Q: editor light-theme CSS cannot recolour the rendered site; the canvas re-establishes body inheritance", () => {
  const css = read("app/globals.css")
  for (const selector of [".text-white", ".bg-white\\/\\[0\\.03\\]", ".border-white\\/\\[0\\.05\\]", ".border-white\\/\\[0\\.08\\]"]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    assert.doesNotMatch(css, new RegExp(`body\\.light-mode \\.editor-shell-page ${escaped}(?!:not\\(\\.editor-render-scope \\*\\))[ ,{]`), selector)
    assert.match(css, new RegExp(`body\\.light-mode \\.editor-shell-page ${escaped}:not\\(\\.editor-render-scope \\*\\)`), selector)
  }
  const canvasRule = css.slice(css.indexOf(".editor-site-canvas {"), css.indexOf("}", css.indexOf(".editor-site-canvas {")))
  const bodyRule = css.slice(css.indexOf("\nbody {"), css.indexOf("}", css.indexOf("\nbody {")))
  for (const declaration of ["background: var(--background)", "color: var(--foreground)", "font-family: var(--font-display)", "font-weight: 500", "line-height: 1.6", "letter-spacing: 0"]) {
    assert.ok(bodyRule.includes(declaration), `body: ${declaration}`)
    assert.ok(canvasRule.includes(declaration), `canvas: ${declaration}`)
  }
  assert.match(read("components/editor/client-shell/ClientShell.tsx"), /className="editor-site-canvas"/)
})

/* CV1-1b: the same renderer parity holds for demo-shape customer sites, empty states included. */
test("PARITY CV1-1b: a minimal-facts @2 customer site renders identical markup in the customer editor and in preview", async () => {
  for (const designId of ["servicios-locales", "construction"]) {
    const compiled = await compileCommercialDesignV1({ mode: "customer", designId, version: 2, facts: { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } } })
    for (const page of compiled.plan.pages) {
      const tree = validateTree(clone(page.tree))
      const result = parity(tree)
      assert.equal(result.edit, result.preview, `${designId}/${page.slug}: website markup parity`)
    }
  }
})
