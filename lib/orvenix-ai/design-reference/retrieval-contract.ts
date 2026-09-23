import type {
  AssetStrategy,
  BusinessAffinity,
  DensityTendency,
  DesignReference,
  DesignReferenceId,
  PagePurpose,
  VisualFamily,
} from "./contract"

/**
 * V2-5A.3: Design Reference Retrieval contract.
 *
 * The query is a compact, bounded-vocabulary signal set -- NOT a raw
 * prompt, NOT arbitrary business copy, NOT the full SiteCreationContext.
 * Every field reuses an existing bounded vocabulary from this library
 * (contract.ts) or from the Creative Director (its ctaIntent enum is
 * the base for ConversionIntent below, extended with a few additional
 * conversion shapes -- booking/catalog/pricing -- that exist in the
 * reference grammar but not yet in ctaIntent). No field is required.
 *
 * Retrieval selects several COMPLEMENTARY references, not one "closest"
 * template. The output is design experience for a future Creative
 * Director to draw on, never an instruction to clone a reference.
 */

export const CONVERSION_INTENTS = [
  "appointment",
  "quote",
  "contact",
  "booking",
  "catalog",
  "pricing",
  "lead",
] as const
export type ConversionIntent = (typeof CONVERSION_INTENTS)[number]

export interface DesignReferenceRetrievalQuery {
  businessAffinity?: BusinessAffinity
  /** Loose, informational only (Orvenix's own siteType is an untyped string) -- never weighted in scoring, may appear in diagnostics. */
  siteType?: string
  conversionIntent?: ConversionIntent
  pagePurposes?: PagePurpose[]
  hasServices?: boolean
  hasProducts?: boolean
  visualFamily?: VisualFamily
  assetStrategy?: AssetStrategy
  density?: DensityTendency
}

export interface DesignReferenceRetrievalOptions {
  /** 1-4, default 4. */
  count?: number
}

export const SCORING_DIMENSIONS = [
  "businessAffinity",
  "conversionCompatibility",
  "pageCompatibility",
  "visualCompatibility",
  "assetCompatibility",
  "density",
] as const
export type ScoringDimension = (typeof SCORING_DIMENSIONS)[number]

export const CONTRIBUTION_ROLES = [
  "business-affinity",
  "conversion-pattern",
  "hero-composition",
  "asset-strategy",
  "section-rhythm",
  "commerce-structure",
  "contact-pattern",
  "visual-contrast",
  "distinctive-pattern",
] as const
export type ContributionRole = (typeof CONTRIBUTION_ROLES)[number]

export const DIVERSITY_REASONS = [
  "primary-relevance-anchor",
  "complementary-visual",
  "complementary-conversion",
  "complementary-structure",
  "complementary-distinctive-pattern",
  "highest-remaining-relevance",
] as const
export type DiversityReason = (typeof DIVERSITY_REASONS)[number]

export interface DesignReferenceSelection {
  reference: DesignReference
  relevanceScore: number
  scoreComponents: Partial<Record<ScoringDimension, number>>
  contributionRoles: ContributionRole[]
  diversityReason: DiversityReason
}

export interface SimilarityExclusion {
  referenceId: DesignReferenceId
  similarTo: DesignReferenceId
  similarity: number
}

export interface DesignReferenceRetrievalDiagnostics {
  candidatePoolSize: number
  candidatePoolIds: DesignReferenceId[]
  excludedForSimilarity: SimilarityExclusion[]
  appliedWeights: Partial<Record<ScoringDimension, number>>
  sparseQuery: boolean
}

export interface DesignReferenceRetrievalCoverage {
  requestedCount: number
  returnedCount: number
  businessAffinityCovered: boolean
  conversionCovered: boolean
}

export interface DesignReferenceRetrievalResult {
  query: DesignReferenceRetrievalQuery
  selections: DesignReferenceSelection[]
  coverage: DesignReferenceRetrievalCoverage
  diagnostics: DesignReferenceRetrievalDiagnostics
}

/**
 * Centralized, inspectable weights -- the ONLY place relative
 * importance is configured. All components sum to 1.0; when a
 * dimension is inapplicable for a given query (the query field wasn't
 * provided), its weight is excluded and the remaining applicable
 * weights are renormalized to sum to 1.0 (see scoring.ts).
 */
export const RETRIEVAL_WEIGHTS: Record<ScoringDimension, number> = {
  businessAffinity: 0.3,
  conversionCompatibility: 0.25,
  pageCompatibility: 0.15,
  visualCompatibility: 0.15,
  assetCompatibility: 0.1,
  density: 0.05,
}

export const DEFAULT_RESULT_COUNT = 4
export const MAX_RESULT_COUNT = 4
export const MIN_RESULT_COUNT = 1

/** Candidate pool is capped at this size even when the library grows -- diversity selection then runs strictly within it. */
export const CANDIDATE_POOL_SIZE = 12

/** Two references at or above this similarity are treated as near-clones for diversity purposes. */
export const SIMILARITY_CLONE_THRESHOLD = 0.82

/** Weight given to relevance vs. dissimilarity-from-already-selected when picking slots after the first (which is always the top relevance anchor). */
export const DIVERSITY_SELECTION_RELEVANCE_WEIGHT = 0.6
export const DIVERSITY_SELECTION_NOVELTY_WEIGHT = 0.4

/**
 * V2-5A.3 refinement: a RELATIVE floor, not an absolute one -- a
 * complementary pick must reach at least this fraction of the anchor's
 * (first pick's) relevance to be included at all. Centering the floor
 * on the anchor's own score (rather than a fixed number) means a
 * sparse query, where every reference ties at the same neutral
 * baseline, is never unfairly floored out (the floor scales down with
 * it), while a content-rich query correctly excludes a pick that only
 * shares incidental page-purpose overlap with no real business or
 * conversion signal. Prefer returning fewer over including a pick
 * below this floor.
 */
export const MINIMUM_RELEVANCE_FLOOR_RATIO = 0.3
