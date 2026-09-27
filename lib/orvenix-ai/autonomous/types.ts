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
  AssistedGenerationExplicitModeV1,
  AssistedGenerationLifecycleRecordV1,
} from "@/lib/orvenix-ai/assisted-generation/architecture-bridge"
import type { AssistedSiteGenerationProviderV1 } from "@/lib/orvenix-ai/assisted-generation/contract"
import type { CreativeDesignReferenceV1 } from "@/lib/orvenix-ai/creative-director/reference-context"

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

  /**
   * ASSISTED-2B: optional, bounded Assisted Generation V1 gate. Absent or
   * "off" (the default) -> behavior is completely unchanged, the
   * assisted-generation provider is never invoked. "deterministic" runs
   * ONLY the ASSISTED-2A deterministic testing provider (never a real
   * network call) through validate + closed-world grounding, and any
   * failure at any stage falls back automatically to the unmodified
   * architecture -- see lib/orvenix-ai/assisted-generation/architecture-bridge.ts.
   *
   * ASSISTED-3B: "anthropic" is an EXPLICIT, per-generation choice for
   * trusted server-side callers only (this builder is plain server code,
   * not a server action -- it is unreachable from a browser payload).
   * Authorization is the caller's responsibility: app/actions/ai.ts only
   * ever forwards resolveAssistedGenerationModeV1() ("off" |
   * "deterministic"), so no customer request can reach Anthropic here.
   */
  assistedGeneration?: {
    mode?: AssistedGenerationExplicitModeV1
    /** Untrusted/dynamic input for the deterministic provider. Absent -> a safe, structurally-neutral default proposal. */
    proposal?: unknown
    /** Anthropic mode only: already-sanitized Design Reference context for the bounded request context. */
    designReferences?: CreativeDesignReferenceV1[]
    /** Anthropic mode only: provider injection seam (tests / trusted harness). Absent -> the real ASSISTED-3A provider. */
    provider?: AssistedSiteGenerationProviderV1
    /** Anthropic mode only: bridge-level hard timeout override. */
    timeoutMs?: number
  }
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

  /**
   * ASSISTED-2B: bounded, in-memory lifecycle record for this run's
   * Assisted Generation step (see assisted-generation/architecture-bridge.ts).
   * Never affects `plan`'s shape (SiteCreationPlanV2 is unchanged) -- this
   * is a sibling diagnostic field, exactly like `qualityGate` rides
   * alongside (not inside) the plan at the app/actions/ai.ts layer.
   * Always present: `{status: "disabled"}` whenever assistedGeneration
   * was absent/"off".
   */
  assistedGeneration: AssistedGenerationLifecycleRecordV1

  pageQuality: Array<{
    slug: string
    score: number
  }>

  repaired: boolean

  warnings: string[]

  trace: string[]
}
