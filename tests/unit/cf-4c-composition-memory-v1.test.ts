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

// CF-4C is fully offline: no DB (mock reader client), no provider. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-4C test: network is forbidden")
}) as typeof fetch

import {
  COMPOSITION_MEMORY_LIMITS_V1,
  COMPOSITION_NOVELTY_THRESHOLDS_V1,
  deriveCompositionMemoryV1,
  diagnoseCrossGenerationNoveltyV1,
  diagnoseSiteCompositionNoveltyV1,
  emptyCompositionMemoryV1,
  pageCompositionSignatureV1,
  planCompositionSignaturesV1,
  type CompositionMemoryV1,
} from "../../lib/orvenix-ai/design-memory/composition-memory"
import { readRecentCompositionMemoryV1, type CompositionMemoryReaderClient } from "../../lib/orvenix-ai/design-memory/composition-memory-reader"
import { measureDesignGenerationDrift } from "../../lib/orvenix-ai/design-memory/edit-metrics"
import { retrieveReferenceMotifsV2, type ReferenceMotifV2 } from "../../lib/orvenix-ai/design-reference/motifs"
import { buildFullSiteCreativeRequestV1, retrieveFullSiteCommerceDesignReferencesV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import { graphShapeSignatureV1 } from "../../lib/orvenix-ai/composer/graph/shape"
import type { GraphSectionV1 } from "../../lib/orvenix-ai/composer/graph"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { buildFromProviderText, loadCf3bCall3FixtureV1 } from "../../app/dev-interaction-review/cf3-fixtures"
import { buildCf4cMemoryReviewV1, compileBlueprintPlanV1, memoryRecordV1, motifHistoryBlueprintV1, novaMarketMotifContextV1, novaMarketProductsV1 } from "../../app/dev-motif-review/memory-fixtures"
import type { EditorNode, EditorTree } from "../../types/editor"

type Json = Record<string, unknown>

const CONTEXT = novaMarketMotifContextV1()
const BASE = retrieveReferenceMotifsV2(CONTEXT)
const MOTIF_A = BASE.selections[0].motif
const MOTIF_PEAK = BASE.selections.find((selection) => selection.motif.beat === "peak" && selection.motif.sectionRole === "products")!.motif
const PRODUCTS = novaMarketProductsV1()

const plans = new Map<string, Promise<SiteCreationPlanV2>>()
function planFor(key: string, motif: ReferenceMotifV2, indexes: number[], copy?: Json): Promise<SiteCreationPlanV2> {
  if (!plans.has(key)) plans.set(key, compileBlueprintPlanV1(motifHistoryBlueprintV1(motif, indexes, copy)) as Promise<SiteCreationPlanV2>)
  return plans.get(key)!
}
const homeSignature = (plan: SiteCreationPlanV2) => pageCompositionSignatureV1(plan.pages.find((page) => page.slug === "home")!.tree)!

const requestFor = (compositionMemory?: CompositionMemoryV1 | null) => buildFullSiteCreativeRequestV1({ products: PRODUCTS, designReferences: retrieveFullSiteCommerceDesignReferencesV1(), compositionMemory })

// ─── compile-time structure ────────────────────────────────────────────────────

test("compile: every section root carries a content-free compositionToken; graph roots carry the relational shape", async () => {
  const replay = await buildFromProviderText(JSON.stringify(loadCf3bCall3FixtureV1().providerOutput))
  const call3 = loadCf3bCall3FixtureV1().providerOutput as { pages: Array<{ sections: Array<{ composition?: GraphSectionV1 }> }> }
  const names = PRODUCTS.map((product) => product.name)
  for (const page of replay.plan.pages) {
    const tree = page.tree as EditorTree
    for (const id of tree.nodes[tree.rootId].children) {
      const token = tree.nodes[id].props.compositionToken
      assert.equal(typeof token, "string", `${page.slug} section without token`)
      assert.ok(!names.some((name) => String(token).includes(name)))
    }
  }
  const homeGraph = (replay.plan.pages[0].tree as EditorTree)
  const root = Object.values(homeGraph.nodes).find((node) => (node.props.compositionGraph as Json | undefined)?.fingerprint)!
  assert.equal((root.props.compositionGraph as Json).shape, graphShapeSignatureV1(call3.pages[0].sections[1].composition!))
})

// ─── signatures: canonical, content-independent, discriminating ────────────────

test("CASE D: same structure with different products and copy -> same shape, arc and skeleton", async () => {
  const a = homeSignature(await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4]))
  const b = homeSignature(await planFor("A-10-copy", MOTIF_A, [10, 11, 12, 13, 14], { headline: "Una seleccion distinta para otra temporada", intro: "Otro texto completamente distinto para la misma estructura." }))
  assert.deepEqual(a.shapes, b.shapes)
  assert.equal(a.arcSignature, b.arcSignature)
  assert.equal(a.skeletonSignature, b.skeletonSignature)
  assert.deepEqual(homeSignature(await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])), a, "deterministic")
  const serialized = JSON.stringify(a)
  for (const product of PRODUCTS) assert.equal(serialized.includes(product.name), false)
})

test("CASE E: different hierarchy with the same products -> different shape, skeleton and arc", async () => {
  const a = homeSignature(await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4]))
  const peak = homeSignature(await planFor("PEAK-0", MOTIF_PEAK, [0, 1, 2, 3, 4]))
  assert.notDeepEqual(a.shapes, peak.shapes)
  assert.notEqual(a.skeletonSignature, peak.skeletonSignature)
  assert.notEqual(a.arcSignature, peak.arcSignature, `${a.arc.join(">")} vs ${peak.arc.join(">")}`)
})

test("signatures: navigation/footer are excluded; malformed trees yield null, never throw", () => {
  for (const tree of [null, {}, { rootId: "x", nodes: {} }, { rootId: "r", nodes: { r: { children: ["s"] }, s: { props: { compositionToken: "<script>|g|x" } } } }]) assert.equal(pageCompositionSignatureV1(tree), null)
  const tree = { rootId: "r", nodes: { r: { children: ["n", "s", "f"] }, n: { props: { compositionToken: "navigation|v1|standard" } }, s: { props: { compositionToken: "hero|v1|standard" } }, f: { props: { compositionToken: "footer|v1|standard" } } } }
  assert.deepEqual(pageCompositionSignatureV1(tree)?.tokens, ["hero|v1|standard"])
})

// ─── memory derivation ────────────────────────────────────────────────────────

test("CASE A: no history -> exactly the CF-4B request (context byte-identical)", () => {
  assert.equal(JSON.stringify(requestFor(emptyCompositionMemoryV1()).context), JSON.stringify(requestFor().context))
  assert.equal(JSON.stringify(requestFor(null).context), JSON.stringify(requestFor().context))
  assert.deepEqual(requestFor().diagnostics.motifMemory.downweightedMotifIds, [])
})

test("CASE B: recent use of NovaMarket motif A down-weights it softly; a structurally different motif leads", async () => {
  const history = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const memory = deriveCompositionMemoryV1([memoryRecordV1("owner", "published", history, 1)], { ownerUserId: "owner" })
  assert.deepEqual(memory.recentShapeSignatures, [BASE.selections[0].shapeSignature])
  const withMemory = retrieveReferenceMotifsV2({ ...CONTEXT, avoidShapeSignatures: memory.recentShapeSignatures })
  assert.deepEqual(withMemory.downweightedIds, [MOTIF_A.motifId], "down-weighted, not excluded")
  assert.notEqual(withMemory.selections[0].motif.motifId, MOTIF_A.motifId)
  assert.notEqual(withMemory.selections[0].shapeSignature, BASE.selections[0].shapeSignature)
  const request = requestFor(memory)
  assert.deepEqual(request.diagnostics.motifMemory.downweightedMotifIds, [MOTIF_A.motifId])
  assert.notEqual(JSON.stringify(request.context.designMotifs), JSON.stringify(requestFor().context.designMotifs))
  // Everything except the motif selection is unchanged.
  const { designMotifs: _a, ...withRest } = request.context
  const { designMotifs: _b, ...baseRest } = requestFor().context
  void _a
  void _b
  assert.deepEqual(withRest, baseRest)
})

test("CASE C: several recent generations sharing a page skeleton are reported (diagnostic only)", async () => {
  const history = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const memory = deriveCompositionMemoryV1([1, 2, 3].map((day) => memoryRecordV1("owner", "generated", history, day)), { ownerUserId: "owner" })
  assert.ok(memory.repeatedPageSkeletonSignatures.length >= 1)
  const cross = diagnoseCrossGenerationNoveltyV1(history, memory)
  assert.ok(cross.warnings.some((warning) => warning.startsWith("novelty.history_skeleton_repeated")))
  assert.ok(cross.warnings.some((warning) => warning.startsWith("novelty.reuses_recent_skeletons")))
  assert.equal(cross.skeletonReuseRatio, 1)
})

test("CASE F: malformed / legacy (pre-CF-4C) history is ignored safely and generation still works", async () => {
  const legacy = structuredClone(await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])) as SiteCreationPlanV2
  for (const page of legacy.pages) for (const node of Object.values((page.tree as EditorTree).nodes)) {
    delete node.props.compositionToken
    if (node.props.compositionGraph) delete (node.props.compositionGraph as Json).shape
  }
  const memory = deriveCompositionMemoryV1([
    memoryRecordV1("owner", "published", null, 1),
    memoryRecordV1("owner", "published", { pages: "nope" }, 2),
    memoryRecordV1("owner", "published", legacy, 3),
    { userId: "owner", status: "published", initialPlan: { pages: [{ tree: { rootId: 1 } }] } },
  ], { ownerUserId: "owner" })
  assert.equal(memory.usableCount, 0)
  assert.deepEqual(memory.recentShapeSignatures, [])
  assert.equal(JSON.stringify(requestFor(memory).context), JSON.stringify(requestFor().context))
  // The legacy plan still measures drift exactly as before (no composition member).
  assert.equal("composition" in measureDesignGenerationDrift(legacy, { pages: legacy.pages.map((page) => ({ slug: page.slug, tree: page.tree as EditorTree })) }), false)
})

test("CASE G: another user's history never influences retrieval (derivation and reader)", async () => {
  const history = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  assert.deepEqual(deriveCompositionMemoryV1([memoryRecordV1("intruder", "published", history, 1)], { ownerUserId: "owner" }), emptyCompositionMemoryV1())
  const calls: unknown[] = []
  const client: CompositionMemoryReaderClient = {
    designGeneration: {
      async findMany(args) {
        calls.push(args)
        return [{ userId: "intruder", status: "published", initialPlan: history, editMetrics: null, createdAt: new Date() }]
      },
    },
  }
  const memory = await readRecentCompositionMemoryV1({ userId: "owner" }, client)
  assert.deepEqual(memory, emptyCompositionMemoryV1(), "rows of other users are dropped even if returned")
  const args = calls[0] as { where: { userId: string; status: { in: string[] } }; take: number; orderBy: Json }
  assert.equal(args.where.userId, "owner")
  assert.equal(args.take, COMPOSITION_MEMORY_LIMITS_V1.maxGenerations)
  assert.deepEqual(args.orderBy, { createdAt: "desc" })
  assert.equal(args.where.status.in.includes("abandoned"), false)
  assert.deepEqual(await readRecentCompositionMemoryV1({ userId: "" }, client), emptyCompositionMemoryV1())
  const failing: CompositionMemoryReaderClient = { designGeneration: { async findMany() { throw new Error("db down") } } }
  assert.deepEqual(await readRecentCompositionMemoryV1({ userId: "owner" }, failing), emptyCompositionMemoryV1(), "fail-open")
})

test("bounded + weighted: newest 8 generations; one unaccepted generation is not 'recent', two are; abandoned is ignored", async () => {
  const history = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const other = await planFor("PEAK-0", MOTIF_PEAK, [0, 1, 2, 3, 4])
  const many = Array.from({ length: 12 }, (_, day) => memoryRecordV1("owner", "accepted", day < 4 ? history : other, day + 1))
  const bounded = deriveCompositionMemoryV1(many, { ownerUserId: "owner" })
  assert.equal(bounded.sourceCount, COMPOSITION_MEMORY_LIMITS_V1.maxGenerations)
  assert.equal(bounded.observedShapeSignatures.includes(homeSignature(history).shapes[0]), false, "older than the newest 8")
  const single = deriveCompositionMemoryV1([memoryRecordV1("owner", "generated", history, 1)], { ownerUserId: "owner" })
  assert.deepEqual(single.recentShapeSignatures, [])
  assert.deepEqual(single.observedShapeSignatures, homeSignature(history).shapes)
  const twice = deriveCompositionMemoryV1([memoryRecordV1("owner", "generated", history, 1), memoryRecordV1("owner", "generated", history, 2)], { ownerUserId: "owner" })
  assert.deepEqual(twice.recentShapeSignatures, homeSignature(history).shapes)
  assert.equal(deriveCompositionMemoryV1([memoryRecordV1("owner", "abandoned", history, 1)], { ownerUserId: "owner" }).sourceCount, 0)
})

// ─── owner-edit survival (positive memory, kept separate) ─────────────────────

test("survival: copy/visual edits keep a composition; structural edits or removal do not; renamed pages are not guessed", async () => {
  const plan = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const shape = homeSignature(plan).shapes[0]
  const pages = () => plan.pages.map((page) => ({ slug: page.slug, tree: structuredClone(page.tree) as EditorTree }))
  const graphRoot = (tree: EditorTree) => tree.nodes[tree.rootId].children.find((id) => (tree.nodes[id].props.compositionGraph as Json | undefined)?.shape)!
  const subtree = (tree: EditorTree, id: string): EditorNode[] => [tree.nodes[id], ...tree.nodes[id].children.flatMap((child) => subtree(tree, child))]
  const composition = (current: ReturnType<typeof pages>) => measureDesignGenerationDrift(plan, { pages: current }).composition!

  assert.deepEqual(composition(pages()).survivingShapeSignatures, [shape])

  const copyEdited = pages()
  const home = copyEdited[0].tree
  const textNode = subtree(home, graphRoot(home)).find((node) => typeof node.props.text === "string" || typeof node.props.content === "string")!
  textNode.props = { ...textNode.props, ...(typeof textNode.props.text === "string" ? { text: "Texto editado por el dueno" } : { content: "Texto editado por el dueno" }) }
  assert.deepEqual(composition(copyEdited).survivingShapeSignatures, [shape], "copy edits keep the composition")

  const restructured = pages()
  const restructuredHome = restructured[0].tree
  const parent = subtree(restructuredHome, graphRoot(restructuredHome)).find((node) => node.children.length >= 2)!
  const dropped = parent.children[parent.children.length - 1]
  parent.children = parent.children.slice(0, -1)
  delete restructuredHome.nodes[dropped]
  assert.deepEqual(composition(restructured).restructuredShapeSignatures, [shape])

  const removed = pages()
  const removedHome = removed[0].tree
  const rootId = graphRoot(removedHome)
  removedHome.nodes[removedHome.rootId].children = removedHome.nodes[removedHome.rootId].children.filter((id) => id !== rootId)
  delete removedHome.nodes[rootId]
  assert.deepEqual(composition(removed).removedShapeSignatures, [shape])

  const renamed = pages().map((page) => (page.slug === "home" ? { ...page, slug: "inicio" } : page))
  const renamedResult = composition(renamed)
  assert.equal(renamedResult.unmatchedSections, 1)
  assert.deepEqual(renamedResult.survivingShapeSignatures, [])
})

test("positive memory is separate: surviving shapes are recorded, never turned into avoidance by themselves", async () => {
  const plan = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const metrics = measureDesignGenerationDrift(plan, { pages: plan.pages.map((page) => ({ slug: page.slug, tree: page.tree as EditorTree })) })
  const memory = deriveCompositionMemoryV1([memoryRecordV1("owner", "published", plan, 1, JSON.parse(JSON.stringify(metrics)))], { ownerUserId: "owner" })
  assert.deepEqual(memory.survivingShapeSignatures, homeSignature(plan).shapes)
  const fakeOnlySurvival = deriveCompositionMemoryV1([memoryRecordV1("owner", "published", null, 1, { composition: { version: 1, survivingShapeSignatures: homeSignature(plan).shapes } })], { ownerUserId: "owner" })
  assert.deepEqual(fakeOnlySurvival.recentShapeSignatures, [], "survival alone does not avoid")
})

// ─── within-site diagnostics ──────────────────────────────────────────────────

function syntheticPlan(pages: string[][], shapeOf: (token: string, index: number) => string | undefined = () => undefined) {
  return {
    pages: pages.map((tokens, pageIndex) => {
      const nodes: Record<string, Json> = { root: { children: tokens.map((_, index) => `s${index}`) } }
      tokens.forEach((token, index) => {
        const shape = shapeOf(token, index)
        nodes[`s${index}`] = { props: { compositionToken: token, ...(shape ? { compositionGraph: { shape } } : {}) } }
      })
      return { slug: `p${pageIndex}`, tree: { rootId: "root", nodes } }
    }),
  }
}

test("within-site diagnostics: explicit thresholds for shape, skeleton, arc and motif reuse", () => {
  const shape = "a".repeat(64)
  const other = "b".repeat(64)
  const repeated = syntheticPlan(
    [["hero|v1|standard", "products|g|build|f:-|d:sparse|a:grid|e:contained", "cta|v1|standard"], ["hero|v1|standard", "products|g|build|f:-|d:sparse|a:grid|e:contained", "cta|v1|standard"], ["hero|v1|standard", "products|g|build|f:-|d:sparse|a:grid|e:contained", "cta|v1|standard"], ["hero|v1|standard", "content|g|rest|f:-|d:sparse|a:-|e:contained"]],
    (token, index) => (token.includes("|g|") ? (index === 1 && token.startsWith("products") ? shape : other) : undefined),
  )
  const result = diagnoseSiteCompositionNoveltyV1(repeated, { suppliedMotifShapes: [shape] })
  for (const code of ["novelty.shape_repeated", "novelty.skeleton_repeated", "novelty.arc_repeated", "novelty.motif_shapes_overused"]) assert.ok(result.warnings.some((warning) => warning.startsWith(code)), code)
  assert.equal(result.metrics.maxSkeletonRepeat, 3)
  const varied = syntheticPlan([["hero|v1|standard", "products|v1|dense-catalog"], ["hero|v1|oversized-typography", "content|g|open|f:-|d:sparse|a:grid|e:contained"], ["products|v1|product-rail", "cta|v1|standard"]], (token) => (token.includes("|g|") ? shape : undefined))
  assert.deepEqual(diagnoseSiteCompositionNoveltyV1(varied, { suppliedMotifShapes: [shape] }).warnings, [])
  assert.equal(COMPOSITION_NOVELTY_THRESHOLDS_V1.skeletonRepeatMinPages, 3)
})

test("within-site diagnostics on the real call #3 replay: honest metrics, no false alarms", async () => {
  const replay = await buildFromProviderText(JSON.stringify(loadCf3bCall3FixtureV1().providerOutput))
  const result = diagnoseSiteCompositionNoveltyV1(replay.plan)
  assert.equal(result.metrics.pages, 11)
  assert.equal(result.metrics.graphSections, 2)
  assert.deepEqual(result.warnings, [])
  assert.equal(planCompositionSignaturesV1(replay.plan).length, 11)
})

// ─── wiring + provenance safety ───────────────────────────────────────────────

test("builder wiring: memory reaches motif retrieval through the site builder; provider context carries no memory identity", async () => {
  const history = await planFor("A-0", MOTIF_A, [0, 1, 2, 3, 4])
  const memory = deriveCompositionMemoryV1([memoryRecordV1("owner-user-id-123", "published", history, 1)], { ownerUserId: "owner-user-id-123" })
  const capture = async (compositionMemory?: CompositionMemoryV1) => {
    let context: Json | null = null
    const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), ...(compositionMemory ? { compositionMemory } : {}), commerceArchitecture: { provider: { providerKey: "capture", modelKey: "capture", timeoutMs: 1000, async generate(input: unknown) { context = input as Json; throw new Error("capture_only") } } } })
    return { context: context!, run }
  }
  const without = await capture()
  const withMemory = await capture(memory)
  assert.notEqual(JSON.stringify(withMemory.context.designMotifs), JSON.stringify(without.context.designMotifs))
  assert.ok(withMemory.run.trace.some((line) => line.startsWith("Composition memory: 1/1")))
  assert.equal(without.run.trace.some((line) => line.startsWith("Composition memory")), false)
  const serialized = JSON.stringify(withMemory.context)
  for (const forbidden of ["owner-user-id-123", "compositionMemory", "recentShape", "2026-10", ...memory.recentShapeSignatures, ...memory.recentPageSkeletonSignatures]) assert.equal(serialized.includes(forbidden), false, forbidden)
  assert.deepEqual(Object.keys(withMemory.context), Object.keys(without.context))
})

test("request diagnostics expose counts and motif ids only", () => {
  const diagnostics = requestFor(deriveCompositionMemoryV1([], { ownerUserId: "owner" })).diagnostics.motifMemory
  assert.deepEqual(Object.keys(diagnostics).sort(), ["downweightedMotifIds", "recentArcCount", "recentShapeCount", "recentSkeletonCount", "repeatedSkeletonCount", "selectedMotifIds", "sourceCount", "survivingShapeCount", "usableCount"])
})

test("dev review fixture builds offline", async () => {
  const review = await buildCf4cMemoryReviewV1()
  assert.equal(review.provenance.sourceCount, 2, "the other user's record is ignored")
  assert.deepEqual(review.withMemory.downweightedIds, [MOTIF_A.motifId])
})

test("zz) zero network attempts across the CF-4C suite", () => {
  assert.equal(networkAttempts, 0)
})
