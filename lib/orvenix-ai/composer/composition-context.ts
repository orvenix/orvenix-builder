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

export const HERO_WEIGHTS: VariantWeightTable<HeroVariant> = {
  // health: clarity, balanced whitespace, clean split/centered heroes.
  health: { centered: 3, "split-left": 2, "split-right": 2, immersive: 1 },
  // hospitality: media-forward, immersive imagery, stronger visual rhythm.
  hospitality: { immersive: 4, "split-left": 2, "split-right": 2, centered: 1 },
  // creative: asymmetric, bolder media relationships, less conventional.
  creative: { "split-left": 3, "split-right": 3, immersive: 2, centered: 1 },
  // commerce: scan-friendly, product-forward but not overly photo-heavy.
  commerce: { centered: 2, "split-left": 2, "split-right": 2, immersive: 1 },
  // professional: conservative hierarchy, credibility-oriented.
  professional: { centered: 3, "split-right": 3, "split-left": 2, immersive: 1 },
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

export { resolveContentDensity, type ContentDensity } from "./variant-selector"
