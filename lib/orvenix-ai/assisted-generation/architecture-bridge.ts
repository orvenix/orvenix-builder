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
 *   - `resolveAssistedSiteGenerationV1` NEVER throws: any failure
 *     (provider error, malformed proposal, closed-world grounding
 *     rejection) resolves to the ORIGINAL, unmodified architecture plus a
 *     bounded lifecycle record -- the caller can always proceed exactly
 *     as if this module did not exist.
 */

export type AssistedGenerationModeV1 = "off" | "deterministic"

/**
 * Explicit, bounded enablement -- an env var, checked once, exactly the
 * same convention as isCreativeDirectorEnabledV1
 * (site-creation/creative-direction.ts): default OFF, a single string-
 * equality check, no DB migration/code change needed to flip it in a
 * controlled environment. Any value other than the literal string
 * "deterministic" resolves to "off".
 */
export function resolveAssistedGenerationModeV1(): AssistedGenerationModeV1 {
  return process.env.ORVENIX_ASSISTED_GENERATION_MODE === "deterministic" ? "deterministic" : "off"
}

export type AssistedGenerationLifecycleRecordV1 =
  | { status: "disabled" }
  | {
      status: "applied"
      providerKey: "deterministic"
      modelKey: "assisted_deterministic_v1"
      inputFingerprint: string
      outputFingerprint: string
      warnings: string[]
    }
  | {
      status: "rejected"
      providerKey: "deterministic"
      modelKey: "assisted_deterministic_v1"
      inputFingerprint: string
      warnings: string[]
      reasons: string[]
    }
  | {
      status: "failed"
      providerKey: "deterministic"
      modelKey: "assisted_deterministic_v1"
      reasons: string[]
    }

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
  mode: AssistedGenerationModeV1 | undefined
  architecture: OrvenixSiteArchitecture
  /** Untrusted/dynamic input, exactly like a real provider response would be. Absent -> the safe, structurally-neutral default proposal above. */
  proposal?: unknown
}

export interface ResolveAssistedGenerationResultV1 {
  architecture: OrvenixSiteArchitecture
  lifecycle: AssistedGenerationLifecycleRecordV1
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

  if (mode !== "deterministic") {
    return { architecture: params.architecture, lifecycle: { status: "disabled" } }
  }

  try {
    const proposalInput = params.proposal ?? buildDefaultAssistedSiteGenerationProposalV1(params.architecture)
    const inputFingerprint = createAssistedGenerationFingerprintV1(proposalInput)

    const provider = createDeterministicAssistedSiteGenerationProviderV1(proposalInput)
    const rawResponse = await provider.request(proposalInput)

    const groundingContext: AssistedGenerationGroundingContextV1 = {
      pages: params.architecture.pages.map((page) => ({
        slug: page.slug,
        roles: page.sections.map((section) => section.role),
      })),
      servicesCount: params.architecture.services?.length ?? 0,
      productsCount: params.architecture.products?.length ?? 0,
    }

    const grounded = groundAssistedSiteGenerationProposalV1({ proposal: rawResponse, context: groundingContext })

    if (grounded.accepted === false) {
      return {
        architecture: params.architecture,
        lifecycle: {
          status: "rejected",
          providerKey: "deterministic",
          modelKey: "assisted_deterministic_v1",
          inputFingerprint,
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
        providerKey: "deterministic",
        modelKey: "assisted_deterministic_v1",
        inputFingerprint,
        outputFingerprint,
        warnings: grounded.warnings,
      },
    }
  } catch (error) {
    return {
      architecture: params.architecture,
      lifecycle: {
        status: "failed",
        providerKey: "deterministic",
        modelKey: "assisted_deterministic_v1",
        reasons: [error instanceof Error ? error.message : "assisted_generation_unknown_error"],
      },
    }
  }
}
