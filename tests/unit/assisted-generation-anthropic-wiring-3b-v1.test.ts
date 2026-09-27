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

// ---------------------------------------------------------------------------
// ASSISTED-3B: zero real Anthropic / network calls. Credentials are removed
// from this process BEFORE anything else runs (never read, only deleted),
// and global fetch is replaced with a counting tripwire asserted at the end.
// Every "anthropic"-mode test injects a mocked provider at the bridge's
// documented provider seam, except the explicit "unavailable" test, which
// proves the real provider is never reached without a credential.
// ---------------------------------------------------------------------------
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("ASSISTED-3B test: network is forbidden")
}) as typeof fetch

import {
  resolveAssistedGenerationModeV1,
  resolveAssistedSiteGenerationV1,
  type AssistedGenerationModeV1,
} from "../../lib/orvenix-ai/assisted-generation/architecture-bridge"
import { AssistedSiteGenerationAnthropicTimeoutErrorV1 } from "../../lib/orvenix-ai/assisted-generation/anthropic-provider"
import { ASSISTED_SITE_GENERATION_SECTION_ROLES_V1, type AssistedSiteGenerationProviderV1 } from "../../lib/orvenix-ai/assisted-generation/contract"
import type { AssistedSiteGenerationRequestContextV1 } from "../../lib/orvenix-ai/assisted-generation/request-context"
import { buildSiteArchitecture } from "../../lib/orvenix-ai/architect"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect/site-architect"
import type { CreativeSiteDirectionV1 } from "../../lib/orvenix-ai/creative-director/contract"
import type { OrvenixSiteCreationActionInput } from "../../app/actions/ai"
import type { EditorNode } from "../../types/editor"

const REQUEST = "Crea un sitio para un estudio creativo en Monterrey"
const BUSINESS_NAME = "Estudio Fixture 3B"
const DESCRIPTION = "DEV FIXTURE 3B: estudio creativo enfocado en identidad, diseno web y direccion creativa."

const SERVICES = [
  { name: "Identidad visual", description: "DEV FIXTURE: sistemas de marca completos." },
  { name: "Diseno web", description: "DEV FIXTURE: sitios web editables y rapidos." },
  { name: "Direccion creativa", description: "DEV FIXTURE: acompanamiento creativo integral." },
]

// Same real resolved mapping ASSISTED-2B's tests rely on: "services" lives on the "servicios" page.
const TARGET_PAGE_SLUG = "servicios"

function baseBusiness() {
  return {
    name: BUSINESS_NAME,
    industry: "estudio creativo",
    description: DESCRIPTION,
    location: "Monterrey",
    objective: "Conseguir solicitudes de proyecto",
    services: SERVICES,
  }
}

function fixtureArchitecture(): OrvenixSiteArchitecture {
  return buildSiteArchitecture({ request: REQUEST, business: baseBusiness() })
}

function richProposal() {
  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [
      {
        slug: TARGET_PAGE_SLUG,
        instances: [
          { role: "navigation", selection: { mode: "all" } },
          { role: "hero", selection: { mode: "all" }, composition: { layout: { kind: "oversized-typography" } } },
          { role: "services", selection: { mode: "single-item", itemIndex: 0 }, composition: { layout: { kind: "editorial-split" } } },
          { role: "services", selection: { mode: "single-item", itemIndex: 1 }, composition: { layout: { kind: "editorial-split", mirror: true } } },
          { role: "cta", selection: { mode: "all" } },
          { role: "footer", selection: { mode: "all" } },
        ],
      },
    ],
  }
}

function proposalWithTargetInstances(instances: unknown[]) {
  return { ...richProposal(), pages: [{ slug: TARGET_PAGE_SLUG, instances }] }
}

type MockProvider = AssistedSiteGenerationProviderV1 & { calls: unknown[] }

function mockProvider(respond: (input: unknown) => unknown | Promise<unknown>): MockProvider {
  const calls: unknown[] = []
  return {
    calls,
    async request(input: unknown) {
      calls.push(structuredClone(input))
      return respond(input)
    },
  }
}

function nodeTypeHistogram(nodes: Record<string, EditorNode>): Record<string, number> {
  const histogram: Record<string, number> = {}
  for (const node of Object.values(nodes)) histogram[node.type] = (histogram[node.type] ?? 0) + 1
  return histogram
}

function allNodeText(nodes: Record<string, EditorNode>): string {
  return Object.values(nodes)
    .map((n) => String(n.props?.text ?? n.props?.content ?? ""))
    .join(" | ")
}

function withEnv(value: string | undefined, fn: () => void) {
  const original = process.env.ORVENIX_ASSISTED_GENERATION_MODE
  if (value === undefined) delete process.env.ORVENIX_ASSISTED_GENERATION_MODE
  else process.env.ORVENIX_ASSISTED_GENERATION_MODE = value
  try {
    fn()
  } finally {
    if (original === undefined) delete process.env.ORVENIX_ASSISTED_GENERATION_MODE
    else process.env.ORVENIX_ASSISTED_GENERATION_MODE = original
  }
}

function assertValidPlan(result: Awaited<ReturnType<typeof runAutonomousMultiPageSiteBuilder>>) {
  assert.equal(result.ok, true)
  const revalidation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(revalidation.ok, true)
}

async function runOff() {
  return runAutonomousMultiPageSiteBuilder({ request: REQUEST, business: baseBusiness(), forceFreshComposition: true })
}

async function runAnthropic(provider: AssistedSiteGenerationProviderV1 | undefined, extra: { timeoutMs?: number } = {}) {
  return runAutonomousMultiPageSiteBuilder({
    request: REQUEST,
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "anthropic", ...(provider ? { provider } : {}), ...extra },
  })
}

// --- 9) no global Anthropic activation via env ---

test("9a) ORVENIX_ASSISTED_GENERATION_MODE=anthropic -> the global resolver returns off (intentional)", () => {
  for (const value of ["anthropic", "ANTHROPIC", " anthropic", "anthropic "]) {
    withEnv(value, () => assert.equal(resolveAssistedGenerationModeV1(), "off", `expected "${value}" -> off`))
  }
})

test("9b) global resolver: default off, unknown off, exact deterministic -> deterministic", () => {
  withEnv(undefined, () => assert.equal(resolveAssistedGenerationModeV1(), "off"))
  withEnv("", () => assert.equal(resolveAssistedGenerationModeV1(), "off"))
  withEnv("off", () => assert.equal(resolveAssistedGenerationModeV1(), "off"))
  for (const value of ["true", "1", "claude", "haiku", "DETERMINISTIC"]) {
    withEnv(value, () => assert.equal(resolveAssistedGenerationModeV1(), "off"))
  }
  withEnv("deterministic", () => assert.equal(resolveAssistedGenerationModeV1(), "deterministic"))
})

test("9c) type-level: the GLOBAL mode type cannot express anthropic, and the public action input cannot select a mode", () => {
  // @ts-expect-error -- "anthropic" is intentionally not a global/default mode.
  const globalMode: AssistedGenerationModeV1 = "anthropic"
  void globalMode

  const actionInput: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- the customer-reachable server action has no assisted-generation field at all.
    assistedGeneration: { mode: "anthropic" },
  }
  void actionInput
})

test("9d) app/actions/ai.ts forwards only the global resolver to the builder", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  const assistedLines = source.split("\n").filter((line) => /assistedGeneration\s*:/.test(line))
  assert.deepEqual(assistedLines.map((line) => line.trim()), ["assistedGeneration: { mode: resolveAssistedGenerationModeV1() },"])
  assert.equal(/mode:\s*["']anthropic["']/.test(source), false)
})

// --- 10) mocked Anthropic end-to-end through the REAL builder ---

test("10) explicit anthropic mode + mocked provider: one call, bounded context, applied, factual universe unchanged, Plan V2 valid", async () => {
  const provider = mockProvider(() => richProposal())
  const offResult = await runOff()
  const assistedResult = await runAnthropic(provider)

  assert.equal(provider.calls.length, 1)

  const context = provider.calls[0] as AssistedSiteGenerationRequestContextV1
  assert.deepEqual(Object.keys(context).sort(), ["business", "capabilities", "offerings", "pages"])
  assert.deepEqual(context.offerings.services, SERVICES)
  assert.deepEqual(context.pages.map((p) => p.slug), offResult.architecture.pages.map((p) => p.slug))
  const serialized = JSON.stringify(context)
  assert.equal(serialized.includes(REQUEST), false, "raw prompt must not reach the provider")
  assert.equal(serialized.includes(BUSINESS_NAME), false)
  assert.equal(serialized.includes(DESCRIPTION), false)
  assert.equal(serialized.includes("rootId"), false, "no EditorTree")

  assert.equal(assistedResult.assistedGeneration.status, "applied")
  if (assistedResult.assistedGeneration.status === "applied") {
    assert.equal(assistedResult.assistedGeneration.providerKey, "anthropic")
    assert.equal(assistedResult.assistedGeneration.modelKey, "claude_haiku_4_5")
    assert.match(assistedResult.assistedGeneration.inputFingerprint, /^[a-f0-9]{64}$/)
    assert.match(assistedResult.assistedGeneration.outputFingerprint, /^[a-f0-9]{64}$/)
    assert.equal(assistedResult.assistedGeneration.normalizedProposal.pages[0].slug, TARGET_PAGE_SLUG)
  }

  assertValidPlan(offResult)
  assertValidPlan(assistedResult)

  // Accepted composition changes executable structure.
  const offPage = offResult.plan.pages.find((p) => p.slug === TARGET_PAGE_SLUG)!
  const assistedPage = assistedResult.plan.pages.find((p) => p.slug === TARGET_PAGE_SLUG)!
  assert.notDeepEqual(nodeTypeHistogram(offPage.tree.nodes), nodeTypeHistogram(assistedPage.tree.nodes))

  // Factual universe unchanged.
  assert.deepEqual(assistedResult.architecture.services, offResult.architecture.services)
  assert.deepEqual(assistedResult.architecture.products, offResult.architecture.products)
  assert.deepEqual(assistedResult.plan.pages.map((p) => p.slug), offResult.plan.pages.map((p) => p.slug))
  const assistedText = allNodeText(assistedPage.tree.nodes)
  assert.ok(assistedText.includes("Identidad visual"))
  assert.ok(assistedText.includes("Diseno web"))
  for (const page of assistedResult.architecture.pages) {
    const offRoles = new Set(offResult.architecture.pages.find((p) => p.slug === page.slug)!.sections.map((s) => s.role))
    for (const section of page.sections) assert.ok(offRoles.has(section.role), `${page.slug}: invented role ${section.role}`)
  }
})

test("10b) Creative Director direction reaches the provider only as narrowed site-level context (no per-page copy)", async () => {
  const architecture = fixtureArchitecture()
  const direction = {
    siteNarrative: "Narrativa de sitio 3B",
    tone: "editorial",
    density: "airy",
    pageDirections: [{ slug: "home", heroTitleSuggestion: "COPY_SUGGESTION_MUST_NOT_LEAK" }],
  } as unknown as CreativeSiteDirectionV1
  const provider = mockProvider(() => richProposal())

  const result = await resolveAssistedSiteGenerationV1({ mode: "anthropic", architecture, creativeDirection: direction, provider })

  assert.equal(result.lifecycle.status, "applied")
  const context = provider.calls[0] as AssistedSiteGenerationRequestContextV1
  assert.deepEqual(context.creativeDirection, { siteNarrative: "Narrativa de sitio 3B", tone: "editorial", density: "airy" })
  assert.equal(JSON.stringify(context).includes("COPY_SUGGESTION_MUST_NOT_LEAK"), false)
})

// --- 11) fallback end-to-end through the REAL builder ---

test("11a) explicit anthropic mode without a configured credential -> failed/unavailable, normal Orvenix, no provider/network", async () => {
  const offResult = await runOff()
  const result = await runAnthropic(undefined)

  assert.equal(result.assistedGeneration.status, "failed")
  if (result.assistedGeneration.status === "failed") {
    assert.equal(result.assistedGeneration.providerKey, "anthropic")
    assert.deepEqual(result.assistedGeneration.reasons, ["assisted_generation_provider_unavailable"])
  }
  assertValidPlan(result)
  assert.deepEqual(result.architecture, offResult.architecture)
  assert.equal(networkAttempts, 0)
})

const FALLBACK_CASES: Array<{ name: string; status: "failed" | "rejected"; provider: () => AssistedSiteGenerationProviderV1; reason?: string; timeoutMs?: number }> = [
  { name: "provider throws", status: "failed", reason: "assisted_generation_provider_error", provider: () => mockProvider(() => { throw new Error("sk-ant-SECRET-LIKE-MESSAGE") }) },
  { name: "provider timeout error", status: "failed", reason: "assisted_generation_provider_timeout", provider: () => mockProvider(() => { throw new AssistedSiteGenerationAnthropicTimeoutErrorV1() }) },
  { name: "provider hangs past bridge timeout", status: "failed", reason: "assisted_generation_provider_timeout", timeoutMs: 25, provider: () => mockProvider(() => new Promise(() => {})) },
  { name: "null (malformed/non-JSON upstream)", status: "failed", reason: "assisted_generation_provider_empty_response", provider: () => mockProvider(() => null) },
  { name: "non-object JSON", status: "rejected", provider: () => mockProvider(() => "not a proposal") },
  { name: "schema-invalid proposal", status: "rejected", provider: () => mockProvider(() => ({ version: 1 })) },
  { name: "grounding-invalid proposal", status: "rejected", provider: () => mockProvider(() => ({ ...richProposal(), pages: [{ slug: "pagina-inventada" }] })) },
]

for (const fallbackCase of FALLBACK_CASES) {
  test(`11b) fallback: ${fallbackCase.name} -> ${fallbackCase.status}, normal Orvenix, site still generated`, async () => {
    const offResult = await runOff()
    const result = await runAnthropic(fallbackCase.provider(), fallbackCase.timeoutMs ? { timeoutMs: fallbackCase.timeoutMs } : {})

    assert.equal(result.assistedGeneration.status, fallbackCase.status)
    if (result.assistedGeneration.status === "failed" || result.assistedGeneration.status === "rejected") {
      assert.equal(result.assistedGeneration.providerKey, "anthropic")
      assert.ok(result.assistedGeneration.reasons.length > 0)
      if (fallbackCase.reason) assert.deepEqual(result.assistedGeneration.reasons, [fallbackCase.reason])
      assert.equal(JSON.stringify(result.assistedGeneration).includes("sk-ant"), false)
    }
    assertValidPlan(result)
    assert.deepEqual(result.architecture, offResult.architecture)
  })
}

// --- 12) Anthropic cannot bypass Orvenix ---

function inventedRoleForTargetPage(architecture: OrvenixSiteArchitecture): string {
  const pageRoles = new Set(architecture.pages.find((p) => p.slug === TARGET_PAGE_SLUG)!.sections.map((s) => s.role as string))
  const role = ASSISTED_SITE_GENERATION_SECTION_ROLES_V1.find((candidate) => !pageRoles.has(candidate))
  assert.ok(role)
  return role!
}

const BYPASS_CASES: Array<{ name: string; build: (architecture: OrvenixSiteArchitecture) => unknown }> = [
  { name: "invented page", build: () => ({ ...richProposal(), pages: [{ slug: "precios-secretos" }] }) },
  { name: "invented role", build: (architecture) => proposalWithTargetInstances([{ role: inventedRoleForTargetPage(architecture), selection: { mode: "all" } }]) },
  { name: "invented service index", build: () => proposalWithTargetInstances([{ role: "services", selection: { mode: "single-item", itemIndex: 99 } }]) },
  { name: "invented subset index", build: () => proposalWithTargetInstances([{ role: "services", selection: { mode: "subset", indexes: [0, 42] } }]) },
  { name: "dangerous key (__proto__-style/className)", build: () => proposalWithTargetInstances([{ role: "services", selection: { mode: "all" }, composition: { className: "bg-red-500" } }]) },
  { name: "unsupported layout", build: () => proposalWithTargetInstances([{ role: "services", selection: { mode: "all" }, composition: { layout: { kind: "hologram-3d" } } }]) },
  { name: "arbitrary URL", build: () => proposalWithTargetInstances([{ role: "hero", selection: { mode: "all" }, url: "https://attacker.example" }]) },
  { name: "arbitrary image src", build: () => proposalWithTargetInstances([{ role: "hero", selection: { mode: "all" }, composition: { src: "https://attacker.example/x.png" } }]) },
  { name: "arbitrary CSS", build: () => proposalWithTargetInstances([{ role: "hero", selection: { mode: "all" }, composition: { style: "position:fixed" } }]) },
  { name: "raw css key", build: () => proposalWithTargetInstances([{ role: "hero", selection: { mode: "all" }, css: "body{display:none}" }]) },
]

for (const bypassCase of BYPASS_CASES) {
  test(`12) anthropic output cannot bypass Orvenix: ${bypassCase.name} -> rejected, architecture untouched by reference`, async () => {
    const architecture = fixtureArchitecture()
    const provider = mockProvider(() => bypassCase.build(architecture))

    const result = await resolveAssistedSiteGenerationV1({ mode: "anthropic", architecture, provider })

    assert.equal(provider.calls.length, 1)
    assert.equal(result.lifecycle.status, "rejected")
    assert.equal(result.architecture, architecture)
  })
}

// --- 13) normal generation regression ---

test("13a) OFF: an injected provider is never invoked and output stays valid", async () => {
  const provider = mockProvider(() => richProposal())
  const result = await runAutonomousMultiPageSiteBuilder({
    request: REQUEST,
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "off", provider },
  })
  assert.equal(provider.calls.length, 0)
  assert.deepEqual(result.assistedGeneration, { status: "disabled" })
  assertValidPlan(result)
})

test("13b) DETERMINISTIC: ASSISTED-2B behavior intact, injected Anthropic provider ignored", async () => {
  const provider = mockProvider(() => ({ version: 1 }))
  const result = await runAutonomousMultiPageSiteBuilder({
    request: REQUEST,
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "deterministic", proposal: richProposal(), provider },
  })
  assert.equal(provider.calls.length, 0)
  assert.equal(result.assistedGeneration.status, "applied")
  if (result.assistedGeneration.status === "applied") {
    assert.equal(result.assistedGeneration.providerKey, "deterministic")
    assert.equal(result.assistedGeneration.modelKey, "assisted_deterministic_v1")
    assert.deepEqual(result.assistedGeneration.rejectedReasons, [])
  }
  assertValidPlan(result)
})

test("13c) env=anthropic + the action's own wiring (global resolver) never reaches a provider", async () => {
  const provider = mockProvider(() => richProposal())
  let result: Awaited<ReturnType<typeof runAutonomousMultiPageSiteBuilder>> | undefined
  const original = process.env.ORVENIX_ASSISTED_GENERATION_MODE
  process.env.ORVENIX_ASSISTED_GENERATION_MODE = "anthropic"
  try {
    result = await runAutonomousMultiPageSiteBuilder({
      request: REQUEST,
      business: baseBusiness(),
      forceFreshComposition: true,
      assistedGeneration: { mode: resolveAssistedGenerationModeV1(), provider },
    })
  } finally {
    if (original === undefined) delete process.env.ORVENIX_ASSISTED_GENERATION_MODE
    else process.env.ORVENIX_ASSISTED_GENERATION_MODE = original
  }
  assert.equal(provider.calls.length, 0)
  assert.deepEqual(result?.assistedGeneration, { status: "disabled" })
})

test("zz) zero network attempts across the whole 3B suite", () => {
  assert.equal(networkAttempts, 0)
})
