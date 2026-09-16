import { isInternalPageLink, parseInternalPageLink } from "@/lib/builder-core/tree/pageLinks"
import type { EditorNode, EditorTree } from "@/types/editor"

/**
 * Prop keys treated as human-facing textual content. Deliberately an
 * allowlist (not a blocklist of style/layout keys) so unrecognized keys
 * never get scanned as "content" and cannot produce false positives.
 * Extend this list as new text-bearing block props are introduced.
 */
export const CONTENT_PROP_KEYS: readonly string[] = [
  "text",
  "content",
  "label",
  "title",
  "subtitle",
  "description",
  "heading",
  "subheading",
  "caption",
  "quote",
  "author",
  "placeholder",
  "alt",
  "buttonText",
  "name",
  "summary",
  "body",
  "tagline",
]

const MAX_PROP_WALK_DEPTH = 6

export interface DanglingChildRef {
  nodeId: string
  missingChildId: string
}

export interface TreeGraphAnalysis {
  reachableNodes: EditorNode[]
  danglingChildRefs: DanglingChildRef[]
  cycleNodeIds: string[]
  unreachableNodeIds: string[]
}

/**
 * Walks an EditorTree from rootId following `children` id references.
 * Detects dangling child ids (referenced but absent from `nodes`), graph
 * cycles (a node reachable from itself), and nodes present in `nodes` but
 * never reached from rootId. Pure/read-only: never mutates `tree`.
 */
export function analyzeTreeGraph(tree: EditorTree): TreeGraphAnalysis {
  const nodes = tree.nodes ?? {}
  const danglingChildRefs: DanglingChildRef[] = []
  const reachableNodes: EditorNode[] = []
  const cycleNodeIds: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(id: string) {
    if (!Object.prototype.hasOwnProperty.call(nodes, id)) return
    if (visiting.has(id)) {
      cycleNodeIds.push(id)
      return
    }
    if (visited.has(id)) return

    visiting.add(id)
    const node = nodes[id]!
    reachableNodes.push(node)

    for (const childId of node.children ?? []) {
      if (!Object.prototype.hasOwnProperty.call(nodes, childId)) {
        danglingChildRefs.push({ nodeId: id, missingChildId: childId })
        continue
      }
      visit(childId)
    }

    visiting.delete(id)
    visited.add(id)
  }

  if (typeof tree.rootId === "string" && Object.prototype.hasOwnProperty.call(nodes, tree.rootId)) {
    visit(tree.rootId)
  }

  const unreachableNodeIds = Object.keys(nodes).filter((id) => !visited.has(id))

  return {
    reachableNodes,
    danglingChildRefs,
    cycleNodeIds: [...new Set(cycleNodeIds)],
    unreachableNodeIds,
  }
}

export interface ContentEntry {
  nodeId: string
  nodeType: string
  propKey: string
  value: string
}

/** Collects allowlisted textual prop values from a set of nodes. */
export function collectContentEntries(nodes: EditorNode[]): ContentEntry[] {
  const entries: ContentEntry[] = []

  for (const node of nodes) {
    for (const key of CONTENT_PROP_KEYS) {
      const value = node.props?.[key]
      if (typeof value === "string") {
        entries.push({ nodeId: node.id, nodeType: node.type, propKey: key, value })
      }
    }
  }

  return entries
}

/** Node ids that carry at least one non-empty textual content prop. */
export function countContentBearingNodes(nodes: EditorNode[]): number {
  const withContent = new Set<string>()

  for (const entry of collectContentEntries(nodes)) {
    if (entry.value.trim().length > 0) {
      withContent.add(entry.nodeId)
    }
  }

  return withContent.size
}

export interface InternalLinkRef {
  nodeId: string
  targetSlug: string
}

/**
 * Scans every string value nested inside node.props (any key, any depth)
 * for internal `page:<slug>` links. Values are plain JSON (guaranteed by
 * SiteCreationPlanV2's strict-JSON contract), so no cycle guard is needed
 * beyond a defensive depth cap.
 */
export function collectInternalLinks(nodes: EditorNode[]): InternalLinkRef[] {
  const refs: InternalLinkRef[] = []

  function walk(value: unknown, nodeId: string, depth: number) {
    if (depth > MAX_PROP_WALK_DEPTH) return

    if (typeof value === "string") {
      if (isInternalPageLink(value)) {
        const targetSlug = parseInternalPageLink(value)
        if (targetSlug) refs.push({ nodeId, targetSlug })
      }
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, nodeId, depth + 1)
      return
    }

    if (value && typeof value === "object") {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        walk(nested, nodeId, depth + 1)
      }
    }
  }

  for (const node of nodes) {
    walk(node.props, node.id, 0)
  }

  return refs
}
