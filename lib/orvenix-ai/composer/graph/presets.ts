import type { SectionInstanceMerchandisingComposition, SectionInstanceNarrativeIntent } from "@/lib/orvenix-ai/architect/composition-plan"
import { CREATIVE_COMPOSITION_GRAPH_VERSION_V1, type GraphBeatV1, type GraphRegionV1, type GraphSectionV1 } from "./contract"

/**
 * CF-2: the six V1 merchandising compositions expressed as
 * CreativeCompositionGraphV1 relationships -- proof that the graph SUBSUMES
 * the V1 vocabulary instead of sitting beside it. Each preset is a pure
 * function of grounded refs (product indexes / category keys); nothing
 * here chooses classes.
 *
 *   featured-plus-grid   copy 9 + action 3 / anchor product 8 (w5) + support stack 4 (w2)
 *   product-rail         copy 9 + action 3 / rail 12 led by the anchor
 *   category-spotlight   copy 12 / category group 12 with an anchor category
 *   editorial-collection pinned copy 4 (w4) + grid 8 with an anchor product
 *   alternating-story    copy 12 / group of 9-unit items alternating start/end
 *   dense-catalog        copy 9 + action 3 / dense grid 12 (density 3)
 */

export type GraphPresetInputV1 = {
  productIndexes?: readonly number[]
  categoryKeys?: readonly string[]
  hasCta?: boolean
  narrative?: SectionInstanceNarrativeIntent
  beat?: GraphBeatV1
}

const product = (index: number) => ({ kind: "product" as const, index })
const category = (key: string) => ({ kind: "category" as const, key })

function header(copyWeight: number, hasCta: boolean | undefined, align: "start" | "center" = "start"): GraphRegionV1[] {
  return hasCta
    ? [{ id: "copy", role: "copy", span: 9, weight: copyWeight, align }, { id: "action", role: "cta", span: 3, weight: 2, align: "end" }]
    : [{ id: "copy", role: "copy", span: 12, weight: copyWeight, align }]
}

function section(role: GraphSectionV1["role"], input: GraphPresetInputV1, fields: Pick<GraphSectionV1, "density" | "whitespace" | "edge" | "regions"> & { beat?: GraphBeatV1 }): GraphSectionV1 {
  return {
    version: CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
    role,
    beat: input.beat ?? fields.beat ?? "build",
    density: fields.density,
    whitespace: fields.whitespace,
    edge: fields.edge,
    ...(input.narrative ? { narrative: input.narrative } : {}),
    regions: fields.regions,
  }
}

export function graphPresetForMerchandisingV1(composition: SectionInstanceMerchandisingComposition, input: GraphPresetInputV1): GraphSectionV1 | null {
  const indexes = [...(input.productIndexes ?? [])]
  const keys = [...(input.categoryKeys ?? [])]
  switch (composition) {
    case "featured-plus-grid": {
      if (indexes.length < 2) return null
      const [lead, ...support] = indexes
      const supportRegion: GraphRegionV1 = support.length >= 2
        ? { id: "support", role: "product-group", span: 4, weight: 2, arrangement: "stack", refs: support.map(product) }
        : { id: "support", role: "single-product", span: 4, weight: 2, refs: [product(support[0])] }
      return section("products", input, {
        beat: "peak",
        density: 1,
        whitespace: 2,
        edge: "contained",
        regions: [...header(4, input.hasCta), { id: "anchor", role: "single-product", span: 8, weight: 5, refs: [product(lead)], anchor: product(lead) } satisfies GraphRegionV1, supportRegion].slice(0, 4),
      })
    }
    case "product-rail": {
      if (indexes.length < 2) return null
      return section("products", input, {
        density: 1,
        whitespace: 1,
        edge: "contained",
        regions: [...header(3, input.hasCta), { id: "rail", role: "product-group", span: 12, weight: 3, arrangement: "rail", refs: indexes.slice(0, 12).map(product), anchor: product(indexes[0]) }],
      })
    }
    case "category-spotlight": {
      if (keys.length < 1) return null
      return section("content", input, {
        density: 1,
        whitespace: 2,
        edge: "contained",
        regions: [
          { id: "copy", role: "copy", span: 12, weight: 4, align: "start" },
          { id: "categories", role: "category-group", span: 12, weight: 3, arrangement: "grid", refs: keys.map(category), anchor: category(keys[0]) },
        ],
      })
    }
    case "editorial-collection": {
      if (indexes.length < 1) return null
      const group: GraphRegionV1 = indexes.length >= 2
        ? { id: "collection", role: "product-group", span: 8, weight: 3, density: 1, arrangement: "grid", refs: indexes.map(product), anchor: product(indexes[0]) }
        : { id: "collection", role: "single-product", span: 8, weight: 3, refs: [product(indexes[0])], anchor: product(indexes[0]) }
      return section("products", input, {
        density: 1,
        whitespace: 2,
        edge: "contained",
        regions: [{ id: "copy", role: "copy", span: 4, weight: 4, align: "start", pinned: true, ...(input.hasCta ? { withCta: true } : {}) }, group],
      })
    }
    case "alternating-story": {
      if (indexes.length < 2) return null
      const items = indexes.slice(0, 8).map((index, position): GraphRegionV1 => ({ id: `story-${position + 1}`, role: "single-product", span: 9, weight: 3, align: position % 2 === 0 ? "start" : "end", refs: [product(index)] }))
      return section("products", input, {
        density: 1,
        whitespace: 2,
        edge: "contained",
        regions: [...header(3, input.hasCta), { id: "stories", role: "product-group", span: 12, weight: 3, regions: items } satisfies GraphRegionV1].slice(0, 4),
      })
    }
    case "dense-catalog": {
      if (indexes.length < 2) return null
      return section("products", input, {
        density: 3,
        whitespace: 0,
        edge: "contained",
        regions: [...header(2, input.hasCta), { id: "catalog", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: indexes.slice(0, 24).map(product) }],
      })
    }
  }
}
