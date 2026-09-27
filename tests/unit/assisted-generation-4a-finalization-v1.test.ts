import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

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

// ASSISTED-4A finalization: zero real network. Real credentials are deleted
// (never read). fetch is a recording tripwire that never reaches the network;
// one test deliberately sets a FAKE Pexels key to prove the default provider
// path is still the Pexels one (its request is intercepted here).
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

const fetchedHosts: string[] = []
globalThis.fetch = (async (input: unknown) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : String((input as { url?: string }).url ?? "")
  try {
    fetchedHosts.push(new URL(url).hostname)
  } catch {
    fetchedHosts.push("unparseable")
  }
  throw new Error("ASSISTED-4A finalization test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { AssetProvider } from "../../lib/orvenix-ai/assets/types"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import type { CreativeSiteDirectionV1 } from "../../lib/orvenix-ai/creative-director/contract"
import type { OrvenixSiteCreationActionInput } from "../../app/actions/ai"
import { buildNovaMarketBuilderInputBaseV1, DISABLED_ASSET_PROVIDER_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { EditorNode } from "../../types/editor"

const PLACEHOLDER = "Testimonio pendiente de contenido real."

const AGENCY = {
  request: "Crea un sitio para una agencia de marketing en Monterrey",
  business: {
    name: "Agencia Fixture 4A",
    industry: "agencia de marketing",
    description: "FIXTURE: agencia de marketing digital.",
    location: "Monterrey",
    objective: "Conseguir clientes",
    services: [{ name: "Estrategia digital" }, { name: "Contenido" }, { name: "Campanas" }],
  },
}

const REAL_TESTIMONIALS = [
  { quote: "FIXTURE 4A: cita real suministrada por el negocio.", author: "Cliente Fixture Uno" },
  { quote: "FIXTURE 4A: segunda cita real.", author: "Cliente Fixture Dos", role: "Directora" },
]

function allTexts(run: AutonomousMultiPageSiteBuilderResult): string[] {
  return run.plan.pages.flatMap((page) =>
    Object.values(page.tree.nodes as Record<string, EditorNode>).map((node) => String(node.props?.text ?? node.props?.content ?? "")),
  )
}

function hasTestimonialsRole(run: AutonomousMultiPageSiteBuilderResult): boolean {
  return run.architecture.pages.some((page) => page.sections.some((section) => section.role === "testimonials"))
}

function assertValidPlan(run: AutonomousMultiPageSiteBuilderResult) {
  const revalidation = validateSiteCreationPlanV2(run.plan, { maxPages: Math.max(run.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(revalidation.ok, true)
}

// --- 1) testimonials: omitted without grounded evidence ---

test("testimonials: NovaMarket (ecommerce, no evidence) omits the section on every page -- no placeholder", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketBuilderInputBaseV1())
  assert.equal(run.architecture.siteType, "ecommerce")
  assert.equal(hasTestimonialsRole(run), false)
  assert.equal(allTexts(run).includes(PLACEHOLDER), false)
  assertValidPlan(run)
})

test("testimonials: a non-ecommerce recipe without evidence also omits it (same evidence policy, recipe untouched otherwise)", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true })
  assert.equal(hasTestimonialsRole(run), false)
  assert.equal(allTexts(run).includes(PLACEHOLDER), false)
  assertValidPlan(run)
})

test("testimonials: blank-quote evidence and the legacy business.testimonials field do not count as grounded", async () => {
  const blank = await runAutonomousMultiPageSiteBuilder({
    ...AGENCY,
    forceFreshComposition: true,
    business: { ...AGENCY.business, businessEvidence: { testimonials: [{ quote: "   ", author: "x" }] } },
  })
  assert.equal(hasTestimonialsRole(blank), false)

  const legacy = await runAutonomousMultiPageSiteBuilder({
    ...AGENCY,
    forceFreshComposition: true,
    business: { ...AGENCY.business, testimonials: [{ quote: "legacy field, not a composer source", author: "x" }] },
  })
  assert.equal(hasTestimonialsRole(legacy), false)
  assert.equal(allTexts(legacy).includes(PLACEHOLDER), false)
})

// --- 2) testimonials: real evidence preserved and rendered (no Creative Director needed) ---

test("testimonials: real grounded evidence keeps the section and renders the real quotes, never the placeholder", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({
    ...AGENCY,
    forceFreshComposition: true,
    business: { ...AGENCY.business, businessEvidence: { testimonials: REAL_TESTIMONIALS } },
  })
  assert.equal(hasTestimonialsRole(run), true)
  const texts = allTexts(run)
  assert.ok(texts.includes(REAL_TESTIMONIALS[0].quote))
  assert.ok(texts.includes(REAL_TESTIMONIALS[1].quote))
  assert.equal(texts.includes(PLACEHOLDER), false)
  assertValidPlan(run)
})

// --- 3) Creative Director order compatibility ---

test("testimonials: a CD order planned against the pre-grounding recipe (listing testimonials) still applies; an invented role still falls back", async () => {
  const baseline = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true })
  const home = baseline.architecture.pages.find((page) => page.slug === "home")!
  const grounded = home.sections.map((section) => section.role as string)
  assert.ok(grounded.length > 4)

  const swapped = [grounded[0], grounded[2], grounded[1], ...grounded.slice(3)]
  const withTestimonials = [...swapped.slice(0, -2), "testimonials", ...swapped.slice(-2)]
  const direction = (order: string[]): CreativeSiteDirectionV1 => ({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", preferredSectionOrder: order }],
  })

  const reordered = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true, creativeDirection: direction(withTestimonials) })
  assert.deepEqual(reordered.architecture.pages.find((page) => page.slug === "home")!.sections.map((s) => s.role), swapped)
  assert.equal(hasTestimonialsRole(reordered), false)

  const invented = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true, creativeDirection: direction([...withTestimonials.slice(0, -1), "rol-inventado", withTestimonials.at(-1)!]) })
  assert.deepEqual(invented.architecture.pages.find((page) => page.slug === "home")!.sections.map((s) => s.role), grounded)
})

// --- 4) assetProvider override ---

test("assetProvider: absent -> the default Pexels provider path is used exactly as before (fake key, request intercepted)", async () => {
  fetchedHosts.length = 0
  process.env.PEXELS_API_KEY = "fake-test-key-4a"
  try {
    const run = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true })
    assert.equal(run.ok, true)
  } finally {
    delete process.env.PEXELS_API_KEY
  }
  assert.ok(fetchedHosts.length > 0, "default path must still attempt the Pexels provider")
  assert.ok(fetchedHosts.every((host) => host === "api.pexels.com"), `unexpected hosts: ${fetchedHosts.join(",")}`)
})

test("assetProvider: supplied -> the injected provider replaces Pexels (zero fetch even with a key configured)", async () => {
  fetchedHosts.length = 0
  const searched: string[] = []
  const recording: AssetProvider = { name: "recording-test", isAvailable: () => true, search: async (query) => { searched.push(query); return [] } }
  process.env.PEXELS_API_KEY = "fake-test-key-4a"
  try {
    await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true, assetProvider: recording })
    await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true, assetProvider: DISABLED_ASSET_PROVIDER_V1 })
  } finally {
    delete process.env.PEXELS_API_KEY
  }
  assert.ok(searched.length > 0)
  assert.equal(fetchedHosts.length, 0)
})

test("assetProvider: does not change the SiteCreationPlanV2 contract (disabled provider == absent provider without a key)", async () => {
  const absent = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true })
  const disabled = await runAutonomousMultiPageSiteBuilder({ ...AGENCY, forceFreshComposition: true, assetProvider: DISABLED_ASSET_PROVIDER_V1 })
  assert.deepEqual(Object.keys(disabled.plan).sort(), Object.keys(absent.plan).sort())
  // Node ids are random per run, so compare the id-independent structure + content per page.
  const shape = (run: AutonomousMultiPageSiteBuilderResult) =>
    run.plan.pages.map((page) => {
      const nodes = Object.values(page.tree.nodes as Record<string, EditorNode>)
      const histogram: Record<string, number> = {}
      for (const node of nodes) histogram[node.type] = (histogram[node.type] ?? 0) + 1
      return { slug: page.slug, histogram, texts: nodes.map((node) => String(node.props?.text ?? node.props?.content ?? "")).sort() }
    })
  assert.deepEqual(shape(disabled), shape(absent))
  assertValidPlan(disabled)
})

test("assetProvider: trust boundary -- not on the customer action input, never forwarded by app/actions/ai.ts, builder is not a server action", () => {
  const actionInput: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- the customer-reachable server action has no asset provider field.
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
  }
  void actionInput

  const actionSource = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  assert.equal(actionSource.includes("assetProvider"), false)

  const builderSource = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/autonomous/site-builder.ts"), "utf8")
  assert.equal(/^\s*["']use server["']/m.test(builderSource), false)
})
