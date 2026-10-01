/**
 * CF-3C: provider EXECUTION configuration for model thinking -- never
 * creative content, never part of the creative request fingerprint.
 *
 * - "default": Orvenix sends no `thinking` field; the model's own default
 *   applies (claude-sonnet-5 defaults to adaptive thinking, high effort,
 *   and thinking counts against max_tokens).
 * - "disabled": Orvenix sends exactly `thinking: { type: "disabled" }`.
 *
 * Manual budgets (`type: "enabled"` + `budget_tokens`) are deliberately
 * not representable. Adaptive effort can be added later as another mode.
 *
 * Compatibility is a closed allowlist of models VERIFIED to accept
 * `{ type: "disabled" }`. An explicit "disabled" for any other model fails
 * closed before the SDK is constructed (no network). This is a capability
 * list, not a model choice: the trusted caller still injects the model.
 */

export const FULL_SITE_PROVIDER_THINKING_MODES_V1 = ["default", "disabled"] as const
export type FullSiteProviderThinkingModeV1 = (typeof FULL_SITE_PROVIDER_THINKING_MODES_V1)[number]

const THINKING_DISABLED_SUPPORTED_MODELS: ReadonlySet<string> = new Set(["claude-sonnet-5"])

export function supportsThinkingModeV1(model: string, mode: FullSiteProviderThinkingModeV1): boolean {
  return mode === "default" || THINKING_DISABLED_SUPPORTED_MODELS.has(model)
}

/** The exact request fragment for a mode; `undefined` means "send nothing". */
export function thinkingRequestParamV1(mode: FullSiteProviderThinkingModeV1): { type: "disabled" } | undefined {
  return mode === "disabled" ? { type: "disabled" } : undefined
}
