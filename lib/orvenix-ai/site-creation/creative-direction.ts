import type { OrvenixSiteArchitecture } from "@/lib/orvenix-ai/architect"
import {
  runCreativeDirectorV1,
  type CreativeDirectorDecisionV1,
  type DecideCreativeDirectionInputV1,
} from "@/lib/orvenix-ai/creative-director/orchestrator"
import { validateCreativeSiteDirectionV1, type CreativeDirectorProviderV1, type CreativeDirectorRequestV1, type CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import { sanitizeCreativeSiteDirectionV1, type RealFactsV1 } from "@/lib/orvenix-ai/creative-director/fact-validation"
import { buildDesignReferenceRetrievalQueryV1 } from "@/lib/orvenix-ai/creative-director/retrieval-query"
import { buildCreativeDirectorReferenceContextV1 } from "@/lib/orvenix-ai/creative-director/reference-context"
import { retrieveDesignReferences } from "@/lib/orvenix-ai/design-reference/retrieve"
import type { DesignAssistanceLifecycleClientV1 } from "@/lib/orvenix-ai/assistance/lifecycle"
import type { SiteCreationDesignMemoryDecisionV1 } from "./assistance"
import type { BusinessEvidenceSummaryV1 } from "./evidence-normalization"

/**
 * V2-4: mirrors site-creation/assistance.ts's Design-Memory-eligibility ->
 * orchestrate -> fallback pattern, retargeted at the Creative Director.
 * Kept as a SEPARATE integration file (not folded into assistance.ts)
 * since the two roles' eligibility/sanitization concerns differ enough to
 * warrant independent review.
 */

const MAX_OFFERINGS_SENT = 8

export type CreativeDirectorEligibilityV1 =
  | { eligible: true }
  | { eligible: false; reason: "disabled" | "qualified_design_memory_l2" | "missing_api_key" }

/**
 * V2-4 section 11: explicit, bounded enablement -- an env var, checked
 * once, here. No DB migration, no code change needed to flip it for a
 * controlled E2E environment; default is OFF (deterministic fallback).
 */
export function isCreativeDirectorEnabledV1(): boolean {
  return process.env.ORVENIX_CREATIVE_DIRECTOR_ENABLED === "true"
}

export function decideCreativeDirectorEligibilityV1(params: {
  designMemoryDecision: SiteCreationDesignMemoryDecisionV1
  enabled?: boolean
  hasApiKey: boolean
}): CreativeDirectorEligibilityV1 {
  const enabled = params.enabled ?? isCreativeDirectorEnabledV1()
  if (!enabled) return { eligible: false, reason: "disabled" }
  // An L2-qualified Design Memory prior is authoritative and cheaper -- skip the AI call entirely, same rule as the theme advisor.
  if (params.designMemoryDecision.kind === "L2") return { eligible: false, reason: "qualified_design_memory_l2" }
  if (!params.hasApiKey) return { eligible: false, reason: "missing_api_key" }
  return { eligible: true }
}

function boundOfferings(offerings: Array<{ name: string; description?: string }> | undefined): Array<{ name: string; description?: string }> {
  return (offerings ?? []).slice(0, MAX_OFFERINGS_SENT).map((offering) => ({
    name: offering.name.slice(0, 90),
    ...(offering.description ? { description: offering.description.slice(0, 180) } : {}),
  }))
}

export type CreativeDirectorBusinessInputV1 = {
  name?: string
  industry?: string
  location?: string
  objective?: string
  description?: string
  preferredStyle?: string
  services?: Array<{ name: string; description?: string }>
  products?: Array<{ name: string; description?: string }>
  /** V2-5F: boolean/count evidence-eligibility signal only -- see contract.ts's CreativeDirectorBusinessContextV1. */
  businessEvidenceSummary?: BusinessEvidenceSummaryV1
}

/**
 * Builds the OUTGOING request from already-normalized facts only -- no raw
 * prompt, no userId/siteId/PII (see contract.ts's PRIVATE_FIELD_NAMES,
 * which this request shape structurally cannot violate: it has no such
 * fields to begin with).
 */
export function buildCreativeDirectorRequestV1(params: {
  business: CreativeDirectorBusinessInputV1
  architecture: OrvenixSiteArchitecture
  designMemoryContext?: { industryBucket?: string | null; objectiveBucket?: string | null; styleBucket?: string | null; siteType?: string | null }
}): CreativeDirectorRequestV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    business: {
      ...(params.business.name ? { name: params.business.name.slice(0, 120) } : {}),
      ...(params.business.industry ? { industry: params.business.industry.slice(0, 120) } : {}),
      ...(params.business.location ? { location: params.business.location.slice(0, 120) } : {}),
      ...(params.business.objective ? { objective: params.business.objective.slice(0, 200) } : {}),
      ...(params.business.description ? { description: params.business.description.slice(0, 400) } : {}),
      ...(params.business.preferredStyle ? { preferredStyle: params.business.preferredStyle.slice(0, 120) } : {}),
      ...(params.business.services?.length ? { services: boundOfferings(params.business.services) } : {}),
      ...(params.business.products?.length ? { products: boundOfferings(params.business.products) } : {}),
      ...(params.business.businessEvidenceSummary ? { businessEvidenceSummary: params.business.businessEvidenceSummary } : {}),
      /*
       * V2-5G: bounded boolean/count signal only, mirroring
       * businessEvidenceSummary -- the real product names above already
       * exist for offering-grounding (realFactsByPageSlug, unchanged
       * since V2-S1), this adds no new raw commercial data.
       */
      ...(params.business.products?.length ? { hasProducts: true, productCount: params.business.products.length } : {}),
    },
    ...(params.designMemoryContext ? { designMemory: params.designMemoryContext } : {}),
    pages: params.architecture.pages.map((page) => {
      const roles = page.sections.map((section) => section.role)
      return {
        slug: page.slug,
        purpose: page.purpose,
        archetype: page.archetype,
        availableRoles: roles,
        requiredRoles: roles, // MVP: presence is not AI-adjustable, every recipe role is required (order-only)
        defaultOrder: roles,
      }
    }),
  }
}

/**
 * V2-5C: runs the accepted deterministic retrieveDesignReferences() ONCE
 * per site creative-direction request (section D) and attaches its
 * sanitized reference context to the request -- reusing `request`'s own
 * already-normalized/bounded business+pages facts to build the query
 * (retrieval-query.ts), never a raw prompt. No-op (returns `request`
 * unchanged) when retrieval returns nothing, so a request built before
 * this phase existed and a request with an empty library are
 * indistinguishable to the gateway/provider.
 */
export function attachDesignReferenceContextV1(request: CreativeDirectorRequestV1, siteType: string): CreativeDirectorRequestV1 {
  const query = buildDesignReferenceRetrievalQueryV1(request, siteType)
  const retrieval = retrieveDesignReferences(query)
  const referenceContext = buildCreativeDirectorReferenceContextV1(retrieval)
  return referenceContext.length ? { ...request, referenceContext } : request
}

export function decideCreativeDirectorProposalV1(input: DecideCreativeDirectionInputV1): CreativeDirectorDecisionV1 {
  const validation = validateCreativeSiteDirectionV1(input.proposal)
  if (validation.ok === false) return { decision: "reject" }
  if (validation.value.roleKey !== input.request.roleKey) return { decision: "reject" }
  if (validation.value.strategyKey !== input.request.strategyKey) return { decision: "reject" }
  return { decision: "apply" }
}

function realFactsByPageSlug(request: CreativeDirectorRequestV1): Map<string, RealFactsV1> {
  const offeringNames = [
    ...(request.business.services ?? []).map((s) => s.name),
    ...(request.business.products ?? []).map((p) => p.name),
  ]
  const facts: RealFactsV1 = { offeringNames }
  return new Map(request.pages.map((page) => [page.slug, facts]))
}

export type ResolveCreativeDirectionInputV1 = {
  userId: string
  siteCreationAttemptId: string
  designMemoryDecision: SiteCreationDesignMemoryDecisionV1
  business: CreativeDirectorBusinessInputV1
  architecture: OrvenixSiteArchitecture
  provider?: CreativeDirectorProviderV1 | null
  providerKey?: string
  modelKey?: string
  enabled?: boolean
  hasApiKey?: boolean
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}

export type ResolveCreativeDirectionResultV1 =
  | { ok: true; status: "applied"; direction: CreativeSiteDirectionV1; assistanceId: string }
  | { ok: true; status: "skipped"; reason: "disabled" | "qualified_design_memory_l2" | "missing_api_key" | "provider_unavailable" }
  | { ok: true; status: "fallback"; reason: "rejected" | "failed" | "orchestration_error" | "integrity_error" }

const DEFAULT_PROVIDER_KEY = "anthropic"
const DEFAULT_MODEL_KEY = "claude_haiku_4_5"

export async function resolveSiteCreationCreativeDirectionV1(
  input: ResolveCreativeDirectionInputV1,
): Promise<ResolveCreativeDirectionResultV1> {
  const eligibility = decideCreativeDirectorEligibilityV1({
    designMemoryDecision: input.designMemoryDecision,
    enabled: input.enabled,
    hasApiKey: input.hasApiKey ?? Boolean(process.env.ANTHROPIC_API_KEY),
  })

  if (eligibility.eligible === false) return { ok: true, status: "skipped", reason: eligibility.reason }
  if (!input.provider) return { ok: true, status: "skipped", reason: "provider_unavailable" }

  const baseRequest = buildCreativeDirectorRequestV1({
    business: input.business,
    architecture: input.architecture,
    // Every SiteCreationDesignMemoryDecisionV1 variant carries `context` (bucketed signals only, never raw prose).
    designMemoryContext: input.designMemoryDecision.context,
  })
  const request = attachDesignReferenceContextV1(baseRequest, input.architecture.siteType)

  try {
    const result = await runCreativeDirectorV1({
      userId: input.userId,
      siteCreationAttemptId: input.siteCreationAttemptId,
      attemptKey: `creative_director:${input.siteCreationAttemptId}`,
      request,
      provider: input.provider,
      providerKey: input.providerKey ?? DEFAULT_PROVIDER_KEY,
      modelKey: input.modelKey ?? DEFAULT_MODEL_KEY,
      decideProposal: decideCreativeDirectorProposalV1,
      lifecycleClient: input.lifecycleClient,
    })

    if (result.ok === true && result.status === "applied" && result.proposal) {
      const sanitized = sanitizeCreativeSiteDirectionV1(result.proposal, realFactsByPageSlug(request))
      return { ok: true, status: "applied", direction: sanitized, assistanceId: result.assistanceId }
    }

    if (result.ok === true && result.status === "rejected") return { ok: true, status: "fallback", reason: "rejected" }
    if (result.ok === true && result.status === "failed") return { ok: true, status: "fallback", reason: "failed" }

    const reason = "error" in result && result.error === "terminal_transition_failed" ? "integrity_error" : "orchestration_error"
    return { ok: true, status: "fallback", reason }
  } catch (error) {
    console.error("[Orvenix Creative Director] Site creation fallback:", error instanceof Error ? error.name : "unknown_error")
    return { ok: true, status: "fallback", reason: "orchestration_error" }
  }
}
