/**
 * V2-5A.2: Design Reference contract.
 *
 * A DesignReference describes the DESIGN GRAMMAR of an existing website
 * (from app/webs) -- composition, hero treatment, section sequence,
 * theme/typography tendencies, asset strategy, conversion pattern -- and
 * NEVER its literal content. Every field is either a bounded-vocabulary
 * token (below) or a small count/boolean. There is intentionally no
 * free-text field anywhere in this contract that could carry copied
 * marketing prose, names, ratings, prices, or URLs -- see sanitize.ts
 * for the defense-in-depth check that verifies this structurally.
 *
 * This is NOT lib/editorWebs.ts (literal per-business EditorTree
 * cloning, used by the template marketplace) and NOT
 * lib/orvenix-ai/section/artisan-section-references.ts (an older
 * precedent that mixes grammar with literal copy/CTA/image). Neither of
 * those is the source of truth here; this module is independent and
 * does not consume either of them.
 */

export const DESIGN_REFERENCE_SOURCE = "webs" as const
export type DesignReferenceSource = typeof DESIGN_REFERENCE_SOURCE

/** Stable, deterministic identity -- never derived from mutable copy, never random. */
export type DesignReferenceId = `webs:${string}`

export const VISUAL_FAMILIES = [
  "ambient-dark-abstract",
  "full-bleed-photography",
  "saas-conversion",
  "unknown",
] as const
export type VisualFamily = (typeof VISUAL_FAMILIES)[number]

export const BUSINESS_AFFINITIES = [
  "health",
  "legal-professional",
  "financial-professional",
  "food-hospitality",
  "travel-hospitality",
  "retail-commerce",
  "real-estate",
  "fitness-beauty",
  "creative-services",
  "education",
  "saas",
  "local-services",
  "other",
] as const
export type BusinessAffinity = (typeof BUSINESS_AFFINITIES)[number]

export const DESIGN_PERSONALITIES = [
  "bold-confident",
  "editorial-premium",
  "warm-approachable",
  "unknown",
] as const
export type DesignPersonality = (typeof DESIGN_PERSONALITIES)[number]

export const PAGE_COUNT_BUCKETS = ["single-page", "few-pages", "standard-pages", "many-pages"] as const
export type PageCountBucket = (typeof PAGE_COUNT_BUCKETS)[number]

export const PAGE_PURPOSES = [
  "home",
  "services",
  "about",
  "contact",
  "blog",
  "testimonials",
  "gallery",
  "team",
  "pricing",
  "catalog",
  "cart",
  "unknown",
] as const
export type PagePurpose = (typeof PAGE_PURPOSES)[number]

/** Reuses Orvenix's OWN existing section-role vocabulary (section-composer.ts) wherever the concept already exists there, so the library speaks the same language the composer already does. */
export const SECTION_ROLES = [
  "navigation",
  "hero",
  "services",
  "features",
  "products",
  "pricing",
  "process",
  "contact",
  "cta",
  "footer",
  "content",
  "faq",
  "gallery",
  "trust",
  "testimonials",
  "unknown",
] as const
export type SectionRole = (typeof SECTION_ROLES)[number]

export const SECTION_TREATMENTS = [
  "standard-grid",
  "numbered-process",
  "rated-card-grid",
  "tabbed-switcher",
  "accordion",
  "logo-strip",
  "pricing-tiers",
  "credibility-stat-row",
  "paired-layout",
  "unknown",
] as const
export type SectionTreatment = (typeof SECTION_TREATMENTS)[number]

export const THEME_MODES = ["dark", "light", "mixed", "unknown"] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export const ACCENT_TENDENCIES = ["warm", "cool", "neutral", "unknown"] as const
export type AccentTendency = (typeof ACCENT_TENDENCIES)[number]

export const RADIUS_TENDENCIES = ["sharp", "soft", "pill", "unknown"] as const
export type RadiusTendency = (typeof RADIUS_TENDENCIES)[number]

export const SHADOW_TENDENCIES = ["none", "soft", "strong", "unknown"] as const
export type ShadowTendency = (typeof SHADOW_TENDENCIES)[number]

export const CONTRAST_TENDENCIES = ["high", "medium", "low", "unknown"] as const
export type ContrastTendency = (typeof CONTRAST_TENDENCIES)[number]

export const TYPOGRAPHY_SCALES = ["large-display", "moderate", "unknown"] as const
export type TypographyScale = (typeof TYPOGRAPHY_SCALES)[number]

export const ALIGNMENT_TENDENCIES = ["left", "center", "mixed", "unknown"] as const
export type AlignmentTendency = (typeof ALIGNMENT_TENDENCIES)[number]

export const CONTAINER_STRATEGIES = ["centered-max-width", "full-bleed", "unknown"] as const
export type ContainerStrategy = (typeof CONTAINER_STRATEGIES)[number]

export const CARD_STRATEGIES = ["bordered", "elevated", "flat", "unknown"] as const
export type CardStrategy = (typeof CARD_STRATEGIES)[number]

export const DENSITY_TENDENCIES = ["compact", "standard", "spacious", "unknown"] as const
export type DensityTendency = (typeof DENSITY_TENDENCIES)[number]

export const BACKGROUND_RHYTHMS = ["alternating", "uniform", "unknown"] as const
export type BackgroundRhythm = (typeof BACKGROUND_RHYTHMS)[number]

export const HERO_BACKGROUND_TREATMENTS = ["abstract-glow", "full-bleed-photo", "solid-gradient", "unknown"] as const
export type HeroBackgroundTreatment = (typeof HERO_BACKGROUND_TREATMENTS)[number]

export const HERO_MEDIA_STRATEGIES = ["photography", "none", "unknown"] as const
export type HeroMediaStrategy = (typeof HERO_MEDIA_STRATEGIES)[number]

export const CTA_ARRANGEMENTS = ["single-cta", "dual-cta", "unknown"] as const
export type CtaArrangement = (typeof CTA_ARRANGEMENTS)[number]

export const ASSET_STRATEGIES = ["photography", "abstract", "mixed", "none"] as const
export type AssetStrategy = (typeof ASSET_STRATEGIES)[number]

export const ASSET_PLACEMENTS = ["hero-full-bleed", "card-thumbnails", "none", "unknown"] as const
export type AssetPlacement = (typeof ASSET_PLACEMENTS)[number]

export const CONTACT_PATTERNS = ["generic-form", "booking-form", "catalog-cta", "unknown"] as const
export type ContactPattern = (typeof CONTACT_PATTERNS)[number]

export const CTA_STRATEGIES = ["single-action", "dual-action", "pricing-driven", "unknown"] as const
export type CtaStrategy = (typeof CTA_STRATEGIES)[number]

/** Bounded structural/visual trait slugs -- never a copy of source text, always one of these fixed tokens. */
export const DISTINCTIVE_TRAITS = [
  "rated-person-card",
  "cart-flow",
  "tabbed-content-switcher",
  "live-status-indicator",
  "catalog-browsing",
  "pricing-tier-highlight",
  "credibility-stat-row",
  "numbered-process",
  "logo-strip",
  "paired-layout-section",
] as const
export type DistinctiveTrait = (typeof DISTINCTIVE_TRAITS)[number]

/** Internal detector-flag slugs recorded in extraction metadata -- names of signals that fired, never source text. */
export type ExtractionSignal =
  | "dark-bg-literal"
  | "light-bg-literal"
  | "next-image-or-photo-url"
  | "abstract-glow-orbs"
  | "custom-hero-gradient-class"
  | "shared-nav-import"
  | "gradient-text-heading"
  | "opacity-faded-text"
  | "strong-shadow-classes"
  | "bordered-card-classes"
  | "section-id-anchors"
  | "section-comment-markers"
  | "cart-route-present"
  | "catalog-route-present"
  | "pricing-popular-flag"
  | "numbered-steps-array"
  | "rating-and-star-icon"
  | "animate-pulse-with-status-copy"
  | "paired-column-grid"

export type ExtractionConfidence = "high" | "medium" | "low"

export interface DesignReferenceIdentity {
  source: DesignReferenceSource
  sourcePath: string
  businessAffinity: BusinessAffinity
  visualFamily: VisualFamily
  designPersonality: DesignPersonality
}

export interface DesignReferencePageGrammar {
  multiPage: boolean
  pageCount: number
  pageCountBucket: PageCountBucket
  pagePurposes: PagePurpose[]
}

export interface DesignReferenceHeroGrammar {
  backgroundTreatment: HeroBackgroundTreatment
  alignment: AlignmentTendency
  mediaStrategy: HeroMediaStrategy
  ctaArrangement: CtaArrangement
  supportingSignals: DistinctiveTrait[]
}

export interface DesignReferenceSectionGrammar {
  roleSequence: SectionRole[]
  recurringTreatments: SectionTreatment[]
  density: DensityTendency
}

export interface DesignReferenceThemeGrammar {
  mode: ThemeMode
  accent: AccentTendency
  radius: RadiusTendency
  shadow: ShadowTendency
  contrast: ContrastTendency
}

export interface DesignReferenceTypographyGrammar {
  scale: TypographyScale
  alignment: AlignmentTendency
}

export interface DesignReferenceAssetGrammar {
  strategy: AssetStrategy
  placement: AssetPlacement
}

export interface DesignReferenceCompositionGrammar {
  container: ContainerStrategy
  card: CardStrategy
  density: DensityTendency
  backgroundRhythm: BackgroundRhythm
}

export interface DesignReferenceConversionGrammar {
  ctaStrategy: CtaStrategy
  contactPattern: ContactPattern
}

export interface DesignReferenceExtractionMetadata {
  extractorVersion: 1
  confidence: ExtractionConfidence
  signals: ExtractionSignal[]
}

export interface DesignReference {
  id: DesignReferenceId
  version: 1
  identity: DesignReferenceIdentity
  pageGrammar: DesignReferencePageGrammar
  heroGrammar: DesignReferenceHeroGrammar
  sectionGrammar: DesignReferenceSectionGrammar
  themeGrammar: DesignReferenceThemeGrammar
  typographyGrammar: DesignReferenceTypographyGrammar
  assetGrammar: DesignReferenceAssetGrammar
  compositionGrammar: DesignReferenceCompositionGrammar
  conversionGrammar: DesignReferenceConversionGrammar
  distinctiveTraits: DistinctiveTrait[]
  extraction: DesignReferenceExtractionMetadata
}

export function buildDesignReferenceId(slug: string): DesignReferenceId {
  return `webs:${slug}`
}
