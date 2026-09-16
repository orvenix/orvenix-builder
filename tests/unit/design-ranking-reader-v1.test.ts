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

async function readRanking(input: Parameters<typeof import("../../lib/orvenix-ai/design-memory/ranking-reader").getDesignPatternRankingV1>[0], client: Parameters<typeof import("../../lib/orvenix-ai/design-memory/ranking-reader").getDesignPatternRankingV1>[1]) {
  const { getDesignPatternRankingV1 } = await import("../../lib/orvenix-ai/design-memory/ranking-reader")
  return getDesignPatternRankingV1(input, client)
}
import type { DesignPatternV1 } from "../../lib/orvenix-ai/design-memory/design-pattern"

const basePattern: DesignPatternV1 = {
  version: 1,
  context: {
    industryBucket: "health",
    siteType: "multipage",
    objectiveBucket: "lead_generation",
    styleBucket: "professional",
  },
  architecture: {
    pageCountBucket: "4-6",
    pageTypes: ["contact", "home", "services"],
    navigationOrder: ["home", "services", "contact"],
    homeSectionOrder: ["hero", "services", "contact", "footer"],
    requiredSections: ["contact", "footer", "hero", "services"],
  },
  conversion: {
    heroHasCta: true,
    finalCta: true,
    ctaCountBucket: "2-3",
    contactPresence: true,
  },
  theme: {
    mode: "light",
    accentHue: "blue",
    contrastBucket: "high",
    radiusBucket: "soft",
    typographyBucket: "sans",
    motionBucket: "subtle",
  },
  layout: {
    densityBucket: "medium",
    mediaPresenceBucket: "low",
    sectionCountBucket: "7-9",
  },
}

type PatternOverrides = Partial<Omit<DesignPatternV1, "context" | "theme">> & {
  context?: Partial<DesignPatternV1["context"]>
  theme?: Partial<DesignPatternV1["theme"]>
}

type MockRow = {
  patternVersion: number | null
  patternKey: unknown
  outcomeVersion: number | null
  outcomeScore: number | null
  status: string
  editDistance: number | null
  createdAt: Date
  outcomeQualifiedAt: Date | null
  request?: string
  initialPlan?: unknown
  userId?: string
  siteId?: string
}

function pattern(overrides: PatternOverrides = {}): DesignPatternV1 {
  return {
    ...structuredClone(basePattern),
    ...overrides,
    context: { ...basePattern.context, ...overrides.context },
    theme: { ...basePattern.theme, ...overrides.theme },
  }
}

function row(params: Partial<MockRow> = {}): MockRow {
  return {
    patternVersion: 1,
    patternKey: basePattern,
    outcomeVersion: 1,
    outcomeScore: 0.4,
    status: "accepted",
    editDistance: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    outcomeQualifiedAt: new Date("2026-09-02T00:00:00.000Z"),
    ...params,
  }
}

function qualifiedRows(count: number, params: Partial<MockRow> = {}) {
  return Array.from({ length: count }, (_, index) => row({
    createdAt: new Date(`2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
    ...params,
  }))
}

function createClient(rows: MockRow[], options: { fail?: boolean } = {}) {
  const calls: unknown[] = []
  return {
    calls,
    client: {
      designGeneration: {
        findMany: async (args: unknown) => {
          calls.push(args)
          if (options.fail) throw new Error("db down")
          return rows
        },
      },
    },
  }
}

test("consulta patternVersion=1 y usa select minimo sin datos privados", async () => {
  const harness = createClient([])

  await readRanking({ level: "L1" }, harness.client)

  assert.equal(harness.calls.length, 1)
  const args = harness.calls[0] as { where: Record<string, unknown>; select: Record<string, unknown>; include?: unknown; take?: unknown }
  assert.deepEqual(args.where, { patternVersion: 1 })
  assert.equal(args.include, undefined)
  assert.equal(args.take, undefined)
  assert.deepEqual(Object.keys(args.select).sort(), [
    "createdAt",
    "editDistance",
    "outcomeQualifiedAt",
    "outcomeScore",
    "outcomeVersion",
    "patternKey",
    "patternVersion",
    "status",
  ])

  for (const privateField of ["request", "initialPlan", "userId", "siteId"]) {
    assert.equal(privateField in args.select, false)
  }
})

test("transforma Prisma rows al input del ranking y conserva outcomeScore null", async () => {
  const harness = createClient([
    ...qualifiedRows(10, { status: "accepted", outcomeScore: 0.4 }),
    row({ status: "generated", outcomeScore: null, outcomeQualifiedAt: null }),
  ])

  const result = await readRanking({ level: "L1" }, harness.client)

  assert.equal(result.ok, true)
  assert.equal(result.rankings.length, 1)
  assert.equal(result.rankings[0]?.sampleSize, 11)
  assert.equal(result.rankings[0]?.matureSampleSize, 10)
  assert.equal(result.rankings[0]?.qualifiedSampleSize, 10)
})

test("published unmeasured llega al motor como publicación real no medida", async () => {
  const harness = createClient([
    ...qualifiedRows(10, { status: "accepted", outcomeScore: 0.4 }),
    row({ status: "published", outcomeScore: null, editDistance: null, outcomeQualifiedAt: null }),
  ])

  const result = await readRanking({ level: "L1" }, harness.client)

  assert.equal(result.ok, true)
  assert.equal(result.rankings[0]?.publishedCount, 1)
  assert.equal(result.rankings[0]?.measuredPublishedCount, 0)
  assert.equal(result.rankings[0]?.qualifiedSampleSize, 10)
})

test("L1 y L2 delegan al ranking puro con agrupación correspondiente", async () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const harness = createClient([
    ...qualifiedRows(5, { patternKey: blue, outcomeScore: 1 }),
    ...qualifiedRows(5, { patternKey: pink, outcomeScore: 0.8 }),
  ])

  const l1 = await readRanking({ level: "L1" }, harness.client)
  const l2 = await readRanking({ level: "L2" }, harness.client)

  assert.equal(l1.ok, true)
  assert.equal(l2.ok, true)
  assert.equal(l1.rankings.length, 1)
  assert.equal(l2.rankings.length, 2)
})

test("resultado mantiene sorting del motor y aplica limit despues de agregar", async () => {
  const high = pattern({ context: { industryBucket: "health" } })
  const low = pattern({ context: { industryBucket: "restaurant" } })
  const harness = createClient([
    ...qualifiedRows(10, { patternKey: low, outcomeScore: 0.4 }),
    ...qualifiedRows(10, { patternKey: high, outcomeScore: 1 }),
  ])

  const all = await readRanking({ level: "L1" }, harness.client)
  const limited = await readRanking({ level: "L1", limit: 1 }, harness.client)

  assert.equal(all.ok, true)
  assert.equal(limited.ok, true)
  assert.equal(all.rankings.length, 2)
  assert.equal(limited.rankings.length, 1)
  assert.equal(limited.rankings[0]?.patternKeyHash, all.rankings[0]?.patternKeyHash)
  assert.ok((all.rankings[0]?.rankingScore ?? 0) > (all.rankings[1]?.rankingScore ?? 0))
})

test("Prisma error produce fallo controlado", async () => {
  const harness = createClient([], { fail: true })

  const result = await readRanking({ level: "L1" }, harness.client)

  assert.equal(result.ok, false)
  assert.deepEqual(result.rankings, [])
  assert.equal(result.error, "No se pudo leer el ranking de patrones de diseño.")
})

test("empty DB devuelve ranking vacío", async () => {
  const harness = createClient([])

  const result = await readRanking({ level: "L2" }, harness.client)

  assert.equal(result.ok, true)
  assert.deepEqual(result.rankings, [])
})

test("row corrupta no tumba ranking completo", async () => {
  const harness = createClient([
    ...qualifiedRows(10, { outcomeScore: 0.8 }),
    row({ patternKey: { version: 1 }, outcomeScore: 1 }),
    row({ createdAt: new Date("invalid"), outcomeScore: 1 }),
    row({ patternVersion: 2, outcomeScore: 1 }),
  ])

  const result = await readRanking({ level: "L1" }, harness.client)

  assert.equal(result.ok, true)
  assert.equal(result.rankings.length, 1)
  assert.equal(result.rankings[0]?.sampleSize, 10)
})

test("nivel inválido falla de forma controlada sin consultar Prisma", async () => {
  const harness = createClient([])

  const result = await readRanking({ level: "L3" as "L1" }, harness.client)

  assert.equal(result.ok, false)
  assert.deepEqual(result.rankings, [])
  assert.equal(harness.calls.length, 0)
})
