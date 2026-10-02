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

// CF-4B is fully offline. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-4B test: network is forbidden")
}) as typeof fetch

import {
  catalogScaleV2,
  describeMotifRelationV2,
  diagnoseMotifReproductionV2,
  getReferenceMotifLibraryV2,
  isValidReferenceMotifV2,
  MOTIF_FAMILIES_V2,
  MOTIF_MODES_V2,
  MOTIF_PURPOSES_V2,
  MOTIF_SCALES_V2,
  motifShapeSignatureV2,
  retrieveReferenceMotifsV2,
  toProviderDesignMotifsV2,
  type MotifRetrievalContextV2,
  type ReferenceMotifRegionV2,
  type ReferenceMotifV2,
} from "../../lib/orvenix-ai/design-reference/motifs"
import { MOTIF_ARCHETYPES_V2 } from "../../lib/orvenix-ai/design-reference/motifs/archetypes"
import { graphShapeSignatureV1 } from "../../lib/orvenix-ai/composer/graph/shape"
import {
  GRAPH_ALIGNMENTS_V1,
  GRAPH_ARRANGEMENTS_V1,
  GRAPH_BEATS_V1,
  GRAPH_CONTINUITIES_V1,
  GRAPH_EDGES_V1,
  GRAPH_REGION_ROLES_V1,
  GRAPH_SECTION_ROLES_V1,
  graphFingerprintV1,
  validateGraphSectionV1,
  type GraphSectionV1,
} from "../../lib/orvenix-ai/composer/graph"
import { deriveFullSiteMotifContextV1 } from "../../lib/orvenix-ai/full-site-generation/request-context"
import { buildFullSiteCreativeSystemPromptV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"
import { buildNovaMarketNewStorePreviewInputV1, runNovaMarketFullSiteDryRunV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { normalizeCommercePresentationProductsV1, type CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { loadCf3bCall3FixtureV1 } from "../../app/dev-interaction-review/cf3-fixtures"

type Json = Record<string, unknown>

const LIBRARY = getReferenceMotifLibraryV2()
const PRODUCTS: CommerceProductFactV1[] = normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? []

/** Instantiates a motif as a real graph (synthetic refs) so the CF-2 validator can judge expressibility. */
function instantiate(motif: Pick<ReferenceMotifV2, "sectionRole" | "beat" | "density" | "whitespace" | "edge" | "continuityToNext" | "regions">, productOffset = 0, idPrefix = "r"): GraphSectionV1 {
  let next = productOffset
  const region = (draft: ReferenceMotifRegionV2, id: string): Json => {
    const out: Json = { id: `${idPrefix}-${id}`, role: draft.role, span: draft.span, weight: draft.weight }
    for (const key of ["align", "arrangement", "density", "whitespace", "pinned", "withCta"] as const) if (draft[key] !== undefined) out[key] = draft[key]
    if (draft.role === "single-product") out.refs = [{ kind: "product", index: next++ }]
    if (draft.role === "product-group" && !draft.regions) out.refs = Array.from({ length: draft.arrangement === "rail" ? 5 : 3 }, () => ({ kind: "product", index: next++ }))
    if (draft.role === "category-group") out.refs = ["c-a", "c-b", "c-c"].map((key) => ({ kind: "category", key }))
    if (draft.role === "grounded-media") out.refs = [{ kind: "product-media", index: 0 }]
    if (draft.regions) out.regions = draft.regions.map((child, index) => region(child, `${id}-${index}`))
    if (draft.focal && Array.isArray(out.refs)) out.anchor = (out.refs as unknown[])[0]
    return out
  }
  return { version: 1, role: motif.sectionRole, beat: motif.beat, density: motif.density, whitespace: motif.whitespace, edge: motif.edge, ...(motif.continuityToNext ? { continuityToNext: motif.continuityToNext } : {}), regions: motif.regions.map((entry, index) => region(entry, String(index))) } as unknown as GraphSectionV1
}

const GROUNDING = { productCount: 40, renderableProductIndexes: new Set(Array.from({ length: 40 }, (_, index) => index)), mediaProductIndexes: new Set([0]), categoryKeys: new Set(["c-a", "c-b", "c-c"]), hasCtaAction: true }

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value)
  else if (Array.isArray(value)) value.forEach((entry) => strings(entry, out))
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => strings(entry, out))
  return out
}

let captured: Promise<Json> | undefined
const novaMarketRequest = () => (captured ??= (async () => {
  let context: Json | null = null
  await runNovaMarketFullSiteDryRunV1({ mode: "real", env: { NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: "1" }, authorizeRealProviderCall: true, realProvider: { providerKey: "capture", modelKey: "capture", timeoutMs: 1000, async generate(input) { context = input as Json; throw new Error("capture_only") } } })
  assert.ok(context)
  return context!
})())

// ─── contract / originality ────────────────────────────────────────────────────

test("contract: every library motif passes the closed-vocabulary validator", () => {
  assert.equal(LIBRARY.filter(isValidReferenceMotifV2).length, LIBRARY.length)
})

test("contract: free text, code, extra keys and out-of-vocabulary values are rejected", () => {
  const base = structuredClone(LIBRARY[5]) as unknown as Json
  const mutations: Array<(motif: Json & { regions: Json[]; tags: Json }) => void> = [
    (motif) => { motif.name = "Tienda Ejemplo" },
    (motif) => { motif.regions[0].className = "lg:col-span-5" },
    (motif) => { motif.regions[0].copy = "Envio gratis" },
    (motif) => { motif.tags.modes = ["hardware-store"] },
    (motif) => { motif.tags.source = "webs:ferreteria" },
    (motif) => { motif.regions[0].span = 2 },
    (motif) => { motif.regions[0].weight = 6 },
    (motif) => { motif.regions[0].role = "category-group" },
    (motif) => { motif.regions[0].focal = "yes" },
    (motif) => { motif.regions[1].regions = [{ role: "copy", span: 12, weight: 3 }] },
    (motif) => { motif.regions.forEach((region) => { region.focal = true }) },
    (motif) => { motif.motifId = "webs:tienda" },
    (motif) => { motif.edge = "#ff0000" },
  ]
  for (const mutate of mutations) {
    const copy = structuredClone(base) as Json & { regions: Json[]; tags: Json }
    mutate(copy)
    assert.equal(isValidReferenceMotifV2(copy), false, mutate.toString())
  }
})

test("originality: every string in the library is a closed vocabulary token or an opaque motif id", () => {
  const allowed = new Set<string>([...MOTIF_MODES_V2, ...MOTIF_SCALES_V2, ...MOTIF_PURPOSES_V2, ...MOTIF_FAMILIES_V2, ...GRAPH_BEATS_V1, ...GRAPH_SECTION_ROLES_V1, ...GRAPH_EDGES_V1, ...GRAPH_CONTINUITIES_V1, ...GRAPH_REGION_ROLES_V1, ...GRAPH_ALIGNMENTS_V1, ...GRAPH_ARRANGEMENTS_V1])
  for (const value of strings(LIBRARY)) assert.ok(allowed.has(value) || /^m-[a-f0-9]{10}$/.test(value), value)
})

// ─── shape signature ───────────────────────────────────────────────────────────

test("shape: same composition with different products/ids/copy -> same signature; graphFingerprintV1 still distinguishes them", () => {
  const motif = LIBRARY.find((entry) => describeMotifRelationV2(entry).focal === "single-product" && entry.regions.length >= 2)!
  const a = instantiate(motif, 0, "a")
  const b = { ...instantiate(motif, 10, "zz"), narrative: "editorial-story" } as GraphSectionV1
  assert.equal(graphShapeSignatureV1(a), graphShapeSignatureV1(b))
  assert.notEqual(graphFingerprintV1(a), graphFingerprintV1(b), "exact fingerprint semantics unchanged")
  assert.equal(graphShapeSignatureV1(a), motifShapeSignatureV2(motif), "motif and its instantiation share the shape")
})

test("shape: structural changes change the signature (span, focal, arrangement, density, beat, relative weight)", () => {
  const base = instantiate(LIBRARY.find((entry) => entry.regions.length === 2 && entry.regions.some((region) => region.arrangement === "grid"))!)
  const variants: Array<(graph: GraphSectionV1 & { regions: Json[] }) => void> = [
    (graph) => { graph.regions[0].span = 4; graph.regions[1].span = 8 },
    (graph) => { graph.regions.forEach((region) => { delete region.anchor }); (graph.regions[1] as Json).anchor = ((graph.regions[1] as { refs: unknown[] }).refs)[0] },
    (graph) => { graph.regions.forEach((region) => { if (region.arrangement) region.arrangement = "stack" }) },
    (graph) => { graph.density = graph.density === 3 ? 2 : graph.density + 1 },
    (graph) => { graph.beat = graph.beat === "build" ? "rest" : "build" },
    (graph) => { graph.regions[0].weight = (graph.regions[0].weight as number) === 5 ? 1 : 5 },
  ]
  const baseSignature = graphShapeSignatureV1(base)
  for (const mutate of variants) {
    const graph = structuredClone(base) as GraphSectionV1 & { regions: Json[] }
    mutate(graph)
    assert.notEqual(graphShapeSignatureV1(graph), baseSignature, mutate.toString())
  }
  // Relative weights: scaling both regions keeps the relation.
  const scaled = structuredClone(base) as GraphSectionV1 & { regions: Array<Json & { weight: number }> }
  if (scaled.regions.every((region) => region.weight <= 4)) {
    scaled.regions.forEach((region) => { region.weight += 1 })
    assert.equal(graphShapeSignatureV1(scaled), baseSignature)
  }
})

// ─── library quality ───────────────────────────────────────────────────────────

test("library: compact (18-30), every motif compiles through the CF-2 validator, no accidental shape duplicates", () => {
  assert.ok(LIBRARY.length >= 18 && LIBRARY.length <= 30, String(LIBRARY.length))
  for (const motif of LIBRARY) {
    const result = validateGraphSectionV1(instantiate(motif), GROUNDING)
    assert.equal(result.ok, true, `${motif.motifId}: ${result.ok === false ? JSON.stringify(result.diagnostics) : ""}`)
  }
  assert.equal(new Set(LIBRARY.map(motifShapeSignatureV2)).size, LIBRARY.length, "no duplicate shapes")
  assert.equal(new Set(LIBRARY.map((motif) => motif.motifId)).size, LIBRARY.length)
})

test("library: distributions are not degenerate", () => {
  const count = (values: string[]) => new Set(values).size
  const relations = LIBRARY.map(describeMotifRelationV2)
  assert.equal(count(LIBRARY.map((motif) => motif.family)), 4)
  assert.equal(count(LIBRARY.map((motif) => motif.beat)), 5)
  assert.equal(count(LIBRARY.map((motif) => String(motif.density))), 4)
  assert.equal(count(LIBRARY.map((motif) => String(motif.whitespace))), 4)
  assert.equal(count(LIBRARY.map((motif) => motif.edge)), 2)
  assert.equal(count(relations.flatMap((relation) => relation.arrangements)), 3)
  assert.equal(count(relations.map((relation) => relation.weightContrast)), 3)
  assert.equal(count(relations.map((relation) => relation.asymmetry)), 3)
  assert.ok(count(relations.map((relation) => relation.focal)) >= 4)
  assert.ok(count(relations.map((relation) => relation.spans)) >= 10)
})

// ─── conditioning ──────────────────────────────────────────────────────────────

const commerceContext = (extra: Partial<MotifRetrievalContextV2> = {}): MotifRetrievalContextV2 => ({ ...MOTIF_ARCHETYPES_V2.D.context, ...extra })

test("catalog size: buckets, and authoritative count beats builder facts when supplied", () => {
  assert.deepEqual([0, 1, 8, 9, 30, 31].map(catalogScaleV2), ["none", "small", "small", "medium", "medium", "large"])
  const sample = deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6 })
  assert.deepEqual([sample.catalogCount, sample.catalogCountSource, sample.scale], [24, "builder_facts", "medium"])
  const total = deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6, catalogTotalCount: 120 })
  assert.deepEqual([total.catalogCount, total.catalogCountSource, total.scale, total.densityPreference], [120, "authoritative", "large", "rich"])
})

test("conditioning: Creative Director tone/density and content richness feed the context (no industry strings)", () => {
  const direction = (tone: string, density: string) => ({ tone, density }) as never
  assert.equal(deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6, creativeDirection: direction("formal", "compact") }).restrained, true)
  assert.equal(deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6, creativeDirection: direction("formal", "compact") }).densityPreference, "rich")
  assert.equal(deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6, creativeDirection: direction("playful", "spacious") }).secondaryMode, "editorial")
  assert.equal(deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6, creativeDirection: direction("playful", "spacious") }).densityPreference, "sparse")
  const keys = Object.keys(deriveFullSiteMotifContextV1({ products: PRODUCTS, categoryCount: 6 }))
  assert.equal(keys.some((key) => /industry/i.test(key)), false)
})

test("media gating: media-dependent motifs are never eligible without grounded media", () => {
  const media = LIBRARY.filter((motif) => motif.tags.requiresMedia)
  assert.ok(media.length >= 2)
  const without = retrieveReferenceMotifsV2(commerceContext({ hasGroundedMedia: false }), { count: 6 })
  assert.equal(without.selections.some((selection) => selection.motif.tags.requiresMedia), false)
  const withMedia = retrieveReferenceMotifsV2(commerceContext({ hasGroundedMedia: true }), { count: 6 })
  assert.ok(withMedia.eligibleCount > without.eligibleCount, "media motifs become eligible only with grounded media")
})

test("category and product gating: no category motifs below 2 categories; no product motifs without a catalog", () => {
  const fewCategories = retrieveReferenceMotifsV2(commerceContext({ categoryCount: 1 }))
  assert.equal(fewCategories.selections.some((selection) => selection.motif.tags.requiresCategories), false)
  const service = retrieveReferenceMotifsV2(MOTIF_ARCHETYPES_V2.A.context)
  assert.equal(service.selections.some((selection) => selection.motif.sectionRole === "products"), false)
})

test("page purpose: selections are limited to motifs that serve the requested purposes", () => {
  for (const purposes of [["catalog"], ["home"], ["category"], ["product_detail"]] as const) {
    const result = retrieveReferenceMotifsV2(commerceContext({ purposes: [...purposes] }))
    assert.ok(result.selections.length >= 1, purposes.join())
    for (const selection of result.selections) assert.ok(selection.motif.tags.purposes.includes(purposes[0]), `${purposes[0]} <- ${selection.motif.motifId}`)
  }
  const catalog = retrieveReferenceMotifsV2(commerceContext({ purposes: ["catalog"] }))
  assert.ok(catalog.selections.some((selection) => selection.motif.density >= 2), "catalog retrieves dense relations")
  const detail = retrieveReferenceMotifsV2(commerceContext({ purposes: ["product_detail"] }))
  assert.ok(detail.selections.every((selection) => describeMotifRelationV2(selection.motif).focal === "none"), "detail pages only get supporting relations (the detail surface itself is not graph-authored)")
})

// ─── retrieval behavior ────────────────────────────────────────────────────────

test("deterministic: same context -> same selection, independent of library order", () => {
  const a = retrieveReferenceMotifsV2(MOTIF_ARCHETYPES_V2.D.context).selections.map((selection) => selection.motif.motifId)
  const b = retrieveReferenceMotifsV2(MOTIF_ARCHETYPES_V2.D.context, { library: [...LIBRARY].reverse() }).selections.map((selection) => selection.motif.motifId)
  assert.deepEqual(a, b)
})

test("structural MMR: a library full of 5/7 splits does not return six 5/7 splits", () => {
  const split = LIBRARY.find((motif) => describeMotifRelationV2(motif).spans === "5/7" && motif.sectionRole === "products")!
  const clones: ReferenceMotifV2[] = [0, 1, 2, 3, 4, 5].map((index) => ({ ...structuredClone(split), motifId: `m-${String(index).repeat(10)}`, whitespace: index % 2 ? 2 : 3 }))
  const result = retrieveReferenceMotifsV2(commerceContext(), { library: [...clones, ...LIBRARY] })
  const fiveSeven = result.selections.filter((selection) => describeMotifRelationV2(selection.motif).spans === "5/7")
  assert.ok(fiveSeven.length <= 2, String(fiveSeven.length))
  assert.ok(result.selections.length >= 4)
  for (const selection of result.selections.slice(1)) assert.ok(selection.rationale.length >= 1)
})

test("four archetypes receive materially different motif sets", () => {
  const sets = Object.fromEntries(Object.entries(MOTIF_ARCHETYPES_V2).map(([key, archetype]) => [key, retrieveReferenceMotifsV2(archetype.context).selections.map((selection) => selection.motif.motifId)]))
  const keys = Object.keys(sets)
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const overlap = sets[keys[i]].filter((id) => sets[keys[j]].includes(id)).length
      assert.ok(overlap < Math.min(sets[keys[i]].length, sets[keys[j]].length), `${keys[i]}/${keys[j]} overlap ${overlap}`)
    }
  }
  assert.ok(new Set(Object.values(sets).flat()).size >= 12, "the four contexts together cover a broad part of the library")
  assert.ok(sets.B.length >= 4 && sets.C.length >= 4 && sets.D.length >= 4)
  assert.ok(sets.A.length >= 2, "a sparse service site honestly has few distinct expressible relations (content graphs: copy/category/cta)")
})

test("CF-4C hook: avoided shape signatures are down-weighted, not hidden", () => {
  const base = retrieveReferenceMotifsV2(MOTIF_ARCHETYPES_V2.D.context)
  const first = base.selections[0]
  const avoided = retrieveReferenceMotifsV2({ ...MOTIF_ARCHETYPES_V2.D.context, avoidShapeSignatures: [first.shapeSignature] })
  const again = avoided.selections.find((selection) => selection.motif.motifId === first.motif.motifId)
  assert.ok(!again || again.relevance < first.relevance)
  assert.notEqual(avoided.selections[0].motif.motifId, first.motif.motifId)
})

// ─── provider request ──────────────────────────────────────────────────────────

test("NovaMarket request: 4-6 de-identified motifs (no media motifs), slim references, no retrieval diagnostics", async () => {
  const context = await novaMarketRequest()
  const motifs = context.designMotifs as Array<Json & { label: string; regions: Array<{ role: string }> }>
  assert.ok(motifs.length >= 4 && motifs.length <= 6)
  assert.deepEqual(motifs.map((motif) => motif.label), ["A", "B", "C", "D", "E", "F"].slice(0, motifs.length))
  for (const motif of motifs) {
    assert.deepEqual(Object.keys(motif).filter((key) => !["label", "purposes", "beat", "role", "density", "whitespace", "edge", "continuityToNext", "regions"].includes(key)), [])
    assert.equal(JSON.stringify(motif).includes("grounded-media"), false, "NovaMarket has no product images")
  }
  const references = context.designReferences as Json[]
  assert.ok(references.length >= 2)
  for (const reference of references) assert.deepEqual(Object.keys(reference), ["personality", "density", "hero", "traits"])
  const serialized = JSON.stringify(context)
  for (const forbidden of ["relevanceScore", "diversityReason", "contributionRoles", "webs:", "motifId", "\"family\"", "requiresMedia", "sourcePath"]) assert.equal(serialized.includes(forbidden), false, forbidden)
  assert.equal(/"m-[a-f0-9]{10}"/.test(serialized), false, "no motif ids reach the provider")
})

test("NovaMarket request: total input shrinks vs CF-3 while gaining relational structure", async () => {
  const context = await novaMarketRequest()
  const requestChars = JSON.stringify(context).length
  const promptChars = buildFullSiteCreativeSystemPromptV1().length
  assert.ok(requestChars + promptChars < 14_107 + 10_522, `${requestChars} + ${promptChars}`)
  assert.ok(JSON.stringify(context.designMotifs).length < 2_000)
})

test("provider projection keeps only relation fields and allowed purposes", () => {
  const selections = retrieveReferenceMotifsV2(MOTIF_ARCHETYPES_V2.D.context).selections
  const projected = toProviderDesignMotifsV2(selections, ["home", "catalog"])
  for (const motif of projected) for (const purpose of motif.purposes) assert.ok(["home", "catalog"].includes(purpose))
  assert.equal(JSON.stringify(projected).includes("motifId"), false)
})

test("prompt: motifs are relational inspiration to synthesize, never templates or a quota", () => {
  const prompt = buildFullSiteCreativeSystemPromptV1()
  for (const phrase of ["MOTIVOS (designMotifs A-F)", "no plantillas", "al menos dos motivos", "no reproduzcas un motivo entero", "varia el arco de pagina", "paginas hermanas", "No son cuota"]) assert.ok(prompt.includes(phrase), phrase)
  assert.equal(/al menos \d|minimo \d+ secciones con composition|en todas las secciones/i.test(prompt), false)
})

// ─── originality diagnostic ────────────────────────────────────────────────────

test("originality diagnostic: flags pages/sites that merely reproduce one supplied motif; silent otherwise", async () => {
  const motif = LIBRARY.find((entry) => entry.sectionRole === "products" && entry.beat === "build")!
  const copyPage = { path: "pages[0]", graphs: [instantiate(motif, 0, "a"), instantiate(motif, 6, "b")] }
  const warnings = diagnoseMotifReproductionV2([copyPage, { path: "pages[1]", graphs: [instantiate(motif, 12, "c")] }], [motif])
  assert.ok(warnings.some((warning) => warning.startsWith("pages[0]: motif_reproduced_on_page")))
  assert.ok(warnings.some((warning) => warning.startsWith("site: motif_repeated_across_site")))
  const other = LIBRARY.find((entry) => entry.sectionRole === "products" && motifShapeSignatureV2(entry) !== motifShapeSignatureV2(motif))!
  assert.deepEqual(diagnoseMotifReproductionV2([{ path: "pages[0]", graphs: [instantiate(motif), instantiate(other)] }], [motif, other]), [])
  // The real call #3 output does not reproduce the motifs NovaMarket now receives.
  const call3 = loadCf3bCall3FixtureV1().providerOutput as { pages: Array<{ sections: Array<{ composition?: GraphSectionV1 }> }> }
  const context = await novaMarketRequest()
  const pages = call3.pages.map((page, index) => ({ path: `pages[${index}]`, graphs: page.sections.flatMap((section) => (section.composition ? [section.composition] : [])) }))
  assert.deepEqual(diagnoseMotifReproductionV2(pages, (context.designMotifs as Array<Json & { role: "products" | "content" }>).map((entry) => ({ ...entry, sectionRole: entry.role }) as never)), [])
})

test("zz) zero network attempts across the CF-4B suite", () => {
  assert.equal(networkAttempts, 0)
})
