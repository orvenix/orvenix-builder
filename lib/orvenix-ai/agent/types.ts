import type {
  EditorTree,
} from "@/types/editor"

import type {
  MutationPolicyDecision,
  MutationScope,
} from "@/lib/orvenix-ai/policy"

import type {
  OrvenixAIMutationPlan,
  OrvenixAISnapshot,
} from "@/lib/orvenix-ai/mutation"

export type OrvenixAgentMode =
  | "analyze"
  | "preview"
  | "execute"

export type OrvenixPublicationMode =
  | "static-artifact"
  | "dynamic-renderer"

export interface OrvenixPublicationResult {
  url: string

  publicationMode:
    OrvenixPublicationMode

  pageCount: number
}

export interface OrvenixSiteCreationResult {
  siteId: string
  nextRoute: string
  verified: boolean
  rollbackApplied?: boolean
}

export interface OrvenixAgentExecutionContext {
  /*
   * Capacidades creadas exclusivamente por
   * código autenticado del servidor.
   */
  publishSite?: (
    params: {
      siteId: string
    },
  ) =>
    Promise<OrvenixPublicationResult>

  createDraftSite?: (
    params: {
      name: string
      description: string
      tree: EditorTree
    },
  ) =>
    Promise<OrvenixSiteCreationResult>
}

export interface OrvenixAgentBusinessContext {
  name?: string
  industry?: string
  description?: string
  location?: string
  audience?: string
  objective?: string

  phone?: string
  whatsapp?: string
  email?: string
  address?: string

  services?: Array<{
    name: string
    description?: string
  }>

  pricing?: Array<{
    name: string
    price: string
    description?: string
  }>

  testimonials?: Array<{
    quote: string
    author: string
  }>
}

export interface OrvenixAgentRequest {
  siteId: string
  pageSlug?: string

  message: string

  mode?: OrvenixAgentMode

  business?: OrvenixAgentBusinessContext

  targetNodeId?: string
  targetSectionId?: string

  confirmed?: boolean

  siteCreationPlan?: OrvenixAIMutationPlan
}

export interface OrvenixAgentResponse {
  ok: boolean

  action:
    | "analysis"
    | "preview"
    | "executed"
    | "confirmation_required"
    | "blocked"

  scope: MutationScope

  message: string

  policy?: MutationPolicyDecision

  plan?: OrvenixAIMutationPlan

  tree?: EditorTree

  snapshot?: OrvenixAISnapshot

    publication?:
    OrvenixPublicationResult

  createdSite?:
    OrvenixSiteCreationResult

  quality?: number

  warnings: string[]
}
