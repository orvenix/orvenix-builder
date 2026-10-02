import { canonicalGraphJsonV1, graphFingerprintV1 } from "./fingerprint"

/**
 * CF-4B: the RELATIONAL shape of a graph section -- what the composition
 * IS, independent of which products/categories/media fill it or what the
 * copy says. Two graphs with the same composition but different products
 * share a shape signature.
 *
 * Kept: section role, beat, density, whitespace, edge, continuity; per
 * region (in authored order): role, span, RELATIVE weight (dense rank,
 * 1 = heaviest), focal (anchor present), alignment (non-default only),
 * arrangement, region density/whitespace overrides, pinned/withCta flags,
 * nested structure; plus the section's weight-contrast band.
 * Dropped: refs, anchors' targets, region ids, narrative, copy, CTA content.
 *
 * graphFingerprintV1 is unchanged and still identifies the EXACT graph.
 * Accepts a GraphSectionV1 (focal = `anchor` present) or a motif-shaped
 * object (focal = `focal: true`).
 */

export const GRAPH_SHAPE_VERSION_V1 = 1 as const

export type GraphShapeRegionV1 = {
  role: string
  span: number
  rank: number
  focal?: true
  align?: string
  arrangement?: string
  density?: number
  whitespace?: number
  pinned?: true
  withCta?: true
  regions?: GraphShapeRegionV1[]
}

export type GraphWeightContrastV1 = "flat" | "focal" | "strong-focal"

export type GraphShapeV1 = {
  version: typeof GRAPH_SHAPE_VERSION_V1
  role: string
  beat: string
  density: number
  whitespace: number
  edge: string
  continuity?: string
  weightContrast: GraphWeightContrastV1
  regions: GraphShapeRegionV1[]
}

type ShapeSourceRegion = {
  role?: unknown
  span?: unknown
  weight?: unknown
  anchor?: unknown
  focal?: unknown
  align?: unknown
  arrangement?: unknown
  density?: unknown
  whitespace?: unknown
  pinned?: unknown
  withCta?: unknown
  regions?: unknown
}

type ShapeSource = {
  role?: unknown
  beat?: unknown
  density?: unknown
  whitespace?: unknown
  edge?: unknown
  continuityToNext?: unknown
  regions?: unknown
}

function regionList(value: unknown): ShapeSourceRegion[] {
  return Array.isArray(value) ? (value.filter((entry) => entry && typeof entry === "object") as ShapeSourceRegion[]) : []
}

function allWeights(regions: ShapeSourceRegion[]): number[] {
  return regions.flatMap((region) => [typeof region.weight === "number" ? region.weight : 0, ...allWeights(regionList(region.regions))])
}

export function graphWeightContrastV1(weights: readonly number[]): GraphWeightContrastV1 {
  if (!weights.length) return "flat"
  const spread = Math.max(...weights) - Math.min(...weights)
  return spread === 0 ? "flat" : spread <= 2 ? "focal" : "strong-focal"
}

export function graphShapeV1(source: ShapeSource): GraphShapeV1 {
  const top = regionList(source.regions)
  const weights = allWeights(top)
  const ranks = [...new Set(weights)].sort((a, b) => b - a)
  const shapeRegion = (region: ShapeSourceRegion): GraphShapeRegionV1 => {
    const nested = regionList(region.regions)
    return {
      role: String(region.role),
      span: Number(region.span),
      rank: ranks.indexOf(typeof region.weight === "number" ? region.weight : 0) + 1,
      ...(region.anchor !== undefined || region.focal === true ? { focal: true as const } : {}),
      ...(typeof region.align === "string" && region.align !== "start" ? { align: region.align } : {}),
      ...(typeof region.arrangement === "string" ? { arrangement: region.arrangement } : {}),
      ...(typeof region.density === "number" ? { density: region.density } : {}),
      ...(typeof region.whitespace === "number" ? { whitespace: region.whitespace } : {}),
      ...(region.pinned === true ? { pinned: true as const } : {}),
      ...(region.withCta === true ? { withCta: true as const } : {}),
      ...(nested.length ? { regions: nested.map(shapeRegion) } : {}),
    }
  }
  return {
    version: GRAPH_SHAPE_VERSION_V1,
    role: String(source.role),
    beat: String(source.beat),
    density: Number(source.density),
    whitespace: Number(source.whitespace),
    edge: String(source.edge),
    ...(typeof source.continuityToNext === "string" ? { continuity: source.continuityToNext } : {}),
    weightContrast: graphWeightContrastV1(weights),
    regions: top.map(shapeRegion),
  }
}

export function canonicalGraphShapeJsonV1(source: ShapeSource): string {
  return canonicalGraphJsonV1(graphShapeV1(source))
}

/** Stable relational fingerprint (sha256 hex of the canonical shape). */
export function graphShapeSignatureV1(source: ShapeSource): string {
  return graphFingerprintV1(graphShapeV1(source))
}
