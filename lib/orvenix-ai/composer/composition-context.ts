import type { VariantWeightTable } from "./variant-selector"

/**
 * V2-3: family-aware structural tendencies. These are WEIGHTS, not
 * locks -- every family has a non-zero (>=1) weight on every variant, so
 * two businesses in the same family can still land on different
 * treatments when their page/content facts differ (see
 * variant-selector.ts and the V2-3 same-family-variety tests). Higher
 * numbers only mean "more likely for this family", never "the only
 * option". VisualFamily itself remains untouched/authoritative from
 * theme/visual-direction.ts -- this file only maps that same family
 * value onto structural tendencies.
 */

export type HeroVariant = "centered" | "split-left" | "split-right" | "immersive"

export const HERO_VARIANTS: readonly HeroVariant[] = ["centered", "split-left", "split-right", "immersive"]

/**
 * V2-3.1: strengthened from the V2-3 baseline. Auditing the original
 * weights showed real per-family shape (each family's MODE differed),
 * but "split-right" specifically sat at a similar 22-33% across health/
 * creative/commerce/professional -- a shared, weakly-differentiated
 * middle bucket that made a same-bucket collision between otherwise very
 * different families (eg. health vs creative) a plausible, unremarkable
 * outcome rather than a rare one. Each family's own STATED identity
 * (see the comments below, unchanged from V2-3) is now pushed to a
 * clearer majority/plurality rather than a bare plurality over near-even
 * alternatives, while every variant keeps weight >=1 (never a hard
 * lock) and no family-specific rule references any fixture/business.
 */
export const HERO_WEIGHTS: VariantWeightTable<HeroVariant> = {
  // health: clarity, balanced whitespace, clean split/centered heroes -- centered is the clear majority.
  health: { centered: 5, "split-left": 2, "split-right": 2, immersive: 1 },
  // hospitality: media-forward, immersive imagery, stronger visual rhythm -- immersive is the clear majority.
  hospitality: { immersive: 5, "split-left": 2, "split-right": 2, centered: 1 },
  // creative: asymmetric, bolder media relationships, less conventional -- split variants combined dominate, centered stays rare.
  creative: { "split-left": 4, "split-right": 4, immersive: 2, centered: 1 },
  // commerce: scan-friendly, product-forward but not overly photo-heavy -- centered/split roughly even, immersive de-emphasized.
  commerce: { centered: 3, "split-left": 3, "split-right": 3, immersive: 1 },
  // professional: conservative hierarchy, credibility-oriented -- centered is the clear majority, split-right the conventional secondary.
  professional: { centered: 5, "split-right": 3, "split-left": 1, immersive: 1 },
}

export type FeaturesVariant = "equal-grid" | "alternating-rows" | "compact-matrix"

export const FEATURES_VARIANTS: readonly FeaturesVariant[] = ["equal-grid", "alternating-rows", "compact-matrix"]

export const FEATURES_WEIGHTS: VariantWeightTable<FeaturesVariant> = {
  health: { "equal-grid": 3, "compact-matrix": 2, "alternating-rows": 1 },
  hospitality: { "alternating-rows": 3, "equal-grid": 2, "compact-matrix": 1 },
  creative: { "alternating-rows": 3, "compact-matrix": 2, "equal-grid": 1 },
  commerce: { "compact-matrix": 3, "equal-grid": 2, "alternating-rows": 1 },
  professional: { "equal-grid": 3, "compact-matrix": 2, "alternating-rows": 1 },
}

export type ServicesVariant = "cards" | "editorial-list" | "asymmetric-featured"

export const SERVICES_VARIANTS: readonly ServicesVariant[] = ["cards", "editorial-list", "asymmetric-featured"]

export const SERVICES_WEIGHTS: VariantWeightTable<ServicesVariant> = {
  health: { cards: 3, "editorial-list": 2, "asymmetric-featured": 1 },
  hospitality: { "editorial-list": 3, "asymmetric-featured": 2, cards: 1 },
  creative: { "asymmetric-featured": 3, "editorial-list": 2, cards: 1 },
  commerce: { cards: 3, "asymmetric-featured": 2, "editorial-list": 1 },
  professional: { cards: 3, "editorial-list": 2, "asymmetric-featured": 1 },
}

export type CtaVariant = "banner" | "split-panel"

export const CTA_VARIANTS: readonly CtaVariant[] = ["banner", "split-panel"]

export const CTA_WEIGHTS: VariantWeightTable<CtaVariant> = {
  health: { banner: 2, "split-panel": 1 },
  hospitality: { "split-panel": 2, banner: 1 },
  creative: { "split-panel": 2, banner: 1 },
  commerce: { banner: 1, "split-panel": 1 },
  professional: { banner: 2, "split-panel": 1 },
}

export type TrustVariant = "card-grid" | "checklist-row"

export const TRUST_VARIANTS: readonly TrustVariant[] = ["card-grid", "checklist-row"]

export const TRUST_WEIGHTS: VariantWeightTable<TrustVariant> = {
  health: { "card-grid": 2, "checklist-row": 1 },
  hospitality: { "checklist-row": 2, "card-grid": 1 },
  creative: { "checklist-row": 2, "card-grid": 1 },
  commerce: { "card-grid": 2, "checklist-row": 1 },
  professional: { "card-grid": 2, "checklist-row": 1 },
}

/**
 * V2-5B: an ADDITIONAL, INDEPENDENT decision resolved before the
 * existing HeroVariant pick -- deliberately NOT a 5th HeroVariant.
 * HERO_VARIANTS/HERO_WEIGHTS are also the exact set the Creative
 * Director contract validates `preferredHeroVariant` against (see
 * creative-director-contract-gateway-v1.test.ts's cross-module
 * equality check and composition-variety-v2-3-1's HERO_VARIANTS.length
 * === 4 assertion) -- growing that shared set would either break both
 * of those or require touching the CD contract, which this phase must
 * not do. A same-shape, same-weighted-pool, but SEPARATE vocabulary
 * gets the identical "biased, never locked" selection behavior without
 * touching either.
 */
export type HeroTreatment = "standard" | "abstract-glow"

export const HERO_TREATMENTS: readonly HeroTreatment[] = ["standard", "abstract-glow"]

export const HERO_TREATMENT_WEIGHTS: VariantWeightTable<HeroTreatment> = {
  health: { standard: 3, "abstract-glow": 1 },
  hospitality: { standard: 3, "abstract-glow": 1 },
  creative: { standard: 2, "abstract-glow": 2 },
  commerce: { standard: 3, "abstract-glow": 1 },
  professional: { standard: 2, "abstract-glow": 2 },
}

export type ProcessVariant = "cards" | "numbered"

export const PROCESS_VARIANTS: readonly ProcessVariant[] = ["cards", "numbered"]

export const PROCESS_WEIGHTS: VariantWeightTable<ProcessVariant> = {
  health: { numbered: 2, cards: 2 },
  hospitality: { numbered: 2, cards: 2 },
  creative: { numbered: 3, cards: 1 },
  commerce: { numbered: 2, cards: 2 },
  professional: { numbered: 3, cards: 1 },
}

/**
 * V2-5B: section-background rhythm. Deliberately not a per-family
 * VariantWeightTable like the others above -- tone is about a
 * section's POSITION in the page (it must vary WITHIN one page, which
 * is exactly what selectVariant's hash intentionally ignores -- see
 * variant-selector.ts's sectionIndex exclusion comment), not about
 * business family. resolveSectionTone in section-composer.ts uses its
 * own small index-sensitive hash instead.
 */
export type SectionTone = "base" | "muted" | "accent-soft" | "contrast"

export const SECTION_TONES: readonly SectionTone[] = ["base", "muted", "accent-soft", "contrast"]

/**
 * V2-5B refinement: exactly-two-real-items makes paired-layout
 * ELIGIBLE, not mandatory. A dedicated, bounded vocabulary rather than
 * folding "paired" into ServicesVariant/FeaturesVariant/ProcessVariant
 * -- those three are role-specific structural families already
 * consumed elsewhere on their own terms (eg. "editorial-list" only
 * makes sense as a services concept); this concept is role-agnostic
 * (any role, exactly two real items) and orthogonal to them, so it
 * gets its own small enum instead of changing their shape.
 */
export type TwoItemLayoutTreatment = "paired" | "cards"

export const TWO_ITEM_LAYOUT_VARIANTS: readonly TwoItemLayoutTreatment[] = ["paired", "cards"]

export const TWO_ITEM_LAYOUT_WEIGHTS: VariantWeightTable<TwoItemLayoutTreatment> = {
  health: { paired: 2, cards: 2 },
  hospitality: { paired: 2, cards: 2 },
  creative: { paired: 3, cards: 1 },
  commerce: { paired: 2, cards: 2 },
  professional: { paired: 2, cards: 2 },
}

export { resolveContentDensity, type ContentDensity } from "./variant-selector"
