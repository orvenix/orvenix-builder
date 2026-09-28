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
    if (fs.existsSync(compiledPath + ".js")) return compiledPath + ".js"
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

globalThis.fetch = (async () => {
  throw new Error("COMMERCE-3 test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import {
  COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
  COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
  validateCommerceArchitecturePlanV1,
} from "../../lib/orvenix-ai/commerce/architecture"
import {
  buildNovaMarketBuilderInputBaseV1,
  buildNovaMarketNewStorePreviewInputV1,
  DISABLED_ASSET_PROVIDER_V1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"

function nodesOf(page: { tree: { nodes: Record<string, { type: string; props: Record<string, unknown> }> } }) {
  return Object.values(page.tree.nodes)
}

function storeCards(page: { tree: { nodes: Record<string, { type: string; props: Record<string, unknown> }> } }) {
  return nodesOf(page).filter((node) => node.type === "store-product-card")
}

test("COMMERCE-3 contract rejects arbitrary route/style/facts and accepts grounded commerce architecture", () => {
  const input = buildNovaMarketBuilderInputBaseV1()
  const products = input.business.products ?? []
  const valid = validateCommerceArchitecturePlanV1({
    version: 1,
    roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
    strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
    storeStrategy: "catalog-first",
    navigationStyle: "category-forward",
    pages: [
      { purpose: "home", slug: "home", name: "Inicio", sections: [{ type: "featured_products", productIndexes: [0, 1, 2] }] },
      { purpose: "catalog", slug: "catalogo", name: "Catalogo", sections: [{ type: "catalog_grid", productIndexes: products.map((_, index) => index) }] },
    ],
  }, products)
  assert.equal(valid.ok, true)

  const invalid = validateCommerceArchitecturePlanV1({
    version: 1,
    roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
    strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
    storeStrategy: "catalog-first",
    navigationStyle: "category-forward",
    pages: [
      { purpose: "home", slug: "https://evil.example", name: "Inicio", className: "fixed top-0", sections: [{ type: "raw_html", productIndexes: [0] }] },
      { purpose: "catalog", slug: "catalogo", name: "Catalogo", sections: [{ type: "catalog_grid", productIndexes: [999], category: "Inventada" }] },
    ],
  }, products)
  assert.equal(invalid.ok, false)
})

test("COMMERCE-3 deterministic NovaMarket produces rich store page universe and pending functional cards", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const slugs = run.plan.pages.map((page) => page.slug)

  assert.ok(slugs.includes("home"))
  assert.ok(slugs.includes("productos"))
  assert.ok(slugs.some((slug) => slug.startsWith("categoria-")), "category pages are generated from real categories")
  assert.ok(slugs.some((slug) => slug.startsWith("producto-")), "product-detail pages are generated from real products")
  assert.ok(run.trace.some((line) => line.includes("Commerce Architect aplicado")))
  assert.ok(run.plan.pages.length > 2, "store is richer than home + products")

  const catalog = run.plan.pages.find((page) => page.slug === "productos")
  assert.ok(catalog)
  assert.equal(storeCards(catalog).length, 24, "catalog represents the complete grounded product set")
  assert.ok(storeCards(catalog).every((card) => typeof card.props.provisioningRef === "string"))
  assert.ok(storeCards(catalog).every((card) => card.props.productId === undefined && card.props.variantId === undefined), "preview cards do not carry store ids")

  const detail = run.plan.pages.find((page) => page.slug.startsWith("producto-"))
  assert.ok(detail)
  assert.equal(storeCards(detail).filter((card) => typeof card.props.provisioningRef === "string").length >= 1, true)
})

test("COMMERCE-3 mock-AI proposal applies when grounded and falls back when unsafe", async () => {
  const base = buildNovaMarketNewStorePreviewInputV1()
  const validProposal = {
    version: 1,
    roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
    strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
    storeStrategy: "product-led",
    navigationStyle: "editorial-commerce",
    pages: [
      { purpose: "home", slug: "home", name: "Inicio", sections: [{ type: "product_spotlight", productIndexes: [3] }, { type: "featured_products", productIndexes: [0, 1, 2] }] },
      { purpose: "catalog", slug: "catalogo", name: "Catalogo", sections: [{ type: "catalog_grid", productIndexes: [0, 1, 2, 3] }] },
      { purpose: "product_detail", slug: "producto-tablet-nova-10", name: "Tablet Nova 10", productIndex: 0, sections: [{ type: "product_detail", productIndexes: [0] }] },
    ],
  }
  const applied = await runAutonomousMultiPageSiteBuilder({
    ...base,
    commerceArchitecture: { mode: "mock-ai", proposal: validProposal },
  })
  assert.deepEqual(applied.plan.pages.map((page) => page.slug), ["home", "catalogo", "producto-tablet-nova-10"])

  const fallback = await runAutonomousMultiPageSiteBuilder({
    ...base,
    commerceArchitecture: {
      mode: "mock-ai",
      proposal: {
        ...validProposal,
        pages: [{ purpose: "home", slug: "home", name: "Inicio", sections: [{ type: "featured_products", productIndexes: [999] }] }],
      },
    },
  })
  assert.ok(fallback.trace.some((line) => line.includes("fallback deterministico")))
  assert.ok(fallback.plan.pages.some((page) => page.slug === "productos"))
})

test("COMMERCE-3 leaves non-commerce site generation unchanged", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para una clinica dental",
    business: {
      name: "Clinica Serena",
      industry: "clinica dental",
      description: "Atencion dental familiar",
      objective: "Conseguir citas",
      services: [{ name: "Limpieza dental" }, { name: "Ortodoncia" }],
    },
    forceFreshComposition: true,
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
  })

  assert.equal(run.architecture.siteType, "health")
  assert.equal(run.plan.commerce, undefined)
  assert.equal(run.plan.pages.some((page) => page.slug === "productos"), false)
  assert.equal(run.trace.some((line) => line.includes("Commerce Architect aplicado")), false)
})
