/**
 * Stable decision codes for SiteGenerationQualityGateV1. Codes are
 * contract: do not rename or remove existing codes; add new ones instead.
 * These are gate-level codes (why the overall decision was reached), kept
 * separate from the per-finding `FINDING_CODES` in ./codes.ts.
 */
export const QUALITY_GATE_CODES = {
  GATE_REJECT_HARD_FAILURE: "GATE_REJECT_HARD_FAILURE",
  GATE_REVIEW_BELOW_THRESHOLD: "GATE_REVIEW_BELOW_THRESHOLD",
  GATE_PASS_THRESHOLD_MET: "GATE_PASS_THRESHOLD_MET",
} as const

export type QualityGateCodeV1 = (typeof QUALITY_GATE_CODES)[keyof typeof QUALITY_GATE_CODES]
