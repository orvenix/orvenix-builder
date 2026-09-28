import { runAutonomousMultiPageSiteBuilder } from "@/lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "@/lib/orvenix-ai/autonomous/types"
import type { AssetProvider } from "@/lib/orvenix-ai/assets/types"
import type { AssistedSiteGenerationProviderV1 } from "../contract"
import type { FullSiteCreativeBlueprintProviderV1 } from "@/lib/orvenix-ai/full-site-generation/contract"
import { createDeterministicFullSiteCreativeTestingProviderV1 } from "@/lib/orvenix-ai/full-site-generation/testing-provider"
import {
  NOVAMARKET_BUSINESS_V1,
  NOVAMARKET_DROPPED_COMMERCE_FIELDS_V1,
  NOVAMARKET_FIXTURE_NAME_V1,
  NOVAMARKET_MOCK_SITE_ID_V1,
  NOVAMARKET_PRODUCTS_V1,
  buildNovaMarketMockStoreRecordsV1,
  NOVAMARKET_REQUEST_V1,
  toSupportedBuilderProductsV1,
} from "./novamarket-fixture"

/**
 * ASSISTED-4A: dev/E2E-only OFF vs ANTHROPIC comparison harness.
 *
 * - Access requires BOTH `NODE_ENV !== "production"` AND the dedicated
 *   literal flag `ORVENIX_DEV_ASSISTED_E2E === "1"`; checked here (not only
 *   in the route) so no future caller can skip it.
 * - Calls the trusted builder directly -- never app/actions/ai.ts, never
 *   the global env mode resolver. "anthropic" is selected HERE, server-
 *   side; there is no parameter through which a browser can choose a mode
 *   or replace the fixture (see RunAssistedComparisonOptionsV1: no
 *   business/request/mode field exists).
 * - Zero Pexels: both runs inject an asset provider that is never
 *   available, so image slots keep the existing src:"" placeholder path.
 * - Zero DB: this module imports no Prisma/DB client and persists nothing.
 * - Both runs share the SAME frozen fixture, facts, page universe and
 *   compiler; the only difference is the explicit assisted mode.
 */

export const ASSISTED_E2E_FLAG_NAME_V1 = "ORVENIX_DEV_ASSISTED_E2E"

export type AssistedE2EHarnessEnvV1 = { NODE_ENV?: string; ORVENIX_DEV_ASSISTED_E2E?: string }

export function isAssistedE2EHarnessEnabledV1(env: AssistedE2EHarnessEnvV1): boolean {
  return env.NODE_ENV !== "production" && env.ORVENIX_DEV_ASSISTED_E2E === "1"
}

export class AssistedE2EHarnessDisabledErrorV1 extends Error {
  constructor() {
    super("assisted_e2e_harness_disabled")
    this.name = "AssistedE2EHarnessDisabledErrorV1"
  }
}

export const DISABLED_ASSET_PROVIDER_V1: AssetProvider = {
  name: "disabled-dev-harness",
  isAvailable: () => false,
  search: async () => [],
}

export function buildNovaMarketBuilderInputBaseV1() {
  return {
    request: NOVAMARKET_REQUEST_V1,
    business: { ...NOVAMARKET_BUSINESS_V1, products: toSupportedBuilderProductsV1() },
    forceFreshComposition: true,
    minimumQuality: 55,
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
  }
}

/**
 * COMMERCE-2A, TEST/DEV: the NEW-STORE preview input -- same fixture plus
 * the trusted `commerceProvisioning` intent. The builder produces a
 * hash-covered provisioning plan and PENDING cards; no ids, no writes.
 */
export function buildNovaMarketNewStorePreviewInputV1() {
  return {
    ...buildNovaMarketBuilderInputBaseV1(),
    commerceProvisioning: { mode: "new_store" as const },
  }
}

/**
 * COMMERCE-1, TEST ONLY: same fixture plus the builder's trusted
 * `commerceStore` input fed with obviously-fake "nm-mock-" rows. Not used
 * by the dev route (which stays presentation-only) and never persisted.
 */
export function buildNovaMarketMockExecutableBuilderInputV1() {
  return {
    ...buildNovaMarketBuilderInputBaseV1(),
    commerceStore: { siteId: NOVAMARKET_MOCK_SITE_ID_V1, records: buildNovaMarketMockStoreRecordsV1() },
  }
}

export interface RunAssistedComparisonOptionsV1 {
  env: AssistedE2EHarnessEnvV1
  /** Tests inject a mock here. Absent -> the bridge's real ASSISTED-3A provider (NEXT phase only). */
  anthropicProvider?: AssistedSiteGenerationProviderV1
  timeoutMs?: number
}

export interface AssistedComparisonResultV1 {
  fixture: {
    name: string
    productCount: number
    droppedCommerceFields: readonly string[]
  }
  off: AutonomousMultiPageSiteBuilderResult
  assisted: AutonomousMultiPageSiteBuilderResult
}

export async function runAssistedGenerationComparisonV1(
  options: RunAssistedComparisonOptionsV1,
): Promise<AssistedComparisonResultV1> {
  if (!isAssistedE2EHarnessEnabledV1(options.env)) throw new AssistedE2EHarnessDisabledErrorV1()

  const off = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketBuilderInputBaseV1(),
    assistedGeneration: { mode: "off" },
  })

  const assisted = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketBuilderInputBaseV1(),
    assistedGeneration: {
      mode: "anthropic",
      ...(options.anthropicProvider ? { provider: options.anthropicProvider } : {}),
      ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    },
  })

  return {
    fixture: {
      name: NOVAMARKET_FIXTURE_NAME_V1,
      productCount: NOVAMARKET_PRODUCTS_V1.length,
      droppedCommerceFields: NOVAMARKET_DROPPED_COMMERCE_FIELDS_V1,
    },
    off,
    assisted,
  }
}

/** Serializable, secret-free artifact for the dev viewer page (local file only, never DB). */
export function toAssistedComparisonArtifactV1(result: AssistedComparisonResultV1) {
  const variant = (run: AutonomousMultiPageSiteBuilderResult) => ({
    siteType: run.architecture.siteType,
    planHash: run.planHash,
    lifecycle: run.assistedGeneration,
    pages: run.plan.pages.map((page) => ({ name: page.name, slug: page.slug, isHome: page.isHome, tree: page.tree })),
  })
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    fixture: result.fixture,
    off: variant(result.off),
    assisted: variant(result.assisted),
  }
}

export type AssistedComparisonArtifactV1 = ReturnType<typeof toAssistedComparisonArtifactV1>

/**
 * FULL-SITE-4A: NovaMarket Full-Site dry-run instrument. Every mode runs
 * the SAME 24-product / 6-category facts through the SAME downstream path
 * (builder provider seam -> orchestrator -> validator -> commerce adapter
 * -> compiler -> EditorTree). "real" is REFUSED unless the dev E2E guard
 * is enabled, the caller passes an explicit authorization flag AND
 * supplies the (server-constructed) provider -- this module never
 * constructs or imports the real provider itself.
 */
export type NovaMarketFullSiteDryRunModeV1 = "deterministic" | "mock-editorial" | "mock-catalog" | "real"

export type NovaMarketFullSiteDryRunResultV1 =
  | { status: "skipped"; reason: "real_provider_not_authorized" }
  | { status: "completed"; mode: NovaMarketFullSiteDryRunModeV1; run: AutonomousMultiPageSiteBuilderResult }

export async function runNovaMarketFullSiteDryRunV1(params: {
  mode: NovaMarketFullSiteDryRunModeV1
  env?: AssistedE2EHarnessEnvV1
  authorizeRealProviderCall?: boolean
  realProvider?: FullSiteCreativeBlueprintProviderV1
}): Promise<NovaMarketFullSiteDryRunResultV1> {
  let provider: FullSiteCreativeBlueprintProviderV1 | undefined
  if (params.mode === "real") {
    const authorized = params.authorizeRealProviderCall === true && Boolean(params.realProvider) && isAssistedE2EHarnessEnabledV1(params.env ?? {})
    if (!authorized) return { status: "skipped", reason: "real_provider_not_authorized" }
    provider = params.realProvider
  } else if (params.mode === "mock-editorial") {
    provider = createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce")
  } else if (params.mode === "mock-catalog") {
    provider = createDeterministicFullSiteCreativeTestingProviderV1("catalog-heavy-commerce")
  }
  const run = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    ...(provider ? { commerceArchitecture: { provider } } : {}),
  })
  return { status: "completed", mode: params.mode, run }
}
