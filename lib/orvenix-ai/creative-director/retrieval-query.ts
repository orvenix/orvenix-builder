import type { BusinessAffinity, PagePurpose } from "@/lib/orvenix-ai/design-reference/contract"
import type { ConversionIntent, DesignReferenceRetrievalQuery } from "@/lib/orvenix-ai/design-reference/retrieval-contract"
import type { CreativeDirectorRequestV1 } from "./contract"

/**
 * V2-5C: deterministic adapter from an already-built CreativeDirectorRequestV1
 * (itself built from normalized, bounded, PII-free business/architecture
 * facts -- see site-creation/creative-direction.ts's buildCreativeDirectorRequestV1)
 * into a DesignReferenceRetrievalQuery. This module invents no new business
 * classification: every mapping below is a small, static, documented
 * TRANSLATION TABLE from a fact Orvenix already computed (siteType via
 * architecture.pages' role recipe, or Orvenix's own bounded
 * architect-level siteType) into a design-reference vocabulary token --
 * the exact same "translation table, not a new inference engine" pattern
 * already used by design-reference/vocabulary-mappings.ts's
 * WEBS_BUSINESS_AFFINITY and assistance/contract.ts's industry buckets.
 *
 * Deliberately NOT derived from request.business.objective/description/
 * preferredStyle (free text) -- those are exactly the raw-prose fields
 * this adapter must never parse, since that would be "a parallel business
 * inference engine" in the sense the phase brief forbids. Fields with no
 * safe, already-known translation (visualFamily, assetStrategy, density)
 * are simply left unset -- an absent query field is handled correctly by
 * scoring.ts's own renormalization, never guessed here.
 */

/**
 * Orvenix's architect-level siteType (lib/orvenix-ai/architect/site-architect.ts's
 * inferSiteType) is a closed 5-value classification: "health" | "restaurant" |
 * "agency" | "ecommerce" | "business". This maps that ALREADY-RESOLVED
 * classification onto the design-reference library's 13-value
 * BusinessAffinity vocabulary. "business" is Orvenix's own generic
 * catch-all (no specific industry signal fired) and is mapped to "other"
 * rather than guessed into a more specific affinity.
 */
const SITE_TYPE_BUSINESS_AFFINITY: Record<string, BusinessAffinity> = {
  health: "health",
  restaurant: "food-hospitality",
  agency: "creative-services",
  ecommerce: "retail-commerce",
  business: "other",
}

/**
 * Same siteType classification, mapped onto retrieval's ConversionIntent.
 * Reflects the CONVENTIONAL conversion shape for each architect siteType
 * (appointment booking for health, table/room booking for restaurant,
 * lead capture for agency, catalog browsing for ecommerce, generic
 * contact for the "business" catch-all) -- not a claim about any
 * individual business's actual funnel, which Orvenix never invents.
 */
const SITE_TYPE_CONVERSION_INTENT: Record<string, ConversionIntent> = {
  health: "appointment",
  restaurant: "booking",
  agency: "lead",
  ecommerce: "catalog",
  business: "contact",
}

/**
 * Bounded page-role -> PagePurpose translation, reusing each page's OWN
 * already-resolved `availableRoles`/`archetype` (never free text). A
 * page can contribute more than one purpose (eg. a page with both
 * "pricing" and "contact" roles contributes both).
 */
const ROLE_TO_PAGE_PURPOSE: Partial<Record<string, PagePurpose>> = {
  services: "services",
  products: "catalog",
  pricing: "pricing",
  testimonials: "testimonials",
  gallery: "gallery",
  contact: "contact",
  faq: "unknown",
}

function derivePagePurposes(request: CreativeDirectorRequestV1): PagePurpose[] {
  const purposes = new Set<PagePurpose>()

  for (const page of request.pages) {
    if (page.slug === "home") purposes.add("home")
    if (page.archetype === "catalog") purposes.add("catalog")

    for (const role of page.availableRoles) {
      const purpose = ROLE_TO_PAGE_PURPOSE[role]
      if (purpose && purpose !== "unknown") purposes.add(purpose)
    }
  }

  return Array.from(purposes)
}

/**
 * The ONE deterministic siteType signal this adapter reads, threaded in
 * by the caller (site-creation/creative-direction.ts) from
 * OrvenixSiteArchitecture.siteType -- CreativeDirectorRequestV1 itself
 * carries no siteType field, so it cannot be re-derived from the
 * request alone.
 */
export function buildDesignReferenceRetrievalQueryV1(
  request: CreativeDirectorRequestV1,
  siteType: string,
): DesignReferenceRetrievalQuery {
  const businessAffinity = SITE_TYPE_BUSINESS_AFFINITY[siteType]
  const conversionIntent = SITE_TYPE_CONVERSION_INTENT[siteType]
  const pagePurposes = derivePagePurposes(request)
  const hasServices = Boolean(request.business.services?.length)
  const hasProducts = Boolean(request.business.products?.length)

  return {
    ...(businessAffinity ? { businessAffinity } : {}),
    ...(conversionIntent ? { conversionIntent } : {}),
    ...(pagePurposes.length ? { pagePurposes } : {}),
    ...(hasServices ? { hasServices } : {}),
    ...(hasProducts ? { hasProducts } : {}),
  }
}
