import type { CommerceProductFactV1, StoreProductRecordV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import type { EditorTree } from "@/types/editor"
import type { DesignPlannerPriorV1 } from "@/lib/orvenix-ai/design-memory/planner-prior"
import type { CompositionMemoryV1, CrossGenerationNoveltyV1, SiteCompositionNoveltyV1 } from "@/lib/orvenix-ai/design-memory/composition-memory"
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
import type { AssetProvider } from "@/lib/orvenix-ai/assets/types"
import type { CommerceArchitectureResolveModeV1 } from "@/lib/orvenix-ai/commerce/architecture"
import type { FullSiteCreativeBlueprintProviderV1, FullSiteCreativeLifecycleV1 } from "@/lib/orvenix-ai/full-site-generation/contract"

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

  /**
   * V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products.
   * COMMERCE-1: may carry grounded PRESENTATION commerce facts (category/variants/price);
   * the builder re-normalizes this list and strips any store binding, so it can never
   * yield an executable product -- see `commerceStoreBinding` below for that.
   */
  products?: CommerceProductFactV1[]

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

  /**
   * CF-4C: the owner's composition memory (derived from their own recent
   * DesignGeneration rows). Only conditions full-site motif retrieval as a
   * soft prior; absent -> exact CF-4B behavior.
   */
  compositionMemory?: CompositionMemoryV1 | null

  /**
   * CF-4D: LAZY owner-scoped memory loader (the action binds it to the
   * authenticated user). Invoked ONLY inside the full-site creative branch
   * (provider configured + eligible commerce request) -- the one place
   * memory is causal -- so deterministic generation never reads Design
   * Memory. Best-effort: bounded time, errors/malformed -> no memory.
   */
  compositionMemoryLoader?: () => Promise<CompositionMemoryV1 | null | undefined>

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

  /**
   * ASSISTED-4A: optional stock-photo provider override for trusted
   * server-side callers (dev comparison harness / tests). Absent (the
   * default, and what app/actions/ai.ts does) -> createPexelsProvider(),
   * unchanged. A provider whose isAvailable() is false keeps today's
   * src:"" placeholder behavior with zero asset network calls.
   */
  assetProvider?: AssetProvider

  /**
   * COMMERCE-1: TRUSTED server-side store binding. Already-fetched
   * Product/ProductVariant rows for the site being generated (this
   * builder never queries the DB). The builder turns them into BOUND
   * executable product facts ONLY via bindStoreProductRecordsV1 (active
   * products of `siteId` only, real ids copied verbatim), which compile to
   * the existing `store-product-card` + cart shell. Absent (the default,
   * and what app/actions/ai.ts does) -> products stay presentation-only.
   * Never reachable from a browser payload: the customer-facing action has
   * no such field.
   */
  commerceStore?: {
    siteId: string
    records: StoreProductRecordV1[]
  }

  /**
   * COMMERCE-2A: TRUSTED server-side new-store intent (set by
   * app/actions/ai.ts only after its own ecommerce-entitlement check; the
   * customer payload has no such field). Produces a hash-covered
   * CommerceProvisioningPlanV1 in the preview plan + PENDING cards; the
   * builder itself never writes anything.
   */
  commerceProvisioning?: { mode: "new_store" }

  /**
   * COMMERCE-3: optional, trusted/test-only commerce architecture seam.
   * Absent -> deterministic bounded commerce architect. "mock-ai" accepts
   * an untrusted proposal only through the same local grounding validator;
   * invalid proposals fall back deterministically and never block site
   * generation. No browser payload can set this today.
   */
  commerceArchitecture?: {
    mode?: CommerceArchitectureResolveModeV1
    proposal?: unknown
    /**
     * FULL-SITE-4A: TRUSTED server-side Full-Site Creative provider (mock
     * or real). When present the builder asks it for ONE blueprint through
     * generateFullSiteCreativeBlueprintV1 (validator authoritative), then
     * through the commerce adapter's own grounding; any failure falls back
     * to the deterministic commerce architect. Not reachable from the
     * customer action (app/actions/ai.ts never sets it).
     */
    provider?: FullSiteCreativeBlueprintProviderV1
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

  /**
   * FULL-SITE-4A: sibling diagnostic (never inside the plan). `disabled`
   * whenever no trusted provider was supplied. `commerceFallbackApplied`
   * is true when the provider's blueprint passed the generic validator but
   * the commerce adapter still rejected it (deterministic plan used).
   */
  fullSiteCreative: {
    lifecycle: FullSiteCreativeLifecycleV1
    commerceFallbackApplied: boolean
    /** CF-4D: diagnostic-only structural novelty of an APPLIED provider site (never blocks, retries or mutates). */
    novelty?: SiteCompositionNoveltyV1 & { crossGeneration?: CrossGenerationNoveltyV1 }
  }

  pageQuality: Array<{
    slug: string
    score: number
  }>

  repaired: boolean

  warnings: string[]

  trace: string[]
}
