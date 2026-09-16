export const SITE_GENERATION_EVALUATION_V1_VERSION = 1

export type EvaluationSeverityV1 = "error" | "warning" | "info"

export type EvaluationDimensionKeyV1 =
  | "structure"
  | "completeness"
  | "navigation"
  | "content"
  | "designConsistency"
  | "conversionReadiness"

/**
 * Optional business context. SiteCreationPlanV2 does not carry `objective`/
 * `siteType` itself, so callers (e.g. the autonomous builder) may pass it
 * separately. When omitted, context-dependent rules abstain instead of
 * guessing.
 */
export interface EvaluationContextV1 {
  objective?: string
  siteType?: string
}

export interface EvaluationFindingV1 {
  code: string
  severity: EvaluationSeverityV1
  dimension: EvaluationDimensionKeyV1
  message: string
  pageSlug?: string
  nodeId?: string
}

export interface EvaluationDimensionResultV1 {
  applicable: boolean
  score: number
  findingCount: Record<EvaluationSeverityV1, number>
}

export type EvaluationDimensionsV1 = Record<EvaluationDimensionKeyV1, EvaluationDimensionResultV1>

export interface SiteGenerationEvaluationV1 {
  version: typeof SITE_GENERATION_EVALUATION_V1_VERSION
  passed: boolean
  score: number
  dimensions: EvaluationDimensionsV1
  findings: EvaluationFindingV1[]
  hardFailures: string[]
}

export interface EvaluateSiteCreationPlanV1Options {
  context?: EvaluationContextV1
  limits?: {
    maxPages: number
    maxBytes: number
  }
}

export interface SiteGenerationEvaluationSummaryV1 {
  total: number
  passed: number
  failed: number
  averageScore: number
  dimensionAverageScores: Record<EvaluationDimensionKeyV1, number>
  dimensionApplicableCount: Record<EvaluationDimensionKeyV1, number>
  findingCountsBySeverity: Record<EvaluationSeverityV1, number>
  findingCountsByCode: Record<string, number>
}
