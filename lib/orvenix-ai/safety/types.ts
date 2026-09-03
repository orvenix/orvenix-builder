import type { EditorTree } from "@/types/editor"

export type SafetyLevel =
  | "safe"
  | "warning"
  | "blocked"

export interface TreeSafetyIssue {
  level: SafetyLevel
  code: string
  message: string
  nodeId?: string
}

export interface TreeSafetyReport {
  safe: boolean
  score: number
  issues: TreeSafetyIssue[]
}

export interface TreeMutationPreview {
  before: EditorTree
  after: EditorTree

  addedNodes: number
  removedNodes: number
  changedNodes: number

  safety: TreeSafetyReport
}
