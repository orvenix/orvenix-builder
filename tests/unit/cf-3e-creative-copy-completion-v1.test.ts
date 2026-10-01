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

// CF-3E is fully offline. Credentials deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-3E test: network is forbidden")
}) as typeof fetch

import { buildFromProviderText, fixtureLegacyV1, loadCf3bCall3FixtureV1, providerText } from "../../app/dev-interaction-review/cf3-fixtures"
import { validateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/validator"
import { guardCreativeCopyV1 } from "../../lib/orvenix-ai/full-site-generation/copy-guard"
import { groundedCopyTextsV1 } from "../../lib/orvenix-ai/full-site-generation/graph-authoring"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { normalizeCommercePresentationProductsV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import type { EditorNode, EditorTree } from "../../types/editor"

type Json = Record<string, unknown>
type Run = Awaited<ReturnType<typeof buildFromProviderText>>
type Provenance = { applied: string[]; noCompatibleSlot: string[] }

const PRODUCTS = normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? []

const roots = (tree: EditorTree): EditorNode[] => tree.nodes[tree.rootId].children.map((id) => tree.nodes[id])
const home = (run: Run) => run.plan.pages.find((page) => page.slug === "home")!.tree as EditorTree
function subtree(tree: EditorTree, id: string): EditorNode[] {
  const node = tree.nodes[id]
  return node ? [node, ...node.children.flatMap((child) => subtree(tree, child))] : []
}
const textsOf = (tree: EditorTree, id: string) => new Set(subtree(tree, id).flatMap((node) => [node.props.text, node.props.content].filter((value): value is string => typeof value === "string")))
const pageTexts = (tree: EditorTree) => textsOf(tree, tree.rootId)
const provenanceRoots = (tree: EditorTree) => roots(tree).filter((node) => node.props.creativeCopyProvenance)

// Distinctive, guard-safe provider copy (never equal to Orvenix's deterministic text).
const COPY = {
  hero: { eyebrow: "Nueva temporada", headline: "Luz nueva para tu escritorio", intro: "Piezas elegidas para que cada rincon de trabajo se sienta propio." },
  features: { headline: "Lo que hace distinta a esta tienda", intro: "Pequenas decisiones que se notan en el uso de cada dia." },
  trust: { headline: "Elegir con calma tambien es parte de comprar", intro: "Un texto de apoyo sin lugar propio en esta seccion." },
  cta: { headline: "Tu siguiente pieza te espera", intro: "Recorre el catalogo completo cuando quieras." },
}

function blueprint(copy: Partial<Record<keyof typeof COPY, Json>> = {}): Json {
  const site = fixtureLegacyV1()
  ;(site.pages as Array<{ sections: Json[] }>)[0].sections = [
    { intent: "opening", role: "hero", ...(copy.hero ? { copy: copy.hero } : {}) },
    { intent: "featured_collection", role: "products", refs: [{ kind: "product", index: 0 }, { kind: "product", index: 1 }, { kind: "product", index: 2 }] },
    { intent: "benefits", role: "features", ...(copy.features ? { copy: copy.features } : {}) },
    { intent: "trust", role: "trust", ...(copy.trust ? { copy: copy.trust } : {}) },
    { intent: "closing", role: "cta", ctaIntent: "browse", ...(copy.cta ? { copy: copy.cta } : {}) },
  ]
  return site
}

let withCopy: Promise<Run> | undefined
let withoutCopy: Promise<Run> | undefined
const fullRun = () => (withCopy ??= buildFromProviderText(providerText(blueprint(COPY))))
const controlRun = () => (withoutCopy ??= buildFromProviderText(providerText(blueprint())))

// ─── propagation per role (exact text, absent in the no-copy control) ───────────

for (const role of ["hero", "features", "trust", "cta"] as const) {
  test(`${role}: accepted provider copy reaches the final EditorTree (not coincidental)`, async () => {
    const tree = home(await fullRun())
    const control = pageTexts(home(await controlRun()))
    const texts = pageTexts(tree)
    const expected = role === "trust" ? ["headline"] : role === "features" || role === "cta" ? ["headline", "intro"] : ["eyebrow", "headline", "intro"]
    for (const slot of expected) {
      const value = (COPY[role] as Record<string, string>)[slot]
      assert.ok(texts.has(value), `${role}.${slot} rendered`)
      assert.equal(control.has(value), false, `${role}.${slot} is not Orvenix's own text`)
    }
  })
}

test("provenance: applied vs no-compatible-slot is recorded per section (trust has no intro slot)", async () => {
  const tree = home(await fullRun())
  const records = provenanceRoots(tree).map((node) => node.props.creativeCopyProvenance as Provenance)
  assert.deepEqual(records, [
    { applied: ["eyebrow", "headline", "intro"], noCompatibleSlot: [] },
    { applied: ["headline", "intro"], noCompatibleSlot: [] },
    { applied: ["headline"], noCompatibleSlot: ["intro"] },
    { applied: ["headline", "intro"], noCompatibleSlot: [] },
  ])
  assert.equal(pageTexts(tree).has(COPY.trust.intro), false, "no decorative text invented to consume the trust intro")
})

test("authority preserved: CTA label/href and trust items stay Orvenix-owned", async () => {
  const pick = (tree: EditorTree) => ({
    // Node maps are keyed by random ids: compare as sorted multisets.
    buttons: Object.values(tree.nodes).filter((node) => node.type === "ctaButton").map((node) => `${node.props.label} -> ${node.props.href}`).sort(),
    cards: Object.values(tree.nodes).filter((node) => node.type === "heading" && node.props.level === 3).map((node) => String(node.props.text)).sort(),
  })
  assert.deepEqual(pick(home(await fullRun())), pick(home(await controlRun())))
})

test("field-by-field: a missing field keeps the deterministic value; other fields still apply", async () => {
  const partial = home(await buildFromProviderText(providerText(blueprint({ hero: { headline: COPY.hero.headline } }))))
  const control = home(await controlRun())
  const heroOf = (tree: EditorTree) => roots(tree).find((node) => subtree(tree, node.id).some((entry) => entry.type === "heading" && entry.props.level === 1))!
  const partialTexts = textsOf(partial, heroOf(partial).id)
  const controlTexts = textsOf(control, heroOf(control).id)
  assert.ok(partialTexts.has(COPY.hero.headline))
  const controlTitle = subtree(control, heroOf(control).id).find((entry) => entry.type === "heading" && entry.props.level === 1)!.props.text
  assert.deepEqual([...partialTexts].filter((text) => text !== COPY.hero.headline).sort(), [...controlTexts].filter((text) => text !== controlTitle).sort(), "every other hero text is the deterministic one")
})

test("unsafe slot falls back alone: guard rejection keeps the deterministic heading, safe intro still applies", async () => {
  const run = await buildFromProviderText(providerText(blueprint({ cta: { headline: "Envio gratis en todo el pais", intro: COPY.cta.intro } })))
  const tree = home(run)
  const ctaIndex = roots(tree).findIndex((node) => node.props.creativeCopyFallback)
  const cta = roots(tree)[ctaIndex]
  assert.deepEqual(cta.props.creativeCopyFallback, [{ slot: "headline", code: "discount" }])
  assert.deepEqual(cta.props.creativeCopyProvenance, { applied: ["intro"], noCompatibleSlot: [] })
  const texts = textsOf(tree, cta.id)
  assert.equal(texts.has("Envio gratis en todo el pais"), false)
  const controlCta = roots(home(await controlRun()))[ctaIndex]
  const controlHeading = subtree(home(await controlRun()), controlCta.id).find((node) => node.type === "heading")!.props.text as string
  assert.ok(texts.has(controlHeading), "deterministic CTA heading kept")
  assert.ok(texts.has(COPY.cta.intro))
})

test("features in a split passage: copy has no section-level slot -> reported, item facts untouched", async () => {
  const site = blueprint()
  ;(site.pages as Array<{ sections: Json[] }>)[0].sections[2] = { intent: "benefits", role: "features", layout: { kind: "editorial-split" }, copy: COPY.features }
  const tree = home(await buildFromProviderText(providerText(site)))
  const record = provenanceRoots(tree).map((node) => node.props.creativeCopyProvenance as Provenance)
  assert.deepEqual(record, [{ applied: [], noCompatibleSlot: ["headline", "intro"] }])
  assert.equal(pageTexts(tree).has(COPY.features.headline), false)
})

test("no provider copy: no provenance anywhere; V1 provider blueprints and deterministic sites are unchanged", async () => {
  for (const run of [await controlRun(), await buildFromProviderText(providerText(fixtureLegacyV1())), await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())]) {
    for (const page of run.plan.pages) {
      for (const node of Object.values((page.tree as EditorTree).nodes)) {
        assert.equal(node.props.creativeCopyProvenance, undefined)
        assert.equal(node.props.creativeCopyFallback, undefined)
      }
    }
  }
})

// ─── call #3 exact replay ──────────────────────────────────────────────────────

const FIXTURE = loadCf3bCall3FixtureV1()
const CALL3 = FIXTURE.providerOutput as { pages: Array<{ sections: Array<Json & { role: string; copy?: Record<string, string> }> }> }
let replay: Promise<{ run: Run; control: Run }> | undefined
const replayRuns = () => (replay ??= (async () => {
  const stripped = JSON.parse(JSON.stringify(FIXTURE.providerOutput)) as typeof CALL3
  for (const page of stripped.pages) for (const section of page.sections) delete section.copy
  return { run: await buildFromProviderText(JSON.stringify(FIXTURE.providerOutput)), control: await buildFromProviderText(JSON.stringify(stripped)) }
})())

test("call #3 replay: 35 authored / 35 accepted / 0 rejected; 26 applied, 4 coincidental, 5 without a compatible slot", async () => {
  const { run, control } = await replayRuns()
  assert.equal(run.fullSiteCreative.lifecycle.status, "applied")
  assert.deepEqual(run.plan.pages.map((page) => page.slug), control.plan.pages.map((page) => page.slug))
  const grounded = groundedCopyTextsV1(PRODUCTS)
  const tally: Record<string, { applied: number; coincidental: number; noSlot: number }> = {}
  let authored = 0
  let accepted = 0
  let rejected = 0
  CALL3.pages.forEach((page, pageIndex) => {
    const texts = pageTexts(run.plan.pages[pageIndex].tree as EditorTree)
    const controlTexts = pageTexts(control.plan.pages[pageIndex].tree as EditorTree)
    for (const section of page.sections) {
      if (!section.copy) continue
      authored += Object.keys(section.copy).length
      const report = guardCreativeCopyV1(section.copy, { groundedTexts: grounded })
      accepted += Object.keys(report.copy).length
      rejected += report.rejected.length
      for (const value of Object.values(report.copy)) {
        const entry = (tally[section.role] ??= { applied: 0, coincidental: 0, noSlot: 0 })
        if (texts.has(value) && !controlTexts.has(value)) entry.applied += 1
        else if (texts.has(value)) entry.coincidental += 1
        else entry.noSlot += 1
      }
    }
  })
  assert.deepEqual([authored, accepted, rejected], [35, 35, 0])
  assert.deepEqual(tally, {
    hero: { applied: 15, coincidental: 4, noSlot: 0 },
    products: { applied: 2, coincidental: 0, noSlot: 0 },
    features: { applied: 1, coincidental: 0, noSlot: 4 },
    trust: { applied: 1, coincidental: 0, noSlot: 1 },
    cta: { applied: 7, coincidental: 0, noSlot: 0 },
  })
})

test("call #3 replay: compiler provenance agrees -- 5 slots recorded as noCompatibleSlot, none lost silently", async () => {
  const { run } = await replayRuns()
  const records = run.plan.pages.flatMap((page) => provenanceRoots(page.tree as EditorTree).map((node) => node.props.creativeCopyProvenance as Provenance))
  assert.equal(records.reduce((sum, record) => sum + record.noCompatibleSlot.length, 0), 5)
  assert.equal(records.reduce((sum, record) => sum + record.applied.length, 0), 30, "26 attributable + 4 identical to Orvenix's own text")
  assert.equal(run.warnings.some((warning) => warning.includes("creative_copy_not_applied_for_role")), false, "the role-based guess is replaced by observed provenance")
})

test("call #3 replay: representative chain provider value -> validated copy -> final tree text", async () => {
  const { run, control } = await replayRuns()
  const validated = validateFullSiteCreativeBlueprintV1(FIXTURE.providerOutput, { productCount: 24, categoryKeys: ["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"], maxPages: 12 })
  if (validated.ok === false) return assert.fail(validated.errors.join("; "))
  const examples: Array<[number, number, "eyebrow" | "headline" | "intro"]> = [[0, 0, "headline"], [0, 0, "eyebrow"], [0, 6, "headline"], [0, 7, "headline"], [0, 2, "intro"]]
  for (const [pageIndex, sectionIndex, slot] of examples) {
    const provider = CALL3.pages[pageIndex].sections[sectionIndex].copy![slot]
    assert.equal(validated.blueprint.pages[pageIndex].sections[sectionIndex].copy?.[slot], provider, "validator keeps it verbatim")
    assert.ok(pageTexts(run.plan.pages[pageIndex].tree as EditorTree).has(provider), `${pageIndex}.${sectionIndex}.${slot} in final tree`)
    assert.equal(pageTexts(control.plan.pages[pageIndex].tree as EditorTree).has(provider), false, `${pageIndex}.${sectionIndex}.${slot} not coincidental`)
  }
})

test("call #3 replay: graph structure unchanged by CF-3E (2 V2 graphs, 2 V1 graph fallbacks consuming products copy)", async () => {
  const { run } = await replayRuns()
  const all = run.plan.pages.flatMap((page) => roots(page.tree as EditorTree))
  assert.equal(all.filter((node) => node.props.compositionGraph).length, 2)
  const fallbacks = all.filter((node) => node.props.compositionGraphFallback)
  assert.equal(fallbacks.length, 2)
  const homeFallback = fallbacks.find((node) => (node.props.creativeCopyProvenance as Provenance | undefined)?.applied.length)
  assert.deepEqual(homeFallback?.props.creativeCopyProvenance, { applied: ["headline", "intro"], noCompatibleSlot: [] }, "a graph-fallback V1 section still consumes safe copy")
})

test("zz) zero network attempts across the CF-3E suite", () => {
  assert.equal(networkAttempts, 0)
})
