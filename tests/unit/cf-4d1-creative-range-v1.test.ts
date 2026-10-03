import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
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

// CF-4D.1 is fully offline. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-4D.1 test: network is forbidden")
}) as typeof fetch

import { composeSectionFromGraphV1, graphSectionMaxWidthV1, surfaceRelationForContinuityV1, validateGraphSectionV1, type GraphSectionV1 } from "../../lib/orvenix-ai/composer/graph"
import { graphShapeSignatureV1 } from "../../lib/orvenix-ai/composer/graph/shape"
import type { ComposedNode, SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import { FULL_SITE_GRAPH_AUTHORING_LIMITS_V1, buildFullSiteCommerceCapabilityManifestV1 } from "../../lib/orvenix-ai/full-site-generation/capability-manifest"
import { buildFullSiteCreativeSystemPromptV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"
import { validateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/validator"
import { buildFullSiteCreativeRequestV1, retrieveFullSiteCommerceDesignReferencesV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import { motifShapeSignatureV2 } from "../../lib/orvenix-ai/design-reference/motifs"
import { CF4D_OFFLINE_FIXTURES, analyzeCall3BaselineV1, novaMarketInputV1, runWithSimulatedArchitectV1, type Cf4dOfflineFixtureKey, type Cf4dOfflineRunV1 } from "../../app/dev-motif-review/cf4d-fixtures"
import { novaMarketProductsV1 } from "../../app/dev-motif-review/memory-fixtures"
import type { EditorTree } from "../../types/editor"

type Json = Record<string, unknown>

const CONTEXT = { products: [], businessName: "x", commerceCategoryLinks: [{ label: "Audio", href: "/c/audio" }, { label: "Hogar", href: "/c/hogar" }] } as unknown as SectionCompositionContext
const CATEGORIES = [{ kind: "category", key: "audio" }, { kind: "category", key: "hogar" }]
/** copy + category-group: the contract allows ONE copy region per section. */
const pair = (first: Json, last: Json): Json[] => [{ id: "first", role: "copy", weight: 3, ...first }, { id: "last", role: "category-group", weight: 2, refs: CATEGORIES, ...last }]
const copyGraph = (fields: Partial<GraphSectionV1>, regions: Json[] = [{ id: "c", role: "copy", span: 6, weight: 3 }]): GraphSectionV1 => ({ version: 1, role: "content", beat: "build", density: 1, whitespace: 2, edge: "contained", regions, ...fields } as unknown as GraphSectionV1)

function compiledRoot(graph: GraphSectionV1, previousContinuity?: "continue" | "contrast" | "bridge") {
  const result = composeSectionFromGraphV1({ graph, context: CONTEXT, ...(previousContinuity ? { previousContinuity } : {}) })
  if (result.ok === false) throw new Error(JSON.stringify(result.diagnostics))
  return { root: result.section.nodes[result.section.rootId], nodes: result.section.nodes }
}

function subtree(nodes: Record<string, ComposedNode>, id: string): ComposedNode[] {
  const node = nodes[id]
  return node ? [node, ...node.children.flatMap((child) => subtree(nodes, child))] : []
}

// ─── primitive: beat / edge presentation ───────────────────────────────────────

test("arc presentation: peak and bleed read as a band, rest/close breathe narrower; explicit continuity stays authoritative", () => {
  assert.equal(surfaceRelationForContinuityV1(undefined, "products", { beat: "peak", edge: "contained" }), "soft")
  assert.equal(surfaceRelationForContinuityV1(undefined, "products", { beat: "build", edge: "bleed" }), "soft")
  assert.equal(surfaceRelationForContinuityV1(undefined, "products", { beat: "build", edge: "contained" }), "continuous")
  assert.equal(surfaceRelationForContinuityV1("continue", "products", { beat: "peak", edge: "bleed" }), "continuous", "explicit continuity wins")
  assert.equal(surfaceRelationForContinuityV1("contrast", "content", { beat: "rest" }), "contrast")
  assert.deepEqual((["open", "build", "peak", "rest", "close"] as const).map((beat) => graphSectionMaxWidthV1(beat, "contained")), ["xl", "xl", "xl", "lg", "lg"])
  assert.equal(graphSectionMaxWidthV1("rest", "bleed"), "full")
  const props = (fields: Partial<GraphSectionV1>) => compiledRoot(copyGraph(fields)).root.props
  assert.equal(props({ beat: "close", density: 0 }).paddingY, "xl")
  assert.equal(props({ beat: "close", density: 0 }).maxWidth, "lg")
  assert.equal(props({ beat: "rest", density: 0 }).maxWidth, "lg")
  assert.equal(props({ edge: "bleed" }).maxWidth, "full")
  assert.equal(props({ beat: "build" }).maxWidth, "xl")
})

// ─── primitive: void between regions ───────────────────────────────────────────

test("void between: a trailing 'end' region on a partial row starts at 13 - span; DOM order unchanged; mobile is one column", () => {
  const { root, nodes } = compiledRoot(copyGraph({}, pair({ span: 4 }, { span: 5, align: "end" })))
  const cells = subtree(nodes, root.tempId).filter((node) => /^min-w-0 lg:col-span-/.test(String(node.props.className ?? "")))
  assert.equal(cells.length, 2)
  assert.equal(String(cells[0].props.className).includes("lg:col-start-"), false, "first region keeps its place")
  assert.ok(String(cells[1].props.className).split(/\s+/).includes("lg:col-start-8"), String(cells[1].props.className))
  const row = Object.values(nodes).find((node) => node.children.includes(cells[0].tempId))!
  assert.deepEqual(row.children, [cells[0].tempId, cells[1].tempId], "reading order = authored order")
  assert.ok(String(row.props.className).startsWith("grid grid-cols-1 "), "below lg: one column, the void disappears")
  for (const cell of cells) for (const token of String(cell.props.className).split(/\s+/)) assert.ok(token === "min-w-0" || token.startsWith("lg:") || token === "", token)
})

test("void between: unchanged geometry when the row is full, when the first region is shifted, or with a single region", () => {
  const classesOf = (regions: Json[]) => { const { root, nodes } = compiledRoot(copyGraph({}, regions)); return subtree(nodes, root.tempId).filter((node) => /^min-w-0 lg:col-span-/.test(String(node.props.className ?? ""))).map((node) => String(node.props.className)) }
  assert.equal(classesOf(pair({ span: 5 }, { span: 7, align: "end" })).some((value) => value.includes("col-start")), false, "full row: no gap")
  const shifted = classesOf(pair({ span: 4, align: "end" }, { span: 4, align: "end" }))
  assert.ok(shifted[0].includes("lg:col-start-5"), "first region 'end' keeps the CF-2 leading offset")
  assert.equal(shifted[1].includes("col-start"), false)
  assert.equal(classesOf([{ id: "a", role: "copy", span: 6, weight: 3, align: "end" }])[0].includes("lg:col-start-7"), true, "single region keeps CF-2 behavior")
})

// ─── strictness / authority ────────────────────────────────────────────────────

test("no new provider authority: overlap/offset/gap/style keys stay unknown; geometry comes only from bounded maps", () => {
  const grounding = { productCount: 0, renderableProductIndexes: new Set<number>(), mediaProductIndexes: new Set<number>(), categoryKeys: new Set<string>(), hasCtaAction: true }
  for (const extra of [{ overlap: "slight" }, { offset: 2 }, { gap: 3 }, { style: "x" }, { zIndex: 9 }]) {
    const result = validateGraphSectionV1(copyGraph({}, [{ id: "a", role: "copy", span: 6, weight: 3, ...extra }]), grounding)
    assert.equal(result.ok, false, JSON.stringify(extra))
  }
  const { root, nodes } = compiledRoot(copyGraph({}, pair({ id: "zz-unique-id", span: 4 }, { id: "yy-unique-id", span: 5, align: "end" })))
  const classes = subtree(nodes, root.tempId).map((node) => String(node.props.className ?? "")).join(" ")
  assert.equal(/unique-id|style=|z-\[|absolute|-mt-|-ml-/.test(classes), false, "no provider strings, no overlap geometry")
  assert.equal(subtree(nodes, root.tempId).some((node) => node.type === "heading" && node.props.level === 1), false, "graph sections never claim the page H1")
})

// ─── budget policy ─────────────────────────────────────────────────────────────

test("graph budget: 6 per page, 32 per site (was 16); excess still dropped with a warning; manifest + prompt advertise it truthfully", () => {
  assert.deepEqual([FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerPage, FULL_SITE_GRAPH_AUTHORING_LIMITS_V1.maxGraphSectionsPerSite], [6, 32])
  assert.equal(buildFullSiteCommerceCapabilityManifestV1().compositionGraph.maxGraphSectionsPerSite, 32)
  assert.ok(buildFullSiteCreativeSystemPromptV1().includes("6 secciones con composition por pagina y 32 por sitio"))
  const graph = { version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions: [{ id: "g", role: "product-group", span: 12, weight: 3, refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }] }] }
  const keys = ["a", "b", "c", "d", "e", "f"]
  const sections = (count: number) => Array.from({ length: count }, () => ({ intent: "collection", role: "products", refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }], composition: graph }))
  const site = { version: 1, roleKey: "full_site_creative_blueprint_v1", strategyKey: "bounded_full_site_generation_v1", siteConcept: { narrative: "editorial", rhythm: "varied", density: "balanced" }, navigation: { concept: "classic" }, pages: [{ purpose: "home", sections: sections(7) }, ...keys.map((key) => ({ purpose: "category", target: { kind: "category", key }, sections: sections(6) }))] }
  const result = validateFullSiteCreativeBlueprintV1(site, { productCount: 24, categoryKeys: keys, maxPages: 12 })
  if (result.ok === false) return assert.fail(result.errors.join("; "))
  const kept = result.blueprint.pages.map((entry) => entry.sections.filter((section) => section.composition).length)
  assert.equal(kept[0], 6, "per-page bound")
  assert.equal(kept.reduce((sum, value) => sum + value, 0), 32, "site bound")
  // 7 + 36 authored: 1 over the page bound + 10 over the site bound, each reported.
  assert.equal(result.warnings.filter((warning) => warning.includes("limite de secciones con grafo")).length, 11, "every dropped graph is reported")
})

// ─── offline creative range proof ──────────────────────────────────────────────

let runs: Promise<Record<Cf4dOfflineFixtureKey, { before: Cf4dOfflineRunV1; after: Cf4dOfflineRunV1 }>> | undefined
const offline = () => (runs ??= (async () => {
  const out = {} as Record<Cf4dOfflineFixtureKey, { before: Cf4dOfflineRunV1; after: Cf4dOfflineRunV1 }>
  for (const key of Object.keys(CF4D_OFFLINE_FIXTURES) as Cf4dOfflineFixtureKey[]) out[key] = { before: await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input(), undefined, "cloning"), after: await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input()) }
  return out
})())

const authoredShapes = (result: Cf4dOfflineRunV1) => ((result.providerOutput.pages as Array<{ sections: Array<{ composition?: Json }> }>) ?? []).flatMap((page) => page.sections.flatMap((section) => (section.composition ? [graphShapeSignatureV1(section.composition)] : [])))
const suppliedShapes = (result: Cf4dOfflineRunV1) => new Set((result.context.designMotifs ?? []).map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role })))

test("synthesis: most authored graphs are NOT supplied-motif clones (the CF-4D baseline cloned all of them)", async () => {
  for (const [key, { before, after }] of Object.entries(await offline())) {
    const supplied = suppliedShapes(after)
    const shapes = authoredShapes(after)
    const clones = shapes.filter((shape) => supplied.has(shape)).length
    assert.ok(clones * 2 < shapes.length, `${key}: ${clones}/${shapes.length} clones`)
    assert.equal(authoredShapes(before).filter((shape) => suppliedShapes(before).has(shape)).length, authoredShapes(before).length, `${key}: baseline clones every motif`)
    assert.ok(new Set(shapes).size > new Set(authoredShapes(before)).size, `${key}: more distinct shapes`)
  }
})

test("page skeleton diversity: every page has its own skeleton where the fixture offers alternatives; no novelty warnings", async () => {
  for (const [key, { before, after }] of Object.entries(await offline())) {
    assert.equal(after.evidence.novelty.metrics.uniqueSkeletons, after.run.plan.pages.length, key)
    assert.deepEqual(after.evidence.novelty.warnings, [], key)
    assert.ok(after.evidence.novelty.metrics.uniqueSkeletons >= before.evidence.novelty.metrics.uniqueSkeletons, key)
  }
  const { B, C } = await offline()
  assert.ok(B.before.evidence.novelty.warnings.some((warning) => warning.startsWith("novelty.skeleton_repeated")))
  assert.ok(C.before.evidence.novelty.warnings.some((warning) => warning.startsWith("novelty.skeleton_repeated")))
})

test("accounting + grounding stay exact after synthesis; nothing ignored by the new budget", async () => {
  for (const [key, { after }] of Object.entries(await offline())) {
    const uptake = after.evidence.uptake
    assert.equal(after.run.fullSiteCreative.lifecycle.status, "applied", key)
    assert.equal(uptake.providerAuthoredGraphs, uptake.effectiveGraphs + uptake.fallbacks + uptake.droppedGraphSections + uptake.ignoredByValidator, key)
    assert.equal(uptake.ignoredByValidator, 0, key)
    assert.deepEqual(after.evidence.grounding, { unknownProductRefs: 0, unknownCategoryRefs: 0, unknownMediaRefs: 0 }, key)
  }
})

test("compiled range: contained/bleed and surfaces vary inside each site; void-between cells appear where authored", async () => {
  for (const [key, { after }] of Object.entries(await offline())) {
    const roots = after.run.plan.pages.flatMap((page) => { const tree = page.tree as EditorTree; return tree.nodes[tree.rootId].children.map((id) => tree.nodes[id]).filter((node) => node.props.compositionGraph) })
    assert.ok(new Set(roots.map((node) => node.props.maxWidth)).size >= 2, `${key} widths`)
    assert.ok(new Set(roots.map((node) => node.props.background)).size >= 2, `${key} surfaces`)
  }
  const { A, B } = await offline()
  const offsets = (result: Cf4dOfflineRunV1) => result.run.plan.pages.flatMap((page) => Object.values((page.tree as EditorTree).nodes)).filter((node) => /^min-w-0 lg:col-span-\d+ lg:col-start-\d+/.test(String(node.props.className ?? ""))).length
  assert.ok(offsets(A.after) > 0 || offsets(B.after) > 0, "the void-between primitive is exercised")
})

test("grounded media composes (B only): bleed media relations from real product images; none invented elsewhere", async () => {
  const { A, B, C } = await offline()
  const mediaGraphs = (result: Cf4dOfflineRunV1) => ((result.providerOutput.pages as Array<{ sections: Array<{ composition?: { edge: string; regions: Json[] } }> }>) ?? []).flatMap((page) => page.sections.flatMap((section) => (section.composition?.regions.some((region) => region.role === "grounded-media") ? [section.composition] : [])))
  assert.ok(mediaGraphs(B.after).length >= 2)
  assert.ok(mediaGraphs(B.after).some((graph) => graph.edge === "bleed") && mediaGraphs(B.after).some((graph) => graph.edge === "contained"))
  assert.equal(mediaGraphs(A.after).length + mediaGraphs(C.after).length, 0)
  const frames = B.after.run.plan.pages.flatMap((page) => Object.values((page.tree as EditorTree).nodes)).filter((node) => node.type === "image" && String(node.props.src ?? "").startsWith("https://cdn.example.test/pixel-parque/"))
  assert.ok(frames.length > 0)
})

test("copy relations: grounded, guard-safe copy beside content applies; no claims invented", async () => {
  for (const [key, { after }] of Object.entries(await offline())) {
    assert.ok(after.evidence.copy.authoredSlots > 0, key)
    assert.equal(after.evidence.copy.appliedSlots, after.evidence.copy.authoredSlots, key)
    assert.equal(after.evidence.copy.rejectedSlots, 0, key)
  }
})

// ─── compatibility ─────────────────────────────────────────────────────────────

test("NovaMarket request: only the truthful budget capability changed (fingerprint pinned); call #3 still analyzable", async () => {
  let context = null as unknown as ReturnType<typeof buildFullSiteCreativeRequestV1>["context"]
  await runWithSimulatedArchitectV1(novaMarketInputV1()).then((result) => { context = result.context })
  assert.ok(retrieveFullSiteCommerceDesignReferencesV1().length >= 2 && novaMarketProductsV1().length === 24)
  assert.equal(context.catalog.productCount, 24)
  assert.equal(context.catalog.categories.length, 6)
  assert.equal(crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex"), "05187d95fb0878d288a3c1d7fd5adf083c88d422a77c0337d712aec67c9f4966")
  const { evidence } = await analyzeCall3BaselineV1()
  assert.deepEqual([evidence.uptake.providerAuthoredGraphs, evidence.uptake.effectiveGraphs, evidence.uptake.fallbacks], [4, 2, 2])
})

test("zz) zero network attempts across the CF-4D.1 suite", () => {
  assert.equal(networkAttempts, 0)
})
