import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// CF-2 is fully offline. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-2 test: network is forbidden")
}) as typeof fetch

import {
  buildGraphGroundingV1,
  canonicalGraphJsonV1,
  composeSectionFromGraphV1,
  graphFingerprintV1,
  graphPresetForMerchandisingV1,
  packGraphRowsV1,
  resolveGraphCardTreatmentV1,
  surfaceRelationForContinuityV1,
  validateGraphPageV1,
  validateGraphSectionV1,
  CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
  type GraphSectionV1,
} from "../../lib/orvenix-ai/composer/graph"
import { composeSection } from "../../lib/orvenix-ai/composer/section-composer"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import { isValidSectionInstancePlan, type SectionInstanceMerchandisingComposition } from "../../lib/orvenix-ai/architect/composition-plan"
import { commerceCategoryKeyV1, type CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import type { ComposedSection, SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import { serializeTreeToHtml } from "../../lib/export/serializeToHtml"
import {
  buildCf2ReviewPages,
  cf2CategoryLinks,
  cf2GraphsFor,
  cf2Products,
  compileCf2Pages,
  CF2_DIVERSITY_PRODUCTS,
  CF2_PALETTE,
  CF2_REVIEW_VARIANTS,
  diversityGraphs,
  type Cf2ReviewVariant,
} from "../../app/dev-interaction-review/cf2-fixtures"
import type { EditorNode, EditorTree } from "../../types/editor"
import type { SectionRole } from "../../lib/orvenix-ai/architect"

const PRODUCTS: CommerceProductFactV1[] = cf2Products()
const LINKS = cf2CategoryLinks(PRODUCTS)
const CATEGORY_KEYS = LINKS.map((link) => commerceCategoryKeyV1(link.label))
const CTA = { label: "Ver catálogo" as const, href: "page:productos" }
const BASE: SectionCompositionContext = { businessName: "NovaMarket", products: PRODUCTS, commerceSurfaces: true, themePalette: CF2_PALETTE, commerceCategoryLinks: LINKS, commerceCtaAction: CTA }
const GROUNDING = buildGraphGroundingV1(BASE)

const product = (index: number) => ({ kind: "product" as const, index })
function graph(overrides: Partial<GraphSectionV1> = {}): GraphSectionV1 {
  return {
    version: CREATIVE_COMPOSITION_GRAPH_VERSION_V1,
    role: "products",
    beat: "build",
    density: 1,
    whitespace: 2,
    edge: "contained",
    regions: [
      { id: "copy", role: "copy", span: 4, weight: 4 },
      { id: "group", role: "product-group", span: 8, weight: 3, arrangement: "grid", refs: [product(0), product(1), product(2)], anchor: product(0) },
    ],
    ...overrides,
  }
}

function diagnosticCodes(result: ReturnType<typeof validateGraphSectionV1>): string[] {
  return result.ok === false ? result.diagnostics.map((diagnostic) => diagnostic.code) : []
}

function codes(value: unknown, position?: Parameters<typeof validateGraphSectionV1>[2], grounding = GROUNDING): string[] {
  return diagnosticCodes(validateGraphSectionV1(value, grounding, position))
}

function compose(value: unknown, extra: Partial<Parameters<typeof composeSectionFromGraphV1>[0]> = {}): ComposedSection {
  const result = composeSectionFromGraphV1({ graph: value, context: BASE, ...extra })
  assert.equal(result.ok, true, result.ok ? "" : JSON.stringify((result as { diagnostics: unknown }).diagnostics))
  return (result as { section: ComposedSection }).section
}

function pre(section: ComposedSection, id = section.rootId): ComposedSection["nodes"][string][] {
  const node = section.nodes[id]
  return node ? [node, ...node.children.flatMap((child) => pre(section, child))] : []
}
const cards = (section: ComposedSection) => pre(section).filter((node) => node.type === "store-product-card")
const classTokens = (section: ComposedSection) => pre(section).flatMap((node) => String(node.props.className ?? "").split(/\s+/).filter(Boolean))

function signature(section: ComposedSection): string {
  const walk = (id: string): string => {
    const node = section.nodes[id]
    return `${node.type}[${node.props.className ?? ""}|${node.props.treatment ?? ""}](${node.children.map(walk).join(",")})`
  }
  return walk(section.rootId)
}

// ─── CONTRACT ──────────────────────────────────────────────────────────────────

test("contract: version, region/nesting limits, bounded values, strict keys", () => {
  assert.deepEqual(codes(graph()), [])
  assert.ok(codes(graph({ version: 2 as never })).includes("version_invalid"))
  const five = Array.from({ length: 5 }, (_, index) => ({ id: `c${index}`, role: "cta" as const, span: 3, weight: 1 }))
  assert.ok(codes(graph({ regions: five })).includes("region_limit"))
  const nestedTwice = graph({ regions: [{ id: "g", role: "product-group", span: 12, weight: 3, regions: [
    { id: "a", role: "single-product", span: 6, weight: 3, refs: [product(0)] },
    { id: "b", role: "single-product", span: 6, weight: 3, refs: [product(1)], regions: [{ id: "x", role: "single-product", span: 6, weight: 1, refs: [product(2)] }] },
  ] }] })
  assert.ok(codes(nestedTwice).includes("depth_limit"))
  for (const [field, value] of [["span", 2], ["span", 13], ["span", 7.5], ["span", "8"], ["weight", 6], ["weight", 0], ["whitespace", 4], ["density", -1]] as const) {
    const bad = graph()
    ;(bad.regions[1] as unknown as Record<string, unknown>)[field] = value
    assert.ok(codes(bad).length > 0, `${field}=${JSON.stringify(value)} rejected`)
  }
  for (const [field, value] of [["density", 4], ["whitespace", 1.5], ["beat", "climax"], ["edge", "overlap"], ["role", "hero"], ["continuityToNext", "fade"]] as const) {
    assert.ok(codes({ ...graph(), [field]: value }).length > 0, `${field} rejected`)
  }
  // The graph carries intent only: any implementation-shaped key is rejected.
  for (const key of ["className", "style", "css", "tailwind", "html", "jsx", "width", "gap", "color", "background"]) {
    assert.ok(codes({ ...graph(), [key]: "x" }).includes("unknown_key"), `section.${key}`)
    const bad = graph()
    ;(bad.regions[0] as unknown as Record<string, unknown>)[key] = "lg:col-span-7 px-[13px]"
    assert.ok(codes(bad).includes("unknown_key"), `region.${key}`)
  }
  assert.ok(codes({ ...graph(), regions: [{ id: "BAD ID", role: "copy", span: 12, weight: 3 }] }).includes("id_invalid"))
})

// ─── GROUNDING ─────────────────────────────────────────────────────────────────

test("grounding: products/categories/media must be real; no duplicate ownership", () => {
  const unknownProduct = graph({ regions: [{ id: "p", role: "single-product", span: 6, weight: 3, refs: [product(999)] }] })
  assert.ok(codes(unknownProduct).includes("ref_unknown_product"))
  const unknownCategory = graph({ role: "content", regions: [{ id: "c", role: "category-group", span: 12, weight: 3, refs: [{ kind: "category", key: "armas" }] }] })
  assert.ok(codes(unknownCategory).includes("ref_unknown_category"))
  const goodCategory = graph({ role: "content", regions: [{ id: "c", role: "category-group", span: 12, weight: 3, refs: [{ kind: "category", key: CATEGORY_KEYS[0] }] }] })
  assert.deepEqual(codes(goodCategory), [])
  const noMedia = graph({ regions: [{ id: "m", role: "grounded-media", span: 6, weight: 3, refs: [{ kind: "product-media", index: 0 }] }] })
  assert.ok(codes(noMedia).includes("media_unavailable"), "mock products carry no authoritative image")
  const duplicate = graph({ regions: [
    { id: "a", role: "single-product", span: 6, weight: 3, refs: [product(1)] },
    { id: "b", role: "single-product", span: 6, weight: 3, refs: [product(1)] },
  ] })
  assert.ok(codes(duplicate).includes("duplicate_ref"))
  const ctaWithoutAction = graph({ regions: [{ id: "a", role: "cta", span: 4, weight: 3 }] })
  assert.ok(codes(ctaWithoutAction, undefined, { ...GROUNDING, hasCtaAction: false }).includes("cta_unavailable"))

  // Grounded media renders the AUTHORITATIVE image only.
  const withImage = PRODUCTS.map((entry, index) => (index === 3 ? { ...entry, imageUrls: ["https://cdn.example.invalid/real.jpg"] } : entry))
  const context = { ...BASE, products: withImage }
  const result = composeSectionFromGraphV1({ graph: graph({ regions: [
    { id: "m", role: "grounded-media", span: 7, weight: 4, refs: [{ kind: "product-media", index: 3 }] },
    { id: "p", role: "single-product", span: 5, weight: 3, refs: [product(3)] },
  ] }), context })
  assert.ok(result.ok)
  const image = pre((result as { section: ComposedSection }).section).find((node) => node.type === "image")!
  assert.equal(image.props.src, "https://cdn.example.invalid/real.jpg")
  assert.equal(image.props.alt, withImage[3].name)
})

// ─── GEOMETRY ──────────────────────────────────────────────────────────────────

test("geometry: span rows, readable minimums, deterministic responsive collapse", () => {
  assert.deepEqual(packGraphRowsV1([{ span: 8 }, { span: 4 }, { span: 9 }, { span: 3 }, { span: 6 }]).map((row) => row.map((region) => region.span)), [[8, 4], [9, 3], [6]])
  assert.ok(codes(graph({ regions: [{ id: "c", role: "copy", span: 3, weight: 3 }, { id: "p", role: "single-product", span: 9, weight: 3, refs: [product(0)] }] })).includes("too_narrow"))
  const narrowNested = graph({ regions: [{ id: "g", role: "product-group", span: 6, weight: 3, regions: [
    { id: "a", role: "single-product", span: 4, weight: 3, refs: [product(0)] },
    { id: "b", role: "single-product", span: 8, weight: 3, refs: [product(1)] },
  ] }] })
  assert.ok(codes(narrowNested).includes("too_narrow"), "4/12 of a 6/12 group is 2/12: unreadable")

  // Responsive: every row is ONE column below lg; spans/offsets are lg-only; no visual reordering.
  for (const variant of Object.keys(CF2_REVIEW_VARIANTS) as Cf2ReviewVariant[]) {
    for (const graphValue of cf2GraphsFor(variant, CATEGORY_KEYS)) {
      const section = compose(graphValue, { previousContinuity: undefined })
      const tokens = classTokens(section)
      assert.equal(tokens.some((token) => /(^|:)order-/.test(token)), false, `${variant}: no CSS reordering`)
      for (const token of tokens.filter((token) => /col-span-|col-start-|grid-cols-12/.test(token) && !/row-span/.test(token))) {
        assert.match(token, /^(lg|sm|md|xl):/, `${variant}: ${token} is breakpoint-gated`)
      }
      for (const node of pre(section).filter((entry) => String(entry.props.className ?? "").includes("lg:grid-cols-12"))) {
        assert.match(String(node.props.className), /\bgrid-cols-1\b/, "mobile collapses to one column")
      }
      for (const node of pre(section).filter((entry) => String(entry.props.className ?? "").includes("overflow-x-auto"))) {
        assert.match(String(node.props.className), /snap-x/, "rails scroll inside their own container")
      }
    }
  }
})

// ─── HIERARCHY ─────────────────────────────────────────────────────────────────

test("hierarchy: one dominant anchor, subordinate support, grounded cards only", () => {
  const featured = compose(graphPresetForMerchandisingV1("featured-plus-grid", { productIndexes: [0, 4, 8, 12, 16], hasCta: true })!, { preset: "featured-plus-grid" })
  const treatments = cards(featured).map((card) => card.props.treatment)
  assert.equal(treatments[0], "featured", "anchor")
  assert.ok(treatments.slice(1).every((treatment) => treatment === "compact-catalog"), `support: ${treatments.join(",")}`)
  assert.equal(new Set(treatments).size, 2, "focal and support are visibly distinct (CF-1 deferred defect resolved)")
  // No invented products: exactly the referenced, bound products.
  const expectedIds = [0, 4, 8, 12, 16].map((index) => PRODUCTS[index].storeBinding!.productId)
  assert.deepEqual(cards(featured).map((card) => card.props.productId), expectedIds)

  // Anchor in a grid occupies the lead cell.
  const grid = compose(graph())
  assert.ok(pre(grid).some((node) => node.displayName === "Ancla (graph)" && String(node.props.className).includes("lg:row-span-2")))
  assert.equal(cards(grid)[0].props.treatment, "featured", "anchor weight bumps within its group")
  // Support may not outweigh the anchor; one anchor only; anchor must be own ref.
  assert.ok(codes(graph({ regions: [
    { id: "a", role: "single-product", span: 6, weight: 2, refs: [product(0)], anchor: product(0) },
    { id: "b", role: "single-product", span: 6, weight: 4, refs: [product(1)] },
  ] })).includes("anchor_not_dominant"))
  assert.ok(codes(graph({ regions: [
    { id: "a", role: "single-product", span: 6, weight: 4, refs: [product(0)], anchor: product(0) },
    { id: "b", role: "single-product", span: 6, weight: 4, refs: [product(1)], anchor: product(1) },
  ] })).includes("multiple_anchors"))
  assert.ok(codes(graph({ regions: [{ id: "a", role: "single-product", span: 6, weight: 4, refs: [product(0)], anchor: product(5) }] })).includes("anchor_invalid"))

  // Role-based resolution is relational, not one hardcoded pair.
  assert.equal(resolveGraphCardTreatmentV1({ role: "anchor", weight: 5, density: 1, effectiveSpan: 8, arrangement: "single", hasMedia: false }), "featured")
  assert.equal(resolveGraphCardTreatmentV1({ role: "anchor", weight: 4, density: 1, effectiveSpan: 8, arrangement: "single", hasMedia: true }), "image-led")
  assert.equal(resolveGraphCardTreatmentV1({ role: "anchor", weight: 3, density: 1, effectiveSpan: 8, arrangement: "grid", hasMedia: false }), "editorial")
  assert.equal(resolveGraphCardTreatmentV1({ role: "support", weight: 3, density: 1, effectiveSpan: 9, arrangement: "single", hasMedia: false }), "horizontal")
  assert.equal(resolveGraphCardTreatmentV1({ role: "support", weight: 3, density: 1, effectiveSpan: 4, arrangement: "grid", hasMedia: false }), "editorial")
  assert.equal(resolveGraphCardTreatmentV1({ role: "support", weight: 2, density: 3, effectiveSpan: 12, arrangement: "grid", hasMedia: false }), "compact-catalog")
  assert.equal(resolveGraphCardTreatmentV1({ role: "anchor", weight: 5, density: 1, effectiveSpan: 12, arrangement: "rail", hasMedia: false }), "horizontal")
})

// ─── PAGE ARC + CONTINUITY ─────────────────────────────────────────────────────

test("page arc: beat sequence rules are enforced per section", () => {
  const open = graph({ beat: "open" })
  const close = graph({ beat: "close" })
  const peak = graph({ beat: "peak" })
  const results = validateGraphPageV1([graph({ beat: "build" }), open, peak, peak, peak, { ...close, continuityToNext: "contrast" }, close], () => GROUNDING)
  assert.equal(results[0].ok, true)
  assert.ok(diagnosticCodes(results[1]).includes("beat_sequence"), "open not first")
  assert.equal(results[2].ok, true)
  assert.equal(results[3].ok, true)
  assert.ok(diagnosticCodes(results[4]).includes("beat_sequence"), "third peak")
  assert.ok(diagnosticCodes(results[5]).includes("beat_sequence"), "close not last")
  assert.equal(results[6].ok, true)
  assert.ok(codes(graph({ beat: "rest", density: 2 })).includes("rest_too_dense"))
  assert.ok(codes(graph({ beat: "peak", regions: [{ id: "c", role: "copy", span: 12, weight: 4 }] })).includes("peak_without_focus"))
  assert.ok(codes({ ...graph({ beat: "close" }), continuityToNext: "bridge" }, { index: 0, total: 1, peaksBefore: 0 }).includes("continuity_invalid"))
})

function rootSections(tree: EditorTree): EditorNode[] {
  return tree.nodes[tree.rootId].children.map((id) => tree.nodes[id])
}

test("page arc D: sparse -> dense -> focal -> rest -> closing compile to intentionally different sections", () => {
  const home = buildCf2ReviewPages("cf2-arc")[0].tree
  const sections = rootSections(home).filter((node) => node.props.compositionGraph)
  assert.deepEqual(sections.map((node) => (node.props.compositionGraph as { beat: string }).beat), ["open", "build", "peak", "rest", "close"])
  assert.deepEqual(sections.map((node) => node.props.commerceSectionScale), ["spacious", "compact", "statement", "spacious", "standard"])
  assert.deepEqual(sections.map((node) => node.props.paddingY), ["xl", "lg", "xl", "xl", "lg"])
  const cardsIn = (node: EditorNode): number => (node.type === "store-product-card" ? 1 : 0) + node.children.reduce((sum, id) => sum + cardsIn(home.nodes[id]), 0)
  assert.deepEqual(sections.map(cardsIn), [0, 10, 1, 0, 0], "dense build carries the information; peak focuses on one product")
  assert.equal(new Set(sections.map((node) => node.props.maxWidth)).size, 2, "the peak bleeds")
  // Continuity: the previous section's relation decides the Orvenix surface.
  assert.deepEqual(sections.slice(1).map((node) => (node.props.compositionGraph as { continuityFromPrevious?: string }).continuityFromPrevious), ["contrast", "continue", "bridge", "contrast"])
  assert.equal(surfaceRelationForContinuityV1("contrast", "products"), "contrast")
  assert.equal(surfaceRelationForContinuityV1("bridge", "products"), "soft")
  assert.equal(surfaceRelationForContinuityV1("continue", "products"), "continuous")
  assert.notEqual(sections[1].props.background, sections[2].props.background, "contrast separates")
  assert.ok(sections.every((node) => typeof node.props.background === "string" && /^#[0-9a-f]{6}$/i.test(node.props.background as string)), "colors are Orvenix theme surfaces")
})

// ─── COMPILER ──────────────────────────────────────────────────────────────────

test("compiler: graph -> existing node types only; same facts + different graphs -> different structure", () => {
  const allowed = new Set(["section", "genericWrapper", "heading", "text", "ctaButton", "store-product-card", "image"])
  const sections = diversityGraphs().map((value) => compose(value))
  for (const section of sections) for (const node of pre(section)) assert.ok(allowed.has(node.type), node.type)
  const signatures = sections.map(signature)
  assert.equal(new Set(signatures).size, sections.length, "four materially different structures")
  // ...with identical factual content: the same five bound products, nothing more.
  const expected = [...CF2_DIVERSITY_PRODUCTS].map((index) => PRODUCTS[index].storeBinding!.productId).sort()
  for (const section of sections) assert.deepEqual(cards(section).map((card) => String(card.props.productId)).sort(), expected)
  const prices = (section: ComposedSection) => cards(section).map((card) => `${card.props.productId}:${card.props.priceMxn}`).sort()
  for (const section of sections.slice(1)) assert.deepEqual(prices(section), prices(sections[0]), "authoritative prices unchanged")
  assert.equal(networkAttempts, 0)
})

// ─── PRESETS ───────────────────────────────────────────────────────────────────

const PRESETS: SectionInstanceMerchandisingComposition[] = ["featured-plus-grid", "product-rail", "category-spotlight", "editorial-collection", "alternating-story", "dense-catalog"]

function v1(composition: SectionInstanceMerchandisingComposition, indexes: number[]): ComposedSection {
  const role = composition === "category-spotlight" ? "content" : "products"
  const instance = { id: "v1", role: role as SectionRole, selection: role === "products" ? { mode: "subset" as const, indexes } : { mode: "all" as const }, composition: { merchandisingComposition: composition, ctaAction: CTA, ...(role === "content" ? { categoryLinks: LINKS } : {}) }, provenance: "deterministic" as const }
  return composeSection(role, applySectionInstanceToContext(BASE, instance))!
}

function ratioOf(classes: string, pattern: RegExp): number | null {
  const match = classes.match(pattern)
  return match ? Number(match[1]) : null
}

test("presets: all six V1 merchandising compositions are expressible as graphs and structurally equivalent to V1", () => {
  const indexes = [0, 4, 8, 12, 16]
  for (const composition of PRESETS) {
    const preset = graphPresetForMerchandisingV1(composition, { productIndexes: indexes, categoryKeys: CATEGORY_KEYS, hasCta: true })
    assert.ok(preset, composition)
    const viaGraph = compose(preset, { preset: composition })
    const viaV1 = v1(composition, indexes)
    assert.equal(viaGraph.nodes[viaGraph.rootId].props.commerceComposition, composition, `${composition}: reported`)
    assert.equal(viaV1.nodes[viaV1.rootId].props.commerceComposition, composition)
    const graphTokens = classTokens(viaGraph).join(" ")
    const v1Tokens = classTokens(viaV1).join(" ")
    if (composition !== "category-spotlight") {
      assert.deepEqual(cards(viaGraph).map((card) => card.props.productId), cards(viaV1).map((card) => card.props.productId), `${composition}: same grounded products, same order`)
    }
    switch (composition) {
      case "featured-plus-grid": {
        // V1: lead spans 2 of 3 columns; graph: anchor spans 8 of 12 -> the same 2/3 relationship.
        assert.match(v1Tokens, /lg:col-span-2/)
        assert.match(graphTokens, /lg:col-span-8/)
        assert.equal(cards(viaGraph)[0].props.treatment, cards(viaV1)[0].props.treatment, "anchor treatment")
        break
      }
      case "product-rail":
        for (const tokens of [v1Tokens, graphTokens]) {
          assert.match(tokens, /overflow-x-auto/)
          assert.match(tokens, /snap-x/)
          assert.match(tokens, /lg:min-w-\[28rem\]/, "focal lead width")
        }
        assert.ok(cards(viaGraph).every((card) => card.props.treatment === "horizontal"))
        break
      case "category-spotlight": {
        const labels = (section: ComposedSection) => pre(section).filter((node) => node.type === "heading" && String(node.displayName).startsWith("Categoria ")).map((node) => node.props.text)
        assert.deepEqual(labels(viaGraph), labels(viaV1), "same real categories")
        for (const tokens of [v1Tokens, graphTokens]) assert.match(tokens, /lg:row-span-2/, "anchor category")
        break
      }
      case "editorial-collection": {
        // V1 0.68fr/1.32fr (0.34 share) vs graph 4/12 (0.33): same narrow-copy / wide-collection relationship.
        const v1Share = ratioOf(v1Tokens, /lg:grid-cols-\[([\d.]+)fr_[\d.]+fr\]/)! / 2
        assert.ok(Math.abs(v1Share - 4 / 12) < 0.02, `V1 share ${v1Share}`)
        assert.match(graphTokens, /lg:col-span-4/)
        for (const tokens of [v1Tokens, graphTokens]) {
          assert.match(tokens, /lg:sticky/, "pinned copy")
          assert.match(tokens, /lg:row-span-2/, "anchor product")
        }
        break
      }
      case "alternating-story":
        // V1 78% alternating left/right vs graph 9/12 (75%) alternating start/end.
        assert.match(v1Tokens, /md:w-\[78%\]/)
        assert.match(v1Tokens, /md:ml-auto/)
        assert.match(graphTokens, /lg:col-span-9/)
        assert.match(graphTokens, /lg:col-start-4/)
        assert.ok(cards(viaGraph).every((card) => card.props.treatment === "horizontal") && cards(viaV1).every((card) => card.props.treatment === "horizontal"))
        break
      case "dense-catalog":
        assert.ok(cards(viaGraph).every((card) => card.props.treatment === "compact-catalog") && cards(viaV1).every((card) => card.props.treatment === "compact-catalog"))
        assert.match(graphTokens, /lg:grid-cols-[45]/)
        assert.match(v1Tokens, /lg:grid-cols-4/)
        break
    }
  }
})

// ─── FALLBACK ──────────────────────────────────────────────────────────────────

test("fallback: an invalid graph section falls back to V1 ALONE (reason recorded); the others stay V2", () => {
  const [first, second, third] = cf2GraphsFor("cf2-editorial", CATEGORY_KEYS)
  const invalid = { ...second, regions: [{ id: "x", role: "single-product", span: 12, weight: 3, refs: [{ kind: "product", index: 999 }] }] }
  // The third section becomes the last graph section, so it carries no continuityToNext.
  const { continuityToNext: _unused, ...lastThird } = third
  void _unused
  const pages = compileCf2Pages([first, invalid, lastThird])
  const sections = rootSections(pages[0].tree).filter((node) => node.type === "section" && node.props.background !== undefined && (node.props.compositionGraph || node.props.compositionGraphFallback))
  assert.equal(sections.length, 3)
  assert.ok(sections[0].props.compositionGraph, "first graph section compiled by V2")
  assert.deepEqual(sections[1].props.compositionGraphFallback, { reason: "ref_unknown_product", codes: ["ref_unknown_product"] })
  assert.equal(sections[1].props.compositionGraph, undefined, "no partial graph interpretation")
  assert.ok(sections[2].props.compositionGraph, "third graph section still V2")
  // A graph on a section of another role falls back too.
  const roleMismatch = composeSectionFromGraphV1({ graph: first, context: BASE, expectedRole: "content" })
  assert.equal(roleMismatch.ok, false)
  // Plan validation is shape-only: an invalid graph never rejects the whole plan.
  const plan = (graphValue: unknown) => ({ id: "x", role: "products", selection: { mode: "all" }, composition: { graph: graphValue }, provenance: "deterministic" })
  assert.equal(isValidSectionInstancePlan(plan(invalid)), true)
  assert.equal(isValidSectionInstancePlan(plan("not-an-object")), false)
  assert.equal(isValidSectionInstancePlan(plan({ blob: "x".repeat(20_000) })), false)
})

// ─── FINGERPRINT ───────────────────────────────────────────────────────────────

test("canonical representation: key-order independent, stable, relation-sensitive, recorded on the section", () => {
  const value = graph()
  const reordered = JSON.parse(JSON.stringify({ regions: value.regions, edge: value.edge, whitespace: value.whitespace, density: value.density, beat: value.beat, role: value.role, version: value.version }))
  assert.equal(canonicalGraphJsonV1(reordered), canonicalGraphJsonV1(value))
  assert.equal(graphFingerprintV1(reordered), graphFingerprintV1(value))
  assert.match(graphFingerprintV1(value), /^[0-9a-f]{64}$/)
  const changed = graph({ regions: [{ ...value.regions[0], span: 5 }, { ...value.regions[1], span: 7 }] })
  assert.notEqual(graphFingerprintV1(changed), graphFingerprintV1(value), "8/4 vs 7/5 is a different motif")
  const section = compose(value)
  assert.equal((section.nodes[section.rootId].props.compositionGraph as { fingerprint: string }).fingerprint, graphFingerprintV1(value))
})

// ─── CSS TRUTH + EXPORT + V1 REGRESSION ────────────────────────────────────────

test("CF-1 renderer truth holds for the graph compiler: every emitted class compiles and is source-visible", async () => {
  const tokens = new Set<string>()
  for (const variant of Object.keys(CF2_REVIEW_VARIANTS) as Cf2ReviewVariant[]) {
    for (const page of buildCf2ReviewPages(variant)) for (const node of Object.values(page.tree.nodes)) for (const token of String(node.props.className ?? "").split(/\s+/)) if (token) tokens.add(token)
  }
  for (const composition of PRESETS) {
    const preset = graphPresetForMerchandisingV1(composition, { productIndexes: [0, 1, 2, 3, 4, 5], categoryKeys: CATEGORY_KEYS, hasCta: true })!
    for (const token of classTokens(compose(preset, { preset: composition }))) tokens.add(token)
  }
  const loadModule = Module.createRequire(path.join(process.cwd(), "package.json"))
  const { compile } = loadModule("tailwindcss") as { compile: (css: string, options: { base: string; loadStylesheet: (id: string, base: string) => Promise<{ path: string; base: string; content: string }> }) => Promise<{ build: (candidates: string[]) => string }> }
  const tailwindBase = path.dirname(loadModule.resolve("tailwindcss/package.json"))
  const compiler = await compile('@import "tailwindcss";', {
    base: process.cwd(),
    loadStylesheet: async (id, base) => {
      const file = id === "tailwindcss" ? path.join(tailwindBase, "index.css") : path.resolve(base, id)
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") }
    },
  })
  let previous = compiler.build([]).length
  const noCss: string[] = []
  for (const token of [...tokens].sort()) {
    const length = compiler.build([token]).length
    if (length <= previous && token !== "group") noCss.push(token)
    previous = length
  }
  assert.deepEqual(noCss, [])
  const graphSource = ["contract", "validator", "compiler", "presets", "fingerprint", "index"].map((name) => fs.readFileSync(path.join(process.cwd(), `lib/orvenix-ai/composer/graph/${name}.ts`), "utf8")).join("\n") + fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/composer/section-composer.ts"), "utf8")
  const escape = (token: string) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  assert.deepEqual([...tokens].filter((token) => !new RegExp(`(^|[\\s"'\`])${escape(token)}(?=[\\s"'\`]|$)`, "m").test(graphSource)), [], "classes are literals in @source-covered composer files")
  assert.match(fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8"), /@source "\.\.\/lib\/orvenix-ai\/composer";/)
})

test("export + V1 regression: graph trees export like V1 trees; sections without graphs are untouched", () => {
  const page = buildCf2ReviewPages("cf2-editorial")[0]
  const exported = serializeTreeToHtml(page.tree, "NovaMarket")
  assert.ok(exported.html.length > 0)
  const v1Only = compileCf2Pages([])
  assert.equal(Object.values(v1Only[0].tree.nodes).some((node) => node.props.compositionGraph || node.props.compositionGraphFallback), false)
  // The cart shell still applies (bound cards -> nav cart + one drawer).
  const nodes = Object.values(page.tree.nodes)
  assert.equal(nodes.filter((node) => node.type === "store-cart-drawer").length, 1)
  assert.ok(nodes.some((node) => node.type === "siteNav" && node.props.showCart === true))
  assert.equal(networkAttempts, 0)
})
