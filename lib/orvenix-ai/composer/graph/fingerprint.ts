import { createHash } from "crypto"

/**
 * CF-2: stable canonical representation of a CreativeCompositionGraphV1
 * value (object keys sorted, `undefined` dropped, arrays kept in order --
 * order is meaningful: it is reading order). Future Design Reference /
 * Design Memory work can record and compare relational motifs by this
 * representation or its fingerprint. Nothing is wired to them yet.
 */
export function canonicalGraphJsonV1(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key]
      if (entry !== undefined) out[key] = canonicalize(entry)
    }
    return out
  }
  return value
}

export function graphFingerprintV1(value: unknown): string {
  return createHash("sha256").update(canonicalGraphJsonV1(value)).digest("hex")
}
