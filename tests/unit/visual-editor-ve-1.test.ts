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
  computeSectionReorder,
  computeSectionStep,
  getAncestorPath,
  getContainingSectionId,
  getNodeLabel,
  getParentIndex,
  isInteractiveKeyTarget,
  isMovableSection,
  resolveSelectionKeyAction,
} from "../../lib/editor/selection-model"
import { createVe1ReviewTree } from "../../lib/editor/fixtures/ve1-review-tree"
import { getExperienceCapabilities } from "../../components/editor/experience/experience-config"
import { validateTree } from "../../types/validateTree"
import { getDefaultStarterEditorTree, getEditorTreeForWeb } from "../../lib/editorWebs"
import { compileCommercialDesignV1 } from "../../lib/orvenix-ai/commercial-designs"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { buildNovaMarketMockExecutableBuilderInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { createDeterministicFullSiteCreativeTestingProviderV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const FREE_KEYS = ["positionMode", "x", "y", "freeX", "freeY", "freeWidth", "freeHeight", "zIndex"]

function installLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
      clear: () => { store.clear() },
    },
  })
}

async function loadStoreWith(tree: EditorTree) {
  installLocalStorage()
  const compiled = path.join(process.cwd(), ".tmp/unit/components/editor/store/useEditorStore.js")
  delete require.cache[compiled]
  const { useEditorStore } = await import("../../components/editor/store/useEditorStore")
  useEditorStore.setState({
    websiteId: "draft:ve1-test",
    tree,
    selectedId: null,
    selectedIds: [],
    editingNodeId: null,
    hoveredId: null,
    undoStack: [],
    redoStack: [],
    rev: 0,
    lastSavedRev: 0,
    saveStatus: "saved",
    currentDevice: "desktop",
  })
  return useEditorStore
}

function rootChildren(tree: EditorTree) {
  return tree.nodes[tree.rootId].children
}

function propsSnapshot(tree: EditorTree) {
  return JSON.stringify(Object.fromEntries(Object.entries(tree.nodes).map(([id, node]) => [id, node.props])))
}

let creativeRunPromise: ReturnType<typeof runAutonomousMultiPageSiteBuilder> | undefined
const creativeCommerceRun = () =>
  (creativeRunPromise ??= runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketMockExecutableBuilderInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce") },
  }))

/** The VE-1 model must work on any persisted tree family without new fields. */
function assertSelectionModelWorks(tree: EditorTree, label: string) {
  const validated = validateTree(clone(tree))
  assert.equal(validated.rootId, tree.rootId, label)
  const before = JSON.stringify(tree)
  const reachable = Object.keys(tree.nodes).filter((id) => getAncestorPath(tree, id).length > 0)
  assert.ok(reachable.length > 1, `${label}: nodes reachable from root`)
  for (const id of reachable) {
    const ancestry = getAncestorPath(tree, id)
    assert.equal(ancestry[0], tree.rootId, `${label}:${id}`)
    assert.equal(ancestry[ancestry.length - 1], id, `${label}:${id}`)
    for (let index = 1; index < ancestry.length; index += 1) assert.ok(tree.nodes[ancestry[index - 1]].children.includes(ancestry[index]), `${label}:${id}`)
    const nodeLabel = getNodeLabel(tree, id)
    assert.doesNotMatch(nodeLabel, /genericWrapper|ctaButton|siteNav|store-|ec-|-/, `${label}:${id}:${nodeLabel}`)
  }
  const movable = rootChildren(tree).filter((id) => isMovableSection(tree, id))
  if (movable.length >= 2) {
    const next = computeSectionStep(tree, movable[1], "up")
    assert.ok(next, label)
    assert.deepEqual([...next].sort(), [...rootChildren(tree)].sort(), label)
  }
  assert.equal(JSON.stringify(tree), before, `${label}: selection model never mutates the tree`)
}

/* A */
test("VE-1 A: the customer experience receives visual selection, navigation and section reorder capabilities", () => {
  const client = getExperienceCapabilities("client")
  assert.equal(client.allowSelectionNavigation, true)
  assert.equal(client.allowSectionReorder, true)
  const shell = read("components/editor/client-shell/ClientShell.tsx")
  assert.match(shell, /<ClientPageRenderer \/>/)
  assert.match(shell, /<SelectionBreadcrumb/)
  assert.match(shell, /<DndContext sensors=\{sensors\} onDragEnd=\{handleClientSectionDragEnd\}>/)
  assert.match(read("components/editor/client-app/ClientPageRenderer.tsx"), /<DynamicRenderer nodeId=\{root\.id\} mode=\{isPreviewMode \? "preview" : "edit"\} \/>/)
  assert.match(shell, /<CustomerSelectionOverlay containerRef=\{canvasRef\} \/>/)
})

/* B, U */
test("VE-1 B/U: customer mode cannot enable free x/y positioning or reach developer controls", () => {
  const client = getExperienceCapabilities("client")
  assert.equal(client.allowFreePosition, false)
  assert.equal(client.allowResize, false)
  assert.equal(client.allowStructureEditing, false)
  assert.equal(client.allowDeveloperTools, false)
  assert.equal(client.allowDestructiveActions, false)

  const node = read("components/editor/EditableNode.tsx")
  // The x/y toggle lives only in the studio toolbar AND requires the capability.
  const studioToolbar = node.indexOf("{!isClient && (isSelected || isHovered) && (")
  assert.ok(studioToolbar > 0)
  assert.ok(node.indexOf('{!isRoot && capabilities.allowFreePosition && (') > studioToolbar)
  assert.match(node, /const freeDragProps = isFreePosition && capabilities\.allowFreePosition/)
  assert.match(node, /capabilities\.allowResize && isFreePosition && isSelected/)
  assert.doesNotMatch(node, /Client quick actions/, "customer chrome no longer lives inside layout wrappers")
  const overlay = read("components/editor/selection/CustomerSelectionOverlay.tsx")
  assert.doesNotMatch(overlay, /positionMode|freeX|freeY|updateNodeProps|moveFreeNodesByDelta|<input|toggleNodeLocked|toggleNodeHidden|font-mono/)
  const customerNode = read("components/editor/selection/CustomerEditableNode.tsx")
  assert.doesNotMatch(customerNode, /updateNodeProps|moveFreeNodesByDelta|resizeFreeNode|bringNodeToFront/)

  const keys = read("hooks/useKeyboardShortcuts.ts")
  const customerBranch = keys.indexOf("if (!capabilities.allowStructureEditing) {")
  assert.ok(customerBranch > 0 && customerBranch < keys.indexOf("moveFreeNodesByDelta(selectedFreeIds"), "customer branch returns before any x/y nudge")
  assert.match(keys, /arrowMove && capabilities\.allowFreePosition && selectedFreeIds\.length > 0/)
  const customerKeys = keys.slice(customerBranch, keys.indexOf("return;\n      }", customerBranch))
  assert.doesNotMatch(customerKeys, /removeNode|pasteNode|duplicateNode|moveFreeNodesByDelta|updateNodeProps/)

  // The customer content panel edits text fields only.
  assert.match(read("components/editor/experience/client/ClientContentPanel.tsx"), /key: "text" \| "content" \| "label"/)
})

/* C */
test("VE-1 C: Studio/legacy free-position compatibility is preserved", () => {
  const studio = getExperienceCapabilities("studio")
  assert.equal(studio.allowFreePosition, true)
  assert.equal(studio.allowResize, true)
  assert.equal(studio.allowStructureEditing, true)
  const renderer = read("components/editor/DynamicRenderer.tsx")
  assert.match(renderer, /positionMode === "free"/)
  assert.match(read("components/editor/EditableNode.tsx"), /positionMode: "free",\n\s+x: 48,/)
  const legacy = createVe1ReviewTree()
  legacy.nodes["hero-title"].props = { ...legacy.nodes["hero-title"].props, positionMode: "free", x: 40, y: 80, width: 300 }
  assert.equal(validateTree(clone(legacy)).nodes["hero-title"].props.positionMode, "free", "persisted free nodes still validate untouched")
})

/* D */
test("VE-1 D: clicking a nested node selects exactly that node", async () => {
  const node = read("components/editor/EditableNode.tsx")
  const onClick = node.slice(node.indexOf("onClick={(e) => {"), node.indexOf("onDoubleClick"))
  assert.ok(onClick.indexOf("e.stopPropagation()") < onClick.indexOf("select(id"), "the innermost node handles the click")
  assert.match(onClick, /additive: !isClient/)
  const store = await loadStoreWith(createVe1ReviewTree())
  store.getState().select("service-title-2")
  assert.equal(store.getState().selectedId, "service-title-2")
  assert.deepEqual(store.getState().selectedIds, ["service-title-2"])
})

/* E */
test("VE-1 E: ancestor path is derived from children, even without parentId", () => {
  const tree = createVe1ReviewTree()
  assert.equal(Object.values(tree.nodes).some((node) => node.parentId), false, "fixture has no parentId at all")
  assert.deepEqual(getAncestorPath(tree, "service-title-2"), ["root", "services", "services-grid", "service-card-2", "service-title-2"])
  assert.deepEqual(getAncestorPath(tree, "root"), ["root"])
  assert.deepEqual(getAncestorPath(tree, "missing"), [])
  assert.equal(getContainingSectionId(tree, "service-title-2"), "services")
  const cyclic = clone(tree)
  cyclic.nodes["service-card-2"].children.push("services")
  assert.equal(getAncestorPath(cyclic, "service-title-2")[0], "root", "malformed trees never loop")
  assert.equal(getParentIndex(tree), getParentIndex(tree), "parent index is cached per tree")
})

/* F, G, W */
test("VE-1 F/G/W: breadcrumb selection changes selection only -- no tree, history or dirty mutation", async () => {
  const tree = createVe1ReviewTree()
  const store = await loadStoreWith(tree)
  const before = JSON.stringify(store.getState().tree)
  store.getState().select("service-title-2")
  store.getState().hover("service-card-1")
  store.getState().select(getAncestorPath(store.getState().tree, "service-title-2")[1])
  assert.equal(store.getState().selectedId, "services")
  store.getState().select(null)
  assert.equal(JSON.stringify(store.getState().tree), before)
  assert.equal(store.getState().tree, tree, "same tree object: nothing was produced")
  assert.equal(store.getState().undoStack.length, 0)
  assert.equal(store.getState().rev, 0)
  assert.equal(store.getState().saveStatus, "saved")

  const crumb = read("components/editor/selection/SelectionBreadcrumb.tsx")
  assert.match(crumb, /getAncestorPath\(tree, selectedId\)/)
  assert.match(crumb, /select\(isPage \? null : crumb\.id\)/)
  assert.match(crumb, /aria-current=\{isCurrent \? "location" : undefined\}/)
  assert.doesNotMatch(crumb, /updateNodeProps|execute\(|reorderChildren|localStorage/)
})

/* H */
test("VE-1 H: Escape climbs to the parent, then deselects at the page level", () => {
  const tree = createVe1ReviewTree()
  const step = (selectedId: string | null) => resolveSelectionKeyAction(tree, { selectedId, editingNodeId: null }, "Escape")
  assert.deepEqual(step("service-title-2"), { type: "select", id: "service-card-2" })
  assert.deepEqual(step("service-card-2"), { type: "select", id: "services-grid" })
  assert.deepEqual(step("services-grid"), { type: "select", id: "services" })
  assert.deepEqual(step("services"), { type: "deselect" })
  assert.equal(step(null), null)
  assert.equal(resolveSelectionKeyAction(tree, { selectedId: "hero-title", editingNodeId: "hero-title" }, "Escape"), null, "text editing keeps its own Escape")
})

test("VE-1 H: ArrowUp/ArrowDown walk siblings and Enter starts inline editing only for text primitives", () => {
  const tree = createVe1ReviewTree()
  const key = (selectedId: string, value: string) => resolveSelectionKeyAction(tree, { selectedId, editingNodeId: null }, value)
  assert.deepEqual(key("service-card-2", "ArrowUp"), { type: "select", id: "service-card-1" })
  assert.deepEqual(key("service-card-2", "ArrowDown"), { type: "select", id: "service-card-3" })
  assert.equal(key("service-card-3", "ArrowDown"), null)
  assert.deepEqual(key("services", "ArrowUp"), { type: "select", id: "hero" })
  assert.deepEqual(key("hero-title", "Enter"), { type: "edit", id: "hero-title" })
  assert.deepEqual(key("hero-cta", "Enter"), { type: "edit", id: "hero-cta" })
  assert.equal(key("services", "Enter"), null)
  const hidden = clone(tree)
  hidden.nodes["service-card-2"].hidden = true
  assert.deepEqual(resolveSelectionKeyAction(hidden, { selectedId: "service-card-1", editingNodeId: null }, "ArrowDown"), { type: "select", id: "service-card-3" })
})

/* I */
test("VE-1 I: shortcuts are ignored inside inputs, contentEditable, controls and dialogs", () => {
  const el = (tagName: string, extra: Partial<{ isContentEditable: boolean; role: string; inDialog: boolean }> = {}) => ({
    tagName,
    isContentEditable: extra.isContentEditable ?? false,
    getAttribute: (name: string) => (name === "role" ? extra.role ?? null : null),
    closest: () => (extra.inDialog ? {} : null),
  })
  for (const tag of ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]) assert.equal(isInteractiveKeyTarget(el(tag)), true, tag)
  assert.equal(isInteractiveKeyTarget(el("DIV", { isContentEditable: true })), true)
  assert.equal(isInteractiveKeyTarget(el("DIV", { role: "slider" })), true)
  assert.equal(isInteractiveKeyTarget(el("DIV", { inDialog: true })), true)
  assert.equal(isInteractiveKeyTarget(el("DIV")), false)
  assert.equal(isInteractiveKeyTarget(el("BODY")), false)
  const keys = read("hooks/useKeyboardShortcuts.ts")
  assert.match(keys, /capabilities\.allowSelectionNavigation && !mod && !e\.altKey && !isInteractiveKeyTarget\(target\)/)
})

/* J, K, L, M, N */
test("VE-1 J-N: section move up/down changes only root child order, is undoable and marks the page dirty", async () => {
  const tree = createVe1ReviewTree()
  const store = await loadStoreWith(tree)
  const propsBefore = propsSnapshot(tree)
  const orderBefore = [...rootChildren(tree)]

  const up = computeSectionStep(store.getState().tree, "process", "up")
  assert.deepEqual(up, ["nav", "hero", "process", "services", "cta", "footer"])
  store.getState().reorderChildren(store.getState().tree.rootId, up!)
  const afterUp = store.getState().tree
  assert.deepEqual(rootChildren(afterUp), up)
  assert.equal(store.getState().saveStatus, "dirty")
  assert.equal(store.getState().rev, 1)
  assert.equal(store.getState().undoStack.length, 1)

  const down = computeSectionStep(afterUp, "hero", "down")
  assert.deepEqual(down, ["nav", "process", "hero", "services", "cta", "footer"])
  store.getState().reorderChildren(afterUp.rootId, down!)
  assert.equal(store.getState().undoStack.length, 2, "each move is its own undo step")

  const after = store.getState().tree
  assert.equal(propsSnapshot(after), propsBefore, "no props changed")
  for (const node of Object.values(after.nodes)) {
    for (const key of FREE_KEYS) assert.equal(key in node.props, false, `${node.id}.${key}`)
  }
  for (const id of Object.keys(after.nodes).filter((id) => id !== after.rootId)) {
    assert.deepEqual(after.nodes[id].children, tree.nodes[id].children, `${id} children untouched`)
  }

  store.getState().undo()
  store.getState().undo()
  assert.deepEqual(rootChildren(store.getState().tree), orderBefore)
  store.getState().redo()
  assert.deepEqual(rootChildren(store.getState().tree), up)
})

test("VE-1 L: the site menu stays pinned; nested nodes and locked sections are not section-movable", () => {
  const tree = createVe1ReviewTree()
  assert.equal(computeSectionStep(tree, "hero", "up"), null, "nothing moves above the menu")
  assert.equal(computeSectionStep(tree, "footer", "down"), null)
  assert.equal(isMovableSection(tree, "nav"), false)
  assert.equal(isMovableSection(tree, "hero-title"), false)
  assert.equal(computeSectionReorder(tree, "services", 0), null, "dropping on the menu is refused")
  assert.deepEqual(computeSectionReorder(tree, "footer", 1), ["nav", "footer", "hero", "services", "process", "cta"])
  assert.deepEqual(computeSectionReorder(tree, "hero", 5), ["nav", "services", "process", "cta", "footer", "hero"])
  const locked = clone(tree)
  locked.nodes.services.locked = true
  assert.equal(isMovableSection(locked, "services"), false)
  const shell = read("components/editor/client-shell/ClientShell.tsx")
  assert.match(shell, /computeSectionReorder\(tree, String\(active\.id\), targetIndex\)/)
  assert.match(shell, /if \(next\) reorderChildren\(tree\.rootId, next\)/)
  assert.doesNotMatch(shell, /moveNodeToPosition|moveFreeNodesByDelta|positionMode/)
})

/* O */
test("VE-1 O: desktop, tablet and mobile share one tree and one section order", async () => {
  const store = await loadStoreWith(createVe1ReviewTree())
  const next = computeSectionStep(store.getState().tree, "cta", "up")!
  store.getState().reorderChildren("root", next)
  const tree = store.getState().tree
  for (const device of ["desktop", "tablet", "mobile"] as const) {
    store.getState().setDevice(device)
    assert.equal(store.getState().tree, tree, device)
    assert.deepEqual(rootChildren(store.getState().tree), next, device)
    assert.deepEqual(getAncestorPath(store.getState().tree, "cta-title"), ["root", "cta", "cta-content", "cta-title"], device)
  }
  for (const node of Object.values(tree.nodes)) assert.equal("responsive" in node.props && JSON.stringify(node.props.responsive).includes("children"), false)
  const switcher = read("components/editor/client-shell/ClientDeviceSwitcher.tsx")
  assert.match(switcher, /setDevice\(device\)/)
  assert.doesNotMatch(switcher, /reorderChildren|updateNodeProps|execute\(/)
})

/* P */
test("VE-1 P: existing trees without new fields keep working (fixture, starter, legacy)", () => {
  assertSelectionModelWorks(createVe1ReviewTree(), "fixture")
  assertSelectionModelWorks(getDefaultStarterEditorTree(), "starter")
})

/* Q */
test("VE-1 Q: commercial design trees work with the selection model", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "demo", designId: "construction", version: 1 })
  for (const page of compiled.plan.pages) assertSelectionModelWorks(page.tree, `construction:${page.slug}`)
  const home = compiled.plan.pages[0].tree
  const hero = rootChildren(home).find((id) => String(home.nodes[id].props.compositionToken ?? "").startsWith("hero|"))
  assert.ok(hero)
  assert.equal(getNodeLabel(home, hero), "Portada")
})

/* R */
test("VE-1 R: legacy template trees work with the selection model", () => {
  for (const id of ["arquitectura", "servicios-locales", "construction", "agencia"] as const) assertSelectionModelWorks(getEditorTreeForWeb(id), `legacy:${id}`)
})

/* S, T */
test("VE-1 S/T: commerce and Creative Freedom output work with the selection model", async () => {
  assertSelectionModelWorks(getEditorTreeForWeb("tienda"), "legacy:tienda")
  const run = await creativeCommerceRun()
  assert.equal(run.fullSiteCreative.lifecycle.status, "applied", "Creative Freedom blueprint applied")
  const types = new Set(run.plan.pages.flatMap((page) => Object.values(page.tree.nodes).map((node) => node.type)))
  assert.ok(types.has("store-product-card"), "commerce blocks present")
  for (const page of run.plan.pages) assertSelectionModelWorks(page.tree, `creative-commerce:${page.slug}`)
  const card = run.plan.pages.flatMap((page) => Object.values(page.tree.nodes).map((node) => ({ page, node }))).find(({ node }) => node.type === "store-product-card")!
  assert.equal(getNodeLabel(card.page.tree, card.node.id), "Producto")
})

/* V */
test("VE-1 V: selection labels are human-readable Spanish, never raw block types", () => {
  const tree = createVe1ReviewTree()
  assert.equal(getNodeLabel(tree, "root"), "Página")
  assert.equal(getNodeLabel(tree, "nav"), "Menú")
  assert.equal(getNodeLabel(tree, "hero"), "Portada")
  assert.equal(getNodeLabel(tree, "footer"), "Pie de página")
  assert.equal(getNodeLabel(tree, "hero-content"), "Contenedor")
  assert.equal(getNodeLabel(tree, "hero-title"), "Título")
  assert.equal(getNodeLabel(tree, "hero-copy"), "Texto")
  assert.equal(getNodeLabel(tree, "hero-cta"), "Botón")
  assert.equal(getNodeLabel(tree, "missing"), "Elemento")
  const unknown = clone(tree)
  unknown.nodes["hero-copy"].type = "crm-pipeline-table"
  assert.equal(getNodeLabel(unknown, "hero-copy"), "Elemento")
  assert.match(read("components/editor/selection/CustomerSelectionOverlay.tsx"), /getNodeLabel\(tree, selectedId\)/)
})

test("VE-1 performance: per-node selection subscriptions and cached parent index (no full-tree scans per node)", () => {
  const node = read("components/editor/EditableNode.tsx")
  assert.match(node, /useEditorStore\(\(s\) => s\.selectedId === id \|\| s\.selectedIds\.includes\(id\)\)/)
  assert.match(node, /useEditorStore\(\(s\) => s\.hoveredId === id\)/)
  assert.doesNotMatch(node, /const selectedId\s+= useEditorStore\(\(s\) => s\.selectedId\)/)
  assert.doesNotMatch(node, /Object\.values\(s\.tree\.nodes\)\.find/)
  assert.doesNotMatch(read("components/editor/selection/SelectionBreadcrumb.tsx"), /onMouseMove|ResizeObserver|getBoundingClientRect/)
})

test("VE-1 dev review route is production-guarded, DB-free and uses the real customer shell", async () => {
  const route = read("app/dev-editor-review/ve1/page.tsx")
  assert.ok(route.indexOf('if (process.env.NODE_ENV === "production") notFound()') > 0)
  assert.match(route, /const REVIEW_SITE_ID = "draft:[a-z0-9-]+"/)
  assert.match(route, /websiteId=\{REVIEW_SITE_ID\}/)
  assert.match(route, /getVe1ReviewSitePages\(\)/)
  const fixture = read("lib/editor/fixtures/ve1-review-tree.ts")
  assert.match(fixture, /compileCommercialDesignV1\(\{ mode: "demo", designId: "construction", version: 1 \}\)/)
  assert.match(route, /initialUserRole="client"/)
  assert.match(route, /<EditorExperienceShell \/>/)
  assert.doesNotMatch(route, /prisma|getEditorTreeFromDb|fetch\(|getAuthSession/)
  const store = read("components/editor/store/useEditorStore.ts")
  assert.match(store, /websiteId\.startsWith\("draft:"\)\) return \{ success: false/)

  // The review site is the representative compiled Construction demo, and VE-1 works on every page of it.
  const { getVe1ReviewSitePages } = await import("../../lib/editor/fixtures/ve1-review-tree")
  const pages = await getVe1ReviewSitePages()
  assert.ok(pages.length >= 5)
  for (const page of pages) assertSelectionModelWorks(page.tree, `review:${page.slug}`)
  const home = pages.find((page) => page.isHome)!
  assert.ok(Object.values(home.tree.nodes).some((node) => node.type === "image" && String(node.props.src).startsWith("/commercial-demo/construction/")))
})
