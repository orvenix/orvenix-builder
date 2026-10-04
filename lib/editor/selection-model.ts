import type { EditorNode, EditorTree, NodeId } from "@/types/editor"

/**
 * VE-1: pure, editor-only selection model on top of the existing EditorTree.
 *
 * Ancestry is DERIVED from `children` (persisted `parentId` is missing in
 * legacy/starter trees) and cached per `tree.nodes` object, so selection UI
 * never mutates a tree and never rescans it on pointer moves. Nothing here
 * is persisted.
 */

const parentIndexCache = new WeakMap<EditorTree["nodes"], Map<NodeId, NodeId>>()

/**
 * child id -> parent id, from `children`. Built breadth-first from the root so
 * every reachable node gets its real path even in a malformed tree (duplicate
 * child links never create a cycle); detached nodes are indexed afterwards.
 */
export function getParentIndex(tree: EditorTree): Map<NodeId, NodeId> {
  const cached = parentIndexCache.get(tree.nodes)
  if (cached) return cached
  const index = new Map<NodeId, NodeId>()
  const visited = new Set<NodeId>([tree.rootId])
  const queue: NodeId[] = [tree.rootId]
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const parentId = queue[cursor]
    for (const childId of tree.nodes[parentId]?.children ?? []) {
      if (visited.has(childId) || !tree.nodes[childId]) continue
      visited.add(childId)
      index.set(childId, parentId)
      queue.push(childId)
    }
  }
  for (const node of Object.values(tree.nodes)) {
    if (visited.has(node.id)) continue
    for (const childId of node.children) {
      if (!index.has(childId) && childId !== node.id && childId !== tree.rootId) index.set(childId, node.id)
    }
  }
  parentIndexCache.set(tree.nodes, index)
  return index
}

export function getParentId(tree: EditorTree, id: NodeId): NodeId | null {
  if (id === tree.rootId) return null
  return getParentIndex(tree).get(id) ?? null
}

/** [rootId, ..., id] for a node reachable from the root; [] for unknown/detached nodes. Cycle-safe. */
export function getAncestorPath(tree: EditorTree, id: NodeId | null | undefined): NodeId[] {
  if (!id || !tree.nodes[id]) return []
  const path: NodeId[] = [id]
  const seen = new Set<NodeId>(path)
  let current = id
  while (current !== tree.rootId) {
    const parent = getParentId(tree, current)
    if (!parent || seen.has(parent)) return []
    path.unshift(parent)
    seen.add(parent)
    current = parent
  }
  return path
}

const EMPTY_SIBLINGS: readonly NodeId[] = Object.freeze([])

export function getSiblingIds(tree: EditorTree, id: NodeId): readonly NodeId[] {
  const parentId = getParentId(tree, id)
  return parentId ? tree.nodes[parentId]?.children ?? EMPTY_SIBLINGS : EMPTY_SIBLINGS
}

/** The top-level block (direct child of the page root) that contains `id`. */
export function getContainingSectionId(tree: EditorTree, id: NodeId | null | undefined): NodeId | null {
  const path = getAncestorPath(tree, id)
  return path.length >= 2 ? path[1] : null
}

/* ------------------------------------------------------------------ */
/* Human-readable labels                                               */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  section: "Sección",
  heading: "Título",
  text: "Texto",
  ctaButton: "Botón",
  image: "Imagen",
  icon: "Icono",
  siteNav: "Menú",
  genericWrapper: "Contenedor",
  "store-product-card": "Producto",
  "store-product-detail": "Detalle de producto",
  "store-cart-button": "Carrito",
  "store-cart-drawer": "Carrito",
  "ec-product-grid": "Productos",
}

/** Section roles recorded by the composer (`compositionToken: "<role>|..."`). */
const SECTION_ROLE_LABELS: Record<string, string> = {
  hero: "Portada",
  services: "Servicios",
  features: "Beneficios",
  products: "Productos",
  pricing: "Precios",
  process: "Proceso",
  gallery: "Galería",
  trust: "Confianza",
  testimonials: "Testimonios",
  faq: "Preguntas frecuentes",
  cta: "Llamado a la acción",
  contact: "Contacto",
  content: "Contenido",
  footer: "Pie de página",
}

/** A short customer-facing label ("Portada", "Título", "Botón"), never a raw block type. */
export function getNodeLabel(tree: EditorTree, id: NodeId): string {
  if (id === tree.rootId) return "Página"
  const node = tree.nodes[id]
  if (!node) return "Elemento"
  if (node.type === "section") {
    const role = typeof node.props.compositionToken === "string" ? node.props.compositionToken.split("|")[0] : ""
    if (SECTION_ROLE_LABELS[role]) return SECTION_ROLE_LABELS[role]
    if (getParentId(tree, id) !== tree.rootId) return "Bloque"
  }
  return TYPE_LABELS[node.type] ?? "Elemento"
}

/** Text primitives that support inline editing (Heading, Text, CtaButton). */
export const INLINE_EDITABLE_TYPES: ReadonlySet<string> = new Set(["heading", "text", "ctaButton"])

export function isInlineEditable(node: EditorNode | undefined): boolean {
  return Boolean(node && !node.locked && INLINE_EDITABLE_TYPES.has(node.type))
}

/* ------------------------------------------------------------------ */
/* Semantic section movement (child order of the page root only)       */
/* ------------------------------------------------------------------ */

/** Blocks that keep their place and are never moved past (the site menu stays on top). */
function isPinned(node: EditorNode | undefined): boolean {
  return node?.type === "siteNav"
}

/** A customer may move only unlocked, top-level, non-pinned blocks of the page. */
export function isMovableSection(tree: EditorTree, id: NodeId): boolean {
  const node = tree.nodes[id]
  return Boolean(node && id !== tree.rootId && !node.locked && !isPinned(node) && getParentId(tree, id) === tree.rootId)
}

/**
 * New root child order after moving `id` to `targetIndex` (an index among the
 * root's children), or null when the move is not allowed / a no-op. Pinned
 * blocks keep their exact positions. Only ordering changes -- never props.
 */
export function computeSectionReorder(tree: EditorTree, id: NodeId, targetIndex: number): NodeId[] | null {
  if (!isMovableSection(tree, id)) return null
  const children = tree.nodes[tree.rootId]?.children ?? []
  const from = children.indexOf(id)
  if (from === -1 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= children.length || targetIndex === from) return null
  if (isPinned(tree.nodes[children[targetIndex]])) return null
  // Same semantics as a sortable drop on the block at `targetIndex`, among movable blocks only.
  const movable = children.filter((childId) => !isPinned(tree.nodes[childId]))
  const reordered = movable.filter((childId) => childId !== id)
  reordered.splice(movable.indexOf(children[targetIndex]), 0, id)
  let cursor = 0
  const next = children.map((childId) => (isPinned(tree.nodes[childId]) ? childId : reordered[cursor++]))
  return next.every((childId, index) => childId === children[index]) ? null : next
}

/** Adjacent move up/down past the neighbouring movable block. */
export function computeSectionStep(tree: EditorTree, id: NodeId, direction: "up" | "down"): NodeId[] | null {
  if (!isMovableSection(tree, id)) return null
  const children = tree.nodes[tree.rootId]?.children ?? []
  const from = children.indexOf(id)
  const step = direction === "up" ? -1 : 1
  for (let index = from + step; index >= 0 && index < children.length; index += step) {
    if (!isPinned(tree.nodes[children[index]])) return computeSectionReorder(tree, id, index)
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Keyboard selection navigation                                       */
/* ------------------------------------------------------------------ */

export type SelectionKeyAction =
  | { type: "select"; id: NodeId }
  | { type: "deselect" }
  | { type: "edit"; id: NodeId }

/**
 * Customer canvas keyboard behaviour (pure): Escape -> parent (deselect at
 * the page level), ArrowUp/ArrowDown -> previous/next visible sibling,
 * Enter -> inline edit for text primitives. Text editing keeps its own keys.
 */
export function resolveSelectionKeyAction(
  tree: EditorTree,
  state: { selectedId: NodeId | null; editingNodeId: NodeId | null },
  key: string,
): SelectionKeyAction | null {
  const { selectedId, editingNodeId } = state
  if (editingNodeId || !selectedId || !tree.nodes[selectedId]) return null

  if (key === "Escape") {
    const parentId = getParentId(tree, selectedId)
    return parentId && parentId !== tree.rootId ? { type: "select", id: parentId } : { type: "deselect" }
  }

  if (key === "ArrowUp" || key === "ArrowDown") {
    const siblings = getSiblingIds(tree, selectedId).filter((siblingId) => tree.nodes[siblingId] && !tree.nodes[siblingId].hidden)
    const index = siblings.indexOf(selectedId)
    const nextId = index === -1 ? undefined : siblings[index + (key === "ArrowUp" ? -1 : 1)]
    return nextId ? { type: "select", id: nextId } : null
  }

  if (key === "Enter") {
    return isInlineEditable(tree.nodes[selectedId]) ? { type: "edit", id: selectedId } : null
  }

  return null
}

/** Minimal element shape so the guard is testable without a DOM. */
export interface KeyTargetLike {
  tagName?: string
  isContentEditable?: boolean
  getAttribute?: (name: string) => string | null
  closest?: (selector: string) => unknown
}

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "OPTION"])
const INTERACTIVE_ROLES = new Set(["textbox", "combobox", "listbox", "option", "menu", "menuitem", "slider", "spinbutton", "tab", "switch", "checkbox", "radio"])

/** True when a key event belongs to a form control, editable text, an interactive widget or a dialog. */
export function isInteractiveKeyTarget(target: KeyTargetLike | null | undefined): boolean {
  if (!target) return false
  if (target.isContentEditable) return true
  if (target.tagName && INTERACTIVE_TAGS.has(target.tagName.toUpperCase())) return true
  const role = target.getAttribute?.("role")
  if (role && INTERACTIVE_ROLES.has(role)) return true
  return Boolean(target.closest?.("[role='dialog'], [role='alertdialog'], dialog, [data-editor-shortcuts='off']"))
}
