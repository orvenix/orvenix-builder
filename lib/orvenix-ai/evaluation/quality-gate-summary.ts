import type {
  SiteGenerationQualityGateResultV1,
  SiteGenerationQualityGateSummaryV1,
} from "@/lib/orvenix-ai/evaluation/quality-gate-types"

/**
 * Aggregates a batch of SiteGenerationQualityGateV1 decisions (e.g. a
 * regression corpus) into a single deterministic summary. Read-only:
 * never mutates the input results, no persistence.
 */
export function summarizeSiteGenerationQualityGateResults(
  results: readonly SiteGenerationQualityGateResultV1[],
): SiteGenerationQualityGateSummaryV1 {
  const total = results.length
  const passCount = results.filter((result) => result.decision === "pass").length
  const reviewCount = results.filter((result) => result.decision === "review").length
  const rejectCount = results.filter((result) => result.decision === "reject").length
  const averageScore = total === 0 ? 0 : Math.round(results.reduce((sum, result) => sum + result.score, 0) / total)

  return { total, passCount, reviewCount, rejectCount, averageScore }
}
