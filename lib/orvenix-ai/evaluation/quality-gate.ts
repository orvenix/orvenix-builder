import { HARD_FAILURE_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { evaluateSiteCreationPlanV2 } from "@/lib/orvenix-ai/evaluation/evaluate"
import { QUALITY_GATE_CODES } from "@/lib/orvenix-ai/evaluation/quality-gate-codes"
import { EVALUATION_PASS_THRESHOLD } from "@/lib/orvenix-ai/evaluation/scoring"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"
import {
  SITE_GENERATION_QUALITY_GATE_V1_VERSION,
  type AssessSiteGenerationQualityV1Options,
  type QualityGateReasonCategoryV1,
  type QualityGateReasonV1,
  type SiteGenerationQualityGateResultV1,
} from "@/lib/orvenix-ai/evaluation/quality-gate-types"

function categorizeFinding(finding: EvaluationFindingV1): QualityGateReasonCategoryV1 {
  if (HARD_FAILURE_CODES.has(finding.code)) return "structuralSafety"
  if (finding.severity === "info") return "informational"
  return "objectiveQuality"
}

function buildReason(finding: EvaluationFindingV1): QualityGateReasonV1 {
  const reason: QualityGateReasonV1 = {
    code: finding.code,
    category: categorizeFinding(finding),
    severity: finding.severity,
    dimension: finding.dimension,
    message: finding.message,
  }

  if (finding.pageSlug) reason.pageSlug = finding.pageSlug
  if (finding.nodeId) reason.nodeId = finding.nodeId

  return reason
}

/**
 * Orvenix Generation Quality Gate V1. Wraps `evaluateSiteCreationPlanV2`
 * with an explicit pass/review/reject decision. Pure and deterministic:
 * same plan + same context + same limits + same thresholds always produce
 * the exact same decision and reasons. No network, no DB, no provider
 * calls, no mutation of the input plan, no AI/aesthetic judgment — only
 * the harness's own mechanical findings. See ./README.md.
 *
 * - reject: the plan is invalid, or the evaluation reports a hard
 *   structural-safety failure (`evaluation.hardFailures.length > 0`).
 *   Never triggered by score alone.
 * - review: structurally valid, no hard failure, but the overall score is
 *   below `thresholds.passScore`.
 * - pass: structurally valid, no hard failure, score meets the threshold.
 */
export function assessSiteGenerationQualityV1(
  plan: unknown,
  options: AssessSiteGenerationQualityV1Options = {},
): SiteGenerationQualityGateResultV1 {
  const evaluation = evaluateSiteCreationPlanV2(plan, { context: options.context, limits: options.limits })
  const passScore = options.thresholds?.passScore ?? EVALUATION_PASS_THRESHOLD
  const hardFailure = evaluation.hardFailures.length > 0

  const decision = hardFailure ? "reject" : evaluation.score >= passScore ? "pass" : "review"
  const decisionCode = hardFailure
    ? QUALITY_GATE_CODES.GATE_REJECT_HARD_FAILURE
    : evaluation.score >= passScore
      ? QUALITY_GATE_CODES.GATE_PASS_THRESHOLD_MET
      : QUALITY_GATE_CODES.GATE_REVIEW_BELOW_THRESHOLD

  return {
    version: SITE_GENERATION_QUALITY_GATE_V1_VERSION,
    decision,
    decisionCode,
    hardFailure,
    score: evaluation.score,
    thresholds: { passScore },
    reasons: evaluation.findings.map(buildReason),
    evaluation,
  }
}
