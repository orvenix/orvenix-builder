import type { CommerceCreativeNarrativeIntentV1 } from "@/lib/orvenix-ai/commerce/architecture-contract"

/**
 * CF-2: CreativeCompositionGraphV1 -- an INTERNAL, relational description of
 * a section's composition (and of a page's arc). It says WHAT relates to
 * WHAT (this product is the anchor, these support it, copy owns this
 * region, 8/4, spacious, the next section contrasts); the Orvenix graph
 * compiler decides HOW (classes, breakpoints, responsive collapse, DOM
 * order, colors, accessibility).
 *
 * The contract carries only closed vocabularies and small bounded
 * integers. There is deliberately no field for px/rem/vw, calc(), CSS
 * variables, class names, CSS, HTML or JSX -- the strict validator rejects
 * any unknown key.
 */

export const CREATIVE_COMPOSITION_GRAPH_VERSION_V1 = 1 as const

export const GRAPH_BEATS_V1 = ["open", "build", "peak", "rest", "close"] as const
export const GRAPH_CONTINUITIES_V1 = ["continue", "contrast", "bridge"] as const
export const GRAPH_SECTION_ROLES_V1 = ["products", "content"] as const
export const GRAPH_REGION_ROLES_V1 = ["copy", "single-product", "product-group", "category-group", "grounded-media", "cta"] as const
export const GRAPH_ALIGNMENTS_V1 = ["start", "center", "end"] as const
export const GRAPH_EDGES_V1 = ["contained", "bleed"] as const
export const GRAPH_ARRANGEMENTS_V1 = ["grid", "stack", "rail"] as const

/** Which region roles each section role may contain. */
export const GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1: Record<GraphSectionRoleV1, readonly GraphRegionRoleV1[]> = {
  products: ["copy", "single-product", "product-group", "grounded-media", "cta"],
  content: ["copy", "category-group", "cta"],
}

export const GRAPH_LIMITS_V1 = {
  /** Spans are units of a 12-column CONCEPTUAL grid (never pixels). */
  gridUnits: 12,
  minSpan: 3,
  maxTopLevelRegions: 4,
  /** A section's regions may nest once (a product group of single products). */
  maxDepth: 2,
  maxRegionsTotal: 12,
  maxRefsPerSection: 24,
  maxRailItems: 12,
  maxPageSections: 16,
  maxPeaksPerPage: 2,
  weight: { min: 1, max: 5 },
  whitespace: { min: 0, max: 3 },
  density: { min: 0, max: 3 },
  /** Readable minimum EFFECTIVE span (share of the section width, in 12ths). */
  minReadableSpan: { copy: 4, "product-group": 4, "category-group": 4, "single-product": 3, "grounded-media": 3, cta: 3 } as Record<GraphRegionRoleV1, number>,
  maxCanonicalLength: 12_000,
} as const

export type GraphBeatV1 = (typeof GRAPH_BEATS_V1)[number]
export type GraphContinuityV1 = (typeof GRAPH_CONTINUITIES_V1)[number]
export type GraphSectionRoleV1 = (typeof GRAPH_SECTION_ROLES_V1)[number]
export type GraphRegionRoleV1 = (typeof GRAPH_REGION_ROLES_V1)[number]
export type GraphAlignmentV1 = (typeof GRAPH_ALIGNMENTS_V1)[number]
export type GraphEdgeV1 = (typeof GRAPH_EDGES_V1)[number]
export type GraphArrangementV1 = (typeof GRAPH_ARRANGEMENTS_V1)[number]

/** Grounded references: indexes into the REAL product facts, keys of REAL category destinations. */
export type GraphRefV1 =
  | { kind: "product"; index: number }
  | { kind: "category"; key: string }
  | { kind: "product-media"; index: number }

export interface GraphRegionV1 {
  /** Stable id within the section ([a-z0-9-], unique). */
  id: string
  role: GraphRegionRoleV1
  /** 3..12 units of the parent's width. */
  span: number
  /** 1..5 visual importance. */
  weight: number
  align?: GraphAlignmentV1
  /** 0..3 breathing room inside the region. */
  whitespace?: number
  /** 0..3 information density of a group. */
  density?: number
  /** Groups only. */
  arrangement?: GraphArrangementV1
  refs?: GraphRefV1[]
  /** The ONE visual anchor of the section, when it lives in this region (must be one of its refs). */
  anchor?: GraphRefV1
  /** Copy only: the copy stays with its neighbour while it scrolls (desktop). */
  pinned?: boolean
  /** Copy only: the section's Orvenix-resolved call to action lives inside the copy. */
  withCta?: boolean
  /** Product groups only: one nested level of single-product regions. */
  regions?: GraphRegionV1[]
}

export interface GraphSectionV1 {
  version: typeof CREATIVE_COMPOSITION_GRAPH_VERSION_V1
  role: GraphSectionRoleV1
  beat: GraphBeatV1
  /** 0..3 section information density. */
  density: number
  /** 0..3 section whitespace. */
  whitespace: number
  edge: GraphEdgeV1
  /** Relationship with the NEXT section (absent on the last). */
  continuityToNext?: GraphContinuityV1
  /** Closed narrative intent for Orvenix's grounded copy (never prose). */
  narrative?: CommerceCreativeNarrativeIntentV1
  regions: GraphRegionV1[]
}

/** A page arc: the ordered graph sections of a page. */
export interface GraphPageV1 {
  version: typeof CREATIVE_COMPOSITION_GRAPH_VERSION_V1
  sections: GraphSectionV1[]
}

/** Structured, content-free diagnostics (suitable as future provider feedback). */
export interface GraphDiagnosticV1 {
  path: string
  code:
    | "not_object"
    | "unknown_key"
    | "version_invalid"
    | "enum_invalid"
    | "integer_invalid"
    | "id_invalid"
    | "region_limit"
    | "depth_limit"
    | "role_not_allowed"
    | "span_invalid"
    | "row_overflow"
    | "too_narrow"
    | "refs_invalid"
    | "ref_unknown_product"
    | "ref_unknown_category"
    | "media_unavailable"
    | "duplicate_ref"
    | "anchor_invalid"
    | "anchor_not_dominant"
    | "multiple_anchors"
    | "cta_unavailable"
    | "caps_exceeded"
    | "beat_sequence"
    | "rest_too_dense"
    | "peak_without_focus"
    | "continuity_invalid"
  message: string
}

/** What the validator checks references against (all Orvenix-authoritative). */
export interface GraphGroundingV1 {
  productCount: number
  /** Products that can render a card (bound or pending). */
  renderableProductIndexes: ReadonlySet<number>
  /** Products with a safe, authoritative image. */
  mediaProductIndexes: ReadonlySet<number>
  /** Keys of the REAL category destinations available to this section. */
  categoryKeys: ReadonlySet<string>
  /** Whether Orvenix resolved a call to action for this section. */
  hasCtaAction: boolean
}
