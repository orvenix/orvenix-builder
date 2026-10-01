import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import type { GraphSectionV1 } from "@/lib/orvenix-ai/composer/graph/contract"
import type { CreativeCopyV1 } from "./copy-guard"

export const FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1 = 1
export const FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1 = "full_site_creative_blueprint_v1"
export const FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 = "bounded_full_site_generation_v1"

export const FULL_SITE_PAGE_PURPOSES_V1 = [
  "home",
  "catalog",
  "category",
  "product_detail",
  "help",
  "services",
  "contact",
  "about",
] as const

export type FullSitePagePurposeV1 = (typeof FULL_SITE_PAGE_PURPOSES_V1)[number]

export const FULL_SITE_SECTION_INTENTS_V1 = [
  "opening",
  "navigation_discovery",
  "featured_collection",
  "collection",
  "spotlight",
  "editorial_passage",
  "benefits",
  "trust",
  "catalog_surface",
  "detail_surface",
  "related_items",
  "closing",
] as const

export type FullSiteSectionIntentV1 = (typeof FULL_SITE_SECTION_INTENTS_V1)[number]

export const FULL_SITE_NAVIGATION_CONCEPTS_V1 = [
  "classic",
  "editorial",
  "catalog-forward",
  "compact",
  "conversion-led",
] as const

export type FullSiteNavigationConceptV1 = (typeof FULL_SITE_NAVIGATION_CONCEPTS_V1)[number]

/** FULL-SITE-4A: single source of truth for every closed blueprint vocabulary (validator, capability manifest and provider prompt all derive from these). */
export const FULL_SITE_SITE_NARRATIVES_V1 = ["editorial", "catalog", "product-led", "conversion-led", "professional"] as const
export const FULL_SITE_RHYTHMS_V1 = ["calm", "varied", "dense", "immersive"] as const
export const FULL_SITE_SITE_DENSITIES_V1 = ["minimal", "balanced", "rich"] as const
export const FULL_SITE_PAGE_DENSITIES_V1 = ["compact", "balanced", "immersive"] as const
export const FULL_SITE_CTA_INTENTS_V1 = ["browse", "buy", "contact", "learn", "none"] as const
export const FULL_SITE_EMPHASES_V1 = ["standard", "heroic", "quiet", "conversion"] as const
export const FULL_SITE_RELATIONS_V1 = ["standard", "continuous", "contrast"] as const
export const FULL_SITE_CART_PROMINENCE_V1 = ["none", "subtle", "prominent"] as const
export const FULL_SITE_REF_KINDS_V1 = ["product", "category", "service", "evidence"] as const
export const FULL_SITE_PRODUCT_CARD_TREATMENTS_V1 = ["compact-catalog", "editorial", "image-led", "featured", "horizontal"] as const
export const FULL_SITE_MERCHANDISING_COMPOSITIONS_V1 = ["featured-plus-grid", "product-rail", "category-spotlight", "editorial-collection", "alternating-story", "dense-catalog"] as const

export type FullSiteProductCardTreatmentV1 = (typeof FULL_SITE_PRODUCT_CARD_TREATMENTS_V1)[number]
export type FullSiteMerchandisingCompositionV1 = (typeof FULL_SITE_MERCHANDISING_COMPOSITIONS_V1)[number]

export type FullSiteContentRefV1 =
  | { kind: "product"; index: number }
  | { kind: "category"; key: string }
  | { kind: "service"; index: number }
  | { kind: "evidence"; index: number }

export interface FullSiteCreativeSectionV1 {
  intent: FullSiteSectionIntentV1
  role: SectionRole
  refs?: FullSiteContentRefV1[]
  narrative?: string
  mediaIntent?: string
  ctaIntent?: "browse" | "buy" | "contact" | "learn" | "none"
  layout?: SectionVisualLayoutPlan
  emphasis?: "standard" | "heroic" | "quiet" | "conversion"
  relationToPrevious?: "standard" | "continuous" | "contrast"
  productCardTreatment?: FullSiteProductCardTreatmentV1
  merchandisingComposition?: FullSiteMerchandisingCompositionV1
  /**
   * CF-3A: OPTIONAL provider-authored CreativeCompositionGraphV1 (the SAME
   * internal contract -- no parallel schema). Shape-checked here; strictly
   * validated + grounded at compile time, where an invalid graph sends only
   * THIS section back to V1.
   */
  composition?: GraphSectionV1
  /** CF-3A: OPTIONAL bounded creative copy slots; each slot is claim-guarded and falls back alone. */
  copy?: CreativeCopyV1
}

export interface FullSiteCreativePageV1 {
  purpose: FullSitePagePurposeV1
  target?: FullSiteContentRefV1
  narrativeGoal?: string
  density?: "compact" | "balanced" | "immersive"
  sections: FullSiteCreativeSectionV1[]
}

export interface FullSiteCreativeNavigationV1 {
  concept: FullSiteNavigationConceptV1
  primaryPurposes?: FullSitePagePurposeV1[]
  cartProminence?: "none" | "subtle" | "prominent"
}

export interface FullSiteCreativeBlueprintV1 {
  version: typeof FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1
  roleKey: typeof FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1
  strategyKey: typeof FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1
  siteConcept: {
    narrative: "editorial" | "catalog" | "product-led" | "conversion-led" | "professional"
    rhythm: "calm" | "varied" | "dense" | "immersive"
    density: "minimal" | "balanced" | "rich"
  }
  navigation: FullSiteCreativeNavigationV1
  pages: FullSiteCreativePageV1[]
}

export interface FullSiteCreativeBlueprintProviderV1 {
  generate(input: unknown): Promise<unknown>
  /** FULL-SITE-4A: optional safe metadata for lifecycle observability (never secrets). */
  readonly providerKey?: string
  readonly modelKey?: string
  /** The provider's own bounded request timeout; the orchestrator adds a small grace on top. */
  readonly timeoutMs?: number
}

/** FULL-SITE-4A: normalized, content-free failure reasons (raw provider errors are never surfaced). */
export type FullSiteCreativeFailureReasonV1 =
  | "disabled"
  | "missing_configuration"
  | "timeout"
  | "provider_error"
  | "empty_response"
  | "output_truncated"
  | "parse_error"
  | "schema_invalid"
  | "grounding_invalid"

export type FullSiteCreativeLifecycleMetaV1 = { providerKey?: string; modelKey?: string; durationMs?: number }

export type FullSiteCreativeLifecycleV1 =
  | { status: "disabled"; reasonCode?: "disabled" }
  | ({ status: "applied"; inputFingerprint: string; outputFingerprint: string; warnings: string[] } & FullSiteCreativeLifecycleMetaV1)
  | ({ status: "rejected"; inputFingerprint: string; reasons: string[]; warnings: string[]; reasonCode?: "schema_invalid" | "grounding_invalid" } & FullSiteCreativeLifecycleMetaV1)
  | ({ status: "failed"; inputFingerprint?: string; reasons: string[]; reasonCode?: FullSiteCreativeFailureReasonV1 } & FullSiteCreativeLifecycleMetaV1)
