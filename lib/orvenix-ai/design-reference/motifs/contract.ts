import {
  GRAPH_ALIGNMENTS_V1,
  GRAPH_ARRANGEMENTS_V1,
  GRAPH_BEATS_V1,
  GRAPH_CONTINUITIES_V1,
  GRAPH_EDGES_V1,
  GRAPH_LIMITS_V1,
  GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1,
  GRAPH_SECTION_ROLES_V1,
  type GraphAlignmentV1,
  type GraphArrangementV1,
  type GraphBeatV1,
  type GraphContinuityV1,
  type GraphEdgeV1,
  type GraphRegionRoleV1,
  type GraphSectionRoleV1,
} from "@/lib/orvenix-ai/composer/graph/contract"
import { packGraphRowsV1 } from "@/lib/orvenix-ai/composer/graph/validator"
import { graphShapeSignatureV1, graphWeightContrastV1, type GraphWeightContrastV1 } from "@/lib/orvenix-ai/composer/graph/shape"

/**
 * CF-4B Reference Motif V2: a curated, Orvenix-authored, DE-IDENTIFIED
 * relationship expressed in the CreativeCompositionGraphV1 vocabulary
 * (same roles, 12-unit spans, weights, density/whitespace, edge,
 * arrangement, beat, continuity) -- minus everything concrete: no refs,
 * ids, copy, names, colors, fonts, dimensions, URLs or code. `focal`
 * marks the region that would carry the anchor. A motif is a reusable
 * RELATION, never a page template; every motif instantiates to a graph
 * the CF-2 validator accepts (tested).
 */

export const REFERENCE_MOTIF_V2_VERSION = 2 as const
export const MOTIF_MODES_V2 = ["commerce", "editorial", "service"] as const
export const MOTIF_SCALES_V2 = ["none", "small", "medium", "large"] as const
export const MOTIF_PURPOSES_V2 = ["home", "catalog", "category", "product_detail", "services", "about", "contact", "help"] as const
export const MOTIF_FAMILIES_V2 = ["sparse-focal", "editorial", "commerce", "content"] as const

export type MotifModeV2 = (typeof MOTIF_MODES_V2)[number]
export type MotifScaleV2 = (typeof MOTIF_SCALES_V2)[number]
export type MotifPurposeV2 = (typeof MOTIF_PURPOSES_V2)[number]
export type MotifFamilyV2 = (typeof MOTIF_FAMILIES_V2)[number]

export type ReferenceMotifRegionV2 = {
  role: GraphRegionRoleV1
  span: number
  weight: number
  focal?: true
  align?: GraphAlignmentV1
  arrangement?: GraphArrangementV1
  density?: number
  whitespace?: number
  pinned?: true
  withCta?: true
  regions?: ReferenceMotifRegionV2[]
}

export type ReferenceMotifTagsV2 = {
  modes: MotifModeV2[]
  scales: MotifScaleV2[]
  purposes: MotifPurposeV2[]
  /** Needs grounded product media (product-media refs). */
  requiresMedia?: true
  /** Needs 2+ real category destinations. */
  requiresCategories?: true
}

export interface ReferenceMotifV2 {
  version: typeof REFERENCE_MOTIF_V2_VERSION
  /** Opaque, derived from shape + tags (never a source identity). */
  motifId: string
  family: MotifFamilyV2
  tags: ReferenceMotifTagsV2
  beat: GraphBeatV1
  sectionRole: GraphSectionRoleV1
  density: number
  whitespace: number
  edge: GraphEdgeV1
  continuityToNext?: GraphContinuityV1
  regions: ReferenceMotifRegionV2[]
}

// ─── strictness ────────────────────────────────────────────────────────────────

const MOTIF_KEYS = new Set(["version", "motifId", "family", "tags", "beat", "sectionRole", "density", "whitespace", "edge", "continuityToNext", "regions"])
const TAG_KEYS = new Set(["modes", "scales", "purposes", "requiresMedia", "requiresCategories"])
const REGION_KEYS = new Set(["role", "span", "weight", "focal", "align", "arrangement", "density", "whitespace", "pinned", "withCta", "regions"])
const MOTIF_ID_PATTERN = /^m-[a-f0-9]{10}$/

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value)
const inList = (list: readonly unknown[], value: unknown) => list.includes(value)
const isInt = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
const onlyKeys = (value: Record<string, unknown>, keys: Set<string>) => Object.keys(value).every((key) => keys.has(key))

function validRegion(value: unknown, sectionRole: GraphSectionRoleV1, depth: number): boolean {
  if (!isRecord(value) || !onlyKeys(value, REGION_KEYS)) return false
  if (!inList(GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1[sectionRole], value.role)) return false
  if (!isInt(value.span, GRAPH_LIMITS_V1.minSpan, GRAPH_LIMITS_V1.gridUnits) || !isInt(value.weight, GRAPH_LIMITS_V1.weight.min, GRAPH_LIMITS_V1.weight.max)) return false
  for (const flag of ["focal", "pinned", "withCta"]) if (value[flag] !== undefined && value[flag] !== true) return false
  if (value.align !== undefined && !inList(GRAPH_ALIGNMENTS_V1, value.align)) return false
  if (value.arrangement !== undefined && !inList(GRAPH_ARRANGEMENTS_V1, value.arrangement)) return false
  if (value.density !== undefined && !isInt(value.density, 0, 3)) return false
  if (value.whitespace !== undefined && !isInt(value.whitespace, 0, 3)) return false
  if (value.regions !== undefined) {
    if (depth >= GRAPH_LIMITS_V1.maxDepth - 1 || value.role !== "product-group" || !Array.isArray(value.regions) || !value.regions.length) return false
    if (!value.regions.every((child) => isRecord(child) && child.role === "single-product" && validRegion(child, sectionRole, depth + 1))) return false
  }
  return true
}

/** Closed-vocabulary check: every value is an enum/bounded number -- free text (names, copy, colors, URLs, code) cannot exist. */
export function isValidReferenceMotifV2(value: unknown): value is ReferenceMotifV2 {
  if (!isRecord(value) || !onlyKeys(value, MOTIF_KEYS)) return false
  if (value.version !== REFERENCE_MOTIF_V2_VERSION || typeof value.motifId !== "string" || !MOTIF_ID_PATTERN.test(value.motifId)) return false
  if (!inList(MOTIF_FAMILIES_V2, value.family) || !inList(GRAPH_BEATS_V1, value.beat) || !inList(GRAPH_SECTION_ROLES_V1, value.sectionRole) || !inList(GRAPH_EDGES_V1, value.edge)) return false
  if (!isInt(value.density, 0, 3) || !isInt(value.whitespace, 0, 3)) return false
  if (value.continuityToNext !== undefined && !inList(GRAPH_CONTINUITIES_V1, value.continuityToNext)) return false
  const tags = value.tags
  if (!isRecord(tags) || !onlyKeys(tags, TAG_KEYS)) return false
  for (const [key, list] of [["modes", MOTIF_MODES_V2], ["scales", MOTIF_SCALES_V2], ["purposes", MOTIF_PURPOSES_V2]] as const) {
    const values = tags[key]
    if (!Array.isArray(values) || !values.length || !values.every((entry) => inList(list, entry))) return false
  }
  for (const flag of ["requiresMedia", "requiresCategories"]) if (tags[flag] !== undefined && tags[flag] !== true) return false
  const regions = value.regions
  if (!Array.isArray(regions) || !regions.length || regions.length > GRAPH_LIMITS_V1.maxTopLevelRegions) return false
  if (!regions.every((region) => validRegion(region, value.sectionRole as GraphSectionRoleV1, 0))) return false
  const flat: unknown[] = []
  const walk = (list: unknown[]) => list.forEach((region) => { flat.push(region); if (isRecord(region) && Array.isArray(region.regions)) walk(region.regions) })
  walk(regions)
  if (flat.length > GRAPH_LIMITS_V1.maxRegionsTotal || flat.filter((region) => isRecord(region) && region.focal === true).length > 1) return false
  return true
}

// ─── relation descriptors (diagnostic + similarity) ───────────────────────────

export type MotifCopyPlacementV2 = "beside" | "before" | "after" | "only" | "none"
export type MotifAsymmetryV2 = "full" | "symmetric" | "asymmetric"

export type MotifRelationV2 = {
  focal: GraphRegionRoleV1 | "none"
  support: GraphRegionRoleV1[]
  spans: string
  asymmetry: MotifAsymmetryV2
  weightContrast: GraphWeightContrastV1
  arrangements: GraphArrangementV1[]
  copyPlacement: MotifCopyPlacementV2
}

function flatRegions(regions: readonly ReferenceMotifRegionV2[]): ReferenceMotifRegionV2[] {
  return regions.flatMap((region) => [region, ...flatRegions(region.regions ?? [])])
}

export function describeMotifRelationV2(motif: Pick<ReferenceMotifV2, "regions">): MotifRelationV2 {
  const flat = flatRegions(motif.regions)
  const focal = flat.find((region) => region.focal)
  const rows = packGraphRowsV1(motif.regions)
  const contentRoles = new Set<GraphRegionRoleV1>(["single-product", "product-group", "category-group", "grounded-media"])
  const copyRow = rows.findIndex((row) => row.some((region) => region.role === "copy"))
  const contentRow = rows.findIndex((row) => row.some((region) => contentRoles.has(region.role)))
  const copyPlacement: MotifCopyPlacementV2 = copyRow === -1 ? "none" : contentRow === -1 ? "only" : copyRow === contentRow ? "beside" : copyRow < contentRow ? "before" : "after"
  const asymmetry: MotifAsymmetryV2 = rows.every((row) => row.length === 1) ? "full" : rows.some((row) => row.length > 1 && new Set(row.map((region) => region.span)).size > 1) ? "asymmetric" : "symmetric"
  return {
    focal: focal?.role ?? "none",
    support: [...new Set(flat.filter((region) => region !== focal).map((region) => region.role))].sort(),
    spans: rows.map((row) => row.map((region) => region.span).join("/")).join(" | "),
    asymmetry,
    weightContrast: graphWeightContrastV1(flat.map((region) => region.weight)),
    arrangements: [...new Set(flat.flatMap((region) => (region.arrangement ? [region.arrangement] : [])))].sort(),
    copyPlacement,
  }
}

/** The motif's relational shape signature (same function as for provider graphs). */
export function motifShapeSignatureV2(motif: Pick<ReferenceMotifV2, "sectionRole" | "beat" | "density" | "whitespace" | "edge" | "continuityToNext" | "regions">): string {
  return graphShapeSignatureV1({ role: motif.sectionRole, beat: motif.beat, density: motif.density, whitespace: motif.whitespace, edge: motif.edge, continuityToNext: motif.continuityToNext, regions: motif.regions })
}

// ─── structural similarity (no theme/color features) ──────────────────────────

export const MOTIF_SIMILARITY_WEIGHTS_V2 = {
  focal: 0.18,
  support: 0.12,
  asymmetry: 0.14,
  weightContrast: 0.12,
  densityBand: 0.12,
  whitespaceBand: 0.08,
  arrangements: 0.1,
  copyPlacement: 0.08,
  beat: 0.04,
  edge: 0.02,
} as const

export type MotifStructuralFeaturesV2 = MotifRelationV2 & { densityBand: "sparse" | "dense"; whitespaceBand: "tight" | "open"; beat: GraphBeatV1; edge: GraphEdgeV1 }

export function motifStructuralFeaturesV2(motif: ReferenceMotifV2): MotifStructuralFeaturesV2 {
  return { ...describeMotifRelationV2(motif), densityBand: motif.density >= 2 ? "dense" : "sparse", whitespaceBand: motif.whitespace >= 2 ? "open" : "tight", beat: motif.beat, edge: motif.edge }
}

function jaccard<T>(a: readonly T[], b: readonly T[]): number {
  if (!a.length && !b.length) return 1
  const setB = new Set(b)
  const intersection = a.filter((value) => setB.has(value)).length
  return intersection / new Set([...a, ...b]).size
}

export function motifStructuralSimilarityV2(a: MotifStructuralFeaturesV2, b: MotifStructuralFeaturesV2): number {
  const w = MOTIF_SIMILARITY_WEIGHTS_V2
  const same = (key: keyof MotifStructuralFeaturesV2) => (a[key] === b[key] ? 1 : 0)
  return (
    w.focal * same("focal") +
    w.support * jaccard(a.support, b.support) +
    w.asymmetry * same("asymmetry") +
    w.weightContrast * same("weightContrast") +
    w.densityBand * same("densityBand") +
    w.whitespaceBand * same("whitespaceBand") +
    w.arrangements * jaccard(a.arrangements, b.arrangements) +
    w.copyPlacement * same("copyPlacement") +
    w.beat * same("beat") +
    w.edge * same("edge")
  )
}
