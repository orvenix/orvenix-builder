import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import type { SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"

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

const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "@/lib/editor-db") return { editorPrisma: createHarness().client }

  return originalLoad.call(this, request, parent, isMain)
}

type StoredDesignGeneration = {
  id: string
  userId: string
  request: string
  industry?: string
  siteType?: string
  objective?: string
  requestedStyle?: string
  initialPlan: unknown
  initialPlanHash: string
  status: string
  siteId?: string | null
  patternVersion?: number
  patternHash?: string
  patternKey?: unknown
  outcomeVersion?: number
  outcomeScore?: number | null
  outcomeQualifiedAt?: Date | null
  editDistance?: number | null
  createdAt?: Date
}

type StoredSite = {
  id: string
  activeDesignGenerationId: string | null
}

function createPlan(): SiteCreationPlanV2 {
  return {
    version: 2,
    identity: { name: "Clinica Aurora", industry: "salud" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Atencion profesional" },
        tree: {
          rootId: "root",
          nodes: {
            root: { id: "root", type: "section", props: {}, children: [], version: 1 },
          },
        },
        treeHash: "1".repeat(64),
      },
    ],
    quality: { score: 92, warnings: [], summary: "Plan valido" },
  }
}

function statusAllowed(where: Record<string, unknown>, status: string) {
  const statusFilter = where.status as { in?: string[] } | undefined
  return !statusFilter?.in || statusFilter.in.includes(status)
}

function createHarness() {
  const records = new Map<string, StoredDesignGeneration>()
  const sites = new Map<string, StoredSite>()
  const calls: Array<{ where: { id: string }; create: StoredDesignGeneration; update: unknown }> = []

  const client = {
    designGeneration: {
      findUnique: async ({ where }: { where: { id: string } }) => records.get(where.id) ?? null,
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        let count = 0

        for (const [id, existing] of records.entries()) {
          if (where.id && where.id !== id) continue
          if (where.userId && existing.userId !== where.userId) continue
          if (where.initialPlanHash && existing.initialPlanHash !== where.initialPlanHash) continue
          if (where.siteId && existing.siteId !== where.siteId) continue
          if (where.patternVersion === null && existing.patternVersion != null) continue
          if (!statusAllowed(where, existing.status)) continue

          records.set(id, {
            ...existing,
            ...data,
          })
          count += 1
        }

        return { count }
      },
      upsert: async ({ where, create, update }: { where: { id: string }; create: StoredDesignGeneration; update: unknown }) => {
        calls.push({ where, create, update })

        if (!records.has(where.id)) {
          records.set(where.id, {
            ...structuredClone(create),
            createdAt: new Date("2026-09-01T00:00:00.000Z"),
            editDistance: null,
          })
        }

        return { id: where.id }
      },
    },
    editorWebsite: {
      findUnique: async ({ where }: { where: { id: string } }) => sites.get(where.id) ?? null,
      updateMany: async ({ where, data }: { where: { id: string }; data: { activeDesignGenerationId: string } }) => {
        const site = sites.get(where.id)
        if (!site) return { count: 0 }
        sites.set(where.id, { ...site, activeDesignGenerationId: data.activeDesignGenerationId })
        return { count: 1 }
      },
    },
    $transaction: async <T>(fn: (tx: typeof client) => Promise<T>) => fn(client),
  }

  return {
    records,
    sites,
    client,
    calls,
    createSite: (id: string, activeDesignGenerationId: string | null = null) => {
      sites.set(id, { id, activeDesignGenerationId })
    },
  }
}

async function recordBaseGeneration(harness = createHarness(), overrides: Partial<Parameters<typeof import("../../lib/orvenix-ai/design-memory").recordDesignGeneration>[0]> = {}) {
  const { recordDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const input = {
    userId: "user_1",
    request: "Crea un sitio desde cero para Clinica Aurora.",
    industry: "salud",
    siteType: "multipage",
    objective: "conseguir citas",
    requestedStyle: "premium claro",
    initialPlan: createPlan(),
    initialPlanHash: "a".repeat(64),
    ...overrides,
  }
  const recorded = await recordDesignGeneration(input, harness.client)
  assert.equal(recorded.ok, true)
  assert.ok(recorded.generationId)
  return { harness, input, generationId: recorded.generationId! }
}

test("recordDesignGeneration conserva hash, plan y contexto relevante", async () => {
  const harness = createHarness()
  const { generationId } = await recordBaseGeneration(harness, {
    request: "  Crea un sitio desde cero para Clinica Aurora.  ",
  })

  const stored = harness.records.get(generationId)
  assert.equal(stored?.userId, "user_1")
  assert.equal(stored?.request, "Crea un sitio desde cero para Clinica Aurora.")
  assert.equal(stored?.industry, "salud")
  assert.equal(stored?.siteType, "multipage")
  assert.equal(stored?.objective, "conseguir citas")
  assert.equal(stored?.requestedStyle, "premium claro")
  assert.equal(stored?.initialPlanHash, "a".repeat(64))
  assert.deepEqual(stored?.initialPlan, createPlan())
  assert.equal(stored?.status, "generated")
  assert.equal(stored?.patternVersion, 1)
  assert.match(stored?.patternHash ?? "", /^[a-f0-9]{64}$/)
  assert.equal(typeof stored?.patternKey, "object")
  assert.equal(JSON.stringify(stored?.patternKey).includes("Clinica Aurora"), false)
})


test("recordDesignGeneration es idempotente para el mismo usuario, request y planHash", async () => {
  const { recordDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const input = {
    userId: "user_1",
    request: "Crea un sitio desde cero para Clinica Aurora.",
    industry: "salud",
    initialPlan: createPlan(),
    initialPlanHash: "b".repeat(64),
  }

  const first = await recordDesignGeneration(input, harness.client)
  const second = await recordDesignGeneration(input, harness.client)

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(first.generationId, second.generationId)
  assert.equal(harness.records.size, 1)
  const stored = harness.records.get(first.generationId!)
  assert.equal(stored?.patternVersion, 1)
  assert.match(stored?.patternHash ?? "", /^[a-f0-9]{64}$/)
})

test("recordDesignGeneration no recalcula silenciosamente Pattern V1 existente", async () => {
  const { recordDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const input = {
    userId: "user_1",
    request: "Crea un sitio desde cero para Clinica Aurora.",
    industry: "salud",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
    initialPlan: createPlan(),
    initialPlanHash: "b".repeat(64),
  }

  const first = await recordDesignGeneration(input, harness.client)
  const stored = harness.records.get(first.generationId!)!
  const originalPatternHash = stored.patternHash
  const originalPatternKey = structuredClone(stored.patternKey)

  const second = await recordDesignGeneration({
    ...input,
    industry: "restaurante",
    siteType: "restaurant",
    objective: "vender productos",
    requestedStyle: "minimal",
  }, harness.client)

  assert.equal(second.generationId, first.generationId)
  assert.equal(harness.records.get(first.generationId!)?.patternHash, originalPatternHash)
  assert.deepEqual(harness.records.get(first.generationId!)?.patternKey, originalPatternKey)
})

test("recordDesignGeneration completa Pattern V1 solo para legacy sin pattern", async () => {
  const { recordDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const input = {
    userId: "user_1",
    request: "Crea un sitio desde cero para Clinica Aurora.",
    industry: "salud",
    initialPlan: createPlan(),
    initialPlanHash: "1".repeat(64),
  }

  const first = await recordDesignGeneration(input, harness.client)
  const stored = harness.records.get(first.generationId!)!
  delete stored.patternVersion
  delete stored.patternHash
  delete stored.patternKey

  await recordDesignGeneration(input, harness.client)

  assert.equal(harness.records.get(first.generationId!)?.patternVersion, 1)
  assert.match(harness.records.get(first.generationId!)?.patternHash ?? "", /^[a-f0-9]{64}$/)
  assert.equal(typeof harness.records.get(first.generationId!)?.patternKey, "object")
})

test("recordDesignGeneration devuelve fallo controlado si la persistencia falla", async () => {
  const { recordDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const result = await recordDesignGeneration({
    userId: "user_1",
    request: "Crea un sitio desde cero para Clinica Aurora.",
    initialPlan: createPlan(),
    initialPlanHash: "c".repeat(64),
  }, {
    designGeneration: {
      upsert: async () => {
        throw new Error("fallo interno de db")
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.error, "No se pudo registrar la memoria de diseño.")
})

test("acceptDesignGeneration asocia siteId y establece activeDesignGenerationId de forma idempotente", async () => {
  const { acceptDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const { input, generationId } = await recordBaseGeneration(harness, { initialPlanHash: "d".repeat(64) })
  harness.createSite("site_accepted")

  const accepted = await acceptDesignGeneration({
    userId: input.userId,
    request: input.request,
    initialPlanHash: input.initialPlanHash,
    siteId: "site_accepted",
  }, harness.client)
  const repeated = await acceptDesignGeneration({
    userId: input.userId,
    request: input.request,
    initialPlanHash: input.initialPlanHash,
    siteId: "site_accepted",
  }, harness.client)

  assert.equal(accepted.ok, true)
  assert.equal(repeated.ok, true)
  assert.equal(accepted.generationId, generationId)
  assert.equal(harness.records.get(generationId)?.siteId, "site_accepted")
  assert.equal(harness.records.get(generationId)?.status, "accepted")
  assert.equal(harness.records.get(generationId)?.outcomeVersion, 1)
  assert.equal(harness.records.get(generationId)?.outcomeScore, 0.4)
  assert.ok(harness.records.get(generationId)?.outcomeQualifiedAt instanceof Date)
  assert.equal(harness.sites.get("site_accepted")?.activeDesignGenerationId, generationId)
})

test("acceptDesignGeneration devuelve fallo controlado si no puede enlazar el sitio", async () => {
  const { acceptDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const { input } = await recordBaseGeneration(harness, { initialPlanHash: "e".repeat(64) })

  const result = await acceptDesignGeneration({
    userId: input.userId,
    request: input.request,
    initialPlanHash: input.initialPlanHash,
    siteId: "site_missing",
  }, harness.client)

  assert.equal(result.ok, false)
})

test("acceptDesignGeneration devuelve fallo controlado con entradas invalidas o registro ausente", async () => {
  const { acceptDesignGeneration } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()

  const invalid = await acceptDesignGeneration({
    userId: "user_1",
    request: "Crea un sitio desde cero.",
    initialPlanHash: "no-es-hash",
    siteId: "site_1",
  }, harness.client)
  const missing = await acceptDesignGeneration({
    userId: "user_1",
    request: "Crea un sitio desde cero.",
    initialPlanHash: "f".repeat(64),
    siteId: "site_1",
  }, harness.client)

  assert.equal(invalid.ok, false)
  assert.equal(missing.ok, false)
})

test("markDesignGenerationEdited cambia solo la generacion activa a edited", async () => {
  const { markDesignGenerationEdited } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const active = await recordBaseGeneration(harness, { userId: "user_active", request: "Activa", initialPlanHash: "1".repeat(64) })
  const historical = await recordBaseGeneration(harness, { userId: "user_old", request: "Historica", initialPlanHash: "2".repeat(64) })
  harness.records.get(active.generationId)!.siteId = "site_edited"
  harness.records.get(active.generationId)!.status = "accepted"
  harness.records.get(historical.generationId)!.siteId = "site_edited"
  harness.records.get(historical.generationId)!.status = "accepted"
  harness.createSite("site_edited", active.generationId)

  const first = await markDesignGenerationEdited({ siteId: "site_edited" }, harness.client)
  const second = await markDesignGenerationEdited({ siteId: "site_edited" }, harness.client)

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(harness.records.get(active.generationId)?.status, "edited")
  assert.equal(harness.records.get(historical.generationId)?.status, "accepted")
})

test("markDesignGenerationEdited devuelve fallo controlado sin activeDesignGenerationId", async () => {
  const { markDesignGenerationEdited } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  harness.createSite("site_without_active")

  const result = await markDesignGenerationEdited({ siteId: "site_without_active" }, harness.client)

  assert.equal(result.ok, false)
  assert.equal(result.updatedCount, 0)
})

test("markDesignGenerationEdited no salta generated ni degrada published o abandoned", async () => {
  const { markDesignGenerationEdited } = await import("../../lib/orvenix-ai/design-memory")

  for (const status of ["generated", "published", "abandoned"] as const) {
    const harness = createHarness()
    const { generationId } = await recordBaseGeneration(harness, {
      userId: `user_${status}`,
      request: `Request ${status}`,
      initialPlanHash: status === "generated" ? "3".repeat(64) : status === "published" ? "4".repeat(64) : "5".repeat(64),
    })
    harness.records.get(generationId)!.siteId = `site_${status}`
    harness.records.get(generationId)!.status = status
    harness.createSite(`site_${status}`, generationId)

    const result = await markDesignGenerationEdited({ siteId: `site_${status}` }, harness.client)

    assert.equal(result.ok, false)
    assert.equal(harness.records.get(generationId)?.status, status)
  }
})

test("markDesignGenerationEdited devuelve fallo controlado ante error DB", async () => {
  const { markDesignGenerationEdited } = await import("../../lib/orvenix-ai/design-memory")
  const failed = await markDesignGenerationEdited({ siteId: "site_db" }, {
    editorWebsite: {
      findUnique: async () => ({ activeDesignGenerationId: "generation_1" }),
    },
    designGeneration: {
      updateMany: async () => {
        throw new Error("fallo interno de db")
      },
    },
  })

  assert.equal(failed.ok, false)
})

test("markDesignGenerationPublished cambia solo la generacion activa a published", async () => {
  const { markDesignGenerationPublished } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const active = await recordBaseGeneration(harness, { userId: "user_pub_active", request: "Activa pub", initialPlanHash: "6".repeat(64) })
  const historical = await recordBaseGeneration(harness, { userId: "user_pub_old", request: "Historica pub", initialPlanHash: "7".repeat(64) })
  harness.records.get(active.generationId)!.siteId = "site_pub"
  harness.records.get(active.generationId)!.status = "edited"
  harness.records.get(historical.generationId)!.siteId = "site_pub"
  harness.records.get(historical.generationId)!.status = "accepted"
  harness.createSite("site_pub", active.generationId)

  const first = await markDesignGenerationPublished({ siteId: "site_pub" }, harness.client)
  const second = await markDesignGenerationPublished({ siteId: "site_pub" }, harness.client)

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(harness.records.get(active.generationId)?.status, "published")
  assert.equal(harness.records.get(active.generationId)?.outcomeVersion, 1)
  assert.equal(harness.records.get(active.generationId)?.outcomeScore, null)
  assert.equal(harness.records.get(active.generationId)?.outcomeQualifiedAt, null)
  assert.equal(harness.records.get(historical.generationId)?.status, "accepted")
})

test("markDesignGenerationPublished no cambia generated ni abandoned", async () => {
  const { markDesignGenerationPublished } = await import("../../lib/orvenix-ai/design-memory")

  for (const status of ["generated", "abandoned"] as const) {
    const harness = createHarness()
    const { generationId } = await recordBaseGeneration(harness, {
      userId: `user_pub_${status}`,
      request: `Publish ${status}`,
      initialPlanHash: status === "generated" ? "8".repeat(64) : "9".repeat(64),
    })
    harness.records.get(generationId)!.siteId = `site_pub_${status}`
    harness.records.get(generationId)!.status = status
    harness.createSite(`site_pub_${status}`, generationId)

    const result = await markDesignGenerationPublished({ siteId: `site_pub_${status}` }, harness.client)

    assert.equal(result.ok, false)
    assert.equal(harness.records.get(generationId)?.status, status)
  }
})

test("markDesignGenerationPublished devuelve fallo controlado sin activeDesignGenerationId y ante error DB", async () => {
  const { markDesignGenerationPublished } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  harness.createSite("site_pub_missing")

  const missing = await markDesignGenerationPublished({ siteId: "site_pub_missing" }, harness.client)
  const failed = await markDesignGenerationPublished({ siteId: "site_pub_db" }, {
    editorWebsite: {
      findUnique: async () => ({ activeDesignGenerationId: "generation_1" }),
    },
    designGeneration: {
      updateMany: async () => {
        throw new Error("fallo interno de db")
      },
    },
  })

  assert.equal(missing.ok, false)
  assert.equal(missing.updatedCount, 0)
  assert.equal(failed.ok, false)
})


test("refreshDesignGenerationOutcome recalcula con editDistance final", async () => {
  const { refreshDesignGenerationOutcome } = await import("../../lib/orvenix-ai/design-memory")
  const harness = createHarness()
  const { generationId } = await recordBaseGeneration(harness, { initialPlanHash: "0".repeat(64) })
  const stored = harness.records.get(generationId)!
  stored.siteId = "site_refresh"
  stored.status = "published"
  stored.editDistance = null
  harness.createSite("site_refresh", generationId)

  const unmeasured = await refreshDesignGenerationOutcome({
    siteId: "site_refresh",
    now: new Date("2026-09-15T00:00:00.000Z"),
  }, harness.client)

  assert.equal(unmeasured.ok, true)
  assert.equal(unmeasured.outcomeScore, null)
  assert.equal(unmeasured.outcomeQualifiedAt, null)

  harness.records.get(generationId)!.editDistance = 0.25

  const result = await refreshDesignGenerationOutcome({
    siteId: "site_refresh",
    now: new Date("2026-09-15T00:00:00.000Z"),
  }, harness.client)

  assert.equal(result.ok, true)
  assert.equal(result.outcomeVersion, 1)
  assert.equal(result.outcomeScore, 0.8)
  assert.equal(harness.records.get(generationId)?.outcomeScore, 0.8)
})
