import type { EditorNode, EditorTree } from "@/types/editor"

/**
 * PCE-2: after asset resolution, a generated image slot that never received
 * a real asset (props.src still "") is removed instead of shipping an empty
 * <img> or a blank media box. Pure; returns a new tree.
 *
 *   - the empty `image` node is removed from its parent;
 *   - ancestor wrappers left with no children are removed too (never a
 *     section or the root);
 *   - a multi-column grid wrapper left with a single child drops its
 *     responsive `*:grid-cols-*` tokens so the remaining content reflows to
 *     one column instead of occupying half a split.
 *
 * Only Orvenix-generated className tokens are touched; nothing is added.
 */

const GRID_COLUMN_TOKEN = /^(?:sm|md|lg|xl|2xl):grid-cols-\S+$/

function isEmptyImage(node: EditorNode): boolean {
  return node.type === "image" && (typeof node.props.src !== "string" || !node.props.src.trim())
}

export function collapseEmptyImageSlotsV1(tree: EditorTree): EditorTree {
  const nodes = structuredClone(tree.nodes) as Record<string, EditorNode>
  const parentOf = new Map<string, string>()
  for (const [id, node] of Object.entries(nodes)) for (const child of node.children) parentOf.set(child, id)

  const emptied = Object.values(nodes).filter(isEmptyImage).map((node) => node.id)
  if (!emptied.length) return tree

  const reflow = new Set<string>()
  for (const imageId of emptied) {
    let removeId: string | undefined = imageId
    while (removeId) {
      const parentId = parentOf.get(removeId)
      delete nodes[removeId]
      if (!parentId || !nodes[parentId]) break
      const parent = nodes[parentId]
      parent.children = parent.children.filter((child) => child !== removeId)
      const removable = parent.type === "genericWrapper" && parent.children.length === 0 && parentId !== tree.rootId
      if (removable) {
        removeId = parentId
        continue
      }
      if (parent.type === "genericWrapper" && parent.children.length === 1) reflow.add(parentId)
      removeId = undefined
    }
  }

  for (const id of reflow) {
    const wrapper = nodes[id]
    if (!wrapper || typeof wrapper.props.className !== "string") continue
    const tokens = wrapper.props.className.split(/\s+/).filter(Boolean)
    if (!tokens.some((token) => GRID_COLUMN_TOKEN.test(token))) continue
    wrapper.props = { ...wrapper.props, className: tokens.filter((token) => !GRID_COLUMN_TOKEN.test(token)).join(" ") }
  }

  return { ...tree, nodes }
}
