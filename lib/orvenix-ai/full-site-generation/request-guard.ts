/**
 * FULL-SITE-5C: the canonical "no internal values reach the provider"
 * guard for a Full-Site request context -- replaces ad-hoc runner regexes.
 *
 * Deliberately INDEPENDENT of request-context.ts's REDACTIONS (a guard that
 * reused the sanitizer's own patterns could only ever agree with it).
 * Every value rule is token-anchored: an unanchored alternation such as
 * `(site_|prod_|...)` also matches ordinary identifiers that merely contain
 * those letters -- eg. the public output-contract keys
 * "full_site_creative_blueprint_v1" / "bounded_full_site_generation_v1",
 * which the provider must echo back -- and reports a false positive.
 *
 * Findings carry rule + JSON path + count only, never the matched value, so
 * the result is safe to log.
 *
 * The ONLY exemption is Orvenix's own closed vocabulary: an exact value at
 * the exact path where the canonical capability manifest / output contract
 * puts it (eg. "order_history" at $.capabilities.notAvailable[]). Derived
 * from those canonical sources, never a hand-copied list; the same string
 * anywhere else (business/product/category text) is still a finding.
 */

import { buildFullSiteCommerceCapabilityManifestV1 } from "./capability-manifest"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
} from "./contract"

export type FullSiteRequestGuardRuleV1 =
  | "internal_id"
  | "database_id"
  | "uuid"
  | "hash"
  | "filesystem_path"
  | "internal_route"
  | "url"
  | "email"
  | "credential"
  | "secret_env_name"
  | "internal_key"

export interface FullSiteRequestGuardFindingV1 {
  rule: FullSiteRequestGuardRuleV1
  path: string
  count: number
}

const VALUE_RULES: ReadonlyArray<{ rule: FullSiteRequestGuardRuleV1; pattern: RegExp }> = [
  { rule: "internal_id", pattern: /(?<![A-Za-z0-9_])(?:site|scp|prod|var|cm2a|user|usr|preview|order|pay|mp)_[A-Za-z0-9]{4,}[A-Za-z0-9_]*/gi },
  { rule: "internal_id", pattern: /(?<![A-Za-z0-9_-])nm-mock-[A-Za-z0-9-]+/gi },
  { rule: "database_id", pattern: /(?<![A-Za-z0-9])c[a-z0-9]{20,}(?![A-Za-z0-9])/g },
  { rule: "uuid", pattern: /(?<![A-Fa-f0-9])[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}(?![A-Fa-f0-9])/g },
  { rule: "hash", pattern: /(?<![A-Fa-f0-9])[A-Fa-f0-9]{32,}(?![A-Fa-f0-9])/g },
  { rule: "filesystem_path", pattern: /(?:^|[^A-Za-z0-9._-])\/(?:home|var|etc|usr|tmp|opt|srv|root|proc)\/[^\s"]*/g },
  { rule: "filesystem_path", pattern: /(?<![A-Za-z])[A-Za-z]:\\[^\s"]*/g },
  { rule: "filesystem_path", pattern: /(?:^|[^A-Za-z0-9._-])\.\.?\/[^\s"]+/g },
  { rule: "internal_route", pattern: /(?:^|[^A-Za-z0-9._-])\/(?:api|app|lib|prisma|p|preview|editor|dashboard|constructor|dev-[a-z0-9-]+)(?:\/|\?|$)[^\s"]*/g },
  { rule: "url", pattern: /\b(?:https?|ftp|file|javascript|data|mailto|tel):/gi },
  { rule: "url", pattern: /\bwww\.[A-Za-z0-9-]+\./gi },
  { rule: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g },
  { rule: "credential", pattern: /\bsk-ant-[A-Za-z0-9_-]+|\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}|\bxox[abprs]-[A-Za-z0-9-]+|\bBearer\s+[A-Za-z0-9._~+/-]{10,}|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  // Case-sensitive: env-var NAMES only, never ordinary (Spanish/English) words.
  { rule: "secret_env_name", pattern: /\b(?:DATABASE_URL|[A-Z][A-Z0-9_]*(?:_API_KEY|_SECRET|_PASSWORD|_TOKEN)|API_KEY|SECRET_KEY|NEXTAUTH_SECRET)\b/g },
]

/** Keys that exist only on internal records; a request built by allowlist never carries them. */
const INTERNAL_KEYS = new Set([
  "id",
  "siteId",
  "userId",
  "productId",
  "variantId",
  "storeBinding",
  "pendingProvisioning",
  "provisioningRef",
  "sku",
  "stock",
  "initialStock",
  "rootId",
  "nodes",
  "tree",
  "apiKey",
  "password",
  "token",
  "secret",
])

function collectStringsByPath(value: unknown, path: string, out: Map<string, Set<string>>): Map<string, Set<string>> {
  if (typeof value === "string") {
    const values = out.get(path) ?? new Set<string>()
    values.add(value)
    out.set(path, values)
  } else if (Array.isArray(value)) {
    value.forEach((entry) => collectStringsByPath(entry, `${path}[]`, out))
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) collectStringsByPath(entry, `${path}.${key}`, out)
  }
  return out
}

let trustedVocabulary: Map<string, Set<string>> | undefined

/** path -> exact values Orvenix itself puts there (capability manifest + output contract). */
function trustedVocabularyByPath(): Map<string, Set<string>> {
  if (!trustedVocabulary) {
    trustedVocabulary = collectStringsByPath(buildFullSiteCommerceCapabilityManifestV1(), "$.capabilities", new Map())
    collectStringsByPath(
      { roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 },
      "$.outputContract",
      trustedVocabulary,
    )
  }
  return trustedVocabulary
}

function countMatches(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0
  return text.match(pattern)?.length ?? 0
}

export function findProhibitedFullSiteRequestValuesV1(context: unknown): FullSiteRequestGuardFindingV1[] {
  const byKey = new Map<string, FullSiteRequestGuardFindingV1>()
  const record = (rule: FullSiteRequestGuardRuleV1, path: string, count: number) => {
    const key = `${rule} ${path}`
    const existing = byKey.get(key)
    if (existing) existing.count += count
    else byKey.set(key, { rule, path, count })
  }

  const visit = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (trustedVocabularyByPath().get(path)?.has(value)) return
      for (const { rule, pattern } of VALUE_RULES) {
        const count = countMatches(value, pattern)
        if (count) record(rule, path, count)
      }
      return
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => visit(entry, `${path}[]`))
      return
    }
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        if (INTERNAL_KEYS.has(key)) record("internal_key", `${path}.${key}`, 1)
        visit(entry, `${path}.${key}`)
      }
    }
  }

  visit(context, "$")
  return [...byKey.values()]
}

export function isFullSiteRequestFreeOfInternalValuesV1(context: unknown): boolean {
  return findProhibitedFullSiteRequestValuesV1(context).length === 0
}
