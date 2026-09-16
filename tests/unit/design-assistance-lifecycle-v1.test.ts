import test from "node:test"
import assert from "node:assert/strict"

import {
  createDesignAssistanceIdV1,
  createDesignAssistanceInputFingerprintV1,
  createDesignAssistanceOutputFingerprintV1,
  markDesignAssistanceApplied,
  markDesignAssistanceFailed,
  markDesignAssistanceRejected,
  recordDesignAssistanceRequested,
  type DesignAssistanceLifecycleRowV1,
} from "../../lib/orvenix-ai/assistance"
import type { DesignAssistanceProposalV1, DesignAssistanceRequestV1 } from "../../lib/orvenix-ai/assistance"

const baseRequest: DesignAssistanceRequestV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  context: {
    industryBucket: "health",
    objectiveBucket: "lead_generation",
    styleBucket: "premium",
    siteType: "health",
  },
}

const baseProposal: DesignAssistanceProposalV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  theme: {
    mode: "light",
    accentHue: "blue",
    radiusBucket: "soft",
  },
}

const otherProposal: DesignAssistanceProposalV1 = {
  ...baseProposal,
  theme: {
    ...baseProposal.theme,
    accentHue: "purple",
  },
}

type MockCreate = Omit<DesignAssistanceLifecycleRowV1, "requestedAt" | "createdAt" | "updatedAt">

function cloneRow(row: DesignAssistanceLifecycleRowV1): DesignAssistanceLifecycleRowV1 {
  return {
    ...row,
    appliedProposal: row.appliedProposal ? structuredClone(row.appliedProposal) : null,
    requestedAt: new Date(row.requestedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  }
}

function createHarness(options: { attemptExists?: boolean; attemptUserId?: string; attemptStatus?: string; fail?: "findAttempt" | "upsert" | "findAssistance" | "updateMany" } = {}) {
  const rows = new Map<string, DesignAssistanceLifecycleRowV1>()
  const attempts = new Map<string, { id: string; type: string; status: string; input: { userId: string } }>()
  const requestedAt = new Date("2026-09-15T10:00:00.000Z")
  const createdAt = new Date("2026-09-15T10:00:00.000Z")
  const completedAt = new Date("2026-09-15T11:00:00.000Z")
  const calls = {
    siteIdLookups: 0,
    rawPersisted: [] as unknown[],
  }

  if (options.attemptExists !== false) {
    attempts.set("attempt_1", { id: "attempt_1", type: "ai_site_creation_preview", status: options.attemptStatus ?? "planning", input: { userId: options.attemptUserId ?? "user_1" } })
  }

  const client = {
    aiGenerationJob: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (options.fail === "findAttempt") throw new Error("raw prisma attempt failure")
        return attempts.get(where.id) ?? null
      },
    },
    designAssistance: {
      upsert: async ({ where, create }: { where: { id: string }; create: MockCreate }) => {
        if (options.fail === "upsert") throw new Error("raw prisma upsert failure")
        calls.rawPersisted.push(create)
        const existing = rows.get(where.id)
        if (existing) return cloneRow(existing)
        const row: DesignAssistanceLifecycleRowV1 = {
          ...create,
          requestedAt,
          createdAt,
          completedAt: null,
        } as DesignAssistanceLifecycleRowV1
        rows.set(where.id, row)
        return cloneRow(row)
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (options.fail === "findAssistance") throw new Error("raw prisma find assistance failure")
        const row = rows.get(where.id)
        return row ? cloneRow(row) : null
      },
      updateMany: async ({ where, data }: { where: { id: string; status: "requested" }; data: Partial<DesignAssistanceLifecycleRowV1> }) => {
        if (options.fail === "updateMany") throw new Error("raw prisma update failure")
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
    calls,
    rows,
    attempts,
  }

  return client
}

async function requested(harness = createHarness(), overrides: Partial<Parameters<typeof recordDesignAssistanceRequested>[0]> = {}) {
  return recordDesignAssistanceRequested({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: "preview:attempt_1",
    request: baseRequest,
    providerKey: "provider_a",
    modelKey: "model_a",
    ...overrides,
  }, harness)
}

async function requestedId(harness = createHarness(), overrides: Partial<Parameters<typeof recordDesignAssistanceRequested>[0]> = {}) {
  const result = await requested(harness, overrides)
  assert.equal(result.ok, true)
  return result.assistanceId
}

test("deterministic ID", () => {
  const inputFingerprint = createDesignAssistanceInputFingerprintV1(baseRequest)
  const first = createDesignAssistanceIdV1({ siteCreationAttemptId: "attempt_1", roleKey: baseRequest.roleKey, strategyKey: baseRequest.strategyKey, providerKey: "provider_a", modelKey: "model_a", inputFingerprint, attemptKey: "attempt:1" })
  const second = createDesignAssistanceIdV1({ siteCreationAttemptId: "attempt_1", roleKey: baseRequest.roleKey, strategyKey: baseRequest.strategyKey, providerKey: "provider_a", modelKey: "model_a", inputFingerprint, attemptKey: "attempt:1" })
  assert.equal(first, second)
  assert.match(first, /^da_[a-f0-9]{64}$/)
})

test("mismo attemptKey produce mismo ID", async () => {
  const harness = createHarness()
  assert.equal(await requestedId(harness), await requestedId(harness))
})

test("nuevo attemptKey produce ID diferente", async () => {
  const harness = createHarness()
  assert.notEqual(await requestedId(harness), await requestedId(harness, { attemptKey: "preview:attempt_2" }))
})

test("provider diferente produce ID diferente", async () => {
  const harness = createHarness()
  assert.notEqual(await requestedId(harness), await requestedId(harness, { providerKey: "provider_b" }))
})

test("model diferente produce ID diferente", async () => {
  const harness = createHarness()
  assert.notEqual(await requestedId(harness), await requestedId(harness, { modelKey: "model_b" }))
})

test("input semantico diferente produce ID diferente", async () => {
  const harness = createHarness()
  assert.notEqual(await requestedId(harness), await requestedId(harness, { request: { ...baseRequest, context: { ...baseRequest.context, styleBucket: "minimal" } } }))
})

test("requested crea row", async () => {
  const harness = createHarness()
  const result = await requested(harness)
  assert.equal(result.ok, true)
  assert.equal(harness.rows.size, 1)
  assert.equal(Array.from(harness.rows.values())[0]?.status, "requested")
  assert.equal(Array.from(harness.rows.values())[0]?.appliedProposal, null)
})

test("requested retry idempotente", async () => {
  const harness = createHarness()
  await requested(harness)
  const retry = await requested(harness)
  assert.equal(retry.ok, true)
  assert.equal(retry.idempotent, true)
  assert.equal(harness.rows.size, 1)
})

test("requested retry no cambia requestedAt", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const before = harness.rows.get(id)?.requestedAt.toISOString()
  await requested(harness)
  assert.equal(harness.rows.get(id)?.requestedAt.toISOString(), before)
})

test("requested sobre applied no downgrade", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  await requested(harness)
  assert.equal(harness.rows.get(id)?.status, "applied")
})

test("requested sobre rejected no downgrade", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)
  await requested(harness)
  assert.equal(harness.rows.get(id)?.status, "rejected")
})

test("requested sobre failed no downgrade", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  await requested(harness)
  assert.equal(harness.rows.get(id)?.status, "failed")
})

test("requested attempt inexistente controlled failure", async () => {
  const result = await requested(createHarness({ attemptExists: false }))
  assert.deepEqual(result, { ok: false, error: "site_creation_attempt_not_found" })
})

test("requested no permite usar attempt de otro usuario", async () => {
  const result = await requested(createHarness({ attemptUserId: "user_2" }))
  assert.deepEqual(result, { ok: false, error: "site_creation_attempt_not_found" })
})

test("requested no abre asistencia nueva si el attempt ya no esta planning", async () => {
  const result = await requested(createHarness({ attemptStatus: "completed" }))
  assert.deepEqual(result, { ok: false, error: "site_creation_attempt_not_found" })
})

test("requested existente sigue idempotente aunque el attempt haya avanzado", async () => {
  const harness = createHarness()
  await requested(harness)
  harness.attempts.set("attempt_1", { id: "attempt_1", type: "ai_site_creation_preview", status: "completed", input: { userId: "user_1" } })

  const retry = await requested(harness)

  assert.equal(retry.ok, true)
  assert.equal(retry.idempotent, true)
  assert.equal(harness.rows.size, 1)
})

test("requested Prisma failure controlled", async () => {
  const result = await requested(createHarness({ fail: "upsert" }))
  assert.deepEqual(result, { ok: false, error: "persistence_failed" })
})

test("requested no acepta fingerprint caller arbitrario", async () => {
  const harness = createHarness()
  await requested(harness, { inputFingerprint: "f".repeat(64) } as never)
  const row = Array.from(harness.rows.values())[0]
  assert.equal(row?.inputFingerprint, createDesignAssistanceInputFingerprintV1(baseRequest))
})

test("requested calcula fingerprint correcto", async () => {
  const harness = createHarness()
  const result = await requested(harness)
  assert.equal(result.ok, true)
  assert.equal(result.inputFingerprint, createDesignAssistanceInputFingerprintV1(baseRequest))
})

test("requested no persiste raw request", async () => {
  const harness = createHarness()
  await requested(harness)
  assert.equal(JSON.stringify(harness.calls.rawPersisted).includes("context"), false)
})

test("applied transition", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const result = await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(result.ok, true)
  assert.equal(result.status, "applied")
  assert.deepEqual(result.proposal, baseProposal)
  assert.deepEqual(harness.rows.get(id)?.appliedProposal, baseProposal)
})

test("applied calcula output fingerprint", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const result = await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(result.ok, true)
  assert.equal(result.outputFingerprint, createDesignAssistanceOutputFingerprintV1(baseProposal))
  assert.equal(
    createDesignAssistanceOutputFingerprintV1(harness.rows.get(id)?.appliedProposal as DesignAssistanceProposalV1),
    result.outputFingerprint,
  )
})

test("applied retry misma proposal idempotente", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const retry = await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(retry.ok, true)
  assert.equal(retry.idempotent, true)
})

test("applied retry no cambia completedAt", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const before = harness.rows.get(id)?.completedAt?.toISOString()
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(harness.rows.get(id)?.completedAt?.toISOString(), before)
})

test("applied retry preserva proposal persistida", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const before = structuredClone(harness.rows.get(id)?.appliedProposal)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(harness.rows.get(id)?.appliedProposal, before)
})


test("applied retry con row corrupto falla integrity_error", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.outputFingerprint = null
  assert.deepEqual(await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness), { ok: false, error: "integrity_error" })
  assert.equal(harness.rows.get(id)?.status, "applied")
})

test("applied distinta proposal conflict", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(await markDesignAssistanceApplied({ assistanceId: id, proposal: otherProposal }, harness), { ok: false, error: "conflict" })
})


test("existing applied recupera proposal validada", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const retry = await requested(harness)
  assert.equal(retry.ok, true)
  assert.equal(retry.status, "applied")
  assert.deepEqual(retry.proposal, baseProposal)
})

test("missing appliedProposal fail closed", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.appliedProposal = null
  assert.deepEqual(await requested(harness), { ok: false, error: "integrity_error" })
})

test("invalid appliedProposal fail closed", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.appliedProposal = { ...baseProposal, rawOutput: "private" }
  assert.deepEqual(await requested(harness), { ok: false, error: "integrity_error" })
})

test("missing outputFingerprint fail closed", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.outputFingerprint = null
  assert.deepEqual(await requested(harness), { ok: false, error: "integrity_error" })
})

test("fingerprint mismatch fail closed", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.outputFingerprint = createDesignAssistanceOutputFingerprintV1(otherProposal)
  assert.deepEqual(await requested(harness), { ok: false, error: "integrity_error" })
})

test("integrity failure no downgrade", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  const row = harness.rows.get(id)
  assert.ok(row)
  row.appliedProposal = null
  await requested(harness)
  assert.equal(harness.rows.get(id)?.status, "applied")
})

test("caller mutation no altera proposal persistida", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const callerProposal = structuredClone(baseProposal)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: callerProposal }, harness)
  callerProposal.theme.accentHue = "purple"
  assert.deepEqual(harness.rows.get(id)?.appliedProposal, baseProposal)
})

test("no raw provider output persisted", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: { ...baseProposal, rawOutput: "private" } as never }, harness)
  assert.equal(JSON.stringify(harness.rows.get(id)?.appliedProposal).includes("rawOutput"), false)
  assert.equal(JSON.stringify(harness.rows.get(id)?.appliedProposal).includes("private"), false)
})

test("no Plan V2 persisted in assistance", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(JSON.stringify(harness.rows.get(id)?.appliedProposal).includes("pages"), false)
  assert.equal(JSON.stringify(harness.rows.get(id)?.appliedProposal).includes("navigation"), false)
})

test("rejected transition", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  assert.equal((await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)).ok, true)
  assert.equal(harness.rows.get(id)?.status, "rejected")
  assert.equal(harness.rows.get(id)?.appliedProposal, null)
})

test("rejected misma proposal idempotente", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal((await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)).ok, true)
})

test("rejected distinta proposal conflict", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(await markDesignAssistanceRejected({ assistanceId: id, proposal: otherProposal }, harness), { ok: false, error: "conflict" })
})

test("failed transition", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const result = await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  assert.equal(result.ok, true)
  assert.equal(result.status, "failed")
  assert.equal(harness.rows.get(id)?.appliedProposal, null)
})

test("failed mismo code idempotente", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  const retry = await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  assert.equal(retry.ok, true)
  assert.equal(retry.idempotent, true)
})

test("failed diferente code conflict", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  assert.deepEqual(await markDesignAssistanceFailed({ assistanceId: id, failureCode: "provider_error" }, harness), { ok: false, error: "conflict" })
})

test("applied -> rejected bloqueado", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness), { ok: false, error: "invalid_transition" })
})

test("applied -> failed bloqueado", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness), { ok: false, error: "invalid_transition" })
})

test("rejected -> applied bloqueado", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness), { ok: false, error: "invalid_transition" })
})

test("failed -> applied bloqueado", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  assert.deepEqual(await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness), { ok: false, error: "invalid_transition" })
})

test("terminal transition first-wins", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  const results = await Promise.all([
    markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness),
    markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness),
  ])
  assert.equal(results.filter((result) => result.ok).length, 1)
  assert.equal(harness.rows.get(id)?.status, "applied")
})

test("completedAt solo terminal", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  assert.equal(harness.rows.get(id)?.completedAt, null)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.ok(harness.rows.get(id)?.completedAt instanceof Date)
})

test("outputFingerprint ausente en failed", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceFailed({ assistanceId: id, failureCode: "timeout" }, harness)
  assert.equal(harness.rows.get(id)?.outputFingerprint, null)
})

test("failureCode ausente en applied", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(harness.rows.get(id)?.failureCode, null)
})

test("failureCode ausente en rejected", async () => {
  const harness = createHarness()
  const id = await requestedId(harness)
  await markDesignAssistanceRejected({ assistanceId: id, proposal: baseProposal }, harness)
  assert.equal(harness.rows.get(id)?.failureCode, null)
})

test("no modifica Site Creation Attempt status", async () => {
  const harness = createHarness()
  const before = { ...harness.attempts.get("attempt_1") }
  const id = await requestedId(harness)
  await markDesignAssistanceApplied({ assistanceId: id, proposal: baseProposal }, harness)
  assert.deepEqual(harness.attempts.get("attempt_1"), before)
})

test("no lookup ambiguo por siteId", async () => {
  const harness = createHarness()
  await requested(harness, { siteId: "site_1" } as never)
  assert.equal(harness.calls.siteIdLookups, 0)
})

test("no raw Prisma error publico", async () => {
  const result = await requested(createHarness({ fail: "findAttempt" }))
  assert.deepEqual(result, { ok: false, error: "persistence_failed" })
})

test("no Prisma error throw", async () => {
  await assert.doesNotReject(() => requested(createHarness({ fail: "upsert" })))
})

test("no private fields persisted", async () => {
  const harness = createHarness()
  await requested(harness, { userId: "user_1", rawInput: "secret", request: { ...baseRequest, prompt: "secret" } } as never)
  assert.equal(harness.rows.size, 0)
  assert.equal(JSON.stringify(harness.calls.rawPersisted).includes("secret"), false)
})
