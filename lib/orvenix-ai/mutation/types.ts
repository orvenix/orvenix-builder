import type { EditorTree } from "@/types/editor"

export interface OrvenixAISnapshot {
  id: string
  siteId: string
  createdAt: string
  tree: EditorTree
}

export interface OrvenixAIMutationPlan {
  siteId: string

  snapshot: OrvenixAISnapshot

  before: EditorTree
  after: EditorTree

  addedNodes: number
  removedNodes: number
  changedNodes: number

  safe: boolean
  safetyScore: number

  readyToApply: boolean

  warnings: string[]
}
