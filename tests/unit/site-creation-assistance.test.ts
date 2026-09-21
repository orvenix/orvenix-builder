import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

type AssistanceRow = {
  id: string
  siteCreationAttemptId: string
  version: number
  roleKey: string
  strategyKey: string
  providerKey: string
  modelKey: string
  status: string
  inputFingerprint: string
  attemptKey: string
  outputFingerprint: string | null
  appliedProposal: unknown | null
  failureCode: string | null
  requestedAt: Date
  completedAt: Date | null
}

const context = {
  industryBucket: "health" as const,
  objectiveBucket: "lead_generation" as const,
  styleBucket: "professional" as const,
  siteType: "health",
}

function l2Decision() {
  return {
    kind: "L2" as const,
    context,
    reason: [] as string[],
    designMemoryPrior: {
      version: 1 as const,
      source: "design_memory" as const,
      mode: "advisory" as const,
      rankingVersion: 1 as const,
      patternVersion: 1 as const,
      level: "L2" as const,
      patternKeyHash: "a".repeat(64),
      evidence: { rankingScore: 0.9, confidence: "high" as const, qualifiedSampleSize: 20, fallbackUsed: false },
      recommendation: { context, theme: { accentHue: "purple" } },
      reason: [] as string[],
    },
  }
}

function l1Decision() {
  return {
    kind: "L1" as const,
    context,
    reason: [] as string[],
    designMemoryPrior: {
      ...l2Decision().designMemoryPrior,
      level: "L1" as const,
      evidence: { rankingScore: 0.7, confidence: "medium" as const, qualifiedSampleSize: 12, fallbackUsed: true },
      recommendation: { context },
    },
  }
}

function abstainDecision() {
  return {
    kind: "abstain" as const,
    context,
    reasonCode: "insufficient_evidence",
    reason: [] as string[],
    designMemoryPrior: null,
  }
}

function createLifecycleHarness() {
  const rows = new Map<string, AssistanceRow>()
  const calls = { provider: 0, persisted: [] as unknown[] }
  const requestedAt = new Date("2026-09-16T00:00:00.000Z")
  const completedAt = new Date("2026-09-16T00:01:00.000Z")
  const attempts = new Map([
    ["attempt_1", { id: "attempt_1", type: "ai_site_creation_preview", status: "planning", input: { userId: "user_1" } }],
  ])

  const clone = (row: AssistanceRow): AssistanceRow => ({
    ...row,
    appliedProposal: row.appliedProposal ? structuredClone(row.appliedProposal) : null,
    requestedAt: new Date(row.requestedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  })

  const client = {
    aiGenerationJob: {
      findUnique: async ({ where }: { where: { id: string } }) => attempts.get(where.id) ?? null,
    },
    designAssistance: {
      upsert: async ({ where, create }: { where: { id: string }; create: Omit<AssistanceRow, "requestedAt"> }) => {
        calls.persisted.push(create)
        const existing = rows.get(where.id)
        if (existing) return clone(existing)
        const row = { ...create, requestedAt } as AssistanceRow
        rows.set(where.id, row)
        return clone(row)
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const row = rows.get(where.id)
        return row ? clone(row) : null
      },
      updateMany: async ({ where, data }: { where: { id: string; status: "requested" }; data: Partial<AssistanceRow> }) => {
        const row = rows.get(where.id)
        if (!row || row.status !== where.status) return { count: 0 }
        rows.set(where.id, { ...row, ...data, completedAt })
        return { count: 1 }
      },
    },
  }

  return { client, rows, calls }
}

test("eligibility aplica precedencia L2/L1/abstain y disabled-by-default", async () => {
  const { decideSiteCreationThemeAssistanceEligibilityV1 } = await import("../../lib/orvenix-ai/site-creation/assistance")

  assert.deepEqual(decideSiteCreationThemeAssistanceEligibilityV1({ designMemoryDecision: l1Decision() }), { eligible: false, reason: "disabled" })
  assert.deepEqual(decideSiteCreationThemeAssistanceEligibilityV1({ designMemoryDecision: l2Decision(), enabled: true }), { eligible: false, reason: "qualified_design_memory_l2" })
  assert.deepEqual(decideSiteCreationThemeAssistanceEligibilityV1({ designMemoryDecision: l1Decision(), enabled: true }), { eligible: true, reason: "l1_contextual_prior" })
  assert.deepEqual(decideSiteCreationThemeAssistanceEligibilityV1({ designMemoryDecision: abstainDecision(), enabled: true }), { eligible: true, reason: "no_qualified_memory_theme" })
})

test("privacy-safe request contiene solo contexto abstracto y constraints objetivos", async () => {
  const { buildSiteCreationThemeAssistanceRequestV1 } = await import("../../lib/orvenix-ai/site-creation/assistance")

  const request = buildSiteCreationThemeAssistanceRequestV1({
    context,
    preferredStyleExplicit: true,
    preserveTheme: true,
    theme: { accentHue: "blue", radiusBucket: "soft" },
  })

  assert.equal(request.constraints?.preserveStyle, true)
  assert.equal(request.constraints?.preserveTheme, true)
  assert.deepEqual(request.constraints?.theme, { accentHue: "blue", radiusBucket: "soft" })
  const serialized = JSON.stringify(request)
  assert.equal(serialized.includes("Clinica"), false)
  assert.equal(serialized.includes("email"), false)
  assert.equal(serialized.includes("raw"), false)
})

test("applied assistance persiste attribution antes del provider y devuelve advisory sin provenance falso", async () => {
  const { createDeterministicDesignAssistanceProviderV1 } = await import("../../lib/orvenix-ai/assistance/testing/deterministic-provider")
  const { resolveSiteCreationThemeAssistanceAdvisoryV1 } = await import("../../lib/orvenix-ai/site-creation/assistance")
  const harness = createLifecycleHarness()
  const provider = createDeterministicDesignAssistanceProviderV1()
  const wrappedProvider = {
    request: async (request: Parameters<typeof provider.request>[0]) => {
      assert.equal(harness.rows.size, 1)
      harness.calls.provider += 1
      return provider.request(request)
    },
  }

  const result = await resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: l1Decision(),
    preferredStyleExplicit: true,
    provider: wrappedProvider,
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    enabled: true,
    lifecycleClient: harness.client,
  })

  assert.equal(result.status, "applied")
  assert.equal(harness.calls.provider, 1)
  assert.equal(harness.rows.size, 1)
  assert.equal(result.status === "applied" ? result.advisory.source : null, "third_party_assistance")
  assert.notEqual(result.status === "applied" ? result.advisory.source : null, "design_memory")
  assert.equal(JSON.stringify(harness.calls.persisted).includes("context"), false)
})

test("Retry A recupera proposal aplicada sin provider ni decision", async () => {
  const { createDeterministicDesignAssistanceProviderV1 } = await import("../../lib/orvenix-ai/assistance/testing/deterministic-provider")
  const { resolveSiteCreationThemeAssistanceAdvisoryV1 } = await import("../../lib/orvenix-ai/site-creation/assistance")
  const harness = createLifecycleHarness()
  const provider = createDeterministicDesignAssistanceProviderV1()
  let providerCalls = 0
  const wrappedProvider = {
    request: async (request: Parameters<typeof provider.request>[0]) => {
      providerCalls += 1
      return provider.request(request)
    },
  }

  const first = await resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: abstainDecision(),
    preferredStyleExplicit: false,
    provider: wrappedProvider,
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    enabled: true,
    lifecycleClient: harness.client,
  })
  assert.equal(first.status, "applied")
  assert.equal(providerCalls, 1)

  const retry = await resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: abstainDecision(),
    preferredStyleExplicit: false,
    provider: wrappedProvider,
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    enabled: true,
    lifecycleClient: harness.client,
  })

  assert.equal(retry.status, "applied")
  assert.equal(providerCalls, 1)
  assert.deepEqual(retry.status === "applied" ? retry.advisory.theme : null, first.status === "applied" ? first.advisory.theme : null)
})

test("assistance failure cae a fallback no critico", async () => {
  const { resolveSiteCreationThemeAssistanceAdvisoryV1 } = await import("../../lib/orvenix-ai/site-creation/assistance")
  const harness = createLifecycleHarness()

  const result = await resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: abstainDecision(),
    preferredStyleExplicit: false,
    provider: { request: async () => null },
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    enabled: true,
    lifecycleClient: harness.client,
  })

  assert.equal(result.status, "fallback")
  assert.equal(result.status === "fallback" ? result.reason : null, "failed")
})
