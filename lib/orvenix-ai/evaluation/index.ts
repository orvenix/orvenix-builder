/**
 * Public surface of the Orvenix AI Generation Evaluation Harness V1.
 * See ./README.md for the full contract. Kept intentionally small:
 * fixtures/corpus live in ./fixtures.ts and are imported directly by
 * tests, not re-exported here.
 */
export { evaluateSiteCreationPlanV2 } from "@/lib/orvenix-ai/evaluation/evaluate"
export { summarizeSiteGenerationEvaluations } from "@/lib/orvenix-ai/evaluation/summary"
export { FINDING_CODES, HARD_FAILURE_CODES, type FindingCodeV1 } from "@/lib/orvenix-ai/evaluation/codes"
export { DIMENSION_WEIGHTS, EVALUATION_PASS_THRESHOLD } from "@/lib/orvenix-ai/evaluation/scoring"
export { classifyConversionObjective, type ConversionObjectiveBucket } from "@/lib/orvenix-ai/evaluation/dimensions/conversion-readiness"

export type {
  EvaluateSiteCreationPlanV1Options,
  EvaluationContextV1,
  EvaluationDimensionKeyV1,
  EvaluationDimensionResultV1,
  EvaluationDimensionsV1,
  EvaluationFindingV1,
  EvaluationSeverityV1,
  SiteGenerationEvaluationSummaryV1,
  SiteGenerationEvaluationV1,
} from "@/lib/orvenix-ai/evaluation/types"
