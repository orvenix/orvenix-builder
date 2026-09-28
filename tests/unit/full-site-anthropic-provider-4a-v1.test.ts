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

// FULL-SITE-4A: ZERO real provider calls. The real credential is only
// deleted (never read); the SDK is replaced at Module._load for the real
// provider module; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("FULL-SITE-4A test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { generateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/orchestrator"
import { createCommerceTestingBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import {
  buildFullSiteCreativeRequestV1,
  FULL_SITE_REQUEST_LIMITS_V1,
  retrieveFullSiteCommerceDesignReferencesV1,
} from "../../lib/orvenix-ai/full-site-generation/request-context"
import { buildFullSiteCommerceCapabilityManifestV1 } from "../../lib/orvenix-ai/full-site-generation/capability-manifest"
import { FULL_SITE_CTA_INTENTS_V1, FULL_SITE_NAVIGATION_CONCEPTS_V1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import { buildNovaMarketNewStorePreviewInputV1, runNovaMarketFullSiteDryRunV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { NOVAMARKET_PRODUCTS_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import type { CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import type { OrvenixSiteCreationActionInput } from "../../app/actions/ai"

// ---------------------------------------------------------------- mocked SDK harness (3A pattern)

type FakeParams = { model: string; max_tokens: number; system: string; messages: Array<{ role: string; content: string }> }
type Recorder = { constructed: Array<{ apiKey?: string; timeout?: number; maxRetries?: number }>; calls: FakeParams[] }
type ProviderModule = typeof import("../../lib/orvenix-ai/full-site-generation/anthropic-provider")

const PROVIDER_COMPILED = path.join(process.cwd(), ".tmp/unit/lib/orvenix-ai/full-site-generation/anthropic-provider.js")
const TEST_MODEL = "test-fixture-model-4a"
const TEST_KEY = "test-credential-placeholder"

async function withMockedSdk<T>(respond: (params: FakeParams) => unknown | Promise<unknown>, run: (mod: ProviderModule, recorder: Recorder) => Promise<T>): Promise<T> {
  const recorder: Recorder = { constructed: [], calls: [] }
  class FakeAnthropic {
    constructor(options: Recorder["constructed"][number]) {
      recorder.constructed.push({ ...options })
    }
    messages = {
      create: async (params: FakeParams) => {
        recorder.calls.push(params)
        return respond(params)
      },
    }
  }
  const moduleRef = Module as unknown as { _load: (...args: unknown[]) => unknown }
  const originalLoad = moduleRef._load
  moduleRef._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@anthropic-ai/sdk") return FakeAnthropic
    return (originalLoad as (...args: unknown[]) => unknown).call(this, request, parent, isMain)
  }
  try {
    delete require.cache[PROVIDER_COMPILED]
    const mod = (await import("../../lib/orvenix-ai/full-site-generation/anthropic-provider")) as ProviderModule
    return await run(mod, recorder)
  } finally {
    moduleRef._load = originalLoad
    delete require.cache[PROVIDER_COMPILED]
  }
}

const text = (value: string, stopReason = "end_turn") => ({ stop_reason: stopReason, content: [{ type: "text", text: value }] })
const json = (value: unknown, stopReason = "end_turn") => text(JSON.stringify(value), stopReason)

async function buildWith(provider: unknown): Promise<AutonomousMultiPageSiteBuilderResult> {
  return runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), commerceArchitecture: { provider: provider as never } })
}

const deterministicSlugs = async () => (await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())).plan.pages.map((page) => page.slug)

function assertValidPlan(run: AutonomousMultiPageSiteBuilderResult) {
  assert.equal(validateSiteCreationPlanV2(run.plan, { maxPages: 12, maxBytes: 1_000_000 }).ok, true)
}

// ---------------------------------------------------------------- 1-3) valid responses through the REAL downstream pipeline

test("valid editorial response: one request, injected model, bounded context, validator + adapter + compiler applied", async () => {
  await withMockedSdk(() => json(createCommerceTestingBlueprintV1("editorial-commerce")), async (mod, recorder) => {
    const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: TEST_MODEL, apiKey: TEST_KEY })
    const run = await buildWith(provider)
    assert.equal(recorder.calls.length, 1, "exactly one provider request per generation")
    assert.deepEqual(recorder.constructed, [{ apiKey: TEST_KEY, timeout: 120_000, maxRetries: 0 }])
    assert.equal(recorder.calls[0].model, TEST_MODEL)
    assert.equal(recorder.calls[0].max_tokens, 14_000)
    assert.ok(recorder.calls[0].system.includes("Director Creativo") && recorder.calls[0].system.includes("notAvailable"))
    const context = JSON.parse(recorder.calls[0].messages[0].content)
    assert.equal(context.catalog.productCount, 24)
    assert.equal(context.catalog.categories.length, 6)
    assert.ok(context.designReferences.length >= 2 && context.designReferences.every((reference: Record<string, unknown>) => !("id" in reference)))
    assert.ok(recorder.calls[0].messages[0].content.length < FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength)
    assert.equal(run.fullSiteCreative.lifecycle.status, "applied")
    assert.deepEqual({ provider: run.fullSiteCreative.lifecycle.status === "applied" && run.fullSiteCreative.lifecycle.providerKey, model: run.fullSiteCreative.lifecycle.status === "applied" && run.fullSiteCreative.lifecycle.modelKey }, { provider: "anthropic", model: TEST_MODEL })
    assert.equal(run.fullSiteCreative.commerceFallbackApplied, false)
    assert.deepEqual(run.plan.pages.map((page) => page.slug), ["home", "productos", "producto-bocina-portatil-pulse", "producto-teclado-mecanico-compacto"])
    assertValidPlan(run)
  })
})

test("valid catalog-heavy response (```json fenced) -> category pages from the blueprint", async () => {
  await withMockedSdk(() => text("```json\n" + JSON.stringify(createCommerceTestingBlueprintV1("catalog-heavy-commerce")) + "\n```"), async (mod, recorder) => {
    const run = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: TEST_MODEL, apiKey: TEST_KEY }))
    assert.equal(recorder.calls.length, 1)
    assert.equal(run.fullSiteCreative.lifecycle.status, "applied")
    assert.deepEqual(run.plan.pages.map((page) => page.slug), ["home", "productos", "categoria-tecnologia", "categoria-audio", "producto-tablet-nova-10"])
    assertValidPlan(run)
  })
})

test("model selection is injected at the provider boundary (A/B comparable), timeout/max_tokens bounded, no hidden default model", async () => {
  await withMockedSdk(() => json(createCommerceTestingBlueprintV1("editorial-commerce")), async (mod, recorder) => {
    await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: "model-a-fixture", apiKey: TEST_KEY, timeoutMs: 999_999, maxTokens: 50 }))
    await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: "model-b-fixture", apiKey: TEST_KEY, timeoutMs: 1 }))
    assert.deepEqual(recorder.calls.map((call) => call.model), ["model-a-fixture", "model-b-fixture"])
    assert.deepEqual(recorder.constructed.map((options) => options.timeout), [240_000, 5_000], "timeout clamped to [5s, 240s]")
    assert.deepEqual(recorder.calls.map((call) => call.max_tokens), [2_000, 14_000], "max_tokens clamped")
    assert.equal(recorder.calls[0].system, recorder.calls[1].system, "same static prompt for both models")
    assert.deepEqual(JSON.parse(recorder.calls[0].messages[0].content), JSON.parse(recorder.calls[1].messages[0].content), "same facts/references/manifest")
  })
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/full-site-generation/anthropic-provider.ts"), "utf8")
  assert.equal(/claude-|haiku|sonnet|opus/i.test(source.replace(/\/\*[\s\S]*?\*\//g, "")), false, "no hard-coded model in the Full-Site provider")
  const cdSource = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/creative-director/anthropic-provider.ts"), "utf8")
  assert.ok(cdSource.includes('const DEFAULT_MODEL = "claude-haiku-4-5-20251001"'), "Creative Director Haiku configuration unchanged")
})

// ---------------------------------------------------------------- 4-12) failures: normalized reasons, safe fallback, no stranded customer

const FAILURE_CASES: Array<{ name: string; respond: (params: FakeParams) => unknown; status: "failed" | "rejected"; reason: string }> = [
  { name: "malformed JSON", respond: () => text("{\"version\": 1, \"pages\": [}"), status: "failed", reason: "parse_error" },
  { name: "prose around JSON", respond: () => text("Aqui tienes: {\"version\":1}. Espero que ayude."), status: "failed", reason: "parse_error" },
  { name: "array instead of object", respond: () => text("[1,2,3]"), status: "failed", reason: "parse_error" },
  { name: "trailing code after object", respond: () => text("{\"version\":1}\n<script>alert(1)</script>"), status: "failed", reason: "parse_error" },
  { name: "empty response", respond: () => ({ content: [] }), status: "failed", reason: "empty_response" },
  { name: "max_tokens stop with incomplete JSON", respond: () => text("{\"version\":1", "max_tokens"), status: "failed", reason: "output_truncated" },
  { name: "max_tokens stop with apparently complete JSON", respond: () => json(createCommerceTestingBlueprintV1("editorial-commerce"), "max_tokens"), status: "failed", reason: "output_truncated" },
  { name: "SDK timeout", respond: () => { throw Object.assign(new Error("Request timed out."), { name: "APIConnectionTimeoutError" }) }, status: "failed", reason: "timeout" },
  { name: "provider exception (500 with sensitive text)", respond: () => { throw Object.assign(new Error("upstream failed for key test-credential-placeholder site_secret"), { status: 500 }) }, status: "failed", reason: "provider_error" },
  { name: "valid JSON wrong schema", respond: () => json({ hello: "world" }), status: "rejected", reason: "schema_invalid" },
  { name: "hostile schema", respond: () => json(createCommerceTestingBlueprintV1("hostile")), status: "rejected", reason: "schema_invalid" },
  {
    name: "invented product",
    respond: () => {
      const blueprint = createCommerceTestingBlueprintV1("editorial-commerce") as { pages: Array<{ sections: Array<{ refs?: unknown[] }> }> }
      blueprint.pages[0].sections[1].refs = [{ kind: "product", index: 99 }]
      return json(blueprint)
    },
    status: "rejected",
    reason: "grounding_invalid",
  },
  {
    name: "invented category",
    respond: () => {
      const blueprint = createCommerceTestingBlueprintV1("catalog-heavy-commerce") as { pages: Array<{ target?: unknown }> }
      blueprint.pages[2].target = { kind: "category", key: "juguetes-inventados" }
      return json(blueprint)
    },
    status: "rejected",
    reason: "grounding_invalid",
  },
  {
    name: "forbidden route/code/style/price fields",
    respond: () => {
      const blueprint = createCommerceTestingBlueprintV1("editorial-commerce") as { pages: Array<{ sections: Array<Record<string, unknown>> }> }
      Object.assign(blueprint.pages[0].sections[0], { href: "https://evil.example", className: "fixed", style: "x", priceMxn: 1, component: "Evil" })
      return json(blueprint)
    },
    status: "rejected",
    reason: "schema_invalid",
  },
]

for (const failure of FAILURE_CASES) {
  test(`failure: ${failure.name} -> ${failure.status}/${failure.reason}, deterministic fallback, site still generated`, async () => {
    const expected = await deterministicSlugs()
    await withMockedSdk(failure.respond, async (mod, recorder) => {
      const run = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: TEST_MODEL, apiKey: TEST_KEY }))
      assert.equal(recorder.calls.length, 1, "one request, no retry")
      const lifecycle = run.fullSiteCreative.lifecycle
      assert.equal(lifecycle.status, failure.status)
      assert.equal("reasonCode" in lifecycle ? lifecycle.reasonCode : undefined, failure.reason)
      assert.equal(JSON.stringify(lifecycle).includes("test-credential-placeholder"), false, "no raw provider error / secret in the lifecycle")
      assert.equal(JSON.stringify(lifecycle).includes("site_secret"), false)
      assert.deepEqual(run.plan.pages.map((page) => page.slug), expected, "deterministic commerce architecture")
      assertValidPlan(run)
    })
  })
}

test("missing configuration: no credential or invalid model -> missing_configuration, SDK never constructed, fallback", async () => {
  await withMockedSdk(() => json({}), async (mod, recorder) => {
    const noKey = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: TEST_MODEL }))
    const badModel = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: "", apiKey: TEST_KEY }))
    const evilModel = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: "../../etc/passwd", apiKey: TEST_KEY }))
    for (const run of [noKey, badModel, evilModel]) {
      assert.equal(run.fullSiteCreative.lifecycle.status, "failed")
      assert.equal("reasonCode" in run.fullSiteCreative.lifecycle && run.fullSiteCreative.lifecycle.reasonCode, "missing_configuration")
      assertValidPlan(run)
    }
    assert.equal(recorder.constructed.length, 0)
    assert.equal(recorder.calls.length, 0)
  })
})

test("disabled: no provider -> lifecycle disabled and the exact deterministic site", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  assert.deepEqual(run.fullSiteCreative, { lifecycle: { status: "disabled", reasonCode: "disabled" }, commerceFallbackApplied: false })
  assert.deepEqual(run.plan.pages.map((page) => page.slug), await deterministicSlugs())
})

test("orchestrator hard timeout (provider hangs) -> failed/timeout without throwing", async () => {
  const result = await generateFullSiteCreativeBlueprintV1({ provider: { generate: () => new Promise(() => {}) }, requestContext: {}, grounding: {}, timeoutMs: 20 })
  assert.equal(result.ok, false)
  assert.equal(result.lifecycle.status, "failed")
  assert.equal("reasonCode" in result.lifecycle && result.lifecycle.reasonCode, "timeout")
})

// ---------------------------------------------------------------- parser

test("parser: exactly one JSON object; strings containing braces are safe; oversize rejected; never eval", async () => {
  await withMockedSdk(() => json({}), async (mod) => {
    assert.deepEqual(mod.parseFullSiteProviderResponseV1('{"a":"} { not code","b":[1,{"c":"}"}]}'), { a: "} { not code", b: [1, { c: "}" }] })
    assert.deepEqual(mod.parseFullSiteProviderResponseV1("```json\n{\"a\":1}\n```"), { a: 1 })
    assert.deepEqual(mod.parseFullSiteProviderResponseV1("\ufeff  {\"a\":1}  "), { a: 1 })
    for (const bad of ["", "null", "\"x\"", "[{}]", "{\"a\":1} extra", "{\"a\":1", "x{\"a\":1}", "{\"a\":1}\n```", "```json\n{\"a\":1}\n```\n```json\n{\"b\":2}\n```", "{\"a\": function(){}}"]) {
      assert.throws(() => mod.parseFullSiteProviderResponseV1(bad), /full_site_provider_parse_error/, bad)
    }
    assert.throws(() => mod.parseFullSiteProviderResponseV1(`{"a":"${"x".repeat(130_000)}"}`), /parse_error/)
    const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/full-site-generation/anthropic-provider.ts"), "utf8")
    assert.equal(/\beval\s*\(|new Function\s*\(/.test(source), false)
  })
})

test("response extraction: multiple text blocks combine; thinking/tool blocks ignored; max_tokens metadata preserved", async () => {
  await withMockedSdk(() => json({}), async (mod) => {
    assert.deepEqual(
      mod.extractFullSiteProviderTextV1({
        stop_reason: "end_turn",
        content: [
          { type: "thinking", thinking: "hidden" },
          { type: "text", text: "{\"a\":" },
          { type: "tool_use", input: { ignored: true } },
          { type: "text", text: "1}" },
        ],
      }),
      { text: "{\"a\":1}", stopReason: "end_turn", textBlockCount: 2, nonTextBlockCount: 2 },
    )
    assert.deepEqual(mod.parseFullSiteProviderResponseV1(mod.extractFullSiteProviderTextV1({ content: [{ type: "text", text: "{\"a\":1}" }] }).text), { a: 1 })
    assert.equal(mod.extractFullSiteProviderTextV1({ stop_reason: "max_tokens", content: [{ type: "text", text: "{\"a\":1}" }] }).stopReason, "max_tokens")
  })
})


test("safe diagnostics: structural categories, metadata and fingerprints never expose raw response", async () => {
  await withMockedSdk(() => json({}), async (mod) => {
    const diagnose = (value: string, stopReason = "end_turn") => mod.buildFullSiteProviderResponseDiagnosticsV1(text(value, stopReason))
    const cases: Array<{ name: string; value: string; category: string; balanced: boolean; fence?: boolean; multipleFence?: boolean }> = [
      { name: "valid raw JSON", value: '{"a":1}', category: "none", balanced: true },
      { name: "valid fenced JSON", value: '```json\n{"a":1}\n```', category: "none", balanced: true, fence: true },
      { name: "BOM + whitespace", value: '\ufeff  {"a":1}  ', category: "none", balanced: true },
      { name: "unclosed object", value: '{"a":1', category: "parse_incomplete", balanced: false },
      { name: "unclosed array", value: '[1,2', category: "parse_incomplete", balanced: false },
      { name: "unterminated string", value: '{"a":"x}', category: "parse_incomplete", balanced: false },
      { name: "brace inside JSON string", value: '{"a":"} {"}', category: "none", balanced: true },
      { name: "escaped quote", value: '{"a":"\\\"}"}', category: "none", balanced: true },
      { name: "two root objects", value: '{"a":1}{"b":2}', category: "parse_ambiguous", balanced: false },
      { name: "multiple fenced objects", value: '```json\n{"a":1}\n```\n```json\n{"b":2}\n```', category: "parse_ambiguous", balanced: false, fence: true, multipleFence: true },
      { name: "array root", value: '[1,2,3]', category: "non_object_root", balanced: true },
      { name: "scalar root", value: 'true', category: "non_object_root", balanced: false },
      { name: "JSON + JavaScript", value: '{"a":1}\nalert(1)', category: "parse_ambiguous", balanced: false },
      { name: "JSON + script tag", value: '{"a":1}\n<script>alert(1)</script>', category: "parse_ambiguous", balanced: false },
      { name: "empty response", value: '', category: "empty", balanced: false },
    ]
    for (const entry of cases) {
      const diagnostic = diagnose(entry.value)
      assert.equal(diagnostic.parseFailureCategory, entry.category, entry.name)
      assert.equal(diagnostic.balancedJsonStructure, entry.balanced, entry.name)
      assert.equal(diagnostic.fenceDetected, Boolean(entry.fence), entry.name)
      assert.equal(diagnostic.multipleFenceDetected, Boolean(entry.multipleFence), entry.name)
      if (entry.value) assert.equal(JSON.stringify(diagnostic).includes(entry.value), false, `${entry.name}: raw response leaked`)
      assert.match(diagnostic.responseFingerprint, /^[a-f0-9]{64}$/)
    }

    const multi = mod.buildFullSiteProviderResponseDiagnosticsV1({
      stop_reason: "end_turn",
      stop_sequence: "END",
      usage: { input_tokens: 123, output_tokens: 456 },
      content: [
        { type: "thinking", thinking: "hidden" },
        { type: "text", text: "{\"a\":" },
        { type: "tool_use", input: { ignored: true } },
        { type: "text", text: "1}" },
      ],
    })
    assert.deepEqual(multi.contentBlockTypes, ["thinking", "text", "tool_use", "text"])
    assert.equal(multi.contentBlockCount, 4)
    assert.equal(multi.textBlockCount, 2)
    assert.equal(multi.nonTextBlockCount, 2)
    assert.equal(multi.textCharacterCount, 7)
    assert.equal(multi.stopReason, "end_turn")
    assert.equal(multi.stopSequencePresent, true)
    assert.equal(multi.inputTokens, 123)
    assert.equal(multi.outputTokens, 456)
    assert.equal(multi.firstNonWhitespaceCharacterClass, "object")
    assert.equal(multi.lastNonWhitespaceCharacterClass, "object")

    const truncatedIncomplete = diagnose('{"a":1', "max_tokens")
    const truncatedComplete = diagnose('{"a":1}', "max_tokens")
    assert.equal(truncatedIncomplete.stopReason, "max_tokens")
    assert.equal(truncatedIncomplete.parseFailureCategory, "parse_incomplete")
    assert.equal(truncatedComplete.stopReason, "max_tokens")
    assert.equal(truncatedComplete.parseFailureCategory, "none")

    const sameA = diagnose('{"a":1}').responseFingerprint
    const sameB = diagnose('{"a":1}').responseFingerprint
    const different = diagnose('{"a":2}').responseFingerprint
    assert.equal(sameA, sameB)
    assert.notEqual(sameA, different)
  })
})

test("provider errors carry safe diagnostics without raw response content", async () => {
  await withMockedSdk(() => text('{"version":1', "max_tokens"), async (mod) => {
    const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: TEST_MODEL, apiKey: TEST_KEY })
    await assert.rejects(
      () => provider.generate({ ok: true }),
      (error: unknown) => {
        assert.ok(error instanceof mod.FullSiteProviderErrorV1)
        assert.equal(error.code, "output_truncated")
        assert.equal(error.diagnostics?.stopReason, "max_tokens")
        assert.equal(error.diagnostics?.parseFailureCategory, "parse_incomplete")
        assert.equal(JSON.stringify(error.diagnostics).includes("version"), false)
        return true
      },
    )
  })
})

// ---------------------------------------------------------------- privacy / bounds / manifest

test("privacy: sensitive-looking internal data never reaches the serialized provider request", () => {
  const SECRETS = ["site_0612993a5809", "cliente@example.com", "scp_0307936ed9a5f38156f00fd559fd559f225dc7c73993ec4427a873f77645f67f", "cmu6fi57abcdefghijklmnopqrst", "cm2a_var_0001", "sk-ant-api03-FAKEFAKEFAKEFAKEFAKE", "/home/orvenix/apps/orvenix-builder/.env", "https://internal.example/api/admin", "prod_realdbid123"]
  const hostileProducts = [{
    name: "Tablet cliente@example.com",
    description: "Ver https://internal.example/api/admin o /home/orvenix/apps/orvenix-builder/.env -- key sk-ant-api03-FAKEFAKEFAKEFAKEFAKE sitio site_0612993a5809",
    category: "Tecnología",
    storeBinding: { productId: "cmu6fi57abcdefghijklmnopqrst" },
    variants: [{ label: "64 GB", priceMxn: 549900, availability: "in_stock", variantId: "cm2a_var_0001", sku: "prod_realdbid123", stock: 7 }],
    siteId: "site_0612993a5809",
    previewId: "scp_0307936ed9a5f38156f00fd559fd559f225dc7c73993ec4427a873f77645f67f",
  }] as unknown as CommerceProductFactV1[]
  const request = buildFullSiteCreativeRequestV1({
    industry: "tienda en linea",
    objective: "Vender -- contacto cliente@example.com",
    products: hostileProducts,
    designReferences: retrieveFullSiteCommerceDesignReferencesV1(),
  })
  const serialized = JSON.stringify(request.context)
  for (const secret of SECRETS) assert.equal(serialized.includes(secret), false, `leaked ${secret}`)
  for (const key of ["storeBinding", "variantId", "\"sku\"", "\"stock\"", "siteId", "previewId", "productId", "userId", "email"]) assert.equal(serialized.includes(key), false, key)
  assert.equal(request.context.catalog.products[0].priceMxn, 549900, "price is visible as read-only merchandising context")
  assert.equal(request.context.catalog.products[0].availability, "in_stock", "availability enum, never a stock count")
})

test("bounds: internal architect universe is NOT the public 8-product limit; context stays under the size ceiling", () => {
  const products = [...NOVAMARKET_PRODUCTS_V1, ...NOVAMARKET_PRODUCTS_V1, ...NOVAMARKET_PRODUCTS_V1].map((product, index) => ({ name: `${product.name} ${index}`, description: product.shortDescription, category: product.category, variants: [{ label: "U", priceMxn: product.priceMxn, availability: "in_stock" as const }] }))
  const request = buildFullSiteCreativeRequestV1({ products })
  assert.equal(request.context.catalog.productCount, FULL_SITE_REQUEST_LIMITS_V1.maxProducts, "72 inputs -> capped at the 60-product internal limit")
  assert.ok(request.context.catalog.productCount > 8)
  assert.ok(JSON.stringify(request.context).length <= FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength)
  assert.ok((request.context.designReferences ?? []).length <= FULL_SITE_REQUEST_LIMITS_V1.maxDesignReferences)
})

test("capability manifest: derived from the real vocabulary; unsupported features are never advertised as available", () => {
  const manifest = buildFullSiteCommerceCapabilityManifestV1()
  assert.deepEqual(manifest.ctaIntents, FULL_SITE_CTA_INTENTS_V1)
  assert.deepEqual(manifest.navigationConcepts, FULL_SITE_NAVIGATION_CONCEPTS_V1)
  assert.deepEqual(manifest.pagePurposes, ["home", "catalog", "category", "product_detail", "help"])
  for (const feature of ["search", "customer_accounts", "order_history", "wishlist", "shipping_calculator", "coupons", "reviews", "marketplace_sellers"]) {
    assert.ok((manifest.notAvailable as readonly string[]).includes(feature))
    assert.equal(feature in manifest.runtime, false)
  }
  assert.equal(manifest.runtime.cart, true)
  assert.equal(manifest.runtime.productDetailPages, true)
})

// ---------------------------------------------------------------- server-only / client selection

function importGraph(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry) || seen.size > 4000) return seen
  seen.add(entry)
  const source = fs.readFileSync(entry, "utf8")
  for (const match of source.matchAll(/(?:import|export)\s[^"']*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
    const spec = match[1] ?? match[2]
    if (!spec) continue
    if (spec === "@anthropic-ai/sdk") { seen.add("@anthropic-ai/sdk"); continue }
    const base = spec.startsWith("@/") ? path.join(process.cwd(), spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(entry), spec) : null
    if (!base) continue
    const file = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    if (file) importGraph(file, seen)
  }
  return seen
}

test("server-only: no 'use client' module can reach the Full-Site provider or the Anthropic SDK", () => {
  const clientFiles: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name.startsWith("dev-")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?)$/.test(entry.name) && /^\s*["']use client["']/.test(fs.readFileSync(full, "utf8"))) clientFiles.push(full)
    }
  }
  walk(path.join(process.cwd(), "app"))
  walk(path.join(process.cwd(), "components"))
  assert.ok(clientFiles.length > 10)
  const provider = path.join(process.cwd(), "lib/orvenix-ai/full-site-generation/anthropic-provider.ts")
  for (const file of clientFiles) {
    const graph = importGraph(file)
    assert.equal(graph.has(provider), false, `${path.relative(process.cwd(), file)} reaches the Full-Site provider`)
  }
  const index = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/full-site-generation/index.ts"), "utf8")
  assert.equal(/anthropic-provider/.test(index.replace(/\/\/.*$/gm, "")), false, "barrel never re-exports the real provider")
})

test("client cannot select provider or model: the public action has no such field and never passes one", () => {
  const input: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- no provider/model/commerceArchitecture on the public action
    commerceArchitecture: { provider: {}, model: "x" },
  }
  void input
  const action = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  assert.equal(/commerceArchitecture|full-site-generation|FullSite/.test(action), false)
})

// ---------------------------------------------------------------- NovaMarket no-network dry-run

test("NovaMarket dry-run: deterministic / mock-editorial / mock-catalog run the same downstream; real refuses without authorization", async () => {
  const deterministic = await runNovaMarketFullSiteDryRunV1({ mode: "deterministic" })
  const editorial = await runNovaMarketFullSiteDryRunV1({ mode: "mock-editorial" })
  const catalog = await runNovaMarketFullSiteDryRunV1({ mode: "mock-catalog" })
  for (const result of [deterministic, editorial, catalog]) {
    assert.equal(result.status, "completed")
    if (result.status === "completed") assertValidPlan(result.run)
  }
  if (editorial.status === "completed" && catalog.status === "completed" && deterministic.status === "completed") {
    assert.equal(deterministic.run.fullSiteCreative.lifecycle.status, "disabled")
    assert.equal(editorial.run.fullSiteCreative.lifecycle.status, "applied")
    assert.equal(catalog.run.fullSiteCreative.lifecycle.status, "applied")
    assert.notDeepEqual(editorial.run.plan.pages.map((page) => page.slug), catalog.run.plan.pages.map((page) => page.slug))
    assert.deepEqual(editorial.run.plan.commerce?.provisioning, catalog.run.plan.commerce?.provisioning, "identical authoritative facts")
  }
  const calls: string[] = []
  const spy = { generate: async () => { calls.push("called"); return {} } }
  assert.deepEqual(await runNovaMarketFullSiteDryRunV1({ mode: "real" }), { status: "skipped", reason: "real_provider_not_authorized" })
  assert.deepEqual(await runNovaMarketFullSiteDryRunV1({ mode: "real", realProvider: spy }), { status: "skipped", reason: "real_provider_not_authorized" })
  assert.deepEqual(await runNovaMarketFullSiteDryRunV1({ mode: "real", realProvider: spy, authorizeRealProviderCall: true, env: { NODE_ENV: "production", ORVENIX_DEV_ASSISTED_E2E: "1" } }), { status: "skipped", reason: "real_provider_not_authorized" })
  assert.deepEqual(calls, [], "no real provider invoked")
})

test("zz) zero network attempts across the FULL-SITE-4A suite", () => {
  assert.equal(networkAttempts, 0)
})
