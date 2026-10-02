import { commerceCategoryKeyV1, isExecutableCommerceProductV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import { resolveCommerceSurfaceV1, type CommerceSurfaceRelationV1, type CommerceSurfaceV1 } from "@/lib/orvenix-ai/commerce/commerce-surface"
import type { SectionInstanceProductCardTreatment } from "@/lib/orvenix-ai/architect/composition-plan"
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media"
import { COMPOSER_GRAPH_KIT_V1 as kit } from "../section-composer"
import { createComposedNode } from "../node-factory"
import type { ComposedNode, ComposedSection, SectionCompositionContext } from "../types"
import {
  GRAPH_LIMITS_V1,
  type GraphArrangementV1,
  type GraphBeatV1,
  type GraphContinuityV1,
  type GraphGroundingV1,
  type GraphRegionV1,
  type GraphSectionV1,
} from "./contract"
import { packGraphRowsV1 } from "./validator"
import { graphShapeSignatureV1 } from "./shape"

/**
 * CF-2: CreativeCompositionGraphV1 -> existing EditorTree node types
 * (section, genericWrapper, heading, text, image, ctaButton,
 * store-product-card, category cards). No second renderer.
 *
 * STRUCTURAL PRIMITIVES (the whole vocabulary): graph row (12-unit grid),
 * region cell, copy stack, product group (grid | stack | rail), category
 * group, media frame, action. Every class below comes from a BOUNDED
 * literal map keyed by validated integers/enums -- the graph never
 * supplies a class, a CSS value or a variable. Because the literals live in
 * lib/orvenix-ai/composer (a Tailwind @source), CF-1 renderer truth holds.
 *
 * RESPONSIVE COLLAPSE (Orvenix-owned): below lg every row is one column in
 * DOM order (= reading order; nothing is visually reordered); groups
 * collapse to 1-2 columns; rails keep their own overflow container; bleed
 * is just full width (the render scope clips horizontal overflow).
 */

// ─── Bounded literal maps ──────────────────────────────────────────────────────

const SPAN_CLASS: Record<number, string> = {
  3: "lg:col-span-3", 4: "lg:col-span-4", 5: "lg:col-span-5", 6: "lg:col-span-6", 7: "lg:col-span-7",
  8: "lg:col-span-8", 9: "lg:col-span-9", 10: "lg:col-span-10", 11: "lg:col-span-11", 12: "lg:col-span-12",
}
const COL_START_CLASS: Record<number, string> = {
  1: "lg:col-start-1", 2: "lg:col-start-2", 3: "lg:col-start-3", 4: "lg:col-start-4", 5: "lg:col-start-5",
  6: "lg:col-start-6", 7: "lg:col-start-7", 8: "lg:col-start-8", 9: "lg:col-start-9", 10: "lg:col-start-10",
}
export const GRAPH_ROW_CLASS_V1: Record<number, string> = {
  0: "grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-5",
  1: "grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8",
  2: "grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12",
  3: "grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16",
}
const ROWS_STACK_CLASS: Record<number, string> = {
  0: "flex flex-col gap-6",
  1: "flex flex-col gap-10",
  2: "flex flex-col gap-14",
  3: "flex flex-col gap-20",
}
const REGION_PAD_CLASS: Record<number, string> = { 0: "", 1: "lg:px-2", 2: "lg:px-6", 3: "lg:px-10" }
const GROUP_GRID_CLASS: Record<number, string> = {
  1: "grid gap-5",
  2: "grid gap-5 sm:grid-cols-2",
  3: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
}
/** Minimum units one card needs at each density. */
const CARD_UNITS_BY_DENSITY: Record<number, number> = { 0: 6, 1: 4, 2: 3, 3: 2.4 }
const RAIL_CLASS = "flex snap-x gap-5 overflow-x-auto pb-6 pr-[12vw] [scrollbar-width:thin] md:pr-10"
const RAIL_LEAD_CLASS = "min-w-[min(20rem,85vw)] snap-start sm:min-w-[24rem] lg:min-w-[28rem]"
const RAIL_ITEM_CLASS = "min-w-[min(16.5rem,72vw)] snap-start sm:min-w-[18rem]"
const GRID_ANCHOR_CLASS = "sm:col-span-2 lg:col-span-1 lg:row-span-2"
export const GRAPH_HEADING_SIZE_BY_WEIGHT_V1: Record<number, string> = { 1: "2xl", 2: "3xl", 3: "4xl", 4: "5xl", 5: "6xl" }
const TEXT_ALIGN = { start: "left", center: "center", end: "right" } as const
const COPY_STACK_CLASS = { start: "flex flex-col items-start gap-4", center: "flex flex-col items-center gap-4 text-center", end: "flex flex-col items-end gap-4 text-right" } as const
const ACTION_CLASS = { start: "flex h-full items-end justify-start", center: "flex h-full items-end justify-center", end: "flex h-full items-end justify-end" } as const
const MEDIA_FRAME_CLASS: Record<"standard" | "focal", string> = {
  standard: "relative aspect-[4/3] overflow-hidden rounded-[1.5rem]",
  focal: "relative aspect-[4/3] overflow-hidden rounded-[1.9rem] lg:aspect-[16/10]",
}
const PADDING_Y_BY_WHITESPACE: Record<number, "md" | "lg" | "xl"> = { 0: "md", 1: "lg", 2: "xl", 3: "xl" }

// ─── Grounding / relations ─────────────────────────────────────────────────────

function isRenderableProduct(product: CommerceProductFactV1): boolean {
  if (isExecutableCommerceProductV1(product)) return true
  const pending = product.pendingProvisioning
  return Boolean(pending && product.variants?.[pending.variantIndex])
}

function safeProductImage(product: CommerceProductFactV1 | undefined): string | null {
  return product?.imageUrls?.find(isSafeProductMediaUrlV1)?.trim() ?? null
}

/** What a graph for this section may reference -- all Orvenix-authoritative. */
export function buildGraphGroundingV1(context: SectionCompositionContext): GraphGroundingV1 {
  const products = context.products ?? []
  return {
    productCount: products.length,
    renderableProductIndexes: new Set(products.map((product, index) => (isRenderableProduct(product) ? index : -1)).filter((index) => index >= 0)),
    mediaProductIndexes: new Set(products.map((product, index) => (safeProductImage(product) ? index : -1)).filter((index) => index >= 0)),
    categoryKeys: new Set((context.commerceCategoryLinks ?? []).map((link) => commerceCategoryKeyV1(link.label)).filter(Boolean)),
    hasCtaAction: Boolean(context.commerceCtaAction && !context.instanceOmitCta),
  }
}

export function surfaceRelationForContinuityV1(previous: GraphContinuityV1 | undefined, role: GraphSectionV1["role"]): CommerceSurfaceRelationV1 {
  if (previous === "contrast") return "contrast"
  if (previous === "bridge") return "soft"
  if (previous === "continue") return "continuous"
  return role === "content" ? "soft" : "continuous"
}

/**
 * Anchor/support hierarchy: the card treatment follows the product's ROLE in
 * the composition and its region's relations (weight, density, effective
 * width, arrangement) -- reusing the existing PCE-3 treatments only.
 */
export function resolveGraphCardTreatmentV1(input: {
  role: "anchor" | "support"
  weight: number
  density: number
  effectiveSpan: number
  arrangement: GraphArrangementV1 | "single"
  hasMedia: boolean
}): SectionInstanceProductCardTreatment {
  if (input.arrangement === "rail") return "horizontal"
  if (input.role === "anchor") {
    if (input.weight >= 5) return "featured"
    if (input.weight === 4) return input.hasMedia ? "image-led" : "featured"
    return "editorial"
  }
  if (input.density >= 2) return "compact-catalog"
  if (input.arrangement === "single" && input.effectiveSpan >= 8 && input.weight <= 3) return "horizontal"
  if (input.weight >= 3 && input.density <= 1) return "editorial"
  return "compact-catalog"
}

// ─── Compiler ──────────────────────────────────────────────────────────────────

export type CompileGraphSectionInputV1 = {
  graph: GraphSectionV1
  fingerprint: string
  /** CF-3D: present only when Orvenix normalized the authored graph (see composeSectionFromGraphV1). */
  providerFingerprint?: string
  normalizations?: readonly string[]
  /** Base (unsliced) context: refs index the real product facts. */
  context: SectionCompositionContext
  previousContinuity?: GraphContinuityV1
  /** Orvenix-resolved detail targets by source product index. */
  detailHrefByProductIndex?: ReadonlyMap<number, string>
  /** V1 preset this graph represents (reported as the section's composition). */
  preset?: string
}

export function compileGraphSectionV1(input: CompileGraphSectionInputV1): ComposedSection {
  const { graph, context } = input
  const products = context.products ?? []
  const nodes: Record<string, ComposedNode> = {}
  const relation = surfaceRelationForContinuityV1(input.previousContinuity, graph.role)
  const surface: CommerceSurfaceV1 | undefined = context.themePalette ? resolveCommerceSurfaceV1(context.themePalette, { relation }) : undefined
  const background = surface?.background ?? (relation === "contrast" ? "#020617" : graph.role === "content" ? "#ffffff" : kit.storeProductsBackground)
  const textColors = kit.readableTextColorsFor(background)
  const sectionProducts = collectProductRefs(graph.regions).map((index) => products[index]).filter((product): product is CommerceProductFactV1 => Boolean(product))
  const anchorRef = findAnchor(graph.regions)
  let cardOrdinal = 0

  const card = (index: number, treatment: SectionInstanceProductCardTreatment, className?: string) => {
    const product = products[index]
    if (!product) return null
    cardOrdinal += 1
    return kit.storeCardNode(nodes, product, context, surface, cardOrdinal - 1, treatment, input.detailHrefByProductIndex?.get(index), className)
  }

  const action = (weight: number, align: keyof typeof ACTION_CLASS) => {
    const cta = context.commerceCtaAction
    if (!cta || context.instanceOmitCta) return null
    const button = kit.add(nodes, createComposedNode({ type: "ctaButton", displayName: "Accion (graph)", props: { label: cta.label, href: cta.href, variant: weight >= 4 ? "primary" : "secondary", size: weight >= 4 ? "lg" : "md" } }))
    return kit.wrapperNode(nodes, "Accion region", ACTION_CLASS[align], [button])
  }

  const copy = (region: GraphRegionV1) => {
    const align = region.align ?? "start"
    const children: string[] = []
    if (graph.role === "content") {
      const minimal = graph.narrative === "minimal-introduction"
      children.push(kit.headingNode(nodes, "Titulo (graph)", minimal ? "Categorías" : "Explora por categoría", 2, { align: TEXT_ALIGN[align], color: textColors.heading, size: GRAPH_HEADING_SIZE_BY_WEIGHT_V1[region.weight] }))
      if (!minimal && region.weight >= 2) children.push(kit.textNode(nodes, "Intro (graph)", "Elige una categoría para ver sus productos.", { align: TEXT_ALIGN[align], size: "lg", color: textColors.body }))
    } else {
      // CF-3A: claim-guarded provider copy wins slot by slot; otherwise Orvenix's grounded canned copy.
      const creative = context.instanceCreativeCopy
      const canned = kit.commerceProductsCopy(graph.narrative ?? "product-led", sectionProducts, { title: "Productos destacados" })
      const text = { title: creative?.headline ?? canned.title, intro: creative?.intro ?? canned.intro }
      const eyebrowText = creative?.eyebrow ?? (anchorRef?.kind === "product" && region.weight >= 3 ? "Producto destacado" : undefined)
      if (eyebrowText) {
        children.push(kit.textNode(nodes, "Etiqueta (graph)", eyebrowText, { align: TEXT_ALIGN[align], size: "xs", color: surface?.accent ?? textColors.body, weight: "black", className: "uppercase tracking-[0.26em]" }))
      }
      children.push(kit.headingNode(nodes, "Titulo (graph)", text.title, 2, { align: TEXT_ALIGN[align], color: textColors.heading, size: GRAPH_HEADING_SIZE_BY_WEIGHT_V1[region.weight] }))
      if (text.intro && region.weight >= 2) children.push(kit.textNode(nodes, "Intro (graph)", text.intro, { align: TEXT_ALIGN[align], size: "lg", color: textColors.body }))
    }
    if (region.withCta) {
      const cta = action(region.weight, align)
      if (cta) children.push(cta)
    }
    return kit.wrapperNode(nodes, "Copy region", COPY_STACK_CLASS[align], children)
  }

  const productGroup = (region: GraphRegionV1, effectiveSpan: number): string => {
    const arrangement = region.arrangement ?? "grid"
    const density = region.density ?? graph.density
    const refs = (region.refs ?? []).filter((ref) => ref.kind === "product").map((ref) => (ref as { index: number }).index)
    const anchorIndex = region.anchor?.kind === "product" ? region.anchor.index : undefined
    if (arrangement === "rail") {
      const items = refs.map((index, position) => card(index, "horizontal", index === anchorIndex || (anchorIndex === undefined && position === 0) ? RAIL_LEAD_CLASS : RAIL_ITEM_CLASS))
      return kit.wrapperNode(nodes, "Rail (graph)", RAIL_CLASS, items.filter((id): id is string => Boolean(id)))
    }
    if (arrangement === "stack") {
      const items = refs.map((index) => card(index, resolveGraphCardTreatmentV1({ role: index === anchorIndex ? "anchor" : "support", weight: region.weight, density, effectiveSpan, arrangement, hasMedia: Boolean(safeProductImage(products[index])) })))
      return kit.wrapperNode(nodes, "Stack (graph)", density >= 2 ? "grid gap-3" : "grid gap-5", items.filter((id): id is string => Boolean(id)))
    }
    const cols = Math.max(1, Math.min(5, refs.length, Math.floor(effectiveSpan / CARD_UNITS_BY_DENSITY[density])))
    const withAnchor = anchorIndex !== undefined && cols >= 2
    const items = refs.map((index) => {
      const isAnchor = index === anchorIndex
      const id = card(index, resolveGraphCardTreatmentV1({ role: isAnchor ? "anchor" : "support", weight: isAnchor ? region.weight + 1 : region.weight, density, effectiveSpan, arrangement, hasMedia: Boolean(safeProductImage(products[index])) }))
      return id && isAnchor && withAnchor ? kit.wrapperNode(nodes, "Ancla (graph)", GRID_ANCHOR_CLASS, [id]) : id
    })
    return kit.wrapperNode(nodes, "Grid (graph)", withAnchor ? `${GROUP_GRID_CLASS[cols]} lg:auto-rows-fr` : GROUP_GRID_CLASS[cols], items.filter((id): id is string => Boolean(id)))
  }

  const categoryGroup = (region: GraphRegionV1, effectiveSpan: number): string => {
    const links = context.commerceCategoryLinks ?? []
    const card = surface?.card ?? "#ffffff"
    const border = surface?.border ?? "#dbeafe"
    const cards = (region.refs ?? []).map((ref, index) => {
      if (ref.kind !== "category") return null
      const link = links.find((entry) => commerceCategoryKeyV1(entry.label) === ref.key)
      if (!link) return null
      const anchor = region.anchor?.kind === "category" && region.anchor.key === ref.key
      return kit.categoryCardNodeV1(nodes, context, link, index, anchor, { storeSurface: surface, card, border, textColors })
    }).filter((id): id is string => Boolean(id))
    const gridClass = effectiveSpan >= 9 ? "grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr" : effectiveSpan >= 6 ? "grid gap-5 sm:grid-cols-2" : "grid gap-4"
    return kit.wrapperNode(nodes, "Categorias (graph)", gridClass, cards)
  }

  const media = (region: GraphRegionV1) => {
    const ref = region.refs?.[0]
    const product = ref?.kind === "product-media" ? products[ref.index] : undefined
    const src = safeProductImage(product)
    const image = kit.add(nodes, createComposedNode({ type: "image", displayName: "Media (graph)", props: { src, alt: product?.name ?? "", className: "h-full w-full object-cover" } }))
    return kit.wrapperNode(nodes, "Media region", MEDIA_FRAME_CLASS[region.weight >= 4 ? "focal" : "standard"], [image])
  }

  const regionContent = (region: GraphRegionV1, effectiveSpan: number): string | null => {
    switch (region.role) {
      case "copy":
        return copy(region)
      case "cta":
        return action(region.weight, region.align ?? "start")
      case "single-product": {
        const ref = region.refs?.[0]
        if (ref?.kind !== "product") return null
        const isAnchor = region.anchor?.kind === "product" && region.anchor.index === ref.index
        return card(ref.index, resolveGraphCardTreatmentV1({ role: isAnchor ? "anchor" : "support", weight: region.weight, density: region.density ?? graph.density, effectiveSpan, arrangement: "single", hasMedia: Boolean(safeProductImage(products[ref.index])) }))
      }
      case "product-group":
        return region.regions?.length ? rows(region.regions, effectiveSpan, "Items (graph)") : productGroup(region, effectiveSpan)
      case "category-group":
        return categoryGroup(region, effectiveSpan)
      case "grounded-media":
        return media(region)
    }
  }

  function rows(regions: readonly GraphRegionV1[], parentEffectiveSpan: number, displayName: string): string {
    const rowIds = packGraphRowsV1(regions).map((row, rowIndex) => {
      const used = row.reduce((sum, region) => sum + region.span, 0)
      const leftover = GRAPH_LIMITS_V1.gridUnits - used
      const offset = leftover <= 0 ? 0 : row[0].align === "end" ? leftover : row[0].align === "center" ? Math.floor(leftover / 2) : 0
      const hasCopy = row.some((region) => region.role === "copy")
      const cells = row.map((region, cellIndex) => {
        const effectiveSpan = (parentEffectiveSpan * region.span) / GRAPH_LIMITS_V1.gridUnits
        const content = regionContent(region, effectiveSpan)
        if (!content) return null
        const classes = [
          "min-w-0",
          SPAN_CLASS[region.span],
          cellIndex === 0 && offset > 0 ? COL_START_CLASS[offset + 1] : "",
          REGION_PAD_CLASS[region.whitespace ?? 0],
          region.role === "copy" && region.pinned ? "lg:sticky lg:top-24 lg:self-start" : "",
        ].filter(Boolean).join(" ")
        return kit.wrapperNode(nodes, `Region ${region.id}`, classes, [content])
      }).filter((id): id is string => Boolean(id))
      return kit.wrapperNode(nodes, `${displayName} ${rowIndex + 1}`, `${GRAPH_ROW_CLASS_V1[graph.whitespace]} ${hasCopy ? "lg:items-center" : "lg:items-start"}`, cells)
    })
    return rowIds.length === 1 ? rowIds[0] : kit.wrapperNode(nodes, `${displayName} rows`, ROWS_STACK_CLASS[graph.whitespace], rowIds)
  }

  const body = rows(graph.regions, GRAPH_LIMITS_V1.gridUnits, "Fila (graph)")
  const root = kit.add(nodes, createComposedNode({
    type: "section",
    displayName: `Composicion (graph${input.preset ? `: ${input.preset}` : ""})`,
    props: {
      maxWidth: graph.edge === "bleed" ? "full" : "xl",
      paddingY: graphPaddingYV1(graph.beat, graph.whitespace, graph.density),
      paddingX: "lg",
      background,
      commerceComposition: input.preset ?? "composition-graph",
      commerceVisualFinish: "pce-3c",
      commerceSectionScale: graphSectionScaleV1(graph.beat, graph.density),
      compositionGraph: {
        version: graph.version,
        fingerprint: input.fingerprint,
        // CF-4C: content-independent relational shape + coarse token, persisted with the plan for composition memory.
        shape: graphShapeSignatureV1(graph),
        ...(input.providerFingerprint ? { providerFingerprint: input.providerFingerprint, normalizations: [...(input.normalizations ?? [])] } : {}),
        beat: graph.beat,
        ...(input.previousContinuity ? { continuityFromPrevious: input.previousContinuity } : {}),
        ...(input.preset ? { preset: input.preset } : {}),
      },
    },
    children: [body],
  }))
  return { role: graph.role, rootId: root, nodes, purpose: "Composicion relacional (CreativeCompositionGraphV1)." }
}

export function graphPaddingYV1(beat: GraphBeatV1, whitespace: number, density: number): "md" | "lg" | "xl" {
  if (beat === "rest" || beat === "open" || beat === "peak") return "xl"
  if (density >= 3) return "lg"
  return PADDING_Y_BY_WHITESPACE[whitespace]
}

export function graphSectionScaleV1(beat: GraphBeatV1, density: number): "compact" | "standard" | "spacious" | "statement" {
  if (beat === "peak") return "statement"
  if (beat === "rest" || beat === "open") return "spacious"
  if (density >= 2) return "compact"
  return "standard"
}

function collectProductRefs(regions: readonly GraphRegionV1[]): number[] {
  const out: number[] = []
  for (const region of regions) {
    for (const ref of region.refs ?? []) if (ref.kind === "product") out.push(ref.index)
    if (region.regions) out.push(...collectProductRefs(region.regions))
  }
  return out
}

function findAnchor(regions: readonly GraphRegionV1[]): GraphRegionV1["anchor"] {
  for (const region of regions) {
    if (region.anchor) return region.anchor
    const nested = region.regions ? findAnchor(region.regions) : undefined
    if (nested) return nested
  }
  return undefined
}
