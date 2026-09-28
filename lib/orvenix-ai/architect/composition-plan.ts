import type { SectionRole } from "./block-selector"
import {
  BOOKING_PRESENTATIONS,
  HERO_TREATMENTS,
  PREMIUM_COMPOSITION_TREATMENTS,
  PRICING_TREATMENTS,
  SECTION_INSTANCE_ALIGNMENTS,
  SECTION_INSTANCE_MEDIA_STRATEGIES,
  SECTION_INSTANCE_SCALES,
  SECTION_INSTANCE_VISUAL_PRIMITIVES,
  SECTION_TONE_STRATEGIES,
  TESTIMONIAL_TREATMENTS,
  TRUST_TREATMENTS,
  type BookingPresentation,
  type HeroTreatment,
  type PremiumCompositionTreatment,
  type PricingTreatment,
  type SectionInstanceAlignment,
  type SectionInstanceMediaStrategy,
  type SectionInstanceScale,
  type SectionInstanceVisualPrimitive,
  type SectionToneStrategy,
  type TestimonialTreatment,
  type TrustTreatment,
} from "../composer/composition-context"
import { isValidSectionVisualLayoutPlan, type SectionVisualLayoutPlan } from "../composer/visual-layout-plan"

/**
 * V2-6.1: Bounded Composition Plan contract.
 *
 * Orvenix's SectionRole[] answers "which semantic roles does this page
 * have, in what order" (see architect/site-architect.ts). It cannot
 * express "three separately-composed services moments, each bound to one
 * real service, each with its own alignment" -- that needs a concrete,
 * ordered list of INSTANCES, not roles. A SectionInstancePlan is exactly
 * that: one instance of a role, bound to a specific grounded selection of
 * REAL business data, plus a small bounded set of composition
 * directives.
 *
 * This module is provider-neutral: it has no dependency on Anthropic,
 * Design Reference, or any specific AI provider. It only depends on
 * SectionRole (the existing role vocabulary) and the composer's existing
 * bounded presentation vocabulary (composition-context.ts) -- reusing it
 * rather than inventing a parallel one, per the "prove existing
 * vocabulary cannot represent the distinction before adding a new
 * enum" rule. `scale`/`alignment`/`mediaStrategy` are the only genuinely
 * new bounded additions (composition-context.ts documents why no
 * existing enum already covers them).
 *
 * Safety, by construction:
 *   - no field accepts arbitrary CSS, className, HTML, JSX, or a
 *     component name -- every field is a closed string union or a
 *     validated numeric index.
 *   - selection never invents an item: see selectGroundedItems below.
 *   - isValidSectionInstancePlan is an ALLOWLIST validator (rejects any
 *     unrecognized key or out-of-vocabulary value) for untrusted/dynamic
 *     input -- the TypeScript types alone only protect statically-typed
 *     call sites.
 */

export type SectionInstanceSelectionMode = "all" | "single-item" | "subset"

export interface SectionInstanceSelection {
  mode: SectionInstanceSelectionMode
  /** Meaningful, and required to select anything, only for mode "single-item". Out-of-range -> selectGroundedItems returns []. */
  itemIndex?: number
  /** Meaningful, and required to select anything, only for mode "subset". Out-of-range/duplicate indexes are dropped, never invented. */
  indexes?: number[]
}

/**
 * The bounded set of "treatment" values a SectionInstancePlan may
 * request, unioned from every existing PER-ROLE treatment vocabulary the
 * composer already has (composition-context.ts). Which sub-vocabulary is
 * valid depends on the instance's `role` -- see
 * ROLE_TREATMENT_VOCABULARY below and compiler/section-instance-context.ts,
 * which dispatches by role and silently ignores a treatment that isn't
 * valid for that role rather than guessing.
 */
export type SectionInstanceTreatment =
  | PremiumCompositionTreatment
  | HeroTreatment
  | TrustTreatment
  | TestimonialTreatment
  | BookingPresentation
  | PricingTreatment

/** Which bounded treatment vocabulary (and which existing composer field it ultimately maps to) applies for a given role. Extend this table, never invent a new open-ended field, when a future role needs its own treatment vocabulary. */
export const ROLE_TREATMENT_VOCABULARY: Partial<Record<SectionRole, readonly string[]>> = {
  hero: HERO_TREATMENTS,
  trust: TRUST_TREATMENTS,
  testimonials: TESTIMONIAL_TREATMENTS,
  contact: BOOKING_PRESENTATIONS,
  pricing: PRICING_TREATMENTS,
  services: PREMIUM_COMPOSITION_TREATMENTS,
  products: PREMIUM_COMPOSITION_TREATMENTS,
  features: PREMIUM_COMPOSITION_TREATMENTS,
  gallery: PREMIUM_COMPOSITION_TREATMENTS,
  content: PREMIUM_COMPOSITION_TREATMENTS,
}

/**
 * V2-6.2: which of the 4 high-contrast visual composition primitives are
 * meaningful for a given role. A primitive listed here is REQUIRED to
 * genuinely change composer output for that role (see
 * lib/orvenix-ai/composer/section-composer.ts) -- this table is not
 * decorative, the compiler consults it (compiler/section-instance-
 * context.ts) before applying `composition.visualPrimitive`, and any
 * value not listed for a role is silently dropped rather than guessed.
 */
export const ROLE_VISUAL_PRIMITIVE_VOCABULARY: Partial<Record<SectionRole, readonly SectionInstanceVisualPrimitive[]>> = {
  hero: ["standard", "oversized-typography"],
  services: ["standard", "editorial-split", "oversized-typography"],
  products: ["standard", "editorial-split", "oversized-typography"],
  features: ["standard", "editorial-split", "oversized-typography"],
  content: ["standard", "editorial-split", "oversized-typography"],
  testimonials: ["standard", "oversized-typography"],
  gallery: ["standard", "full-bleed-media"],
  contact: ["standard", "dramatic-closing"],
  cta: ["standard", "dramatic-closing"],
}

export interface SectionInstanceComposition {
  treatment?: SectionInstanceTreatment
  alignment?: SectionInstanceAlignment
  scale?: SectionInstanceScale
  mediaStrategy?: SectionInstanceMediaStrategy
  /** Reuses the existing SectionToneStrategy vocabulary (composition-context.ts). */
  backgroundStrategy?: SectionToneStrategy
  /** Bounded, purely presentational -- never a fact. "opening" currently maps to "suppress this hero instance's CTA row" in the compiler; "closing" is reserved for a future symmetric mapping. */
  emphasis?: "standard" | "opening" | "closing"
  /**
   * V2-6.2: which of the 4 bounded visual composition primitives this
   * instance requests (see composition-context.ts and
   * ROLE_VISUAL_PRIMITIVE_VOCABULARY above). Absent/"standard" -> exact
   * pre-V2-6.2 rendering for this role. A value not valid for this
   * instance's `role` is silently ignored by the compiler, never guessed
   * or executed as arbitrary rendering.
   */
  visualPrimitive?: SectionInstanceVisualPrimitive
  /** VisualLayoutPlan V1: preferred bounded layout grammar. visualPrimitive remains legacy-compatible input. */
  layout?: SectionVisualLayoutPlan
  /** Orvenix-resolved generated page slugs for a navigation instance. Never provider-supplied hrefs or URLs. */
  navigationSlugs?: string[]
  /** COMMERCE-3C: Orvenix-resolved safe CTA action -- closed label vocabulary, `page:<generated-slug>` only. */
  ctaAction?: { label: SectionInstanceCtaLabel; href: string }
  /** COMMERCE-3C: this instance explicitly asks for no call-to-action (AI ctaIntent "none" / unresolvable). */
  omitCta?: boolean
  /** COMMERCE-3C: closed narrative intent; selects Orvenix-owned structural copy, never provider prose. */
  narrativeIntent?: SectionInstanceNarrativeIntent
  /** COMMERCE-3C: grounded category labels linked to REAL generated category pages. */
  categoryLinks?: Array<{ label: string; href: string }>
}

export const SECTION_INSTANCE_CTA_LABELS = ["Ver catálogo", "Ver categoría", "Ver producto", "Seguir explorando", "Ver ayuda"] as const
export type SectionInstanceCtaLabel = (typeof SECTION_INSTANCE_CTA_LABELS)[number]

export const SECTION_INSTANCE_NARRATIVE_INTENTS = [
  "product-led",
  "category-discovery",
  "editorial-story",
  "benefit-led",
  "trust-led",
  "conversion-led",
  "minimal-introduction",
  "catalog-orientation",
] as const
export type SectionInstanceNarrativeIntent = (typeof SECTION_INSTANCE_NARRATIVE_INTENTS)[number]

/** Internal generated-page link only: `page:<normalized slug>` (no "/", no scheme, no fragment). */
export const SECTION_INSTANCE_PAGE_HREF_PATTERN = /^page:[a-z0-9]+(?:-[a-z0-9]+)*$/

export type SectionInstanceProvenance = "deterministic" | "design-reference" | "creative-director" | "fallback"

export interface SectionInstanceRelationship {
  /** How this instance visually relates to the section immediately before it. "continuous" is a hint (eg. contact+cta reading as one composed closing) -- it never merges nodes/roles, it only informs bounded composition choices like backgroundStrategy. */
  transitionFromPrevious?: "standard" | "continuous"
}

export interface SectionInstancePlan {
  /** Unique within its PageCompositionPlan. Never used for styling/selectors -- purely a plan-authoring/debugging handle. */
  id: string
  role: SectionRole
  selection: SectionInstanceSelection
  composition?: SectionInstanceComposition
  relationship?: SectionInstanceRelationship
  provenance: SectionInstanceProvenance
}

export interface PageCompositionPlan {
  slug: string
  instances: SectionInstancePlan[]
}

export interface CompositionPlan {
  version: 1
  pages: PageCompositionPlan[]
}

/**
 * Selects the real, grounded item(s) an instance is bound to. Never
 * invents an item: an out-of-range index, an empty source collection, or
 * an unrecognized mode all degrade to an empty/safe result rather than
 * fabricating or duplicating content. Duplicate indexes in a "subset"
 * selection are de-duplicated by default (first occurrence wins) --
 * explicit repeats are simply not a use case this selector needs to
 * support to satisfy "duplicate index use is allowed only when explicitly
 * valid": callers that genuinely want the same real item to appear twice
 * should add two separate SectionInstancePlans instead, each an isolated,
 * independently-composed instance.
 */
export function selectGroundedItems<T>(source: readonly T[] | undefined, selection: SectionInstanceSelection): T[] {
  const items = source ?? []
  if (items.length === 0) return []

  if (selection.mode === "all") return [...items]

  if (selection.mode === "single-item") {
    const index = selection.itemIndex
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= items.length) return []
    return [items[index]]
  }

  if (selection.mode === "subset") {
    const seen = new Set<number>()
    const result: T[] = []
    for (const index of selection.indexes ?? []) {
      if (!Number.isInteger(index) || index < 0 || index >= items.length) continue
      if (seen.has(index)) continue
      seen.add(index)
      result.push(items[index])
    }
    return result
  }

  return []
}

const VALID_SELECTION_MODES = new Set<SectionInstanceSelectionMode>(["all", "single-item", "subset"])
const VALID_ALIGNMENTS = new Set<string>(SECTION_INSTANCE_ALIGNMENTS)
const VALID_SCALES = new Set<string>(SECTION_INSTANCE_SCALES)
const VALID_MEDIA_STRATEGIES = new Set<string>(SECTION_INSTANCE_MEDIA_STRATEGIES)
const VALID_BACKGROUND_STRATEGIES = new Set<string>(SECTION_TONE_STRATEGIES)
const VALID_EMPHASIS = new Set(["standard", "opening", "closing"])
const VALID_VISUAL_PRIMITIVES = new Set<string>(SECTION_INSTANCE_VISUAL_PRIMITIVES)
const VALID_PROVENANCE = new Set<SectionInstanceProvenance>(["deterministic", "design-reference", "creative-director", "fallback"])
const VALID_TRANSITIONS = new Set(["standard", "continuous"])
const ALL_TREATMENT_VALUES = new Set<string>([
  ...PREMIUM_COMPOSITION_TREATMENTS,
  ...HERO_TREATMENTS,
  ...TRUST_TREATMENTS,
  ...TESTIMONIAL_TREATMENTS,
  ...BOOKING_PRESENTATIONS,
  ...PRICING_TREATMENTS,
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed)
  return Object.keys(obj).every((key) => allowedSet.has(key))
}

/**
 * Allowlist validator for untrusted/dynamic SectionInstancePlan input
 * (eg. a plan deserialized from JSON, or one this pipeline may eventually
 * accept from a Creative Director/external source). Rejects any
 * unrecognized top-level or nested key and any out-of-vocabulary enum
 * value -- by construction this makes arbitrary CSS/className/HTML/JSX/
 * component-name injection impossible through this contract: there is no
 * field a caller could put such a value into that this validator accepts.
 */
export function isValidSectionInstancePlan(plan: unknown): plan is SectionInstancePlan {
  if (!isPlainObject(plan)) return false
  if (!hasOnlyKeys(plan, ["id", "role", "selection", "composition", "relationship", "provenance"])) return false

  if (typeof plan.id !== "string" || plan.id.length === 0) return false
  if (typeof plan.role !== "string") return false

  if (!isPlainObject(plan.selection)) return false
  const selection = plan.selection
  if (!hasOnlyKeys(selection, ["mode", "itemIndex", "indexes"])) return false
  if (!VALID_SELECTION_MODES.has(selection.mode as SectionInstanceSelectionMode)) return false
  if (selection.itemIndex !== undefined && (typeof selection.itemIndex !== "number" || !Number.isInteger(selection.itemIndex))) return false
  if (selection.indexes !== undefined) {
    if (!Array.isArray(selection.indexes)) return false
    if (!selection.indexes.every((index) => typeof index === "number" && Number.isInteger(index))) return false
  }

  if (plan.composition !== undefined) {
    if (!isPlainObject(plan.composition)) return false
    const composition = plan.composition
    if (!hasOnlyKeys(composition, ["treatment", "alignment", "scale", "mediaStrategy", "backgroundStrategy", "emphasis", "visualPrimitive", "layout", "navigationSlugs", "ctaAction", "omitCta", "narrativeIntent", "categoryLinks"])) return false
    if (composition.treatment !== undefined && !ALL_TREATMENT_VALUES.has(composition.treatment as string)) return false
    if (composition.alignment !== undefined && !VALID_ALIGNMENTS.has(composition.alignment as string)) return false
    if (composition.scale !== undefined && !VALID_SCALES.has(composition.scale as string)) return false
    if (composition.mediaStrategy !== undefined && !VALID_MEDIA_STRATEGIES.has(composition.mediaStrategy as string)) return false
    if (composition.backgroundStrategy !== undefined && !VALID_BACKGROUND_STRATEGIES.has(composition.backgroundStrategy as string)) return false
    if (composition.emphasis !== undefined && !VALID_EMPHASIS.has(composition.emphasis as string)) return false
    if (composition.visualPrimitive !== undefined && !VALID_VISUAL_PRIMITIVES.has(composition.visualPrimitive as string)) return false
    if (composition.layout !== undefined && !isValidSectionVisualLayoutPlan(composition.layout, plan.role as SectionRole)) return false
    if (composition.navigationSlugs !== undefined) {
      if (!Array.isArray(composition.navigationSlugs)) return false
      if (!composition.navigationSlugs.every((slug) => typeof slug === "string" && SECTION_INSTANCE_PAGE_HREF_PATTERN.test(`page:${slug}`))) return false
    }
    if (composition.ctaAction !== undefined) {
      if (!isPlainObject(composition.ctaAction)) return false
      if (!hasOnlyKeys(composition.ctaAction, ["label", "href"])) return false
      if (!(SECTION_INSTANCE_CTA_LABELS as readonly string[]).includes(composition.ctaAction.label as string)) return false
      if (typeof composition.ctaAction.href !== "string" || !SECTION_INSTANCE_PAGE_HREF_PATTERN.test(composition.ctaAction.href)) return false
    }
    if (composition.omitCta !== undefined && composition.omitCta !== true) return false
    if (composition.narrativeIntent !== undefined && !(SECTION_INSTANCE_NARRATIVE_INTENTS as readonly string[]).includes(composition.narrativeIntent as string)) return false
    if (composition.categoryLinks !== undefined) {
      if (!Array.isArray(composition.categoryLinks) || composition.categoryLinks.length > 8) return false
      for (const link of composition.categoryLinks) {
        if (!isPlainObject(link) || !hasOnlyKeys(link, ["label", "href"])) return false
        if (typeof link.label !== "string" || !link.label.trim() || link.label.length > 60 || /[<>{}]/.test(link.label)) return false
        if (typeof link.href !== "string" || !SECTION_INSTANCE_PAGE_HREF_PATTERN.test(link.href)) return false
      }
    }
  }

  if (plan.relationship !== undefined) {
    if (!isPlainObject(plan.relationship)) return false
    if (!hasOnlyKeys(plan.relationship, ["transitionFromPrevious"])) return false
    if (plan.relationship.transitionFromPrevious !== undefined && !VALID_TRANSITIONS.has(plan.relationship.transitionFromPrevious as string)) return false
  }

  if (!VALID_PROVENANCE.has(plan.provenance as SectionInstanceProvenance)) return false

  return true
}

/**
 * V2-6.1 backward-compatibility adapter (Part G). Structurally typed
 * against OrvenixSitePagePlan (never imports it -- see this file's header
 * comment on staying provider/layer-neutral) so every existing
 * SectionRole[]-only caller keeps compiling and behaving byte-identically:
 * one "all"-mode, "deterministic"-provenance instance per existing
 * section, in the same order. No caller is required to build a
 * CompositionPlan; this only exists for the (currently dev-harness-only)
 * callers that want to render a CompositionPlan through the same
 * mechanism a legacy page already uses.
 */
export interface LegacySectionLike {
  role: SectionRole
}

export interface LegacyPageLike {
  slug: string
  sections: readonly LegacySectionLike[]
}

export function legacyPageToCompositionPlan(page: LegacyPageLike): PageCompositionPlan {
  return {
    slug: page.slug,
    instances: page.sections.map((section, index) => ({
      id: `${page.slug}:${section.role}:${index}`,
      role: section.role,
      selection: { mode: "all" },
      provenance: "deterministic",
    })),
  }
}

export function legacyArchitectureToCompositionPlan(pages: readonly LegacyPageLike[]): CompositionPlan {
  return { version: 1, pages: pages.map(legacyPageToCompositionPlan) }
}
