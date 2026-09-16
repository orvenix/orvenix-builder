import {
  createMutationPreview,
} from "@/lib/orvenix-ai/safety"
import {
  calculateSiteCreationTreeHash,
  type SiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"
import type {
  EditorNode,
  EditorTree,
  GlobalTheme,
} from "@/types/editor"

const COPY_WEIGHT = 0.25
const VISUAL_WEIGHT = 0.5
const STRUCTURAL_WEIGHT = 1
const NODE_ADD_WEIGHT = 1
const NODE_REMOVE_WEIGHT = 1
const PAGE_ADD_WEIGHT = 3
const PAGE_REMOVE_WEIGHT = 3
const PAGE_RENAME_WEIGHT = 0.5
const THEME_KEY_WEIGHT = 0.5

const COPY_PROP_KEYS = new Set([
  "text",
  "content",
  "label",
  "title",
  "description",
  "alt",
])

const STRUCTURAL_PROP_KEYS = new Set([
  "as",
  "href",
  "target",
  "rel",
  "hidden",
  "locked",
  "_bindings",
])

export interface CurrentDesignGenerationPage {
  slug: string
  tree: EditorTree
}

export interface CurrentDesignGenerationSite {
  pages: CurrentDesignGenerationPage[]
  theme?: GlobalTheme | null
}

export interface DesignGenerationEditMetrics {
  pageCountInitial: number
  pageCountCurrent: number

  pagesAdded: number
  pagesRemoved: number
  pagesChanged: number
  pagesRenamed: number

  nodesAdded: number
  nodesRemoved: number
  nodesChanged: number

  copyChangedNodes: number
  visualChangedNodes: number
  structuralChangedNodes: number

  themeChanged: boolean
  themeChangedKeys: number

  editDistance: number
}

type NodeChangeKind = "copy" | "visual" | "structural" | "none"
type InitialPage = SiteCreationPlanV2["pages"][number]

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function stableStringify(value: unknown) {
  return JSON.stringify(stableObject(value))
}

function stableObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableObject)

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableObject(entry)]),
    )
  }

  return value
}

function sameValue(a: unknown, b: unknown) {
  return stableStringify(a) === stableStringify(b)
}

function isComparableObject(value: unknown): value is Record<string, unknown> | unknown[] {
  return Boolean(value) && typeof value === "object"
}

function countThemeLeafCapacity(value: unknown): number {
  if (!isComparableObject(value)) return 1

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value)

  if (entries.length === 0) return 1

  return entries.reduce((total, [, entry]) => total + countThemeLeafCapacity(entry), 0)
}

function compareThemeLeaves(initialTheme: unknown, currentTheme: unknown): { changed: number; capacity: number } {
  if (sameValue(initialTheme, currentTheme)) {
    return {
      changed: 0,
      capacity: Math.max(countThemeLeafCapacity(initialTheme), countThemeLeafCapacity(currentTheme), 1),
    }
  }

  if (isComparableObject(initialTheme) && isComparableObject(currentTheme)) {
    const initialEntries = Array.isArray(initialTheme)
      ? initialTheme.map((entry, index) => [String(index), entry] as const)
      : Object.entries(initialTheme)
    const currentEntries = Array.isArray(currentTheme)
      ? currentTheme.map((entry, index) => [String(index), entry] as const)
      : Object.entries(currentTheme)

    const keys = new Set([
      ...initialEntries.map(([key]) => key),
      ...currentEntries.map(([key]) => key),
    ])

    if (keys.size === 0) {
      return {
        changed: 1,
        capacity: 1,
      }
    }

    const initialRecord = Object.fromEntries(initialEntries)
    const currentRecord = Object.fromEntries(currentEntries)
    let changed = 0
    let capacity = 0

    for (const key of keys) {
      const result = compareThemeLeaves(initialRecord[key], currentRecord[key])
      changed += result.changed
      capacity += result.capacity
    }

    return {
      changed,
      capacity: Math.max(capacity, 1),
    }
  }

  return {
    changed: 1,
    capacity: Math.max(countThemeLeafCapacity(initialTheme), countThemeLeafCapacity(currentTheme), 1),
  }
}

function countChangedThemeKeys(initialTheme: unknown, currentTheme: unknown) {
  return compareThemeLeaves(initialTheme, currentTheme)
}

function stripTreeGlobalTheme(tree: EditorTree): EditorTree {
  const nextTree = { ...tree } as EditorTree & {
    theme?: unknown
    globalTheme?: unknown
  }

  delete nextTree.theme
  delete nextTree.globalTheme

  return nextTree
}

function calculatePageContentHash(tree: EditorTree) {
  return calculateSiteCreationTreeHash(stripTreeGlobalTheme(tree))
}

function classifyNodeChange(before: EditorNode, after: EditorNode): NodeChangeKind {
  if (
    before.type !== after.type ||
    before.parentId !== after.parentId ||
    before.hidden !== after.hidden ||
    before.locked !== after.locked ||
    !sameValue(before.children, after.children)
  ) {
    return "structural"
  }

  const propKeys = new Set([
    ...Object.keys(before.props ?? {}),
    ...Object.keys(after.props ?? {}),
  ])
  let hasCopy = false
  let hasVisual = false

  for (const key of propKeys) {
    const beforeValue = before.props?.[key]
    const afterValue = after.props?.[key]
    if (sameValue(beforeValue, afterValue)) continue

    if (STRUCTURAL_PROP_KEYS.has(key)) return "structural"
    if (COPY_PROP_KEYS.has(key)) hasCopy = true
    else hasVisual = true
  }

  if (hasVisual) return "visual"
  if (hasCopy) return "copy"

  return sameValue(before, after) ? "none" : "visual"
}

function countPageNodes(tree: EditorTree) {
  return Object.keys(tree.nodes).length
}

function measurePageChange(initialTree: EditorTree, currentTree: EditorTree) {
  const comparableInitialTree = stripTreeGlobalTheme(initialTree)
  const comparableCurrentTree = stripTreeGlobalTheme(currentTree)
  const preview = createMutationPreview(comparableInitialTree, comparableCurrentTree)
  let copyChangedNodes = 0
  let visualChangedNodes = 0
  let structuralChangedNodes = comparableInitialTree.rootId === comparableCurrentTree.rootId ? 0 : 1

  for (const id of Object.keys(comparableCurrentTree.nodes)) {
    const before = comparableInitialTree.nodes[id]
    const after = comparableCurrentTree.nodes[id]
    if (!before || !after || sameValue(before, after)) continue

    const kind = classifyNodeChange(before, after)
    if (kind === "structural") structuralChangedNodes += 1
    else if (kind === "visual") visualChangedNodes += 1
    else if (kind === "copy") copyChangedNodes += 1
  }

  return {
    addedNodes: preview.addedNodes,
    removedNodes: preview.removedNodes,
    changedNodes: preview.changedNodes,
    copyChangedNodes,
    visualChangedNodes,
    structuralChangedNodes,
  }
}

function findConservativeRenames(
  unmatchedInitialPages: InitialPage[],
  unmatchedCurrentPages: CurrentDesignGenerationPage[],
) {
  const renamedInitialSlugs = new Set<string>()
  const renamedCurrentSlugs = new Set<string>()
  let pagesRenamed = 0

  for (const initialPage of unmatchedInitialPages) {
    const initialHash = calculatePageContentHash(initialPage.tree)
    const initialHashMatches = unmatchedInitialPages.filter(
      (page) => calculatePageContentHash(page.tree) === initialHash,
    )
    const currentHashMatches = unmatchedCurrentPages.filter(
      (page) => calculatePageContentHash(page.tree) === initialHash,
    )

    if (initialHashMatches.length !== 1 || currentHashMatches.length !== 1) continue

    renamedInitialSlugs.add(initialPage.slug)
    renamedCurrentSlugs.add(currentHashMatches[0]!.slug)
    pagesRenamed += 1
  }

  return {
    pagesRenamed,
    renamedInitialSlugs,
    renamedCurrentSlugs,
  }
}

export function measureDesignGenerationDrift(
  initialPlan: SiteCreationPlanV2,
  currentSite: CurrentDesignGenerationSite,
): DesignGenerationEditMetrics {
  const initialPages = new Map(initialPlan.pages.map((page) => [page.slug, page]))
  const currentPages = new Map(currentSite.pages.map((page) => [page.slug, page]))
  const initialPageCount = initialPages.size
  const currentPageCount = currentPages.size
  let pagesAdded = 0
  let pagesRemoved = 0
  let pagesChanged = 0
  let pagesRenamed = 0
  let nodesAdded = 0
  let nodesRemoved = 0
  let nodesChanged = 0
  let copyChangedNodes = 0
  let visualChangedNodes = 0
  let structuralChangedNodes = 0
  let initialNodeCount = 0
  let currentNodeCount = 0

  for (const page of initialPages.values()) initialNodeCount += countPageNodes(page.tree)
  for (const page of currentPages.values()) currentNodeCount += countPageNodes(page.tree)

  const unmatchedInitialPages: InitialPage[] = []
  const unmatchedCurrentPages: CurrentDesignGenerationPage[] = []

  for (const [slug, initialPage] of initialPages.entries()) {
    const currentPage = currentPages.get(slug)
    if (!currentPage) {
      unmatchedInitialPages.push(initialPage)
      continue
    }

    if (calculatePageContentHash(initialPage.tree) === calculatePageContentHash(currentPage.tree)) {
      continue
    }

    pagesChanged += 1
    const pageMetrics = measurePageChange(initialPage.tree, currentPage.tree)
    nodesAdded += pageMetrics.addedNodes
    nodesRemoved += pageMetrics.removedNodes
    nodesChanged += pageMetrics.changedNodes
    copyChangedNodes += pageMetrics.copyChangedNodes
    visualChangedNodes += pageMetrics.visualChangedNodes
    structuralChangedNodes += pageMetrics.structuralChangedNodes
  }

  for (const [slug, currentPage] of currentPages.entries()) {
    if (!initialPages.has(slug)) unmatchedCurrentPages.push(currentPage)
  }

  const renameMatches = findConservativeRenames(unmatchedInitialPages, unmatchedCurrentPages)
  pagesRenamed = renameMatches.pagesRenamed

  for (const page of unmatchedInitialPages) {
    if (renameMatches.renamedInitialSlugs.has(page.slug)) continue
    pagesRemoved += 1
    nodesRemoved += countPageNodes(page.tree)
  }

  for (const page of unmatchedCurrentPages) {
    if (renameMatches.renamedCurrentSlugs.has(page.slug)) continue
    pagesAdded += 1
    nodesAdded += countPageNodes(page.tree)
  }

  const themeMetrics = countChangedThemeKeys(initialPlan.theme, currentSite.theme ?? null)
  const themeChanged = themeMetrics.changed > 0
  const weightedChanges =
    copyChangedNodes * COPY_WEIGHT +
    visualChangedNodes * VISUAL_WEIGHT +
    structuralChangedNodes * STRUCTURAL_WEIGHT +
    nodesAdded * NODE_ADD_WEIGHT +
    nodesRemoved * NODE_REMOVE_WEIGHT +
    pagesAdded * PAGE_ADD_WEIGHT +
    pagesRemoved * PAGE_REMOVE_WEIGHT +
    pagesRenamed * PAGE_RENAME_WEIGHT +
    themeMetrics.changed * THEME_KEY_WEIGHT

  const weightedCapacity =
    Math.max(initialNodeCount, currentNodeCount, 1) * STRUCTURAL_WEIGHT +
    Math.max(initialPageCount, currentPageCount, 1) * PAGE_ADD_WEIGHT +
    themeMetrics.capacity * THEME_KEY_WEIGHT

  return {
    pageCountInitial: initialPageCount,
    pageCountCurrent: currentPageCount,

    pagesAdded,
    pagesRemoved,
    pagesChanged,
    pagesRenamed,

    nodesAdded,
    nodesRemoved,
    nodesChanged,

    copyChangedNodes,
    visualChangedNodes,
    structuralChangedNodes,

    themeChanged,
    themeChangedKeys: themeMetrics.changed,

    editDistance: clamp01(weightedChanges / weightedCapacity),
  }
}
