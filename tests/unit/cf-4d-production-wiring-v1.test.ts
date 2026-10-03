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

// CF-4D is fully offline: no provider, no DB. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-4D test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousSiteBuilderInput } from "../../lib/orvenix-ai/autonomous/types"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { assertSafeCf4dEvidenceV1, CF4D_EXPERIMENT_AUTHORIZATION_V1, CF4D_EXPERIMENT_CONFIG_V1, cf4dExperimentRefusalV1, runCf4dControlledExperimentV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/cf4d-experiment"
import { deriveCompositionMemoryV1, emptyCompositionMemoryV1, type CompositionMemoryV1 } from "../../lib/orvenix-ai/design-memory/composition-memory"
import { buildFullSiteCreativeSystemPromptV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"
import { compareFullSiteCreativeEvidenceV1 } from "../../lib/orvenix-ai/full-site-generation/creative-evidence"
import { deriveFullSiteMotifContextV1, type FullSiteCreativeRequestContextV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import type { FullSiteCreativeBlueprintProviderV1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import {
  analyzeCall3BaselineV1,
  CF4D_OFFLINE_FIXTURES,
  novaMarketMemoryEffectV1,
  runWithSimulatedArchitectV1,
  simulatedArchitectBlueprintV1,
  structuralProfileV1,
  type Cf4dOfflineFixtureKey,
  type Cf4dOfflineRunV1,
} from "../../app/dev-motif-review/cf4d-fixtures"
import { compileBlueprintPlanV1, memoryRecordV1, motifHistoryBlueprintV1, novaMarketMotifContextV1, novaMarketProductsV1 } from "../../app/dev-motif-review/memory-fixtures"
import { retrieveReferenceMotifsV2 } from "../../lib/orvenix-ai/design-reference/motifs"

type Json = Record<string, unknown>

/** CF-4D.1 request pin (CF-4B + site graph budget 32; the reversal chain lives in the 5c/commerce-6 pin tests). */
const CF4B_FINGERPRINT = "05187d95fb0878d288a3c1d7fd5adf083c88d422a77c0337d712aec67c9f4966"

let ownerMemory: Promise<CompositionMemoryV1> | undefined
const memoryOfMotifA = () => (ownerMemory ??= (async () => {
  const motifA = retrieveReferenceMotifsV2(novaMarketMotifContextV1()).selections[0].motif
  const history = await compileBlueprintPlanV1(motifHistoryBlueprintV1(motifA, [0, 1, 2, 3, 4]))
  return deriveCompositionMemoryV1([memoryRecordV1("owner", "published", history, 1)], { ownerUserId: "owner" })
})())

/** Runs the real builder for NovaMarket with a capture provider (no network); returns the provider request + run. */
async function capture(extra: Partial<AutonomousSiteBuilderInput> = {}) {
  let context: FullSiteCreativeRequestContextV1 | null = null
  let calls = 0
  const provider: FullSiteCreativeBlueprintProviderV1 = { providerKey: "capture", async generate(input) { calls += 1; context = input as FullSiteCreativeRequestContextV1; return simulatedArchitectBlueprintV1(context) } }
  const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), ...extra, commerceArchitecture: { provider } })
  return { context: context as unknown as FullSiteCreativeRequestContextV1, run, calls }
}

// ─── gating ────────────────────────────────────────────────────────────────────

test("gate: without a full-site provider the memory loader is never invoked (deterministic generation reads no Design Memory)", async () => {
  let reads = 0
  const loader = async () => { reads += 1; return emptyCompositionMemoryV1() }
  const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), compositionMemoryLoader: loader })
  assert.equal(run.fullSiteCreative.lifecycle.status, "disabled")
  const noProducts = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), business: { ...buildNovaMarketNewStorePreviewInputV1().business, products: [] }, compositionMemoryLoader: loader, commerceArchitecture: { provider: { async generate() { throw new Error("must not run") } } } })
  assert.equal(noProducts.fullSiteCreative.lifecycle.status, "disabled")
  assert.equal(reads, 0)
})

test("gate: an eligible full-site request reads owner memory exactly once and it conditions motif selection", async () => {
  let reads = 0
  const memory = await memoryOfMotifA()
  const withMemory = await capture({ compositionMemoryLoader: async () => { reads += 1; return memory } })
  const without = await capture()
  assert.equal(reads, 1)
  assert.notEqual(JSON.stringify(withMemory.context.designMotifs), JSON.stringify(without.context.designMotifs))
  assert.ok(withMemory.run.trace.some((line) => line.startsWith("Composition memory: 1/1")))
})

test("production action: loader bound to the authenticated session only; no provider configured (default off)", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  assert.ok(source.includes("compositionMemoryLoader: () => readRecentCompositionMemoryV1({ userId: session.user.id })"))
  assert.equal(source.includes("commerceArchitecture"), false, "the customer action configures no full-site provider")
  assert.equal(/createAnthropicFullSiteCreativeProviderV1/.test(source), false)
  assert.equal(/userId:\s*(input|body|payload|params)\./.test(source), false, "owner never comes from the payload")
})

// ─── fail-open ─────────────────────────────────────────────────────────────────

test("fail-open: throwing, malformed, slow or legacy-only memory -> exact no-memory request, generation continues, no internal error leaked", async () => {
  const baseline = await capture()
  const cases: Array<[string, () => Promise<unknown>, RegExp | null]> = [
    ["throws", async () => { throw new Error("db password=hunter2 connection refused") }, /Composition memory: no disponible$/],
    ["malformed", async () => ({ version: 1, recentShapeSignatures: ["<script>"] }), /formato invalido/],
    ["slow", () => new Promise(() => {}), /tiempo agotado/],
    ["legacy-only", async () => deriveCompositionMemoryV1([memoryRecordV1("owner", "published", { pages: [] }, 1)], { ownerUserId: "owner" }), null],
  ]
  for (const [name, loader, traceLine] of cases) {
    const result = await capture({ compositionMemoryLoader: loader as never })
    assert.equal(JSON.stringify(result.context), JSON.stringify(baseline.context), name)
    assert.equal(result.run.fullSiteCreative.lifecycle.status, "applied", name)
    if (traceLine) assert.ok(result.run.trace.some((line) => traceLine.test(line)), name)
    assert.equal(JSON.stringify(result.run).includes("hunter2"), false, `${name}: internal error never surfaces`)
  }
})

test("owner isolation: another owner's history cannot change the request", async () => {
  const motifA = retrieveReferenceMotifsV2(novaMarketMotifContextV1()).selections[0].motif
  const history = await compileBlueprintPlanV1(motifHistoryBlueprintV1(motifA, [0, 1, 2, 3, 4]))
  const foreign = deriveCompositionMemoryV1([memoryRecordV1("intruder", "published", history, 1)], { ownerUserId: "owner" })
  assert.equal(JSON.stringify((await capture({ compositionMemory: foreign })).context), JSON.stringify((await capture()).context))
})

// ─── request integrity + compatibility ─────────────────────────────────────────

test("no-memory compatibility: request identical with no loader / empty memory and still the CF-4B fingerprint; prompt unchanged", async () => {
  const plain = await capture()
  const empty = await capture({ compositionMemoryLoader: async () => emptyCompositionMemoryV1() })
  assert.equal(JSON.stringify(empty.context), JSON.stringify(plain.context))
  assert.equal(crypto.createHash("sha256").update(JSON.stringify(plain.context)).digest("hex"), CF4B_FINGERPRINT)
  assert.equal(JSON.stringify(plain.context).length, 12_427)
  assert.equal(buildFullSiteCreativeSystemPromptV1().length, 11_215)
  assert.equal(JSON.stringify(plain.context).includes("compositionMemory"), false, "no empty memory payload")
})

test("provider request integrity: facts + capabilities + slim references + motifs; memory changes motif selection ONLY", async () => {
  const memory = await memoryOfMotifA()
  const withMemory = await capture({ compositionMemory: memory })
  const without = await capture()
  assert.deepEqual(Object.keys(withMemory.context), ["outputContract", "business", "catalog", "capabilities", "designReferences", "designMotifs"])
  const strip = (context: FullSiteCreativeRequestContextV1) => { const { designMotifs: _motifs, ...rest } = context; void _motifs; return rest }
  assert.deepEqual(strip(withMemory.context), strip(without.context))
  const serialized = JSON.stringify(withMemory.context)
  for (const forbidden of ["owner", "userId", "generationId", "createdAt", "2026-", "editMetrics", "initialPlan", ...memory.recentShapeSignatures, ...memory.observedShapeSignatures, ...memory.recentPageSkeletonSignatures, ...memory.recentPageArcSignatures]) {
    assert.equal(serialized.includes(forbidden), false, forbidden)
  }
})

test("catalog count provenance: the builder path records builder facts, never 'authoritative'", () => {
  const context = deriveFullSiteMotifContextV1({ products: novaMarketProductsV1(), categoryCount: 6 })
  assert.deepEqual([context.catalogCount, context.catalogCountSource], [24, "builder_facts"])
})

test("product detail honesty: detail-tagged motifs never carry a focal relation", async () => {
  const { context } = await capture()
  for (const motif of context.designMotifs ?? []) {
    if (motif.purposes.length === 1 && motif.purposes[0] === "product_detail") assert.equal(motif.regions.some((region) => region.focal), false)
  }
})

// ─── metrics / diagnostics ─────────────────────────────────────────────────────

test("call #3 baseline recomputed from the frozen fixture (same uptake definition)", async () => {
  const { evidence, compiledPages } = await analyzeCall3BaselineV1()
  assert.equal(compiledPages, 11)
  assert.equal(evidence.compiledSectionRoots, 63)
  assert.deepEqual(evidence.uptake, { providerPages: 11, providerSections: 41, graphEligibleSections: 18, providerAuthoredGraphs: 4, effectiveGraphs: 2, fallbacks: 2, fallbackReasons: { refs_invalid: 2 }, droppedGraphSections: 0, ignoredByValidator: 0 })
  assert.deepEqual(evidence.copy, { authoredSlots: 35, appliedSlots: 30, noCompatibleSlot: 5, rejectedSlots: 0 })
  assert.deepEqual(evidence.grounding, { unknownProductRefs: 0, unknownCategoryRefs: 0, unknownMediaRefs: 0 })
  assert.deepEqual([evidence.novelty.metrics.uniqueShapes, evidence.novelty.metrics.uniqueSkeletons, evidence.novelty.metrics.uniqueArcs], [2, 11, 8])
  assert.deepEqual(evidence.novelty.warnings, [])
})

let offline: Promise<Record<Cf4dOfflineFixtureKey, Cf4dOfflineRunV1>> | undefined
const offlineRuns = () => (offline ??= (async () => {
  const out = {} as Record<Cf4dOfflineFixtureKey, Cf4dOfflineRunV1>
  for (const key of Object.keys(CF4D_OFFLINE_FIXTURES) as Cf4dOfflineFixtureKey[]) out[key] = await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input())
  return out
})())

test("offline A/B/C: applied through the real pipeline, grounded, every authored graph accounted for", async () => {
  const runs = await offlineRuns()
  for (const [key, result] of Object.entries(runs)) {
    assert.equal(result.run.fullSiteCreative.lifecycle.status, "applied", key)
    assert.deepEqual(result.evidence.grounding, { unknownProductRefs: 0, unknownCategoryRefs: 0, unknownMediaRefs: 0 }, key)
    const uptake = result.evidence.uptake
    assert.equal(uptake.providerAuthoredGraphs, uptake.effectiveGraphs + uptake.fallbacks + uptake.droppedGraphSections + uptake.ignoredByValidator, `${key} accounting`)
    assert.ok(uptake.effectiveGraphs >= 10, key)
  }
  const call3 = (await analyzeCall3BaselineV1()).evidence.uptake
  assert.equal(call3.providerAuthoredGraphs, call3.effectiveGraphs + call3.fallbacks + call3.droppedGraphSections + call3.ignoredByValidator)
  assert.equal(runs.B.context.catalog.products.filter((product) => product.hasImage).length, 14, "B's grounded media comes from bound store rows")
  assert.equal(runs.A.context.catalog.products.some((product) => product.hasImage), false)
})

test("offline A/B/C: materially different structures on several independent dimensions", async () => {
  const runs = await offlineRuns()
  const profiles = Object.fromEntries(Object.entries(runs).map(([key, result]) => [key, structuralProfileV1(result)]))
  const dims = (a: ReturnType<typeof structuralProfileV1>, b: ReturnType<typeof structuralProfileV1>) => {
    const differs = (key: keyof typeof a) => JSON.stringify([...(Array.isArray(a[key]) ? (a[key] as unknown[]) : [a[key]])].map(String).sort()) !== JSON.stringify([...(Array.isArray(b[key]) ? (b[key] as unknown[]) : [b[key]])].map(String).sort())
    return (["arcs", "shapes", "focalRoles", "densities", "whitespaces", "arrangements", "copyBesideContent", "categoryRegions", "productRegions", "bleedSections"] as const).filter(differs)
  }
  for (const [a, b] of [["A", "B"], ["A", "C"], ["B", "C"]] as const) {
    const differing = dims(profiles[a], profiles[b])
    assert.ok(differing.includes("shapes"), `${a}/${b} shapes`)
    assert.ok(differing.length >= 4, `${a}/${b}: ${differing.join(",")}`)
  }
  // CF-4D.1 (synthesizing architect): contained/bleed contrast exists inside every site, not only between sites.
  for (const profile of Object.values(profiles)) assert.ok(profile.bleedSections > 0 && profile.bleedSections < profile.densities.length)
  assert.equal(profiles.A.categoryRegions, 0, "the small editorial catalog never leads with categories")
  assert.ok(profiles.C.densities.includes(3), "only the large catalog reaches the densest relation")
})

test("novelty diagnostics are wired, non-blocking and non-retrying", async () => {
  const runs = await offlineRuns()
  for (const result of Object.values(runs)) {
    const novelty = result.run.fullSiteCreative.novelty
    assert.ok(novelty, "applied provider site carries novelty diagnostics")
    assert.equal(result.run.fullSiteCreative.lifecycle.status, "applied", "warnings never reject")
    assert.ok(result.run.trace.some((line) => line.startsWith("Novelty (diagnostico)")))
  }
  // The reproduction diagnostic fires on the CF-4D CLONING architect (verbatim motifs) -- and never blocks it.
  for (const key of Object.keys(CF4D_OFFLINE_FIXTURES) as Cf4dOfflineFixtureKey[]) {
    const cloned = await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input(), undefined, "cloning")
    assert.ok(cloned.run.fullSiteCreative.novelty!.warnings.some((warning) => warning.startsWith("novelty.motif_shapes_overused")), key)
    assert.equal(cloned.run.fullSiteCreative.lifecycle.status, "applied", key)
  }
  const once = await capture()
  assert.equal(once.calls, 1, "exactly one provider call, no retry")
  const disabled = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  assert.deepEqual(disabled.fullSiteCreative, { lifecycle: { status: "disabled", reasonCode: "disabled" }, commerceFallbackApplied: false }, "no novelty payload without a provider site")
})

test("same business (NovaMarket): identical facts, different motif selection, structurally different expressible site", async () => {
  const { withoutMemory, withMemory } = await novaMarketMemoryEffectV1()
  const strip = (context: FullSiteCreativeRequestContextV1) => { const { designMotifs: _motifs, ...rest } = context; void _motifs; return JSON.stringify(rest) }
  assert.equal(strip(withMemory.context), strip(withoutMemory.context), "facts, products, categories, capabilities identical")
  assert.notEqual(JSON.stringify(withMemory.context.designMotifs), JSON.stringify(withoutMemory.context.designMotifs))
  assert.notDeepEqual(structuralProfileV1(withMemory).shapes, structuralProfileV1(withoutMemory).shapes)
  const names = new Set(novaMarketProductsV1().map((product) => product.name))
  for (const result of [withMemory, withoutMemory]) for (const page of result.run.plan.pages) for (const node of Object.values((page.tree as unknown as { nodes: Record<string, { type: string; props: Json }> }).nodes)) if (node.type === "store-product-card") assert.ok(names.has(String(node.props.productName)))
  assert.equal(withMemory.run.fullSiteCreative.novelty?.crossGeneration?.shapeReuseRatio, 0, "the memory-conditioned site does not reuse the recent shape")
})

test("comparison contract: side-by-side rows, no aggregate score", async () => {
  const { evidence } = await analyzeCall3BaselineV1()
  const rows = compareFullSiteCreativeEvidenceV1(evidence, (await offlineRuns()).C.evidence)
  for (const metric of ["pages", "provider-authored graphs", "effective graphs", "graph fallbacks", "unique graph shapes", "unique page skeletons", "motif reproduction warnings", "copy slots applied", "unknown product refs", "request chars", "latency ms", "input tokens", "output tokens"]) assert.ok(rows.some((row) => row.metric === metric), metric)
  assert.equal(rows.some((row) => /score/i.test(row.metric)), false)
})

// ─── real-call readiness harness ───────────────────────────────────────────────

test("harness: refuses without the dev guard or the exact authorization; nothing is constructed", async () => {
  let constructed = 0
  const factory = () => { constructed += 1; return { async generate() { throw new Error("must not run") } } }
  for (const [env, authorization, reason] of [
    [{ NODE_ENV: "production", ORVENIX_DEV_ASSISTED_E2E: "1" }, CF4D_EXPERIMENT_AUTHORIZATION_V1, "harness_disabled"],
    [{ NODE_ENV: "development" }, CF4D_EXPERIMENT_AUTHORIZATION_V1, "harness_disabled"],
    [{ NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: "1" }, undefined, "not_authorized"],
    [{ NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: "1" }, "yes", "not_authorized"],
  ] as const) {
    assert.deepEqual(await runCf4dControlledExperimentV1({ env, authorization, providerFactory: factory }), { status: "refused", reason })
    assert.equal(cf4dExperimentRefusalV1({ env, authorization }), reason)
  }
  assert.equal(constructed, 0)
})

test("harness: authorized offline dry run (injected fake provider) uses the fixed config and emits safe evidence only", async () => {
  const configs: Json[] = []
  const result = await runCf4dControlledExperimentV1({
    env: { NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: "1" },
    authorization: CF4D_EXPERIMENT_AUTHORIZATION_V1,
    providerFactory: (config) => {
      configs.push(config as unknown as Json)
      return { providerKey: "offline-fake", async generate(input) { return simulatedArchitectBlueprintV1(input as FullSiteCreativeRequestContextV1) } }
    },
  })
  assert.equal(result.status, "completed")
  if (result.status !== "completed") return
  assert.equal(configs.length, 1)
  assert.deepEqual([configs[0].model, configs[0].thinkingMode, configs[0].timeoutMs, configs[0].maxTokens], ["claude-sonnet-5", "disabled", 240_000, 14_000])
  assert.equal(CF4D_EXPERIMENT_CONFIG_V1.maxRetries, 0)
  assert.equal(result.evidence.requestFingerprint, CF4B_FINGERPRINT)
  assert.equal(result.evidence.lifecycle.status, "applied")
  assert.ok(result.evidence.analysis && result.evidence.analysis.uptake.effectiveGraphs > 0)
  assert.doesNotThrow(() => assertSafeCf4dEvidenceV1(result.evidence))
  assert.throws(() => assertSafeCf4dEvidenceV1({ leaked: "sk-ant-abc" }))
  assert.throws(() => assertSafeCf4dEvidenceV1({ block: { thinking: "private reasoning" } }))
})

test("harness: never executed by importing modules; source holds no credential and no auto-run", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/assisted-generation/e2e/cf4d-experiment.ts"), "utf8")
  assert.equal(/^\s*(void\s+)?runCf4dControlledExperimentV1\(/m.test(source), false, "no top-level invocation")
  assert.equal(/ANTHROPIC_API_KEY|sk-ant-[A-Za-z0-9]/.test(source), false)
  const walk = (dir: string): string[] => fs.readdirSync(path.join(process.cwd(), dir), { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))
  const routes = walk("app")
  for (const file of routes.filter((file) => /\.(ts|tsx)$/.test(file))) assert.equal(fs.readFileSync(path.join(process.cwd(), file), "utf8").includes("runCf4dControlledExperimentV1"), false, `${file} must not expose the experiment`)
})

test("zz) zero network attempts across the CF-4D suite", () => {
  assert.equal(networkAttempts, 0)
})
