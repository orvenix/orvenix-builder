import type {
  EditorTree,
  NodeProps,
} from "@/types/editor"

export interface LocalMutationTarget {
  nodeId: string
  nodeType: string
  displayName?: string
}

export interface LocalMutationChange {
  nodeId: string
  before: NodeProps
  after: NodeProps
  changedKeys: string[]
}

export interface LocalMutationResult {
  ok: boolean

  tree: EditorTree

  target?: LocalMutationTarget

  changes: LocalMutationChange[]

  warnings: string[]
}
