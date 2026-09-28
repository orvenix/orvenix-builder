import { createHash } from "crypto"
import type { FullSiteCreativeBlueprintProviderV1, FullSiteCreativeBlueprintV1, FullSiteCreativeLifecycleV1 } from "./contract"
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

export async function generateFullSiteCreativeBlueprintV1(params: {
  provider?: FullSiteCreativeBlueprintProviderV1
  requestContext: unknown
  grounding: FullSiteCreativeGroundingContextV1
  timeoutMs?: number
}): Promise<FullSiteCreativeGenerationResultV1> {
  if (!params.provider) return { ok: false, lifecycle: { status: "disabled" } }
  const inputFingerprint = fingerprint(params.requestContext)
  try {
    const output = await timeout(params.provider.generate(params.requestContext), params.timeoutMs ?? 2_000)
    const validation = validateFullSiteCreativeBlueprintV1(output, params.grounding)
    if (validation.ok === false) {
      return {
        ok: false,
        lifecycle: { status: "rejected", inputFingerprint, reasons: validation.errors, warnings: validation.warnings },
      }
    }
    return {
      ok: true,
      blueprint: validation.blueprint,
      lifecycle: {
        status: "applied",
        inputFingerprint,
        outputFingerprint: validation.fingerprint,
        warnings: validation.warnings,
      },
    }
  } catch (error) {
    return {
      ok: false,
      lifecycle: {
        status: "failed",
        inputFingerprint,
        reasons: [error instanceof Error ? error.message : "full_site_provider_failed"],
      },
    }
  }
}
