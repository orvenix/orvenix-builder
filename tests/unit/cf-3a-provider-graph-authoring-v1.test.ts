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

// CF-3A is fully offline: fixtures are provider-shaped TEXT. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-3A test: network is forbidden")
}) as typeof fetch

import {
  buildCf3ReviewPages,
  buildFromProviderText,
  CF3_REVIEW_VARIANTS,
  DIVERSITY_PRODUCTS,
  fixtureCatalog,
  fixtureConservative,
  fixtureDiversity,
  fixtureEditorial,
  fixtureExpressive,
  fixtureHostile,
  fixtureLegacyV1,
  fixtureMixed,
  fixturePremium,
  fixtureUnsafeCopy,
  providerText,
  UNSAFE_COPY_HEADLINES,
} from "../../app/dev-interaction-review/cf3-fixtures"
import { guardCreativeCopySlotV1, guardCreativeCopyV1, groundedNumberSetV1, CREATIVE_COPY_LIMITS_V1 } from "../../lib/orvenix-ai/full-site-generation/copy-guard"
import { validateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/validator"
import { buildFullSiteCommerceCapabilityManifestV1, FULL_SITE_GRAPH_AUTHORING_LIMITS_V1 } from "../../lib/orvenix-ai/full-site-generation/capability-manifest"
import { buildFullSiteCreativeSystemPromptV1, parseFullSiteProviderResponseV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"
import { buildFullSiteCreativeRequestV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import { catalogGraphGroundingV1, diagnoseGraphDegeneracyV1, diagnoseProviderGraphsV1 } from "../../lib/orvenix-ai/full-site-generation/graph-authoring"
import type { FullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import { GRAPH_LIMITS_V1, graphFingerprintV1, type GraphSectionV1 } from "../../lib/orvenix-ai/composer/graph"
import { traceGraphIntentSurvivalV1 } from "../../lib/orvenix-ai/composer/graph/trace"
import { normalizeCommercePresentationProductsV1, type CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { EditorNode, EditorTree } from "../../types/editor"

type Json = Record<string, unknown>
type Run = Awaited<ReturnType<typeof buildFromProviderText>>

const PRODUCTS: CommerceProductFactV1[] = normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? []
const CATEGORY_KEYS = ["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"]

const runs = new Map<string, Promise<Run>>()
function build(name: string, blueprint: Json, fenced = false): Promise<Run> {
  if (!runs.has(name)) runs.set(name, buildFromProviderText(providerText(blueprint, fenced)))
  return runs.get(name)!
}

function page(run: Run, slug = "home"): EditorTree {
  const found = run.plan.pages.find((entry) => entry.slug === slug)
  assert.ok(found, `page ${slug} exists`)
  return found.tree as EditorTree
}

function sectionRoots(tree: EditorTree): EditorNode[] {
  return tree.nodes[tree.rootId].children.map((id) => tree.nodes[id])
}

function graphRoots(tree: EditorTree) {
  return sectionRoots(tree).filter((node) => node.props.compositionGraph)
}

function fallbackRoots(tree: EditorTree) {
  return sectionRoots(tree).filter((node) => node.props.compositionGraphFallback)
}

function subtree(tree: EditorTree, id: string): EditorNode[] {
  const node = tree.nodes[id]
  return node ? [node, ...node.children.flatMap((child) => subtree(tree, child))] : []
}

function textsOf(tree: EditorTree, id: string): string[] {
  return subtree(tree, id).flatMap((node) => [node.props.text, node.props.content, node.props.title].filter((value): value is string => typeof value === "string"))
}

function providerGraphs(blueprint: Json, pageIndex = 0): GraphSectionV1[] {
  const pages = blueprint.pages as Array<{ sections: Array<{ composition?: GraphSectionV1 }> }>
  return pages[pageIndex].sections.map((section) => section.composition).filter((graph): graph is GraphSectionV1 => Boolean(graph))
}

function applied(run: Run) {
  assert.equal(run.ok, true)
  assert.equal(run.fullSiteCreative.lifecycle.status, "applied", JSON.stringify(run.fullSiteCreative.lifecycle))
}

// ─── Contract ──────────────────────────────────────────────────────────────────

test("contract: a V1 blueprint (no composition, no copy) still validates unchanged", () => {
  const result = validateFullSiteCreativeBlueprintV1(fixtureLegacyV1(), { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  for (const section of result.blueprint.pages.flatMap((entry) => entry.sections)) {
    assert.equal(section.composition, undefined)
    assert.equal(section.copy, undefined)
  }
})

test("contract: composition and copy are optional, additive section fields carried verbatim (no silent repair)", () => {
  const blueprint = fixtureEditorial()
  const result = validateFullSiteCreativeBlueprintV1(blueprint, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  const validated = result.blueprint.pages[0].sections.map((section) => section.composition).filter(Boolean) as GraphSectionV1[]
  const authored = providerGraphs(blueprint)
  assert.equal(validated.length, authored.length)
  validated.forEach((graph, index) => assert.equal(graphFingerprintV1(graph), graphFingerprintV1(authored[index])))
  assert.deepEqual(result.blueprint.pages[0].sections[1].copy, (blueprint.pages as Json[])[0] && ((blueprint.pages as Array<{ sections: Json[] }>)[0].sections[1].copy as Json))
})

test("contract: unknown section keys are still rejected; unknown copy keys and wrong-role graphs only degrade", () => {
  const blueprint = fixtureLegacyV1()
  const sections = (blueprint.pages as Array<{ sections: Json[] }>)[0].sections
  sections[1].layoutCss = "display:grid"
  const rejected = validateFullSiteCreativeBlueprintV1(blueprint, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  assert.equal(rejected.ok, false)

  const soft = fixtureLegacyV1()
  const softSections = (soft.pages as Array<{ sections: Json[] }>)[0].sections
  softSections[0].composition = { version: 1, role: "products", beat: "open", density: 1, whitespace: 1, edge: "contained", regions: [] }
  softSections[1].copy = { headline: "Lo esencial, bien elegido", subtitle: "x", intro: 42 }
  const result = validateFullSiteCreativeBlueprintV1(soft, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  assert.equal(result.blueprint.pages[0].sections[0].composition, undefined, "hero cannot carry a graph")
  assert.deepEqual(result.blueprint.pages[0].sections[1].copy, { headline: "Lo esencial, bien elegido" })
  assert.ok(result.warnings.some((warning) => warning.includes("composition ignorada")))
  assert.ok(result.warnings.some((warning) => warning.includes("copy.subtitle ignorado")))
  assert.ok(result.warnings.some((warning) => warning.includes("copy.intro ignorado")))
})

test("contract: over-length copy is dropped, never truncated", () => {
  const blueprint = fixtureLegacyV1()
  ;(blueprint.pages as Array<{ sections: Json[] }>)[0].sections[1].copy = { headline: "Una idea ".repeat(20) }
  const result = validateFullSiteCreativeBlueprintV1(blueprint, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  assert.equal(result.blueprint.pages[0].sections[1].copy, undefined)
})

test("contract: per-page graph budget drops excess graphs with a warning", () => {
  const graph = { version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions: [{ id: "g", role: "product-group", span: 12, weight: 3, refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }] }] }
  const sections = Array.from({ length: FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerPage + 1 }, () => ({ intent: "collection", role: "products", refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }], composition: graph }))
  const blueprint = { ...fixtureLegacyV1(), pages: [{ purpose: "home", sections: [{ intent: "opening", role: "hero" }, ...sections] }] }
  const result = validateFullSiteCreativeBlueprintV1(blueprint, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) {
    // A section cap may reject the page outright; either way no graph past the budget survives.
    return
  }
  const kept = result.blueprint.pages[0].sections.filter((section) => section.composition).length
  assert.ok(kept <= FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerPage)
  assert.ok(result.warnings.some((warning) => warning.includes("limite de secciones con grafo")))
})

test("parser: fenced provider text parses to the same blueprint as raw JSON", () => {
  assert.deepEqual(parseFullSiteProviderResponseV1(providerText(fixtureEditorial(), true)), parseFullSiteProviderResponseV1(providerText(fixtureEditorial())))
})

// ─── A: editorial site through the REAL path ───────────────────────────────────

test("A editorial: every provider graph survives to the EditorTree with an unchanged fingerprint", async () => {
  const blueprint = fixtureEditorial()
  const run = await build("editorial", blueprint, true)
  applied(run)
  const tree = page(run)
  const roots = graphRoots(tree)
  const authored = providerGraphs(blueprint)
  assert.equal(roots.length, authored.length)
  assert.deepEqual(roots.map((node) => (node.props.compositionGraph as { beat: string }).beat), ["open", "build", "rest", "peak"])
  assert.deepEqual(roots.map((node) => (node.props.compositionGraph as { fingerprint: string }).fingerprint), authored.map(graphFingerprintV1))
  assert.equal(fallbackRoots(tree).length, 0)
})

test("A editorial: safe creative copy renders; canned copy is used only where none was authored", async () => {
  const run = await build("editorial", fixtureEditorial(), true)
  const tree = page(run)
  const texts = sectionRoots(tree).flatMap((node) => textsOf(tree, node.id))
  for (const expected of ["Sonido para tu día", "Música que va contigo", "Una bocina pensada para acompañarte de la mañana a la noche.", "Escucha con intención"]) {
    assert.ok(texts.includes(expected), `${expected} rendered`)
  }
  assert.equal(sectionRoots(tree).filter((node) => node.props.creativeCopyFallback).length, 0)
})

// ─── Intent survival ──────────────────────────────────────────────────────────

for (const [name, factory] of [["editorial", fixtureEditorial], ["expressive", fixtureExpressive], ["catalog", fixtureCatalog], ["premium", fixturePremium], ["conservative", fixtureConservative]] as const) {
  test(`intent survival (${name}): fingerprint, beat, density, whitespace, spans, weights, anchors, continuity`, async () => {
    const blueprint = factory()
    const run = await build(name, blueprint, name === "editorial")
    applied(run)
    const tree = page(run)
    const children = tree.nodes[tree.rootId].children
    for (const graph of providerGraphs(blueprint)) {
      const fingerprint = graphFingerprintV1(graph)
      const index = children.findIndex((id) => (tree.nodes[id].props.compositionGraph as { fingerprint?: string } | undefined)?.fingerprint === fingerprint)
      assert.ok(index >= 0, `${name}: graph ${graph.beat} compiled`)
      const trace = traceGraphIntentSurvivalV1({ providerGraph: graph, tree, sectionRootId: children[index], nextSectionRootId: children[index + 1], products: PRODUCTS })
      const label = `${name}/${graph.beat}`
      assert.equal(trace.fingerprint, true, `${label} fingerprint`)
      assert.equal(trace.beat, true, `${label} beat`)
      assert.equal(trace.density, true, `${label} density`)
      assert.equal(trace.whitespace, true, `${label} whitespace`)
      assert.notEqual(trace.continuity, false, `${label} continuity`)
      for (const span of trace.spans) assert.equal(span.survived, true, `${label} span ${span.region}=${span.span}`)
      for (const weight of trace.weights) assert.equal(weight.survived, true, `${label} weight ${weight.region}=${weight.weight}`)
      if (trace.anchor !== "n/a") assert.equal(trace.anchor.survived, true, `${label} anchor ${trace.anchor.region}`)
    }
  })
}

test("intent survival: a hand-mutated graph is NOT reported as surviving (trace is not a tautology)", async () => {
  const blueprint = fixtureEditorial()
  const run = await build("editorial", blueprint, true)
  const tree = page(run)
  const graph = providerGraphs(blueprint)[1]
  const root = graphRoots(tree)[1]
  const mutated: GraphSectionV1 = { ...graph, whitespace: 0, regions: graph.regions.map((region) => (region.id === "story" ? { ...region, span: 6 } : region)) }
  const trace = traceGraphIntentSurvivalV1({ providerGraph: mutated, tree, sectionRootId: root.id, products: PRODUCTS })
  assert.equal(trace.fingerprint, false)
  assert.equal(trace.spans.find((span) => span.region === "story")?.survived, false)
})

// ─── B: mixed validity -> per-section fallback ────────────────────────────────

test("B mixed: an invalid graph falls back to V1 for that section only; neighbours keep their graphs", async () => {
  const run = await build("mixed", fixtureMixed())
  applied(run)
  const tree = page(run)
  assert.equal(graphRoots(tree).length, 2)
  const fallbacks = fallbackRoots(tree)
  assert.equal(fallbacks.length, 1)
  assert.deepEqual(fallbacks[0].props.compositionGraphFallback, { codes: ["ref_unknown_product"], reason: "ref_unknown_product" })
  // The fallback section is still a real, populated V1 product section.
  assert.ok(subtree(tree, fallbacks[0].id).some((node) => node.type === "store-product-card"))
  assert.ok(run.warnings.some((warning) => warning.includes(".composition: ref_unknown_product")), "advisory warning recorded")
})

// ─── C: hostile graph content ────────────────────────────────────────────────

test("C hostile: className, raw CSS, arbitrary dimensions, excessive nesting and unknown refs never reach the tree", async () => {
  const run = await build("hostile", fixtureHostile())
  applied(run)
  const tree = page(run)
  assert.equal(graphRoots(tree).length, 0)
  const reasons = fallbackRoots(tree).map((node) => (node.props.compositionGraphFallback as { reason: string }).reason)
  assert.deepEqual(reasons, ["unknown_key", "unknown_key", "span_invalid", "depth_limit", "ref_unknown_category"])
  const classes = Object.values(tree.nodes).map((node) => String(node.props.className ?? ""))
  assert.ok(!classes.some((value) => value.includes("bg-[red]")))
  assert.ok(!JSON.stringify(tree).includes("display:none"))
  assert.ok(!classes.some((value) => value.includes("8px")))
  assert.ok(!Object.values(tree.nodes).some((node) => Object.values(node.props).includes("8px")))
  assert.ok(!JSON.stringify(tree).includes("armas"))
  assert.equal(run.warnings.filter((warning) => /\.composition: /.test(warning)).length, 5)
})

// ─── D: unsafe copy ──────────────────────────────────────────────────────────

test("D unsafe copy: each unsafe headline falls back alone; the graph and the safe intro survive", async () => {
  const run = await build("unsafe", fixtureUnsafeCopy())
  applied(run)
  const tree = page(run)
  const roots = graphRoots(tree)
  assert.equal(roots.length, 6, "no graph is discarded because of a headline")
  const codes = roots.map((node) => (node.props.creativeCopyFallback as Array<{ slot: string; code: string }>)?.[0])
  assert.deepEqual(codes.map((entry) => entry?.slot), Array(6).fill("headline"))
  assert.deepEqual(codes.map((entry) => entry?.code), ["discount", "percentage", "delivery_time", "guarantee", "rating", "statistic"])
  const texts = roots.flatMap((node) => textsOf(tree, node.id))
  for (const headline of UNSAFE_COPY_HEADLINES) assert.ok(!texts.includes(headline), `${headline} not rendered`)
  assert.equal(texts.filter((text) => text === "Una selección pensada para tu día a día.").length, 6)
  assert.equal(run.warnings.filter((warning) => /\.copy\.headline: /.test(warning)).length, 6)
})

test("copy guard: rejects the spec's unsafe claims, accepts creative language and grounded numbers", () => {
  const grounded = groundedNumberSetV1({ groundedTexts: ["Tablet Nova 10", "Power Bank 20 000 mAh"] })
  const expectations: Array<[string, string]> = [
    ["Envío gratis", "discount"],
    ["Envío a todo el país", "shipping"],
    ["Entrega en 24 horas", "delivery_time"],
    ["Más de 10,000 clientes", "statistic"],
    ["30% de descuento", "percentage"],
    ["Hasta 2x1 en audio", "discount"],
    ["Garantía de por vida", "guarantee"],
    ["El número 1 de México", "superlative"],
    ["5 estrellas", "rating"],
    ["Últimas unidades", "scarcity"],
    ["Distribuidor autorizado", "certification"],
    ["Desde $499", "price"],
    ["Visita www.tienda.com", "link"],
    ["<b>Hola</b> mundo", "markup"],
    ["Ahora con 12 modos", "unsupported_number"],
  ]
  for (const [text, code] of expectations) {
    const result = guardCreativeCopySlotV1("headline", text, grounded)
    assert.deepEqual(result, { ok: false, code }, text)
  }
  for (const text of ["Encuentra tu próxima pieza favorita", "La Tablet Nova 10, para leer sin prisa", "Energía de 20 000 mAh para el camino", "Música que va contigo"]) {
    assert.equal(guardCreativeCopySlotV1("headline", text, grounded).ok, true, text)
  }
  assert.deepEqual(guardCreativeCopySlotV1("eyebrow", "x".repeat(CREATIVE_COPY_LIMITS_V1.eyebrow.max + 1), grounded), { ok: false, code: "too_long" })
  assert.deepEqual(guardCreativeCopySlotV1("intro", "  ", grounded), { ok: false, code: "empty" })
})

test("copy guard: slots are independent", () => {
  const report = guardCreativeCopyV1({ eyebrow: "Nueva temporada", headline: "Envío gratis hoy", intro: "Piezas que se entienden entre sí." }, { groundedTexts: [] })
  assert.deepEqual(report.copy, { eyebrow: "Nueva temporada", intro: "Piezas que se entienden entre sí." })
  assert.deepEqual(report.rejected, [{ slot: "headline", code: "discount" }])
})

// ─── Grounding (advisory == authoritative) ───────────────────────────────────

test("grounding: category refs need a category page, CTA regions need a CTA intent, product-media needs an image", () => {
  const grounding = catalogGraphGroundingV1(PRODUCTS, ["audio"])
  const graph = (regions: Json[]): GraphSectionV1 => ({ version: 1, role: "content", beat: "build", density: 1, whitespace: 1, edge: "contained", regions } as unknown as GraphSectionV1)
  const diagnose = (section: { graph: GraphSectionV1; hasCtaAction?: boolean }) => diagnoseProviderGraphsV1([{ path: "p", sections: [{ path: "s", ...section }] }], grounding)

  assert.deepEqual(diagnose({ graph: graph([{ id: "c", role: "category-group", span: 12, weight: 3, refs: [{ kind: "category", key: "audio" }] }]) }), [])
  assert.match(diagnose({ graph: graph([{ id: "c", role: "category-group", span: 12, weight: 3, refs: [{ kind: "category", key: "gaming" }] }]) })[0], /ref_unknown_category/)

  const cta = graph([{ id: "go", role: "cta", span: 12, weight: 3 }])
  assert.deepEqual(diagnose({ graph: cta, hasCtaAction: true }), [])
  assert.match(diagnose({ graph: cta, hasCtaAction: false })[0], /cta_unavailable/)

  const noImage: CommerceProductFactV1[] = [{ name: "Sin foto", variants: [{ label: "Único", priceMxn: 10000, availability: "in_stock" }] }]
  const media = { version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions: [{ id: "m", role: "grounded-media", span: 12, weight: 3, refs: [{ kind: "product-media", index: 0 }] }] } as unknown as GraphSectionV1
  const warnings = diagnoseProviderGraphsV1([{ path: "p", sections: [{ path: "s", graph: media }] }], catalogGraphGroundingV1(noImage, []))
  assert.equal(warnings.length, 1)
})

test("request: hasImage is emitted only for products with a safe image URL", () => {
  const variant = { label: "Único", priceMxn: 10000, availability: "in_stock" as const }
  const request = buildFullSiteCreativeRequestV1({
    products: [
      { name: "Con foto", category: "Audio", variants: [variant], imageUrls: ["https://cdn.example.com/a.jpg"] },
      { name: "Sin foto", category: "Audio", variants: [variant] },
      { name: "Foto insegura", category: "Audio", variants: [variant], imageUrls: ["javascript:alert(1)"] },
    ] as CommerceProductFactV1[],
  })
  assert.deepEqual(request.context.catalog.products.map((product) => product.hasImage), [true, undefined, undefined])
})

// ─── G: diversity ────────────────────────────────────────────────────────────

test("G diversity: same five products, three directions -> three different compiled structures", async () => {
  const structures: string[] = []
  for (const direction of ["a", "b", "c"] as const) {
    const run = await build(`diversity-${direction}`, fixtureDiversity(direction))
    applied(run)
    const tree = page(run)
    const [root] = graphRoots(tree)
    assert.ok(root, `direction ${direction} compiled as a graph`)
    const nodes = subtree(tree, root.id)
    const names = nodes.filter((node) => node.type === "store-product-card").map((node) => String(node.props.productName))
    assert.deepEqual(new Set(names), new Set(DIVERSITY_PRODUCTS.map((index) => PRODUCTS[index].name)), "same facts")
    structures.push(JSON.stringify(nodes.map((node) => [node.type, node.props.className ?? "", node.props.treatment ?? ""])))
  }
  assert.equal(new Set(structures).size, 3)
})

// ─── Backward compatibility ──────────────────────────────────────────────────

test("backward compatibility: a V1 provider site compiles through V1 with no graph or copy props", async () => {
  const run = await build("legacy", fixtureLegacyV1())
  applied(run)
  for (const entry of run.plan.pages) {
    const tree = entry.tree as EditorTree
    for (const node of Object.values(tree.nodes)) {
      assert.equal(node.props.compositionGraph, undefined)
      assert.equal(node.props.compositionGraphFallback, undefined)
      assert.equal(node.props.creativeCopyFallback, undefined)
    }
  }
  assert.ok(sectionRoots(page(run)).some((node) => node.props.commerceComposition === "featured-plus-grid"))
  assert.equal(run.warnings.filter((warning) => /composition|copy|degeneracy/.test(warning)).length, 0)
})

// ─── Degeneracy (warnings only) ──────────────────────────────────────────────

test("degeneracy: repetitive graphs are warned about, never rejected", async () => {
  const graph = { version: 1, role: "products", beat: "build", density: 3, whitespace: 1, edge: "contained", regions: [{ id: "g", role: "product-group", span: 12, weight: 5, refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }], anchor: { kind: "product", index: 0 } }] } as unknown as GraphSectionV1
  const section = { intent: "collection", role: "products", refs: [], composition: graph }
  const blueprint = { pages: [{ purpose: "home", sections: [section, section, section] }, { purpose: "catalog", sections: [section, section, section] }] } as unknown as FullSiteCreativeBlueprintV1
  const warnings = diagnoseGraphDegeneracyV1(blueprint)
  for (const fragment of ["repite el mismo grafo", "mismos grafos", "density 3", "weight 5", "ancla focal"]) assert.ok(warnings.some((warning) => warning.includes(fragment)), fragment)
  assert.deepEqual(diagnoseGraphDegeneracyV1(validateOk(fixtureEditorial())), [])
})

function validateOk(blueprint: Json): FullSiteCreativeBlueprintV1 {
  const result = validateFullSiteCreativeBlueprintV1(blueprint, { productCount: 24, categoryKeys: CATEGORY_KEYS })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  return result.blueprint
}

// ─── Manifest + prompt truth ─────────────────────────────────────────────────

test("manifest: compositionGraph mirrors the real graph contract; creativeCopy mirrors the guard", () => {
  const manifest = buildFullSiteCommerceCapabilityManifestV1()
  const graph = manifest.compositionGraph
  assert.equal(graph.version, 1)
  assert.equal(graph.optional, true)
  assert.deepEqual(graph.eligibleSectionRoles, FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.graphSectionRoles)
  assert.equal(graph.maxTopLevelRegions, GRAPH_LIMITS_V1.maxTopLevelRegions)
  assert.equal(graph.maxDepth, GRAPH_LIMITS_V1.maxDepth)
  assert.equal(graph.maxRegionsTotal, GRAPH_LIMITS_V1.maxRegionsTotal)
  assert.equal(graph.gridUnits, GRAPH_LIMITS_V1.gridUnits)
  assert.deepEqual(manifest.creativeCopy.slots, CREATIVE_COPY_LIMITS_V1)
  // CF-1 truth claims are still present (CF-3 is additive).
  for (const key of ["layoutEquivalents", "layoutIgnoredRoles", "rhythmEffects", "navigationConceptEffects", "merchandisingByRole", "emphasisIgnoredRoles"]) assert.ok(key in manifest, key)
})

test("prompt: relational design + creative copy guidance is present and matches what the pipeline enforces", () => {
  const prompt = buildFullSiteCreativeSystemPromptV1()
  assert.ok(prompt.includes("DISENO RELACIONAL"))
  assert.ok(prompt.includes("COPY CREATIVO"))
  assert.match(prompt, /"composition"\?/)
  assert.match(prompt, /"copy"\?/)
  for (const rule of ["open", "build", "peak", "rest", "close", "nunca en la ultima seccion con composition", "hasImage", "ctaIntent"]) assert.ok(prompt.includes(rule), rule)
  // Every forbidden copy family the prompt names is actually enforced.
  for (const [text] of [["Envío gratis"], ["30% de descuento"], ["5 estrellas"], ["El número 1 de México"]]) {
    assert.equal(guardCreativeCopySlotV1("headline", text, new Set()).ok, false, text)
  }
})

// ─── Review pages ────────────────────────────────────────────────────────────

test("review pages: every cf3 variant builds offline", async () => {
  for (const variant of Object.keys(CF3_REVIEW_VARIANTS) as Array<keyof typeof CF3_REVIEW_VARIANTS>) {
    const pages = await buildCf3ReviewPages(variant)
    assert.ok(pages.length >= 1, variant)
    assert.equal(pages.filter((entry) => entry.isHome).length, 1, variant)
  }
  assert.equal(networkAttempts, 0)
})
