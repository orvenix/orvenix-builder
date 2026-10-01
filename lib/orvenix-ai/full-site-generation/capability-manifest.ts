import type { SectionRole } from "@/lib/orvenix-ai/architect"
import { ROLE_VISUAL_LAYOUT_VOCABULARY, type VisualLayoutKind } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import { COMMERCE_FACT_LIMITS_V1 } from "@/lib/orvenix-ai/commerce/product-facts"
import {
  FULL_SITE_CART_PROMINENCE_V1,
  FULL_SITE_CTA_INTENTS_V1,
  FULL_SITE_EMPHASES_V1,
  FULL_SITE_NAVIGATION_CONCEPTS_V1,
  FULL_SITE_PAGE_DENSITIES_V1,
  FULL_SITE_PRODUCT_CARD_TREATMENTS_V1,
  FULL_SITE_MERCHANDISING_COMPOSITIONS_V1,
  FULL_SITE_RELATIONS_V1,
  FULL_SITE_RHYTHMS_V1,
  FULL_SITE_SITE_DENSITIES_V1,
  FULL_SITE_SITE_NARRATIVES_V1,
  type FullSitePagePurposeV1,
  type FullSiteSectionIntentV1,
} from "./contract"
import { COMMERCE_MEDIA_INTENTS_V1, COMMERCE_NARRATIVE_INTENTS_V1 } from "./creative-intent"
import { navigationConceptEffectsV1 } from "./navigation-concepts"
import {
  CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
  GRAPH_ALIGNMENTS_V1,
  GRAPH_ARRANGEMENTS_V1,
  GRAPH_BEATS_V1,
  GRAPH_CONTINUITIES_V1,
  GRAPH_EDGES_V1,
  GRAPH_LIMITS_V1,
  GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1,
} from "@/lib/orvenix-ai/composer/graph/contract"
import { CREATIVE_COPY_LIMITS_V1 } from "./copy-guard"

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

/**
 * CF-1 renderer truth (verified against the real composer by
 * tests/unit/cf-1-renderer-truth-v1): accepted layout kinds that render
 * IDENTICALLY to another kind for that role. The validator still accepts
 * them (compatibility); the architect is only offered the distinct ones.
 */
export const FULL_SITE_LAYOUT_EQUIVALENTS_BY_ROLE_V1: Partial<Record<SectionRole, Partial<Record<VisualLayoutKind, VisualLayoutKind>>>> = {
  hero: { "editorial-passage": "oversized-typography" },
  products: { standard: "card-grid" },
  features: { standard: "card-grid", "editorial-passage": "oversized-typography" },
}

/** Roles whose composer ignores `layout` entirely (category discovery renders category cards). */
export const FULL_SITE_LAYOUT_IGNORED_ROLES_V1: readonly SectionRole[] = ["content"]

/** CF-1: which merchandising compositions each role actually implements. */
export const FULL_SITE_MERCHANDISING_BY_ROLE_V1 = {
  products: ["featured-plus-grid", "product-rail", "editorial-collection", "alternating-story", "dense-catalog"],
  content: ["category-spotlight"],
} as const satisfies Partial<Record<SectionRole, readonly (typeof FULL_SITE_MERCHANDISING_COMPOSITIONS_V1)[number][]>>

/**
 * CF-1: what each siteConcept.rhythm really does (null = no effect of its
 * own). "immersive" only marks the opening as heroic, and the opening is
 * always the hero role, which ignores emphasis/scale -- so it is honestly
 * advertised as effect-less.
 */
export const FULL_SITE_RHYTHM_EFFECTS_V1: Record<(typeof FULL_SITE_RHYTHMS_V1)[number], string | null> = {
  calm: null,
  dense: null,
  varied: "consecutive split sections on a page alternate sides (overrides their mirror choice)",
  immersive: null,
}

/** CF-1: roles whose composer ignores section.emphasis (scale). */
export const FULL_SITE_EMPHASIS_IGNORED_ROLES_V1: readonly SectionRole[] = ["hero"]

/** CF-3A: bounded provider graph authoring (output-size pressure + intentional use). */
export const FULL_SITE_GRAPH_AUTHORING_LIMITS_V1 = {
  maxGraphSectionsPerPage: 6,
  maxGraphSectionsPerSite: 16,
  /** Blueprint section roles that may carry a composition graph (the graph's role must match). */
  graphSectionRoles: ["products", "content"] as const,
} as const

export type FullSiteCapabilityManifestV1 = ReturnType<typeof buildFullSiteCommerceCapabilityManifestV1>

export function buildFullSiteCommerceCapabilityManifestV1() {
  const roles = [...new Set(Object.values(FULL_SITE_COMMERCE_SECTION_ROLES_V1))]
  // CF-1: only layouts that render distinctly are offered; aliases are listed separately.
  const layoutsByRole: Partial<Record<SectionRole, readonly VisualLayoutKind[]>> = {}
  const layoutEquivalents: Partial<Record<SectionRole, Partial<Record<VisualLayoutKind, VisualLayoutKind>>>> = {}
  for (const role of roles) {
    const layouts = ROLE_VISUAL_LAYOUT_VOCABULARY[role]
    if (!layouts || FULL_SITE_LAYOUT_IGNORED_ROLES_V1.includes(role)) continue
    const aliases = FULL_SITE_LAYOUT_EQUIVALENTS_BY_ROLE_V1[role] ?? {}
    layoutsByRole[role] = layouts.filter((kind) => !aliases[kind])
    if (Object.keys(aliases).length) layoutEquivalents[role] = aliases
  }
  return {
    domain: "commerce" as const,
    pagePurposes: FULL_SITE_COMMERCE_PAGE_PURPOSES_V1,
    sectionIntents: FULL_SITE_COMMERCE_SECTION_ROLES_V1,
    layoutsByRole,
    layoutEquivalents,
    layoutIgnoredRoles: FULL_SITE_LAYOUT_IGNORED_ROLES_V1,
    siteNarratives: FULL_SITE_SITE_NARRATIVES_V1,
    rhythms: FULL_SITE_RHYTHMS_V1,
    rhythmEffects: FULL_SITE_RHYTHM_EFFECTS_V1,
    siteDensities: FULL_SITE_SITE_DENSITIES_V1,
    pageDensities: FULL_SITE_PAGE_DENSITIES_V1,
    navigationConcepts: FULL_SITE_NAVIGATION_CONCEPTS_V1,
    navigationConceptEffects: navigationConceptEffectsV1(),
    cartProminence: FULL_SITE_CART_PROMINENCE_V1,
    ctaIntents: FULL_SITE_CTA_INTENTS_V1,
    emphases: FULL_SITE_EMPHASES_V1,
    emphasisIgnoredRoles: FULL_SITE_EMPHASIS_IGNORED_ROLES_V1,
    relations: FULL_SITE_RELATIONS_V1,
    productCardTreatments: FULL_SITE_PRODUCT_CARD_TREATMENTS_V1,
    merchandisingCompositions: FULL_SITE_MERCHANDISING_COMPOSITIONS_V1,
    merchandisingByRole: FULL_SITE_MERCHANDISING_BY_ROLE_V1,
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
    /**
     * CF-3A: OPTIONAL relational composition per section, derived from the
     * CreativeCompositionGraphV1 contract itself (no parallel schema).
     */
    compositionGraph: {
      version: CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
      optional: true,
      eligibleSectionRoles: FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.graphSectionRoles,
      regionRolesBySectionRole: GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1,
      beats: GRAPH_BEATS_V1,
      continuities: GRAPH_CONTINUITIES_V1,
      alignments: GRAPH_ALIGNMENTS_V1,
      edges: GRAPH_EDGES_V1,
      arrangements: GRAPH_ARRANGEMENTS_V1,
      gridUnits: GRAPH_LIMITS_V1.gridUnits,
      span: { min: GRAPH_LIMITS_V1.minSpan, max: GRAPH_LIMITS_V1.gridUnits },
      weight: GRAPH_LIMITS_V1.weight,
      whitespace: GRAPH_LIMITS_V1.whitespace,
      density: GRAPH_LIMITS_V1.density,
      minReadableSpan: GRAPH_LIMITS_V1.minReadableSpan,
      maxTopLevelRegions: GRAPH_LIMITS_V1.maxTopLevelRegions,
      maxDepth: GRAPH_LIMITS_V1.maxDepth,
      maxRegionsTotal: GRAPH_LIMITS_V1.maxRegionsTotal,
      maxRefsPerSection: GRAPH_LIMITS_V1.maxRefsPerSection,
      maxRailItems: GRAPH_LIMITS_V1.maxRailItems,
      maxPeaksPerPage: GRAPH_LIMITS_V1.maxPeaksPerPage,
      maxGraphSectionsPerPage: FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerPage,
      maxGraphSectionsPerSite: FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerSite,
      refKinds: ["product", "category", "product-media"] as const,
      orvenixOwned: ["mobile_layout", "dom_reading_order", "css", "colors", "accessibility", "routes_and_ids", "prices_stock_checkout"] as const,
    },
    /** CF-3A: OPTIONAL creative copy slots; factual claims are guarded (unsafe slot -> Orvenix copy). */
    creativeCopy: {
      slots: CREATIVE_COPY_LIMITS_V1,
      forbiddenClaims: ["numbers_not_in_catalog", "prices", "percentages", "discounts", "shipping", "delivery_times", "guarantees", "ratings_reviews", "testimonials", "scarcity_stock", "superlatives_rankings", "certifications", "statistics"] as const,
    },
  }
}

/** Bound used by the request context for the internal (architect) product universe -- NOT the public 8-product brief limit. */
export const FULL_SITE_CONTEXT_MAX_PRODUCTS_V1 = COMMERCE_FACT_LIMITS_V1.maxProducts
