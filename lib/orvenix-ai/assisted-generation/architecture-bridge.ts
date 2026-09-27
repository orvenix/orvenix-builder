import type { OrvenixSiteArchitecture, OrvenixSitePagePlan, OrvenixSiteSectionPlan, SectionRole } from "@/lib/orvenix-ai/architect"
import type { CompositionPlan } from "@/lib/orvenix-ai/architect/composition-plan"
import {
  groundAssistedSiteGenerationProposalV1,
  type AssistedGenerationGroundingContextV1,
} from "./planner-adapter"
import {
  ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION,
  ASSISTED_SITE_GENERATION_ROLE_KEY_V1,
  ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1,
  type AssistedSiteGenerationProposalV1,
} from "./contract"
import { createDeterministicAssistedSiteGenerationProviderV1 } from "./testing-provider"
import { createAssistedGenerationFingerprintV1 } from "./fingerprint"
import type { AssistedSiteGenerationProviderV1 } from "./contract"
import {
  ASSISTED_SITE_GENERATION_ANTHROPIC_MODEL_KEY_V1,
  ASSISTED_SITE_GENERATION_ANTHROPIC_PROVIDER_KEY_V1,
  AssistedSiteGenerationAnthropicTimeoutErrorV1,
  createAnthropicAssistedSiteGenerationProviderV1,
} from "./anthropic-provider"
import { buildAssistedSiteGenerationRequestContextV1 } from "./request-context"
import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import type { CreativeDesignReferenceV1 } from "@/lib/orvenix-ai/creative-director/reference-context"

/**
 * ASSISTED-2B: the ONLY glue between the already-built, already-tested
 * ASSISTED-2A contract (contract.ts/validator.ts/planner-adapter.ts/
 * fingerprint.ts/testing-provider.ts -- none of that is re-implemented or
 * modified here) and the REAL site-creation pipeline
 * (lib/orvenix-ai/autonomous/site-builder.ts).
 *
 * Real flow this module sits in (see site-builder.ts for the exact call
 * site): normalized business facts -> Creative Director (existing,
 * untouched) -> architecture -> [THIS MODULE: validate + closed-world
 * ground + CompositionPlan] -> compileSiteBlueprint (existing, untouched)
 * -> ... -> SiteCreationPlanV2 (unchanged shape) -> Quality Gate/Preview
 * V2 (existing, untouched).
 *
 * Safety contract:
 *   - mode "off" (the default): never invokes the provider, returns the
 *     architecture completely unchanged.
 *   - mode "deterministic": invokes ONLY
 *     createDeterministicAssistedSiteGenerationProviderV1 (ASSISTED-2A) --
 *     never Anthropic/Gemini/any network call.
 *   - mode "anthropic" (ASSISTED-3B, explicit trusted callers ONLY -- the
 *     env resolver can never return it): bounded request context
 *     (request-context.ts) -> ASSISTED-3A provider -> the SAME validate +
 *     grounding + CompositionPlan path as "deterministic". No
 *     Anthropic-specific compiler path exists.
 *   - `resolveAssistedSiteGenerationV1` NEVER throws: any failure
 *     (provider error, malformed proposal, closed-world grounding
 *     rejection) resolves to the ORIGINAL, unmodified architecture plus a
 *     bounded lifecycle record -- the caller can always proceed exactly
 *     as if this module did not exist.
 */

/**
 * GLOBAL/default mode -- the ONLY type the environment resolver below can
 * ever return. Deliberately does NOT include "anthropic": a paid, external
 * provider must never become reachable for every normal site-creation
 * request merely because an env var was set (ASSISTED-3B).
 */
export type AssistedGenerationModeV1 = "off" | "deterministic"

/**
 * EXPLICIT/internal mode -- what a TRUSTED server-side caller of
 * runAutonomousMultiPageSiteBuilder may request for ONE generation.
 * "anthropic" is only reachable through this type, never through
 * resolveAssistedGenerationModeV1(). app/actions/ai.ts (the only
 * customer-reachable caller, a "use server" action) passes the global
 * resolver's result only, and its public input contract has no field that
 * can select a mode at all.
 */
export type AssistedGenerationExplicitModeV1 = AssistedGenerationModeV1 | "anthropic"

/**
 * Explicit, bounded enablement -- an env var, checked once, exactly the
 * same convention as isCreativeDirectorEnabledV1
 * (site-creation/creative-direction.ts): default OFF, a single string-
 * equality check, no DB migration/code change needed to flip it in a
 * controlled environment. Any value other than the literal string
 * "deterministic" resolves to "off" -- INCLUDING "anthropic", on purpose
 * (see AssistedGenerationModeV1 above).
 */
export function resolveAssistedGenerationModeV1(): AssistedGenerationModeV1 {
  return process.env.ORVENIX_ASSISTED_GENERATION_MODE === "deterministic" ? "deterministic" : "off"
}

export type AssistedGenerationProviderIdentityV1 =
  | { providerKey: "deterministic"; modelKey: "assisted_deterministic_v1" }
  | {
      providerKey: typeof ASSISTED_SITE_GENERATION_ANTHROPIC_PROVIDER_KEY_V1
      modelKey: typeof ASSISTED_SITE_GENERATION_ANTHROPIC_MODEL_KEY_V1
    }

const DETERMINISTIC_IDENTITY = {
  providerKey: "deterministic",
  modelKey: "assisted_deterministic_v1",
} as const satisfies AssistedGenerationProviderIdentityV1

const ANTHROPIC_IDENTITY = {
  providerKey: ASSISTED_SITE_GENERATION_ANTHROPIC_PROVIDER_KEY_V1,
  modelKey: ASSISTED_SITE_GENERATION_ANTHROPIC_MODEL_KEY_V1,
} as const satisfies AssistedGenerationProviderIdentityV1

/** Bridge-level hard ceiling for the anthropic branch, above the SDK's own 12s timeout. */
const DEFAULT_ANTHROPIC_BRIDGE_TIMEOUT_MS = 20_000

/**
 * In-memory only (not persisted in this phase). Never carries credentials,
 * the raw request context, or the raw provider response -- only
 * fingerprints, bounded reason strings, and (when accepted) the
 * already-validated normalized proposal.
 */
export type AssistedGenerationLifecycleRecordV1 =
  | { status: "disabled" }
  | (AssistedGenerationProviderIdentityV1 & {
      status: "applied"
      inputFingerprint: string
      outputFingerprint: string
      warnings: string[]
      /** Per-page grounding rejections of a PARTIALLY accepted proposal (empty when fully accepted). */
      rejectedReasons: string[]
      normalizedProposal: AssistedSiteGenerationProposalV1
    })
  | (AssistedGenerationProviderIdentityV1 & {
      status: "rejected"
      inputFingerprint: string
      warnings: string[]
      reasons: string[]
    })
  | (AssistedGenerationProviderIdentityV1 & {
      status: "failed"
      inputFingerprint?: string
      reasons: string[]
    })

/**
 * A trivial, provably-safe "confirm the current architecture" proposal:
 * no `instances`/`sectionOrder` for any page, so the ASSISTED-2A grounder's
 * own `buildDefaultPagePlan` produces one "all"-mode instance per
 * EXISTING role, in the SAME order -- structurally a no-op (see
 * architecture-bridge tests: applying it changes nothing observable).
 * Used whenever mode is "deterministic" but no explicit proposal was
 * supplied, so the full provider->validate->ground->apply plumbing still
 * runs end-to-end without inventing any new planning intelligence here.
 */
export function buildDefaultAssistedSiteGenerationProposalV1(architecture: OrvenixSiteArchitecture): AssistedSiteGenerationProposalV1 {
  return {
    version: ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION,
    roleKey: ASSISTED_SITE_GENERATION_ROLE_KEY_V1,
    strategyKey: ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1,
    pages: architecture.pages.map((page) => ({ slug: page.slug })),
  }
}

function purposeForAssistedInstance(role: SectionRole): string {
  return `Sección asistida: ${role}`
}

/**
 * Replaces `sections` for every page the (already validated + grounded)
 * CompositionPlan covers, building one `OrvenixSiteSectionPlan` per
 * instance (role, blockType: null so it always reaches the real composer
 * engine -- no registered block can express per-item selection/layout
 * directives anyway, and the real production caller already sets
 * `forceFreshComposition: true`, which makes this a no-op there). Pages
 * the plan does NOT cover (rejected, or simply absent from the proposal)
 * are returned completely untouched -- additive only, never destructive
 * beyond what ASSISTED-2A's own grounding already accepted.
 */
export function applyCompositionPlanToArchitectureV1(
  architecture: OrvenixSiteArchitecture,
  compositionPlan: CompositionPlan,
): OrvenixSiteArchitecture {
  const plansBySlug = new Map(compositionPlan.pages.map((page) => [page.slug, page]))

  return {
    ...architecture,
    pages: architecture.pages.map((page): OrvenixSitePagePlan => {
      const pagePlan = plansBySlug.get(page.slug)
      if (!pagePlan) return page

      return {
        ...page,
        sections: pagePlan.instances.map((instance): OrvenixSiteSectionPlan => ({
          role: instance.role,
          blockType: null,
          purpose: purposeForAssistedInstance(instance.role),
          instance,
        })),
      }
    }),
  }
}

export interface ResolveAssistedGenerationParamsV1 {
  mode: AssistedGenerationExplicitModeV1 | undefined
  architecture: OrvenixSiteArchitecture
  /** Deterministic mode only. Untrusted/dynamic input, exactly like a real provider response would be. Absent -> the safe, structurally-neutral default proposal above. */
  proposal?: unknown
  /** Anthropic mode only: already-validated Creative Director direction (narrowed again by the request-context builder). */
  creativeDirection?: CreativeSiteDirectionV1 | null
  /** Anthropic mode only: already-sanitized Design Reference context. */
  designReferences?: CreativeDesignReferenceV1[]
  /**
   * Anthropic mode only: injection seam for tests/trusted harnesses. Absent
   * -> the real ASSISTED-3A provider, instantiated only when a credential
   * is configured (presence check only -- its value is never read here).
   */
  provider?: AssistedSiteGenerationProviderV1
  /** Anthropic mode only: bridge-level hard ceiling. */
  timeoutMs?: number
}

export interface ResolveAssistedGenerationResultV1 {
  architecture: OrvenixSiteArchitecture
  lifecycle: AssistedGenerationLifecycleRecordV1
}

/**
 * The single shared authority path for EVERY provider: the raw, untrusted
 * response goes through the SAME ASSISTED-2A validate + closed-world
 * grounding (groundAssistedSiteGenerationProposalV1 calls
 * validateAssistedSiteGenerationProposalV1 itself), and only an accepted
 * CompositionPlan is ever applied to the architecture.
 */
function groundAndApplyAssistedResponse(params: {
  rawResponse: unknown
  architecture: OrvenixSiteArchitecture
  identity: AssistedGenerationProviderIdentityV1
  inputFingerprint: string
}): ResolveAssistedGenerationResultV1 {
  const groundingContext: AssistedGenerationGroundingContextV1 = {
    pages: params.architecture.pages.map((page) => ({
      slug: page.slug,
      roles: page.sections.map((section) => section.role),
    })),
    servicesCount: params.architecture.services?.length ?? 0,
    productsCount: params.architecture.products?.length ?? 0,
  }

  const grounded = groundAssistedSiteGenerationProposalV1({ proposal: params.rawResponse, context: groundingContext })

  if (grounded.accepted === false) {
    return {
      architecture: params.architecture,
      lifecycle: {
        status: "rejected",
        ...params.identity,
        inputFingerprint: params.inputFingerprint,
        warnings: grounded.warnings,
        reasons: grounded.rejectedReasons,
      },
    }
  }

  const outputFingerprint = createAssistedGenerationFingerprintV1(grounded.normalizedProposal)
  const appliedArchitecture = applyCompositionPlanToArchitectureV1(params.architecture, grounded.compositionPlan)

  return {
    architecture: appliedArchitecture,
    lifecycle: {
      status: "applied",
      ...params.identity,
      inputFingerprint: params.inputFingerprint,
      outputFingerprint,
      warnings: grounded.warnings,
      rejectedReasons: grounded.rejectedReasons,
      normalizedProposal: grounded.normalizedProposal,
    },
  }
}

async function resolveDeterministicAssistedSiteGenerationV1(
  params: ResolveAssistedGenerationParamsV1,
): Promise<ResolveAssistedGenerationResultV1> {
  try {
    const proposalInput = params.proposal ?? buildDefaultAssistedSiteGenerationProposalV1(params.architecture)
    const inputFingerprint = createAssistedGenerationFingerprintV1(proposalInput)

    const provider = createDeterministicAssistedSiteGenerationProviderV1(proposalInput)
    const rawResponse = await provider.request(proposalInput)

    return groundAndApplyAssistedResponse({
      rawResponse,
      architecture: params.architecture,
      identity: DETERMINISTIC_IDENTITY,
      inputFingerprint,
    })
  } catch (error) {
    return {
      architecture: params.architecture,
      lifecycle: {
        status: "failed",
        ...DETERMINISTIC_IDENTITY,
        reasons: [error instanceof Error ? error.message : "assisted_generation_unknown_error"],
      },
    }
  }
}

function hasAnthropicCredentialConfiguredV1(): boolean {
  // Presence only -- the value is never read, compared, logged or returned.
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

async function withBridgeTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AssistedSiteGenerationAnthropicTimeoutErrorV1()), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * ASSISTED-3B: explicit, trusted-caller-only branch. Every failure mode
 * (no credential, provider exception, timeout, empty/non-JSON response,
 * schema-invalid or grounding-invalid proposal) resolves to the ORIGINAL
 * architecture -- normal Orvenix generation always proceeds. No retry.
 * Reasons are bounded codes: raw provider error messages never reach the
 * lifecycle record.
 */
async function resolveAnthropicAssistedSiteGenerationV1(
  params: ResolveAssistedGenerationParamsV1,
): Promise<ResolveAssistedGenerationResultV1> {
  let inputFingerprint: string | undefined

  try {
    const requestContext = buildAssistedSiteGenerationRequestContextV1({
      architecture: params.architecture,
      creativeDirection: params.creativeDirection,
      designReferences: params.designReferences,
    })
    inputFingerprint = createAssistedGenerationFingerprintV1(requestContext)

    if (!params.provider && !hasAnthropicCredentialConfiguredV1()) {
      return {
        architecture: params.architecture,
        lifecycle: { status: "failed", ...ANTHROPIC_IDENTITY, inputFingerprint, reasons: ["assisted_generation_provider_unavailable"] },
      }
    }

    const provider = params.provider ?? createAnthropicAssistedSiteGenerationProviderV1()
    const rawResponse = await withBridgeTimeout(
      provider.request(requestContext),
      params.timeoutMs ?? DEFAULT_ANTHROPIC_BRIDGE_TIMEOUT_MS,
    )

    if (rawResponse === null || rawResponse === undefined) {
      return {
        architecture: params.architecture,
        lifecycle: { status: "failed", ...ANTHROPIC_IDENTITY, inputFingerprint, reasons: ["assisted_generation_provider_empty_response"] },
      }
    }

    return groundAndApplyAssistedResponse({
      rawResponse,
      architecture: params.architecture,
      identity: ANTHROPIC_IDENTITY,
      inputFingerprint,
    })
  } catch (error) {
    const reason = error instanceof AssistedSiteGenerationAnthropicTimeoutErrorV1
      ? "assisted_generation_provider_timeout"
      : "assisted_generation_provider_error"
    return {
      architecture: params.architecture,
      lifecycle: {
        status: "failed",
        ...ANTHROPIC_IDENTITY,
        ...(inputFingerprint ? { inputFingerprint } : {}),
        reasons: [reason],
      },
    }
  }
}

/**
 * The ONE function autonomous/site-builder.ts calls, right before its own
 * compileSiteBlueprint invocation. See this file's header comment for the
 * full safety contract.
 */
export async function resolveAssistedSiteGenerationV1(
  params: ResolveAssistedGenerationParamsV1,
): Promise<ResolveAssistedGenerationResultV1> {
  const mode = params.mode ?? "off"

  if (mode === "deterministic") return resolveDeterministicAssistedSiteGenerationV1(params)
  if (mode === "anthropic") return resolveAnthropicAssistedSiteGenerationV1(params)

  return { architecture: params.architecture, lifecycle: { status: "disabled" } }
}
