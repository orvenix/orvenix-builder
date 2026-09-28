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
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

globalThis.fetch = (async () => {
  throw new Error("Full-Site Generation test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  validateFullSiteCreativeBlueprintV1,
  createCommerceTestingBlueprintV1,
  createDeterministicFullSiteCreativeTestingProviderV1,
  generateFullSiteCreativeBlueprintV1,
} from "../../lib/orvenix-ai/full-site-generation"
import {
  buildNovaMarketNewStorePreviewInputV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"

function signature(run: Awaited<ReturnType<typeof runAutonomousMultiPageSiteBuilder>>) {
  return {
    pages: run.plan.pages.map((page) => page.slug),
    sections: run.architecture.pages.map((page) => `${page.slug}:${page.sections.map((section) => section.instance?.id ?? section.role).join(">")}`),
    storeCards: run.plan.pages.map((page) => Object.values(page.tree.nodes).filter((node) => node.type === "store-product-card").length),
  }
}

test("Full-Site Blueprint V1 validates a non-commerce professional service fixture", () => {
  const blueprint = {
    version: 1,
    roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
    strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
    siteConcept: { narrative: "professional", rhythm: "calm", density: "balanced" },
    navigation: { concept: "conversion-led", primaryPurposes: ["home", "services", "contact"], cartProminence: "none" },
    pages: [
      {
        purpose: "home",
        narrativeGoal: "Presentar consultoria clara y confiable",
        sections: [
          { intent: "opening", role: "hero", ctaIntent: "contact", layout: { kind: "editorial-passage" } },
          { intent: "featured_collection", role: "services", refs: [{ kind: "service", index: 0 }, { kind: "service", index: 1 }] },
          { intent: "trust", role: "trust", refs: [{ kind: "evidence", index: 0 }] },
          { intent: "closing", role: "cta", ctaIntent: "contact", layout: { kind: "dramatic-closing" } },
        ],
      },
      {
        purpose: "services",
        sections: [
          { intent: "opening", role: "hero" },
          { intent: "collection", role: "services", refs: [{ kind: "service", index: 0 }, { kind: "service", index: 1 }] },
          { intent: "closing", role: "cta", ctaIntent: "contact" },
        ],
      },
    ],
  }

  const result = validateFullSiteCreativeBlueprintV1(blueprint, { serviceCount: 2, evidenceCount: 1 })
  assert.equal(result.ok, true)
})

test("Full-Site Blueprint V1 hostile output cannot inject facts, routes, CSS or code", () => {
  const hostile = createCommerceTestingBlueprintV1("hostile")
  const result = validateFullSiteCreativeBlueprintV1(hostile, {
    productCount: 24,
    categoryKeys: ["tecnologia"],
  })
  assert.equal(result.ok, false)
})

test("Full-Site provider abstraction reports applied, rejected and failed without throwing", async () => {
  const grounding = { productCount: 24, categoryKeys: ["tecnologia", "audio", "gaming"] }
  const requestContext = { domain: "commerce", productCount: 24 }
  const applied = await generateFullSiteCreativeBlueprintV1({
    provider: createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce"),
    requestContext,
    grounding,
  })
  assert.equal(applied.ok, true)
  assert.equal(applied.lifecycle.status, "applied")

  const rejected = await generateFullSiteCreativeBlueprintV1({
    provider: createDeterministicFullSiteCreativeTestingProviderV1("hostile"),
    requestContext,
    grounding,
  })
  assert.equal(rejected.ok, false)
  assert.equal(rejected.lifecycle.status, "rejected")

  const failed = await generateFullSiteCreativeBlueprintV1({
    provider: { generate: async () => { throw new Error("provider_down") } },
    requestContext,
    grounding,
  })
  assert.equal(failed.ok, false)
  assert.equal(failed.lifecycle.status, "failed")
})

test("Full-Site Commerce AI blueprints create materially different NovaMarket architectures from identical facts", async () => {
  const base = buildNovaMarketNewStorePreviewInputV1()
  const deterministic = await runAutonomousMultiPageSiteBuilder(base)
  const editorial = await runAutonomousMultiPageSiteBuilder({
    ...base,
    commerceArchitecture: { mode: "mock-ai", proposal: createCommerceTestingBlueprintV1("editorial-commerce") },
  })
  const catalog = await runAutonomousMultiPageSiteBuilder({
    ...base,
    commerceArchitecture: { mode: "mock-ai", proposal: createCommerceTestingBlueprintV1("catalog-heavy-commerce") },
  })

  const signatures = [deterministic, editorial, catalog].map((run) => JSON.stringify(signature(run)))
  assert.equal(new Set(signatures).size, 3)
  assert.ok(editorial.plan.pages.some((page) => page.slug === "producto-bocina-portatil-pulse"))
  assert.ok(catalog.plan.pages.some((page) => page.slug === "categoria-tecnologia"))
  for (const run of [deterministic, editorial, catalog]) {
    assert.equal(run.plan.commerce?.provisioning.products.length, 24)
    assert.equal(/(productId|variantId|siteId|nm-mock-|demo-v1)/.test(JSON.stringify(run.plan)), false, "preview carries no authoritative ids from external blueprint")
  }
})

test("Full-Site hostile commerce proposal falls back to deterministic architecture and preserves generation", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    commerceArchitecture: { mode: "mock-ai", proposal: createCommerceTestingBlueprintV1("hostile") },
  })

  assert.ok(run.trace.some((line) => line.includes("fallback deterministico")))
  assert.ok(run.plan.pages.some((page) => page.slug === "productos"))
  assert.equal(run.plan.commerce?.provisioning.products.length, 24)
})
