import type { SectionRole } from "@/lib/orvenix-ai/architect"
import { ROLE_VISUAL_LAYOUT_VOCABULARY, type VisualLayoutKind } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import { COMMERCE_FACT_LIMITS_V1 } from "@/lib/orvenix-ai/commerce/product-facts"
import {
  FULL_SITE_CART_PROMINENCE_V1,
  FULL_SITE_CTA_INTENTS_V1,
  FULL_SITE_EMPHASES_V1,
  FULL_SITE_NAVIGATION_CONCEPTS_V1,
  FULL_SITE_PAGE_DENSITIES_V1,
  FULL_SITE_RELATIONS_V1,
  FULL_SITE_RHYTHMS_V1,
  FULL_SITE_SITE_DENSITIES_V1,
  FULL_SITE_SITE_NARRATIVES_V1,
  type FullSitePagePurposeV1,
  type FullSiteSectionIntentV1,
} from "./contract"
import { COMMERCE_MEDIA_INTENTS_V1, COMMERCE_NARRATIVE_INTENTS_V1 } from "./creative-intent"

/**
 * FULL-SITE-4A: the machine-readable truth about what Orvenix can
 * actually build for a COMMERCE site, handed to the external creative
 * architect. Every list is DERIVED from the same constants the validator,
 * commerce adapter and composer consume -- never a hand-maintained copy.
 *
 * Runtime features are advertised only when they really exist in the
 * store runtime (cart drawer + checkout entry via the existing store
 * blocks, catalog/category/product-detail pages). Features Orvenix does
 * NOT have are listed under `notAvailable` so the architect never designs
 * for them.
 */

/** Page purposes the commerce adapter actually turns into pages (others are dropped). */
export const FULL_SITE_COMMERCE_PAGE_PURPOSES_V1 = ["home", "catalog", "category", "product_detail", "help"] as const satisfies readonly FullSitePagePurposeV1[]

/** The semantic role each section intent is compiled as -- the blueprint `role` must match for its `layout` to validate. */
export const FULL_SITE_COMMERCE_SECTION_ROLES_V1: Record<FullSiteSectionIntentV1, SectionRole> = {
  opening: "hero",
  navigation_discovery: "content",
  featured_collection: "products",
  collection: "products",
  spotlight: "products",
  editorial_passage: "features",
  benefits: "features",
  trust: "trust",
  catalog_surface: "products",
  detail_surface: "products",
  related_items: "products",
  closing: "cta",
}

export const FULL_SITE_BLUEPRINT_LIMITS_V1 = {
  maxPages: 12,
  maxSectionsPerPage: 16,
  maxRefsPerSection: 12,
  maxNarrativeLength: 220,
  maxMediaIntentLength: 140,
} as const

export type FullSiteCapabilityManifestV1 = ReturnType<typeof buildFullSiteCommerceCapabilityManifestV1>

export function buildFullSiteCommerceCapabilityManifestV1() {
  const roles = [...new Set(Object.values(FULL_SITE_COMMERCE_SECTION_ROLES_V1))]
  const layoutsByRole: Partial<Record<SectionRole, readonly VisualLayoutKind[]>> = {}
  for (const role of roles) {
    const layouts = ROLE_VISUAL_LAYOUT_VOCABULARY[role]
    if (layouts) layoutsByRole[role] = layouts
  }
  return {
    domain: "commerce" as const,
    pagePurposes: FULL_SITE_COMMERCE_PAGE_PURPOSES_V1,
    sectionIntents: FULL_SITE_COMMERCE_SECTION_ROLES_V1,
    layoutsByRole,
    siteNarratives: FULL_SITE_SITE_NARRATIVES_V1,
    rhythms: FULL_SITE_RHYTHMS_V1,
    siteDensities: FULL_SITE_SITE_DENSITIES_V1,
    pageDensities: FULL_SITE_PAGE_DENSITIES_V1,
    navigationConcepts: FULL_SITE_NAVIGATION_CONCEPTS_V1,
    cartProminence: FULL_SITE_CART_PROMINENCE_V1,
    ctaIntents: FULL_SITE_CTA_INTENTS_V1,
    emphases: FULL_SITE_EMPHASES_V1,
    relations: FULL_SITE_RELATIONS_V1,
    /** Preferred exact tokens for the free-text `narrative` / `narrativeGoal` fields. */
    narrativeTokens: COMMERCE_NARRATIVE_INTENTS_V1,
    /** Preferred exact tokens for the free-text `mediaIntent` field. */
    mediaTokens: COMMERCE_MEDIA_INTENTS_V1,
    refKinds: ["product", "category"] as const,
    limits: FULL_SITE_BLUEPRINT_LIMITS_V1,
    runtime: {
      catalogPage: true,
      categoryPages: true,
      productDetailPages: true,
      productCards: true,
      cart: true,
      checkoutEntry: true,
      categoryLinks: true,
    },
    notAvailable: ["search", "customer_accounts", "order_history", "wishlist", "shipping_calculator", "coupons", "reviews", "marketplace_sellers", "real_product_photography"] as const,
  }
}

/** Bound used by the request context for the internal (architect) product universe -- NOT the public 8-product brief limit. */
export const FULL_SITE_CONTEXT_MAX_PRODUCTS_V1 = COMMERCE_FACT_LIMITS_V1.maxProducts
