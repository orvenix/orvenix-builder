import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import {
  createDesignPatternLevelHash,
  createDesignPatternLevelKey,
  type DesignPatternV1,
} from "../../lib/orvenix-ai/design-memory/design-pattern"
import {
  createDesignPatternSelectionTargetV1,
  selectDesignPatternV1,
} from "../../lib/orvenix-ai/design-memory/pattern-selector"
import type { DesignPatternRankingV1 } from "../../lib/orvenix-ai/design-memory/design-ranking"

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

function levelKey(patternValue: DesignPatternV1, level: "L1" | "L2") {
  return JSON.parse(createDesignPatternLevelKey(patternValue, level)) as unknown
}

function ranking(params: {
  pattern?: DesignPatternV1
  level?: "L1" | "L2"
  score?: number | null
  confidence?: DesignPatternRankingV1["confidence"]
  qualifiedSampleSize?: number
} = {}): DesignPatternRankingV1 {
  const level = params.level ?? "L2"
  const patternValue = params.pattern ?? basePattern
  const score = params.score === undefined ? 0.8 : params.score
  const confidence = params.confidence ?? "medium"
  const qualifiedSampleSize = params.qualifiedSampleSize ?? 12

  return {
    version: 1,
    level,
    patternKey: levelKey(patternValue, level),
    patternKeyHash: createDesignPatternLevelHash(patternValue, level),
    sampleSize: qualifiedSampleSize,
    matureSampleSize: qualifiedSampleSize,
    qualifiedSampleSize,
    designQualitySampleSize: 4,
    generatedCount: 0,
    staleCount: 0,
    acceptedCount: 4,
    editedCount: 2,
    publishedCount: 6,
    measuredPublishedCount: 4,
    acceptRate: 0.5,
    publishRate: 0.5,
    measuredPublishRate: 0.4,
    avgOutcomeScore: score,
    avgEditDistance: 0.2,
    lowEditPublishedCount: 2,
    mediumEditPublishedCount: 1,
    highEditPublishedCount: 1,
    lowEditPublishRate: 0.5,
    rankingScore: score,
    confidence,
    firstSeenAt: "2026-09-01T00:00:00.000Z",
    lastSeenAt: "2026-09-10T00:00:00.000Z",
  }
}

function select(params: Partial<Parameters<typeof selectDesignPatternV1>[0]> = {}) {
  return selectDesignPatternV1({
    targetPattern: basePattern,
    l1Rankings: [],
    l2Rankings: [],
    ...params,
  })
}

function assertRecommend(selection: ReturnType<typeof selectDesignPatternV1>) {
  assert.equal(selection.decision, "recommend")
  if (selection.decision !== "recommend") throw new Error("expected recommend")
  return selection
}

function assertAbstain(selection: ReturnType<typeof selectDesignPatternV1>) {
  assert.equal(selection.decision, "abstain")
  if (selection.decision !== "abstain") throw new Error("expected abstain")
  return selection
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

test("mejor L2 compatible es recomendado", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const selection = assertRecommend(select({
    targetPattern: blue,
    l2Rankings: [ranking({ pattern: blue, score: 0.7 }), ranking({ pattern: pink, score: 0.9 })],
  }))

  assert.equal(selection.level, "L2")
  assert.equal(selection.patternKeyHash, createDesignPatternLevelHash(pink, "L2"))
})

test("L2 insufficient usa fallback L1", () => {
  const selection = assertRecommend(select({
    l2Rankings: [ranking({ score: null, confidence: "insufficient", qualifiedSampleSize: 2 })],
    l1Rankings: [ranking({ level: "L1", score: 0.65 })],
  }))

  assert.equal(selection.level, "L1")
  assert.equal(selection.fallbackUsed, true)
})

test("L2 inexistente usa fallback L1", () => {
  const selection = assertRecommend(select({
    l1Rankings: [ranking({ level: "L1", score: 0.66 })],
  }))

  assert.equal(selection.level, "L1")
})

test("L1 insufficient produce abstain", () => {
  const selection = assertAbstain(select({
    l1Rankings: [ranking({ level: "L1", score: null, confidence: "insufficient", qualifiedSampleSize: 4 })],
  }))

  assert.equal(selection.reasonCode, "insufficient_evidence")
})

test("sin compatible produce abstain", () => {
  const other = pattern({ context: { industryBucket: "restaurant" } })
  const selection = assertAbstain(select({
    l1Rankings: [ranking({ pattern: other, level: "L1", score: 0.9 })],
    l2Rankings: [ranking({ pattern: other, level: "L2", score: 0.9 })],
  }))

  assert.equal(selection.reasonCode, "no_compatible_pattern")
})

test("rankingScore null nunca se selecciona", () => {
  const selection = assertAbstain(select({
    l2Rankings: [ranking({ score: null, confidence: "medium" })],
  }))

  assert.equal(selection.reasonCode, "insufficient_evidence")
})

test("confidence insufficient nunca se selecciona", () => {
  const selection = assertAbstain(select({
    l2Rankings: [ranking({ score: 0.9, confidence: "insufficient" })],
  }))

  assert.equal(selection.reasonCode, "insufficient_evidence")
})

test("preserveTheme evita reemplazo incompatible", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const selection = assertAbstain(select({
    targetPattern: blue,
    l2Rankings: [ranking({ pattern: pink, score: 0.95 })],
    constraints: { preserveTheme: true },
  }))

  assert.equal(selection.reasonCode, "constraint_preserved")
})

test("preserveStyle evita reemplazo incompatible", () => {
  const modern = pattern({ context: { styleBucket: "modern" } })
  const selection = assertAbstain(select({
    constraints: { preserveStyle: true },
    l2Rankings: [ranking({ pattern: modern, score: 0.95 })],
  }))

  assert.equal(selection.reasonCode, "no_compatible_pattern")
})

test("hard constraint gana sobre ranking", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const selection = assertRecommend(select({
    targetPattern: blue,
    l2Rankings: [ranking({ pattern: pink, score: 0.99 }), ranking({ pattern: blue, score: 0.7 })],
    constraints: { preserveTheme: true },
  }))

  assert.equal(selection.patternKeyHash, createDesignPatternLevelHash(blue, "L2"))
})

test("fallbackUsed es correcto para L2 y L1", () => {
  const l2 = assertRecommend(select({ l2Rankings: [ranking({ score: 0.8 })] }))
  const l1 = assertRecommend(select({ l1Rankings: [ranking({ level: "L1", score: 0.8 })] }))

  assert.equal(l2.fallbackUsed, false)
  assert.equal(l1.fallbackUsed, true)
})

test("evidence incluye score confidence y sample", () => {
  const selection = assertRecommend(select({
    l2Rankings: [ranking({ score: 0.81234, confidence: "high", qualifiedSampleSize: 24 })],
  }))

  assert.equal(selection.rankingScore, 0.81234)
  assert.equal(selection.confidence, "high")
  assert.equal(selection.qualifiedSampleSize, 24)
  assert.deepEqual(selection.reason, [
    "Selected L2 compatible pattern.",
    "Ranking score: 0.8123.",
    "Confidence: high.",
    "Qualified samples: 24.",
    "Fallback used: false.",
  ])
})

test("empate es deterministico", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const first = assertRecommend(select({
    l2Rankings: [ranking({ pattern: blue, score: 0.8 }), ranking({ pattern: pink, score: 0.8 })],
  }))
  const second = assertRecommend(select({
    l2Rankings: [ranking({ pattern: pink, score: 0.8 }), ranking({ pattern: blue, score: 0.8 })],
  }))

  assert.equal(first.patternKeyHash, second.patternKeyHash)
})

test("input desordenado produce misma seleccion", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const pink = pattern({ theme: { accentHue: "pink" } })
  const gold = pattern({ theme: { accentHue: "amber" } })
  const rows = [
    ranking({ pattern: blue, score: 0.7 }),
    ranking({ pattern: pink, score: 0.9 }),
    ranking({ pattern: gold, score: 0.8 }),
  ]

  assert.equal(
    assertRecommend(select({ l2Rankings: rows })).patternKeyHash,
    assertRecommend(select({ l2Rankings: [...rows].reverse() })).patternKeyHash,
  )
})

test("target invalido produce abstain", () => {
  const selection = assertAbstain(select({ targetPattern: { version: 1 } }))

  assert.equal(selection.reasonCode, "invalid_target")
})

test("output no contiene datos privados", () => {
  const selection = select({
    l2Rankings: [ranking({ score: 0.8 })],
  })

  assertNoPrivateFields(selection)
})

test("selector no importa Prisma", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/design-memory/pattern-selector.ts"),
    "utf8",
  )

  assert.equal(source.includes("editorPrisma"), false)
  assert.equal(source.includes("@prisma/client"), false)
})

test("selector no usa randomness ni reloj", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/design-memory/pattern-selector.ts"),
    "utf8",
  )

  assert.equal(source.includes("Math.random"), false)
  assert.equal(source.includes("Date.now"), false)
  assert.equal(source.includes("new Date"), false)
})

test("no muta rankings de entrada", () => {
  const rows = [ranking({ score: 0.7 }), ranking({ score: 0.9 })]
  const before = structuredClone(rows)

  select({ l2Rankings: rows })

  assert.deepEqual(rows, before)
})

test("seleccion L1/L2 respeta helpers reales", () => {
  const target = pattern({ theme: { accentHue: "blue" } })
  const selectionL2 = assertRecommend(select({
    targetPattern: target,
    l2Rankings: [ranking({ pattern: target, score: 0.8 })],
  }))
  const selectionL1 = assertRecommend(select({
    targetPattern: target,
    l1Rankings: [ranking({ pattern: target, level: "L1", score: 0.8 })],
  }))

  assert.equal(selectionL2.patternKeyHash, createDesignPatternLevelHash(target, "L2"))
  assert.equal(selectionL1.patternKeyHash, createDesignPatternLevelHash(target, "L1"))
})

test("target pre-plan permite seleccionar variantes L2 sin Pattern completo", () => {
  const blue = pattern({ theme: { accentHue: "blue" } })
  const purple = pattern({ theme: { accentHue: "purple" } })
  const target = createDesignPatternSelectionTargetV1({ context: blue.context })
  const selection = assertRecommend(select({
    targetPattern: undefined,
    target,
    l2Rankings: [ranking({ pattern: purple, score: 0.9 })],
  }))

  assert.equal(selection.level, "L2")
  assert.equal(selection.patternKeyHash, createDesignPatternLevelHash(purple, "L2"))
})

test("target pre-plan con preserveTheme sin L2 target no sustituye theme", () => {
  const purple = pattern({ theme: { accentHue: "purple" } })
  const target = createDesignPatternSelectionTargetV1({ context: basePattern.context })
  const selection = assertAbstain(select({
    targetPattern: undefined,
    target,
    l2Rankings: [ranking({ pattern: purple, score: 0.9 })],
    constraints: { preserveTheme: true },
  }))

  assert.equal(selection.reasonCode, "constraint_preserved")
})
