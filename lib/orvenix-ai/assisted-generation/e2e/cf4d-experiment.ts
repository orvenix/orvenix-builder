import { createHash } from "crypto"
import { runAutonomousMultiPageSiteBuilder } from "@/lib/orvenix-ai/autonomous/site-builder"
import { createAnthropicFullSiteCreativeProviderV1, buildFullSiteCreativeSystemPromptV1, type AnthropicFullSiteCreativeProviderConfigV1, type FullSiteProviderResponseTelemetryV1 } from "@/lib/orvenix-ai/full-site-generation/anthropic-provider"
import type { FullSiteCreativeBlueprintProviderV1 } from "@/lib/orvenix-ai/full-site-generation/contract"
import type { FullSiteCreativeRequestContextV1 } from "@/lib/orvenix-ai/full-site-generation/request-context"
import { analyzeFullSiteCreativeResultV1, type FullSiteCreativeEvidenceV1 } from "@/lib/orvenix-ai/full-site-generation/creative-evidence"
import type { CompositionMemoryV1 } from "@/lib/orvenix-ai/design-memory/composition-memory"
import { buildNovaMarketNewStorePreviewInputV1, isAssistedE2EHarnessEnabledV1, type AssistedE2EHarnessEnvV1 } from "./comparison-harness"

/**
 * CF-4D: the ONE controlled real-call experiment (call #4), PREPARED but
 * never executed by code in this repository: nothing calls it at import
 * time, no route exposes it, and it refuses unless BOTH the dev E2E guard
 * (NODE_ENV !== production && ORVENIX_DEV_ASSISTED_E2E=1) is set AND the
 * caller passes the exact authorization string. A future authorized
 * one-shot runner (outside the repo, with a spent-sentinel like CF-3B)
 * supplies the env and authorization.
 *
 * Fixed configuration: claude-sonnet-5, thinking disabled, maxRetries 0
 * (enforced by the provider), bounded timeout, max_tokens default, the
 * authoritative NovaMarket fixture, no DB writes (the in-process builder
 * never persists). Evidence is content-free telemetry + the structural
 * analysis; never API keys, headers, environment or reasoning content.
 */

export const CF4D_EXPERIMENT_AUTHORIZATION_V1 = "CF4D_CALL4_AUTHORIZED=yes" as const

export const CF4D_EXPERIMENT_CONFIG_V1 = {
  model: "claude-sonnet-5",
  thinkingMode: "disabled",
  timeoutMs: 240_000,
  maxTokens: 14_000,
  maxRetries: 0,
} as const

export type Cf4dExperimentRefusalV1 = "harness_disabled" | "not_authorized"

export function cf4dExperimentRefusalV1(guard: { env: AssistedE2EHarnessEnvV1; authorization?: string }): Cf4dExperimentRefusalV1 | null {
  if (!isAssistedE2EHarnessEnabledV1(guard.env)) return "harness_disabled"
  if (guard.authorization !== CF4D_EXPERIMENT_AUTHORIZATION_V1) return "not_authorized"
  return null
}

export type Cf4dExperimentEvidenceV1 = {
  version: 1
  config: typeof CF4D_EXPERIMENT_CONFIG_V1
  requestFingerprint: string | null
  requestChars: number | null
  systemPromptChars: number
  parsedOutputFingerprint: string | null
  lifecycle: { status: string; reasonCode?: string }
  telemetry: FullSiteProviderResponseTelemetryV1[]
  latencyMs: number
  analysis: FullSiteCreativeEvidenceV1 | null
}

export type Cf4dExperimentResultV1 =
  | { status: "refused"; reason: Cf4dExperimentRefusalV1 }
  | { status: "completed"; evidence: Cf4dExperimentEvidenceV1; providerOutput: unknown }

const sha = (value: string) => createHash("sha256").update(value).digest("hex")

const SENSITIVE_PATTERN = /sk-ant-|x-api-key|authorization|anthropic-version|DATABASE_URL|mysql:\/\/|"thinking"\s*:\s*"[^"]/i

/** Throws if serialized evidence could carry credentials, headers or reasoning content. */
export function assertSafeCf4dEvidenceV1(evidence: unknown): void {
  if (SENSITIVE_PATTERN.test(JSON.stringify(evidence))) throw new Error("cf4d_evidence_not_safe")
}

export async function runCf4dControlledExperimentV1(params: {
  env: AssistedE2EHarnessEnvV1
  authorization?: string
  compositionMemory?: CompositionMemoryV1
  /** Injection seam for offline tests; defaults to the real Anthropic full-site provider. */
  providerFactory?: (config: AnthropicFullSiteCreativeProviderConfigV1) => FullSiteCreativeBlueprintProviderV1
}): Promise<Cf4dExperimentResultV1> {
  const refusal = cf4dExperimentRefusalV1(params)
  if (refusal) return { status: "refused", reason: refusal } // nothing constructed, no network

  const telemetry: FullSiteProviderResponseTelemetryV1[] = []
  const factory = params.providerFactory ?? createAnthropicFullSiteCreativeProviderV1
  const inner = factory({
    model: CF4D_EXPERIMENT_CONFIG_V1.model,
    thinkingMode: CF4D_EXPERIMENT_CONFIG_V1.thinkingMode,
    timeoutMs: CF4D_EXPERIMENT_CONFIG_V1.timeoutMs,
    maxTokens: CF4D_EXPERIMENT_CONFIG_V1.maxTokens,
    onResponseTelemetry: (entry) => telemetry.push(entry),
  })
  let context: FullSiteCreativeRequestContextV1 | null = null
  let serializedRequest: string | null = null
  let providerOutput: unknown = null
  const provider: FullSiteCreativeBlueprintProviderV1 = {
    providerKey: inner.providerKey,
    modelKey: inner.modelKey,
    timeoutMs: inner.timeoutMs,
    async generate(input) {
      context = input as FullSiteCreativeRequestContextV1
      serializedRequest = JSON.stringify(input)
      providerOutput = await inner.generate(input)
      return providerOutput
    },
  }
  const startedAt = Date.now()
  const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), ...(params.compositionMemory ? { compositionMemory: params.compositionMemory } : {}), commerceArchitecture: { provider } })
  const latencyMs = Date.now() - startedAt
  const lifecycle = run.fullSiteCreative.lifecycle
  const captured = context as FullSiteCreativeRequestContextV1 | null
  const request = serializedRequest as string | null
  const lastTelemetry = telemetry[telemetry.length - 1]
  const analysis = captured && providerOutput
    ? analyzeFullSiteCreativeResultV1({
        providerOutput,
        plan: run.plan,
        warnings: [...run.warnings, ...("warnings" in lifecycle ? lifecycle.warnings : [])],
        catalog: { productCount: captured.catalog.productCount, categoryKeys: captured.catalog.categories.map((category) => category.key), mediaProductIndexes: captured.catalog.products.filter((product) => product.hasImage).map((product) => product.index) },
        suppliedMotifs: captured.designMotifs,
        ...(params.compositionMemory ? { memory: params.compositionMemory } : {}),
        call: { requestChars: request?.length, systemPromptChars: buildFullSiteCreativeSystemPromptV1().length, latencyMs, inputTokens: lastTelemetry?.inputTokens, outputTokens: lastTelemetry?.outputTokens, stopReason: lastTelemetry?.stopReason },
      })
    : null
  const evidence: Cf4dExperimentEvidenceV1 = {
    version: 1,
    config: CF4D_EXPERIMENT_CONFIG_V1,
    requestFingerprint: request ? sha(request) : null,
    requestChars: request ? request.length : null,
    systemPromptChars: buildFullSiteCreativeSystemPromptV1().length,
    parsedOutputFingerprint: providerOutput ? sha(JSON.stringify(providerOutput)) : null,
    lifecycle: { status: lifecycle.status, ...("reasonCode" in lifecycle && lifecycle.reasonCode ? { reasonCode: lifecycle.reasonCode } : {}) },
    telemetry,
    latencyMs,
    analysis,
  }
  assertSafeCf4dEvidenceV1(evidence)
  return { status: "completed", evidence, providerOutput }
}
