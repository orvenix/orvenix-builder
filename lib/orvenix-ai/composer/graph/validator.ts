import { SECTION_INSTANCE_NARRATIVE_INTENTS } from "@/lib/orvenix-ai/architect/composition-plan"
import {
  CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
  GRAPH_ALIGNMENTS_V1,
  GRAPH_ARRANGEMENTS_V1,
  GRAPH_BEATS_V1,
  GRAPH_CONTINUITIES_V1,
  GRAPH_EDGES_V1,
  GRAPH_LIMITS_V1,
  GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1,
  GRAPH_REGION_ROLES_V1,
  GRAPH_SECTION_ROLES_V1,
  type GraphDiagnosticV1,
  type GraphGroundingV1,
  type GraphRefV1,
  type GraphRegionV1,
  type GraphSectionV1,
} from "./contract"
import { canonicalGraphJsonV1, graphFingerprintV1 } from "./fingerprint"

/**
 * CF-2: strict validation of ONE graph section. Every rule -- including the
 * page-arc rules -- is attributable to this section, so an invalid graph
 * sends only THIS section back to the V1 path (never the whole page/site).
 * Diagnostics are structured and content-free.
 */

export type GraphSectionPositionV1 = { index: number; total: number; peaksBefore: number }

export type GraphSectionValidationV1 =
  | { ok: true; graph: GraphSectionV1; fingerprint: string }
  | { ok: false; diagnostics: GraphDiagnosticV1[] }

const SECTION_KEYS = ["version", "role", "beat", "density", "whitespace", "edge", "continuityToNext", "narrative", "regions"] as const
const REGION_KEYS = ["id", "role", "span", "weight", "align", "whitespace", "density", "arrangement", "refs", "anchor", "pinned", "withCta", "regions"] as const
const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/
const CATEGORY_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function inList<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value)
}

function boundedInt(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
}

/** Greedy row packing on the 12-unit grid (shared with the compiler). */
export function packGraphRowsV1<T extends { span: number }>(regions: readonly T[]): T[][] {
  const rows: T[][] = []
  let current: T[] = []
  let sum = 0
  for (const region of regions) {
    if (current.length && sum + region.span > GRAPH_LIMITS_V1.gridUnits) {
      rows.push(current)
      current = []
      sum = 0
    }
    current.push(region)
    sum += region.span
  }
  if (current.length) rows.push(current)
  return rows
}

function refKey(ref: GraphRefV1): string {
  return ref.kind === "category" ? `category:${ref.key}` : `${ref.kind}:${ref.index}`
}

function sameRef(a: GraphRefV1, b: GraphRefV1): boolean {
  return refKey(a) === refKey(b)
}

export function validateGraphSectionV1(
  value: unknown,
  grounding: GraphGroundingV1,
  position?: GraphSectionPositionV1,
): GraphSectionValidationV1 {
  const diagnostics: GraphDiagnosticV1[] = []
  const fail = (path: string, code: GraphDiagnosticV1["code"], message: string) => {
    diagnostics.push({ path, code, message })
  }

  if (!isRecord(value)) return { ok: false, diagnostics: [{ path: "$", code: "not_object", message: "graph section must be an object" }] }
  for (const key of Object.keys(value)) if (!(SECTION_KEYS as readonly string[]).includes(key)) fail(`$.${key}`, "unknown_key", "key not allowed")
  if (value.version !== CREATIVE_COMPOSITION_GRAPH_VERSION_V1) fail("$.version", "version_invalid", "unsupported graph version")
  if (!inList(GRAPH_SECTION_ROLES_V1, value.role)) fail("$.role", "enum_invalid", "section role not supported by the graph compiler")
  if (!inList(GRAPH_BEATS_V1, value.beat)) fail("$.beat", "enum_invalid", "unknown beat")
  if (!inList(GRAPH_EDGES_V1, value.edge)) fail("$.edge", "enum_invalid", "unknown edge")
  if (!boundedInt(value.density, GRAPH_LIMITS_V1.density.min, GRAPH_LIMITS_V1.density.max)) fail("$.density", "integer_invalid", "density must be an integer 0..3")
  if (!boundedInt(value.whitespace, GRAPH_LIMITS_V1.whitespace.min, GRAPH_LIMITS_V1.whitespace.max)) fail("$.whitespace", "integer_invalid", "whitespace must be an integer 0..3")
  if (value.continuityToNext !== undefined && !inList(GRAPH_CONTINUITIES_V1, value.continuityToNext)) fail("$.continuityToNext", "enum_invalid", "unknown continuity")
  if (value.narrative !== undefined && !inList(SECTION_INSTANCE_NARRATIVE_INTENTS, value.narrative)) fail("$.narrative", "enum_invalid", "unknown narrative intent")
  if (!Array.isArray(value.regions) || value.regions.length < 1 || value.regions.length > GRAPH_LIMITS_V1.maxTopLevelRegions) {
    fail("$.regions", "region_limit", `1..${GRAPH_LIMITS_V1.maxTopLevelRegions} top-level regions`)
    return { ok: false, diagnostics }
  }
  if (diagnostics.length) return { ok: false, diagnostics }

  const sectionRole = value.role as GraphSectionV1["role"]
  const allowedRoles = GRAPH_REGION_ROLES_BY_SECTION_ROLE_V1[sectionRole]
  const ids = new Set<string>()
  const ownedRefs = new Set<string>()
  let totalRegions = 0
  let totalRefs = 0
  const anchors: Array<{ path: string; region: GraphRegionV1 }> = []
  const focusRegions: GraphRegionV1[] = []
  let copyCount = 0
  let ctaCount = 0

  const validateRef = (ref: unknown, path: string): GraphRefV1 | null => {
    if (!isRecord(ref)) {
      fail(path, "refs_invalid", "ref must be an object")
      return null
    }
    if (ref.kind === "product" || ref.kind === "product-media") {
      if (Object.keys(ref).some((key) => key !== "kind" && key !== "index")) fail(path, "unknown_key", "ref key not allowed")
      if (!boundedInt(ref.index, 0, 10_000)) {
        fail(path, "refs_invalid", "ref index must be a non-negative integer")
        return null
      }
      if (ref.kind === "product" && !grounding.renderableProductIndexes.has(ref.index)) fail(path, "ref_unknown_product", "product ref is not a renderable grounded product")
      if (ref.kind === "product-media" && !grounding.mediaProductIndexes.has(ref.index)) fail(path, "media_unavailable", "product has no authoritative image")
      return { kind: ref.kind, index: ref.index }
    }
    if (ref.kind === "category") {
      if (Object.keys(ref).some((key) => key !== "kind" && key !== "key")) fail(path, "unknown_key", "ref key not allowed")
      if (typeof ref.key !== "string" || !CATEGORY_KEY_PATTERN.test(ref.key) || ref.key.length > 80) {
        fail(path, "refs_invalid", "category key malformed")
        return null
      }
      if (!grounding.categoryKeys.has(ref.key)) fail(path, "ref_unknown_category", "category ref is not a real category destination")
      return { kind: "category", key: ref.key }
    }
    fail(path, "refs_invalid", "unknown ref kind")
    return null
  }

  const validateRegion = (region: unknown, path: string, depth: number, parentEffectiveSpan: number): void => {
    totalRegions += 1
    if (!isRecord(region)) {
      fail(path, "not_object", "region must be an object")
      return
    }
    for (const key of Object.keys(region)) if (!(REGION_KEYS as readonly string[]).includes(key)) fail(`${path}.${key}`, "unknown_key", "key not allowed")
    if (typeof region.id !== "string" || !ID_PATTERN.test(region.id) || ids.has(region.id)) fail(`${path}.id`, "id_invalid", "region id must be unique [a-z0-9-]")
    else ids.add(region.id)
    if (!inList(GRAPH_REGION_ROLES_V1, region.role)) {
      fail(`${path}.role`, "enum_invalid", "unknown region role")
      return
    }
    const role = region.role
    if (depth === 1 && !allowedRoles.includes(role)) fail(`${path}.role`, "role_not_allowed", `${role} not allowed in a ${sectionRole} section`)
    if (depth === 2 && role !== "single-product") fail(`${path}.role`, "role_not_allowed", "nested regions are single products")
    if (!boundedInt(region.span, GRAPH_LIMITS_V1.minSpan, GRAPH_LIMITS_V1.gridUnits)) {
      fail(`${path}.span`, "span_invalid", `span must be an integer ${GRAPH_LIMITS_V1.minSpan}..${GRAPH_LIMITS_V1.gridUnits}`)
      return
    }
    if (!boundedInt(region.weight, GRAPH_LIMITS_V1.weight.min, GRAPH_LIMITS_V1.weight.max)) fail(`${path}.weight`, "integer_invalid", "weight must be an integer 1..5")
    if (region.whitespace !== undefined && !boundedInt(region.whitespace, 0, 3)) fail(`${path}.whitespace`, "integer_invalid", "whitespace must be an integer 0..3")
    if (region.density !== undefined && !boundedInt(region.density, 0, 3)) fail(`${path}.density`, "integer_invalid", "density must be an integer 0..3")
    if (region.align !== undefined && !inList(GRAPH_ALIGNMENTS_V1, region.align)) fail(`${path}.align`, "enum_invalid", "unknown alignment")
    const isGroup = role === "product-group" || role === "category-group"
    if (region.arrangement !== undefined && (!isGroup || !inList(GRAPH_ARRANGEMENTS_V1, region.arrangement))) fail(`${path}.arrangement`, "enum_invalid", "arrangement is for groups only")
    if (region.arrangement === "rail" && role !== "product-group") fail(`${path}.arrangement`, "enum_invalid", "rail is a product-group arrangement")
    if ((region.pinned !== undefined || region.withCta !== undefined) && role !== "copy") fail(path, "role_not_allowed", "pinned/withCta are copy-only")
    if (region.pinned !== undefined && typeof region.pinned !== "boolean") fail(`${path}.pinned`, "enum_invalid", "boolean")
    if (region.withCta !== undefined && typeof region.withCta !== "boolean") fail(`${path}.withCta`, "enum_invalid", "boolean")

    const effectiveSpan = (parentEffectiveSpan * (region.span as number)) / GRAPH_LIMITS_V1.gridUnits
    if (effectiveSpan < GRAPH_LIMITS_V1.minReadableSpan[role]) fail(`${path}.span`, "too_narrow", `${role} needs at least ${GRAPH_LIMITS_V1.minReadableSpan[role]}/12 of the section width`)

    if (role === "copy") copyCount += 1
    if (role === "cta") ctaCount += 1
    if ((role === "cta" || region.withCta === true) && !grounding.hasCtaAction) fail(path, "cta_unavailable", "no Orvenix-resolved call to action for this section")

    const refs = region.refs === undefined ? [] : Array.isArray(region.refs) ? region.refs.map((ref, index) => validateRef(ref, `${path}.refs[${index}]`)) : null
    if (refs === null) {
      fail(`${path}.refs`, "refs_invalid", "refs must be an array")
      return
    }
    const validRefs = refs.filter((ref): ref is GraphRefV1 => ref !== null)
    totalRefs += validRefs.length
    for (const ref of validRefs) {
      const key = refKey(ref)
      if (ownedRefs.has(key)) fail(path, "duplicate_ref", `${key} is rendered by more than one region`)
      ownedRefs.add(key)
    }
    const products = validRefs.filter((ref) => ref.kind === "product")
    const categories = validRefs.filter((ref) => ref.kind === "category")
    const media = validRefs.filter((ref) => ref.kind === "product-media")
    const children = region.regions

    if (children !== undefined) {
      if (role !== "product-group" || depth >= GRAPH_LIMITS_V1.maxDepth) fail(`${path}.regions`, "depth_limit", "only a top-level product group may nest (one level)")
      else if (!Array.isArray(children) || children.length < 2) fail(`${path}.regions`, "region_limit", "a nested group needs at least 2 regions")
      else {
        if (refs.length) fail(`${path}.refs`, "refs_invalid", "a nesting group's items own the refs")
        children.forEach((child, index) => validateRegion(child, `${path}.regions[${index}]`, depth + 1, effectiveSpan))
      }
    } else {
      const expect = (ok: boolean, message: string) => {
        if (!ok) fail(`${path}.refs`, "refs_invalid", message)
      }
      if (role === "single-product") expect(products.length === 1 && refs.length === 1, "single-product needs exactly one product ref")
      if (role === "product-group") expect(products.length >= 2 && products.length === refs.length && (region.arrangement !== "rail" || products.length <= GRAPH_LIMITS_V1.maxRailItems), "product-group needs 2+ product refs (rail <= 12)")
      if (role === "category-group") expect(categories.length >= 1 && categories.length === refs.length, "category-group needs category refs only")
      if (role === "grounded-media") expect(media.length === 1 && refs.length === 1, "grounded-media needs exactly one product-media ref")
      if (role === "copy" || role === "cta") expect(refs.length === 0, `${role} carries no refs`)
    }

    if (region.anchor !== undefined) {
      const anchor = validateRef(region.anchor, `${path}.anchor`)
      const anchorable = role === "single-product" || role === "category-group" || (role === "product-group" && children === undefined)
      if (!anchor || !anchorable || !validRefs.some((ref) => sameRef(ref, anchor)) || anchor.kind === "product-media") fail(`${path}.anchor`, "anchor_invalid", "the anchor must be one of this region's product/category refs")
      else anchors.push({ path, region: region as unknown as GraphRegionV1 })
    }
    if ((role === "single-product" || role === "grounded-media") && (region.weight as number) >= 4) focusRegions.push(region as unknown as GraphRegionV1)
  }

  const topLevel = value.regions as unknown[]
  topLevel.forEach((region, index) => validateRegion(region, `$.regions[${index}]`, 1, GRAPH_LIMITS_V1.gridUnits))
  if (copyCount > 1) fail("$.regions", "region_limit", "at most one copy region")
  if (ctaCount > 1) fail("$.regions", "region_limit", "at most one cta region")
  if (totalRegions > GRAPH_LIMITS_V1.maxRegionsTotal || totalRefs > GRAPH_LIMITS_V1.maxRefsPerSection) fail("$", "caps_exceeded", "too many regions or refs")

  // Hierarchy: ONE anchor, and every other content region is subordinate to it.
  if (anchors.length > 1) fail("$.regions", "multiple_anchors", "a section has at most one visual anchor")
  if (anchors.length === 1) {
    const anchorRegion = anchors[0].region
    const contentRoles = new Set(["single-product", "product-group", "category-group", "grounded-media"])
    const others: GraphRegionV1[] = []
    const collect = (regions: GraphRegionV1[]) => {
      for (const region of regions) {
        if (region !== anchorRegion && contentRoles.has(region.role)) others.push(region)
        if (region.regions) collect(region.regions)
      }
    }
    collect(topLevel as GraphRegionV1[])
    if (others.some((region) => region.weight > anchorRegion.weight)) fail(`${anchors[0].path}.weight`, "anchor_not_dominant", "supporting regions may not outweigh the anchor")
  }

  // Page arc rules, attributed to this section.
  const beat = value.beat as GraphSectionV1["beat"]
  if (beat === "rest" && (value.density as number) > 1) fail("$.density", "rest_too_dense", "a rest beat is sparse (density <= 1)")
  if (beat === "peak" && anchors.length === 0 && focusRegions.length === 0) fail("$.beat", "peak_without_focus", "a peak needs an anchor or a weight>=4 product/media region")
  if (position) {
    if (beat === "open" && position.index !== 0) fail("$.beat", "beat_sequence", "open is the first beat only")
    if (beat === "close" && position.index !== position.total - 1) fail("$.beat", "beat_sequence", "close is the last beat only")
    if (beat === "peak" && position.peaksBefore >= GRAPH_LIMITS_V1.maxPeaksPerPage) fail("$.beat", "beat_sequence", `at most ${GRAPH_LIMITS_V1.maxPeaksPerPage} peaks per page`)
    if (value.continuityToNext !== undefined && position.index === position.total - 1) fail("$.continuityToNext", "continuity_invalid", "the last section has no next section")
  }

  if (!diagnostics.length && canonicalGraphJsonV1(value).length > GRAPH_LIMITS_V1.maxCanonicalLength) fail("$", "caps_exceeded", "graph too large")
  if (diagnostics.length) return { ok: false, diagnostics }
  const graph = structuredClone(value) as unknown as GraphSectionV1
  return { ok: true, graph, fingerprint: graphFingerprintV1(graph) }
}

/**
 * Page arc: validates every section with its position. The result is
 * PER SECTION (fallback stays section-level); `arcDiagnostics` repeats the
 * sequence problems for reporting.
 */
export function validateGraphPageV1(
  sections: readonly unknown[],
  groundingFor: (index: number) => GraphGroundingV1,
): GraphSectionValidationV1[] {
  let peaks = 0
  return sections.slice(0, GRAPH_LIMITS_V1.maxPageSections).map((section, index) => {
    const result = validateGraphSectionV1(section, groundingFor(index), { index, total: Math.min(sections.length, GRAPH_LIMITS_V1.maxPageSections), peaksBefore: peaks })
    if (result.ok && result.graph.beat === "peak") peaks += 1
    return result
  })
}
