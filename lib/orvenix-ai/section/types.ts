import type {
  EditorTree,
} from "@/types/editor"

import type {
  SectionRole,
} from "@/lib/orvenix-ai/architect"

export interface SectionMutationTarget {
  sectionId?: string
  insertAfterId?: string
}

export interface SectionMutationResult {
  ok: boolean

  tree: EditorTree

  role?: SectionRole

  rootSectionId?: string

  addedNodeIds: string[]
  removedNodeIds: string[]
  changedNodeIds: string[]

  warnings: string[]
}
