import type {
  OrvenixAIMutationPlan,
} from "@/lib/orvenix-ai/mutation"

export type MutationScope =
  | "read_only"
  | "local_edit"
  | "multi_edit"
  | "section_edit"
  | "page_redesign"
  | "site_redesign"
  | "site_creation"
  | "theme_edit"
  | "design_edit"
  | "publish"

export interface MutationPolicyInput {
  request: string
  plan: OrvenixAIMutationPlan

  scopeOverride?: MutationScope

  targetNodeId?: string
  targetSectionId?: string

  explicitPublish?: boolean
}

export interface MutationPolicyDecision {
  allowed: boolean
  scope: MutationScope

  reason: string

  limits: {
    maxAddedNodes?: number
    maxRemovedNodes?: number
    maxChangedNodes?: number

    requireTargetNode?: boolean
    requireTargetSection?: boolean

    requireSnapshot: boolean
    requireConfirmation: boolean
  }

  violations: string[]
}
