import type {
  EvaluationDimensionKeyV1,
  EvaluationDimensionResultV1,
  EvaluationDimensionsV1,
  EvaluationFindingV1,
  EvaluationSeverityV1,
} from "@/lib/orvenix-ai/evaluation/types"

/** Score points deducted per finding severity. `info` never affects score. */
export const SEVERITY_PENALTY: Record<EvaluationSeverityV1, number> = {
  error: 25,
  warning: 8,
  info: 0,
}

/**
 * Relative importance of each dimension in the overall weighted score.
 * Weights sum to 100. When a dimension abstains (`applicable: false`,
 * e.g. conversionReadiness with no context), its weight is excluded and
 * the remaining weights are renormalized so the overall score always
 * stays within 0..100.
 */
export const DIMENSION_WEIGHTS: Record<EvaluationDimensionKeyV1, number> = {
  structure: 30,
  completeness: 20,
  navigation: 15,
  content: 15,
  designConsistency: 10,
  conversionReadiness: 10,
}

/** Minimum overall score required to pass, absent any hard failure. */
export const EVALUATION_PASS_THRESHOLD = 60

export function scoreFromFindings(findings: EvaluationFindingV1[], base = 100): number {
  const penalty = findings.reduce((sum, finding) => sum + SEVERITY_PENALTY[finding.severity], 0)
  return Math.max(0, Math.min(base, base - penalty))
}

export function countBySeverity(findings: EvaluationFindingV1[]): Record<EvaluationSeverityV1, number> {
  return {
    error: findings.filter((finding) => finding.severity === "error").length,
    warning: findings.filter((finding) => finding.severity === "warning").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  }
}

export function buildDimensionResult(findings: EvaluationFindingV1[], applicable = true): EvaluationDimensionResultV1 {
  return {
    applicable,
    score: applicable ? scoreFromFindings(findings) : 100,
    findingCount: countBySeverity(findings),
  }
}

/** Weighted average of applicable dimension scores, rounded to an integer in 0..100. */
export function combineDimensionScores(dimensions: EvaluationDimensionsV1): number {
  let weightedSum = 0
  let weightTotal = 0

  for (const key of Object.keys(DIMENSION_WEIGHTS) as EvaluationDimensionKeyV1[]) {
    const dimension = dimensions[key]
    if (!dimension.applicable) continue

    const weight = DIMENSION_WEIGHTS[key]
    weightedSum += weight * dimension.score
    weightTotal += weight
  }

  if (weightTotal === 0) return 0

  return Math.max(0, Math.min(100, Math.round(weightedSum / weightTotal)))
}
