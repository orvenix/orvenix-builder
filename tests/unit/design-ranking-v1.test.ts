import test from "node:test"
import assert from "node:assert/strict"

import {
  MIN_L1_QUALIFIED_SAMPLE,
  MIN_L2_QUALIFIED_SAMPLE,
  PRIOR_MEAN,
  PRIOR_WEIGHT_L1,
  PRIOR_WEIGHT_L2,
  computeBayesianRankingScoreV1,
  rankDesignPatternsV1,
  type DesignPatternRankingV1,
  type DesignRankingInputV1,
} from "../../lib/orvenix-ai/design-memory/design-ranking"
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

type PatternOverrides = Partial<Omit<DesignPatternV1, "context" | "architecture" | "conversion" | "theme" | "layout">> & {
  context?: Partial<DesignPatternV1["context"]>
  architecture?: Partial<DesignPatternV1["architecture"]>
  conversion?: Partial<DesignPatternV1["conversion"]>
  theme?: Partial<DesignPatternV1["theme"]>
  layout?: Partial<DesignPatternV1["layout"]>
}

function pattern(overrides: PatternOverrides = {}): DesignPatternV1 {
  return {
    ...structuredClone(basePattern),
    ...overrides,
    context: { ...basePattern.context, ...overrides.context },
    architecture: { ...basePattern.architecture, ...overrides.architecture },
    conversion: { ...basePattern.conversion, ...overrides.conversion },
    theme: { ...basePattern.theme, ...overrides.theme },
    layout: { ...basePattern.layout, ...overrides.layout },
  }
}

function row(params: Partial<DesignRankingInputV1> = {}): DesignRankingInputV1 {
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

function qualifiedRows(count: number, params: Partial<DesignRankingInputV1> = {}) {
  return Array.from({ length: count }, (_, index) => row({
    createdAt: new Date(`2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
    ...params,
  }))
}

function assertClose(actual: number | null, expected: number, epsilon = 1e-12) {
  assert.equal(typeof actual, "number")
  assert.ok(Math.abs(actual - expected) <= epsilon, ` !== `)
}

function onlyRanking(rows: DesignRankingInputV1[], level: "L1" | "L2" = "L1"): DesignPatternRankingV1 {
  const ranking = rankDesignPatternsV1(rows, level)
  assert.equal(ranking.length, 1)
  return ranking[0]!
}

test("misma colección en orden diferente produce output idéntico", () => {
  const rows = [
    ...qualifiedRows(8, { status: "published", outcomeScore: 1, editDistance: 0.05 }),
    ...qualifiedRows(2, { status: "edited", outcomeScore: 0.45 }),
  ]

  assert.deepEqual(rankDesignPatternsV1(rows, "L1"), rankDesignPatternsV1([...rows].reverse(), "L1"))
})

test("1/1 no es elegible por threshold", () => {
  const ranking = onlyRanking([row({ status: "published", outcomeScore: 1, editDistance: 0.01 })])

  assert.equal(ranking.qualifiedSampleSize, 1)
  assert.equal(ranking.rankingScore, null)
  assert.equal(ranking.confidence, "insufficient")
})

test("L1 requiere 10 qualified y L2 requiere 5 qualified", () => {
  assert.equal(onlyRanking(qualifiedRows(MIN_L1_QUALIFIED_SAMPLE - 1), "L1").rankingScore, null)
  assert.equal(typeof onlyRanking(qualifiedRows(MIN_L1_QUALIFIED_SAMPLE), "L1").rankingScore, "number")
  assert.equal(onlyRanking(qualifiedRows(MIN_L2_QUALIFIED_SAMPLE - 1), "L2").rankingScore, null)
  assert.equal(typeof onlyRanking(qualifiedRows(MIN_L2_QUALIFIED_SAMPLE), "L2").rankingScore, "number")
})

test("Bayesian smoothing exacto usa prior L1", () => {
  const rows = qualifiedRows(10, { outcomeScore: 1 })
  const ranking = onlyRanking(rows, "L1")
  const expected = (10 + PRIOR_MEAN * PRIOR_WEIGHT_L1) / (10 + PRIOR_WEIGHT_L1)

  assert.equal(ranking.rankingScore, expected)
  assert.equal(computeBayesianRankingScoreV1({ level: "L1", qualifiedSampleSize: 10, sumQualifiedOutcomeScores: 10 }), expected)
})

test("Bayesian smoothing exacto usa prior L2", () => {
  const rows = qualifiedRows(5, { outcomeScore: 1 })
  const ranking = onlyRanking(rows, "L2")
  const expected = (5 + PRIOR_MEAN * PRIOR_WEIGHT_L2) / (5 + PRIOR_WEIGHT_L2)

  assert.equal(ranking.rankingScore, expected)
  assert.equal(computeBayesianRankingScoreV1({ level: "L2", qualifiedSampleSize: 5, sumQualifiedOutcomeScores: 5 }), expected)
})

test("score siempre queda 0..1 o null", () => {
  const rankings = rankDesignPatternsV1([
    ...qualifiedRows(10, { outcomeScore: 1 }),
    row({ patternKey: pattern({ context: { industryBucket: "restaurant" } }), outcomeScore: Number.NaN }),
    row({ patternKey: pattern({ context: { industryBucket: "agency" } }), outcomeScore: null }),
  ], "L1")

  for (const ranking of rankings) {
    assert.ok(ranking.rankingScore === null || (ranking.rankingScore >= 0 && ranking.rankingScore <= 1))
  }
})

test("generated recent y generated unqualified no castigan rates", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(10, { status: "published", outcomeScore: 1, editDistance: 0.1 }),
    row({ status: "generated", outcomeScore: null, outcomeQualifiedAt: null }),
    row({ status: "generated", outcomeScore: null, outcomeQualifiedAt: null }),
  ])

  assert.equal(ranking.sampleSize, 12)
  assert.equal(ranking.matureSampleSize, 10)
  assert.equal(ranking.publishRate, 1)
})

test("generated stale entra en lifecycle y ranking", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(9, { status: "accepted", outcomeScore: 0.4 }),
    row({ status: "generated", outcomeScore: 0.1, outcomeQualifiedAt: new Date("2026-10-01T00:00:00.000Z") }),
  ])

  assert.equal(ranking.staleCount, 1)
  assert.equal(ranking.matureSampleSize, 10)
  assert.equal(ranking.qualifiedSampleSize, 10)
  assert.equal(ranking.acceptRate, 0.9)
})

test("published_unmeasured cuenta como publicacion real pero no contamina calidad ni score", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(10, { status: "accepted", outcomeScore: 0.4 }),
    row({ status: "published", outcomeScore: null, editDistance: null, outcomeQualifiedAt: null }),
  ])

  assert.equal(ranking.sampleSize, 11)
  assert.equal(ranking.matureSampleSize, 11)
  assert.equal(ranking.qualifiedSampleSize, 10)
  assert.equal(ranking.publishedCount, 1)
  assert.equal(ranking.measuredPublishedCount, 0)
  assert.equal(ranking.designQualitySampleSize, 0)
  assert.equal(ranking.avgEditDistance, null)
  assertClose(ranking.avgOutcomeScore, 0.4)
  assertClose(ranking.publishRate, 1 / 11)
  assert.equal(ranking.measuredPublishRate, 0)
})

test("published low medium high edit y avgEditDistance usan thresholds de Outcome V1", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(7, { status: "accepted", outcomeScore: 0.4 }),
    row({ status: "published", outcomeScore: 1, editDistance: 0.15 }),
    row({ status: "published", outcomeScore: 0.8, editDistance: 0.35 }),
    row({ status: "published", outcomeScore: 0.6, editDistance: 0.9 }),
  ])

  assert.equal(ranking.lowEditPublishedCount, 1)
  assert.equal(ranking.mediumEditPublishedCount, 1)
  assert.equal(ranking.highEditPublishedCount, 1)
  assert.equal(ranking.measuredPublishedCount, 3)
  assertClose(ranking.avgEditDistance, (0.15 + 0.35 + 0.9) / 3)
  assertClose(ranking.lowEditPublishRate, 1 / 3)
})

test("L1 agrupa patterns que difieren solo en theme y L2 los separa", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const rows = [
    ...qualifiedRows(5, { patternKey: blue, outcomeScore: 1 }),
    ...qualifiedRows(5, { patternKey: pink, outcomeScore: 0.8 }),
  ]

  assert.equal(rankDesignPatternsV1(rows, "L1").length, 1)
  assert.equal(rankDesignPatternsV1(rows, "L2").length, 2)
})

test("input inválido no rompe ranking completo", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(10, { outcomeScore: 0.8 }),
    row({ patternVersion: 2, outcomeScore: 1 }),
    row({ patternKey: { version: 1 }, outcomeScore: 1 }),
    row({ createdAt: new Date("invalid"), outcomeScore: 1 }),
    row({ outcomeScore: Number.POSITIVE_INFINITY }),
    row({ editDistance: Number.POSITIVE_INFINITY, status: "published", outcomeScore: null }),
  ])

  assert.equal(ranking.sampleSize, 12)
  assert.equal(ranking.qualifiedSampleSize, 10)
  assert.equal(ranking.measuredPublishedCount, 0)
})

test("empate usa patternKeyHash deterministico", () => {
  const restaurant = pattern({ context: { industryBucket: "restaurant" } })
  const agency = pattern({ context: { industryBucket: "agency" } })
  const rankings = rankDesignPatternsV1([
    ...qualifiedRows(10, { patternKey: restaurant, outcomeScore: 0.8 }),
    ...qualifiedRows(10, { patternKey: agency, outcomeScore: 0.8 }),
  ], "L1")
  const hashes = rankings.map((entry) => entry.patternKeyHash)

  assert.deepEqual(hashes, [...hashes].sort())
})

test("firstSeenAt y lastSeenAt usan createdAt", () => {
  const ranking = onlyRanking([
    row({ createdAt: new Date("2026-09-20T00:00:00.000Z") }),
    ...qualifiedRows(9, { createdAt: new Date("2026-09-10T00:00:00.000Z") }),
    row({ createdAt: new Date("2026-10-05T00:00:00.000Z"), status: "published", outcomeScore: null, editDistance: null }),
  ])

  assert.equal(ranking.firstSeenAt, "2026-09-10T00:00:00.000Z")
  assert.equal(ranking.lastSeenAt, "2026-10-05T00:00:00.000Z")
})

test("output no contiene informacion privada", () => {
  const privateRow = row({
    userId: "user_private",
    siteId: "site_private",
    request: "Crea sitio para Clinica Secreta contacto@secreto.test",
    initialPlan: { secret: true },
    image: "https://privado.test/imagen.jpg",
  } as unknown as Partial<DesignRankingInputV1>)
  const rankingJson = JSON.stringify(onlyRanking([...qualifiedRows(9), privateRow]))

  assert.equal(rankingJson.includes("user_private"), false)
  assert.equal(rankingJson.includes("site_private"), false)
  assert.equal(rankingJson.includes("Clinica Secreta"), false)
  assert.equal(rankingJson.includes("contacto@secreto.test"), false)
  assert.equal(rankingJson.includes("privado.test"), false)
})

test("rates nunca son mayores a 1", () => {
  const ranking = onlyRanking([
    ...qualifiedRows(10, { status: "published", outcomeScore: 1, editDistance: 0.01 }),
    row({ status: "published", outcomeScore: null, editDistance: null }),
  ])

  for (const value of [ranking.acceptRate, ranking.publishRate, ranking.measuredPublishRate, ranking.lowEditPublishRate]) {
    assert.ok(value === null || (value >= 0 && value <= 1))
  }
})
