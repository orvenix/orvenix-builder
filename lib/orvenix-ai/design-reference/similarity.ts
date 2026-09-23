import type { DesignReference } from "./contract"

/**
 * V2-5A.3: pairwise structural similarity between two DesignReferences.
 * Only bounded grammar fields are compared -- never literal source,
 * demo copy, or image URLs (those don't exist on DesignReference at
 * all, so this is structurally guaranteed, same guarantee as
 * sanitize.ts relies on).
 */

/**
 * V2-5A.3 refinement: `accent` was already extracted (themeGrammar) but
 * never compared here -- a real, already-existing structural signal
 * that was simply unused. Re-weighted (not just appended) so all
 * components keep summing to 1.0: heroMediaStrategy and ctaStrategy
 * each gave up 0.05 to make room, since they were the two dimensions
 * least likely to differ within an already-narrow visual/hero match.
 */
export const SIMILARITY_WEIGHTS = {
  visualFamily: 0.2,
  heroBackgroundTreatment: 0.15,
  heroMediaStrategy: 0.05,
  assetStrategy: 0.1,
  contactPattern: 0.1,
  ctaStrategy: 0.05,
  themeMode: 0.1,
  accent: 0.1,
  recurringTreatmentsOverlap: 0.1,
  distinctiveTraitsOverlap: 0.05,
} as const

export function jaccard<T>(a: readonly T[], b: readonly T[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  for (const value of setA) if (setB.has(value)) intersection += 1
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

export function computeReferenceSimilarity(a: DesignReference, b: DesignReference): number {
  if (a.id === b.id) return 1

  const w = SIMILARITY_WEIGHTS
  let score = 0
  score += w.visualFamily * (a.identity.visualFamily === b.identity.visualFamily ? 1 : 0)
  score += w.heroBackgroundTreatment * (a.heroGrammar.backgroundTreatment === b.heroGrammar.backgroundTreatment ? 1 : 0)
  score += w.heroMediaStrategy * (a.heroGrammar.mediaStrategy === b.heroGrammar.mediaStrategy ? 1 : 0)
  score += w.assetStrategy * (a.assetGrammar.strategy === b.assetGrammar.strategy ? 1 : 0)
  score += w.contactPattern * (a.conversionGrammar.contactPattern === b.conversionGrammar.contactPattern ? 1 : 0)
  score += w.ctaStrategy * (a.conversionGrammar.ctaStrategy === b.conversionGrammar.ctaStrategy ? 1 : 0)
  score += w.themeMode * (a.themeGrammar.mode === b.themeGrammar.mode ? 1 : 0)
  score += w.accent * (a.themeGrammar.accent === b.themeGrammar.accent ? 1 : 0)
  score += w.recurringTreatmentsOverlap * jaccard(a.sectionGrammar.recurringTreatments, b.sectionGrammar.recurringTreatments)
  score += w.distinctiveTraitsOverlap * jaccard(a.distinctiveTraits, b.distinctiveTraits)

  return score
}
