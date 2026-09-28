import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"

export const COMMERCE_ARCHITECTURE_PLAN_VERSION_V1 = 1
export const COMMERCE_ARCHITECTURE_ROLE_KEY_V1 = "commerce_architecture_v1"
export const COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1 = "bounded_commerce_merchandising_v1"

export const COMMERCE_PAGE_PURPOSES_V1 = [
  "home",
  "catalog",
  "category",
  "product_detail",
  "cart",
  "checkout",
  "help",
] as const

export type CommercePagePurposeV1 = (typeof COMMERCE_PAGE_PURPOSES_V1)[number]

export const COMMERCE_SECTION_TYPES_V1 = [
  "commerce_hero",
  "category_navigation",
  "featured_products",
  "product_collection",
  "product_spotlight",
  "promotional_banner",
  "commerce_benefits",
  "commerce_trust",
  "catalog_grid",
  "product_detail",
  "related_products",
  "commerce_closing",
] as const

export type CommerceSectionTypeV1 = (typeof COMMERCE_SECTION_TYPES_V1)[number]

export const COMMERCE_NAVIGATION_STYLES_V1 = [
  "classic-store",
  "category-forward",
  "editorial-commerce",
  "compact-catalog",
  "promotional",
] as const

export type CommerceNavigationStyleV1 = (typeof COMMERCE_NAVIGATION_STYLES_V1)[number]

export const COMMERCE_STORE_STRATEGIES_V1 = [
  "editorial-commerce",
  "catalog-first",
  "product-led",
  "promotional",
] as const

export type CommerceStoreStrategyV1 = (typeof COMMERCE_STORE_STRATEGIES_V1)[number]

export type CommerceCreativeNarrativeIntentV1 =
  | "product-led"
  | "category-discovery"
  | "editorial-story"
  | "benefit-led"
  | "trust-led"
  | "conversion-led"
  | "minimal-introduction"
  | "catalog-orientation"

export type CommerceCreativeMediaIntentV1 = "none" | "minimal" | "supporting" | "dominant" | "product-focus" | "gallery"
export type CommerceCreativeCtaIntentV1 = "none" | "browse_catalog" | "view_category" | "view_product" | "contact" | "continue_shopping"
export type CommerceCreativeEmphasisV1 = "quiet" | "standard" | "strong" | "heroic" | "conversion"
export type CommerceCreativeDensityV1 = "compact" | "balanced" | "spacious"
export type CommerceCreativeRelationV1 = "standard" | "continuous" | "contrast"

export interface CommerceCreativeIntentV1 {
  narrative?: CommerceCreativeNarrativeIntentV1
  media?: CommerceCreativeMediaIntentV1
  cta?: CommerceCreativeCtaIntentV1
  emphasis?: CommerceCreativeEmphasisV1
  density?: CommerceCreativeDensityV1
  relation?: CommerceCreativeRelationV1
}

export interface CommerceArchitectureSectionV1 {
  type: CommerceSectionTypeV1
  role: SectionRole
  productIndexes?: number[]
  category?: string
  layout?: SectionVisualLayoutPlan
  creativeIntent?: CommerceCreativeIntentV1
}

export interface CommerceArchitecturePageV1 {
  purpose: CommercePagePurposeV1
  slug: string
  name: string
  sections: CommerceArchitectureSectionV1[]
  productIndex?: number
  category?: string
}

export interface CommerceArchitecturePlanV1 {
  version: typeof COMMERCE_ARCHITECTURE_PLAN_VERSION_V1
  roleKey: typeof COMMERCE_ARCHITECTURE_ROLE_KEY_V1
  strategyKey: typeof COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1
  storeStrategy: CommerceStoreStrategyV1
  navigationStyle: CommerceNavigationStyleV1
  primaryNavigationSlugs?: string[]
  siteDensity?: CommerceCreativeDensityV1
  siteRhythm?: "calm" | "varied" | "dense" | "immersive"
  pages: CommerceArchitecturePageV1[]
}
