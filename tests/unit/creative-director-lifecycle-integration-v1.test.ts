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

import {
  createCreativeDirectorIdV1,
  recordCreativeDirectionRequested,
} from "../../lib/orvenix-ai/creative-director/lifecycle"
import { createCreativeDirectorInputFingerprintV1 } from "../../lib/orvenix-ai/creative-director/contract"
import { runCreativeDirectorV1 } from "../../lib/orvenix-ai/creative-director/orchestrator"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import { decideCreativeDirectorProposalV1, decideCreativeDirectorEligibilityV1, resolveSiteCreationCreativeDirectionV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import type { CreativeDirectorRequestV1 } from "../../lib/orvenix-ai/creative-director/contract"
import type { DesignAssistanceLifecycleClientV1, DesignAssistanceLifecycleRowV1 } from "../../lib/orvenix-ai/assistance/lifecycle"

// ---------------------------------------------------------------------------
// V2-4: lifecycle (DesignAssistance persistence reuse), orchestrator, and
// the site-creation eligibility/integration layer. Same in-memory fake-
// Prisma-client harness pattern already established in
// design-assistance-lifecycle-v1.test.ts, retargeted at the new roleKey.
// ---------------------------------------------------------------------------

const baseRequest: CreativeDirectorRequestV1 = {
  version: 1,
  roleKey: "creative_director_v1",
  strategyKey: "site_narrative_v1",
  business: {
    name: "Centro de Fisioterapia Monterrey",
    industry: "fisioterapia",
    services: [{ name: "Fisioterapia deportiva" }],
  },
  pages: [
    { slug: "home", purpose: "x", archetype: "overview", availableRoles: ["navigation", "hero", "cta", "footer"], requiredRoles: ["navigation", "hero", "cta", "footer"], defaultOrder: ["navigation", "hero", "cta", "footer"] },
  ],
}

function cloneRow(row: DesignAssistanceLifecycleRowV1): DesignAssistanceLifecycleRowV1 {
  return {
    ...row,
    appliedProposal: row.appliedProposal ? structuredClone(row.appliedProposal) : null,
    requestedAt: new Date(row.requestedAt),
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  }
}

function createHarness(options: { attemptExists?: boolean; attemptUserId?: string; attemptStatus?: string } = {}) {
  const rows = new Map<string, DesignAssistanceLifecycleRowV1>()
  const attempts = new Map<string, { id: string; type: string; status: string; input: { userId: string } }>()
  const requestedAt = new Date("2026-09-22T10:00:00.000Z")

  if (options.attemptExists !== false) {
    attempts.set("attempt_1", { id: "attempt_1", type: "ai_site_creation_preview", status: options.attemptStatus ?? "planning", input: { userId: options.attemptUserId ?? "user_1" } })
  }

  const client: DesignAssistanceLifecycleClientV1 = {
    aiGenerationJob: {
      findUnique: async ({ where }) => attempts.get(where.id) ?? null,
    },
    designAssistance: {
      upsert: async ({ where, create }) => {
        const existing = rows.get(where.id)
        if (existing) return cloneRow(existing)
        const row = { ...create, requestedAt, completedAt: null } as DesignAssistanceLifecycleRowV1
        rows.set(where.id, row)
        return cloneRow(row)
      },
      findUnique: async ({ where }) => {
        const row = rows.get(where.id)
        return row ? cloneRow(row) : null
      },
      updateMany: async ({ where, data }) => {
        const row = rows.get(where.id)
        if (!row || row.status !== where.status) return { count: 0 }
        rows.set(where.id, { ...row, ...data })
        return { count: 1 }
      },
    },
  }

  return { client, rows, attempts }
}

// ---------------------------------------------------------------------------
// Z) fingerprint idempotency
// ---------------------------------------------------------------------------

test("Z) deterministic assistance id from identical inputs", () => {
  const fingerprint = createCreativeDirectorInputFingerprintV1(baseRequest)
  const idA = createCreativeDirectorIdV1({ siteCreationAttemptId: "attempt_1", roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", providerKey: "anthropic", modelKey: "claude_haiku_4_5", inputFingerprint: fingerprint, attemptKey: "creative_director:attempt_1" })
  const idB = createCreativeDirectorIdV1({ siteCreationAttemptId: "attempt_1", roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", providerKey: "anthropic", modelKey: "claude_haiku_4_5", inputFingerprint: fingerprint, attemptKey: "creative_director:attempt_1" })
  assert.equal(idA, idB)
  assert.match(idA, /^cd_[a-f0-9]{64}$/)
})

test("Z) recording the SAME request twice is idempotent -- no duplicate row, second call returns the first result", async () => {
  const harness = createHarness()
  const first = await recordCreativeDirectionRequested({ userId: "user_1", siteCreationAttemptId: "attempt_1", attemptKey: "creative_director:attempt_1", request: baseRequest, providerKey: "anthropic", modelKey: "claude_haiku_4_5" }, harness.client)
  const second = await recordCreativeDirectionRequested({ userId: "user_1", siteCreationAttemptId: "attempt_1", attemptKey: "creative_director:attempt_1", request: baseRequest, providerKey: "anthropic", modelKey: "claude_haiku_4_5" }, harness.client)
  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  if (first.ok && second.ok) assert.equal(first.assistanceId, second.assistanceId)
  assert.equal(harness.rows.size, 1)
})

// ---------------------------------------------------------------------------
// C) valid provider proposal applied, end to end through the orchestrator
// ---------------------------------------------------------------------------

test("C) valid deterministic provider proposal is applied and persisted", async () => {
  const harness = createHarness()
  const result = await runCreativeDirectorV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: "creative_director:attempt_1",
    request: baseRequest,
    provider: createDeterministicCreativeDirectorProviderV1("valid"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
    decideProposal: decideCreativeDirectorProposalV1,
    lifecycleClient: harness.client,
  })
  assert.equal(result.ok, true)
  if (result.ok && result.status === "applied") {
    assert.ok(result.proposal)
    assert.equal(result.proposal?.pageDirections[0].slug, "home")
  } else {
    assert.fail(`expected applied, got ${JSON.stringify(result)}`)
  }
})

// ---------------------------------------------------------------------------
// W/X/Y) every provider failure mode still completes cleanly
// ---------------------------------------------------------------------------

for (const mode of ["timeout", "provider_error", "invalid_schema", "null_response"] as const) {
  test(`W/X/Y) provider mode '${mode}' resolves to a clean failed status, never throws`, async () => {
    const harness = createHarness()
    const result = await runCreativeDirectorV1({
      userId: "user_1",
      siteCreationAttemptId: "attempt_1",
      attemptKey: `creative_director:attempt_1:${mode}`,
      request: baseRequest,
      provider: createDeterministicCreativeDirectorProviderV1(mode),
      providerKey: "anthropic",
      modelKey: "claude_haiku_4_5",
      decideProposal: decideCreativeDirectorProposalV1,
      lifecycleClient: harness.client,
    })
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.status, "failed")
  })
}

// ---------------------------------------------------------------------------
// AA) persisted proposal contains no raw prompt/response, only the
// normalized/validated shape
// ---------------------------------------------------------------------------

test("AA) the persisted appliedProposal is the normalized shape only -- no raw request/response fields", async () => {
  const harness = createHarness()
  await runCreativeDirectorV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    attemptKey: "creative_director:attempt_1",
    request: baseRequest,
    provider: createDeterministicCreativeDirectorProviderV1("valid"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
    decideProposal: decideCreativeDirectorProposalV1,
    lifecycleClient: harness.client,
  })

  const persistedRow = [...harness.rows.values()][0]
  assert.ok(persistedRow.appliedProposal)
  const persisted = persistedRow.appliedProposal as Record<string, unknown>
  const allowedTopLevel = new Set(["version", "roleKey", "strategyKey", "siteNarrative", "tone", "visualDirection", "density", "pageDirections"])
  for (const key of Object.keys(persisted)) {
    assert.ok(allowedTopLevel.has(key), `unexpected persisted field: ${key}`)
  }
  assert.equal("business" in persisted, false) // the raw request's business context object never leaks into the persisted proposal (a coincidental English word inside assetIntent text is fine -- this checks for the STRUCTURAL key, not a substring)
})

// ---------------------------------------------------------------------------
// A/B) eligibility: disabled / missing API key / L2 skip
// ---------------------------------------------------------------------------

test("A) disabled by default -> not eligible", () => {
  const result = decideCreativeDirectorEligibilityV1({
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: null, objectiveBucket: null, styleBucket: null, siteType: null }, reason: [] },
    enabled: false,
    hasApiKey: true,
  })
  assert.deepEqual(result, { eligible: false, reason: "disabled" })
})

test("B) enabled but no API key -> not eligible (missing_api_key)", () => {
  const result = decideCreativeDirectorEligibilityV1({
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: null, objectiveBucket: null, styleBucket: null, siteType: null }, reason: [] },
    enabled: true,
    hasApiKey: false,
  })
  assert.deepEqual(result, { eligible: false, reason: "missing_api_key" })
})

test("qualified Design Memory L2 skips the AI call (cost control, matches theme-advisor precedent)", () => {
  const result = decideCreativeDirectorEligibilityV1({
    designMemoryDecision: { kind: "L2", designMemoryPrior: { level: "L2", recommendation: { theme: {} }, reason: [] } as never, context: { industryBucket: "health", objectiveBucket: null, styleBucket: null, siteType: "health" }, reason: [] },
    enabled: true,
    hasApiKey: true,
  })
  assert.deepEqual(result, { eligible: false, reason: "qualified_design_memory_l2" })
})

test("enabled + API key + no qualified L2 -> eligible", () => {
  const result = decideCreativeDirectorEligibilityV1({
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: null, objectiveBucket: null, styleBucket: null, siteType: null }, reason: [] },
    enabled: true,
    hasApiKey: true,
  })
  assert.deepEqual(result, { eligible: true })
})

// ---------------------------------------------------------------------------
// Full integration: resolveSiteCreationCreativeDirectionV1
// ---------------------------------------------------------------------------

test("A) resolveSiteCreationCreativeDirectionV1: disabled -> status skipped, reason disabled", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({ request: "req", business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia" } })
  const result = await resolveSiteCreationCreativeDirectionV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: null, objectiveBucket: null, styleBucket: null, siteType: null }, reason: [] },
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia" },
    architecture,
    provider: createDeterministicCreativeDirectorProviderV1("valid"),
    enabled: false,
  })
  assert.deepEqual(result, { ok: true, status: "skipped", reason: "disabled" })
})

test("E/H) resolveSiteCreationCreativeDirectionV1: valid provider -> applied direction is SANITIZED (unsafe hero copy dropped)", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", services: [{ name: "Fisioterapia deportiva" }] },
  })
  const harness = createHarness()

  const result = await resolveSiteCreationCreativeDirectionV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: "health", objectiveBucket: null, styleBucket: null, siteType: "health" }, reason: [] },
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", services: [{ name: "Fisioterapia deportiva" }] },
    architecture,
    provider: createDeterministicCreativeDirectorProviderV1("unsafe_copy"),
    enabled: true,
    hasApiKey: true,
    lifecycleClient: harness.client,
  })

  assert.equal(result.ok, true)
  if (result.ok && result.status === "applied") {
    const home = result.direction.pageDirections.find((p) => p.slug === "home")
    assert.equal(home?.heroTitleSuggestion, undefined) // "Somos los mejores con 10 años de experiencia" sanitized away
  } else {
    assert.fail(`expected applied (sanitized), got ${JSON.stringify(result)}`)
  }
})

test("W) resolveSiteCreationCreativeDirectionV1: provider timeout -> status fallback, never throws", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({ request: "req", business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia" } })
  const harness = createHarness()

  const result = await resolveSiteCreationCreativeDirectionV1({
    userId: "user_1",
    siteCreationAttemptId: "attempt_1",
    designMemoryDecision: { kind: "unavailable", designMemoryPrior: null, context: { industryBucket: null, objectiveBucket: null, styleBucket: null, siteType: null }, reason: [] },
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia" },
    architecture,
    provider: createDeterministicCreativeDirectorProviderV1("timeout"),
    enabled: true,
    hasApiKey: true,
    lifecycleClient: harness.client,
  })

  assert.equal(result.ok, true)
  assert.equal(result.status, "fallback")
})
