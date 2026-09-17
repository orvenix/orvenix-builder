import {
  createDesignPlannerPriorV1,
  createDesignPatternSelectionTargetV1,
  getDesignPatternRankingV1,
  selectDesignPatternV1,
  type DesignPlannerPriorV1,
} from "@/lib/orvenix-ai/design-memory"
import {
  bucketIndustry,
  bucketObjective,
  bucketStyle,
} from "@/lib/orvenix-ai/design-memory/design-pattern"
import { buildSiteArchitecture } from "@/lib/orvenix-ai/architect"
import {
  runDesignAssistanceV1,
  validateDesignAssistanceProposalV1,
  type DecideDesignAssistanceProposalInputV1,
  type DesignAssistanceLifecycleClientV1,
  type DesignAssistanceProviderV1,
  type DesignAssistanceRequestV1,
  type DesignAssistanceThemeDirectionV1,
  type RunDesignAssistanceResultV1,
} from "@/lib/orvenix-ai/assistance"

export type SiteCreationDesignMemoryBusinessInput = {
  name?: string | null
  industry?: string | null
  description?: string | null
  location?: string | null
  objective?: string | null
}

export type SiteCreationAssistanceContextV1 = {
  industryBucket: DesignAssistanceRequestV1["context"]["industryBucket"]
  objectiveBucket: DesignAssistanceRequestV1["context"]["objectiveBucket"]
  styleBucket: DesignAssistanceRequestV1["context"]["styleBucket"]
  siteType: string | null
}

export type SiteCreationDesignMemoryDecisionV1 =
  | {
      kind: "L2"
      designMemoryPrior: DesignPlannerPriorV1
      context: SiteCreationAssistanceContextV1
      reason: string[]
    }
  | {
      kind: "L1"
      designMemoryPrior: DesignPlannerPriorV1
      context: SiteCreationAssistanceContextV1
      reason: string[]
    }
  | {
      kind: "abstain"
      designMemoryPrior: null
      context: SiteCreationAssistanceContextV1
      reasonCode: string
      reason: string[]
    }
  | {
      kind: "unavailable"
      designMemoryPrior: null
      context: SiteCreationAssistanceContextV1
      reason: string[]
    }

export type SiteCreationThemeAssistanceEligibilityV1 =
  | { eligible: true; reason: "l1_contextual_prior" | "no_qualified_memory_theme" | "memory_unavailable" }
  | { eligible: false; reason: "disabled" | "qualified_design_memory_l2" }

export type SiteCreationExternalThemeAdvisoryV1 = {
  version: 1
  source: "third_party_assistance"
  assistanceId: string
  providerKey: string
  modelKey: string
  theme: DesignAssistanceThemeDirectionV1
}

export type ResolveSiteCreationThemeAssistanceInputV1 = {
  userId: string
  siteCreationAttemptId: string
  designMemoryDecision: SiteCreationDesignMemoryDecisionV1
  preferredStyleExplicit: boolean
  provider?: DesignAssistanceProviderV1 | null
  providerKey?: string
  modelKey?: string
  enabled?: boolean
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}

export type ResolveSiteCreationThemeAssistanceResultV1 =
  | {
      ok: true
      status: "applied"
      advisory: SiteCreationExternalThemeAdvisoryV1
      assistanceId: string
      request: DesignAssistanceRequestV1
      assistance: RunDesignAssistanceResultV1
    }
  | {
      ok: true
      status: "skipped"
      reason: SiteCreationThemeAssistanceEligibilityV1["reason"] | "provider_unavailable"
    }
  | {
      ok: true
      status: "fallback"
      reason: "rejected" | "failed" | "orchestration_error" | "integrity_error"
      assistance?: RunDesignAssistanceResultV1
    }

const PROVIDER_KEY = "orvenix_disabled_v1"
const MODEL_KEY = "theme_direction_advisor_v1"

function normalizeSiteType(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 64)
  return normalized || null
}

function normalizeContextBucket<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? value as T : null
}

function buildContext(params: {
  business: SiteCreationDesignMemoryBusinessInput
  preferredStyle: string
  request: string
}): SiteCreationAssistanceContextV1 {
  const architecture = buildSiteArchitecture({
    request: params.request,
    business: {
      name: params.business.name ?? undefined,
      industry: params.business.industry ?? undefined,
      description: params.business.description ?? undefined,
      location: params.business.location ?? undefined,
      objective: params.business.objective ?? undefined,
    },
  })

  return {
    industryBucket: normalizeContextBucket(bucketIndustry(params.business.industry), ["health", "restaurant", "agency", "ecommerce", "other"] as const),
    objectiveBucket: normalizeContextBucket(bucketObjective(params.business.objective), ["lead_generation", "sales", "brand_trust", "education", "other"] as const),
    styleBucket: normalizeContextBucket(bucketStyle(params.preferredStyle), ["premium", "minimal", "modern", "warm", "professional", "other"] as const),
    siteType: normalizeSiteType(architecture.siteType),
  }
}

export async function resolveSiteCreationDesignMemoryDecisionV1(params: {
  request: string
  business: SiteCreationDesignMemoryBusinessInput
  preferredStyle: string
  preferredStyleExplicit: boolean
}): Promise<SiteCreationDesignMemoryDecisionV1> {
  const context = buildContext(params)

  try {
    const target = createDesignPatternSelectionTargetV1({
      context: {
        industryBucket: context.industryBucket,
        siteType: context.siteType,
        objectiveBucket: context.objectiveBucket,
        styleBucket: context.styleBucket,
      },
    })

    const [l1Ranking, l2Ranking] = await Promise.all([
      getDesignPatternRankingV1({ level: "L1" }),
      getDesignPatternRankingV1({ level: "L2" }),
    ])

    if (!l1Ranking.ok || !l2Ranking.ok) {
      return {
        kind: "unavailable",
        designMemoryPrior: null,
        context,
        reason: ["Design Memory ranking unavailable."],
      }
    }

    const selection = selectDesignPatternV1({
      target,
      l1Rankings: l1Ranking.rankings,
      l2Rankings: l2Ranking.rankings,
      constraints: {
        preserveStyle: params.preferredStyleExplicit,
      },
    })

    const designMemoryPrior = createDesignPlannerPriorV1({ selection })

    if (designMemoryPrior?.level === "L2") {
      return {
        kind: "L2",
        designMemoryPrior,
        context,
        reason: designMemoryPrior.reason,
      }
    }

    if (designMemoryPrior?.level === "L1") {
      return {
        kind: "L1",
        designMemoryPrior,
        context,
        reason: designMemoryPrior.reason,
      }
    }

    return {
      kind: "abstain",
      designMemoryPrior: null,
      context,
      reasonCode: selection.decision === "abstain" ? selection.reasonCode : "insufficient_evidence",
      reason: selection.reason,
    }
  } catch (error) {
    console.error("[Orvenix Design Memory] No se pudo resolver decision rica para Site Creation:", error)
    return {
      kind: "unavailable",
      designMemoryPrior: null,
      context,
      reason: ["Design Memory decision failed."],
    }
  }
}

export function decideSiteCreationThemeAssistanceEligibilityV1(params: {
  designMemoryDecision: SiteCreationDesignMemoryDecisionV1
  enabled?: boolean
}): SiteCreationThemeAssistanceEligibilityV1 {
  if (params.enabled !== true) return { eligible: false, reason: "disabled" }
  if (params.designMemoryDecision.kind === "L2") return { eligible: false, reason: "qualified_design_memory_l2" }
  if (params.designMemoryDecision.kind === "L1") return { eligible: true, reason: "l1_contextual_prior" }
  if (params.designMemoryDecision.kind === "unavailable") return { eligible: true, reason: "memory_unavailable" }
  return { eligible: true, reason: "no_qualified_memory_theme" }
}

export function buildSiteCreationThemeAssistanceRequestV1(params: {
  context: SiteCreationAssistanceContextV1
  preferredStyleExplicit: boolean
  preserveTheme?: boolean
  theme?: DesignAssistanceThemeDirectionV1 | null
}): DesignAssistanceRequestV1 {
  const constraints: NonNullable<DesignAssistanceRequestV1["constraints"]> = {}
  if (params.preferredStyleExplicit) constraints.preserveStyle = true
  if (params.preserveTheme === true && params.theme) {
    constraints.preserveTheme = true
    constraints.theme = structuredClone(params.theme)
  }

  return {
    version: 1,
    roleKey: "theme_direction_advisor_v1",
    strategyKey: "theme_bucket_recommendation_v1",
    context: structuredClone(params.context),
    ...(Object.keys(constraints).length ? { constraints } : {}),
  }
}

export function decideSiteCreationThemeAssistanceProposalV1(
  input: DecideDesignAssistanceProposalInputV1,
) {
  const validation = validateDesignAssistanceProposalV1(input.proposal)
  if (validation.ok === false) return { decision: "reject" as const }
  if (validation.value.roleKey !== input.request.roleKey) return { decision: "reject" as const }
  if (validation.value.strategyKey !== input.request.strategyKey) return { decision: "reject" as const }
  return { decision: "apply" as const }
}

export function adaptSiteCreationThemeAssistanceProposalV1(params: {
  assistanceId: string
  providerKey: string
  modelKey: string
  proposal: { theme: DesignAssistanceThemeDirectionV1 }
}): SiteCreationExternalThemeAdvisoryV1 {
  return {
    version: 1,
    source: "third_party_assistance",
    assistanceId: params.assistanceId,
    providerKey: params.providerKey,
    modelKey: params.modelKey,
    theme: structuredClone(params.proposal.theme),
  }
}

export async function resolveSiteCreationThemeAssistanceAdvisoryV1(
  input: ResolveSiteCreationThemeAssistanceInputV1,
): Promise<ResolveSiteCreationThemeAssistanceResultV1> {
  const eligibility = decideSiteCreationThemeAssistanceEligibilityV1({
    designMemoryDecision: input.designMemoryDecision,
    enabled: input.enabled,
  })

  if (!eligibility.eligible) {
    return { ok: true, status: "skipped", reason: eligibility.reason }
  }

  if (!input.provider) {
    return { ok: true, status: "skipped", reason: "provider_unavailable" }
  }

  const providerKey = input.providerKey ?? PROVIDER_KEY
  const modelKey = input.modelKey ?? MODEL_KEY
  const request = buildSiteCreationThemeAssistanceRequestV1({
    context: input.designMemoryDecision.context,
    preferredStyleExplicit: input.preferredStyleExplicit,
  })

  try {
    const assistance = await runDesignAssistanceV1({
      userId: input.userId,
      siteCreationAttemptId: input.siteCreationAttemptId,
      attemptKey: `site_creation:${input.siteCreationAttemptId}`,
      request,
      provider: input.provider,
      providerKey,
      modelKey,
      decideProposal: decideSiteCreationThemeAssistanceProposalV1,
      lifecycleClient: input.lifecycleClient,
    })

    if (assistance.ok === true && assistance.status === "applied" && assistance.proposal) {
      return {
        ok: true,
        status: "applied",
        advisory: adaptSiteCreationThemeAssistanceProposalV1({
          assistanceId: assistance.assistanceId,
          providerKey,
          modelKey,
          proposal: assistance.proposal,
        }),
        assistanceId: assistance.assistanceId,
        request,
        assistance,
      }
    }

    if (assistance.ok === true && assistance.status === "rejected") {
      return { ok: true, status: "fallback", reason: "rejected", assistance }
    }

    if (assistance.ok === true && assistance.status === "failed") {
      return { ok: true, status: "fallback", reason: "failed", assistance }
    }

    const reason = "error" in assistance && assistance.error === "terminal_transition_failed"
      ? "integrity_error"
      : "orchestration_error"

    return { ok: true, status: "fallback", reason, assistance }
  } catch (error) {
    console.error("[Orvenix Assistance] Site Creation assistance fallback:", error)
    return { ok: true, status: "fallback", reason: "orchestration_error" }
  }
}
