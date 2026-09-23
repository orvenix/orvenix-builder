import type { DesignReference } from "./contract"

/**
 * V2-5A.2 sanitization boundary.
 *
 * By construction, DesignReference has no free-text field that could
 * carry copied marketing prose, names, ratings, prices, or URLs -- every
 * field is a bounded-vocabulary token, a small enum array, or a count.
 * This module is the defense-in-depth VERIFICATION of that invariant:
 * it serializes a record and scans for leaked content shapes. It is
 * used both by tests and defensively inside extract.ts, so a future
 * accidental addition of a free-text field to the contract fails loudly
 * instead of silently leaking demo content.
 */

const URL_PATTERN = /https?:\/\/|www\./i
const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
const PHONE_PATTERN = /\+?\d[\d\s.-]{6,}\d/
const PRICE_PATTERN = /\$\s?\d|\bmxn\b|\busd\b/i
const YEARS_EXPERIENCE_PATTERN = /\d+\s*(años|anos|years)/i
const RATING_PATTERN = /\b\d(\.\d)?\s*(estrellas|stars)\b|\b\d(\.\d)?\/5\b/i

export interface SanitizationViolation {
  pattern: string
  match: string
}

/**
 * Scans the JSON-serialized form of a record for leaked-content shapes.
 * Returns an empty array when clean.
 */
export function findSanitizationViolations(reference: DesignReference): SanitizationViolation[] {
  const serialized = JSON.stringify(reference)
  const violations: SanitizationViolation[] = []

  const checks: Array<[string, RegExp]> = [
    ["url", URL_PATTERN],
    ["email", EMAIL_PATTERN],
    ["phone", PHONE_PATTERN],
    ["price", PRICE_PATTERN],
    ["years-experience-claim", YEARS_EXPERIENCE_PATTERN],
    ["rating-claim", RATING_PATTERN],
  ]

  for (const [label, pattern] of checks) {
    const match = serialized.match(pattern)
    if (match) violations.push({ pattern: label, match: match[0] })
  }

  return violations
}

export function assertSanitizedDesignReference(reference: DesignReference): void {
  const violations = findSanitizationViolations(reference)
  if (violations.length > 0) {
    throw new Error(
      `DesignReference ${reference.id} failed sanitization: ${violations.map((v) => v.pattern).join(", ")}`,
    )
  }
}
