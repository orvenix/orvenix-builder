import type {
  EvaluateSiteCreationPlanV1Options,
  EvaluationDimensionKeyV1,
  EvaluationSeverityV1,
  SiteGenerationEvaluationV1,
} from "@/lib/orvenix-ai/evaluation/types"

export const SITE_GENERATION_QUALITY_GATE_V1_VERSION = 1

/**
 * pass    — structurally valid, no hard failure, score meets threshold.
 * review  — structurally valid, no hard failure, score below threshold
 *           (objective-quality findings only; never a safety condition).
 * reject  — invalid plan or a hard structural-safety failure. Never
 *           produced by score alone.
 */
export type QualityGateDecisionV1 = "pass" | "review" | "reject"

/**
 * structuralSafety — drives reject; mirrors the evaluation harness's own
 *   HARD_FAILURE_CODES.
 * objectiveQuality — error/warning findings that lower the score but do
 *   not make the plan unsafe to accept; drives review vs pass.
 * informational     — info-severity findings; never affects the decision.
 */
export type QualityGateReasonCategoryV1 = "structuralSafety" | "objectiveQuality" | "informational"

export interface QualityGateReasonV1 {
  code: string
  category: QualityGateReasonCategoryV1
  severity: EvaluationSeverityV1
  dimension: EvaluationDimensionKeyV1
  message: string
  pageSlug?: string
  nodeId?: string
}

export interface QualityGateThresholdsV1 {
  /** Minimum overall evaluation score (0..100) required for "pass" absent a hard failure. */
  passScore: number
}

export interface AssessSiteGenerationQualityV1Options {
  context?: EvaluateSiteCreationPlanV1Options["context"]
  limits?: EvaluateSiteCreationPlanV1Options["limits"]
  thresholds?: Partial<QualityGateThresholdsV1>
}

export interface SiteGenerationQualityGateResultV1 {
  version: typeof SITE_GENERATION_QUALITY_GATE_V1_VERSION
  decision: QualityGateDecisionV1
  decisionCode: string
  hardFailure: boolean
  score: number
  thresholds: QualityGateThresholdsV1
  reasons: QualityGateReasonV1[]
  evaluation: SiteGenerationEvaluationV1
}

export interface SiteGenerationQualityGateSummaryV1 {
  total: number
  passCount: number
  reviewCount: number
  rejectCount: number
  averageScore: number
}
