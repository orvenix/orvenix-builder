import type { CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import type { EditorNode, EditorTree } from "@/types/editor"
import type { GraphRegionV1, GraphSectionV1 } from "./contract"
import { GRAPH_LIMITS_V1 } from "./contract"
import { GRAPH_HEADING_SIZE_BY_WEIGHT_V1, GRAPH_ROW_CLASS_V1, graphPaddingYV1, graphSectionScaleV1, resolveGraphCardTreatmentV1 } from "./compiler"
import { graphFingerprintV1 } from "./fingerprint"
import { packGraphRowsV1 } from "./validator"

/**
 * CF-3A (TEST / DEV ONLY -- never called by the generation pipeline, never
 * logs): proves a provider-authored graph survived every Orvenix layer by
 * reading the FINAL EditorTree back:
 *
 *   PROVIDER GRAPH -> VALIDATED (fingerprint unchanged = no silent repair)
 *   -> GROUNDED -> COMPILED SECTION -> EDITORTREE
 *
 * Each attribute is checked against the compiler's own deterministic
 * mappings, so "survived" means "rendered as authored", not "copied".
 */

export type GraphIntentSurvivalV1 = {
  fingerprint: boolean
  beat: boolean
  continuity: boolean | "n/a"
  density: boolean
  whitespace: boolean
  spans: Array<{ region: string; span: number; survived: boolean }>
  weights: Array<{ region: string; weight: number; survived: boolean }>
  anchor: { region: string; survived: boolean } | "n/a"
}

function subtree(tree: EditorTree, id: string): EditorNode[] {
  const node = tree.nodes[id]
  return node ? [node, ...node.children.flatMap((child) => subtree(tree, child))] : []
}

function effectiveSpans(regions: readonly GraphRegionV1[], parent: number, out = new Map<string, number>()): Map<string, number> {
  for (const row of packGraphRowsV1(regions)) {
    for (const region of row) {
      const effective = (parent * region.span) / GRAPH_LIMITS_V1.gridUnits
      out.set(region.id, effective)
      if (region.regions) effectiveSpans(region.regions, effective, out)
    }
  }
  return out
}

export function traceGraphIntentSurvivalV1(params: {
  providerGraph: GraphSectionV1
  tree: EditorTree
  sectionRootId: string
  nextSectionRootId?: string
  products: readonly CommerceProductFactV1[]
}): GraphIntentSurvivalV1 {
  const { providerGraph: graph, tree, products } = params
  const root = tree.nodes[params.sectionRootId]
  const meta = root?.props.compositionGraph as { fingerprint?: string; providerFingerprint?: string; beat?: string } | undefined
  const nodes = subtree(tree, params.sectionRootId)
  // The persisted EditorTree carries no editor-only names, so regions are
  // matched STRUCTURALLY: the compiler emits one "min-w-0 ..." cell per
  // region, in packed-row pre-order (packing preserves authored order). A
  // count mismatch (eg. a dropped region) maps nothing, so nothing survives.
  const flat: GraphRegionV1[] = []
  const walk = (regions: readonly GraphRegionV1[]) => packGraphRowsV1(regions).flat().forEach((region) => {
    flat.push(region)
    if (region.regions) walk(region.regions)
  })
  walk(graph.regions)
  const cells = nodes.filter((node) => /^min-w-0 /.test(String(node.props.className ?? "")) && /\blg:col-span-\d+\b/.test(String(node.props.className)))
  const cellByRegion = new Map(cells.length === flat.length ? flat.map((region, index) => [region.id, cells[index]] as const) : [])
  const regionNode = (id: string) => cellByRegion.get(id)
  const regionSubtree = (id: string) => {
    const node = regionNode(id)
    return node ? subtree(tree, node.id) : []
  }
  const effective = effectiveSpans(graph.regions, GRAPH_LIMITS_V1.gridUnits)

  const weights = flat.flatMap((region) => {
    if (region.role === "copy") {
      const heading = regionSubtree(region.id).find((node) => node.type === "heading")
      return [{ region: region.id, weight: region.weight, survived: heading?.props.size === GRAPH_HEADING_SIZE_BY_WEIGHT_V1[region.weight] }]
    }
    if (region.role === "single-product") {
      const ref = region.refs?.[0]
      const card = regionSubtree(region.id).find((node) => node.type === "store-product-card")
      if (!ref || ref.kind !== "product" || !card) return [{ region: region.id, weight: region.weight, survived: false }]
      const expected = resolveGraphCardTreatmentV1({
        role: region.anchor ? "anchor" : "support",
        weight: region.weight,
        density: region.density ?? graph.density,
        effectiveSpan: effective.get(region.id) ?? 0,
        arrangement: "single",
        hasMedia: Boolean(products[ref.index]?.imageUrls?.length),
      })
      return [{ region: region.id, weight: region.weight, survived: card.props.treatment === expected }]
    }
    return []
  })

  const anchorRegion = flat.find((region) => region.anchor)
  const anchorProduct = anchorRegion?.anchor?.kind === "product" ? products[anchorRegion.anchor.index] : undefined
  const anchorCategory = anchorRegion?.anchor?.kind === "category" ? anchorRegion.anchor.key : undefined
  const anchorSurvived = anchorRegion
    ? anchorProduct
      ? regionSubtree(anchorRegion.id).some((node) => node.type === "store-product-card" && node.props.productName === anchorProduct.name && (node.props.treatment === "featured" || node.props.treatment === "image-led" || node.props.treatment === "editorial" || node.props.treatment === "horizontal"))
      : Boolean(anchorCategory && regionSubtree(anchorRegion.id).some((node) => node.props.dataCommerceCategoryCard && String(node.props.className ?? "").includes("lg:row-span-2")))
    : false

  const next = params.nextSectionRootId ? (tree.nodes[params.nextSectionRootId]?.props.compositionGraph as { continuityFromPrevious?: string } | undefined) : undefined

  return {
    // Authored graph == built graph, or (CF-3D) the authored graph is recorded as the provider intent of a normalized build.
    fingerprint: meta?.fingerprint === graphFingerprintV1(graph) || (meta?.providerFingerprint !== undefined && meta.providerFingerprint === graphFingerprintV1(graph)),
    beat: meta?.beat === graph.beat,
    // Continuity only has an effect when the next section is also a graph section (contract + prompt).
    continuity: graph.continuityToNext && next ? next.continuityFromPrevious === graph.continuityToNext : "n/a",
    density: root?.props.commerceSectionScale === graphSectionScaleV1(graph.beat, graph.density) && root?.props.paddingY === graphPaddingYV1(graph.beat, graph.whitespace, graph.density),
    whitespace: nodes.some((node) => String(node.props.className ?? "").startsWith(GRAPH_ROW_CLASS_V1[graph.whitespace])),
    spans: flat.map((region) => ({ region: region.id, span: region.span, survived: String(regionNode(region.id)?.props.className ?? "").split(/\s+/).includes(`lg:col-span-${region.span}`) })),
    weights,
    anchor: anchorRegion ? { region: anchorRegion.id, survived: anchorSurvived } : "n/a",
  }
}
