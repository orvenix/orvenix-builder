import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import Module from "node:module"
import path from "node:path"

import {
  inspectDesignPatternRankingV1,
  type DesignRankingInspectionV1,
} from "../../lib/orvenix-ai/design-memory/ranking-inspector"
import type {
  DesignPatternRankingV1,
  DesignPatternRankingV1Confidence,
  DesignPatternRankingV1Level,
} from "../../lib/orvenix-ai/design-memory/design-ranking"
import type { DesignPatternV1 } from "../../lib/orvenix-ai/design-memory/design-pattern"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
const repoRoot = path.resolve(__dirname, "../..")
const readerModulePath = path.join(repoRoot, "lib/orvenix-ai/design-memory/ranking-reader")

;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (request === "./ranking-reader") {
    return readerModulePath
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(repoRoot, request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

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

function ranking(params: Partial<DesignPatternRankingV1> = {}): DesignPatternRankingV1 {
  return {
    version: 1,
    level: "L1",
    patternKey: basePattern,
    patternKeyHash: "hash_a",
    sampleSize: 14,
    matureSampleSize: 12,
    qualifiedSampleSize: 10,
    designQualitySampleSize: 4,
    generatedCount: 2,
    staleCount: 0,
    acceptedCount: 4,
    editedCount: 2,
    publishedCount: 6,
    measuredPublishedCount: 4,
    acceptRate: 0.5,
    publishRate: 0.5,
    measuredPublishRate: 0.6666666666666666,
    avgOutcomeScore: 0.72,
    avgEditDistance: 0.12,
    lowEditPublishedCount: 3,
    mediumEditPublishedCount: 1,
    highEditPublishedCount: 0,
    lowEditPublishRate: 0.75,
    rankingScore: 0.61,
    confidence: "medium",
    firstSeenAt: "2026-09-01T00:00:00.000Z",
    lastSeenAt: "2026-09-10T00:00:00.000Z",
    ...params,
  }
}

function insufficient(params: Partial<DesignPatternRankingV1> = {}): DesignPatternRankingV1 {
  return ranking({
    patternKeyHash: "hash_insufficient",
    sampleSize: 3,
    matureSampleSize: 3,
    qualifiedSampleSize: 3,
    designQualitySampleSize: 0,
    acceptRate: null,
    publishRate: null,
    measuredPublishRate: null,
    avgOutcomeScore: null,
    avgEditDistance: null,
    lowEditPublishRate: null,
    rankingScore: null,
    confidence: "insufficient",
    ...params,
  })
}

async function importInspector() {
  return import("../../lib/orvenix-ai/design-memory/ranking-inspector")
}

function assertNoPrivateFields(value: unknown) {
  const json = JSON.stringify(value)
  assert.equal(json.includes("userId"), false)
  assert.equal(json.includes("siteId"), false)
  assert.equal(json.includes("request"), false)
  assert.equal(json.includes("initialPlan"), false)
  assert.equal(json.includes("business name"), false)
  assert.equal(json.includes("https://private.example"), false)
}

function stubReader(result: unknown) {
  const calls: unknown[] = []
  require.cache[readerModulePath] = {
    id: readerModulePath,
    filename: readerModulePath,
    loaded: true,
    exports: {
      getDesignPatternRankingV1: async (input: unknown) => {
        calls.push(input)
        return result
      },
    },
    children: [],
    paths: [],
  } as NodeJS.Module

  return calls
}

test("eligible recibe rank secuencial e insufficient queda null", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1", rankingScore: 0.9 }),
    insufficient({ patternKeyHash: "hash_2" }),
    ranking({ patternKeyHash: "hash_3", rankingScore: 0.8 }),
  ], { level: "L1", includeInsufficient: true })

  assert.deepEqual(inspection.topPatterns.map((entry) => entry.rank), [1, null, 2])
})

test("totalPatterns eligiblePatterns e insufficientPatterns son correctos", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1" }),
    insufficient({ patternKeyHash: "hash_2" }),
    insufficient({ patternKeyHash: "hash_3" }),
  ], { level: "L1", includeInsufficient: true })

  assert.equal(inspection.totalPatterns, 3)
  assert.equal(inspection.eligiblePatterns, 1)
  assert.equal(inspection.insufficientPatterns, 2)
})

test("limit no altera estadisticas y solo recorta el listado visible", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1" }),
    ranking({ patternKeyHash: "hash_2" }),
    insufficient({ patternKeyHash: "hash_3" }),
  ], { level: "L1", limit: 1, includeInsufficient: true })

  assert.equal(inspection.totalPatterns, 3)
  assert.equal(inspection.eligiblePatterns, 2)
  assert.equal(inspection.insufficientPatterns, 1)
  assert.equal(inspection.topPatterns.length, 1)
  assert.equal(inspection.topPatterns[0]?.patternKeyHash, "hash_1")
})

test("includeInsufficient=false oculta insufficient del listado por defecto", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1" }),
    insufficient({ patternKeyHash: "hash_2" }),
  ], { level: "L1" })

  assert.equal(inspection.topPatterns.length, 1)
  assert.equal(inspection.topPatterns[0]?.patternKeyHash, "hash_1")
  assert.equal(inspection.insufficientPatterns, 1)
})

test("includeInsufficient=true conserva insufficient en el listado", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1" }),
    insufficient({ patternKeyHash: "hash_2" }),
  ], { level: "L1", includeInsufficient: true })

  assert.deepEqual(inspection.topPatterns.map((entry) => entry.patternKeyHash), ["hash_1", "hash_2"])
})

test("explanation eligible es deterministica y basada en metricas", () => {
  const first = inspectDesignPatternRankingV1([ranking()], { level: "L1" })
  const second = inspectDesignPatternRankingV1([ranking()], { level: "L1" })

  assert.deepEqual(first.topPatterns[0]?.explanation, second.topPatterns[0]?.explanation)
  assert.deepEqual(first.topPatterns[0]?.explanation, [
    "Eligible with 10 qualified samples.",
    "Bayesian ranking score: 0.61.",
    "Confidence: medium.",
    "Published in 50% of mature lifecycle samples.",
    "Average outcome score: 0.72.",
    "Average edit distance among measured publications: 0.12.",
    "75% of measured publications were low-edit.",
  ])
})

test("explanation insufficient incluye muestra actual y requerida", () => {
  const inspection = inspectDesignPatternRankingV1([insufficient()], { level: "L2", includeInsufficient: true })

  assert.deepEqual(inspection.topPatterns[0]?.explanation, [
    "Insufficient qualified sample: 3/5 required for L2.",
    "Confidence: insufficient.",
  ])
})

test("null rates no generan informacion falsa", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({
      publishRate: null,
      avgOutcomeScore: null,
      avgEditDistance: null,
      lowEditPublishRate: null,
    }),
  ], { level: "L1" })
  const explanation = inspection.topPatterns[0]?.explanation ?? []

  assert.equal(explanation.some((line) => line.includes("Published in")), false)
  assert.equal(explanation.some((line) => line.includes("Average outcome")), false)
  assert.equal(explanation.some((line) => line.includes("edit distance")), false)
  assert.equal(explanation.some((line) => line.includes("low-edit")), false)
})

test("avgEditDistance solo se reporta si existe", () => {
  const withoutDistance = inspectDesignPatternRankingV1([
    ranking({ avgEditDistance: null }),
  ], { level: "L1" })
  const withDistance = inspectDesignPatternRankingV1([
    ranking({ avgEditDistance: 0.2 }),
  ], { level: "L1" })

  assert.equal(withoutDistance.topPatterns[0]?.explanation.some((line) => line.includes("edit distance")), false)
  assert.equal(withDistance.topPatterns[0]?.explanation.some((line) => line === "Average edit distance among measured publications: 0.2."), true)
})

test("rankingScore y confidence se conservan exactamente", () => {
  const score = 0.6123456789
  const confidence: DesignPatternRankingV1Confidence = "high"
  const inspection = inspectDesignPatternRankingV1([
    ranking({ rankingScore: score, confidence }),
  ], { level: "L1" })

  assert.equal(inspection.topPatterns[0]?.rankingScore, score)
  assert.equal(inspection.topPatterns[0]?.confidence, confidence)
})

test("orden de Ranking V1 se conserva", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "third", rankingScore: 0.3 }),
    ranking({ patternKeyHash: "first", rankingScore: 0.9 }),
    insufficient({ patternKeyHash: "missing" }),
  ], { level: "L1", includeInsufficient: true })

  assert.deepEqual(inspection.topPatterns.map((entry) => entry.patternKeyHash), ["third", "first", "missing"])
})

test("output no contiene datos privados", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKey: { ...basePattern, userId: "user_1", siteId: "site_1", request: "business name", initialPlan: { url: "https://private.example" } } }),
  ], { level: "L1" })

  assertNoPrivateFields({ ...inspection, topPatterns: inspection.topPatterns.map((entry) => ({ ...entry, patternKey: undefined })) })
})

test("formatter no importa Prisma ni el reader", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/design-memory/ranking-inspector.ts"),
    "utf8",
  )

  assert.equal(source.includes("editorPrisma"), false)
  assert.equal(source.includes("@prisma/client"), false)
  assert.equal(source.includes("from \"./ranking-reader\""), false)
})

test("wrapper reutiliza Ranking Reader", async () => {
  const calls = stubReader({ ok: true, rankings: [ranking({ patternKeyHash: "hash_wrapper" })] })
  const { getDesignPatternRankingInspectionV1 } = await importInspector()
  const result = await getDesignPatternRankingInspectionV1({ level: "L2", limit: 1 })

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(calls, [{ level: "L2" }])
  assert.equal(result.inspection.level, "L2")
  assert.equal(result.inspection.topPatterns[0]?.patternKeyHash, "hash_wrapper")
})

test("error del reader produce error controlado", async () => {
  stubReader({ ok: false, rankings: [], error: "db down" })
  const { getDesignPatternRankingInspectionV1 } = await importInspector()
  const result = await getDesignPatternRankingInspectionV1({ level: "L1" })

  assert.deepEqual(result, {
    ok: false,
    inspection: null,
    error: "No se pudo inspeccionar el ranking de patrones de diseño.",
  })
})

test("empty ranking produce reporte vacio valido", () => {
  const inspection = inspectDesignPatternRankingV1([], { level: "L1", includeInsufficient: true })

  assert.deepEqual(inspection, {
    version: 1,
    level: "L1",
    totalPatterns: 0,
    eligiblePatterns: 0,
    insufficientPatterns: 0,
    topPatterns: [],
  } satisfies DesignRankingInspectionV1)
})

test("level puede inferirse del primer ranking cuando existe", () => {
  const level: DesignPatternRankingV1Level = "L2"
  const inspection = inspectDesignPatternRankingV1([ranking({ level })])

  assert.equal(inspection.level, "L2")
})

test("patternKeyHash y patternKey agregado se conservan", () => {
  const source = ranking({ patternKeyHash: "stable_hash" })
  const inspection = inspectDesignPatternRankingV1([source], { level: "L1" })

  assert.equal(inspection.topPatterns[0]?.patternKeyHash, "stable_hash")
  assert.deepEqual(inspection.topPatterns[0]?.patternKey, basePattern)
})

test("measuredPublishRate se conserva sin inventar explanation extra", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ measuredPublishRate: 0.25 }),
  ], { level: "L1" })

  assert.equal(inspection.topPatterns[0]?.measuredPublishRate, 0.25)
  assert.equal(inspection.topPatterns[0]?.explanation.some((line) => line.includes("measured publish")), false)
})

test("limit invalido se ignora sin cambiar el reporte", () => {
  const inspection = inspectDesignPatternRankingV1([
    ranking({ patternKeyHash: "hash_1" }),
    ranking({ patternKeyHash: "hash_2" }),
  ], { level: "L1", limit: 0 })

  assert.equal(inspection.topPatterns.length, 2)
  assert.deepEqual(inspection.topPatterns.map((entry) => entry.patternKeyHash), ["hash_1", "hash_2"])
})
