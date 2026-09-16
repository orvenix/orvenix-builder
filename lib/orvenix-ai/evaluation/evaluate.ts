import {
  SITE_CREATION_PLAN_V2_DEFAULT_LIMITS,
  validateSiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES, HARD_FAILURE_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { evaluateCompleteness } from "@/lib/orvenix-ai/evaluation/dimensions/completeness"
import { evaluateContent } from "@/lib/orvenix-ai/evaluation/dimensions/content"
import { evaluateConversionReadiness } from "@/lib/orvenix-ai/evaluation/dimensions/conversion-readiness"
import { evaluateDesignConsistency } from "@/lib/orvenix-ai/evaluation/dimensions/design-consistency"
import { evaluateNavigation } from "@/lib/orvenix-ai/evaluation/dimensions/navigation"
import { evaluateStructure } from "@/lib/orvenix-ai/evaluation/dimensions/structure"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { buildDimensionResult, combineDimensionScores, countBySeverity, EVALUATION_PASS_THRESHOLD } from "@/lib/orvenix-ai/evaluation/scoring"
import type {
  EvaluateSiteCreationPlanV1Options,
  EvaluationDimensionsV1,
  EvaluationFindingV1,
  SiteGenerationEvaluationV1,
} from "@/lib/orvenix-ai/evaluation/types"
import { SITE_GENERATION_EVALUATION_V1_VERSION } from "@/lib/orvenix-ai/evaluation/types"

/** Caps how many raw validator errors surface as findings for a malformed plan. */
const MAX_VALIDATION_FINDINGS = 20

const INAPPLICABLE_DIMENSION = {
  applicable: false as const,
  score: 100,
  findingCount: { error: 0, warning: 0, info: 0 },
}

function buildInvalidPlanEvaluation(errors: string[]): SiteGenerationEvaluationV1 {
  const truncated = errors.slice(0, MAX_VALIDATION_FINDINGS)
  const findings: EvaluationFindingV1[] = truncated.map((error) =>
    createFinding({
      code: FINDING_CODES.STRUCTURE_PLAN_INVALID,
      severity: "error",
      dimension: "structure",
      message: error,
    }),
  )

  if (errors.length > truncated.length) {
    findings.push(
      createFinding({
        code: FINDING_CODES.STRUCTURE_PLAN_INVALID,
        severity: "info",
        dimension: "structure",
        message: `Se omitieron ${errors.length - truncated.length} error(es) adicionales de validacion.`,
      }),
    )
  }

  const dimensions: EvaluationDimensionsV1 = {
    // An invalid plan cannot be meaningfully scored beyond "it is invalid":
    // structure is forced to 0 and every other dimension abstains, which
    // is what drives the overall score to 0 via combineDimensionScores.
    structure: { applicable: true, score: 0, findingCount: countBySeverity(findings) },
    completeness: { ...INAPPLICABLE_DIMENSION },
    navigation: { ...INAPPLICABLE_DIMENSION },
    content: { ...INAPPLICABLE_DIMENSION },
    designConsistency: { ...INAPPLICABLE_DIMENSION },
    conversionReadiness: { ...INAPPLICABLE_DIMENSION },
  }

  return {
    version: SITE_GENERATION_EVALUATION_V1_VERSION,
    passed: false,
    score: 0,
    dimensions,
    findings,
    hardFailures: [FINDING_CODES.STRUCTURE_PLAN_INVALID],
  }
}

/**
 * Evaluates a SiteCreationPlanV2 artifact deterministically: same plan and
 * same context always produce the exact same result. No network, no LLM
 * judge, no provider calls, no DB writes. See ./README.md for the full
 * contract (dimensions, scoring, hard failures, limitations).
 */
export function evaluateSiteCreationPlanV2(
  plan: unknown,
  options: EvaluateSiteCreationPlanV1Options = {},
): SiteGenerationEvaluationV1 {
  const limits = options.limits ?? SITE_CREATION_PLAN_V2_DEFAULT_LIMITS
  const validation = validateSiteCreationPlanV2(plan, limits)

  if ("errors" in validation) {
    return buildInvalidPlanEvaluation(validation.errors)
  }

  const validPlan = validation.plan

  const structureFindings = evaluateStructure(validPlan)
  const completenessFindings = evaluateCompleteness(validPlan)
  const navigationFindings = evaluateNavigation(validPlan)
  const contentFindings = evaluateContent(validPlan)
  const designFindings = evaluateDesignConsistency(validPlan)
  const conversion = evaluateConversionReadiness(validPlan, options.context)

  const dimensions: EvaluationDimensionsV1 = {
    structure: buildDimensionResult(structureFindings),
    completeness: buildDimensionResult(completenessFindings),
    navigation: buildDimensionResult(navigationFindings),
    content: buildDimensionResult(contentFindings),
    designConsistency: buildDimensionResult(designFindings),
    conversionReadiness: buildDimensionResult(conversion.findings, conversion.applicable),
  }

  const findings: EvaluationFindingV1[] = [
    ...structureFindings,
    ...completenessFindings,
    ...navigationFindings,
    ...contentFindings,
    ...designFindings,
    ...conversion.findings,
  ]

  const hardFailures = [...new Set(findings.filter((finding) => HARD_FAILURE_CODES.has(finding.code)).map((finding) => finding.code))]
  const score = combineDimensionScores(dimensions)
  const passed = hardFailures.length === 0 && score >= EVALUATION_PASS_THRESHOLD

  return {
    version: SITE_GENERATION_EVALUATION_V1_VERSION,
    passed,
    score,
    dimensions,
    findings,
    hardFailures,
  }
}
