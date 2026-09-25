import type { EditorTree } from "@/types/editor"
import type { DesignPlannerPriorV1 } from "@/lib/orvenix-ai/design-memory/planner-prior"
import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { SiteCreationExternalThemeAdvisoryV1 } from "@/lib/orvenix-ai/site-creation/assistance"
import type { NormalizedSiteCreationBusinessEvidenceV1 } from "@/lib/orvenix-ai/site-creation/evidence-normalization"
import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import type {
  OrvenixSiteArchitecture,
} from "@/lib/orvenix-ai/architect"

import type {
  RankedTemplate,
} from "@/lib/orvenix-ai/templates"

import type {
  OrvenixAIQualityReport,
} from "@/lib/orvenix-ai/types"

export interface AutonomousBusinessInput {
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

  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. */
  products?: Array<{
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
    role?: string
  }>

  businessEvidence?: NormalizedSiteCreationBusinessEvidenceV1
}

export interface AutonomousSiteBuilderInput {
  request: string
  business: AutonomousBusinessInput

  preferredStyle?: string

  forceFreshComposition?: boolean

  minimumQuality?: number

  designMemoryPrior?: DesignPlannerPriorV1 | null

  externalThemeAdvisory?: SiteCreationExternalThemeAdvisoryV1 | null

  /**
   * V2-4: optional, already-validated-and-sanitized Creative Director
   * direction. Undefined/null (the default) -> behavior is unchanged from
   * the deterministic V2-1..V2-S3 baseline; every consumption point is
   * additive and falls back when this is absent.
   */
  creativeDirection?: CreativeSiteDirectionV1 | null
}

export interface AutonomousSiteBuilderResult {
  ok: boolean

  architecture: OrvenixSiteArchitecture

  selectedTemplate: RankedTemplate | null

  tree: EditorTree

  quality: OrvenixAIQualityReport

  repaired: boolean

  warnings: string[]

  trace: string[]
}

export interface AutonomousMultiPageSiteBuilderResult {
  ok: boolean

  architecture: OrvenixSiteArchitecture

  selectedTemplate: null

  plan: SiteCreationPlanV2

  planHash: string

  byteLength: number

  pageQuality: Array<{
    slug: string
    score: number
  }>

  repaired: boolean

  warnings: string[]

  trace: string[]
}
