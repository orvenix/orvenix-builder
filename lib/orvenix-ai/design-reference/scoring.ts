import type { ContactPattern, CtaStrategy, DesignReference } from "./contract"
import {
  RETRIEVAL_WEIGHTS,
  type ConversionIntent,
  type DesignReferenceRetrievalQuery,
  type ScoringDimension,
} from "./retrieval-contract"

/**
 * V2-5A.3 deterministic relevance scoring. Every component is a plain,
 * inspectable function -- no ML, no randomness. A dimension is only
 * scored (and only contributes weight) when the query actually
 * supplies the corresponding signal; RETRIEVAL_WEIGHTS is the single
 * place relative importance is configured, and unused dimensions are
 * excluded then the remaining weights renormalized to sum to 1.
 */

const CONVERSION_TO_CONTACT_PATTERN: Partial<Record<ConversionIntent, ContactPattern>> = {
  appointment: "booking-form",
  booking: "booking-form",
  quote: "generic-form",
  contact: "generic-form",
  lead: "generic-form",
  catalog: "catalog-cta",
}

const CONVERSION_TO_CTA_STRATEGY: Partial<Record<ConversionIntent, CtaStrategy>> = {
  pricing: "pricing-driven",
}

export function scoreBusinessAffinity(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.businessAffinity) return null
  return reference.identity.businessAffinity === query.businessAffinity ? 1 : 0
}

export function scoreConversionCompatibility(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.conversionIntent) return null
  const intent = query.conversionIntent
  let score = 0

  const expectedContactPattern = CONVERSION_TO_CONTACT_PATTERN[intent]
  if (expectedContactPattern && reference.conversionGrammar.contactPattern === expectedContactPattern) score += 0.6

  const expectedCtaStrategy = CONVERSION_TO_CTA_STRATEGY[intent]
  if (expectedCtaStrategy && reference.conversionGrammar.ctaStrategy === expectedCtaStrategy) score += 0.4
  else if (intent !== "pricing" && reference.conversionGrammar.ctaStrategy !== "unknown") score += 0.1

  if (intent === "catalog") {
    if (reference.distinctiveTraits.includes("catalog-browsing") || reference.distinctiveTraits.includes("cart-flow")) {
      score = Math.min(1, score + 0.3)
    }
  }
  if (intent === "pricing" && reference.sectionGrammar.roleSequence.includes("pricing")) {
    score = Math.min(1, score + 0.3)
  }

  return Math.min(1, score)
}

export function scorePageCompatibility(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.pagePurposes || query.pagePurposes.length === 0) return null
  const wanted = new Set(query.pagePurposes)
  const has = new Set(reference.pageGrammar.pagePurposes)
  let matched = 0
  for (const purpose of wanted) if (has.has(purpose)) matched += 1
  return matched / wanted.size
}

export function scoreVisualCompatibility(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.visualFamily) return null
  return reference.identity.visualFamily === query.visualFamily ? 1 : 0
}

export function scoreAssetCompatibility(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.assetStrategy) return null
  if (reference.assetGrammar.strategy === query.assetStrategy) return 1
  if (reference.assetGrammar.strategy === "mixed") return 0.5
  return 0
}

export function scoreDensity(reference: DesignReference, query: DesignReferenceRetrievalQuery): number | null {
  if (!query.density) return null
  return reference.compositionGrammar.density === query.density ? 1 : 0
}

const SCORERS: Record<ScoringDimension, (reference: DesignReference, query: DesignReferenceRetrievalQuery) => number | null> = {
  businessAffinity: scoreBusinessAffinity,
  conversionCompatibility: scoreConversionCompatibility,
  pageCompatibility: scorePageCompatibility,
  visualCompatibility: scoreVisualCompatibility,
  assetCompatibility: scoreAssetCompatibility,
  density: scoreDensity,
}

export interface RelevanceResult {
  total: number
  components: Partial<Record<ScoringDimension, number>>
  appliedWeights: Partial<Record<ScoringDimension, number>>
}

/** hasServices/hasProducts are folded in here as a small structural nudge on top of conversionCompatibility/pageCompatibility rather than as separate weighted dimensions, since they describe STRUCTURE the query already implies via conversionIntent/pagePurposes. */
function structuralNudge(reference: DesignReference, query: DesignReferenceRetrievalQuery): number {
  let nudge = 0
  if (query.hasProducts === true) {
    if (reference.distinctiveTraits.includes("cart-flow") || reference.distinctiveTraits.includes("catalog-browsing")) nudge += 0.05
  }
  if (query.hasServices === true) {
    if (reference.sectionGrammar.roleSequence.includes("services")) nudge += 0.02
  }
  return nudge
}

export function computeRelevance(reference: DesignReference, query: DesignReferenceRetrievalQuery): RelevanceResult {
  const components: Partial<Record<ScoringDimension, number>> = {}
  const appliedWeights: Partial<Record<ScoringDimension, number>> = {}

  for (const dimension of Object.keys(SCORERS) as ScoringDimension[]) {
    const value = SCORERS[dimension](reference, query)
    if (value !== null) {
      components[dimension] = value
      appliedWeights[dimension] = RETRIEVAL_WEIGHTS[dimension]
    }
  }

  const totalWeight = Object.values(appliedWeights).reduce((sum, w) => sum + (w ?? 0), 0)
  let total: number
  if (totalWeight === 0) {
    // Fully sparse query: no dimension applicable to anyone. Every
    // reference gets the same neutral baseline -- diversity selection
    // (not a fabricated relevance signal) then determines the result.
    total = 0.5
  } else {
    let weightedSum = 0
    for (const dimension of Object.keys(components) as ScoringDimension[]) {
      weightedSum += (components[dimension] ?? 0) * (appliedWeights[dimension] ?? 0)
    }
    total = weightedSum / totalWeight
  }

  total = Math.min(1, total + structuralNudge(reference, query))

  return { total, components, appliedWeights }
}
