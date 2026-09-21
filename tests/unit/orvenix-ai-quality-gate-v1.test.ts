import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

async function loadQualityGateModule() {
  const gateModule = await import("../../lib/orvenix-ai/evaluation/quality-gate")
  const gateSummaryModule = await import("../../lib/orvenix-ai/evaluation/quality-gate-summary")
  const gateCodesModule = await import("../../lib/orvenix-ai/evaluation/quality-gate-codes")
  const codesModule = await import("../../lib/orvenix-ai/evaluation/codes")
  const scoringModule = await import("../../lib/orvenix-ai/evaluation/scoring")
  const fixturesModule = await import("../../lib/orvenix-ai/evaluation/fixtures")
  return { ...gateModule, ...gateSummaryModule, ...gateCodesModule, ...codesModule, ...scoringModule, ...fixturesModule }
}

function deepFreezeClone<T>(value: T): T {
  return structuredClone(value)
}

test("gate deterministico: mismo plan y mismo contexto producen la misma decision", async () => {
  const { assessSiteGenerationQualityV1, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadQualityGateModule()

  const first = assessSiteGenerationQualityV1(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })
  const second = assessSiteGenerationQualityV1(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.deepEqual(first, second)
})

test("un plan de servicio solido con CTA obtiene pass", async () => {
  const { assessSiteGenerationQualityV1, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT, QUALITY_GATE_CODES } =
    await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.equal(result.decision, "pass")
  assert.equal(result.decisionCode, QUALITY_GATE_CODES.GATE_PASS_THRESHOLD_MET)
  assert.equal(result.hardFailure, false)
  assert.ok(result.score >= result.thresholds.passScore)
})

test("un plan invalido por contrato es reject, no review", async () => {
  const { assessSiteGenerationQualityV1, invalidStructuralPlan, QUALITY_GATE_CODES, FINDING_CODES } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(invalidStructuralPlan())

  assert.equal(result.decision, "reject")
  assert.equal(result.decisionCode, QUALITY_GATE_CODES.GATE_REJECT_HARD_FAILURE)
  assert.equal(result.hardFailure, true)
  assert.ok(result.reasons.some((reason) => reason.code === FINDING_CODES.STRUCTURE_PLAN_INVALID && reason.category === "structuralSafety"))
})

test("home vacia (falla dura) es reject independientemente del score numerico", async () => {
  const { assessSiteGenerationQualityV1, emptyHomePlan, QUALITY_GATE_CODES } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(emptyHomePlan())

  assert.equal(result.decision, "reject")
  assert.equal(result.decisionCode, QUALITY_GATE_CODES.GATE_REJECT_HARD_FAILURE)
  assert.equal(result.hardFailure, true)
})

test("contenido duplicado/placeholder es estructuralmente valido: nunca reject, solo review o pass", async () => {
  const { assessSiteGenerationQualityV1, duplicatePlaceholderContentPlan } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(duplicatePlaceholderContentPlan())

  assert.equal(result.hardFailure, false)
  assert.notEqual(result.decision, "reject")
  assert.ok(result.decision === "review" || result.decision === "pass")
})

test("bajo el threshold sin falla dura el gate decide review, no reject", async () => {
  const { assessSiteGenerationQualityV1, duplicatePlaceholderContentPlan } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(duplicatePlaceholderContentPlan(), { thresholds: { passScore: 101 } })

  assert.equal(result.decision, "review")
  assert.equal(result.hardFailure, false)
  assert.ok(result.score < result.thresholds.passScore)
})

test("un threshold personalizado se respeta en la decision", async () => {
  const { assessSiteGenerationQualityV1, minimalValidPlan, QUALITY_GATE_CODES } = await loadQualityGateModule()

  const permissive = assessSiteGenerationQualityV1(minimalValidPlan(), { thresholds: { passScore: 0 } })
  assert.equal(permissive.decision, "pass")
  assert.equal(permissive.thresholds.passScore, 0)

  const strict = assessSiteGenerationQualityV1(minimalValidPlan(), { thresholds: { passScore: 101 } })
  assert.equal(strict.decision, "review")
  assert.equal(strict.decisionCode, QUALITY_GATE_CODES.GATE_REVIEW_BELOW_THRESHOLD)
})

test("sin threshold explicito usa EVALUATION_PASS_THRESHOLD por defecto", async () => {
  const { assessSiteGenerationQualityV1, minimalValidPlan, EVALUATION_PASS_THRESHOLD } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(minimalValidPlan())

  assert.equal(result.thresholds.passScore, EVALUATION_PASS_THRESHOLD)
})

test("las razones distinguen structuralSafety, objectiveQuality e informational", async () => {
  const { assessSiteGenerationQualityV1, brokenNavigationPlan, FINDING_CODES } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(brokenNavigationPlan())

  const brokenLinkReason = result.reasons.find((reason) => reason.code === FINDING_CODES.NAVIGATION_BROKEN_INTERNAL_LINK)
  assert.ok(brokenLinkReason)
  assert.equal(brokenLinkReason?.category, "objectiveQuality")

  assert.ok(result.reasons.every((reason) => reason.category !== "structuralSafety"))
})

test("las razones informational nunca cambian la decision", async () => {
  const { assessSiteGenerationQualityV1, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadQualityGateModule()

  const result = assessSiteGenerationQualityV1(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })
  const infoReasons = result.reasons.filter((reason) => reason.category === "informational")

  for (const reason of infoReasons) {
    assert.equal(reason.severity, "info")
  }
  assert.notEqual(result.decision, "reject")
})

test("el gate expone el evaluation subyacente sin duplicar su logica", async () => {
  const { assessSiteGenerationQualityV1, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadQualityGateModule()
  const { evaluateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/evaluation/evaluate")

  const plan = goodServiceBusinessPlan()
  const gateResult = assessSiteGenerationQualityV1(plan, { context: GOOD_SERVICE_BUSINESS_CONTEXT })
  const rawEvaluation = evaluateSiteCreationPlanV2(plan, { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.deepEqual(gateResult.evaluation, rawEvaluation)
  assert.equal(gateResult.score, rawEvaluation.score)
})

test("assessSiteGenerationQualityV1 no muta el plan de entrada", async () => {
  const { assessSiteGenerationQualityV1, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadQualityGateModule()

  const plan = goodServiceBusinessPlan()
  const original = deepFreezeClone(plan)

  assessSiteGenerationQualityV1(plan, { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.deepEqual(plan, original)
})

test("summarizeSiteGenerationQualityGateResults agrega el corpus de forma deterministica", async () => {
  const { assessSiteGenerationQualityV1, summarizeSiteGenerationQualityGateResults, SITE_GENERATION_EVALUATION_CORPUS_V1 } =
    await loadQualityGateModule()

  const results = SITE_GENERATION_EVALUATION_CORPUS_V1.map((entry) => assessSiteGenerationQualityV1(entry.buildPlan(), { context: entry.context }))

  const summaryA = summarizeSiteGenerationQualityGateResults(results)
  const summaryB = summarizeSiteGenerationQualityGateResults(results)

  assert.deepEqual(summaryA, summaryB)
  assert.equal(summaryA.total, SITE_GENERATION_EVALUATION_CORPUS_V1.length)
  assert.equal(summaryA.passCount + summaryA.reviewCount + summaryA.rejectCount, summaryA.total)
  assert.ok(summaryA.averageScore >= 0 && summaryA.averageScore <= 100)
})

test("summarizeSiteGenerationQualityGateResults con lista vacia no falla y da promedio 0", async () => {
  const { summarizeSiteGenerationQualityGateResults } = await loadQualityGateModule()

  const summary = summarizeSiteGenerationQualityGateResults([])

  assert.deepEqual(summary, { total: 0, passCount: 0, reviewCount: 0, rejectCount: 0, averageScore: 0 })
})

test("todo el corpus produce una decision consistente con hardFailure/score", async () => {
  const { assessSiteGenerationQualityV1, SITE_GENERATION_EVALUATION_CORPUS_V1 } = await loadQualityGateModule()

  for (const entry of SITE_GENERATION_EVALUATION_CORPUS_V1) {
    const result = assessSiteGenerationQualityV1(entry.buildPlan(), { context: entry.context })

    if (result.hardFailure) {
      assert.equal(result.decision, "reject", `${entry.name}: hardFailure debe implicar reject`)
    } else if (result.score >= result.thresholds.passScore) {
      assert.equal(result.decision, "pass", `${entry.name}: score >= threshold sin falla dura debe ser pass`)
    } else {
      assert.equal(result.decision, "review", `${entry.name}: score < threshold sin falla dura debe ser review`)
    }
  }
})
