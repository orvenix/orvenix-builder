import { createHash } from "crypto"

/**
 * CF-4C: composition memory, DERIVED from data Design Memory already
 * persists (DesignGeneration.initialPlan trees + editMetrics JSON) -- no
 * new table, no migration. Compiled section roots carry a coarse
 * `compositionToken` and graph roots a relational `compositionGraph.shape`
 * (both content-independent). Everything here is pure, bounded and
 * fail-open: anything unreadable is skipped, never thrown.
 *
 * Two separate signals (never conflated):
 * - RECENCY (anti-repetition): shapes/arcs/skeletons used recently by THIS
 *   owner -> soft down-weighting in motif retrieval (CF-4B ×0.5).
 * - POSITIVE: shapes that survived owner edits through publication ->
 *   recorded for future ranking; not used to avoid anything.
 */

export const COMPOSITION_MEMORY_VERSION_V1 = 1 as const

export const COMPOSITION_MEMORY_LIMITS_V1 = {
  /** Generations read per owner (newest first). Small: a few recent sites are what an owner perceives as "repetition". */
  maxGenerations: 8,
  /** Shapes passed to retrieval as soft "avoid" (the library has 25 motifs; 16 can never empty a pool). */
  maxAvoidShapes: 16,
  maxObservedShapes: 32,
  maxArcs: 32,
  maxSkeletons: 32,
  /** Customer-approved outcomes count fully; unaccepted generations half; abandoned not at all. */
  statusWeights: { published: 1, edited: 1, accepted: 1, generated: 0.5 } as Record<string, number>,
  /** A shape becomes "recent" at weight >= 1: one approved site, or two unaccepted generations. */
  avoidThreshold: 1,
  /** A page skeleton is "repeated in history" when >= 3 recent generations contain it. */
  historySkeletonRepeatMinGenerations: 3,
} as const

const EXCLUDED_ROLES = new Set(["navigation", "footer"])
const SHAPE_PATTERN = /^[a-f0-9]{64}$/
const TOKEN_PATTERN = /^[a-z]+\|(g|v1)\|[a-z0-9|:+_-]{1,120}$/

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex")
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value)

// ─── page signatures ──────────────────────────────────────────────────────────

export type PageCompositionSignatureV1 = {
  tokens: string[]
  arc: string[]
  shapes: string[]
  arcSignature: string
  skeletonSignature: string
}

function arcStep(token: string): string {
  const [role, kind, beat] = token.split("|")
  if (kind === "g") return beat
  return role === "hero" ? "open" : role === "cta" ? "close" : role
}

/** Page skeleton = ordered coarse section tokens; page arc = ordered beats (graph) or role-derived steps (V1). */
export function pageCompositionSignatureV1(tree: unknown): PageCompositionSignatureV1 | null {
  if (!isRecord(tree) || !isRecord(tree.nodes) || typeof tree.rootId !== "string") return null
  const nodes = tree.nodes as Record<string, unknown>
  const root = nodes[tree.rootId]
  if (!isRecord(root) || !Array.isArray(root.children)) return null
  const tokens: string[] = []
  const shapes: string[] = []
  for (const id of root.children) {
    const node = typeof id === "string" ? nodes[id] : undefined
    const props = isRecord(node) && isRecord(node.props) ? node.props : undefined
    const token = props?.compositionToken
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token) || EXCLUDED_ROLES.has(token.split("|")[0])) continue
    tokens.push(token)
    const shape = isRecord(props?.compositionGraph) ? props.compositionGraph.shape : undefined
    if (typeof shape === "string" && SHAPE_PATTERN.test(shape)) shapes.push(shape)
  }
  if (!tokens.length) return null
  const arc = tokens.map(arcStep)
  return { tokens, arc, shapes, arcSignature: sha(arc), skeletonSignature: sha(tokens) }
}

export type PlanCompositionPageV1 = PageCompositionSignatureV1 & { slug: string }

export function planCompositionSignaturesV1(plan: unknown): PlanCompositionPageV1[] {
  if (!isRecord(plan) || !Array.isArray(plan.pages)) return []
  return plan.pages.flatMap((page) => {
    if (!isRecord(page)) return []
    const signature = pageCompositionSignatureV1(page.tree)
    return signature ? [{ ...signature, slug: typeof page.slug === "string" ? page.slug : "" }] : []
  })
}

// ─── memory derivation ────────────────────────────────────────────────────────

export type CompositionMemoryRecordV1 = {
  userId: string
  status: string
  initialPlan: unknown
  editMetrics?: unknown
  createdAt?: Date | string
}

export type CompositionMemoryV1 = {
  version: typeof COMPOSITION_MEMORY_VERSION_V1
  /** Records considered (owner's, weighted status, within the bound). */
  sourceCount: number
  /** Records whose plan carried V2 composition structure. */
  usableCount: number
  /** RECENCY: soft-avoid shapes (weight >= threshold), strongest first. */
  recentShapeSignatures: string[]
  /** Every recent shape seen (for overlap diagnostics, not avoidance). */
  observedShapeSignatures: string[]
  recentPageArcSignatures: string[]
  recentPageSkeletonSignatures: string[]
  /** Skeletons present in >= historySkeletonRepeatMinGenerations recent generations. */
  repeatedPageSkeletonSignatures: string[]
  /** POSITIVE: shapes that survived owner edits (from editMetrics.composition). */
  survivingShapeSignatures: string[]
}

export function emptyCompositionMemoryV1(): CompositionMemoryV1 {
  return { version: COMPOSITION_MEMORY_VERSION_V1, sourceCount: 0, usableCount: 0, recentShapeSignatures: [], observedShapeSignatures: [], recentPageArcSignatures: [], recentPageSkeletonSignatures: [], repeatedPageSkeletonSignatures: [], survivingShapeSignatures: [] }
}

function time(value: CompositionMemoryRecordV1["createdAt"]): number {
  const parsed = value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) : NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function survivingFrom(editMetrics: unknown): string[] {
  const composition = isRecord(editMetrics) ? editMetrics.composition : undefined
  const list = isRecord(composition) && composition.version === 1 ? composition.survivingShapeSignatures : undefined
  return Array.isArray(list) ? list.filter((entry): entry is string => typeof entry === "string" && SHAPE_PATTERN.test(entry)) : []
}

/**
 * Owner-isolated (records of other users are dropped even if passed in),
 * bounded, deterministic. Records are ordered newest first by createdAt.
 */
export function deriveCompositionMemoryV1(records: readonly CompositionMemoryRecordV1[], options: { ownerUserId: string }): CompositionMemoryV1 {
  const limits = COMPOSITION_MEMORY_LIMITS_V1
  if (!options.ownerUserId) return emptyCompositionMemoryV1()
  const eligible = records
    .filter((record) => isRecord(record) && record.userId === options.ownerUserId && (limits.statusWeights[record.status] ?? 0) > 0)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))
    .slice(0, limits.maxGenerations)

  const shapeScore = new Map<string, { score: number; firstSeen: number }>()
  const arcs: string[] = []
  const skeletons: string[] = []
  const skeletonGenerations = new Map<string, number>()
  const surviving: string[] = []
  let usable = 0
  eligible.forEach((record, recency) => {
    let pages: PlanCompositionPageV1[] = []
    try {
      pages = planCompositionSignaturesV1(record.initialPlan)
    } catch {
      pages = []
    }
    if (!pages.length) return
    usable += 1
    const weight = limits.statusWeights[record.status]
    for (const shape of new Set(pages.flatMap((page) => page.shapes))) {
      const entry = shapeScore.get(shape) ?? { score: 0, firstSeen: recency }
      entry.score += weight
      shapeScore.set(shape, entry)
    }
    for (const page of pages) {
      if (!arcs.includes(page.arcSignature)) arcs.push(page.arcSignature)
      if (!skeletons.includes(page.skeletonSignature)) skeletons.push(page.skeletonSignature)
    }
    for (const skeleton of new Set(pages.map((page) => page.skeletonSignature))) skeletonGenerations.set(skeleton, (skeletonGenerations.get(skeleton) ?? 0) + 1)
    for (const shape of survivingFrom(record.editMetrics)) if (!surviving.includes(shape)) surviving.push(shape)
  })

  const ranked = [...shapeScore.entries()].sort((a, b) => b[1].score - a[1].score || a[1].firstSeen - b[1].firstSeen || a[0].localeCompare(b[0]))
  return {
    version: COMPOSITION_MEMORY_VERSION_V1,
    sourceCount: eligible.length,
    usableCount: usable,
    recentShapeSignatures: ranked.filter(([, entry]) => entry.score >= limits.avoidThreshold).slice(0, limits.maxAvoidShapes).map(([shape]) => shape),
    observedShapeSignatures: [...shapeScore.entries()].sort((a, b) => a[1].firstSeen - b[1].firstSeen || a[0].localeCompare(b[0])).slice(0, limits.maxObservedShapes).map(([shape]) => shape),
    recentPageArcSignatures: arcs.slice(0, limits.maxArcs),
    recentPageSkeletonSignatures: skeletons.slice(0, limits.maxSkeletons),
    repeatedPageSkeletonSignatures: skeletons.filter((skeleton) => (skeletonGenerations.get(skeleton) ?? 0) >= limits.historySkeletonRepeatMinGenerations),
    survivingShapeSignatures: surviving.slice(0, limits.maxObservedShapes),
  }
}

/** Safe, count-only provenance (no ids, users, timestamps, names or content). */
export function compositionMemoryProvenanceV1(memory: CompositionMemoryV1) {
  return {
    sourceCount: memory.sourceCount,
    usableCount: memory.usableCount,
    recentShapeCount: memory.recentShapeSignatures.length,
    recentArcCount: memory.recentPageArcSignatures.length,
    recentSkeletonCount: memory.recentPageSkeletonSignatures.length,
    repeatedSkeletonCount: memory.repeatedPageSkeletonSignatures.length,
    survivingShapeCount: memory.survivingShapeSignatures.length,
  }
}

// ─── novelty diagnostics (warnings/metrics only: never reject, retry or mutate) ──

export const COMPOSITION_NOVELTY_THRESHOLDS_V1 = {
  /** A graph shape repeated in >= max(3, 40% of graph sections). */
  shapeRepeatMinCount: 3,
  shapeRepeatShare: 0.4,
  /** One page skeleton shared by >= 3 pages. */
  skeletonRepeatMinPages: 3,
  /** One page arc shared by >= 3 pages AND >= 60% of pages. */
  arcRepeatMinPages: 3,
  arcRepeatShare: 0.6,
  /** Supplied motif shapes reproduced verbatim in >= 3 sections AND >= 60% of graph sections. */
  motifReuseMinCount: 3,
  motifReuseShare: 0.6,
} as const

export type SiteCompositionNoveltyV1 = {
  metrics: {
    pages: number
    graphSections: number
    uniqueShapes: number
    maxShapeRepeat: number
    uniqueSkeletons: number
    maxSkeletonRepeat: number
    uniqueArcs: number
    maxArcRepeat: number
    suppliedMotifShapeUses: number
  }
  warnings: string[]
}

function counts(values: readonly string[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const value of values) out.set(value, (out.get(value) ?? 0) + 1)
  return out
}

export function diagnoseSiteCompositionNoveltyV1(plan: unknown, options: { suppliedMotifShapes?: readonly string[] } = {}): SiteCompositionNoveltyV1 {
  const t = COMPOSITION_NOVELTY_THRESHOLDS_V1
  const pages = planCompositionSignaturesV1(plan)
  const shapes = pages.flatMap((page) => page.shapes)
  const shapeCounts = counts(shapes)
  const skeletonCounts = counts(pages.map((page) => page.skeletonSignature))
  const arcCounts = counts(pages.map((page) => page.arcSignature))
  const supplied = new Set(options.suppliedMotifShapes ?? [])
  const motifUses = shapes.filter((shape) => supplied.has(shape)).length
  const warnings: string[] = []
  for (const [shape, count] of shapeCounts) if (count >= Math.max(t.shapeRepeatMinCount, Math.ceil(t.shapeRepeatShare * shapes.length))) warnings.push(`novelty.shape_repeated: ${shape.slice(0, 12)} in ${count}/${shapes.length} graph sections`)
  for (const [skeleton, count] of skeletonCounts) if (count >= t.skeletonRepeatMinPages) warnings.push(`novelty.skeleton_repeated: ${count} pages share skeleton ${skeleton.slice(0, 12)} (${pages.filter((page) => page.skeletonSignature === skeleton).map((page) => page.slug).join(",")})`)
  for (const [arc, count] of arcCounts) if (count >= t.arcRepeatMinPages && count >= t.arcRepeatShare * pages.length) warnings.push(`novelty.arc_repeated: ${count}/${pages.length} pages share arc ${pages.find((page) => page.arcSignature === arc)!.arc.join(">")}`)
  if (motifUses >= t.motifReuseMinCount && motifUses >= t.motifReuseShare * shapes.length) warnings.push(`novelty.motif_shapes_overused: ${motifUses}/${shapes.length} graph sections reproduce a supplied motif verbatim`)
  return {
    metrics: {
      pages: pages.length,
      graphSections: shapes.length,
      uniqueShapes: shapeCounts.size,
      maxShapeRepeat: Math.max(0, ...shapeCounts.values()),
      uniqueSkeletons: skeletonCounts.size,
      maxSkeletonRepeat: Math.max(0, ...skeletonCounts.values()),
      uniqueArcs: arcCounts.size,
      maxArcRepeat: Math.max(0, ...arcCounts.values()),
      suppliedMotifShapeUses: motifUses,
    },
    warnings,
  }
}

export type CrossGenerationNoveltyV1 = {
  currentShapes: number
  reusedShapes: number
  shapeReuseRatio: number
  currentArcs: number
  reusedArcs: number
  arcReuseRatio: number
  currentSkeletons: number
  reusedSkeletons: number
  skeletonReuseRatio: number
  warnings: string[]
}

export const CROSS_GENERATION_THRESHOLDS_V1 = {
  /** Warn when >= half of the current unique skeletons (and at least 2) were used recently. */
  skeletonReuseRatio: 0.5,
  skeletonReuseMinCount: 2,
} as const

/** Interpretable overlap ratios: unique current signatures already seen in the owner's recent history. */
export function diagnoseCrossGenerationNoveltyV1(plan: unknown, memory: CompositionMemoryV1): CrossGenerationNoveltyV1 {
  const pages = planCompositionSignaturesV1(plan)
  const ratio = (current: Set<string>, history: readonly string[]) => {
    const seen = new Set(history)
    const reused = [...current].filter((value) => seen.has(value)).length
    return { total: current.size, reused, ratio: current.size ? Math.round((reused / current.size) * 1000) / 1000 : 0 }
  }
  const shapes = ratio(new Set(pages.flatMap((page) => page.shapes)), memory.observedShapeSignatures)
  const arcs = ratio(new Set(pages.map((page) => page.arcSignature)), memory.recentPageArcSignatures)
  const skeletons = ratio(new Set(pages.map((page) => page.skeletonSignature)), memory.recentPageSkeletonSignatures)
  const warnings: string[] = []
  if (memory.repeatedPageSkeletonSignatures.length) warnings.push(`novelty.history_skeleton_repeated: ${memory.repeatedPageSkeletonSignatures.length} page skeleton(s) recur across >= ${COMPOSITION_MEMORY_LIMITS_V1.historySkeletonRepeatMinGenerations} recent generations`)
  if (skeletons.reused >= CROSS_GENERATION_THRESHOLDS_V1.skeletonReuseMinCount && skeletons.ratio >= CROSS_GENERATION_THRESHOLDS_V1.skeletonReuseRatio) warnings.push(`novelty.reuses_recent_skeletons: ${skeletons.reused}/${skeletons.total} page skeletons were used in recent generations`)
  return {
    currentShapes: shapes.total, reusedShapes: shapes.reused, shapeReuseRatio: shapes.ratio,
    currentArcs: arcs.total, reusedArcs: arcs.reused, arcReuseRatio: arcs.ratio,
    currentSkeletons: skeletons.total, reusedSkeletons: skeletons.reused, skeletonReuseRatio: skeletons.ratio,
    warnings,
  }
}
