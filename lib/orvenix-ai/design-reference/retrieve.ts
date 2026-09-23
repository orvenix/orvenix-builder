import type { DesignReference, DesignReferenceId } from "./contract"
import { getDesignReferences } from "./library"
import { computeReferenceSimilarity, jaccard } from "./similarity"
import { computeRelevance, type RelevanceResult } from "./scoring"
import {
  CANDIDATE_POOL_SIZE,
  DEFAULT_RESULT_COUNT,
  DIVERSITY_SELECTION_NOVELTY_WEIGHT,
  DIVERSITY_SELECTION_RELEVANCE_WEIGHT,
  MAX_RESULT_COUNT,
  MIN_RESULT_COUNT,
  MINIMUM_RELEVANCE_FLOOR_RATIO,
  SIMILARITY_CLONE_THRESHOLD,
  type ContributionRole,
  type DesignReferenceRetrievalDiagnostics,
  type DesignReferenceRetrievalOptions,
  type DesignReferenceRetrievalQuery,
  type DesignReferenceRetrievalResult,
  type DesignReferenceSelection,
  type DiversityReason,
  type ScoringDimension,
  type SimilarityExclusion,
} from "./retrieval-contract"

/**
 * V2-5A.3 deterministic retrieval: no ML, no randomness, no network, no
 * DB, no Creative Director integration. Operates purely over
 * getDesignReferences(). Selects several COMPLEMENTARY references
 * (relevance establishes a credible pool first, diversity then
 * operates strictly within it) -- never "the one closest template."
 */

interface PoolEntry {
  reference: DesignReference
  relevance: RelevanceResult
}

function clampCount(count: number | undefined): number {
  const value = count ?? DEFAULT_RESULT_COUNT
  return Math.max(MIN_RESULT_COUNT, Math.min(MAX_RESULT_COUNT, Math.round(value)))
}

function isSparseQuery(query: DesignReferenceRetrievalQuery): boolean {
  return (
    !query.businessAffinity &&
    !query.conversionIntent &&
    (!query.pagePurposes || query.pagePurposes.length === 0) &&
    !query.visualFamily &&
    !query.assetStrategy &&
    !query.density
  )
}

function buildCandidatePool(query: DesignReferenceRetrievalQuery): { pool: PoolEntry[]; sparse: boolean } {
  const references = getDesignReferences()
  const sparse = isSparseQuery(query)

  const scored: PoolEntry[] = references.map((reference) => ({
    reference,
    relevance: computeRelevance(reference, query),
  }))

  scored.sort((a, b) => {
    if (b.relevance.total !== a.relevance.total) return b.relevance.total - a.relevance.total
    return a.reference.id.localeCompare(b.reference.id)
  })

  // Relevance establishes the credible pool FIRST. When the query is
  // sparse, everyone ties at the same neutral baseline (see scoring.ts)
  // and the pool is just the top N by stable id order -- diversity
  // alone then does the work, honestly, rather than a fabricated
  // relevance signal deciding anything.
  const filtered = sparse ? scored : scored.filter((entry) => entry.relevance.total > 0)
  const pool = (filtered.length > 0 ? filtered : scored).slice(0, CANDIDATE_POOL_SIZE)

  return { pool, sparse }
}

function pickDiverseSelection(pool: PoolEntry[], requestedCount: number): PoolEntry[] {
  const selected: PoolEntry[] = []
  let remaining = [...pool]

  const relevanceFloor = pool.length > 0 ? pool[0].relevance.total * MINIMUM_RELEVANCE_FLOOR_RATIO : 0

  while (selected.length < requestedCount && remaining.length > 0) {
    const scoredRemaining = remaining.map((candidate) => {
      const maxSimilarity =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => computeReferenceSimilarity(candidate.reference, s.reference)))
      return { candidate, maxSimilarity }
    })

    // Complementary picks (not the anchor) must clear a floor relative
    // to the anchor's own relevance -- a pick that only shares
    // incidental page-purpose overlap, with no real business or
    // conversion signal, isn't a credible complementary reference.
    const meetsRelevanceFloor = selected.length === 0 ? scoredRemaining : scoredRemaining.filter((x) => x.candidate.relevance.total >= relevanceFloor)
    if (meetsRelevanceFloor.length === 0) break

    const acceptable =
      selected.length === 0 ? meetsRelevanceFloor : meetsRelevanceFloor.filter((x) => x.maxSimilarity < SIMILARITY_CLONE_THRESHOLD)

    // Everything left is a near-duplicate of something already selected:
    // stop rather than force a clone in just to hit the requested count
    // (fewer honest, diverse references beat padding with redundancy).
    if (acceptable.length === 0) break

    let best = acceptable[0]
    let bestCombined = -Infinity
    for (const entry of acceptable) {
      const novelty = 1 - entry.maxSimilarity
      const combined =
        selected.length === 0
          ? entry.candidate.relevance.total
          : DIVERSITY_SELECTION_RELEVANCE_WEIGHT * entry.candidate.relevance.total + DIVERSITY_SELECTION_NOVELTY_WEIGHT * novelty
      if (
        combined > bestCombined ||
        (combined === bestCombined && entry.candidate.reference.id.localeCompare(best.candidate.reference.id) < 0)
      ) {
        bestCombined = combined
        best = entry
      }
    }

    selected.push(best.candidate)
    remaining = remaining.filter((c) => c.reference.id !== best.candidate.reference.id)
  }

  return selected
}

function computeExclusions(pool: PoolEntry[], selected: DesignReference[]): SimilarityExclusion[] {
  const selectedIds = new Set(selected.map((r) => r.id))
  const exclusions: SimilarityExclusion[] = []

  for (const entry of pool) {
    if (selectedIds.has(entry.reference.id)) continue
    let bestId: DesignReferenceId | null = null
    let bestSimilarity = -1
    for (const s of selected) {
      const sim = computeReferenceSimilarity(entry.reference, s)
      if (sim > bestSimilarity) {
        bestSimilarity = sim
        bestId = s.id
      }
    }
    if (bestId && bestSimilarity >= SIMILARITY_CLONE_THRESHOLD) {
      exclusions.push({ referenceId: entry.reference.id, similarTo: bestId, similarity: bestSimilarity })
    }
  }

  return exclusions.sort((a, b) => a.referenceId.localeCompare(b.referenceId))
}

function deriveContributionRoles(
  reference: DesignReference,
  components: Partial<Record<ScoringDimension, number>>,
  alreadySelected: DesignReference[],
): ContributionRole[] {
  const roles = new Set<ContributionRole>()

  if ((components.businessAffinity ?? 0) >= 1) roles.add("business-affinity")

  if ((components.conversionCompatibility ?? 0) >= 0.6) {
    roles.add("conversion-pattern")
    if (reference.conversionGrammar.contactPattern !== "unknown") roles.add("contact-pattern")
  }

  const heroTreatmentIsNew = !alreadySelected.some((s) => s.heroGrammar.backgroundTreatment === reference.heroGrammar.backgroundTreatment)
  if ((components.visualCompatibility ?? 0) >= 1 || (reference.heroGrammar.backgroundTreatment !== "unknown" && heroTreatmentIsNew)) {
    roles.add("hero-composition")
  }

  const assetStrategyIsNew = !alreadySelected.some((s) => s.assetGrammar.strategy === reference.assetGrammar.strategy)
  if ((components.assetCompatibility ?? 0) >= 0.5 || (reference.assetGrammar.strategy !== "none" && assetStrategyIsNew)) {
    roles.add("asset-strategy")
  }

  const treatmentsAreNew = alreadySelected.every(
    (s) => jaccard(s.sectionGrammar.recurringTreatments, reference.sectionGrammar.recurringTreatments) < 0.5,
  )
  if ((components.pageCompatibility ?? 0) >= 0.5 || (reference.sectionGrammar.recurringTreatments.length > 0 && treatmentsAreNew)) {
    roles.add("section-rhythm")
  }

  if (reference.distinctiveTraits.includes("cart-flow") || reference.distinctiveTraits.includes("catalog-browsing")) {
    roles.add("commerce-structure")
  }

  if (reference.themeGrammar.contrast === "high" || reference.themeGrammar.contrast === "low") {
    const alreadyHasThisContrast = alreadySelected.some((s) => s.themeGrammar.contrast === reference.themeGrammar.contrast)
    if (!alreadyHasThisContrast) roles.add("visual-contrast")
  }

  const existingTraits = new Set(alreadySelected.flatMap((s) => s.distinctiveTraits))
  const hasNewTrait = reference.distinctiveTraits.some((t) => !existingTraits.has(t))
  if (hasNewTrait) roles.add("distinctive-pattern")

  if (roles.size === 0) roles.add("distinctive-pattern")

  return Array.from(roles)
}

function deriveDiversityReason(
  index: number,
  reference: DesignReference,
  alreadySelected: DesignReference[],
  noveltyAtPick: number,
): DiversityReason {
  if (index === 0) return "primary-relevance-anchor"
  if (noveltyAtPick < 0.15) return "highest-remaining-relevance"

  const traitDiffers = reference.distinctiveTraits.some((t) => !alreadySelected.some((s) => s.distinctiveTraits.includes(t)))
  if (traitDiffers) return "complementary-distinctive-pattern"

  const visualDiffers = !alreadySelected.some(
    (s) => s.identity.visualFamily === reference.identity.visualFamily && s.heroGrammar.backgroundTreatment === reference.heroGrammar.backgroundTreatment,
  )
  if (visualDiffers) return "complementary-visual"

  const conversionDiffers = !alreadySelected.some((s) => s.conversionGrammar.contactPattern === reference.conversionGrammar.contactPattern)
  if (conversionDiffers) return "complementary-conversion"

  const structureDiffers = alreadySelected.every(
    (s) => jaccard(s.sectionGrammar.recurringTreatments, reference.sectionGrammar.recurringTreatments) < 0.5,
  )
  if (structureDiffers) return "complementary-structure"

  return "highest-remaining-relevance"
}

export function retrieveDesignReferences(
  query: DesignReferenceRetrievalQuery = {},
  options: DesignReferenceRetrievalOptions = {},
): DesignReferenceRetrievalResult {
  const requestedCount = clampCount(options.count)
  const { pool, sparse } = buildCandidatePool(query)
  const pickedEntries = pickDiverseSelection(pool, requestedCount)

  const selections: DesignReferenceSelection[] = pickedEntries.map((entry, index) => {
    const alreadySelected = pickedEntries.slice(0, index).map((e) => e.reference)
    const maxSimilarityToSelected =
      alreadySelected.length === 0 ? 0 : Math.max(...alreadySelected.map((s) => computeReferenceSimilarity(entry.reference, s)))
    const noveltyAtPick = 1 - maxSimilarityToSelected

    return {
      reference: entry.reference,
      relevanceScore: Math.round(entry.relevance.total * 1000) / 1000,
      scoreComponents: entry.relevance.components,
      contributionRoles: deriveContributionRoles(entry.reference, entry.relevance.components, alreadySelected),
      diversityReason: deriveDiversityReason(index, entry.reference, alreadySelected, noveltyAtPick),
    }
  })

  const excludedForSimilarity = computeExclusions(
    pool,
    selections.map((s) => s.reference),
  )

  const appliedWeights = pool.length > 0 ? pool[0].relevance.appliedWeights : {}

  const diagnostics: DesignReferenceRetrievalDiagnostics = {
    candidatePoolSize: pool.length,
    candidatePoolIds: pool.map((entry) => entry.reference.id),
    excludedForSimilarity,
    appliedWeights,
    sparseQuery: sparse,
  }

  const businessAffinityCovered =
    !query.businessAffinity || selections.some((s) => s.reference.identity.businessAffinity === query.businessAffinity)
  const conversionCovered = !query.conversionIntent || selections.some((s) => (s.scoreComponents.conversionCompatibility ?? 0) >= 0.5)

  return {
    query,
    selections,
    coverage: {
      requestedCount,
      returnedCount: selections.length,
      businessAffinityCovered,
      conversionCovered,
    },
    diagnostics,
  }
}
