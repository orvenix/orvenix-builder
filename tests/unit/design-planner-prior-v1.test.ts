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
  createDesignPlannerPriorV1,
} from "../../lib/orvenix-ai/design-memory/planner-prior"
import type { DesignPatternSelectionV1 } from "../../lib/orvenix-ai/design-memory/pattern-selector"

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

function levelKey(pattern: DesignPatternV1, level: "L1" | "L2") {
  return JSON.parse(createDesignPatternLevelKey(pattern, level)) as unknown
}

function recommendSelection(params: Partial<Extract<DesignPatternSelectionV1, { decision: "recommend" }>> = {}): Extract<DesignPatternSelectionV1, { decision: "recommend" }> {
  const level = params.level ?? "L2"

  return {
    version: 1,
    decision: "recommend",
    level,
    patternKey: params.patternKey ?? levelKey(basePattern, level),
    patternKeyHash: params.patternKeyHash ?? createDesignPatternLevelHash(basePattern, level),
    rankingScore: params.rankingScore === undefined ? 0.81 : params.rankingScore,
    confidence: params.confidence ?? "high",
    qualifiedSampleSize: params.qualifiedSampleSize ?? 53,
    fallbackUsed: params.fallbackUsed ?? false,
    reason: params.reason ?? ["Selected L2 compatible pattern."],
  }
}

function abstainSelection(): Extract<DesignPatternSelectionV1, { decision: "abstain" }> {
  return {
    version: 1,
    decision: "abstain",
    reasonCode: "insufficient_evidence",
    reason: ["No usable evidence."],
  }
}

function createPrior(selection: DesignPatternSelectionV1) {
  return createDesignPlannerPriorV1({ selection })
}

function assertNoPrivateFields(value: unknown) {
  const json = JSON.stringify(value)
  assert.equal(json.includes("userId"), false)
  assert.equal(json.includes("siteId"), false)
  assert.equal(json.includes("request"), false)
  assert.equal(json.includes("initialPlan"), false)
  assert.equal(json.includes("business name"), false)
  assert.equal(json.includes("555-1234"), false)
  assert.equal(json.includes("https://private.example"), false)
}

test("abstain produce null", () => {
  assert.equal(createPrior(abstainSelection()), null)
})

test("L2 recommend produce advisory prior", () => {
  const prior = createPrior(recommendSelection())

  assert.equal(prior?.version, 1)
  assert.equal(prior?.source, "design_memory")
  assert.equal(prior?.mode, "advisory")
  assert.equal(prior?.level, "L2")
})

test("L2 contiene theme", () => {
  const prior = createPrior(recommendSelection())

  assert.deepEqual(prior?.recommendation.theme, basePattern.theme)
})

test("L2 conserva score", () => {
  const prior = createPrior(recommendSelection({ rankingScore: 0.7234 }))

  assert.equal(prior?.evidence.rankingScore, 0.7234)
})

test("conserva confidence", () => {
  const prior = createPrior(recommendSelection({ confidence: "medium" }))

  assert.equal(prior?.evidence.confidence, "medium")
})

test("conserva qualifiedSampleSize", () => {
  const prior = createPrior(recommendSelection({ qualifiedSampleSize: 24 }))

  assert.equal(prior?.evidence.qualifiedSampleSize, 24)
})

test("conserva fallbackUsed", () => {
  const prior = createPrior(recommendSelection({ level: "L1", fallbackUsed: true }))

  assert.equal(prior?.evidence.fallbackUsed, true)
})

test("conserva patternKeyHash y provenance", () => {
  const hash = createDesignPatternLevelHash(basePattern, "L2")
  const prior = createPrior(recommendSelection({ patternKeyHash: hash }))

  assert.equal(prior?.patternKeyHash, hash)
  assert.equal(prior?.rankingVersion, 1)
  assert.equal(prior?.patternVersion, 1)
})

test("L1 no inventa theme", () => {
  const prior = createPrior(recommendSelection({ level: "L1", fallbackUsed: true }))

  assert.equal("theme" in (prior?.recommendation ?? {}), false)
})

test("L1 puede producir contextual evidence", () => {
  const prior = createPrior(recommendSelection({ level: "L1", fallbackUsed: true }))

  assert.equal(prior?.level, "L1")
  assert.deepEqual(prior?.recommendation.context, basePattern.context)
})

test("confidence insufficient no produce prior", () => {
  const selection = recommendSelection({ confidence: "insufficient" as "high" })

  assert.equal(createPrior(selection), null)
})

test("score null o invalido no produce prior", () => {
  assert.equal(createPrior(recommendSelection({ rankingScore: null as unknown as number })), null)
  assert.equal(createPrior(recommendSelection({ rankingScore: -0.1 })), null)
  assert.equal(createPrior(recommendSelection({ rankingScore: 1.1 })), null)
})

test("NaN e Infinity no producen prior", () => {
  assert.equal(createPrior(recommendSelection({ rankingScore: Number.NaN })), null)
  assert.equal(createPrior(recommendSelection({ rankingScore: Number.POSITIVE_INFINITY })), null)
})

test("qualifiedSampleSize invalido no produce prior", () => {
  assert.equal(createPrior(recommendSelection({ qualifiedSampleSize: -1 })), null)
  assert.equal(createPrior(recommendSelection({ qualifiedSampleSize: 1.5 })), null)
})

test("pattern invalido no produce prior", () => {
  assert.equal(createPrior(recommendSelection({ patternKey: { version: 1 } })), null)
  assert.equal(createPrior(recommendSelection({ level: "L2", patternKey: levelKey(basePattern, "L1") })), null)
})

test("output deterministico", () => {
  const selection = recommendSelection({ rankingScore: 0.812345 })

  assert.deepEqual(createPrior(selection), createPrior(selection))
})

test("no muta selection", () => {
  const selection = recommendSelection()
  const before = structuredClone(selection)

  createPrior(selection)

  assert.deepEqual(selection, before)
})

test("no contiene informacion privada", () => {
  const prior = createPrior(recommendSelection({
    patternKey: {
      version: 1,
      context: basePattern.context,
      theme: basePattern.theme,
      userId: "user_1",
      siteId: "site_1",
      request: "business name 555-1234",
      initialPlan: { url: "https://private.example" },
    },
  }))

  assertNoPrivateFields(prior)
})

test("no importa Prisma", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/design-memory/planner-prior.ts"),
    "utf8",
  )

  assert.equal(source.includes("editorPrisma"), false)
  assert.equal(source.includes("@prisma/client"), false)
})

test("no usa DB network randomness ni clock", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/design-memory/planner-prior.ts"),
    "utf8",
  )

  assert.equal(source.includes("fetch("), false)
  assert.equal(source.includes("Math.random"), false)
  assert.equal(source.includes("Date.now"), false)
  assert.equal(source.includes("new Date"), false)
})
