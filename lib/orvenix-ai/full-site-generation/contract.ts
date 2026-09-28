import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"

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
}

export type FullSiteCreativeLifecycleV1 =
  | { status: "disabled" }
  | { status: "applied"; inputFingerprint: string; outputFingerprint: string; warnings: string[] }
  | { status: "rejected"; inputFingerprint: string; reasons: string[]; warnings: string[] }
  | { status: "failed"; inputFingerprint?: string; reasons: string[] }
