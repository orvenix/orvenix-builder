import type {
  EvaluationDimensionKeyV1,
  EvaluationSeverityV1,
  SiteGenerationEvaluationSummaryV1,
  SiteGenerationEvaluationV1,
} from "@/lib/orvenix-ai/evaluation/types"

const DIMENSION_KEYS: EvaluationDimensionKeyV1[] = [
  "structure",
  "completeness",
  "navigation",
  "content",
  "designConsistency",
  "conversionReadiness",
]

const SEVERITY_KEYS: EvaluationSeverityV1[] = ["error", "warning", "info"]

/**
 * Aggregates a batch of SiteGenerationEvaluationV1 results (e.g. a
 * regression corpus, or two Builder versions run over the same corpus)
 * into a single deterministic summary. Read-only: never mutates the
 * input evaluations.
 */
export function summarizeSiteGenerationEvaluations(
  evaluations: readonly SiteGenerationEvaluationV1[],
): SiteGenerationEvaluationSummaryV1 {
  const total = evaluations.length
  const passed = evaluations.filter((evaluation) => evaluation.passed).length
  const failed = total - passed

  const averageScore = total === 0 ? 0 : Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / total)

  const dimensionAverageScores = {} as Record<EvaluationDimensionKeyV1, number>
  const dimensionApplicableCount = {} as Record<EvaluationDimensionKeyV1, number>

  for (const key of DIMENSION_KEYS) {
    const applicableScores = evaluations
      .map((evaluation) => evaluation.dimensions[key])
      .filter((dimension) => dimension.applicable)
      .map((dimension) => dimension.score)

    dimensionApplicableCount[key] = applicableScores.length
    dimensionAverageScores[key] =
      applicableScores.length === 0
        ? 0
        : Math.round(applicableScores.reduce((sum, score) => sum + score, 0) / applicableScores.length)
  }

  const findingCountsBySeverity = { error: 0, warning: 0, info: 0 } as Record<EvaluationSeverityV1, number>
  const findingCountsByCode: Record<string, number> = {}

  for (const evaluation of evaluations) {
    for (const finding of evaluation.findings) {
      findingCountsBySeverity[finding.severity] += 1
      findingCountsByCode[finding.code] = (findingCountsByCode[finding.code] ?? 0) + 1
    }
  }

  // Ensure severity keys are always present even when zero, for a stable shape.
  for (const key of SEVERITY_KEYS) {
    if (!(key in findingCountsBySeverity)) findingCountsBySeverity[key] = 0
  }

  return {
    total,
    passed,
    failed,
    averageScore,
    dimensionAverageScores,
    dimensionApplicableCount,
    findingCountsBySeverity,
    findingCountsByCode,
  }
}
