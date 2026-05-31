import type { EditorNode, EditorTree } from "../../../types/editor"
import type { ExportSerializeOptions } from "./exportNodes"

export interface ExportTraversalContext {
  node: EditorNode
  props: Record<string, unknown>
  depth: number
  indent: string
  children: string
}

export type ExportNodeRenderer = (context: ExportTraversalContext) => string

export function renderExportNodeTree(
  nodeId: string,
  tree: EditorTree,
  depth: number,
  renderer: ExportNodeRenderer,
  options?: ExportSerializeOptions
): string {
  const node = tree.nodes[nodeId] as EditorNode | undefined
  if (!node || node.hidden) return ""

  const children = node.children
    .map((childId) => renderExportNodeTree(childId, tree, depth + 1, renderer, options))
    .filter(Boolean)
    .join("\n")

  return renderer({
    node,
    props: node.props as Record<string, unknown>,
    depth,
    indent: "  ".repeat(depth),
    children,
  })
}

export function renderExportRootChildren(
  tree: EditorTree,
  depth: number,
  renderer: ExportNodeRenderer,
  options?: ExportSerializeOptions
): string {
  const rootNode = tree.nodes[tree.rootId]
  if (!rootNode) return ""

  return rootNode.children
    .map((nodeId) => renderExportNodeTree(nodeId, tree, depth, renderer, options))
    .filter(Boolean)
    .join("\n\n")
}
