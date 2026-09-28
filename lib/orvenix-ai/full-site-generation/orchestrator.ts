import { createHash } from "crypto"
import type {
  FullSiteCreativeBlueprintProviderV1,
  FullSiteCreativeBlueprintV1,
  FullSiteCreativeFailureReasonV1,
  FullSiteCreativeLifecycleMetaV1,
  FullSiteCreativeLifecycleV1,
} from "./contract"
import { validateFullSiteCreativeBlueprintV1, type FullSiteCreativeGroundingContextV1 } from "./validator"

export type FullSiteCreativeGenerationResultV1 =
  | { ok: true; blueprint: FullSiteCreativeBlueprintV1; lifecycle: FullSiteCreativeLifecycleV1 }
  | { ok: false; lifecycle: FullSiteCreativeLifecycleV1 }

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("full_site_provider_timeout")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

const TIMEOUT_GRACE_MS = 5_000
const DEFAULT_ORCHESTRATOR_TIMEOUT_MS = 2_000

/** Grounding wide enough to accept any well-formed ref: separates SCHEMA failures from GROUNDING failures. */
const PERMISSIVE_GROUNDING: FullSiteCreativeGroundingContextV1 = { productCount: Number.MAX_SAFE_INTEGER, serviceCount: Number.MAX_SAFE_INTEGER, evidenceCount: Number.MAX_SAFE_INTEGER }

/** Every category key the candidate references (bounded walk), so the permissive pass never fails on grounding. */
function referencedCategoryKeys(value: unknown, keys = new Set<string>(), depth = 0): Set<string> {
  if (depth > 8 || keys.size > 200 || !value || typeof value !== "object") return keys
  if (Array.isArray(value)) {
    for (const entry of value.slice(0, 64)) referencedCategoryKeys(entry, keys, depth + 1)
    return keys
  }
  const record = value as Record<string, unknown>
  if (record.kind === "category" && typeof record.key === "string") keys.add(record.key.trim().replace(/\s+/g, " ").slice(0, 80))
  for (const entry of Object.values(record)) referencedCategoryKeys(entry, keys, depth + 1)
  return keys
}

function failureCode(error: unknown): FullSiteCreativeFailureReasonV1 {
  if (error instanceof Error && error.message === "full_site_provider_timeout") return "timeout"
  const code = (error as { code?: unknown } | null)?.code
  if (code === "missing_configuration" || code === "timeout" || code === "provider_error" || code === "empty_response" || code === "parse_error") return code
  return "provider_error"
}

/**
 * The ONE entry point for any Full-Site Creative provider (mock or real).
 * Exactly one provider.generate() call; the result is ALWAYS passed through
 * validateFullSiteCreativeBlueprintV1 (schema, then grounding). Never
 * throws: every failure resolves to a lifecycle with a normalized reason
 * code, and callers fall back deterministically.
 */
export async function generateFullSiteCreativeBlueprintV1(params: {
  provider?: FullSiteCreativeBlueprintProviderV1
  requestContext: unknown
  grounding: FullSiteCreativeGroundingContextV1
  timeoutMs?: number
}): Promise<FullSiteCreativeGenerationResultV1> {
  if (!params.provider) return { ok: false, lifecycle: { status: "disabled", reasonCode: "disabled" } }
  const meta: FullSiteCreativeLifecycleMetaV1 = {
    ...(params.provider.providerKey ? { providerKey: params.provider.providerKey } : {}),
    ...(params.provider.modelKey ? { modelKey: params.provider.modelKey } : {}),
  }
  const inputFingerprint = fingerprint(params.requestContext)
  const startedAt = Date.now()
  const timeoutMs = params.timeoutMs ?? (params.provider.timeoutMs ? params.provider.timeoutMs + TIMEOUT_GRACE_MS : DEFAULT_ORCHESTRATOR_TIMEOUT_MS)
  try {
    const output = await timeout(params.provider.generate(params.requestContext), timeoutMs)
    const durationMs = Date.now() - startedAt
    if (output === null || output === undefined) {
      return { ok: false, lifecycle: { status: "failed", inputFingerprint, reasons: ["empty_response"], reasonCode: "empty_response", ...meta, durationMs } }
    }
    const schema = validateFullSiteCreativeBlueprintV1(output, { ...PERMISSIVE_GROUNDING, categoryKeys: [...referencedCategoryKeys(output)], maxPages: params.grounding.maxPages })
    const validation = validateFullSiteCreativeBlueprintV1(output, params.grounding)
    if (validation.ok === false) {
      const reasonCode = schema.ok === false ? "schema_invalid" : "grounding_invalid"
      return {
        ok: false,
        lifecycle: { status: "rejected", inputFingerprint, reasons: validation.errors, warnings: validation.warnings, reasonCode, ...meta, durationMs },
      }
    }
    return {
      ok: true,
      blueprint: validation.blueprint,
      lifecycle: { status: "applied", inputFingerprint, outputFingerprint: validation.fingerprint, warnings: validation.warnings, ...meta, durationMs },
    }
  } catch (error) {
    const reasonCode = failureCode(error)
    return {
      ok: false,
      lifecycle: { status: "failed", inputFingerprint, reasons: [reasonCode], reasonCode, ...meta, durationMs: Date.now() - startedAt },
    }
  }
}
