import type {
  CreativeDirectorProviderV1,
  CreativeDirectorRequestV1,
  CreativeSiteDirectionV1,
} from "../contract"
import { CreativeDirectorGatewayTimeoutErrorV1 } from "../gateway"

/**
 * V2-4 section 23: a deterministic Creative Director provider for tests --
 * no network. Each mode simulates exactly one failure/success path the
 * test matrix needs, without depending on a real Anthropic call.
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
): CreativeDirectorProviderV1 {
  return {
    async request(request: CreativeDirectorRequestV1) {
      switch (mode) {
        case "valid":
          return baseValidProposal(request)

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
