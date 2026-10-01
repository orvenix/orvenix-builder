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

// CF-3D is fully offline: the real call #3 output is replayed from a frozen fixture. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-3D test: network is forbidden")
}) as typeof fetch

import { buildCf3ReviewPages, buildFromProviderText, fixtureLegacyV1, loadCf3bCall3FixtureV1, providerText } from "../../app/dev-interaction-review/cf3-fixtures"
import { validateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/validator"
import { buildFullSiteCreativeSystemPromptV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"
import { guardCreativeCopyV1 } from "../../lib/orvenix-ai/full-site-generation/copy-guard"
import { groundedCopyTextsV1 } from "../../lib/orvenix-ai/full-site-generation/graph-authoring"
import { composeSectionFromGraphV1, graphFingerprintV1, normalizeGraphForPositionV1, validateGraphSectionV1, type GraphSectionV1 } from "../../lib/orvenix-ai/composer/graph"
import { traceGraphIntentSurvivalV1 } from "../../lib/orvenix-ai/composer/graph/trace"
import { isValidSectionVisualLayoutPlan, ROLE_VISUAL_LAYOUT_VOCABULARY } from "../../lib/orvenix-ai/composer/visual-layout-plan"
import { normalizeCommercePresentationProductsV1, type CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import type { SectionRole } from "../../lib/orvenix-ai/architect/block-selector"
import type { EditorNode, EditorTree } from "../../types/editor"

type Json = Record<string, unknown>
type Run = Awaited<ReturnType<typeof buildFromProviderText>>

const PRODUCTS: CommerceProductFactV1[] = normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? []
const GROUNDING = { productCount: 24, categoryKeys: ["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"], maxPages: 12 }
const FIXTURE = loadCf3bCall3FixtureV1()
const CALL3 = FIXTURE.providerOutput as { pages: Array<{ purpose: string; sections: Array<Json & { role: string; intent: string; layout?: unknown; composition?: GraphSectionV1; copy?: Record<string, string> }> }> }

let replay: Promise<Run> | undefined
const replayRun = () => (replay ??= buildFromProviderText(JSON.stringify(FIXTURE.providerOutput)))

const roots = (tree: EditorTree): EditorNode[] => tree.nodes[tree.rootId].children.map((id) => tree.nodes[id])
const pageTree = (run: Run, slug: string) => run.plan.pages.find((page) => page.slug === slug)!.tree as EditorTree

function withSection(mutate: (section: Json) => void, sectionIndex = 1): Json {
  const blueprint = fixtureLegacyV1()
  mutate((blueprint.pages as Array<{ sections: Json[] }>)[0].sections[sectionIndex])
  return blueprint
}
function withTrust(layout: unknown): Json {
  const blueprint = fixtureLegacyV1()
  ;(blueprint.pages as Array<{ sections: Json[] }>)[0].sections.splice(2, 0, { intent: "trust", role: "trust", layout })
  return blueprint
}

// ─── LAYOUT ────────────────────────────────────────────────────────────────────

test("layout A: a well-formed layout on a role with NO layout vocabulary is dropped with a warning; section + blueprint survive", () => {
  const result = validateFullSiteCreativeBlueprintV1(withTrust({ kind: "card-grid" }), GROUNDING)
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  const trust = result.blueprint.pages[0].sections[2]
  assert.equal(trust.role, "trust")
  assert.equal(trust.layout, undefined)
  assert.ok(result.warnings.includes("pages[0].sections[2].layout: inapplicable_layout_dropped; role trust no admite layout, se ignora."))
  for (const role of ["trust", "pricing", "process", "faq", "footer"] as SectionRole[]) assert.equal(ROLE_VISUAL_LAYOUT_VOCABULARY[role], undefined, `${role} has no layout vocabulary`)
})

test("layout A boundary: a MALFORMED layout on a no-layout role stays a hard error (no smuggling via an inapplicable field)", () => {
  for (const layout of [{ kind: "card-grid", className: "fixed inset-0" }, { kind: "card-grid", css: "x" }, { kind: "not-a-layout" }, "card-grid", { kind: "card-grid", mirror: "yes" }]) {
    const result = validateFullSiteCreativeBlueprintV1(withTrust(layout), GROUNDING)
    assert.equal(result.ok, false, JSON.stringify(layout))
    if (result.ok === false) assert.ok(result.errors.some((error) => error.includes("pages[0].sections[2].layout invalido")))
  }
})

test("layout B: unknown or wrong-role layouts on layout-capable roles remain strict (never mapped or guessed)", () => {
  for (const layout of [{ kind: "not-a-layout" }, { kind: "dramatic-closing" }, { kind: "full-bleed-media" }]) {
    const result = validateFullSiteCreativeBlueprintV1(withSection((section) => { section.layout = layout }), GROUNDING)
    assert.equal(result.ok, false, JSON.stringify(layout))
  }
})

test("layout C: valid layouts are unchanged and produce no warning", () => {
  const result = validateFullSiteCreativeBlueprintV1(fixtureLegacyV1(), GROUNDING)
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  assert.deepEqual(result.blueprint.pages[0].sections[1].layout, { kind: "card-grid" })
  assert.equal(result.warnings.some((warning) => warning.includes("inapplicable_layout_dropped")), false)
})

test("other boundaries stay fail-closed: unknown keys, unknown refs, unsafe text still reject the blueprint", () => {
  const cases: Array<(section: Json) => void> = [
    (section) => { section.className = "x" },
    (section) => { section.refs = [{ kind: "product", index: 99 }] },
    (section) => { section.refs = [{ kind: "category", key: "inventada" }] },
    (section) => { section.narrative = "<script>alert(1)</script>" },
    (section) => { section.ctaIntent = "checkout-now" },
  ]
  for (const mutate of cases) assert.equal(validateFullSiteCreativeBlueprintV1(withSection(mutate), GROUNDING).ok, false, mutate.toString())
})

// ─── ANCHOR ────────────────────────────────────────────────────────────────────

test("anchor: prompt states the exact object shape, forbids booleans, and types pinned/withCta as booleans", () => {
  const prompt = buildFullSiteCreativeSystemPromptV1()
  assert.ok(prompt.includes('"anchor":{"kind":"product","index":8}'))
  assert.ok(prompt.includes("nunca true/false ni texto"))
  assert.ok(prompt.includes("omite anchor"))
  assert.ok(prompt.includes('"anchor"?:ref'))
  assert.ok(prompt.includes('"pinned"?:boolean'))
  assert.ok(prompt.includes('"withCta"?:boolean'))
})

test("anchor: boolean anchors are still invalid at runtime and are never reinterpreted as a ref", () => {
  const graph = CALL3.pages[0].sections[2].composition!
  assert.equal((graph.regions[0] as unknown as { anchor: unknown }).anchor, true, "historical output really says anchor:true")
  const result = validateGraphSectionV1(graph, { productCount: 24, renderableProductIndexes: new Set(PRODUCTS.map((_, index) => index)), mediaProductIndexes: new Set(), categoryKeys: new Set(), hasCtaAction: true })
  assert.equal(result.ok, false)
  if (result.ok === false) assert.deepEqual([...new Set(result.diagnostics.map((diagnostic) => diagnostic.code))].sort(), ["anchor_invalid", "refs_invalid"])
})

// ─── CONTINUITY ────────────────────────────────────────────────────────────────

// Copy-only content graph: needs no renderable products, so it isolates the continuity rule.
const baseGraph = (continuityToNext?: unknown): Json => ({ version: 1, role: "content", beat: "build", density: 1, whitespace: 2, edge: "contained", ...(continuityToNext !== undefined ? { continuityToNext } : {}), regions: [{ id: "c", role: "copy", span: 12, weight: 3 }] })

test("continuity: dropped ONLY on the page's last graph section and only for a valid value; nothing else changes", () => {
  const terminal = normalizeGraphForPositionV1(baseGraph("contrast"), { index: 1, total: 2, peaksBefore: 0 })
  assert.deepEqual(terminal.normalizations, ["continuity_without_graph_successor_dropped"])
  assert.deepEqual(terminal.graph, baseGraph())
  assert.deepEqual(normalizeGraphForPositionV1(baseGraph("contrast"), { index: 0, total: 2, peaksBefore: 0 }), { graph: baseGraph("contrast"), normalizations: [] }, "successor exists -> strict, unchanged")
  assert.deepEqual(normalizeGraphForPositionV1(baseGraph("teleport"), { index: 1, total: 2, peaksBefore: 0 }).normalizations, [], "unknown value is not normalized")
  assert.deepEqual(normalizeGraphForPositionV1(baseGraph(), { index: 1, total: 2, peaksBefore: 0 }).normalizations, [])
  assert.deepEqual(normalizeGraphForPositionV1(baseGraph("contrast")).normalizations, [], "no position -> no normalization")
})

test("continuity: compiled terminal graph keeps BOTH fingerprints; unknown continuity still fails; successor case unchanged", () => {
  const context = { products: PRODUCTS, businessName: "x" } as unknown as SectionCompositionContext
  const terminal = composeSectionFromGraphV1({ graph: baseGraph("bridge"), context, position: { index: 0, total: 1, peaksBefore: 0 } })
  assert.equal(terminal.ok, true)
  if (terminal.ok === true) {
    assert.deepEqual(terminal.normalizations, ["continuity_without_graph_successor_dropped"])
    assert.equal(terminal.fingerprint, graphFingerprintV1(baseGraph() as unknown as GraphSectionV1), "fingerprint = effective (built) graph")
    assert.equal(terminal.providerFingerprint, graphFingerprintV1(baseGraph("bridge") as unknown as GraphSectionV1), "providerFingerprint = authored intent")
    assert.equal(terminal.graph.continuityToNext, undefined, "no relation fabricated")
    const meta = terminal.section.nodes[terminal.section.rootId].props.compositionGraph as Json
    assert.equal(meta.fingerprint, terminal.fingerprint)
    assert.equal(meta.providerFingerprint, terminal.providerFingerprint)
    assert.deepEqual(meta.normalizations, ["continuity_without_graph_successor_dropped"])
  }
  const unknown = composeSectionFromGraphV1({ graph: baseGraph("teleport"), context, position: { index: 0, total: 1, peaksBefore: 0 } })
  assert.equal(unknown.ok, false)
  const withSuccessor = composeSectionFromGraphV1({ graph: baseGraph("bridge"), context, position: { index: 0, total: 2, peaksBefore: 0 } })
  assert.equal(withSuccessor.ok, true)
  if (withSuccessor.ok === true) {
    assert.deepEqual(withSuccessor.normalizations, [])
    assert.equal(withSuccessor.providerFingerprint, undefined)
    assert.equal(withSuccessor.fingerprint, graphFingerprintV1(baseGraph("bridge") as unknown as GraphSectionV1), "historical meaning unchanged when nothing is normalized")
    assert.equal("providerFingerprint" in (withSuccessor.section.nodes[withSuccessor.section.rootId].props.compositionGraph as Json), false)
  }
})

// ─── CALL #3 REPLAY ────────────────────────────────────────────────────────────

test("replay input: the frozen call #3 output is intact (sha256 pinned) and carries its historical rejection", () => {
  assert.equal(FIXTURE.providerOutputSha256, "7f1ee89683f6a8b671735b69410c4385aa788a7ac39fa472535a17f94b505d6d")
  assert.deepEqual(FIXTURE.historicalLifecycle, { status: "rejected", reasonCode: "schema_invalid", reasons: ["pages[0].sections[6].layout invalido."] })
  assert.equal(FIXTURE.source.stopReason, "end_turn")
  assert.equal(FIXTURE.source.outputTokens, 6351)
})

test("replay BEFORE semantics: the ONLY pre-CF-3D layout violation is the inapplicable trust layout", () => {
  const violations = CALL3.pages.flatMap((page, pageIndex) => page.sections.flatMap((section, sectionIndex) => (section.layout !== undefined && !isValidSectionVisualLayoutPlan(section.layout, section.role as SectionRole) ? [`pages[${pageIndex}].sections[${sectionIndex}]`] : [])))
  assert.deepEqual(violations, ["pages[0].sections[6]"], "exactly the historically reported path")
  const section = CALL3.pages[0].sections[6]
  assert.equal(section.role, "trust")
  assert.deepEqual(section.layout, { kind: "card-grid" })
  assert.equal(isValidSectionVisualLayoutPlan(section.layout), true, "well-formed -> under CF-3D it degrades instead of rejecting")
})

test("replay AFTER: the exact call #3 output is ACCEPTED; 11 real pages compile", async () => {
  const run = await replayRun()
  const lifecycle = run.fullSiteCreative.lifecycle
  assert.equal(lifecycle.status, "applied")
  assert.deepEqual("warnings" in lifecycle ? lifecycle.warnings : [], ["pages[0].sections[6].layout: inapplicable_layout_dropped; role trust no admite layout, se ignora."])
  assert.equal(run.plan.pages.length, 11)
  assert.deepEqual(run.plan.pages.map((page) => page.slug), ["home", "productos", "categoria-tecnologia", "categoria-hogar", "categoria-oficina", "categoria-audio", "categoria-gaming", "categoria-accesorios", "producto-silla-ergonomica-base", "producto-audifonos-inalambricos-aria", "help"])
})

test("replay AFTER: each of the four provider graphs resolves independently and truthfully", async () => {
  const run = await replayRun()
  const fp = (pageIndex: number, sectionIndex: number) => graphFingerprintV1(CALL3.pages[pageIndex].sections[sectionIndex].composition!)
  const home = roots(pageTree(run, "home"))
  const catalog = roots(pageTree(run, "productos"))
  const tecnologia = roots(pageTree(run, "categoria-tecnologia"))

  // GRAPH 1: home navigation_discovery -- provider-valid (successor exists), V2, fingerprint unchanged.
  const g1 = home.find((node) => (node.props.compositionGraph as Json | undefined)?.fingerprint === fp(0, 1))
  assert.ok(g1, "graph 1 compiled V2 with its provider fingerprint")
  assert.equal("providerFingerprint" in (g1!.props.compositionGraph as Json), false)

  // GRAPH 2: home featured_collection -- terminal continuity normalized, anchor:true -> V1 fallback (recorded).
  const g2 = home.filter((node) => node.props.compositionGraphFallback)
  assert.equal(g2.length, 1)
  assert.deepEqual(g2[0].props.compositionGraphFallback, { codes: ["refs_invalid", "anchor_invalid"], normalizations: ["continuity_without_graph_successor_dropped"], reason: "refs_invalid" })

  // GRAPH 3: catalog navigation_discovery -- terminal continuity normalized -> effective-valid -> V2, both fingerprints.
  const g3 = catalog.find((node) => node.props.compositionGraph)!.props.compositionGraph as Json
  assert.equal(g3.providerFingerprint, fp(1, 1))
  assert.notEqual(g3.fingerprint, fp(1, 1))
  assert.deepEqual(g3.normalizations, ["continuity_without_graph_successor_dropped"])

  // GRAPH 4: categoria-tecnologia featured_collection -- anchor:true -> V1 fallback (recorded).
  const g4 = tecnologia.filter((node) => node.props.compositionGraphFallback)
  assert.equal(g4.length, 1)
  assert.deepEqual(g4[0].props.compositionGraphFallback, { codes: ["refs_invalid", "anchor_invalid"], reason: "refs_invalid" })

  const all = run.plan.pages.flatMap((page) => roots(page.tree as EditorTree))
  assert.equal(all.filter((node) => node.props.compositionGraph).length, 2)
  assert.equal(all.filter((node) => node.props.compositionGraphFallback).length, 2)
  // The two fallback sections render the provider's own grounded graph products through V1 (no invented content).
  const subtree = (tree: EditorTree, id: string): EditorNode[] => [tree.nodes[id], ...tree.nodes[id].children.flatMap((child) => subtree(tree, child))]
  const cardNames = (tree: EditorTree, node: EditorNode) => new Set(subtree(tree, node.id).filter((entry) => entry.type === "store-product-card").map((entry) => String(entry.props.productName)))
  assert.deepEqual(cardNames(pageTree(run, "home"), g2[0]), new Set([8, 9, 21, 0].map((index) => PRODUCTS[index].name)))
  assert.deepEqual(cardNames(pageTree(run, "categoria-tecnologia"), g4[0]), new Set([0, 1, 2, 3].map((index) => PRODUCTS[index].name)))
})

test("replay AFTER: V2 graphs fully survive (trace) and the warnings name every provider mistake", async () => {
  const run = await replayRun()
  for (const [pageIndex, slug] of [[0, "home"], [1, "productos"]] as const) {
    const tree = pageTree(run, slug)
    const children = tree.nodes[tree.rootId].children
    const index = children.findIndex((id) => tree.nodes[id].props.compositionGraph)
    const trace = traceGraphIntentSurvivalV1({ providerGraph: CALL3.pages[pageIndex].sections[1].composition!, tree, sectionRootId: children[index], nextSectionRootId: children[index + 1], products: PRODUCTS })
    assert.equal(trace.fingerprint && trace.beat && trace.density && trace.whitespace, true, slug)
    assert.ok(trace.spans.every((span) => span.survived), slug)
    assert.notEqual(trace.continuity, false, slug)
  }
  const warnings = run.warnings.join("\n")
  for (const expected of [
    "pages[0].sections[2]: section_products_from_graph_refs",
    "pages[2].sections[1]: section_products_from_graph_refs",
    "pages[0].sections[2].composition.continuityToNext: continuity_without_graph_successor_dropped",
    "pages[1].sections[1].composition.continuityToNext: continuity_without_graph_successor_dropped",
    "pages[0].sections[2].composition: refs_invalid,anchor_invalid",
    "pages[2].sections[1].composition: refs_invalid,anchor_invalid",
  ]) assert.ok(warnings.includes(expected), expected)
})

test("replay: copy -- 35 authored, 35 accepted by the unchanged guard; applied where a slot exists, recorded where not", async () => {
  const run = await replayRun()
  const grounded = groundedCopyTextsV1(PRODUCTS)
  let authored = 0
  let accepted = 0
  let rejected = 0
  for (const section of CALL3.pages.flatMap((page) => page.sections)) {
    if (!section.copy) continue
    authored += Object.keys(section.copy).length
    const report = guardCreativeCopyV1(section.copy, { groundedTexts: grounded })
    accepted += Object.keys(report.copy).length
    rejected += report.rejected.length
  }
  assert.deepEqual([authored, accepted, rejected], [35, 35, 0])
  const featured = CALL3.pages[0].sections[2].copy!
  const homeTexts = new Set(Object.values(pageTree(run, "home").nodes).flatMap((node) => [node.props.text, node.props.content].filter((value): value is string => typeof value === "string")))
  assert.ok(homeTexts.has(featured.headline) && homeTexts.has(featured.intro), "products-section copy reaches the compiled site (even through the V1 graph fallback)")
  // CF-3E: hero/features/trust/cta now consume copy; what still has no slot is recorded per section (observed provenance).
  const unapplied = run.plan.pages.flatMap((page) => Object.values((page.tree as EditorTree).nodes)).reduce((sum, node) => sum + ((node.props.creativeCopyProvenance as { noCompatibleSlot?: string[] } | undefined)?.noCompatibleSlot?.length ?? 0), 0)
  assert.equal(unapplied, 5, "accepted copy without a compatible slot is reported, not silently dropped")
})

test("replay: grounding -- zero unknown refs; every rendered product is a real catalog product", async () => {
  const run = await replayRun()
  const refs: Array<{ kind?: string; index?: number; key?: string }> = []
  const walk = (regions: unknown) => (Array.isArray(regions) ? regions : []).forEach((region: { refs?: typeof refs; anchor?: unknown; regions?: unknown }) => { refs.push(...(region.refs ?? [])); walk(region.regions) })
  for (const page of CALL3.pages as Array<{ target?: { kind?: string; index?: number; key?: string }; sections: Array<{ refs?: typeof refs; composition?: GraphSectionV1 }> }>) {
    if (page.target) refs.push(page.target)
    for (const section of page.sections) { refs.push(...(section.refs ?? [])); walk(section.composition?.regions) }
  }
  assert.equal(refs.filter((ref) => ref.kind === "product" && !(Number.isInteger(ref.index) && ref.index! >= 0 && ref.index! < 24)).length, 0)
  assert.equal(refs.filter((ref) => ref.kind === "category" && !GROUNDING.categoryKeys.includes(String(ref.key))).length, 0)
  assert.equal(refs.filter((ref) => ref.kind === "product-media").length, 0)
  const names = new Set(PRODUCTS.map((product) => product.name))
  for (const page of run.plan.pages) for (const node of Object.values((page.tree as EditorTree).nodes)) if (node.type === "store-product-card") assert.ok(names.has(String(node.props.productName)), String(node.props.productName))
})

test("replay review route: cf3b-call3-replay renders the replayed pages (no hand-made fixture)", async () => {
  const pages = await buildCf3ReviewPages("cf3b-call3-replay")
  const run = await replayRun()
  assert.deepEqual(pages.map((page) => page.slug), run.plan.pages.map((page) => page.slug))
  assert.equal(pages.filter((page) => page.isHome).length, 1)
})

test("a graph section the adapter cannot compile is reported, never lost silently", async () => {
  const blueprint = fixtureLegacyV1()
  ;(blueprint.pages as Array<{ sections: Json[] }>)[0].sections.splice(2, 0, { intent: "featured_collection", role: "products", composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions: [{ id: "c", role: "copy", span: 12, weight: 3 }] } })
  const run = await buildFromProviderText(providerText(blueprint))
  assert.ok(run.warnings.some((warning) => warning.includes("pages[0].sections[2].composition: graph_section_dropped_no_content")))
})

// ─── GRAPH UPTAKE PROMPT ───────────────────────────────────────────────────────

test("graph uptake prompt: primary relational mechanism, optional != exceptional, no quota, compact relational examples", () => {
  const prompt = buildFullSiteCreativeSystemPromptV1()
  assert.ok(prompt.includes("mecanismo PRINCIPAL"))
  assert.ok(prompt.includes("Opcional no significa excepcional"))
  assert.ok(prompt.includes("no agregues composition solo para sumar"))
  assert.ok(prompt.includes("una seccion realmente simple"))
  assert.ok(prompt.includes("copy span 5 + product-group span 7"))
  assert.ok(prompt.includes("single-product span 8 con anchor"))
  assert.ok(prompt.includes("span 12 (density 0-1)"))
  assert.equal(/al menos \d|minimo \d+ secciones con composition|en todas las secciones|use? graphs everywhere/i.test(prompt), false, "no quota / no use-everywhere")
  assert.equal(/OPCIONAL, por seccion: section\.composition/.test(prompt), false, "no longer framed as an exceptional escape hatch")
  assert.ok(prompt.length < 11_000, `prompt growth stays modest (${prompt.length})`)
  assert.equal((prompt.match(/"version":1,"role"/g) ?? []).length, 1, "only the schema shape line -- no full graph templates")
})

test("zz) zero network attempts across the CF-3D suite", () => {
  assert.equal(networkAttempts, 0)
})
