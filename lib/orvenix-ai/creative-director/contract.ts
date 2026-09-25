import { createHash } from "node:crypto"
import {
  DESIGN_ASSISTANCE_THEME_BUCKETS_V1,
  type DesignAssistanceThemeDirectionV1,
} from "@/lib/orvenix-ai/assistance/contract"
import type { CtaIntent } from "@/lib/orvenix-ai/content/copy-helpers"
import type { CreativeDesignReferenceV1 } from "./reference-context"

/**
 * V2-4: bounded, provider-neutral contract for the AI Creative Director.
 * Sibling to lib/orvenix-ai/assistance/contract.ts -- deliberately a
 * SEPARATE module (not a refactor of the existing, already-shipped theme
 * role) because the shapes differ enough that sharing types would either
 * force theme_direction_advisor_v1's types wider than they need to be, or
 * require genericizing already-tested code for no safety benefit. The
 * validation DISCIPLINE (hasOnlyKeys/hasPrivateKey allowlisting, canonical
 * JSON fingerprinting, closed enums only) is copied deliberately, not
 * imported, to keep this module independently reviewable.
 *
 * visualDirection reuses DESIGN_ASSISTANCE_THEME_BUCKETS_V1 and
 * DesignAssistanceThemeDirectionV1 VERBATIM (imported, not duplicated) --
 * it is the exact shape applyThemeDirection (site-builder.ts) already
 * knows how to consume, so no new theme-application code is needed.
 */

export const CREATIVE_DIRECTOR_CONTRACT_V1_VERSION = 1

export const CREATIVE_DIRECTOR_ROLE_KEYS_V1 = ["creative_director_v1"] as const
export const CREATIVE_DIRECTOR_STRATEGY_KEYS_V1 = ["site_narrative_v1"] as const

export const CREATIVE_DIRECTOR_STATUSES_V1 = ["requested", "applied", "rejected", "failed"] as const
export const CREATIVE_DIRECTOR_FAILURE_CODES_V1 = ["timeout", "provider_error", "invalid_response", "validation_failed"] as const

export const CREATIVE_DIRECTOR_TONE_V1 = ["warm", "direct", "formal", "playful", "conservative"] as const
export const CREATIVE_DIRECTOR_DENSITY_V1 = ["compact", "standard", "spacious"] as const
export const CREATIVE_DIRECTOR_HERO_EMPHASIS_V1 = ["offering", "objective", "mood"] as const

/**
 * Deliberately the SAME 3 values as content/copy-helpers.ts's CtaIntent
 * (not a 4th "explore" value) -- `satisfies` below makes any future drift
 * between the two a compile error. A catalog/menu surface's "explore"
 * framing is already handled deterministically by resolveCtaCopy's own
 * isProductCatalog branch (composer/semantic-copy.ts), which always wins
 * regardless of AI input -- there is no independent "explore" case for
 * the AI to supply.
 */
export const CREATIVE_DIRECTOR_CTA_INTENT_V1 = ["appointment", "quote", "contact"] as const satisfies readonly CtaIntent[]

/**
 * Must match composition-context.ts's HERO_VARIANTS exactly (checked by a
 * dedicated cross-module test) -- kept as an independent literal here
 * rather than importing composer/composition-context.ts, so this content-
 * adjacent module never depends on the composer layer.
 */
export const CREATIVE_DIRECTOR_HERO_VARIANTS_V1 = ["centered", "split-left", "split-right", "immersive"] as const

/**
 * V2-5C: must match composition-context.ts's HERO_TREATMENTS/
 * PROCESS_VARIANTS/TWO_ITEM_LAYOUT_VARIANTS/SECTION_TONE_STRATEGIES
 * exactly (checked by a dedicated cross-module test), kept as
 * independent literals here for the same reason CREATIVE_DIRECTOR_HERO_VARIANTS_V1
 * is -- this module never depends on the composer layer. Each of these
 * is orthogonal to HeroVariant (heroTreatment) or an independent
 * per-role structural choice (the other three): every value maps to a
 * capability V2-5B/V2-5C's composer can actually execute -- no
 * aspirational enum values.
 */
export const CREATIVE_DIRECTOR_HERO_TREATMENTS_V1 = ["standard", "abstract-glow"] as const
export const CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1 = ["cards", "numbered"] as const
export const CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1 = ["paired", "cards"] as const
export const CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1 = ["standard", "soft-rhythm", "contrast-led"] as const

/**
 * V2-5C.1: Navigation & Header Composition Intelligence. Must match
 * composition-context.ts's NAVIGATION_SURFACE_STYLES/CONTAINMENTS/
 * LINK_STYLES/CTA_EMPHASES exactly (cross-module test), kept as
 * independent literals for the same reason as the other V2-5B/C
 * vocabulary above. Deliberately does NOT include the header's actual
 * light/dark color pairing -- that stays Orvenix-resolved (see
 * section-composer.ts's resolveNavigationSurface) -- so there is no
 * value here the AI could use to make navigation text unreadable
 * against its own background.
 */
export const CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1 = ["glass", "solid"] as const
export const CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1 = ["integrated", "floating"] as const
export const CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1 = ["pill", "minimal"] as const
export const CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1 = ["prominent", "none"] as const

export const CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1 = ["standard", "credibility-strip", "person-cards", "logo-strip"] as const
export const CREATIVE_DIRECTOR_TESTIMONIAL_TREATMENTS_V1 = ["standard", "rating-led"] as const
export const CREATIVE_DIRECTOR_BOOKING_PRESENTATIONS_V1 = ["standard", "booking-card"] as const
export const CREATIVE_DIRECTOR_PREMIUM_COMPOSITION_TREATMENTS_V1 = ["standard-grid", "featured-asymmetric", "editorial-alternating", "bento", "media-led"] as const

export type CreativeDirectorRoleKeyV1 = (typeof CREATIVE_DIRECTOR_ROLE_KEYS_V1)[number]
export type CreativeDirectorStrategyKeyV1 = (typeof CREATIVE_DIRECTOR_STRATEGY_KEYS_V1)[number]
export type CreativeDirectorStatusV1 = (typeof CREATIVE_DIRECTOR_STATUSES_V1)[number]
export type CreativeDirectorFailureCodeV1 = (typeof CREATIVE_DIRECTOR_FAILURE_CODES_V1)[number]
export type CreativeDirectorToneV1 = (typeof CREATIVE_DIRECTOR_TONE_V1)[number]
export type CreativeDirectorDensityV1 = (typeof CREATIVE_DIRECTOR_DENSITY_V1)[number]
export type CreativeDirectorHeroEmphasisV1 = (typeof CREATIVE_DIRECTOR_HERO_EMPHASIS_V1)[number]
export type CreativeDirectorCtaIntentV1 = (typeof CREATIVE_DIRECTOR_CTA_INTENT_V1)[number]
export type CreativeDirectorHeroVariantV1 = (typeof CREATIVE_DIRECTOR_HERO_VARIANTS_V1)[number]
export type CreativeDirectorHeroTreatmentV1 = (typeof CREATIVE_DIRECTOR_HERO_TREATMENTS_V1)[number]
export type CreativeDirectorProcessTreatmentV1 = (typeof CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1)[number]
export type CreativeDirectorTwoItemLayoutTreatmentV1 = (typeof CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1)[number]
export type CreativeDirectorSectionToneStrategyV1 = (typeof CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1)[number]
export type CreativeDirectorNavigationSurfaceStyleV1 = (typeof CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1)[number]
export type CreativeDirectorNavigationContainmentV1 = (typeof CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1)[number]
export type CreativeDirectorNavigationLinkStyleV1 = (typeof CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1)[number]
export type CreativeDirectorNavigationCtaEmphasisV1 = (typeof CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1)[number]
export type CreativeDirectorTrustTreatmentV1 = (typeof CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1)[number]
export type CreativeDirectorTestimonialTreatmentV1 = (typeof CREATIVE_DIRECTOR_TESTIMONIAL_TREATMENTS_V1)[number]
export type CreativeDirectorBookingPresentationV1 = (typeof CREATIVE_DIRECTOR_BOOKING_PRESENTATIONS_V1)[number]
export type CreativeDirectorPremiumCompositionTreatmentV1 = (typeof CREATIVE_DIRECTOR_PREMIUM_COMPOSITION_TREATMENTS_V1)[number]

export type CreativeDirectorOfferingV1 = { name: string; description?: string }

export type CreativeDirectorPageContextV1 = {
  slug: string
  purpose: string
  archetype: string
  /** The architecture recipe's own role list for this page, in its default order -- the closed set the AI may reorder from. */
  availableRoles: string[]
  /** For MVP (order-only, no presence removal), equal to availableRoles -- every role in the recipe is required to remain present. */
  requiredRoles: string[]
  defaultOrder: string[]
}

export type CreativeDirectorBusinessContextV1 = {
  name?: string
  industry?: string
  location?: string
  objective?: string
  description?: string
  preferredStyle?: string
  services?: CreativeDirectorOfferingV1[]
  products?: CreativeDirectorOfferingV1[]
}

export type CreativeDirectorDesignMemoryContextV1 = {
  industryBucket?: string | null
  objectiveBucket?: string | null
  styleBucket?: string | null
  siteType?: string | null
}

export type CreativeDirectorRequestV1 = {
  version: typeof CREATIVE_DIRECTOR_CONTRACT_V1_VERSION
  roleKey: CreativeDirectorRoleKeyV1
  strategyKey: CreativeDirectorStrategyKeyV1
  business: CreativeDirectorBusinessContextV1
  designMemory?: CreativeDirectorDesignMemoryContextV1
  pages: CreativeDirectorPageContextV1[]
  /**
   * V2-5C: up to 4 SANITIZED, provider-neutral design grammars (see
   * reference-context.ts) selected by the deterministic Design
   * Reference retrieval for this request -- design EXPERIENCE for the
   * provider to reason from, never a template to clone. Absent when
   * retrieval returned nothing (eg. an empty/uninitialized library).
   * Outgoing/trusted data (Orvenix builds this itself from its own
   * retrieval output), so it is not subject to the untrusted-response
   * validation below -- that governs the PROVIDER's reply, not this
   * request.
   */
  referenceContext?: CreativeDesignReferenceV1[]
}

export type CreativeDirectorHeroDirectionV1 = {
  emphasis: CreativeDirectorHeroEmphasisV1
  preferredOfferingName?: string
}

export type CreativeDirectorAssetIntentV1 = {
  subject: string
  mood?: string
}

export type CreativeDirectorPageDirectionV1 = {
  slug: string
  narrativeGoal: string
  heroDirection?: CreativeDirectorHeroDirectionV1
  heroTitleSuggestion?: string
  heroDescriptionSuggestion?: string
  preferredHeroVariant?: CreativeDirectorHeroVariantV1
  highlightedOfferings?: string[]
  ctaIntent?: CreativeDirectorCtaIntentV1
  assetIntent?: CreativeDirectorAssetIntentV1
  preferredSectionOrder?: string[]
  /**
   * V2-5C: bounded V2-5B executable-vocabulary requests. Each is
   * independent of preferredHeroVariant/assetIntent (which already
   * cover WHICH hero layout and WHAT imagery/mood to seek -- see this
   * module's header for why immersive photography gets no new field
   * here) and of each other. Orvenix's composer treats every one of
   * these as an override on top of its own deterministic/weighted
   * selection, never a requirement to invent new composition
   * capability -- see composer/section-composer.ts.
   */
  heroTreatment?: CreativeDirectorHeroTreatmentV1
  processTreatment?: CreativeDirectorProcessTreatmentV1
  twoItemLayoutTreatment?: CreativeDirectorTwoItemLayoutTreatmentV1
  /** A STRATEGY, never a color/class -- see composition-context.ts's SECTION_TONE_POOLS for how Orvenix deterministically resolves it. */
  sectionToneStrategy?: CreativeDirectorSectionToneStrategyV1
}

export type CreativeSiteDirectionV1 = {
  version: typeof CREATIVE_DIRECTOR_CONTRACT_V1_VERSION
  roleKey: CreativeDirectorRoleKeyV1
  strategyKey: CreativeDirectorStrategyKeyV1
  siteNarrative: string
  tone?: CreativeDirectorToneV1
  visualDirection?: DesignAssistanceThemeDirectionV1
  density?: CreativeDirectorDensityV1
  /**
   * V2-5C.1: SITE-level (sibling to density/tone above), not per-page --
   * navigation provides site-wide identity coherence (Phase N), so the
   * SAME choice threads into every page's header, the same way density
   * already does. Absent -> composeNavigation's existing pre-V2-5C.1
   * defaults, unchanged.
   */
  navigationSurfaceStyle?: CreativeDirectorNavigationSurfaceStyleV1
  navigationContainment?: CreativeDirectorNavigationContainmentV1
  navigationLinkStyle?: CreativeDirectorNavigationLinkStyleV1
  navigationCtaEmphasis?: CreativeDirectorNavigationCtaEmphasisV1
  trustTreatment?: CreativeDirectorTrustTreatmentV1
  testimonialTreatment?: CreativeDirectorTestimonialTreatmentV1
  bookingPresentation?: CreativeDirectorBookingPresentationV1
  /** V2-5E: site-level, bounded layout intent. Orvenix resolves concrete wrappers/classes locally. */
  premiumCompositionTreatment?: CreativeDirectorPremiumCompositionTreatmentV1
  pageDirections: CreativeDirectorPageDirectionV1[]
}

export type CreativeDirectorAttributionV1 = {
  version: typeof CREATIVE_DIRECTOR_CONTRACT_V1_VERSION
  roleKey: CreativeDirectorRoleKeyV1
  strategyKey: CreativeDirectorStrategyKeyV1
  providerKey: string
  modelKey: string
  status: CreativeDirectorStatusV1
  inputFingerprint: string
  outputFingerprint?: string
  failureCode?: CreativeDirectorFailureCodeV1
}

export type CreativeDirectorValidationResultV1<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

export interface CreativeDirectorProviderV1 {
  request(input: CreativeDirectorRequestV1): Promise<CreativeSiteDirectionV1 | null>
}

/**
 * Mirrors assistance/contract.ts's PRIVATE_FIELD_NAMES blocklist
 * (duplicated, not imported -- see module header). Any request/proposal
 * containing one of these field names, at any validated object level,
 * fails closed.
 */
const PRIVATE_FIELD_NAMES = new Set([
  "userid",
  "siteid",
  "request",
  "initialplan",
  "businessname",
  "phone",
  "email",
  "url",
  "image",
  "prompt",
  "response",
  "rawinput",
  "rawoutput",
  "apikey",
  "outcomescore",
  "editdistance",
  "publishrate",
  "rankingscore",
])

const PROVIDER_MODEL_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/
const SLUG_PATTERN = /^[a-z0-9-]{1,64}$/
const ROLE_NAME_PATTERN = /^[a-z][a-z0-9-]{0,31}$/
const SAFE_SEARCH_TEXT_PATTERN = /^[a-zA-Z0-9À-ÿ ,.'-]+$/

const MAX_SITE_NARRATIVE_LENGTH = 240
const MAX_NARRATIVE_GOAL_LENGTH = 240
const MAX_HERO_TITLE_LENGTH = 80
const MAX_HERO_DESCRIPTION_LENGTH = 180
const MAX_OFFERING_NAME_LENGTH = 90
const MAX_HIGHLIGHTED_OFFERINGS = 2
const MAX_ASSET_SUBJECT_LENGTH = 60
const MAX_ASSET_MOOD_LENGTH = 30
const MAX_PAGE_DIRECTIONS = 8
const MAX_SECTION_ORDER_LENGTH = 16

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]) {
  const allowed = new Set(allowedKeys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function hasPrivateKey(value: Record<string, unknown>) {
  return Object.keys(value).some((key) => PRIVATE_FIELD_NAMES.has(key.toLowerCase()))
}

function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | null {
  return typeof value === "string" && values.includes(value) ? value : null
}

function optionalEnumValue<T extends readonly string[]>(value: unknown, values: T) {
  if (value === undefined) return undefined
  return enumValue(value, values) ?? undefined
}

function optionalBoundedString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) return undefined
  return trimmed
}

function isProviderModelKey(value: unknown): value is string {
  return typeof value === "string" && PROVIDER_MODEL_KEY_PATTERN.test(value)
}

function canonicalizeJsonValue(value: unknown): unknown {
  if (value === null) return null
  if (typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error("JSON canonico invalido.")
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalizeJsonValue)
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalizeJsonValue(entry)]),
    )
  }
  throw new Error("JSON canonico invalido.")
}

export function canonicalCreativeDirectorJsonV1(value: unknown) {
  return JSON.stringify(canonicalizeJsonValue(value))
}

function hashCanonical(value: unknown) {
  return createHash("sha256").update(canonicalCreativeDirectorJsonV1(value)).digest("hex")
}

/**
 * Lenient (section 8): an invalid individual bucket axis (eg. an
 * unrecognized accentHue) is simply omitted from the result -- it never
 * fails the whole visualDirection object, let alone the whole proposal.
 * A structurally suspicious value (private-key smuggling, unknown keys)
 * drops visualDirection entirely, falling back to the V2-1 deterministic
 * baseline for every axis.
 */
function normalizeVisualDirection(value: unknown): DesignAssistanceThemeDirectionV1 | undefined {
  if (value === undefined) return undefined
  if (!isPlainRecord(value)) return undefined
  if (hasPrivateKey(value) || !hasOnlyKeys(value, Object.keys(DESIGN_ASSISTANCE_THEME_BUCKETS_V1))) return undefined

  const direction: DesignAssistanceThemeDirectionV1 = {}
  const mode = optionalEnumValue(value.mode, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.mode)
  const accentHue = optionalEnumValue(value.accentHue, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.accentHue)
  const contrastBucket = optionalEnumValue(value.contrastBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.contrastBucket)
  const radiusBucket = optionalEnumValue(value.radiusBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.radiusBucket)
  const typographyBucket = optionalEnumValue(value.typographyBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.typographyBucket)
  const motionBucket = optionalEnumValue(value.motionBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.motionBucket)

  if (mode !== undefined) direction.mode = mode
  if (accentHue !== undefined) direction.accentHue = accentHue
  if (contrastBucket !== undefined) direction.contrastBucket = contrastBucket
  if (radiusBucket !== undefined) direction.radiusBucket = radiusBucket
  if (typographyBucket !== undefined) direction.typographyBucket = typographyBucket
  if (motionBucket !== undefined) direction.motionBucket = motionBucket

  return direction
}

/*
 * V2-4 section 8 ("one bad field should not destroy valid independent
 * guidance"): every normalizer below this point is LENIENT -- an invalid
 * or oversized SOFT field is silently omitted (never persisted, never
 * consumed), but never fails the surrounding pageDirection or proposal.
 * Only structurally essential fields (a pageDirection's slug/
 * narrativeGoal; the proposal's version/roleKey/strategyKey/
 * pageDirections array itself) can still cause a hard rejection --
 * everything a provider might get subtly wrong about a SUGGESTION
 * (an oversized title, one too many highlighted offerings, an invalid
 * enum) degrades that one suggestion to "absent", not the whole proposal.
 */

function normalizeHeroDirection(value: unknown): CreativeDirectorHeroDirectionV1 | undefined {
  if (value === undefined || !isPlainRecord(value)) return undefined
  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["emphasis", "preferredOfferingName"])) return undefined

  const emphasis = enumValue(value.emphasis, CREATIVE_DIRECTOR_HERO_EMPHASIS_V1)
  if (!emphasis) return undefined

  const preferredOfferingName = optionalBoundedString(value.preferredOfferingName, MAX_OFFERING_NAME_LENGTH)
  return { emphasis, ...(preferredOfferingName ? { preferredOfferingName } : {}) }
}

function normalizeAssetIntent(value: unknown): CreativeDirectorAssetIntentV1 | undefined {
  if (value === undefined || !isPlainRecord(value)) return undefined
  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["subject", "mood"])) return undefined

  const subject = typeof value.subject === "string" ? value.subject.trim() : ""
  if (!subject || subject.length > MAX_ASSET_SUBJECT_LENGTH || !SAFE_SEARCH_TEXT_PATTERN.test(subject)) return undefined

  let mood: string | undefined
  if (value.mood !== undefined) {
    const trimmedMood = typeof value.mood === "string" ? value.mood.trim() : ""
    if (!trimmedMood || trimmedMood.length > MAX_ASSET_MOOD_LENGTH || !SAFE_SEARCH_TEXT_PATTERN.test(trimmedMood)) return undefined
    mood = trimmedMood
  }

  return { subject, ...(mood ? { mood } : {}) }
}

function normalizeHighlightedOfferings(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_HIGHLIGHTED_OFFERINGS) return undefined
  const names: string[] = []
  for (const entry of value) {
    const name = optionalBoundedString(entry, MAX_OFFERING_NAME_LENGTH)
    if (!name) return undefined
    names.push(name)
  }
  return names
}

function normalizeSectionOrder(value: unknown): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_SECTION_ORDER_LENGTH) return undefined
  const roles: string[] = []
  for (const entry of value) {
    if (typeof entry !== "string" || !ROLE_NAME_PATTERN.test(entry)) return undefined
    roles.push(entry)
  }
  return roles
}

function normalizePageDirection(value: unknown): CreativeDirectorPageDirectionV1 | undefined {
  if (!isPlainRecord(value)) return undefined

  const allowedKeys = [
    "slug",
    "narrativeGoal",
    "heroDirection",
    "heroTitleSuggestion",
    "heroDescriptionSuggestion",
    "preferredHeroVariant",
    "highlightedOfferings",
    "ctaIntent",
    "assetIntent",
    "preferredSectionOrder",
    "heroTreatment",
    "processTreatment",
    "twoItemLayoutTreatment",
    "sectionToneStrategy",
  ]

  // A structurally suspicious sub-object (private-key smuggling, unknown
  // keys) drops this ONE pageDirection -- never the rest of the proposal.
  if (hasPrivateKey(value) || !hasOnlyKeys(value, allowedKeys)) {
    return undefined
  }

  // slug/narrativeGoal are the only HARD requirements for a pageDirection
  // to exist at all -- everything below is a lenient, independently-
  // droppable suggestion (section 8).
  const slug = typeof value.slug === "string" ? value.slug.trim().toLowerCase() : ""
  if (!SLUG_PATTERN.test(slug)) return undefined

  const narrativeGoal = optionalBoundedString(value.narrativeGoal, MAX_NARRATIVE_GOAL_LENGTH)
  if (!narrativeGoal) return undefined

  const heroDirection = normalizeHeroDirection(value.heroDirection)
  const heroTitleSuggestion = optionalBoundedString(value.heroTitleSuggestion, MAX_HERO_TITLE_LENGTH)
  const heroDescriptionSuggestion = optionalBoundedString(value.heroDescriptionSuggestion, MAX_HERO_DESCRIPTION_LENGTH)
  const preferredHeroVariant = optionalEnumValue(value.preferredHeroVariant, CREATIVE_DIRECTOR_HERO_VARIANTS_V1)
  const highlightedOfferings = normalizeHighlightedOfferings(value.highlightedOfferings)
  const ctaIntent = optionalEnumValue(value.ctaIntent, CREATIVE_DIRECTOR_CTA_INTENT_V1)
  const assetIntent = normalizeAssetIntent(value.assetIntent)
  const preferredSectionOrder = normalizeSectionOrder(value.preferredSectionOrder)
  const heroTreatment = optionalEnumValue(value.heroTreatment, CREATIVE_DIRECTOR_HERO_TREATMENTS_V1)
  const processTreatment = optionalEnumValue(value.processTreatment, CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1)
  const twoItemLayoutTreatment = optionalEnumValue(value.twoItemLayoutTreatment, CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1)
  const sectionToneStrategy = optionalEnumValue(value.sectionToneStrategy, CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1)

  return {
    slug,
    narrativeGoal,
    ...(heroDirection ? { heroDirection } : {}),
    ...(heroTitleSuggestion ? { heroTitleSuggestion } : {}),
    ...(heroDescriptionSuggestion ? { heroDescriptionSuggestion } : {}),
    ...(preferredHeroVariant ? { preferredHeroVariant } : {}),
    ...(highlightedOfferings ? { highlightedOfferings } : {}),
    ...(ctaIntent ? { ctaIntent } : {}),
    ...(assetIntent ? { assetIntent } : {}),
    ...(preferredSectionOrder ? { preferredSectionOrder } : {}),
    ...(heroTreatment ? { heroTreatment } : {}),
    ...(processTreatment ? { processTreatment } : {}),
    ...(twoItemLayoutTreatment ? { twoItemLayoutTreatment } : {}),
    ...(sectionToneStrategy ? { sectionToneStrategy } : {}),
  }
}

/**
 * Validates UNTRUSTED provider output. Schema/shape only -- semantic fact
 * safety (offering-name matching, forbidden-claim/number sweeps) is a
 * SEPARATE later layer (fact-validation.ts), run only after this passes,
 * so a schema-invalid response never reaches it.
 */
export function validateCreativeSiteDirectionV1(value: unknown): CreativeDirectorValidationResultV1<CreativeSiteDirectionV1> {
  const errors: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["CreativeSiteDirectionV1 debe ser un objeto."] }
  }

  if (
    hasPrivateKey(value) ||
    !hasOnlyKeys(value, [
      "version",
      "roleKey",
      "strategyKey",
      "siteNarrative",
      "tone",
      "visualDirection",
      "density",
      "navigationSurfaceStyle",
      "navigationContainment",
      "navigationLinkStyle",
      "navigationCtaEmphasis",
      "trustTreatment",
      "testimonialTreatment",
      "bookingPresentation",
      "premiumCompositionTreatment",
      "pageDirections",
    ])
  ) {
    errors.push("CreativeSiteDirectionV1 contiene campos no permitidos.")
  }

  const roleKey = enumValue(value.roleKey, CREATIVE_DIRECTOR_ROLE_KEYS_V1)
  const strategyKey = enumValue(value.strategyKey, CREATIVE_DIRECTOR_STRATEGY_KEYS_V1)
  // siteNarrative is lenient too: missing/oversized/invalid just becomes
  // "" (never blocks) -- it is stored for traceability only, never
  // rendered, so there is no fabrication risk in a soft default here.
  const siteNarrative = optionalBoundedString(value.siteNarrative, MAX_SITE_NARRATIVE_LENGTH) ?? ""
  const tone = optionalEnumValue(value.tone, CREATIVE_DIRECTOR_TONE_V1)
  const visualDirection = normalizeVisualDirection(value.visualDirection)
  const density = optionalEnumValue(value.density, CREATIVE_DIRECTOR_DENSITY_V1)
  const navigationSurfaceStyle = optionalEnumValue(value.navigationSurfaceStyle, CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1)
  const navigationContainment = optionalEnumValue(value.navigationContainment, CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1)
  const navigationLinkStyle = optionalEnumValue(value.navigationLinkStyle, CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1)
  const navigationCtaEmphasis = optionalEnumValue(value.navigationCtaEmphasis, CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1)
  const trustTreatment = optionalEnumValue(value.trustTreatment, CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1)
  const testimonialTreatment = optionalEnumValue(value.testimonialTreatment, CREATIVE_DIRECTOR_TESTIMONIAL_TREATMENTS_V1)
  const bookingPresentation = optionalEnumValue(value.bookingPresentation, CREATIVE_DIRECTOR_BOOKING_PRESENTATIONS_V1)
  const premiumCompositionTreatment = optionalEnumValue(value.premiumCompositionTreatment, CREATIVE_DIRECTOR_PREMIUM_COMPOSITION_TREATMENTS_V1)

  // HARD requirements: a role/strategy mismatch is a different contract
  // entirely (not a "bad field"), and a proposal with zero usable page
  // directions is simply useless -- both fail the whole proposal so the
  // gateway can treat this as a clean validation_failed and fall back.
  if (value.version !== CREATIVE_DIRECTOR_CONTRACT_V1_VERSION) errors.push("version no es valida.")
  if (!roleKey) errors.push("roleKey no es valido.")
  if (!strategyKey) errors.push("strategyKey no es valido.")

  if (!Array.isArray(value.pageDirections) || value.pageDirections.length === 0 || value.pageDirections.length > MAX_PAGE_DIRECTIONS) {
    errors.push(`pageDirections debe ser un arreglo de 1-${MAX_PAGE_DIRECTIONS} elementos.`)
  }

  const pageDirections: CreativeDirectorPageDirectionV1[] = []
  if (Array.isArray(value.pageDirections)) {
    for (const entry of value.pageDirections) {
      const normalized = normalizePageDirection(entry)
      if (normalized) pageDirections.push(normalized)
    }
  }
  if (Array.isArray(value.pageDirections) && value.pageDirections.length > 0 && pageDirections.length === 0) {
    errors.push("pageDirections no contiene ninguna direccion de pagina valida.")
  }

  if (errors.length || !roleKey || !strategyKey || pageDirections.length === 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      version: CREATIVE_DIRECTOR_CONTRACT_V1_VERSION,
      roleKey,
      strategyKey,
      siteNarrative,
      ...(tone ? { tone } : {}),
      ...(visualDirection && Object.keys(visualDirection).length ? { visualDirection } : {}),
      ...(density ? { density } : {}),
      ...(navigationSurfaceStyle ? { navigationSurfaceStyle } : {}),
      ...(navigationContainment ? { navigationContainment } : {}),
      ...(navigationLinkStyle ? { navigationLinkStyle } : {}),
      ...(navigationCtaEmphasis ? { navigationCtaEmphasis } : {}),
      ...(trustTreatment ? { trustTreatment } : {}),
      ...(testimonialTreatment ? { testimonialTreatment } : {}),
      ...(bookingPresentation ? { bookingPresentation } : {}),
      ...(premiumCompositionTreatment ? { premiumCompositionTreatment } : {}),
      pageDirections,
    },
  }
}

export function validateCreativeDirectorAttributionV1(value: unknown): CreativeDirectorValidationResultV1<CreativeDirectorAttributionV1> {
  const errors: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["La attribution del creative director debe ser un objeto."] }
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["version", "roleKey", "strategyKey", "providerKey", "modelKey", "status", "inputFingerprint", "outputFingerprint", "failureCode"])) {
    errors.push("La attribution del creative director contiene campos no permitidos.")
  }

  const roleKey = enumValue(value.roleKey, CREATIVE_DIRECTOR_ROLE_KEYS_V1)
  const strategyKey = enumValue(value.strategyKey, CREATIVE_DIRECTOR_STRATEGY_KEYS_V1)
  const status = enumValue(value.status, CREATIVE_DIRECTOR_STATUSES_V1)
  const failureCode = value.failureCode === undefined ? undefined : enumValue(value.failureCode, CREATIVE_DIRECTOR_FAILURE_CODES_V1)

  if (value.version !== CREATIVE_DIRECTOR_CONTRACT_V1_VERSION) errors.push("version no es valida.")
  if (!roleKey) errors.push("roleKey no es valido.")
  if (!strategyKey) errors.push("strategyKey no es valido.")
  if (!isProviderModelKey(value.providerKey)) errors.push("providerKey no es valido.")
  if (!isProviderModelKey(value.modelKey)) errors.push("modelKey no es valido.")
  if (!status) errors.push("status no es valido.")
  if (typeof value.inputFingerprint !== "string" || !SHA256_HEX_PATTERN.test(value.inputFingerprint)) {
    errors.push("inputFingerprint no es valido.")
  }

  const hasOutput = value.outputFingerprint !== undefined
  if (hasOutput && (typeof value.outputFingerprint !== "string" || !SHA256_HEX_PATTERN.test(value.outputFingerprint))) {
    errors.push("outputFingerprint no es valido.")
  }

  if ((status === "requested" || status === "failed") && hasOutput) errors.push(`${status} no debe incluir outputFingerprint.`)
  if ((status === "applied" || status === "rejected") && !hasOutput) errors.push(`${status} requiere outputFingerprint.`)
  if (status !== "failed" && value.failureCode !== undefined) errors.push("failureCode solo se permite con status failed.")
  if (value.failureCode !== undefined && !failureCode) errors.push("failureCode no es valido.")

  if (errors.length || !roleKey || !strategyKey || !status) return { ok: false, errors }

  return {
    ok: true,
    value: {
      version: CREATIVE_DIRECTOR_CONTRACT_V1_VERSION,
      roleKey,
      strategyKey,
      providerKey: value.providerKey as string,
      modelKey: value.modelKey as string,
      status,
      inputFingerprint: value.inputFingerprint as string,
      ...(typeof value.outputFingerprint === "string" ? { outputFingerprint: value.outputFingerprint } : {}),
      ...(failureCode ? { failureCode } : {}),
    },
  }
}

export function createCreativeDirectorInputFingerprintV1(request: CreativeDirectorRequestV1) {
  return hashCanonical(request)
}

export function createCreativeDirectorOutputFingerprintV1(proposal: CreativeSiteDirectionV1) {
  const validation = validateCreativeSiteDirectionV1(proposal)
  if (validation.ok === false) {
    throw new Error(`CreativeSiteDirectionV1 invalido: ${validation.errors.join(" ")}`)
  }
  return hashCanonical(validation.value)
}
