import {
  diagnoseCrossGenerationNoveltyV1,
  diagnoseSiteCompositionNoveltyV1,
  planCompositionSignaturesV1,
  type CompositionMemoryV1,
  type CrossGenerationNoveltyV1,
  type SiteCompositionNoveltyV1,
} from "@/lib/orvenix-ai/design-memory/composition-memory"
import { diagnoseMotifReproductionV2, motifShapeSignatureV2, type ProviderDesignMotifV2 } from "@/lib/orvenix-ai/design-reference/motifs"

/**
 * CF-4D: the ONE provider-result analysis used by offline proofs, the dev
 * review and the (not yet run) controlled real call. Pure, read-only,
 * diagnostic: it never rejects, retries or mutates a site. Deliberately no
 * single "creativity score" -- human visual review stays decisive.
 *
 * Graph uptake definition (same for call #3 and later calls):
 * - providerAuthoredGraphs: provider sections carrying a `composition`
 *   object (Orvenix V1 presets are NEVER counted);
 * - graphEligibleSections: provider sections whose role can carry a graph
 *   (products | content);
 * - effectiveGraphs: compiled section roots rendered from a provider graph;
 * - fallbacks: compiled roots where a provider graph fell back to V1
 *   (with reasons); droppedGraphSections: provider graph sections the
 *   adapter could not compile at all (reported by warning);
 *   ignoredByValidator: provider graphs the blueprint validator ignored
 *   (wrong role, oversized, over the page/site graph budget).
 * Accounting identity: providerAuthoredGraphs = effectiveGraphs + fallbacks
 * + droppedGraphSections + ignoredByValidator (tested). Pass adapter AND
 * lifecycle (validator) warnings.
 */

type Json = Record<string, unknown>
const isRecord = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value)

export type ProviderGraphUptakeV1 = {
  providerPages: number
  providerSections: number
  graphEligibleSections: number
  providerAuthoredGraphs: number
  effectiveGraphs: number
  fallbacks: number
  fallbackReasons: Record<string, number>
  droppedGraphSections: number
  ignoredByValidator: number
}

export type CreativeCopyUptakeV1 = { authoredSlots: number; appliedSlots: number; noCompatibleSlot: number; rejectedSlots: number }

export type GroundingEvidenceV1 = { unknownProductRefs: number; unknownCategoryRefs: number; unknownMediaRefs: number }

export type FullSiteCreativeEvidenceV1 = {
  compiledPages: number
  compiledSectionRoots: number
  uptake: ProviderGraphUptakeV1
  copy: CreativeCopyUptakeV1
  grounding: GroundingEvidenceV1
  novelty: SiteCompositionNoveltyV1
  arcDistribution: Record<string, number>
  motifReproductionWarnings: string[]
  crossGeneration?: CrossGenerationNoveltyV1
  call?: { requestChars?: number; systemPromptChars?: number; latencyMs?: number; inputTokens?: number; outputTokens?: number; stopReason?: string }
}

function providerSections(output: unknown): Json[] {
  const pages = isRecord(output) && Array.isArray(output.pages) ? output.pages : []
  return pages.flatMap((page) => (isRecord(page) && Array.isArray(page.sections) ? page.sections.filter(isRecord) : []))
}

function compiledRoots(plan: unknown): Json[] {
  const pages = isRecord(plan) && Array.isArray(plan.pages) ? plan.pages : []
  return pages.flatMap((page) => {
    const tree = isRecord(page) && isRecord(page.tree) ? page.tree : undefined
    const nodes = tree && isRecord(tree.nodes) ? tree.nodes : undefined
    const root = nodes && typeof tree!.rootId === "string" && isRecord(nodes[tree!.rootId]) ? (nodes[tree!.rootId] as Json) : undefined
    return root && Array.isArray(root.children) ? root.children.map((id) => nodes![String(id)]).filter(isRecord).map((node) => (isRecord(node.props) ? node.props : {})) : []
  })
}

export function measureProviderGraphUptakeV1(providerOutput: unknown, plan: unknown, warnings: readonly string[] = []): ProviderGraphUptakeV1 {
  const sections = providerSections(providerOutput)
  const roots = compiledRoots(plan)
  const fallbackReasons: Record<string, number> = {}
  for (const props of roots) {
    const fallback = props.compositionGraphFallback
    if (isRecord(fallback)) fallbackReasons[String(fallback.reason)] = (fallbackReasons[String(fallback.reason)] ?? 0) + 1
  }
  return {
    providerPages: isRecord(providerOutput) && Array.isArray(providerOutput.pages) ? providerOutput.pages.length : 0,
    providerSections: sections.length,
    graphEligibleSections: sections.filter((section) => section.role === "products" || section.role === "content").length,
    providerAuthoredGraphs: sections.filter((section) => isRecord(section.composition)).length,
    effectiveGraphs: roots.filter((props) => isRecord(props.compositionGraph)).length,
    fallbacks: roots.filter((props) => isRecord(props.compositionGraphFallback)).length,
    fallbackReasons,
    droppedGraphSections: warnings.filter((warning) => warning.includes("graph_section_dropped_no_content")).length,
    ignoredByValidator: warnings.filter((warning) => /\.composition ignorada/.test(warning)).length,
  }
}

export function measureCreativeCopyUptakeV1(providerOutput: unknown, plan: unknown): CreativeCopyUptakeV1 {
  const authored = providerSections(providerOutput).reduce((sum, section) => sum + (isRecord(section.copy) ? Object.keys(section.copy).length : 0), 0)
  let applied = 0
  let noSlot = 0
  let rejected = 0
  for (const props of compiledRoots(plan)) {
    const provenance = props.creativeCopyProvenance
    if (isRecord(provenance)) {
      applied += Array.isArray(provenance.applied) ? provenance.applied.length : 0
      noSlot += Array.isArray(provenance.noCompatibleSlot) ? provenance.noCompatibleSlot.length : 0
    }
    if (Array.isArray(props.creativeCopyFallback)) rejected += props.creativeCopyFallback.length
  }
  return { authoredSlots: authored, appliedSlots: applied, noCompatibleSlot: noSlot, rejectedSlots: rejected }
}

export function measureGroundingEvidenceV1(providerOutput: unknown, catalog: { productCount: number; categoryKeys: readonly string[]; mediaProductIndexes?: readonly number[] }): GroundingEvidenceV1 {
  const refs: Json[] = []
  const walk = (regions: unknown) => (Array.isArray(regions) ? regions : []).filter(isRecord).forEach((region) => {
    if (Array.isArray(region.refs)) refs.push(...region.refs.filter(isRecord))
    if (isRecord(region.anchor)) refs.push(region.anchor)
    walk(region.regions)
  })
  const pages = isRecord(providerOutput) && Array.isArray(providerOutput.pages) ? providerOutput.pages.filter(isRecord) : []
  for (const page of pages) {
    if (isRecord(page.target)) refs.push(page.target)
    for (const section of Array.isArray(page.sections) ? page.sections.filter(isRecord) : []) {
      if (Array.isArray(section.refs)) refs.push(...section.refs.filter(isRecord))
      if (isRecord(section.composition)) walk(section.composition.regions)
    }
  }
  const validIndex = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < catalog.productCount
  const media = new Set(catalog.mediaProductIndexes ?? [])
  return {
    unknownProductRefs: refs.filter((ref) => ref.kind === "product" && !validIndex(ref.index)).length,
    unknownCategoryRefs: refs.filter((ref) => ref.kind === "category" && !catalog.categoryKeys.includes(String(ref.key))).length,
    unknownMediaRefs: refs.filter((ref) => ref.kind === "product-media" && !media.has(ref.index as number)).length,
  }
}

export function analyzeFullSiteCreativeResultV1(params: {
  providerOutput: unknown
  plan: unknown
  warnings?: readonly string[]
  catalog: { productCount: number; categoryKeys: readonly string[]; mediaProductIndexes?: readonly number[] }
  suppliedMotifs?: readonly ProviderDesignMotifV2[]
  memory?: CompositionMemoryV1
  call?: FullSiteCreativeEvidenceV1["call"]
}): FullSiteCreativeEvidenceV1 {
  const motifs = (params.suppliedMotifs ?? []).map((motif) => ({ ...motif, sectionRole: motif.role }))
  const pages = planCompositionSignaturesV1(params.plan)
  const arcDistribution: Record<string, number> = {}
  for (const page of pages) arcDistribution[page.arc.join(">")] = (arcDistribution[page.arc.join(">")] ?? 0) + 1
  const providerPages = isRecord(params.providerOutput) && Array.isArray(params.providerOutput.pages) ? params.providerOutput.pages.filter(isRecord) : []
  return {
    compiledPages: isRecord(params.plan) && Array.isArray(params.plan.pages) ? params.plan.pages.length : 0,
    compiledSectionRoots: compiledRoots(params.plan).length,
    uptake: measureProviderGraphUptakeV1(params.providerOutput, params.plan, params.warnings),
    copy: measureCreativeCopyUptakeV1(params.providerOutput, params.plan),
    grounding: measureGroundingEvidenceV1(params.providerOutput, params.catalog),
    novelty: diagnoseSiteCompositionNoveltyV1(params.plan, { suppliedMotifShapes: motifs.map(motifShapeSignatureV2) }),
    arcDistribution,
    motifReproductionWarnings: motifs.length
      ? diagnoseMotifReproductionV2(providerPages.map((page, index) => ({ path: `pages[${index}]`, graphs: (Array.isArray(page.sections) ? page.sections.filter(isRecord) : []).flatMap((section) => (isRecord(section.composition) ? [section.composition] : [])) })), motifs)
      : [],
    ...(params.memory ? { crossGeneration: diagnoseCrossGenerationNoveltyV1(params.plan, params.memory) } : {}),
    ...(params.call ? { call: params.call } : {}),
  }
}

/** Side-by-side comparison rows (e.g. call #3 vs a later call). No aggregate score. */
export function compareFullSiteCreativeEvidenceV1(a: FullSiteCreativeEvidenceV1, b: FullSiteCreativeEvidenceV1): Array<{ metric: string; a: number | string; b: number | string }> {
  const row = (metric: string, pick: (evidence: FullSiteCreativeEvidenceV1) => number | string | undefined) => ({ metric, a: pick(a) ?? "n/a", b: pick(b) ?? "n/a" })
  return [
    row("pages", (e) => e.uptake.providerPages),
    row("provider sections", (e) => e.uptake.providerSections),
    row("graph-eligible sections", (e) => e.uptake.graphEligibleSections),
    row("provider-authored graphs", (e) => e.uptake.providerAuthoredGraphs),
    row("effective graphs", (e) => e.uptake.effectiveGraphs),
    row("graph fallbacks", (e) => e.uptake.fallbacks),
    row("dropped graph sections", (e) => e.uptake.droppedGraphSections),
    row("unique graph shapes", (e) => e.novelty.metrics.uniqueShapes),
    row("unique page skeletons", (e) => e.novelty.metrics.uniqueSkeletons),
    row("unique page arcs", (e) => e.novelty.metrics.uniqueArcs),
    row("within-site novelty warnings", (e) => e.novelty.warnings.length),
    row("motif reproduction warnings", (e) => e.motifReproductionWarnings.length),
    row("copy slots authored", (e) => e.copy.authoredSlots),
    row("copy slots applied", (e) => e.copy.appliedSlots),
    row("copy slots rejected", (e) => e.copy.rejectedSlots),
    row("unknown product refs", (e) => e.grounding.unknownProductRefs),
    row("unknown category refs", (e) => e.grounding.unknownCategoryRefs),
    row("unknown media refs", (e) => e.grounding.unknownMediaRefs),
    row("request chars", (e) => e.call?.requestChars),
    row("system prompt chars", (e) => e.call?.systemPromptChars),
    row("latency ms", (e) => e.call?.latencyMs),
    row("input tokens", (e) => e.call?.inputTokens),
    row("output tokens", (e) => e.call?.outputTokens),
  ]
}
