import { graphShapeSignatureV1 } from "@/lib/orvenix-ai/composer/graph/shape"
import type { GraphSectionV1 } from "@/lib/orvenix-ai/composer/graph/contract"
import {
  motifShapeSignatureV2,
  motifStructuralFeaturesV2,
  motifStructuralSimilarityV2,
  type MotifModeV2,
  type MotifPurposeV2,
  type MotifScaleV2,
  type MotifStructuralFeaturesV2,
  type ReferenceMotifRegionV2,
  type ReferenceMotifV2,
} from "./contract"
import { getReferenceMotifLibraryV2 } from "./library"

/**
 * CF-4B: business-conditioned, STRUCTURALLY diverse motif retrieval.
 * Deterministic (no randomness): relevance from safe business facts builds
 * a credible pool, then MMR over structural features (never theme/color)
 * picks complementary relations. Ties break by motifId.
 */

export type MotifCatalogCountSourceV2 = "authoritative" | "builder_facts" | "none"

export type MotifRetrievalContextV2 = {
  mode: MotifModeV2
  /** Secondary register (eg. a playful/warm commerce brand leaning editorial). */
  secondaryMode?: MotifModeV2
  scale: MotifScaleV2
  catalogCount: number
  catalogCountSource: MotifCatalogCountSourceV2
  categoryCount: number
  purposes: MotifPurposeV2[]
  densityPreference: "sparse" | "balanced" | "rich"
  restrained: boolean
  contentRichness: "sparse" | "rich"
  hasGroundedMedia: boolean
  /** CF-4C hook: recently used shape signatures to down-weight (empty in CF-4B). */
  avoidShapeSignatures?: readonly string[]
}

export const MOTIF_RETRIEVAL_LIMITS_V2 = {
  minCount: 4,
  maxCount: 6,
  poolSize: 16,
  relevanceFloorRatio: 0.35,
  cloneThreshold: 0.8,
  relevanceWeight: 0.5,
  noveltyWeight: 0.5,
  avoidPenalty: 0.5,
} as const

export function catalogScaleV2(count: number): MotifScaleV2 {
  if (count <= 0) return "none"
  if (count <= 8) return "small"
  if (count <= 30) return "medium"
  return "large"
}

export type MotifSelectionV2 = {
  motif: ReferenceMotifV2
  shapeSignature: string
  relevance: number
  novelty: number
  rationale: string[]
}

export type MotifRetrievalResultV2 = {
  context: MotifRetrievalContextV2
  eligibleCount: number
  poolIds: string[]
  selections: MotifSelectionV2[]
}

function eligible(motif: ReferenceMotifV2, context: MotifRetrievalContextV2): boolean {
  if (motif.tags.requiresMedia && !context.hasGroundedMedia) return false
  if (motif.tags.requiresCategories && context.categoryCount < 2) return false
  // Product relations need real products to ground them.
  if (motif.sectionRole === "products" && context.catalogCount <= 0) return false
  return motif.tags.purposes.some((purpose) => context.purposes.includes(purpose))
}

function relevance(motif: ReferenceMotifV2, context: MotifRetrievalContextV2, features: MotifStructuralFeaturesV2): number {
  const mode = motif.tags.modes.includes(context.mode) ? 1 : context.secondaryMode && motif.tags.modes.includes(context.secondaryMode) ? 0.6 : 0
  const scale = motif.tags.scales.includes(context.scale) ? 1 : 0
  const overlap = motif.tags.purposes.filter((purpose) => context.purposes.includes(purpose)).length
  const purpose = overlap ? 0.5 + 0.5 * (overlap / motif.tags.purposes.length) : 0
  const density = context.densityPreference === "balanced" ? 0.5 : (context.densityPreference === "rich") === (features.densityBand === "dense") ? 1 : 0
  const content = (context.contentRichness === "rich") === (features.copyPlacement === "beside" || features.copyPlacement === "before") ? 1 : 0.4
  const restraint = context.restrained && features.weightContrast === "strong-focal" ? -0.1 : 0
  let score = 0.3 * mode + 0.25 * scale + 0.25 * purpose + 0.12 * density + 0.08 * content + restraint
  if (context.avoidShapeSignatures?.includes(motifShapeSignatureV2(motif))) score *= MOTIF_RETRIEVAL_LIMITS_V2.avoidPenalty
  return Math.max(0, Math.round(score * 1000) / 1000)
}

const FEATURE_LABELS: Array<[keyof MotifStructuralFeaturesV2, string]> = [
  ["focal", "focal"],
  ["asymmetry", "asymmetry"],
  ["weightContrast", "weight contrast"],
  ["densityBand", "density"],
  ["whitespaceBand", "whitespace"],
  ["copyPlacement", "copy relation"],
  ["beat", "beat"],
  ["edge", "edge"],
]

function rationale(features: MotifStructuralFeaturesV2, selected: MotifStructuralFeaturesV2[]): string[] {
  if (!selected.length) return ["most relevant relation for this context"]
  const reasons = FEATURE_LABELS.filter(([key]) => selected.every((other) => other[key] !== features[key])).map(([key, label]) => `new ${label}: ${String(features[key])}`)
  const newArrangement = features.arrangements.filter((arrangement) => selected.every((other) => !other.arrangements.includes(arrangement)))
  if (newArrangement.length) reasons.push(`new arrangement: ${newArrangement.join("+")}`)
  return reasons.length ? reasons : ["highest remaining relevance (no new structural trait)"]
}

export function retrieveReferenceMotifsV2(context: MotifRetrievalContextV2, options: { count?: number; library?: readonly ReferenceMotifV2[] } = {}): MotifRetrievalResultV2 {
  const library = options.library ?? getReferenceMotifLibraryV2()
  const limits = MOTIF_RETRIEVAL_LIMITS_V2
  const candidates = library
    .filter((motif) => eligible(motif, context))
    .map((motif) => {
      const features = motifStructuralFeaturesV2(motif)
      return { motif, features, relevance: relevance(motif, context, features) }
    })
    .filter((entry) => entry.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.motif.motifId.localeCompare(b.motif.motifId))
  const pool = candidates.slice(0, limits.poolSize)
  const target = Math.min(options.count ?? (pool.length >= 10 ? 6 : pool.length >= 7 ? 5 : limits.minCount), limits.maxCount, pool.length)
  const floor = pool.length ? pool[0].relevance * limits.relevanceFloorRatio : 0

  const picked: Array<(typeof pool)[number] & { novelty: number; rationale: string[] }> = []
  let remaining = [...pool]
  while (picked.length < target && remaining.length) {
    const scored = remaining
      .filter((entry) => picked.length === 0 || entry.relevance >= floor)
      .map((entry) => {
        const maxSimilarity = picked.length ? Math.max(...picked.map((chosen) => motifStructuralSimilarityV2(entry.features, chosen.features))) : 0
        return { entry, maxSimilarity }
      })
      .filter((entry) => picked.length === 0 || entry.maxSimilarity < limits.cloneThreshold)
    if (!scored.length) break
    let best = scored[0]
    let bestScore = -Infinity
    for (const candidate of scored) {
      const combined = picked.length === 0 ? candidate.entry.relevance : limits.relevanceWeight * candidate.entry.relevance + limits.noveltyWeight * (1 - candidate.maxSimilarity)
      if (combined > bestScore || (combined === bestScore && candidate.entry.motif.motifId.localeCompare(best.entry.motif.motifId) < 0)) {
        best = candidate
        bestScore = combined
      }
    }
    picked.push({ ...best.entry, novelty: Math.round((1 - best.maxSimilarity) * 1000) / 1000, rationale: rationale(best.entry.features, picked.map((chosen) => chosen.features)) })
    remaining = remaining.filter((entry) => entry !== best.entry)
  }

  return {
    context,
    eligibleCount: candidates.length,
    poolIds: pool.map((entry) => entry.motif.motifId),
    selections: picked.map((entry) => ({ motif: entry.motif, shapeSignature: motifShapeSignatureV2(entry.motif), relevance: entry.relevance, novelty: entry.novelty, rationale: entry.rationale })),
  }
}

// ─── provider projection (de-identified, request-local labels) ────────────────

export type ProviderMotifRegionV2 = Omit<ReferenceMotifRegionV2, "regions"> & { regions?: ProviderMotifRegionV2[] }

export type ProviderDesignMotifV2 = {
  label: string
  purposes: MotifPurposeV2[]
  beat: ReferenceMotifV2["beat"]
  role: ReferenceMotifV2["sectionRole"]
  density: number
  whitespace: number
  edge: ReferenceMotifV2["edge"]
  continuityToNext?: ReferenceMotifV2["continuityToNext"]
  regions: ProviderMotifRegionV2[]
}

const LABELS = ["A", "B", "C", "D", "E", "F"] as const

/** What the provider sees: relation + where it fits. No motifId, family, tags or diagnostics. */
export function toProviderDesignMotifsV2(selections: readonly MotifSelectionV2[], allowedPurposes: readonly MotifPurposeV2[]): ProviderDesignMotifV2[] {
  return selections.slice(0, LABELS.length).map((selection, index) => {
    const motif = selection.motif
    return {
      label: LABELS[index],
      purposes: motif.tags.purposes.filter((purpose) => allowedPurposes.includes(purpose)),
      beat: motif.beat,
      role: motif.sectionRole,
      density: motif.density,
      whitespace: motif.whitespace,
      edge: motif.edge,
      ...(motif.continuityToNext ? { continuityToNext: motif.continuityToNext } : {}),
      regions: structuredClone(motif.regions),
    }
  })
}

// ─── originality diagnostic (offline evidence; never rejects) ─────────────────

export type MotifOriginalityPageV2 = { path: string; graphs: ReadonlyArray<GraphSectionV1 | Record<string, unknown>> }

export function diagnoseMotifReproductionV2(pages: readonly MotifOriginalityPageV2[], motifs: ReadonlyArray<Pick<ReferenceMotifV2, "sectionRole" | "beat" | "density" | "whitespace" | "edge" | "continuityToNext" | "regions">>): string[] {
  const motifShapes = new Set(motifs.map(motifShapeSignatureV2))
  const warnings: string[] = []
  const siteShapes: string[] = []
  for (const page of pages) {
    const shapes = page.graphs.map((graph) => graphShapeSignatureV1(graph as Parameters<typeof graphShapeSignatureV1>[0]))
    siteShapes.push(...shapes)
    if (shapes.length >= 2 && new Set(shapes).size === 1 && motifShapes.has(shapes[0])) warnings.push(`${page.path}: motif_reproduced_on_page; todas las composiciones de la pagina copian un mismo motivo.`)
  }
  if (siteShapes.length >= 3 && new Set(siteShapes).size === 1 && motifShapes.has(siteShapes[0])) warnings.push("site: motif_repeated_across_site; todo el sitio repite la forma de un solo motivo.")
  return warnings
}
