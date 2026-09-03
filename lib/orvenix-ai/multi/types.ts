import type {
  EditorTree,
  NodeProps,
} from "@/types/editor"

export interface MultiMutationChange {
  nodeId: string
  nodeType: string

  before: NodeProps
  after: NodeProps

  changedKeys: string[]
}

export interface MultiMutationResult {
  ok: boolean

  tree: EditorTree

  matchedNodeIds: string[]

  changes: MultiMutationChange[]

  warnings: string[]
}