import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  DesignAssistanceGatewayTimeoutErrorV1,
  createDesignAssistanceOutputFingerprintV1,
  createDeterministicDesignAssistanceProviderV1,
  runDesignAssistanceV1,
  type DesignAssistanceLifecycleClientV1,
  type DesignAssistanceLifecycleRowV1,
  type DesignAssistanceProposalV1,
  type DesignAssistanceProviderV1,
  type DesignAssistanceRequestV1,
} from "../../lib/orvenix-ai/assistance"

const request: DesignAssistanceRequestV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  context: {
    industryBucket: "health",
    objectiveBucket: "lead_generation",
    styleBucket: "premium",
    siteType: "clinic",
  },
}

const proposal: DesignAssistanceProposalV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  theme: {
    mode: "light",
    accentHue: "blue",
    contrastBucket: "high",
    radiusBucket: "pill",
    typographyBucket: "sans",
    motionBucket: "subtle",
  },
}

type Harness = DesignAssistanceLifecycleClientV1 & {
  rows: Map<string, DesignAssistanceLifecycleRowV1>
  events: string[]
  rawPersisted: unknown[]
}

function cloneRow(row: DesignAssistanceLifecycleRowV1): DesignAssistanceLifecycleRowV1 {
  return {
    ...row,
    appliedProposal: row.appliedProposal ? structuredClone(row.appliedProposal) : null,
    requestedAt: new Date(row.requestedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  }
}

function createHarness(options: {
  attemptExists?: boolean
  failFindAttempt?: boolean
  failUpsert?: boolean
  failUpdateMany?: boolean
} = {}): Harness {
  const rows = new Map<string, DesignAssistanceLifecycleRowV1>()
  const events: string[] = []
  const rawPersisted: unknown[] = []
  const requestedAt = new Date("2026-09-15T12:00:00.000Z")
  const completedAt = new Date("2026-09-15T12:30:00.000Z")

  return {
    rows,
    events,
    rawPersisted,
    aiGenerationJob: {
      async findUnique({ where }) {
        events.push("findAttempt")
        if (options.failFindAttempt) throw new Error("raw prisma attempt failure")
        if (options.attemptExists === false) return null
        return { id: where.id, type: "ai_site_creation_preview", status: "planning", input: { userId: "user_1" } }
      },
    },
    designAssistance: {
      async findUnique({ where }) {
        events.push(`findAssistance:${where.id}`)
        const row = rows.get(where.id)
        return row ? cloneRow(row) : null
      },
      async upsert({ where, create }) {
        events.push(`upsert:${where.id}`)
        if (options.failUpsert) throw new Error("raw prisma upsert failure")
        rawPersisted.push(create)
        const existing = rows.get(where.id)
        if (existing) return cloneRow(existing)
        const row: DesignAssistanceLifecycleRowV1 = {
          ...create,
          requestedAt,
          completedAt: null,
        }
        rows.set(where.id, row)
        return cloneRow(row)
      },
      async updateMany({ where, data }) {
        events.push(`updateMany:${data.status}`)
        if (options.failUpdateMany) throw new Error("raw prisma update failure")
        const row = rows.get(where.id)
        if (!row || row.status !== where.status) return { count: 0 }
        rows.set(where.id, {
          ...row,
          ...data,
          completedAt,
        })
        return { count: 1 }
      },
    },
  }
}

function providerReturning(value: unknown, calls: string[] = []): DesignAssistanceProviderV1 {
  return {
    async request() {
      calls.push("provider")
      return value as DesignAssistanceProposalV1
    },
  }
}

async function run(params: {
  harness?: Harness
  attemptKey?: string
  provider?: DesignAssistanceProviderV1
  decision?: "apply" | "reject" | unknown
  decideThrows?: boolean
  providerKey?: string
  modelKey?: string
} = {}) {
  return runDesignAssistanceV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: params.attemptKey ?? "attempt:1",
    request,
    provider: params.provider ?? providerReturning(proposal),
    providerKey: params.providerKey ?? "provider_a",
    modelKey: params.modelKey ?? "model_a",
    lifecycleClient: params.harness ?? createHarness(),
    async decideProposal() {
      if (params.decideThrows) throw new Error("private decision failure")
      const decision = typeof params.decision === "string"
        ? { decision: params.decision }
        : params.decision ?? { decision: "apply" }
      return decision as never
    },
  })
}

function onlyRow(harness: Harness) {
  const row = Array.from(harness.rows.values())[0]
  assert.ok(row)
  return row
}

test("requested se registra antes de provider", async () => {
  const harness = createHarness()
  await run({
    harness,
    provider: {
      async request() {
        harness.events.push("provider")
        return proposal
      },
    },
  })

  const upsertIndex = harness.events.findIndex((event) => event.startsWith("upsert:"))
  const providerIndex = harness.events.indexOf("provider")
  assert.ok(upsertIndex >= 0)
  assert.ok(providerIndex > upsertIndex)
})

test("requested failure no llama provider", async () => {
  const harness = createHarness({ attemptExists: false })
  const calls: string[] = []
  const result = await run({ harness, provider: providerReturning(proposal, calls) })

  assert.deepEqual(result, { ok: false, error: "requested_failed", lifecycleError: "site_creation_attempt_not_found" })
  assert.equal(calls.length, 0)
})

test("gateway success + apply termina applied", async () => {
  const harness = createHarness()
  const result = await run({ harness, decision: "apply" })

  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.status, "applied")
  assert.equal(onlyRow(harness).status, "applied")
})

test("gateway success + reject termina rejected", async () => {
  const harness = createHarness()
  const result = await run({ harness, decision: "reject" })

  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.status, "rejected")
  assert.equal(onlyRow(harness).status, "rejected")
})

test("gateway failure marca failed", async () => {
  const harness = createHarness()
  const result = await run({ harness, provider: providerReturning(null) })

  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.status, "failed")
  assert.equal(onlyRow(harness).failureCode, "invalid_response")
})

test("timeout marca failed timeout", async () => {
  const harness = createHarness()
  const result = await run({
    harness,
    provider: {
      async request() {
        throw new DesignAssistanceGatewayTimeoutErrorV1()
      },
    },
  })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).failureCode, "timeout")
})

test("provider error marca failed provider_error", async () => {
  const harness = createHarness()
  const result = await run({
    harness,
    provider: {
      async request() {
        throw new Error("private")
      },
    },
  })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).failureCode, "provider_error")
})

test("validation failure marca failed validation_failed", async () => {
  const harness = createHarness()
  const result = await run({ harness, provider: providerReturning({ ...proposal, theme: {} }) })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).failureCode, "validation_failed")
})

test("decision throw marca failed validation_failed", async () => {
  const harness = createHarness()
  const result = await run({ harness, decideThrows: true })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).failureCode, "validation_failed")
})

test("invalid decision marca failed validation_failed", async () => {
  const harness = createHarness()
  const result = await run({ harness, decision: { decision: "maybe" } })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).failureCode, "validation_failed")
})

test("applied usa proposal exacta validada y la devuelve", async () => {
  const harness = createHarness()
  const result = await run({ harness, provider: createDeterministicDesignAssistanceProviderV1(), decision: "apply" })

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.status, "applied")
    assert.deepEqual(result.proposal, await createDeterministicDesignAssistanceProviderV1().request(request))
    assert.equal(result.outputFingerprint, createDesignAssistanceOutputFingerprintV1(result.proposal!))
  }
})

test("rejected usa proposal exacta validada", async () => {
  const harness = createHarness()
  const result = await run({ harness, decision: "reject" })

  assert.equal(result.ok, true)
  assert.equal(onlyRow(harness).outputFingerprint, createDesignAssistanceOutputFingerprintV1(proposal))
})

test("rejected no se confunde con failure", async () => {
  const harness = createHarness()
  const result = await run({ harness, decision: "reject" })

  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.status, "rejected")
  assert.equal(onlyRow(harness).failureCode, null)
})

test("lifecycle applied failure no afirma applied", async () => {
  const result = await run({ harness: createHarness({ failUpdateMany: true }), decision: "apply" })

  assert.deepEqual(result, {
    ok: false,
    assistanceId: result.assistanceId,
    error: "terminal_transition_failed",
    lifecycleError: "persistence_failed",
  })
})

test("lifecycle rejected failure no afirma rejected", async () => {
  const result = await run({ harness: createHarness({ failUpdateMany: true }), decision: "reject" })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, "terminal_transition_failed")
})

test("lifecycle failed failure produce orchestration error", async () => {
  const result = await run({ harness: createHarness({ failUpdateMany: true }), provider: providerReturning(null) })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, "terminal_transition_failed")
})

test("provider exactamente una llamada y sin retry automatico", async () => {
  const calls: string[] = []
  await run({ provider: providerReturning(proposal, calls) })

  assert.equal(calls.length, 1)
})

test("no fallback provider", async () => {
  const fallbackCalls = 0
  const result = await run({
    provider: {
      async request() {
        void fallbackCalls
        throw new Error("primary failed")
      },
    },
  })

  assert.equal(result.ok, true)
  assert.equal(fallbackCalls, 0)
})

test("same attemptKey no crea segunda row", async () => {
  const harness = createHarness()
  await run({ harness })
  await run({ harness })

  assert.equal(harness.rows.size, 1)
})


test("Retry A recupera applied proposal sin provider ni decision", async () => {
  const harness = createHarness()
  const firstProviderCalls: string[] = []
  const first = await run({
    harness,
    provider: createDeterministicDesignAssistanceProviderV1(),
    decision: "apply",
  })

  assert.equal(first.ok, true)
  assert.equal(first.status, "applied")
  assert.ok(first.proposal)
  const persistedProposal = structuredClone(onlyRow(harness).appliedProposal)

  void firstProviderCalls

  const providerCalls: string[] = []
  let decisionCalls = 0
  const retry = await runDesignAssistanceV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: "attempt:1",
    request,
    provider: providerReturning(proposal, providerCalls),
    providerKey: "provider_a",
    modelKey: "model_a",
    lifecycleClient: harness,
    decideProposal() {
      decisionCalls += 1
      return { decision: "reject" }
    },
  })

  assert.equal(retry.ok, true)
  assert.equal(retry.status, "applied")
  assert.deepEqual(retry.proposal, persistedProposal)
  assert.equal(providerCalls.length, 0)
  assert.equal(decisionCalls, 0)
})

test("existing applied corrupto no llama provider ni decision", async () => {
  const harness = createHarness()
  await run({ harness, decision: "apply" })
  onlyRow(harness).appliedProposal = null
  const providerCalls: string[] = []
  let decisionCalls = 0
  const result = await runDesignAssistanceV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: "attempt:1",
    request,
    provider: providerReturning(proposal, providerCalls),
    providerKey: "provider_a",
    modelKey: "model_a",
    lifecycleClient: harness,
    decideProposal() {
      decisionCalls += 1
      return { decision: "apply" }
    },
  })

  assert.deepEqual(result, { ok: false, error: "requested_failed", lifecycleError: "integrity_error" })
  assert.equal(providerCalls.length, 0)
  assert.equal(decisionCalls, 0)
  assert.equal(onlyRow(harness).status, "applied")
})

test("existing applied no llama provider", async () => {
  const harness = createHarness()
  await run({ harness, decision: "apply" })
  const calls: string[] = []
  const retry = await run({ harness, provider: providerReturning(proposal, calls), decision: "apply" })

  assert.equal(retry.ok, true)
  if (retry.ok) assert.equal(retry.status, "applied")
  assert.equal(calls.length, 0)
  if (retry.ok && retry.status === "applied") assert.deepEqual(retry.proposal, onlyRow(harness).appliedProposal)
})

test("existing rejected no llama provider", async () => {
  const harness = createHarness()
  await run({ harness, decision: "reject" })
  const calls: string[] = []
  await run({ harness, provider: providerReturning(proposal, calls), decision: "reject" })

  assert.equal(calls.length, 0)
})

test("existing failed no llama provider", async () => {
  const harness = createHarness()
  await run({ harness, provider: providerReturning(null) })
  const calls: string[] = []
  await run({ harness, provider: providerReturning(proposal, calls), decision: "apply" })

  assert.equal(calls.length, 0)
})

test("existing requested puede llamar provider", async () => {
  const harness = createHarness()
  const result = await run({ harness, provider: providerReturning(null) })
  assert.equal(result.ok, true)
  onlyRow(harness).status = "requested"
  onlyRow(harness).failureCode = null
  const calls: string[] = []
  await run({ harness, provider: providerReturning(proposal, calls) })

  assert.equal(calls.length, 1)
})

test("no terminal downgrade", async () => {
  const harness = createHarness()
  await run({ harness, decision: "apply" })
  await run({ harness, decision: "reject" })

  assert.equal(onlyRow(harness).status, "applied")
})

test("attemptKey distinto crea nuevo logical attempt", async () => {
  const harness = createHarness()
  await run({ harness, attemptKey: "attempt:1" })
  await run({ harness, attemptKey: "attempt:2" })

  assert.equal(harness.rows.size, 2)
})

test("provider/model attribution preservada", async () => {
  const harness = createHarness()
  await run({ harness, providerKey: "provider_b", modelKey: "model_b" })

  const row = onlyRow(harness)
  assert.equal(row.providerKey, "provider_b")
  assert.equal(row.modelKey, "model_b")
})

test("output fingerprint coincide", async () => {
  const harness = createHarness()
  await run({ harness })

  assert.equal(onlyRow(harness).outputFingerprint, createDesignAssistanceOutputFingerprintV1(proposal))
})

test("Orchestrator no calcula ID por separado", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/orchestrator.ts"), "utf-8")

  assert.equal(/createDesignAssistanceIdV1/.test(source), false)
})

test("Gateway sigue sin importar lifecycle", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/gateway.ts"), "utf-8")

  assert.equal(/from "\.\/lifecycle"|from '\.\/lifecycle'/.test(source), false)
})

test("lifecycle sigue sin importar Gateway", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/lifecycle.ts"), "utf-8")

  assert.equal(/from "\.\/gateway"|from '\.\/gateway'/.test(source), false)
})

test("Orchestrator no importa Site Creation", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/orchestrator.ts"), "utf-8")

  assert.equal(/from .*site-creation|createDraftSite/i.test(source), false)
})

test("no raw provider output ni private customer data", async () => {
  const result = await run({ provider: providerReturning({ rawOutput: "private", userId: "private" }) })

  assert.equal(JSON.stringify(result).includes("rawOutput"), false)
  assert.equal(JSON.stringify(result).includes("userId"), false)
})

test("no Prisma raw error publico", async () => {
  const result = await run({ harness: createHarness({ failUpsert: true }) })

  assert.equal(JSON.stringify(result).includes("prisma"), false)
  assert.equal(JSON.stringify(result).includes("upsert"), false)
})

test("deterministic E2E con test provider", async () => {
  const harness = createHarness()
  const first = await run({ harness, provider: createDeterministicDesignAssistanceProviderV1() })
  const second = await run({ harness, provider: createDeterministicDesignAssistanceProviderV1() })

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(harness.rows.size, 1)
})

test("input no mutado", async () => {
  const before = structuredClone(request)
  await run({ provider: createDeterministicDesignAssistanceProviderV1() })

  assert.deepEqual(request, before)
})

test("proposal no mutada", async () => {
  const value = structuredClone(proposal)
  const before = structuredClone(value)
  await run({ provider: providerReturning(value) })

  assert.deepEqual(value, before)
})
