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

import { buildSiteArchitecture } from "../../lib/orvenix-ai/architect"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect/site-architect"
import type { SectionRole } from "../../lib/orvenix-ai/architect/block-selector"
import { buildAssistedSiteGenerationRequestContextV1 } from "../../lib/orvenix-ai/assisted-generation/request-context"
import { ASSISTED_SITE_GENERATION_LIMITS_V1, validateAssistedSiteGenerationProposalV1 } from "../../lib/orvenix-ai/assisted-generation/validator"
import { groundAssistedSiteGenerationProposalV1 } from "../../lib/orvenix-ai/assisted-generation/planner-adapter"

// ---------------------------------------------------------------------------
// ASSISTED-3A: zero real Anthropic calls. The SDK is mocked at the
// `Module._load` boundary (this repo's established pattern -- see
// tests/unit/site-creation-action.test.ts) by returning a fake
// `@anthropic-ai/sdk` module BEFORE dynamically importing anthropic-
// provider.ts. anthropic-provider.ts is NEVER statically imported at the
// top of this file: a static import would bind the real (unmocked)
// `Anthropic` class into the module's closure before any test runs.
// ---------------------------------------------------------------------------

type FakeAnthropicMessageParams = {
  model: string
  max_tokens: number
  system: string
  messages: Array<{ role: string; content: string }>
}

type FakeAnthropicConstructorOptions = { apiKey?: string; timeout?: number; maxRetries?: number }

type FakeAnthropicRecorder = {
  callCount: number
  lastParams?: FakeAnthropicMessageParams
  constructorOptions: FakeAnthropicConstructorOptions[]
}

type FakeAnthropicImpl = (params: FakeAnthropicMessageParams) => unknown | Promise<unknown>

function makeFakeAnthropicModule(impl: FakeAnthropicImpl) {
  const recorder: FakeAnthropicRecorder = { callCount: 0, constructorOptions: [] }
  class FakeAnthropic {
    constructor(options: FakeAnthropicConstructorOptions) {
      recorder.constructorOptions.push(options)
    }
    messages = {
      create: async (params: FakeAnthropicMessageParams) => {
        recorder.callCount += 1
        recorder.lastParams = params
        return impl(params)
      },
    }
  }
  // Returned as the bare class (not wrapped in { default }): the compiled
  // provider does `__importDefault(require("@anthropic-ai/sdk"))`, whose
  // helper only unwraps a `.default` if the module already carries
  // `__esModule: true` -- otherwise it wraps `mod` itself as `{ default: mod }`.
  // Returning the class directly here makes that helper produce the right
  // constructor either way.
  return { fakeModule: FakeAnthropic, recorder }
}

type ProviderFactory = (options?: { apiKey?: string; model?: string; timeoutMs?: number }) => {
  request(input: unknown): Promise<unknown>
}

const ANTHROPIC_PROVIDER_COMPILED_PATH = path.join(
  process.cwd(),
  ".tmp/unit/lib/orvenix-ai/assisted-generation/anthropic-provider.js",
)

async function withMockedAnthropicProvider<T>(
  impl: FakeAnthropicImpl,
  run: (createProvider: ProviderFactory, recorder: FakeAnthropicRecorder, timeoutErrorCtor: new () => Error) => Promise<T>,
): Promise<T> {
  const { fakeModule, recorder } = makeFakeAnthropicModule(impl)
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(
    request: unknown,
    parent: unknown,
    isMain: unknown,
  ) {
    if (request === "@anthropic-ai/sdk") return fakeModule
    return (originalLoad as (...args: unknown[]) => unknown).call(this, request, parent, isMain)
  }
  try {
    delete require.cache[ANTHROPIC_PROVIDER_COMPILED_PATH]
    const mod = (await import("../../lib/orvenix-ai/assisted-generation/anthropic-provider")) as {
      createAnthropicAssistedSiteGenerationProviderV1: ProviderFactory
      AssistedSiteGenerationAnthropicTimeoutErrorV1: new () => Error
    }
    return await run(mod.createAnthropicAssistedSiteGenerationProviderV1, recorder, mod.AssistedSiteGenerationAnthropicTimeoutErrorV1)
  } finally {
    (Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
  }
}

async function withApiKey<T>(value: string | undefined, fn: () => Promise<T>): Promise<T> {
  const original = process.env.ANTHROPIC_API_KEY
  if (value === undefined) delete process.env.ANTHROPIC_API_KEY
  else process.env.ANTHROPIC_API_KEY = value
  try {
    return await fn()
  } finally {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = original
  }
}

function jsonTextResponse(payload: unknown): { content: Array<{ type: string; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] }
}

// --- fixtures -----------------------------------------------------------

function agencyArchitecture(): OrvenixSiteArchitecture {
  return buildSiteArchitecture({
    request: "Crea un sitio para una agencia creativa en CDMX -- MARCA_UNICA_AGENCIA_998877",
    business: {
      name: "Agencia Fixture",
      industry: "agencia creativa",
      description: "Agencia creativa full-service: branding, diseno web y direccion creativa para marcas ambiciosas.",
      location: "Ciudad de Mexico",
      objective: "Conseguir nuevos clientes",
      services: [
        { name: "Branding", description: "Identidad de marca completa." },
        { name: "Diseno web", description: "Sitios web a medida." },
        { name: "Direccion creativa", description: "Campanas y direccion de arte." },
      ],
    },
  })
}

function healthArchitecture(): OrvenixSiteArchitecture {
  return buildSiteArchitecture({
    request: "Crea un sitio para una clinica dental en Guadalajara",
    business: {
      name: "Clinica Fixture",
      industry: "clinica dental",
      description: "Clinica dental con atencion familiar, consultas y tratamientos especializados.",
      location: "Guadalajara",
      objective: "Agendar consultas",
      services: [
        { name: "Consulta general", description: "Revision y diagnostico dental." },
        { name: "Ortodoncia", description: "Tratamientos de ortodoncia." },
      ],
    },
  })
}

function restaurantArchitecture(): OrvenixSiteArchitecture {
  return buildSiteArchitecture({
    request: "Crea un sitio para un restaurante de cocina de autor en Monterrey",
    business: {
      name: "Restaurante Fixture",
      industry: "restaurante",
      description: "Restaurante de cocina de autor con platillos de temporada y ambiente intimo.",
      location: "Monterrey",
      objective: "Recibir reservaciones",
      products: [
        { name: "Menu de temporada", description: "Platillos con ingredientes locales." },
        { name: "Menu de degustacion", description: "Experiencia gastronomica completa." },
      ],
    },
  })
}

// Real, verified role/count layout for each fixture (confirmed by directly
// inspecting buildSiteArchitecture's actual output before writing these --
// see ASSISTED-3A final report): agency/health target "home"
// (services/trust/contact/cta/footer all present there); restaurant
// targets "menu" (the only page with both "products" and "gallery").
const AGENCY_TARGET_SLUG = "home"
const HEALTH_TARGET_SLUG = "home"
const RESTAURANT_TARGET_SLUG = "menu"

function rolesOf(architecture: OrvenixSiteArchitecture, slug: string): Set<SectionRole> {
  const page = architecture.pages.find((p) => p.slug === slug)
  return new Set(page ? page.sections.map((s) => s.role) : [])
}

/**
 * Builds a "golden creative fixture" proposal for one business archetype.
 * Every instance is only added when its role is CONFIRMED present on the
 * target page (defensive by construction, never assumed) -- see section 11
 * of the ASSISTED-3A mission: these express meaningfully different, valid
 * composition per archetype, all through the same contract.
 */
function agencyGoldenProposal(architecture: OrvenixSiteArchitecture) {
  const roles = rolesOf(architecture, AGENCY_TARGET_SLUG)
  const servicesCount = architecture.services?.length ?? 0
  const instances: unknown[] = []
  if (roles.has("navigation")) instances.push({ role: "navigation", selection: { mode: "all" } })
  if (roles.has("hero")) instances.push({ role: "hero", selection: { mode: "all" }, composition: { layout: { kind: "editorial-passage" } } })
  if (roles.has("services")) {
    for (let index = 0; index < servicesCount; index += 1) {
      instances.push({
        role: "services",
        selection: { mode: "single-item", itemIndex: index },
        composition: { layout: { kind: "editorial-split", mirror: index % 2 === 1 } },
      })
    }
  }
  if (roles.has("gallery")) instances.push({ role: "gallery", selection: { mode: "all" }, composition: { layout: { kind: "full-bleed-media" } } })
  if (roles.has("cta")) instances.push({ role: "cta", selection: { mode: "all" }, composition: { layout: { kind: "dramatic-closing" } } })
  if (roles.has("footer")) instances.push({ role: "footer", selection: { mode: "all" } })

  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    siteNarrative: "Golden fixture: agencia -- apertura editorial, portafolio, cierre dramatico.",
    pages: [{ slug: AGENCY_TARGET_SLUG, instances }],
  }
}

function healthGoldenProposal(architecture: OrvenixSiteArchitecture) {
  const roles = rolesOf(architecture, HEALTH_TARGET_SLUG)
  const instances: unknown[] = []
  if (roles.has("navigation")) instances.push({ role: "navigation", selection: { mode: "all" } })
  if (roles.has("hero")) instances.push({ role: "hero", selection: { mode: "all" } })
  if (roles.has("trust")) instances.push({ role: "trust", selection: { mode: "all" }, composition: { treatment: "credibility-strip" } })
  if (roles.has("services")) instances.push({ role: "services", selection: { mode: "all" }, composition: { treatment: "standard-grid" } })
  if (roles.has("contact")) instances.push({ role: "contact", selection: { mode: "all" }, composition: { treatment: "booking-card" } })
  if (roles.has("cta")) instances.push({ role: "cta", selection: { mode: "all" } })
  if (roles.has("footer")) instances.push({ role: "footer", selection: { mode: "all" } })

  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    siteNarrative: "Golden fixture: salud -- autoridad, confianza temprana, cierre de reserva.",
    pages: [{ slug: HEALTH_TARGET_SLUG, instances }],
  }
}

function restaurantGoldenProposal(architecture: OrvenixSiteArchitecture) {
  const roles = rolesOf(architecture, RESTAURANT_TARGET_SLUG)
  const instances: unknown[] = []
  if (roles.has("navigation")) instances.push({ role: "navigation", selection: { mode: "all" } })
  if (roles.has("hero")) instances.push({ role: "hero", selection: { mode: "all" }, composition: { mediaStrategy: "led" } })
  if (roles.has("products")) instances.push({ role: "products", selection: { mode: "all" }, composition: { treatment: "media-led" } })
  if (roles.has("gallery")) instances.push({ role: "gallery", selection: { mode: "all" }, composition: { layout: { kind: "full-bleed-media" } } })
  if (roles.has("cta")) instances.push({ role: "cta", selection: { mode: "all" }, composition: { layout: { kind: "dramatic-closing" } } })
  if (roles.has("footer")) instances.push({ role: "footer", selection: { mode: "all" } })

  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    siteNarrative: "Golden fixture: restaurante -- apertura inmersiva, menu, galeria, cierre.",
    pages: [{ slug: RESTAURANT_TARGET_SLUG, instances }],
  }
}

function groundingContextFor(architecture: OrvenixSiteArchitecture) {
  return {
    pages: architecture.pages.map((page) => ({ slug: page.slug, roles: page.sections.map((s) => s.role) })),
    servicesCount: architecture.services?.length ?? 0,
    productsCount: architecture.products?.length ?? 0,
  }
}

// =========================================================================
// A) request-context.ts: bounded, sanitized provider input
// =========================================================================

test("A1) request context never carries the business name or the raw request string", () => {
  const architecture = agencyArchitecture()
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture })
  assert.ok(!("name" in context.business))
  const serialized = JSON.stringify(context)
  assert.ok(!serialized.includes("Agencia Fixture"))
  assert.ok(!serialized.includes("MARCA_UNICA_AGENCIA_998877"))
})

test("A2) request context capabilities are restricted to roles actually present in the architecture", () => {
  const architecture = healthArchitecture()
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture })
  const usedRoles = new Set(architecture.pages.flatMap((p) => p.sections.map((s) => s.role)))
  for (const role of Object.keys(context.capabilities.roleTreatments)) {
    assert.ok(usedRoles.has(role as SectionRole), `${role} should not appear in roleTreatments`)
  }
  for (const role of Object.keys(context.capabilities.roleLayouts)) {
    assert.ok(usedRoles.has(role as SectionRole), `${role} should not appear in roleLayouts`)
  }
  // "pricing" is never used by this fixture's architecture -> must be absent.
  assert.ok(!usedRoles.has("pricing"))
  assert.equal("pricing" in context.capabilities.roleTreatments, false)
})

test("A3) request context capabilities.maxSubsetIndexes reuses the validator's own limit, never a re-derived constant", () => {
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture: agencyArchitecture() })
  assert.equal(context.capabilities.maxSubsetIndexes, ASSISTED_SITE_GENERATION_LIMITS_V1.maxSubsetIndexes)
})

test("A4) request context narrows creativeDirection to site-level signals only, dropping per-page copy suggestions", () => {
  const architecture = agencyArchitecture()
  const fakeDirection = {
    version: 1 as const,
    roleKey: "creative_director_v1" as const,
    strategyKey: "site_narrative_v1" as const,
    siteNarrative: "Una narrativa de sitio.",
    tone: "direct" as const,
    density: "spacious" as const,
    premiumCompositionTreatment: "bento" as const,
    pageDirections: [
      { slug: "home", narrativeGoal: "goal", heroTitleSuggestion: "SECRET_COPY_SHOULD_NOT_LEAK" },
    ],
  }
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture, creativeDirection: fakeDirection })
  assert.deepEqual(context.creativeDirection, {
    siteNarrative: "Una narrativa de sitio.",
    tone: "direct",
    density: "spacious",
    premiumCompositionTreatment: "bento",
  })
  assert.ok(!JSON.stringify(context).includes("SECRET_COPY_SHOULD_NOT_LEAK"))
})

test("A5) request context omits creativeDirection/designReferences entirely when absent", () => {
  const context = buildAssistedSiteGenerationRequestContextV1({ architecture: agencyArchitecture() })
  assert.equal("creativeDirection" in context, false)
  assert.equal("designReferences" in context, false)
})

// =========================================================================
// B) anthropic-provider.ts: call mechanics, bounded input, defensive parsing
// =========================================================================

test("B1) no ANTHROPIC_API_KEY -> request() resolves null, the SDK is never constructed or called", async () => {
  await withApiKey(undefined, async () => {
    await withMockedAnthropicProvider(
      () => {
        throw new Error("must never be called")
      },
      async (createProvider, recorder) => {
        const provider = createProvider({})
        const result = await provider.request({ business: {}, pages: [] })
        assert.equal(result, null)
        assert.equal(recorder.callCount, 0)
        assert.equal(recorder.constructorOptions.length, 0)
      },
    )
  })
})

test("B2) successful call: exactly one call, configured model/timeout/maxRetries:0, JSON parsed", async () => {
  await withApiKey("sk-test-fake-not-a-real-key", async () => {
    const proposal = { version: 1, roleKey: "assisted_site_generation_v1", strategyKey: "composition_layout_advisory_v1", pages: [{ slug: "home" }] }
    await withMockedAnthropicProvider(
      () => jsonTextResponse(proposal),
      async (createProvider, recorder) => {
        const provider = createProvider({})
        const result = await provider.request({ business: {}, pages: [] })

        assert.deepEqual(result, proposal)
        assert.equal(recorder.callCount, 1)
        assert.equal(recorder.constructorOptions.length, 1)
        assert.equal(recorder.constructorOptions[0].apiKey, "sk-test-fake-not-a-real-key")
        assert.equal(recorder.constructorOptions[0].maxRetries, 0)
        assert.equal(recorder.constructorOptions[0].timeout, 12_000)
        assert.equal(recorder.lastParams?.model, "claude-haiku-4-5-20251001")
      },
    )
  })
})

test("B3) custom model/timeoutMs options are honored, never the hardcoded default", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse({ version: 1, roleKey: "assisted_site_generation_v1", strategyKey: "composition_layout_advisory_v1", pages: [] }),
      async (createProvider, recorder) => {
        const provider = createProvider({ model: "claude-custom-model", timeoutMs: 5_000 })
        await provider.request({ business: {}, pages: [] })
        assert.equal(recorder.lastParams?.model, "claude-custom-model")
        assert.equal(recorder.constructorOptions[0].timeout, 5_000)
      },
    )
  })
})

test("B4) the API key is sent to the SDK client but NEVER embedded in the system prompt or the user message content", async () => {
  const SECRET = "sk-DO-NOT-LEAK-INTO-PROMPT-123456"
  await withApiKey(SECRET, async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse({ version: 1, roleKey: "assisted_site_generation_v1", strategyKey: "composition_layout_advisory_v1", pages: [] }),
      async (createProvider, recorder) => {
        const provider = createProvider({})
        await provider.request(buildAssistedSiteGenerationRequestContextV1({ architecture: agencyArchitecture() }))
        assert.ok(!recorder.lastParams?.system.includes(SECRET))
        assert.ok(!recorder.lastParams?.messages.some((m) => m.content.includes(SECRET)))
      },
    )
  })
})

test("B5) the bounded request context (pages/roles/capabilities) reaches the message content; raw business name/request string never does", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse({ version: 1, roleKey: "assisted_site_generation_v1", strategyKey: "composition_layout_advisory_v1", pages: [] }),
      async (createProvider, recorder) => {
        const provider = createProvider({})
        const context = buildAssistedSiteGenerationRequestContextV1({ architecture: agencyArchitecture() })
        await provider.request(context)
        const sentContent = recorder.lastParams?.messages[0]?.content ?? ""
        assert.ok(sentContent.includes("services"))
        assert.ok(sentContent.includes("roleTreatments"))
        assert.ok(!sentContent.includes("Agencia Fixture"))
        assert.ok(!sentContent.includes("MARCA_UNICA_AGENCIA_998877"))
      },
    )
  })
})

test("B6) malformed (non-JSON) response resolves to null, never throws", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => ({ content: [{ type: "text", text: "esto no es JSON en absoluto" }] }),
      async (createProvider) => {
        const provider = createProvider({})
        const result = await provider.request({ business: {}, pages: [] })
        assert.equal(result, null)
      },
    )
  })
})

test("B7) empty response (no text content block) resolves to null, never throws", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => ({ content: [] }),
      async (createProvider) => {
        const provider = createProvider({})
        assert.equal(await provider.request({ business: {}, pages: [] }), null)
      },
    )
  })
})

test("B8) prose/markdown-fenced JSON is extracted per the explicit first-balanced-object parser policy", async () => {
  await withApiKey("sk-test-fake", async () => {
    const proposal = { version: 1, roleKey: "assisted_site_generation_v1", strategyKey: "composition_layout_advisory_v1", pages: [{ slug: "home" }] }
    const prosedText = `Aqui esta tu propuesta:\n\`\`\`json\n${JSON.stringify(proposal)}\n\`\`\`\nEspero que sea util.`
    await withMockedAnthropicProvider(
      () => ({ content: [{ type: "text", text: prosedText }] }),
      async (createProvider) => {
        const provider = createProvider({})
        const result = await provider.request({ business: {}, pages: [] })
        assert.deepEqual(result, proposal)
      },
    )
  })
})

test("B9) a thrown provider/network error propagates as a generic error, never leaking the original message", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => {
        throw new Error("internal-detail-that-must-not-leak: 500 from upstream")
      },
      async (createProvider, recorder) => {
        const provider = createProvider({})
        await assert.rejects(
          () => provider.request({ business: {}, pages: [] }),
          (error: unknown) => {
            assert.ok(error instanceof Error)
            assert.equal(error.message, "assisted_site_generation_provider_error")
            assert.ok(!error.message.includes("internal-detail-that-must-not-leak"))
            return true
          },
        )
        assert.equal(recorder.callCount, 1)
      },
    )
  })
})

test("B10) a timeout-like SDK error is classified as AssistedSiteGenerationAnthropicTimeoutErrorV1", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => {
        const timeoutError = new Error("Request timed out.")
        timeoutError.name = "APIConnectionTimeoutError"
        throw timeoutError
      },
      async (createProvider, recorder, TimeoutErrorCtor) => {
        const provider = createProvider({})
        await assert.rejects(() => provider.request({ business: {}, pages: [] }), TimeoutErrorCtor)
        assert.equal(recorder.callCount, 1)
      },
    )
  })
})

test("B11) exactly one call per invocation -- no retry loop on failure", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => {
        throw new Error("boom")
      },
      async (createProvider, recorder) => {
        const provider = createProvider({})
        await provider.request({ business: {}, pages: [] }).catch(() => undefined)
        assert.equal(recorder.callCount, 1)
      },
    )
  })
})

test("B12) a non-plain-object input (caller misuse) resolves to null without ever calling the SDK", async () => {
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => {
        throw new Error("must never be called")
      },
      async (createProvider, recorder) => {
        const provider = createProvider({})
        assert.equal(await provider.request("not-an-object"), null)
        assert.equal(await provider.request(null), null)
        assert.equal(await provider.request(42), null)
        assert.equal(recorder.callCount, 0)
      },
    )
  })
})

// =========================================================================
// C) provider output still fully governed by the SAME existing validator +
//    closed-world grounding (planner-adapter.ts) -- never a new authority.
// =========================================================================

test("C1) dangerous keys inside composition (css/html/classname/etc.) still fail the existing validator", () => {
  const result = validateAssistedSiteGenerationProposalV1({
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "all" }, composition: { treatment: "standard-grid", css: "body{color:red}" } }] }],
  })
  assert.equal(result.ok, false)
  if (result.ok === false) assert.ok(result.errors.some((e) => e.includes("css")))
})

test("C2) a page slug the real architecture doesn't have still fails closed-world grounding", () => {
  const architecture = agencyArchitecture()
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "esta-pagina-jamas-existio", instances: [{ role: "hero", selection: { mode: "all" } }] }],
  }
  const grounded = groundAssistedSiteGenerationProposalV1({ proposal, context: groundingContextFor(architecture) })
  assert.equal(grounded.accepted, false)
})

test("C3) an out-of-range service/product index still fails closed-world grounding", () => {
  const architecture = agencyArchitecture()
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: AGENCY_TARGET_SLUG, instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 999 } }] }],
  }
  const grounded = groundAssistedSiteGenerationProposalV1({ proposal, context: groundingContextFor(architecture) })
  assert.equal(grounded.accepted, false)
})

test("C4) a layout kind that isn't valid for the instance's specific role still fails validation", () => {
  const result = validateAssistedSiteGenerationProposalV1({
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "all" }, composition: { layout: { kind: "dramatic-closing" } } }] }],
  })
  assert.equal(result.ok, false)
})

// =========================================================================
// D) golden creative fixtures: 3 archetypes, mocked Claude response each,
//    all normalized through the SAME contract/validator/adapter.
// =========================================================================

test("D1) AGENCY golden fixture: mocked Claude response normalizes to an accepted, non-trivial CompositionPlan", async () => {
  const architecture = agencyArchitecture()
  const proposal = agencyGoldenProposal(architecture)
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse(proposal),
      async (createProvider) => {
        const provider = createProvider({})
        const raw = await provider.request(buildAssistedSiteGenerationRequestContextV1({ architecture }))
        const grounded = groundAssistedSiteGenerationProposalV1({ proposal: raw, context: groundingContextFor(architecture) })
        assert.equal(grounded.accepted, true)
        if (grounded.accepted) {
          const page = grounded.compositionPlan.pages.find((p) => p.slug === AGENCY_TARGET_SLUG)
          assert.ok(page && page.instances.length >= 5)
          assert.ok(page!.instances.filter((i) => i.role === "services").length === architecture.services?.length)
        }
      },
    )
  })
})

test("D2) HEALTH golden fixture: mocked Claude response normalizes to an accepted, restrained CompositionPlan", async () => {
  const architecture = healthArchitecture()
  const proposal = healthGoldenProposal(architecture)
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse(proposal),
      async (createProvider) => {
        const provider = createProvider({})
        const raw = await provider.request(buildAssistedSiteGenerationRequestContextV1({ architecture }))
        const grounded = groundAssistedSiteGenerationProposalV1({ proposal: raw, context: groundingContextFor(architecture) })
        assert.equal(grounded.accepted, true)
        if (grounded.accepted) {
          const page = grounded.compositionPlan.pages.find((p) => p.slug === HEALTH_TARGET_SLUG)
          const contactInstance = page?.instances.find((i) => i.role === "contact")
          assert.equal(contactInstance?.composition?.treatment, "booking-card")
          const trustInstance = page?.instances.find((i) => i.role === "trust")
          assert.equal(trustInstance?.composition?.treatment, "credibility-strip")
        }
      },
    )
  })
})

test("D3) RESTAURANT golden fixture: mocked Claude response normalizes to an accepted, media-led CompositionPlan", async () => {
  const architecture = restaurantArchitecture()
  const proposal = restaurantGoldenProposal(architecture)
  await withApiKey("sk-test-fake", async () => {
    await withMockedAnthropicProvider(
      () => jsonTextResponse(proposal),
      async (createProvider) => {
        const provider = createProvider({})
        const raw = await provider.request(buildAssistedSiteGenerationRequestContextV1({ architecture }))
        const grounded = groundAssistedSiteGenerationProposalV1({ proposal: raw, context: groundingContextFor(architecture) })
        assert.equal(grounded.accepted, true)
        if (grounded.accepted) {
          const page = grounded.compositionPlan.pages.find((p) => p.slug === RESTAURANT_TARGET_SLUG)
          const productsInstance = page?.instances.find((i) => i.role === "products")
          assert.equal(productsInstance?.composition?.treatment, "media-led")
          const galleryInstance = page?.instances.find((i) => i.role === "gallery")
          assert.equal(galleryInstance?.composition?.layout?.kind, "full-bleed-media")
        }
      },
    )
  })
})

test("D4) the three golden fixtures use the same contract/roleKey/strategyKey but produce materially different composition choices", () => {
  const agency = agencyGoldenProposal(agencyArchitecture())
  const health = healthGoldenProposal(healthArchitecture())
  const restaurant = restaurantGoldenProposal(restaurantArchitecture())

  for (const proposal of [agency, health, restaurant]) {
    assert.equal(proposal.roleKey, "assisted_site_generation_v1")
    assert.equal(proposal.strategyKey, "composition_layout_advisory_v1")
  }

  const serialized = [agency, health, restaurant].map((p) => JSON.stringify(p.pages))
  assert.notEqual(serialized[0], serialized[1])
  assert.notEqual(serialized[1], serialized[2])
  assert.notEqual(serialized[0], serialized[2])
})
