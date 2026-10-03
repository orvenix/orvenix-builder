import {
  CREATIVE_DIRECTOR_DENSITY_V1,
  CREATIVE_DIRECTOR_HERO_TREATMENTS_V1,
  CREATIVE_DIRECTOR_HERO_VARIANTS_V1,
  CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1,
  CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1,
  CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1,
  CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1,
  CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1,
  CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1,
} from "@/lib/orvenix-ai/creative-director/contract"

/**
 * CSC-1B: CommercialDesignV1 -- a declarative, code-side, immutable
 * (per id@version) RECIPE for a sellable Orvenix design.
 *
 * It describes design INTENT only: which pages exist, which section roles
 * each page carries (the composer's own SectionRole vocabulary), which
 * bounded presentation pins apply (the Creative Director's own closed
 * enums), which facts and asset roles each section needs, and how the
 * design degrades when they are missing. It is compiled by the EXISTING
 * autonomous builder into the EXISTING SiteCreationPlanV2 -- it is never a
 * second template engine and never persisted as a tree.
 *
 * It deliberately has NO field for: EditorTree/nodes, HTML, JSX/React,
 * component names, CSS, class names, Tailwind strings, executable code,
 * business facts, product facts, prices, testimonials or stats. The strict
 * validator (validator.ts) rejects any unknown key at every level.
 */

export const COMMERCIAL_DESIGN_CONTRACT_VERSION_V1 = 1 as const

export const COMMERCIAL_DESIGN_FAMILIES_V1 = [
  "local-services",
  "catalog-commerce",
  "specialty-food",
  "hospitality",
  "professional",
  "construction",
  "made-to-order-craft",
] as const

/** The composer's own SectionRole vocabulary (subset a commercial design may request). */
export const COMMERCIAL_SECTION_ROLES_V1 = [
  "navigation",
  "hero",
  "services",
  "features",
  "pricing",
  "process",
  "gallery",
  "trust",
  "testimonials",
  "faq",
  "cta",
  "contact",
  "footer",
] as const

/** The architect's PageArchetype vocabulary. */
export const COMMERCIAL_PAGE_ARCHETYPES_V1 = ["overview", "catalog", "conversion"] as const

/** The architect's site types a commercial design may declare. */
export const COMMERCIAL_SITE_TYPES_V1 = ["business", "health", "restaurant", "agency"] as const

/**
 * Fact keys a section/page may REQUIRE. A section whose required facts are
 * missing is omitted (never filled with generic factual content).
 */
export const COMMERCIAL_FACT_KEYS_V1 = [
  "businessName",
  "contactChannel",
  "whatsapp",
  "phone",
  "email",
  "logo",
  "tagline",
  "address",
  "hours",
  "serviceArea",
  "services",
  "servicePrices",
  "social",
  "faq",
  "testimonials",
  "people",
] as const

/**
 * Semantic asset roles. Only the roles marked implemented are bound by
 * CSC-1B; the rest are reserved vocabulary for Construction/Craft (later
 * blocks) so the contract never needs a breaking change to add them.
 */
export const COMMERCIAL_ASSET_ROLES_V1 = [
  "hero",
  "serviceImage",
  "heroProject",
  "featuredProject",
  "projectProgress",
  "specialtyService",
  "companyProof",
  "projectGallery",
  "featuredCraft",
  "categoryExample",
  "processExample",
  "galleryPiece",
  "detailStory",
] as const
export const COMMERCIAL_IMPLEMENTED_ASSET_ROLES_V1 = ["hero", "serviceImage"] as const

export const COMMERCIAL_CONVERSION_INTENTS_V1 = ["contact", "quote", "whatsapp", "booking", "purchase"] as const
export const COMMERCIAL_FOOTER_PRESETS_V1 = ["minimal", "standard", "rich"] as const
export const COMMERCIAL_THEME_MODES_V1 = ["light", "dark"] as const
/** Fonts actually loaded by components/editor/theme/font-catalog.ts. */
export const COMMERCIAL_FONTS_V1 = ["Inter", "Playfair Display", "Oswald", "JetBrains Mono"] as const
export const COMMERCIAL_RADIUS_PRESETS_V1 = ["sharp", "soft", "pill"] as const
export const COMMERCIAL_SHADOW_PRESETS_V1 = ["none", "soft", "strong"] as const
/** Reserved for the decorative motif system (Construction/Craft). CSC-1B only knows "none". */
export const COMMERCIAL_MOTIFS_V1 = ["none"] as const
export const COMMERCIAL_SEO_TITLE_PATTERNS_V1 = ["page-business", "business-page"] as const

export type CommercialDesignFamilyV1 = (typeof COMMERCIAL_DESIGN_FAMILIES_V1)[number]
export type CommercialSectionRoleV1 = (typeof COMMERCIAL_SECTION_ROLES_V1)[number]
export type CommercialPageArchetypeV1 = (typeof COMMERCIAL_PAGE_ARCHETYPES_V1)[number]
export type CommercialSiteTypeV1 = (typeof COMMERCIAL_SITE_TYPES_V1)[number]
export type CommercialFactKeyV1 = (typeof COMMERCIAL_FACT_KEYS_V1)[number]
export type CommercialAssetRoleV1 = (typeof COMMERCIAL_ASSET_ROLES_V1)[number]
export type CommercialConversionIntentV1 = (typeof COMMERCIAL_CONVERSION_INTENTS_V1)[number]
export type CommercialFooterPresetV1 = (typeof COMMERCIAL_FOOTER_PRESETS_V1)[number]

/** Bounded page-level presentation pins -- the Creative Director's own closed enums. */
export interface CommercialPagePinsV1 {
  heroVariant?: (typeof CREATIVE_DIRECTOR_HERO_VARIANTS_V1)[number]
  heroTreatment?: (typeof CREATIVE_DIRECTOR_HERO_TREATMENTS_V1)[number]
  processTreatment?: (typeof CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1)[number]
  sectionToneStrategy?: (typeof CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1)[number]
}

/** Safe recomposition: alternative pins when a fact is missing (eg. no hero photo -> typographic hero). */
export interface CommercialPinFallbackV1 {
  whenMissing: CommercialFactKeyV1 | `asset:${CommercialAssetRoleV1}`
  pins: CommercialPagePinsV1
}

export interface CommercialSectionRecipeV1 {
  role: CommercialSectionRoleV1
  /** Section is omitted unless every listed fact exists. */
  requiresFacts?: CommercialFactKeyV1[]
  /** Section is omitted unless every listed asset role has at least one asset. */
  requiresAssets?: CommercialAssetRoleV1[]
  /** Asset roles this section consumes (binding + provenance). */
  assetRoles?: CommercialAssetRoleV1[]
}

export interface CommercialPageRecipeV1 {
  slug: string
  /** Customer-facing page name (short, plain text). */
  name: string
  archetype: CommercialPageArchetypeV1
  /** Page is omitted unless every listed fact exists (required pages must not declare any). */
  requiresFacts?: CommercialFactKeyV1[]
  pins?: CommercialPagePinsV1
  pinFallbacks?: CommercialPinFallbackV1[]
  sections: CommercialSectionRecipeV1[]
}

export interface CommercialThemeSeedV1 {
  mode: (typeof COMMERCIAL_THEME_MODES_V1)[number]
  /** Hex colors only (#rrggbb) -- never CSS. */
  colors: { primary: string; secondary: string; background: string; text: string; accent: string }
  fontHeading: (typeof COMMERCIAL_FONTS_V1)[number]
  fontBody: (typeof COMMERCIAL_FONTS_V1)[number]
  radius: (typeof COMMERCIAL_RADIUS_PRESETS_V1)[number]
  shadow: (typeof COMMERCIAL_SHADOW_PRESETS_V1)[number]
}

export interface CommercialSiteChromeV1 {
  density?: (typeof CREATIVE_DIRECTOR_DENSITY_V1)[number]
  navigationSurfaceStyle?: (typeof CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1)[number]
  navigationContainment?: (typeof CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1)[number]
  navigationLinkStyle?: (typeof CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1)[number]
  navigationCtaEmphasis?: (typeof CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1)[number]
  trustTreatment?: (typeof CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1)[number]
  pricingTreatment?: (typeof CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1)[number]
  footerPreset: CommercialFooterPresetV1
  /** Render the business logo in the header when the fact exists (text brand mark otherwise). */
  showLogo: boolean
}

export interface CommercialConversionV1 {
  /** Ordered preference; the first intent the facts can satisfy becomes the primary CTA. */
  primary: CommercialConversionIntentV1[]
}

export interface CommercialCatalogPresentationV1 {
  /** Customer-facing commercial name. */
  name: string
  /** Short customer-facing description. */
  summary: string
  /** Short labels of business fits (eg. "Plomería"). */
  businessFit: string[]
  /** Short style/archetype labels (eg. "Claro", "Enfocado en WhatsApp"). */
  styleLabels: string[]
}

export interface CommercialDesignV1 {
  contract: typeof COMMERCIAL_DESIGN_CONTRACT_VERSION_V1
  id: string
  version: number
  family: CommercialDesignFamilyV1
  siteType: CommercialSiteTypeV1
  catalog: CommercialCatalogPresentationV1
  theme: CommercialThemeSeedV1
  chrome: CommercialSiteChromeV1
  conversion: CommercialConversionV1
  motif: (typeof COMMERCIAL_MOTIFS_V1)[number]
  seo: { titlePattern: (typeof COMMERCIAL_SEO_TITLE_PATTERNS_V1)[number] }
  pages: CommercialPageRecipeV1[]
  /** INTERNAL design-reference note (never shown to customers, never copied into trees). */
  internalReference: string
}

/** Stable identity string for a design version, eg. "servicios-locales@1". */
export function commercialDesignKeyV1(design: Pick<CommercialDesignV1, "id" | "version">): string {
  return `${design.id}@${design.version}`
}

/**
 * ARCHITECTURAL INVARIANT (captured, NOT implemented in CSC-1B): any
 * optimized derivative generated from a customer/owner-uploaded photo must
 * strip EXIF/GPS metadata before publication. CSC-1B binds only
 * already-uploaded assets by URL and generates no derivatives.
 */
export const EXIF_GPS_STRIP_REQUIREMENT_V1 = {
  requirement: "published-optimized-derivatives-strip-exif-gps",
  implemented: false,
} as const
