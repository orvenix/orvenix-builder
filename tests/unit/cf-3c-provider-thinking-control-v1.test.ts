import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"

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

// CF-3C: ZERO real provider calls. The SDK is replaced at Module._load; credentials are deleted; fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-3C test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import { createCommerceTestingBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { supportsThinkingModeV1, thinkingRequestParamV1 } from "../../lib/orvenix-ai/full-site-generation/thinking-support"
import type { FullSiteProviderResponseTelemetryV1 } from "../../lib/orvenix-ai/full-site-generation/anthropic-provider"

type FakeParams = { model: string; max_tokens: number; system: string; messages: Array<{ role: string; content: string }>; thinking?: unknown }
type Recorder = { constructed: Array<{ apiKey?: string; timeout?: number; maxRetries?: number }>; calls: FakeParams[] }
type ProviderModule = typeof import("../../lib/orvenix-ai/full-site-generation/anthropic-provider")

const PROVIDER_COMPILED = path.join(process.cwd(), ".tmp/unit/lib/orvenix-ai/full-site-generation/anthropic-provider.js")
const SONNET_5 = "claude-sonnet-5"
const UNVERIFIED_MODEL = "test-fixture-model-3c"
const TEST_KEY = "test-credential-placeholder"
const REASONING_MARKER = "REASONING-MARKER-must-never-leak {\"draft\":true}"

async function withMockedSdk<T>(respond: (params: FakeParams) => unknown | Promise<unknown>, run: (mod: ProviderModule, recorder: Recorder) => Promise<T>): Promise<T> {
  const recorder: Recorder = { constructed: [], calls: [] }
  class FakeAnthropic {
    constructor(options: Recorder["constructed"][number]) {
      recorder.constructed.push({ ...options })
    }
    messages = {
      create: async (params: FakeParams) => {
        recorder.calls.push(structuredClone(params))
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

const blueprintJson = () => JSON.stringify(createCommerceTestingBlueprintV1("editorial-commerce"))
const message = (content: unknown[], stopReason = "end_turn", usage?: { input_tokens: number; output_tokens: number }) => ({ stop_reason: stopReason, content, ...(usage ? { usage } : {}) })

async function buildWith(provider: unknown): Promise<AutonomousMultiPageSiteBuilderResult> {
  return runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), commerceArchitecture: { provider: provider as never } })
}

// ─── A. default mode preserves the previous request ─────────────────────────────

test("A default: omitted or explicit 'default' thinkingMode sends NO thinking field (previous request shape)", async () => {
  await withMockedSdk(() => message([{ type: "text", text: blueprintJson() }]), async (mod, recorder) => {
    const omitted = mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY })
    const explicit = mod.createAnthropicFullSiteCreativeProviderV1({ model: UNVERIFIED_MODEL, apiKey: TEST_KEY, thinkingMode: "default" })
    assert.equal(omitted.thinkingMode, "default")
    await omitted.generate({ ok: true })
    await explicit.generate({ ok: true })
    for (const call of recorder.calls) {
      assert.equal("thinking" in call, false)
      assert.deepEqual(Object.keys(call).sort(), ["max_tokens", "messages", "model", "system"])
    }
  })
})

// ─── B. disabled on Sonnet 5 ───────────────────────────────────────────────────

test("B disabled + claude-sonnet-5: exactly thinking {type:'disabled'}; nothing else in the request changes", async () => {
  await withMockedSdk(() => message([{ type: "text", text: blueprintJson() }]), async (mod, recorder) => {
    await mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY }).generate({ facts: 1 })
    await mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, thinkingMode: "disabled" }).generate({ facts: 1 })
    const [base, disabled] = recorder.calls
    assert.deepEqual(disabled.thinking, { type: "disabled" })
    const serialized = JSON.stringify(disabled.thinking)
    assert.equal(serialized.includes("budget_tokens"), false)
    assert.equal(serialized.includes("enabled"), false)
    const { thinking: _thinking, ...rest } = disabled
    void _thinking
    assert.deepEqual(rest, base, "model, max_tokens, system prompt and messages are identical")
    assert.deepEqual(recorder.constructed.map((options) => [options.timeout, options.maxRetries]), [[120_000, 0], [120_000, 0]])
  })
  assert.deepEqual(thinkingRequestParamV1("disabled"), { type: "disabled" })
  assert.equal(thinkingRequestParamV1("default"), undefined)
})

// ─── C. thinking then text ─────────────────────────────────────────────────────

test("C thinking block then text block: only text reaches the parser; telemetry records both types (lengths only)", async () => {
  const telemetry: FullSiteProviderResponseTelemetryV1[] = []
  await withMockedSdk(() => message([{ type: "thinking", thinking: REASONING_MARKER, signature: "sig" }, { type: "text", text: blueprintJson() }], "end_turn", { input_tokens: 10, output_tokens: 20 }), async (mod) => {
    const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, thinkingMode: "disabled", onResponseTelemetry: (entry) => telemetry.push(entry) })
    const parsed = await provider.generate({ ok: true })
    assert.deepEqual(parsed, JSON.parse(blueprintJson()))
    const run = await buildWith(provider)
    assert.equal(run.fullSiteCreative.lifecycle.status, "applied")
  })
  assert.equal(telemetry.length, 2)
  assert.deepEqual(telemetry[0], {
    execution: { model: SONNET_5, maxTokens: 14_000, timeoutMs: 120_000, thinkingMode: "disabled" },
    stopReason: "end_turn",
    inputTokens: 10,
    outputTokens: 20,
    contentBlocks: { total: 2, byType: { thinking: 1, text: 1 }, textChars: blueprintJson().length, thinkingChars: REASONING_MARKER.length },
  })
})

// ─── D. thinking only + max_tokens ─────────────────────────────────────────────

test("D thinking-only + max_tokens: output_truncated, telemetry captured, never parsed", async () => {
  const telemetry: FullSiteProviderResponseTelemetryV1[] = []
  await withMockedSdk(() => message([{ type: "thinking", thinking: REASONING_MARKER }], "max_tokens", { input_tokens: 9971, output_tokens: 14000 }), async (mod) => {
    const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, onResponseTelemetry: (entry) => telemetry.push(entry) })
    await assert.rejects(() => provider.generate({ ok: true }), (error: unknown) => {
      assert.ok(error instanceof mod.FullSiteProviderErrorV1)
      assert.equal(error.code, "output_truncated", "truncation wins before any parse/empty handling")
      assert.equal(error.diagnostics?.textCharacterCount, 0)
      assert.equal(error.diagnostics?.parseFailureCategory, "empty")
      assert.deepEqual(error.diagnostics?.contentBlocks.byType, { thinking: 1 })
      return true
    })
  })
  assert.deepEqual(telemetry[0].contentBlocks, { total: 1, byType: { thinking: 1 }, textChars: 0, thinkingChars: REASONING_MARKER.length })
  assert.equal(telemetry[0].stopReason, "max_tokens")
})

test("D' max_tokens with an apparently complete blueprint after thinking is still output_truncated (fail closed)", async () => {
  await withMockedSdk(() => message([{ type: "thinking", thinking: "x" }, { type: "text", text: blueprintJson() }], "max_tokens"), async (mod) => {
    const run = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, thinkingMode: "disabled" }))
    assert.equal(run.fullSiteCreative.lifecycle.status, "failed")
    assert.equal("reasonCode" in run.fullSiteCreative.lifecycle && run.fullSiteCreative.lifecycle.reasonCode, "output_truncated")
  })
})

// ─── E. multiple text blocks ───────────────────────────────────────────────────

test("E multiple text blocks: concatenated in block order, thinking/tool blocks skipped, deterministic", async () => {
  const json = blueprintJson()
  const cut = Math.floor(json.length / 2)
  const content = [
    { type: "thinking", thinking: REASONING_MARKER },
    { type: "text", text: json.slice(0, cut) },
    { type: "redacted_thinking", data: "opaque" },
    { type: "tool_use", input: { "}": "{" } },
    { type: "text", text: json.slice(cut) },
  ]
  await withMockedSdk(() => message(content), async (mod) => {
    const first = mod.extractFullSiteProviderTextV1(message(content))
    const second = mod.extractFullSiteProviderTextV1(message(content))
    assert.deepEqual(first, second)
    assert.equal(first.text, json)
    assert.equal(first.textBlockCount, 2)
    assert.equal(first.nonTextBlockCount, 3)
    assert.deepEqual(await mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY }).generate({ ok: true }), JSON.parse(json))
    assert.deepEqual(mod.buildFullSiteProviderContentBlockTelemetryV1(message(content)), { total: 5, byType: { thinking: 1, text: 2, redacted_thinking: 1, tool_use: 1 }, textChars: json.length, thinkingChars: REASONING_MARKER.length })
  })
})

// ─── F. unsupported combination ────────────────────────────────────────────────

test("F unsupported: explicit disabled on an unverified model, or an unknown mode -> missing_configuration before the SDK exists", async () => {
  assert.equal(supportsThinkingModeV1(SONNET_5, "disabled"), true)
  assert.equal(supportsThinkingModeV1(UNVERIFIED_MODEL, "disabled"), false)
  assert.equal(supportsThinkingModeV1(UNVERIFIED_MODEL, "default"), true)
  await withMockedSdk(() => message([{ type: "text", text: blueprintJson() }]), async (mod, recorder) => {
    const unsupported = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: UNVERIFIED_MODEL, apiKey: TEST_KEY, thinkingMode: "disabled" }))
    const unknownMode = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, thinkingMode: "enabled" as never }))
    for (const run of [unsupported, unknownMode]) {
      assert.equal(run.fullSiteCreative.lifecycle.status, "failed")
      assert.equal("reasonCode" in run.fullSiteCreative.lifecycle && run.fullSiteCreative.lifecycle.reasonCode, "missing_configuration")
    }
    assert.equal(recorder.constructed.length, 0)
    assert.equal(recorder.calls.length, 0)
  })
})

// ─── G. no reasoning content leak ──────────────────────────────────────────────

test("G no leak: telemetry, diagnostics, errors and lifecycles carry metadata only, never thinking text", async () => {
  const telemetry: FullSiteProviderResponseTelemetryV1[] = []
  const surfaces: string[] = []
  for (const stopReason of ["end_turn", "max_tokens"]) {
    await withMockedSdk(() => message([{ type: "thinking", thinking: REASONING_MARKER }, { type: "text", text: stopReason === "end_turn" ? "not json" : "" }], stopReason), async (mod) => {
      const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, thinkingMode: "disabled", onResponseTelemetry: (entry) => telemetry.push(entry) })
      await provider.generate({ ok: true }).catch((error: { code?: string; diagnostics?: unknown; message?: string }) => surfaces.push(JSON.stringify({ code: error.code, message: error.message, diagnostics: error.diagnostics })))
      const run = await buildWith(provider)
      surfaces.push(JSON.stringify(run.fullSiteCreative), JSON.stringify(run.warnings))
      surfaces.push(JSON.stringify(mod.buildFullSiteProviderResponseDiagnosticsV1(message([{ type: "thinking", thinking: REASONING_MARKER }]))))
    })
  }
  surfaces.push(JSON.stringify(telemetry))
  assert.ok(telemetry.length >= 2)
  for (const surface of surfaces) {
    assert.equal(surface.includes("REASONING-MARKER"), false, surface.slice(0, 200))
    assert.equal(surface.includes(TEST_KEY), false)
  }
})

test("observer failures never change the generation outcome", async () => {
  await withMockedSdk(() => message([{ type: "text", text: blueprintJson() }]), async (mod) => {
    const provider = mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, onResponseTelemetry: () => { throw new Error("observer bug") } })
    assert.deepEqual(await provider.generate({ ok: true }), JSON.parse(blueprintJson()))
  })
})

// ─── CF-3B call #2 regression (observed 2026-10-01) ────────────────────────────

/**
 * Observed: claude-sonnet-5, thinking omitted (model default), max_tokens 14000,
 * timeout 240000 -> stop_reason max_tokens, input 9971, output 14000, ZERO text.
 * The block TYPES were not recorded at the time, so they are represented as
 * UNKNOWN: the regression covers every content shape consistent with the
 * evidence (no blocks, an opaque block, thinking-only, redacted-only) and does
 * not claim which one happened.
 */
const CF3B_CALL2_OBSERVED = { stopReason: "max_tokens", inputTokens: 9971, outputTokens: 14000, textChars: 0, contentBlockTypes: "unknown" } as const
const CALL2_CONSISTENT_SHAPES: Array<{ name: string; content: unknown[] }> = [
  { name: "no blocks", content: [] },
  { name: "opaque block", content: [{ kind: "unrecorded" }] },
  { name: "thinking only", content: [{ type: "thinking", thinking: "" }] },
  { name: "redacted thinking only", content: [{ type: "redacted_thinking", data: "opaque" }] },
]

for (const shape of CALL2_CONSISTENT_SHAPES) {
  test(`CF-3B call #2 regression (${shape.name}): lifecycle failed/output_truncated, token usage preserved`, async () => {
    const telemetry: FullSiteProviderResponseTelemetryV1[] = []
    await withMockedSdk(() => message(shape.content, CF3B_CALL2_OBSERVED.stopReason, { input_tokens: CF3B_CALL2_OBSERVED.inputTokens, output_tokens: CF3B_CALL2_OBSERVED.outputTokens }), async (mod, recorder) => {
      const run = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, timeoutMs: 240_000, onResponseTelemetry: (entry) => telemetry.push(entry) }))
      assert.equal(recorder.calls.length, 1, "one request, no retry")
      assert.equal("thinking" in recorder.calls[0], false, "call #2 omitted thinking (model default)")
      assert.equal(run.fullSiteCreative.lifecycle.status, "failed")
      assert.equal("reasonCode" in run.fullSiteCreative.lifecycle && run.fullSiteCreative.lifecycle.reasonCode, "output_truncated")
    })
    assert.equal(telemetry[0].contentBlocks.textChars, CF3B_CALL2_OBSERVED.textChars)
    assert.equal(telemetry[0].inputTokens, CF3B_CALL2_OBSERVED.inputTokens)
    assert.equal(telemetry[0].outputTokens, CF3B_CALL2_OBSERVED.outputTokens)
    assert.equal(telemetry[0].execution.timeoutMs, 240_000)
    assert.equal(telemetry[0].execution.thinkingMode, "default")
  })
}

// ─── Fingerprint semantics ─────────────────────────────────────────────────────

test("fingerprints: thinking mode and timeout are execution config -- the creative request content and inputFingerprint are unchanged", async () => {
  const fingerprints: string[] = []
  const lifecycleFingerprints: string[] = []
  await withMockedSdk(() => message([{ type: "text", text: blueprintJson() }]), async (mod, recorder) => {
    for (const config of [{}, { thinkingMode: "disabled" as const }, { thinkingMode: "disabled" as const, timeoutMs: 240_000 }]) {
      const run = await buildWith(mod.createAnthropicFullSiteCreativeProviderV1({ model: SONNET_5, apiKey: TEST_KEY, ...config }))
      const lifecycle = run.fullSiteCreative.lifecycle
      lifecycleFingerprints.push("inputFingerprint" in lifecycle ? String(lifecycle.inputFingerprint) : "")
    }
    for (const call of recorder.calls) fingerprints.push(crypto.createHash("sha256").update(call.messages[0].content).digest("hex"))
    assert.equal(new Set(recorder.calls.map((call) => call.system)).size, 1, "system prompt unchanged")
  })
  assert.equal(new Set(fingerprints).size, 1)
  assert.equal(fingerprints[0], "05187d95fb0878d288a3c1d7fd5adf083c88d422a77c0337d712aec67c9f4966", "creative request pin (CF-4D.1) unchanged by execution config")
  assert.equal(new Set(lifecycleFingerprints).size, 1)
})

test("zz) zero network attempts across the CF-3C suite", () => {
  assert.equal(networkAttempts, 0)
})
