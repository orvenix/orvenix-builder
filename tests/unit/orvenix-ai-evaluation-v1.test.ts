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

import type { SiteGenerationEvaluationV1 } from "../../lib/orvenix-ai/evaluation/types"

async function loadEvaluationModule() {
  const evaluateModule = await import("../../lib/orvenix-ai/evaluation/evaluate")
  const summaryModule = await import("../../lib/orvenix-ai/evaluation/summary")
  const codesModule = await import("../../lib/orvenix-ai/evaluation/codes")
  const fixturesModule = await import("../../lib/orvenix-ai/evaluation/fixtures")
  return { ...evaluateModule, ...summaryModule, ...codesModule, ...fixturesModule }
}

function deepFreezeClone<T>(value: T): T {
  return structuredClone(value)
}

test("evaluacion determinista: mismo plan produce el mismo resultado", async () => {
  const { evaluateSiteCreationPlanV2, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadEvaluationModule()

  const plan = goodServiceBusinessPlan()
  const first = evaluateSiteCreationPlanV2(plan, { context: GOOD_SERVICE_BUSINESS_CONTEXT })
  const second = evaluateSiteCreationPlanV2(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.deepEqual(first, second)
})

test("los limites de score siempre estan entre 0 y 100 para todo el corpus", async () => {
  const { evaluateSiteCreationPlanV2, SITE_GENERATION_EVALUATION_CORPUS_V1 } = await loadEvaluationModule()

  for (const entry of SITE_GENERATION_EVALUATION_CORPUS_V1) {
    const result = evaluateSiteCreationPlanV2(entry.buildPlan(), { context: entry.context })
    assert.ok(result.score >= 0 && result.score <= 100, `${entry.name}: score fuera de rango (${result.score})`)

    for (const [key, dimension] of Object.entries(result.dimensions)) {
      assert.ok(dimension.score >= 0 && dimension.score <= 100, `${entry.name}.${key}: score fuera de rango`)
    }
  }
})

test("un plan de servicio solido con CTA pasa y no reporta errores", async () => {
  const { evaluateSiteCreationPlanV2, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT } = await loadEvaluationModule()

  const result: SiteGenerationEvaluationV1 = evaluateSiteCreationPlanV2(goodServiceBusinessPlan(), {
    context: GOOD_SERVICE_BUSINESS_CONTEXT,
  })

  assert.equal(result.passed, true, JSON.stringify(result.findings))
  assert.equal(result.hardFailures.length, 0)
  assert.equal(result.findings.filter((finding) => finding.severity === "error").length, 0)
})

test("un plan minimo pero valido pasa sin fallas duras", async () => {
  const { evaluateSiteCreationPlanV2, minimalValidPlan } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(minimalValidPlan())

  assert.equal(result.hardFailures.length, 0)
  assert.equal(result.dimensions.structure.applicable, true)
})

test("un plan invalido por contrato falla duro con score 0", async () => {
  const { evaluateSiteCreationPlanV2, invalidStructuralPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(invalidStructuralPlan())

  assert.equal(result.passed, false)
  assert.equal(result.score, 0)
  assert.deepEqual(result.hardFailures, [FINDING_CODES.STRUCTURE_PLAN_INVALID])
  assert.ok(result.findings.every((finding) => finding.code === FINDING_CODES.STRUCTURE_PLAN_INVALID))
})

test("una pagina vacia (no home) se reporta en completeness como error", async () => {
  const { evaluateSiteCreationPlanV2, emptyPagePlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(emptyPagePlan())

  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.COMPLETENESS_PAGE_EMPTY && finding.pageSlug === "servicios"))
  assert.equal(result.hardFailures.length, 0, "una pagina vacia que no es home no debe ser falla dura")
})

test("home vacia es una falla dura independiente del score", async () => {
  const { evaluateSiteCreationPlanV2, emptyHomePlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(emptyHomePlan())

  assert.equal(result.passed, false)
  assert.ok(result.hardFailures.includes(FINDING_CODES.STRUCTURE_HOME_EMPTY))
})

test("navegacion rota: detecta enlace interno roto y pagina huerfana", async () => {
  const { evaluateSiteCreationPlanV2, brokenNavigationPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(brokenNavigationPlan())

  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.NAVIGATION_BROKEN_INTERNAL_LINK))
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.NAVIGATION_PAGE_ORPHANED && finding.pageSlug === "contacto"))
  assert.equal(result.dimensions.navigation.applicable, true)
})

test("dangling child ref y ciclos de nodos son detectados por structure", async () => {
  const { evaluateSiteCreationPlanV2, danglingChildRefPlan, cycleInTreePlan, FINDING_CODES } = await loadEvaluationModule()

  const danglingResult = evaluateSiteCreationPlanV2(danglingChildRefPlan())
  assert.ok(danglingResult.findings.some((finding) => finding.code === FINDING_CODES.STRUCTURE_DANGLING_CHILD_REF))

  const cycleResult = evaluateSiteCreationPlanV2(cycleInTreePlan())
  assert.ok(cycleResult.findings.some((finding) => finding.code === FINDING_CODES.STRUCTURE_NODE_CYCLE))
})

test("contenido con placeholder, lorem ipsum y duplicados se detecta mecanicamente", async () => {
  const { evaluateSiteCreationPlanV2, duplicatePlaceholderContentPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(duplicatePlaceholderContentPlan())

  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.CONTENT_LOREM_IPSUM))
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.CONTENT_PLACEHOLDER_MARKER))
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.CONTENT_DUPLICATE_TEXT))
})

test("inconsistencias de theme y props se detectan como advertencias/errores objetivos", async () => {
  const { evaluateSiteCreationPlanV2, designInconsistentPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(designInconsistentPlan())

  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.DESIGN_COLOR_COLLISION))
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.DESIGN_INVALID_PROP_VALUE))
})

test("objective de leads exige un CTA real: falla si no hay ninguno", async () => {
  const { evaluateSiteCreationPlanV2, minimalValidPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(minimalValidPlan(), { context: { objective: "Conseguir citas y contacto" } })

  assert.equal(result.dimensions.conversionReadiness.applicable, true)
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.CONVERSION_MISSING_CTA))
})

test("objective de leads no reporta CTA faltante cuando el plan ya tiene uno", async () => {
  const { evaluateSiteCreationPlanV2, goodServiceBusinessPlan, GOOD_SERVICE_BUSINESS_CONTEXT, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(goodServiceBusinessPlan(), { context: GOOD_SERVICE_BUSINESS_CONTEXT })

  assert.ok(!result.findings.some((finding) => finding.code === FINDING_CODES.CONVERSION_MISSING_CTA))
})

test("sitio informacional no es penalizado por no tener CTA/comercio", async () => {
  const { evaluateSiteCreationPlanV2, goodInformationalBusinessPlan, GOOD_INFORMATIONAL_BUSINESS_CONTEXT, FINDING_CODES } =
    await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(goodInformationalBusinessPlan(), { context: GOOD_INFORMATIONAL_BUSINESS_CONTEXT })

  assert.ok(!result.findings.some((finding) => finding.code === FINDING_CODES.CONVERSION_MISSING_CTA))
  assert.equal(result.passed, true, JSON.stringify(result.findings))
})

test("sin contexto, conversionReadiness se abstiene explicitamente", async () => {
  const { evaluateSiteCreationPlanV2, minimalValidPlan, FINDING_CODES } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(minimalValidPlan())

  assert.equal(result.dimensions.conversionReadiness.applicable, false)
  assert.ok(result.findings.some((finding) => finding.code === FINDING_CODES.CONVERSION_CONTEXT_MISSING))
})

test("semantica de fallas duras: passed=false independientemente del score numerico", async () => {
  const { evaluateSiteCreationPlanV2, emptyHomePlan } = await loadEvaluationModule()

  const result = evaluateSiteCreationPlanV2(emptyHomePlan())

  assert.equal(result.hardFailures.length > 0, true)
  assert.equal(result.passed, false)
})

test("los codigos de finding son estables entre corridas para el mismo plan", async () => {
  const { evaluateSiteCreationPlanV2, brokenNavigationPlan } = await loadEvaluationModule()

  const first = evaluateSiteCreationPlanV2(brokenNavigationPlan())
  const second = evaluateSiteCreationPlanV2(brokenNavigationPlan())

  assert.deepEqual(
    first.findings.map((finding) => finding.code).sort(),
    second.findings.map((finding) => finding.code).sort(),
  )
})

test("summarizeSiteGenerationEvaluations agrega el corpus de forma deterministica", async () => {
  const { evaluateSiteCreationPlanV2, summarizeSiteGenerationEvaluations, SITE_GENERATION_EVALUATION_CORPUS_V1 } =
    await loadEvaluationModule()

  const evaluations = SITE_GENERATION_EVALUATION_CORPUS_V1.map((entry) => evaluateSiteCreationPlanV2(entry.buildPlan(), { context: entry.context }))

  const summaryA = summarizeSiteGenerationEvaluations(evaluations)
  const summaryB = summarizeSiteGenerationEvaluations(evaluations)

  assert.deepEqual(summaryA, summaryB)
  assert.equal(summaryA.total, SITE_GENERATION_EVALUATION_CORPUS_V1.length)
  assert.equal(summaryA.passed + summaryA.failed, summaryA.total)
  assert.ok(summaryA.averageScore >= 0 && summaryA.averageScore <= 100)
})

test("evaluar no muta el plan de entrada", async () => {
  const { evaluateSiteCreationPlanV2, goodServiceBusinessPlan } = await loadEvaluationModule()

  const plan = goodServiceBusinessPlan()
  const original = deepFreezeClone(plan)

  evaluateSiteCreationPlanV2(plan, { context: { objective: "Conseguir citas" } })

  assert.deepEqual(plan, original)
})

test("evaluar un plan invalido tampoco muta la entrada arbitraria", async () => {
  const { evaluateSiteCreationPlanV2, invalidStructuralPlan } = await loadEvaluationModule()

  const plan = invalidStructuralPlan()
  const original = deepFreezeClone(plan)

  evaluateSiteCreationPlanV2(plan)

  assert.deepEqual(plan, original)
})

test("los findings no incluyen contenido de negocio, solo identificadores estructurales", async () => {
  const { evaluateSiteCreationPlanV2, duplicatePlaceholderContentPlan } = await loadEvaluationModule()

  const plan = duplicatePlaceholderContentPlan() as { identity: { name: string } }
  const result = evaluateSiteCreationPlanV2(plan)

  const serializedFindings = JSON.stringify(result.findings)
  assert.ok(!serializedFindings.includes(plan.identity.name))
  assert.ok(!serializedFindings.includes("Somos la mejor opcion"))

  for (const finding of result.findings) {
    assert.ok(typeof finding.code === "string" && finding.code.length > 0)
    assert.ok(["error", "warning", "info"].includes(finding.severity))
    assert.ok(typeof finding.dimension === "string" && finding.dimension.length > 0)
    assert.ok(typeof finding.message === "string" && finding.message.length > 0)
  }
})
