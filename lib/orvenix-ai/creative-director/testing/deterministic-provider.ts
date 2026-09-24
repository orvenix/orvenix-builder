import type {
  CreativeDirectorPageDirectionV1,
  CreativeDirectorProviderV1,
  CreativeDirectorRequestV1,
  CreativeSiteDirectionV1,
} from "../contract"
import { CreativeDirectorGatewayTimeoutErrorV1 } from "../gateway"

/**
 * V2-4 section 23: a deterministic Creative Director provider for tests --
 * no network. Each mode simulates exactly one failure/success path the
 * test matrix needs, without depending on a real Anthropic call.
 *
 * V2-5C additions: "rich_valid" (apply a caller-supplied set of bounded
 * V2-5B/V2-5C treatment overrides to every page -- see `richOverrides`
 * below, used to exercise abstract-glow/numbered/paired/tone-strategy
 * requests through the SAME validated CD pathway without one named mode
 * per combination), "reference_aware" (a decision that reasons over
 * request.referenceContext's GRAMMAR, never its reference ids -- proves
 * "reference grammar -> reasoning -> bounded decision", never "reference
 * id -> template"), and four invalid_* modes for the new fields, mirroring
 * the existing invalid_hero_variant pattern.
 */

export type DeterministicCreativeDirectorModeV1 =
  | "valid"
  | "invalid_schema"
  | "unsafe_copy"
  | "unknown_offering"
  | "invalid_hero_variant"
  | "invalid_section_order"
  | "timeout"
  | "provider_error"
  | "null_response"
  | "rich_valid"
  | "reference_aware"
  | "invalid_hero_treatment"
  | "invalid_process_treatment"
  | "invalid_two_item_layout_treatment"
  | "invalid_section_tone_strategy"

export type DeterministicRichCompositionOverridesV1 = Partial<
  Pick<CreativeDirectorPageDirectionV1, "heroTreatment" | "processTreatment" | "twoItemLayoutTreatment" | "sectionToneStrategy">
>

function baseValidProposal(request: CreativeDirectorRequestV1): CreativeSiteDirectionV1 {
  const firstPage = request.pages[0]
  const realOffering = request.business.services?.[0]?.name ?? request.business.products?.[0]?.name

  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "Direccion narrativa de prueba, generada deterministicamente.",
    tone: "warm",
    visualDirection: { accentHue: "blue", radiusBucket: "soft" },
    density: "standard",
    pageDirections: request.pages.map((page) => ({
      slug: page.slug,
      narrativeGoal: `Objetivo narrativo de prueba para ${page.slug}.`,
      ...(realOffering ? { heroDirection: { emphasis: "offering" as const, preferredOfferingName: realOffering } } : {}),
      ...(page.slug === firstPage?.slug && realOffering ? { heroTitleSuggestion: `${realOffering}: una propuesta clara` } : {}),
      ...(page.slug === firstPage?.slug ? { heroDescriptionSuggestion: "Conoce mas sobre lo que ofrecemos, sin datos inventados." } : {}),
      preferredHeroVariant: "centered" as const,
      ...(realOffering ? { highlightedOfferings: [realOffering] } : {}),
      ctaIntent: "contact" as const,
      assetIntent: { subject: "modern business workspace", mood: "professional" },
      preferredSectionOrder: page.defaultOrder,
    })),
  }
}

export function createDeterministicCreativeDirectorProviderV1(
  mode: DeterministicCreativeDirectorModeV1 = "valid",
  richOverrides?: DeterministicRichCompositionOverridesV1,
): CreativeDirectorProviderV1 {
  return {
    async request(request: CreativeDirectorRequestV1) {
      switch (mode) {
        case "valid":
          return baseValidProposal(request)

        case "rich_valid": {
          const proposal = baseValidProposal(request)
          for (const direction of proposal.pageDirections) {
            Object.assign(direction, richOverrides ?? {})
          }
          return proposal
        }

        case "reference_aware": {
          /*
           * V2-5C refinement: decides from the DOMINANT signal across
           * request.referenceContext's GRAMMAR fields (a strict majority
           * of the selected references, never a single outlier) -- never
           * from any reference's `id`. Proves the reference-augmented
           * pathway is "grammar -> reasoning -> bounded decision", not
           * "id -> template": feeding this mode two reference contexts
           * with different ids but the SAME grammar produces the SAME
           * decision, and same ids with different grammar produces a
           * DIFFERENT decision (see the dedicated tests).
           *
           * Majority (not ANY-of-4/.some()) is deliberate: an earlier
           * version flipped a decision for the whole site whenever a
           * SINGLE selected reference carried a signal, which -- given
           * the real reference library's own skew (abstract-glow is
           * ~56% of hero treatments library-wide) -- produced misleading
           * near-universal convergence across unrelated business
           * diagnostics. A dominant-signal policy is a more honest
           * "reasoning over evidence" stand-in and only decides a
           * treatment when most of what was actually retrieved agrees.
           */
          const proposal = baseValidProposal(request)
          const refs = request.referenceContext ?? []
          const dominant = (predicate: (r: (typeof refs)[number]) => boolean) => refs.length > 0 && refs.filter(predicate).length > refs.length / 2

          const abstractGlowDominant = dominant((r) => r.heroGrammar.backgroundTreatment === "abstract-glow")
          const photographyDominant = dominant((r) => r.heroGrammar.mediaStrategy === "photography" && r.heroGrammar.backgroundTreatment === "full-bleed-photo")
          const numberedProcessDominant = dominant((r) => r.sectionGrammar.recurringTreatments.includes("numbered-process"))
          const pairedLayoutDominant = dominant((r) => r.sectionGrammar.recurringTreatments.includes("paired-layout"))

          for (const direction of proposal.pageDirections) {
            direction.heroTreatment = abstractGlowDominant ? "abstract-glow" : "standard"
            /*
             * Photography-dominant reference grammar maps onto the
             * EXISTING preferredHeroVariant="immersive" decision (V2-4),
             * never a new contract field -- immersive photography is
             * already fully expressed by preferredHeroVariant+assetIntent
             * (see contract.ts's pageDirection doc comment).
             */
            if (photographyDominant) direction.preferredHeroVariant = "immersive"
            direction.processTreatment = numberedProcessDominant ? "numbered" : "cards"
            direction.twoItemLayoutTreatment = pairedLayoutDominant ? "paired" : "cards"
          }
          return proposal
        }

        case "invalid_hero_treatment": {
          const proposal = baseValidProposal(request)
          // @ts-expect-error -- deliberately invalid for the test
          proposal.pageDirections[0].heroTreatment = "cinematic-parallax"
          return proposal
        }

        case "invalid_process_treatment": {
          const proposal = baseValidProposal(request)
          // @ts-expect-error -- deliberately invalid for the test
          proposal.pageDirections[0].processTreatment = "timeline"
          return proposal
        }

        case "invalid_two_item_layout_treatment": {
          const proposal = baseValidProposal(request)
          // @ts-expect-error -- deliberately invalid for the test
          proposal.pageDirections[0].twoItemLayoutTreatment = "split-hero"
          return proposal
        }

        case "invalid_section_tone_strategy": {
          const proposal = baseValidProposal(request)
          // @ts-expect-error -- deliberately invalid for the test
          proposal.pageDirections[0].sectionToneStrategy = "neon"
          return proposal
        }

        case "invalid_schema":
          return { not_a_valid_shape: true } as unknown as CreativeSiteDirectionV1

        case "unsafe_copy": {
          const proposal = baseValidProposal(request)
          proposal.pageDirections[0].heroTitleSuggestion = "Somos los mejores con 10 años de experiencia"
          return proposal
        }

        case "unknown_offering": {
          const proposal = baseValidProposal(request)
          proposal.pageDirections[0].highlightedOfferings = ["Servicio Que No Existe"]
          proposal.pageDirections[0].heroDirection = { emphasis: "offering", preferredOfferingName: "Servicio Que No Existe" }
          return proposal
        }

        case "invalid_hero_variant": {
          const proposal = baseValidProposal(request)
          // @ts-expect-error -- deliberately invalid for the test
          proposal.pageDirections[0].preferredHeroVariant = "fullscreen-carousel"
          return proposal
        }

        case "invalid_section_order": {
          const proposal = baseValidProposal(request)
          proposal.pageDirections[0].preferredSectionOrder = ["footer", ...proposal.pageDirections[0].preferredSectionOrder!.slice(0, -1)]
          return proposal
        }

        case "timeout":
          throw new CreativeDirectorGatewayTimeoutErrorV1()

        case "provider_error":
          throw new Error("simulated_provider_error")

        case "null_response":
          return null

        default:
          return baseValidProposal(request)
      }
    },
  }
}
