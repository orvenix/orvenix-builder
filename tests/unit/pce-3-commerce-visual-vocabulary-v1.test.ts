import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

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

// PCE-3 is fully offline. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("PCE-3 test: network is forbidden")
}) as typeof fetch

import { ProductCard } from "../../components/editor/blocks/store/ProductCard"
import { isValidSectionInstancePlan } from "../../lib/orvenix-ai/architect/composition-plan"
import { composeSection } from "../../lib/orvenix-ai/composer/section-composer"
import { bindStoreProductRecordsV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { validateFullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/validator"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
  FULL_SITE_MERCHANDISING_COMPOSITIONS_V1,
  FULL_SITE_PRODUCT_CARD_TREATMENTS_V1,
} from "../../lib/orvenix-ai/full-site-generation/contract"
import { createDeterministicFullSiteCreativeTestingProviderV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import {
  buildNovaMarketMockExecutableBuilderInputV1,
  buildNovaMarketNewStorePreviewInputV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import type { EditorNode, EditorTree } from "../../types/editor"

const nodesOf = (tree: EditorTree) => Object.values(tree.nodes as Record<string, EditorNode>)
const sectionNodesOf = (tree: EditorTree) => nodesOf(tree).filter((node) => node.type === "section")
const storeCardsOf = (tree: EditorTree) => nodesOf(tree).filter((node) => node.type === "store-product-card")
const wrappersOf = (section: NonNullable<ReturnType<typeof composeSection>>) => Object.values(section.nodes).filter((node) => node.type === "genericWrapper")

function validProductsPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: "products:1",
    role: "products",
    selection: { mode: "subset", indexes: [0, 1, 2] },
    composition: {
      productCardTreatment: "featured",
      merchandisingComposition: "featured-plus-grid",
      ...overrides,
    },
    provenance: "deterministic",
  }
}

function blueprintWith(sectionOverrides: Record<string, unknown>) {
  return {
    version: FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
    roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
    strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
    siteConcept: { narrative: "catalog", rhythm: "varied", density: "rich" },
    navigation: { concept: "catalog-forward", primaryPurposes: ["home", "catalog"], cartProminence: "prominent" },
    pages: [{
      purpose: "home",
      density: "balanced",
      sections: [{
        intent: "featured_collection",
        role: "products",
        refs: [{ kind: "product", index: 0 }, { kind: "category", key: "tecnologia" }],
        ...sectionOverrides,
      }],
    }],
  }
}

function commerceSignature(run: Awaited<ReturnType<typeof runAutonomousMultiPageSiteBuilder>>) {
  const compositions = run.plan.pages.flatMap((page) => sectionNodesOf(page.tree).map((node) => String(node.props.commerceComposition ?? ""))).filter(Boolean)
  const treatments = run.plan.pages.flatMap((page) => storeCardsOf(page.tree).map((node) => String(node.props.treatment ?? ""))).filter(Boolean)
  return { compositions, treatments, signature: JSON.stringify({ pages: run.plan.pages.map((page) => page.slug), compositions, treatments }) }
}

test("contract: PCE-3 product card and merchandising vocabularies are closed and accepted by SectionInstancePlan", () => {
  for (const treatment of FULL_SITE_PRODUCT_CARD_TREATMENTS_V1) {
    assert.equal(isValidSectionInstancePlan(validProductsPlan({ productCardTreatment: treatment })), true, treatment)
  }
  for (const composition of FULL_SITE_MERCHANDISING_COMPOSITIONS_V1) {
    assert.equal(isValidSectionInstancePlan(validProductsPlan({ merchandisingComposition: composition })), true, composition)
  }
  assert.equal(isValidSectionInstancePlan(validProductsPlan({ productCardTreatment: "neon-card" })), false)
  assert.equal(isValidSectionInstancePlan(validProductsPlan({ merchandisingComposition: "masonry-chaos" })), false)
  assert.equal(isValidSectionInstancePlan(validProductsPlan({ className: "grid-cols-[999fr]" })), false)
})

test("full-site validator preserves bounded PCE-3 fields and rejects arbitrary visual vocabulary", () => {
  const ok = validateFullSiteCreativeBlueprintV1(blueprintWith({
    productCardTreatment: "image-led",
    merchandisingComposition: "featured-plus-grid",
    layout: { kind: "card-grid" },
  }), { productCount: 1, categoryKeys: ["tecnologia"], maxPages: 4 })
  assert.equal(ok.ok, true, JSON.stringify(ok))
  assert.equal(ok.ok && ok.blueprint.pages[0].sections[0].productCardTreatment, "image-led")
  assert.equal(ok.ok && ok.blueprint.pages[0].sections[0].merchandisingComposition, "featured-plus-grid")

  const badTreatment = validateFullSiteCreativeBlueprintV1(blueprintWith({ productCardTreatment: "neon-card" }), { productCount: 1, categoryKeys: ["tecnologia"] })
  assert.equal(badTreatment.ok, false)
  assert.ok(!badTreatment.ok && badTreatment.errors.some((error) => error.includes("productCardTreatment")))

  const badComposition = validateFullSiteCreativeBlueprintV1(blueprintWith({ merchandisingComposition: "freeform-masonry" }), { productCount: 1, categoryKeys: ["tecnologia"] })
  assert.equal(badComposition.ok, false)
  assert.ok(!badComposition.ok && badComposition.errors.some((error) => error.includes("merchandisingComposition")))
})

test("ProductCard renders every bounded treatment as material component structure", () => {
  for (const treatment of FULL_SITE_PRODUCT_CARD_TREATMENTS_V1) {
    const html = renderToStaticMarkup(createElement(ProductCard, {
      productId: `product-${treatment}`,
      variantId: `variant-${treatment}`,
      productName: "Tablet Nova 10",
      variantName: "Única",
      priceMxn: 549900,
      stock: 5,
      treatment,
      imageUrl: "https://cdn.example.invalid/tablet.jpg",
    }))
    assert.match(html, new RegExp(`data-store-card-treatment="${treatment}"`), treatment)
  }
  const source = fs.readFileSync(path.join(process.cwd(), "components/editor/blocks/store/ProductCard.tsx"), "utf8")
  assert.match(source, /ProductDetailLink/)
  assert.match(source, /isHorizontal = safeTreatment === "horizontal"/)
  assert.match(source, /isEditorial = safeTreatment === "editorial"/)
  assert.match(source, /isFeatured = safeTreatment === "featured"/)
  assert.equal(new RegExp("<button[\\s\\S]*<a\\b").test(source), false, "button does not wrap detail links")
})

test("composer: merchandising compositions reach ProductCard props and category links become category cards", () => {
  const records = buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1).slice(0, 4).map((record, index) => index === 0 ? { ...record, media: ["https://cdn.example.invalid/tablet.jpg"] } : record)
  const products = bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, records)
  const productsSection = composeSection("products", {
    businessName: "NovaMarket",
    products,
    commerceMerchandisingComposition: "product-rail",
    commerceProductCardTreatment: "horizontal",
    commerceSurfaces: true,
    themePalette: { primary: "#1794CC", secondary: "#0E5C80", background: "#f8fbff", text: "#0A3E57", accent: "#1BB3FA" },
  })
  assert.ok(productsSection)
  const cards = Object.values(productsSection.nodes).filter((node) => node.type === "store-product-card")
  assert.equal(cards.length, 4)
  assert.ok(cards.every((card) => card.props.treatment === "horizontal"))
  assert.ok(cards.some((card) => card.props.imageUrl === "https://cdn.example.invalid/tablet.jpg"), "authoritative media survives")
  assert.equal(productsSection.nodes[productsSection.rootId].props.commerceComposition, "product-rail")
  assert.equal(productsSection.nodes[productsSection.rootId].props.commerceVisualFinish, "pce-3c")
  assert.equal(productsSection.nodes[productsSection.rootId].props.commerceSectionScale, "standard")
  assert.ok(Object.values(productsSection.nodes).some((node) => node.displayName === "Etiqueta products" && node.props.content === "Selección rápida"), "commerce sections include finish-aware framing")
  assert.ok(wrappersOf(productsSection).some((node) => String(node.props.className ?? "").includes("overflow-x-auto") && String(node.props.className ?? "").includes("pr-[12vw]")), "product rail has discovery depth and edge continuation")
  assert.ok(cards.some((card) => String(card.props.className ?? "").includes("lg:min-w-[28rem]")), "product rail gives the first item focal width")

  const categorySection = composeSection("content", {
    commerceMerchandisingComposition: "category-spotlight",
    commerceCategoryLinks: [
      { label: "Tecnología", href: "page:categoria-tecnologia", imageUrl: "https://cdn.example.invalid/tech.jpg" },
      { label: "Hogar", href: "page:categoria-hogar" },
    ],
    themePalette: { primary: "#1794CC", secondary: "#0E5C80", background: "#f8fbff", text: "#0A3E57", accent: "#1BB3FA" },
  })
  assert.ok(categorySection)
  assert.equal(categorySection.nodes[categorySection.rootId].props.commerceComposition, "category-spotlight")
  assert.equal(categorySection.nodes[categorySection.rootId].props.commerceVisualFinish, "pce-3c")
  assert.equal(categorySection.nodes[categorySection.rootId].props.commerceSectionScale, "spacious")
  assert.ok(wrappersOf(categorySection).some((node) => node.props.dataCommerceCategoryCard === "pce-3c"), "category cards carry professional finish metadata")
  assert.ok(wrappersOf(categorySection).some((node) => String(node.props.className ?? "").includes("lg:row-span-2")), "category spotlight has a dominant anchor card")
  assert.ok(Object.values(categorySection.nodes).some((node) => node.type === "image" && node.props.src === "https://cdn.example.invalid/tech.jpg"), "category card uses representative media when present")
  assert.ok(Object.values(categorySection.nodes).some((node) => node.type === "ctaButton" && node.props.href === "page:categoria-hogar"), "category links remain generated page links")
})


test("composer: PCE-3C depth gives featured, editorial, dense and alternating compositions distinct hierarchy", () => {
  const records = buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1).slice(0, 5)
  const products = bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, records)
  const themePalette = { primary: "#1794CC", secondary: "#0E5C80", background: "#f8fbff", text: "#0A3E57", accent: "#1BB3FA" }

  const featured = composeSection("products", { products, commerceMerchandisingComposition: "featured-plus-grid", commerceSurfaces: true, themePalette })
  assert.ok(featured)
  assert.equal(featured.nodes[featured.rootId].props.commerceSectionScale, "statement")
  assert.ok(wrappersOf(featured).some((node) => node.displayName === "Featured header"), "featured section integrates header/action rather than a loose grid")
  assert.ok(wrappersOf(featured).some((node) => String(node.props.className ?? "").includes("lg:pt-14")), "supporting products are visually subordinate")

  const editorial = composeSection("products", { products, commerceMerchandisingComposition: "editorial-collection", commerceSurfaces: true, themePalette })
  assert.ok(editorial)
  assert.ok(wrappersOf(editorial).some((node) => node.displayName === "Producto editorial principal" && String(node.props.className ?? "").includes("row-span-2")), "editorial collection promotes one product as an editorial anchor")
  assert.ok(wrappersOf(editorial).some((node) => String(node.props.className ?? "").includes("lg:sticky")), "editorial narrative column differs from grid structure")

  const dense = composeSection("products", { products, commerceMerchandisingComposition: "dense-catalog", commerceSurfaces: true, themePalette })
  assert.ok(dense)
  assert.equal(dense.nodes[dense.rootId].props.commerceSectionScale, "compact")
  assert.ok(wrappersOf(dense).some((node) => node.displayName === "Dense catalog header"), "dense catalog keeps compact scannable header/action")

  const alternating = composeSection("products", { products, commerceMerchandisingComposition: "alternating-story", commerceSurfaces: true, themePalette })
  assert.ok(alternating)
  assert.ok(wrappersOf(alternating).some((node) => String(node.props.className ?? "").includes("md:mr-auto md:w-[78%]")))
  assert.ok(wrappersOf(alternating).some((node) => String(node.props.className ?? "").includes("md:ml-auto md:w-[78%]")))
})

test("builder: same NovaMarket facts produce three materially different commerce visual structures offline", async () => {
  const conservative = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("conservative-commerce") },
  })
  const editorial = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce") },
  })
  const catalog = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("catalog-heavy-commerce") },
  })

  const signatures = [conservative, editorial, catalog].map(commerceSignature)
  assert.equal(new Set(signatures.map((entry) => entry.signature)).size, 3)
  assert.ok(signatures.some((entry) => entry.compositions.includes("featured-plus-grid")))
  // CF-1: compositions report what RENDERS -- the editorial variant is split/passage-led (it never truly rendered editorial-collection/alternating-story).
  assert.ok(signatures.some((entry) => ["editorial-collection", "alternating-story", "editorial-split", "mirror-split", "editorial-passage"].some((kind) => entry.compositions.includes(kind))))
  assert.ok(signatures.some((entry) => entry.compositions.includes("dense-catalog")))
  assert.ok(signatures.flatMap((entry) => entry.treatments).includes("featured"))
  assert.ok(signatures.flatMap((entry) => entry.treatments).includes("horizontal"))
  assert.ok(signatures.flatMap((entry) => entry.treatments).includes("compact-catalog"))
})

test("builder: deterministic catalog home avoids repeated identical product grids", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketMockExecutableBuilderInputV1())
  const home = run.plan.pages.find((page) => page.slug === "home")!
  const commerceSections = sectionNodesOf(home.tree).filter((node) => node.props.commerceComposition)
  assert.ok(commerceSections.every((node) => node.props.commerceVisualFinish === "pce-3c"), "commerce sections preserve the professional finish marker")
  assert.ok(commerceSections.some((node) => node.props.commerceSectionScale === "statement"), "home rhythm includes at least one statement commerce section")
  assert.ok(commerceSections.some((node) => node.props.commerceSectionScale === "compact"), "home rhythm includes a deliberately dense catalog section")
  const compositions = commerceSections.map((node) => node.props.commerceComposition).filter(Boolean)
  assert.ok(compositions.includes("featured-plus-grid"), JSON.stringify(compositions))
  assert.ok(compositions.includes("dense-catalog"), JSON.stringify(compositions))
  const treatments = storeCardsOf(home.tree).map((node) => node.props.treatment).filter(Boolean)
  assert.ok(treatments.includes("featured") || treatments.includes("image-led"), JSON.stringify(treatments))
  assert.ok(treatments.includes("compact-catalog"), JSON.stringify(treatments))
  assert.equal(networkAttempts, 0)
})
