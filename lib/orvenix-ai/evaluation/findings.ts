import type { EvaluationDimensionKeyV1, EvaluationFindingV1, EvaluationSeverityV1 } from "@/lib/orvenix-ai/evaluation/types"

export interface CreateFindingParams {
  code: string
  severity: EvaluationSeverityV1
  dimension: EvaluationDimensionKeyV1
  message: string
  pageSlug?: string
  nodeId?: string
}

/**
 * Builds a finding with only safe, structural identifiers (slugs, node
 * ids, counts). Callers must never pass raw content strings (business
 * copy, names) into `message` to keep findings privacy-safe.
 */
export function createFinding(params: CreateFindingParams): EvaluationFindingV1 {
  const finding: EvaluationFindingV1 = {
    code: params.code,
    severity: params.severity,
    dimension: params.dimension,
    message: params.message,
  }

  if (params.pageSlug) finding.pageSlug = params.pageSlug
  if (params.nodeId) finding.nodeId = params.nodeId

  return finding
}
