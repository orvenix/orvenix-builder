import { contrastRatio, hasSafeContrast, lightAccentTint } from "@/lib/orvenix-ai/theme/visual-direction"
import type { EditorNode, EditorTree, NodeId, NodeProps } from "@/types/editor"

import { getProtectedReason } from "./context-capabilities"
import { getParentId } from "./selection-model"

/**
 * VE-3: pure semantic structure/layout rules for the customer editor. Every
 * operation resolves to a bounded EditorTree change (child order, a closed
 * enum prop, or a theme-derived colour with readable foregrounds) -- never
 * coordinates, pixel sizes, classes or raw CSS. Invalid or no-op requests
 * resolve to null, so callers mutate nothing.
 */

/* ------------------------------------------------------------------ */
/* Sibling reorder (inside one content container)                      */
/* ------------------------------------------------------------------ */

const REORDERABLE_TYPES = new Set(["heading", "text", "ctaButton", "image", "icon", "genericWrapper", "section"])

const className = (node: EditorNode | undefined) => (typeof node?.props.className === "string" ? node.props.className : "")
const isLayered = (node: EditorNode | undefined) => /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className(node)) || node?.props.positionMode === "free"

/**
 * The parent of `id` is a plain content container whose order the customer
 * may change: not the page root (sections have their own rules), no layered
 * (absolute/free) children whose stacking would change meaning, and every
 * child is ordinary presentation content (never commerce or data-bound).
 */
function reorderableParent(tree: EditorTree, id: NodeId): EditorNode | null {
  const parentId = getParentId(tree, id)
  if (!parentId || parentId === tree.rootId) return null
  const parent = tree.nodes[parentId]
  if (!parent || parent.locked || getProtectedReason(parent) || isLayered(parent)) return null
  if (!["genericWrapper", "section"].includes(parent.type)) return null
  const children = parent.children.map((childId) => tree.nodes[childId])
  if (children.length < 2 || children.some((child) => !child || !REORDERABLE_TYPES.has(child.type) || child.locked || isLayered(child) || getProtectedReason(child))) return null
  return parent
}

export function canReorderWithinParent(tree: EditorTree, id: NodeId): boolean {
  return Boolean(reorderableParent(tree, id))
}

/** New child order of the parent after placing `id` before/after `targetId` (a sibling), or null (invalid / no-op). */
export function computeSiblingDrop(tree: EditorTree, id: NodeId, targetId: NodeId, position: "before" | "after"): NodeId[] | null {
  const parent = reorderableParent(tree, id)
  if (!parent || id === targetId || !parent.children.includes(targetId)) return null // cross-container moves are refused
  const without = parent.children.filter((childId) => childId !== id)
  without.splice(without.indexOf(targetId) + (position === "after" ? 1 : 0), 0, id)
  return without.every((childId, index) => childId === parent.children[index]) ? null : without
}

export function computeSiblingStep(tree: EditorTree, id: NodeId, direction: "before" | "after"): NodeId[] | null {
  const parent = reorderableParent(tree, id)
  if (!parent) return null
  const index = parent.children.indexOf(id)
  const target = parent.children[index + (direction === "before" ? -1 : 1)]
  return target ? computeSiblingDrop(tree, id, target, direction) : null
}

/* ------------------------------------------------------------------ */
/* Split composition (media beside content)                            */
/* ------------------------------------------------------------------ */

function subtreeHas(tree: EditorTree, id: NodeId, predicate: (node: EditorNode) => boolean, depth = 0): boolean {
  const node = tree.nodes[id]
  if (!node || depth > 8) return false
  return predicate(node) || node.children.some((childId) => subtreeHas(tree, childId, predicate, depth + 1))
}

const isMedia = (node: EditorNode) => node.type === "image" && typeof node.props.src === "string" && node.props.src.length > 0
const isCopy = (node: EditorNode) => ["heading", "text"].includes(node.type)

/** A two-column split (grid columns or a flex row from a breakpoint up) holding one media side and one content side. */
export function getSplitComposition(tree: EditorTree, id: NodeId): { containerId: NodeId; mediaFirst: boolean } | null {
  const node = tree.nodes[id]
  if (!node || !["genericWrapper", "section"].includes(node.type) || node.locked || getProtectedReason(node)) return null
  if (!/(^|\s)(grid\s[\s\S]*md:grid-cols-|md:grid-cols-)|(^|\s)(sm:|md:)?flex-row(\s|$)/.test(className(node))) return null
  const visible = node.children.filter((childId) => tree.nodes[childId] && !tree.nodes[childId].hidden)
  if (visible.length !== 2 || node.children.length !== 2) return null
  if (visible.some((childId) => isLayered(tree.nodes[childId]) || getProtectedReason(tree.nodes[childId]))) return null
  const [first, second] = visible
  const firstMedia = subtreeHas(tree, first, isMedia) && !subtreeHas(tree, first, isCopy)
  const secondMedia = subtreeHas(tree, second, isMedia) && !subtreeHas(tree, second, isCopy)
  if (firstMedia === secondMedia) return null
  if (!subtreeHas(tree, firstMedia ? second : first, isCopy)) return null
  return { containerId: id, mediaFirst: firstMedia }
}

/** The split the selected node belongs to (itself, its parent or grandparent). */
export function findSplitComposition(tree: EditorTree, id: NodeId): { containerId: NodeId; mediaFirst: boolean } | null {
  let current: NodeId | null = id
  for (let depth = 0; current && depth < 3; depth += 1) {
    const split = getSplitComposition(tree, current)
    if (split) return split
    current = getParentId(tree, current)
  }
  return null
}

/** Swapping the two sides is a pure child-order change (desktop side and mobile stacking order follow it). */
export function computeCompositionSwap(tree: EditorTree, containerId: NodeId): NodeId[] | null {
  const split = getSplitComposition(tree, containerId)
  if (!split) return null
  const [first, second] = tree.nodes[containerId].children
  return [second, first]
}

/* ------------------------------------------------------------------ */
/* Text size (visual only: heading LEVEL never changes)                 */
/* ------------------------------------------------------------------ */

export type SizeOption = { value: string; label: string }

export function getTextSizeOptions(node: EditorNode | undefined): SizeOption[] {
  if (node?.type === "text") return [{ value: "sm", label: "Compacto" }, { value: "md", label: "Normal" }, { value: "lg", label: "Destacado" }]
  if (node?.type !== "heading") return []
  const level = Number(node.props.level ?? 2)
  const sizes = level <= 1 ? ["4xl", "5xl", "6xl"] : level === 2 ? ["2xl", "3xl", "4xl"] : ["lg", "xl", "2xl"]
  return sizes.map((value, index) => ({ value, label: ["Pequeño", "Normal", "Grande"][index] }))
}

/* ------------------------------------------------------------------ */
/* Section background treatments with readable foregrounds             */
/* ------------------------------------------------------------------ */

const HEX = /^#[0-9a-f]{6}$/i
const DARK_TEXT = { heading: "#0f172a", body: "#475569" }
const LIGHT_TEXT = { heading: "#ffffff", body: "#e2e8f0" }

export type BackgroundTreatment = { id: "claro" | "blanco" | "suave" | "principal" | "oscuro"; label: string; color: string }

function themeColors(tree: EditorTree): Record<string, string> {
  const colors = (tree.globalTheme ?? tree.theme)?.colors as Record<string, unknown> | undefined
  return Object.fromEntries(Object.entries(colors ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string" && HEX.test(entry[1])))
}

const luminanceDark = (hex: string) => (contrastRatio(hex, "#ffffff") ?? 0) >= 4.5

/** Bounded, THEME-derived treatments (no free colour picker); works for any Orvenix theme. */
export function getBackgroundTreatments(tree: EditorTree): BackgroundTreatment[] {
  const colors = themeColors(tree)
  const candidates: BackgroundTreatment[] = [
    { id: "claro", label: "Claro", color: colors.background && !luminanceDark(colors.background) ? colors.background : "#f8fafc" },
    { id: "blanco", label: "Blanco", color: "#ffffff" },
    { id: "suave", label: "Suave", color: (colors.accent && lightAccentTint(colors.accent, 0.9)) || "#f1f5f9" },
    { id: "principal", label: "Principal", color: colors.primary ?? "#0f172a" },
    { id: "oscuro", label: "Oscuro", color: [colors.text, colors.primary, colors.secondary].find((hex) => hex && luminanceDark(hex)) ?? "#0f172a" },
  ]
  const seen = new Set<string>()
  return candidates.filter((option) => HEX.test(option.color) && !seen.has(option.color.toLowerCase()) && seen.add(option.color.toLowerCase()))
}

/** Image-backed sections (a full-cover media layer, eg. a photo hero) are not recoloured: their text sits on the photo. */
export function canChangeSectionBackground(tree: EditorTree, sectionId: NodeId): boolean {
  const section = tree.nodes[sectionId]
  if (!section || section.type !== "section" || section.locked || getProtectedReason(section) || sectionId === tree.rootId) return false
  return !subtreeHas(tree, sectionId, (node) => node.id !== sectionId && /(^|\s)absolute(\s|$)/.test(className(node)) && /(^|\s)inset-0(\s|$)/.test(className(node)))
}

/** A descendant that paints its own surface (a nested section background or a wrapper bg-* class): its text is not on this section. */
function paintsOwnSurface(node: EditorNode): boolean {
  if (node.type === "section" && typeof node.props.background === "string" && node.props.background) return true
  return /(^|\s)bg-(?!opacity|clip|cover|contain|center|no-repeat|fixed|local|scroll|origin|repeat|blend|none\b|transparent\b)[\w[\]#/.-]+/.test(className(node))
}

/**
 * The full patch for one treatment: the section background, plus readable
 * colours for headings/text painted directly on it whose current colour no
 * longer has safe contrast. Text already readable keeps its colour.
 */
export function computeBackgroundTreatmentPatch(tree: EditorTree, sectionId: NodeId, color: string): Record<NodeId, NodeProps> | null {
  if (!HEX.test(color) || !canChangeSectionBackground(tree, sectionId)) return null
  const section = tree.nodes[sectionId]
  const patch: Record<NodeId, NodeProps> = {}
  if (String(section.props.background ?? "").toLowerCase() !== color.toLowerCase()) patch[sectionId] = { background: color }
  const readable = hasSafeContrast(DARK_TEXT.heading, color) ? DARK_TEXT : LIGHT_TEXT
  const visit = (id: NodeId) => {
    const node = tree.nodes[id]
    if (!node) return
    if (id !== sectionId && paintsOwnSurface(node)) return
    if ((node.type === "heading" || node.type === "text") && !node.locked) {
      const current = typeof node.props.color === "string" && HEX.test(node.props.color) ? node.props.color : undefined
      if (!current || !hasSafeContrast(current, color)) {
        const next = node.type === "heading" ? readable.heading : readable.body
        if (current?.toLowerCase() !== next) patch[id] = { color: next }
      }
    }
    node.children.forEach(visit)
  }
  visit(sectionId)
  return Object.keys(patch).length ? patch : null
}

/* ------------------------------------------------------------------ */
/* Responsive intent                                                   */
/* ------------------------------------------------------------------ */

/** "Ocultar en celular": a bounded, CSS-based responsive intent for presentation elements only. */
export function canHideOnMobile(tree: EditorTree, id: NodeId): boolean {
  const node = tree.nodes[id]
  return Boolean(node && id !== tree.rootId && !node.locked && !getProtectedReason(node) && ["image", "icon", "genericWrapper"].includes(node.type) && getParentId(tree, id) !== tree.rootId)
}

/* ------------------------------------------------------------------ */
/* Navigation visibility (labels/visibility only; routes untouched)     */
/* ------------------------------------------------------------------ */

/** Pages that must stay in the menu. */
export const PROTECTED_NAV_SLUGS: ReadonlySet<string> = new Set(["home"])

export function parseHiddenNavSlugs(value: unknown): Set<string> {
  return new Set(String(value ?? "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean))
}

/** Hiding a page from the menu never deletes or renames it; only known, unprotected slugs are written. */
export function serializeHiddenNavSlugs(hidden: Iterable<string>, pageSlugs: readonly string[]): string {
  const wanted = new Set(Array.from(hidden, (slug) => slug.toLowerCase()))
  return pageSlugs.filter((slug) => wanted.has(slug.toLowerCase()) && !PROTECTED_NAV_SLUGS.has(slug.toLowerCase())).join(",")
}

/* ------------------------------------------------------------------ */
/* What the context bar may offer for the selection (VE-3)              */
/* ------------------------------------------------------------------ */

export interface StructureCapabilities {
  reorder: boolean
  split: { containerId: NodeId; mediaFirst: boolean } | null
  sizes: SizeOption[]
  background: BackgroundTreatment[]
  hideOnMobile: boolean
}

export function getStructureCapabilities(tree: EditorTree, id: NodeId): StructureCapabilities {
  const node = tree.nodes[id]
  if (!node || id === tree.rootId || getProtectedReason(node)) return { reorder: false, split: null, sizes: [], background: [], hideOnMobile: false }
  return {
    reorder: canReorderWithinParent(tree, id),
    split: findSplitComposition(tree, id),
    sizes: node.locked ? [] : getTextSizeOptions(node),
    background: canChangeSectionBackground(tree, id) ? getBackgroundTreatments(tree) : [],
    hideOnMobile: canHideOnMobile(tree, id),
  }
}
