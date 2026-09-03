import type {
  MutationScope,
} from "@/lib/orvenix-ai/policy"

export type OrvenixTargetKind =
  | "node"
  | "section"

export interface OrvenixConversationTarget {
  kind: OrvenixTargetKind

  nodeId?: string
  sectionId?: string

  nodeType?: string
  role?: string

  pageSlug: string

  confidence:
    | "high"
    | "medium"
    | "low"
}

export interface OrvenixConversationTurn {
  message: string

  scope: MutationScope

  target?: OrvenixConversationTarget

  action?:
    | "analysis"
    | "preview"
    | "executed"
    | "confirmation_required"
    | "blocked"

  createdAt: string
}

export interface OrvenixConversationContext {
  siteId: string
  pageSlug: string

  lastTarget?: OrvenixConversationTarget

  lastSuccessfulTarget?: OrvenixConversationTarget

  turns: OrvenixConversationTurn[]
}
