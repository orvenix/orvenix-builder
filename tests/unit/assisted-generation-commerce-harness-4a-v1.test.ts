import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// ASSISTED-4A: zero real Anthropic / Pexels / network. Credentials are only
// deleted (never read); fetch is a counting tripwire asserted at the end.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("ASSISTED-4A test: network is forbidden")
}) as typeof fetch

import {
  AssistedE2EHarnessDisabledErrorV1,
  DISABLED_ASSET_PROVIDER_V1,
  buildNovaMarketBuilderInputBaseV1,
  isAssistedE2EHarnessEnabledV1,
  runAssistedGenerationComparisonV1,
  toAssistedComparisonArtifactV1,
  type RunAssistedComparisonOptionsV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import {
  NOVAMARKET_CATEGORIES_V1,
  NOVAMARKET_PRODUCTS_V1,
  toSupportedBuilderProductsV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import type { AssistedSiteGenerationProviderV1 } from "../../lib/orvenix-ai/assisted-generation/contract"
import type { AssistedSiteGenerationRequestContextV1 } from "../../lib/orvenix-ai/assisted-generation/request-context"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import type { EditorNode } from "../../types/editor"

const ENABLED_ENV = { NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: "1" }

type MockProvider = AssistedSiteGenerationProviderV1 & { calls: unknown[] }

function mockProvider(respond: (input: unknown) => unknown): MockProvider {
  const calls: unknown[] = []
  return {
    calls,
    async request(input: unknown) {
      calls.push(structuredClone(input))
      return respond(input)
    },
  }
}

/**
 * A grounded proposal derived ONLY from the bounded request context the
 * provider actually receives: on the non-home page that has "products",
 * split the 24-item catalog into two 12-item subsets with two different
 * allowed layouts; every other role is kept once, in order.
 */
function catalogSplitProposal(input: unknown) {
  const context = input as AssistedSiteGenerationRequestContextV1
  const catalogPage = context.pages.find((page) => page.slug !== "home" && page.roles.includes("products"))!
  const layouts = context.capabilities.roleLayouts.products!
  const count = context.offerings.products!.length
  const half = Math.ceil(count / 2)
  const indexes = (from: number, to: number) => Array.from({ length: to - from }, (_, offset) => from + offset)

  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [
      {
        slug: catalogPage.slug,
        instances: catalogPage.roles.flatMap((role): unknown[] =>
          role === "products"
            ? [
                { role, selection: { mode: "subset", indexes: indexes(0, half) }, composition: { layout: { kind: layouts.includes("card-grid") ? "card-grid" : layouts[0] } } },
                { role, selection: { mode: "subset", indexes: indexes(half, count) }, composition: { layout: { kind: layouts.includes("editorial-split") ? "editorial-split" : layouts[1] ?? layouts[0] } } },
              ]
            : [{ role, selection: { mode: "all" } }],
        ),
      },
    ],
  }
}

function nodeTypeHistogram(nodes: Record<string, EditorNode>): Record<string, number> {
  const histogram: Record<string, number> = {}
  for (const node of Object.values(nodes)) histogram[node.type] = (histogram[node.type] ?? 0) + 1
  return histogram
}

function assertValidPlan(run: AutonomousMultiPageSiteBuilderResult) {
  assert.equal(run.ok, true)
  const revalidation = validateSiteCreationPlanV2(run.plan, { maxPages: Math.max(run.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(revalidation.ok, true)
}

// --- fixture ---

test("fixture: 24 deterministic synthetic products across 6 categories, bounded facts, no URLs/claims", () => {
  assert.equal(NOVAMARKET_PRODUCTS_V1.length, 24)
  assert.deepEqual(NOVAMARKET_CATEGORIES_V1.map((c) => c.slug), ["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"])
  for (const category of NOVAMARKET_CATEGORIES_V1) {
    assert.equal(NOVAMARKET_PRODUCTS_V1.filter((p) => p.category === category.slug).length, 4)
  }
  assert.equal(new Set(NOVAMARKET_PRODUCTS_V1.map((p) => p.id)).size, 24)
  for (const product of NOVAMARKET_PRODUCTS_V1) {
    assert.ok(Number.isInteger(product.priceMxn) && product.priceMxn > 0)
    if (product.compareAtPriceMxn !== undefined) assert.ok(product.compareAtPriceMxn > product.priceMxn)
    for (const variant of product.variants ?? []) assert.ok(Number.isInteger(variant.priceMxn) && variant.priceMxn > 0)
  }
  const serialized = JSON.stringify(NOVAMARKET_PRODUCTS_V1).toLowerCase()
  for (const forbidden of ["http", "www.", "#1", "mejor tienda", "numero uno", "testimonio", "amazon", "mercado libre", "mercadolibre"]) {
    assert.equal(serialized.includes(forbidden), false, `fixture must not contain "${forbidden}"`)
  }
})

test("fixture: builder receives PRESENTATION commerce facts only (COMMERCE-1) -- never a store binding or variant id", () => {
  const supported = toSupportedBuilderProductsV1()
  assert.equal(supported.length, 24)
  for (const product of supported) {
    assert.deepEqual(Object.keys(product).sort(), ["category", "description", "name", "variants"])
    assert.ok(product.variants.length >= 1)
    for (const variant of product.variants) assert.equal("variantId" in variant, false)
  }
})

// --- guard ---

test("guard: production is inaccessible even with the flag", () => {
  assert.equal(isAssistedE2EHarnessEnabledV1({ NODE_ENV: "production", ORVENIX_DEV_ASSISTED_E2E: "1" }), false)
})

test("guard: missing/non-literal dev flag is inaccessible", () => {
  for (const flag of [undefined, "", "0", "true", "yes", " 1", "1 "]) {
    assert.equal(isAssistedE2EHarnessEnabledV1({ NODE_ENV: "development", ORVENIX_DEV_ASSISTED_E2E: flag }), false, `flag ${JSON.stringify(flag)}`)
  }
  assert.equal(isAssistedE2EHarnessEnabledV1(ENABLED_ENV), true)
})

test("guard: a disabled harness throws BEFORE any builder/provider work", async () => {
  const provider = mockProvider(() => ({}))
  for (const env of [{ NODE_ENV: "production", ORVENIX_DEV_ASSISTED_E2E: "1" }, { NODE_ENV: "development" }]) {
    await assert.rejects(runAssistedGenerationComparisonV1({ env, anthropicProvider: provider }), AssistedE2EHarnessDisabledErrorV1)
  }
  assert.equal(provider.calls.length, 0)
})

test("guard: no browser-selectable mode and no replaceable fixture exist on the harness options (type-level)", () => {
  const withMode: RunAssistedComparisonOptionsV1 = {
    env: ENABLED_ENV,
    // @ts-expect-error -- mode is fixed server-side by the harness, never an option.
    mode: "anthropic",
  }
  const withBusiness: RunAssistedComparisonOptionsV1 = {
    env: ENABLED_ENV,
    // @ts-expect-error -- the fixture cannot be replaced with an arbitrary payload.
    business: { name: "Otra tienda" },
  }
  const withRequest: RunAssistedComparisonOptionsV1 = {
    env: ENABLED_ENV,
    // @ts-expect-error -- the request string is fixed by the fixture.
    request: "cualquier cosa",
  }
  void withMode
  void withBusiness
  void withRequest
})

test("no DB / no Pexels dependency: harness modules import no DB client; asset provider is never available", () => {
  const dir = path.join(process.cwd(), "lib/orvenix-ai/assisted-generation/e2e")
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
    const source = fs.readFileSync(path.join(dir, file), "utf8")
    assert.equal(/prisma|editor-db|pexels/i.test(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")), false, `${file} must not depend on DB/Pexels`)
  }
  assert.equal(DISABLED_ASSET_PROVIDER_V1.isAvailable(), false)
  assert.equal(buildNovaMarketBuilderInputBaseV1().assetProvider, DISABLED_ASSET_PROVIDER_V1)
})

// --- mocked OFF vs ANTHROPIC comparison ---

test("comparison: OFF zero provider calls, mocked ANTHROPIC exactly one, same facts/pages/compiler, both Plan V2 valid", async () => {
  const provider = mockProvider(catalogSplitProposal)

  const result = await runAssistedGenerationComparisonV1({ env: ENABLED_ENV, anthropicProvider: provider })

  // exactly one provider call, and it belongs to the assisted run (OFF never reaches it)
  assert.equal(provider.calls.length, 1)
  assert.deepEqual(result.off.assistedGeneration, { status: "disabled" })
  assert.equal(result.assisted.assistedGeneration.status, "applied")
  if (result.assisted.assistedGeneration.status === "applied") {
    assert.equal(result.assisted.assistedGeneration.providerKey, "anthropic")
    assert.deepEqual(result.assisted.assistedGeneration.rejectedReasons, [])
  }

  // bounded context: 24 supported products, no business name/description/request
  const context = provider.calls[0] as AssistedSiteGenerationRequestContextV1
  assert.equal(context.offerings.products?.length, 24)
  const serialized = JSON.stringify(context)
  assert.equal(serialized.includes("NovaMarket"), false)
  assert.equal(serialized.includes("FIXTURE SINTETICO"), false)

  // same fixture, facts, page universe
  assert.equal(result.off.architecture.siteType, "ecommerce")
  assert.equal(result.assisted.architecture.siteType, "ecommerce")
  assert.deepEqual(result.assisted.architecture.products, result.off.architecture.products)
  assert.deepEqual(result.off.architecture.products?.map((product) => product.name), toSupportedBuilderProductsV1().map((product) => product.name))
  assert.equal(result.off.architecture.products?.some((product) => product.storeBinding), false)
  assert.deepEqual(result.assisted.plan.pages.map((p) => p.slug), result.off.plan.pages.map((p) => p.slug))

  assertValidPlan(result.off)
  assertValidPlan(result.assisted)

  // accepted composition measurably changes the catalog page's executable structure
  const catalogSlug = (catalogSplitProposal(context).pages[0] as { slug: string }).slug
  const offPage = result.off.plan.pages.find((p) => p.slug === catalogSlug)!
  const assistedPage = result.assisted.plan.pages.find((p) => p.slug === catalogSlug)!
  assert.notDeepEqual(nodeTypeHistogram(offPage.tree.nodes), nodeTypeHistogram(assistedPage.tree.nodes))

  // no fake commerce: neither run emits cart/checkout/product-card store blocks
  for (const run of [result.off, result.assisted]) {
    for (const page of run.plan.pages) {
      for (const node of Object.values(page.tree.nodes)) {
        assert.equal(/^(store-|ec-)/.test(node.type), false, `${page.slug}: unexpected commerce block ${node.type}`)
      }
    }
  }

  // artifact is serializable and secret-free
  const artifact = toAssistedComparisonArtifactV1(result)
  const artifactText = JSON.stringify(artifact)
  assert.equal(/api[_-]?key|sk-ant/i.test(artifactText), false)
  assert.equal(artifact.fixture.productCount, 24)
})

test("comparison: provider failure still yields a normal OFF-equivalent assisted run", async () => {
  const provider = mockProvider(() => {
    throw new Error("boom")
  })
  const result = await runAssistedGenerationComparisonV1({ env: ENABLED_ENV, anthropicProvider: provider })
  assert.equal(provider.calls.length, 1)
  assert.equal(result.assisted.assistedGeneration.status, "failed")
  assert.deepEqual(result.assisted.architecture, result.off.architecture)
  assertValidPlan(result.assisted)
})

test("zz) zero network attempts across the whole 4A suite", () => {
  assert.equal(networkAttempts, 0)
})
