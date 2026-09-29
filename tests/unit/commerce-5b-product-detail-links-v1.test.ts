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

// COMMERCE-5B: offline only. Credentials are deleted (never read); fetch is a counting tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-5B test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import {
  buildNovaMarketMockExecutableBuilderInputV1,
  runNovaMarketFullSiteDryRunV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import {
  createCommerceTestingBlueprintV1,
  createDeterministicFullSiteCreativeTestingProviderV1,
} from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import { adaptFullSiteCreativeBlueprintToCommercePlanV1 } from "../../lib/orvenix-ai/full-site-generation/commerce-adapter"
import { toSupportedBuilderProductsV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import {
  isValidSectionInstancePlan,
  selectGroundedIndexes,
  selectGroundedItems,
  type SectionInstancePlan,
} from "../../lib/orvenix-ai/architect/composition-plan"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import {
  buildCartItemFromProductCardV1,
  resolveProductCardDetailHrefV1,
} from "../../components/editor/blocks/store/product-card-binding"
import type { EditorNode } from "../../types/editor"

type Run = AutonomousMultiPageSiteBuilderResult

const nodesOf = (page: Run["plan"]["pages"][number]) => Object.values(page.tree.nodes as Record<string, EditorNode>)
const cardsOf = (page: Run["plan"]["pages"][number]) => nodesOf(page).filter((node) => node.type === "store-product-card")

function hrefsOf(value: unknown, out: Array<{ key: string; href: string }> = []): Array<{ key: string; href: string }> {
  if (Array.isArray(value)) value.forEach((entry) => hrefsOf(entry, out))
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && (key === "href" || key.endsWith("Href"))) out.push({ key, href: entry })
      else hrefsOf(entry, out)
    }
  }
  return out
}

/** Detail pages by product name (the adapter names a detail page after its exact product). */
function detailPagesByProductName(run: Run): Map<string, string> {
  const commercePages = new Set(run.plan.pages.filter((page) => page.slug.startsWith("producto-")).map((page) => page.slug))
  return new Map(run.plan.pages.filter((page) => commercePages.has(page.slug)).map((page) => [page.name, page.slug]))
}

interface DetailAudit {
  total: number
  withTarget: number
  withoutTarget: number
  invalidTargets: string[]
  missingTargets: string[]
  deadInternalLinks: string[]
  deadAnchorCtas: string[]
}

function auditRun(run: Run): DetailAudit {
  const universe = new Set(run.plan.pages.map((page) => page.slug))
  const details = detailPagesByProductName(run)
  const audit: DetailAudit = { total: 0, withTarget: 0, withoutTarget: 0, invalidTargets: [], missingTargets: [], deadInternalLinks: [], deadAnchorCtas: [] }
  for (const page of run.plan.pages) {
    for (const card of cardsOf(page)) {
      audit.total += 1
      const name = String(card.props.productName)
      const expected = details.get(name)
      const detailHref = card.props.detailHref
      if (typeof detailHref === "string") {
        audit.withTarget += 1
        const slug = detailHref.replace(/^page:/, "")
        if (!detailHref.startsWith("page:") || !universe.has(slug) || slug === page.slug || slug !== expected) audit.invalidTargets.push(`${page.slug}:${name}->${detailHref}`)
      } else {
        audit.withoutTarget += 1
        if (expected && expected !== page.slug) audit.missingTargets.push(`${page.slug}:${name}`)
      }
    }
    for (const node of nodesOf(page)) {
      for (const { href } of hrefsOf(node.props)) {
        if (href.startsWith("page:") && !universe.has(href.slice(5) || "home")) audit.deadInternalLinks.push(`${page.slug}:${href}`)
      }
      if (node.type === "siteNav" && node.props.showCta !== false && typeof node.props.ctaHref === "string" && node.props.ctaHref.startsWith("#")) {
        audit.deadAnchorCtas.push(`${page.slug}:${node.props.ctaHref}`)
      }
    }
  }
  return audit
}

async function dryRuns(): Promise<Array<{ label: string; run: Run }>> {
  const runs: Array<{ label: string; run: Run }> = []
  for (const mode of ["deterministic", "mock-editorial", "mock-catalog"] as const) {
    const result = await runNovaMarketFullSiteDryRunV1({ mode })
    assert.equal(result.status, "completed")
    if (result.status === "completed") runs.push({ label: mode, run: result.run })
  }
  return runs
}

async function executableRun(): Promise<Run> {
  return runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketMockExecutableBuilderInputV1(),
    commerceArchitecture: { provider: createDeterministicFullSiteCreativeTestingProviderV1("editorial-commerce") },
  })
}

// --- offline NovaMarket regression ---

test("NovaMarket offline: every card for a product with a detail page links to exactly that page; others get no invented target", async () => {
  for (const { label, run } of await dryRuns()) {
    const audit = auditRun(run)
    assert.ok(audit.total > 0, `${label}: has product cards`)
    assert.ok(audit.withTarget > 0, `${label}: some cards link to detail`)
    assert.deepEqual(audit.invalidTargets, [], `${label}: invalid detail targets`)
    assert.deepEqual(audit.missingTargets, [], `${label}: missing authoritative targets`)
    assert.deepEqual(audit.deadInternalLinks, [], `${label}: dead internal links`)
  }
})

test("Add to Cart preserved: bound cards keep productId/variantId and still build a cart item alongside detailHref", async () => {
  const run = await executableRun()
  const audit = auditRun(run)
  assert.deepEqual(audit.invalidTargets, [])
  let linkedAndBuyable = 0
  for (const page of run.plan.pages) {
    for (const card of cardsOf(page)) {
      assert.equal(typeof card.props.productId, "string")
      assert.equal(typeof card.props.variantId, "string")
      if (card.props.stock !== 0) assert.ok(buildCartItemFromProductCardV1(card.props), `${page.slug}: card still adds to cart`)
      if (typeof card.props.detailHref === "string" && card.props.stock !== 0) linkedAndBuyable += 1
    }
  }
  assert.ok(linkedAndBuyable > 0, "a card can both open detail and add to cart")
})

test("no self-links: a detail page never links a card (related or own) to itself", async () => {
  for (const { run } of [...(await dryRuns()), { run: await executableRun() }]) {
    for (const page of run.plan.pages) {
      for (const card of cardsOf(page)) assert.notEqual(card.props.detailHref, `page:${page.slug}`)
    }
  }
})

test("nav CTA: never a '#contacto' anchor on a commerce site -- a grounded help page action or omitted", async () => {
  for (const { label, run } of [...(await dryRuns()), { label: "executable", run: await executableRun() }]) {
    const audit = auditRun(run)
    assert.deepEqual(audit.deadAnchorCtas, [], label)
    const hasHelp = run.plan.pages.some((page) => page.slug === "help")
    for (const page of run.plan.pages) {
      const nav = nodesOf(page).find((node) => node.type === "siteNav")
      if (!nav) continue
      if (hasHelp && page.slug !== "help") assert.deepEqual([nav.props.ctaHref, nav.props.ctaLabel, nav.props.showCta], ["page:help", "Ver ayuda", true], `${label}:${page.slug}`)
      else assert.equal(nav.props.showCta, false, `${label}:${page.slug}`)
    }
  }
})

test("nav CTA with a real help page: every other page's CTA opens help; the help page itself omits it", async () => {
  const withHelp = createCommerceTestingBlueprintV1("editorial-commerce") as { pages: unknown[] }
  withHelp.pages.push({ purpose: "help", sections: [{ intent: "opening", role: "hero" }, { intent: "trust", role: "trust" }] })
  const run = await runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketMockExecutableBuilderInputV1(),
    commerceArchitecture: { provider: { generate: async () => withHelp } },
  })
  assert.ok(run.plan.pages.some((page) => page.slug === "help"), "help page generated")
  const audit = auditRun(run)
  assert.deepEqual(audit.deadAnchorCtas, [])
  assert.deepEqual(audit.deadInternalLinks, [])
  for (const page of run.plan.pages) {
    const nav = nodesOf(page).find((node) => node.type === "siteNav")
    assert.ok(nav, page.slug)
    if (page.slug === "help") assert.equal(nav.props.showCta, false)
    else assert.deepEqual([nav.props.ctaHref, nav.props.ctaLabel, nav.props.showCta], ["page:help", "Ver ayuda", true], page.slug)
  }
})

test("category nav policy preserved: at most 4 primary category links, every nav link resolves", async () => {
  for (const { label, run } of await dryRuns()) {
    const universe = new Set(run.plan.pages.map((page) => page.slug))
    for (const page of run.plan.pages) {
      const nav = nodesOf(page).find((node) => node.type === "siteNav")
      const links = (nav?.props.pages as Array<{ slug: string; href?: string }> | undefined) ?? []
      assert.ok(links.filter((link) => link.slug.startsWith("categoria-")).length <= 4, `${label}:${page.slug}`)
      for (const link of links) assert.ok(universe.has(link.slug), `${label}:${page.slug}:${link.slug}`)
    }
  }
})

test("no viewer route leakage: generated trees never contain dev viewer paths", async () => {
  for (const { run } of await dryRuns()) {
    for (const page of run.plan.pages) assert.equal(JSON.stringify(page.tree).includes("/dev-assisted-generation-e2e"), false)
  }
})

// --- authority / contract ---

test("hostile blueprint: provider-authored href fields are rejected, never become detail targets", () => {
  const products = toSupportedBuilderProductsV1()
  const clean = adaptFullSiteCreativeBlueprintToCommercePlanV1({ blueprint: createCommerceTestingBlueprintV1("editorial-commerce"), products })
  assert.equal(clean.ok, true)
  for (const key of ["href", "detailHref", "productDetailLinks"]) {
    const hostile = createCommerceTestingBlueprintV1("editorial-commerce") as { pages: Array<{ sections: Array<Record<string, unknown>> }> }
    hostile.pages[1].sections[0][key] = key === "productDetailLinks" ? [{ productIndex: 0, href: "https://evil.example" }] : "https://evil.example"
    assert.equal(adaptFullSiteCreativeBlueprintToCommercePlanV1({ blueprint: hostile, products }).ok, false, key)
  }
})

function productsInstance(links: unknown, selection: SectionInstancePlan["selection"] = { mode: "subset", indexes: [2, 0, 5] }): SectionInstancePlan {
  return { id: "p:products:0", role: "products", selection, composition: { productDetailLinks: links as never }, provenance: "deterministic" }
}

test("CompositionPlan validator: productDetailLinks accepts only page:<slug> targets keyed by unique integer indexes", () => {
  assert.equal(isValidSectionInstancePlan(productsInstance([{ productIndex: 0, href: "page:producto-a" }])), true)
  for (const bad of [
    [{ productIndex: 0, href: "https://evil.example" }],
    [{ productIndex: 0, href: "javascript:alert(1)" }],
    [{ productIndex: 0, href: "/producto-a" }],
    [{ productIndex: 0, href: "page:../x" }],
    [{ productIndex: 0, href: "#contacto" }],
    [{ productIndex: -1, href: "page:a" }],
    [{ productIndex: 1.5, href: "page:a" }],
    [{ productIndex: 0, href: "page:a" }, { productIndex: 0, href: "page:b" }],
    [{ productIndex: 0, href: "page:a", label: "x" }],
    "page:a",
  ]) {
    assert.equal(isValidSectionInstancePlan(productsInstance(bad)), false, JSON.stringify(bad))
  }
})

test("exact identity mapping: detail hrefs align with the SELECTED products by source index, never by position or name", () => {
  const products = ["A", "B", "C", "D", "E", "F"].map((name) => ({ name }))
  const instance = productsInstance([{ productIndex: 0, href: "page:producto-a" }, { productIndex: 5, href: "page:producto-f" }, { productIndex: 3, href: "page:producto-d" }])
  const context = applySectionInstanceToContext({ products }, instance)
  assert.deepEqual(context.products?.map((product) => product.name), ["C", "A", "F"])
  assert.deepEqual(context.commerceProductDetailHrefs, [undefined, "page:producto-a", "page:producto-f"])
  // no targets for the selection -> field absent (no invented links)
  const none = applySectionInstanceToContext({ products }, productsInstance([{ productIndex: 3, href: "page:producto-d" }]))
  assert.equal(none.commerceProductDetailHrefs, undefined)
  // non-products roles never receive product detail targets
  const hero = applySectionInstanceToContext({ products }, { ...productsInstance([{ productIndex: 0, href: "page:producto-a" }]), role: "hero" })
  assert.equal(hero.commerceProductDetailHrefs, undefined)
})

test("selectGroundedIndexes mirrors selectGroundedItems exactly", () => {
  const source = ["a", "b", "c", "d"]
  for (const selection of [
    { mode: "all" as const },
    { mode: "single-item" as const, itemIndex: 2 },
    { mode: "single-item" as const, itemIndex: 9 },
    { mode: "subset" as const, indexes: [3, 1, 3, -1, 7, 0] },
  ]) {
    assert.deepEqual(selectGroundedIndexes(source.length, selection).map((index) => source[index]), selectGroundedItems(source, selection))
  }
})

// --- ProductCard runtime contract ---

test("ProductCard detail href: canonical page: resolves like every internal link; hostile/unknown values render no link", () => {
  assert.equal(resolveProductCardDetailHrefV1("site-1", "page:producto-a", "published"), "/p/site-1/producto-a")
  assert.equal(resolveProductCardDetailHrefV1("site-1", "page:producto-a", "preview"), "/preview/site-1?page=producto-a")
  assert.equal(resolveProductCardDetailHrefV1("site-1", "page:producto-a", "export"), "/producto-a/index.html")
  assert.equal(resolveProductCardDetailHrefV1(null, "page:producto-a", "preview"), null, "no site -> no dead link")
  assert.equal(resolveProductCardDetailHrefV1("site-1", "/dev-assisted-generation-e2e/view/assisted/producto-a", "preview"), "/dev-assisted-generation-e2e/view/assisted/producto-a")
  for (const hostile of [undefined, "", 42, "https://evil.example", "//evil.example", "javascript:alert(1)", "mailto:a@b.c", "#contacto", "/\\evil"]) {
    assert.equal(resolveProductCardDetailHrefV1("site-1", hostile, "published"), null, String(hostile))
  }
})

test("ProductCard markup: detail links never wrap the Add to Cart button or another interactive element", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/editor/blocks/store/ProductCard.tsx"), "utf8")
  const render = source.slice(source.indexOf("export function ProductCard"))
  const blocks = [...render.matchAll(/<ProductDetailLink\b[\s\S]*?<\/ProductDetailLink>/g)].map((match) => match[0])
  assert.equal(blocks.length, 2, "image + title")
  for (const block of blocks) {
    assert.equal(/<button\b|<a\b|<ProductDetailLink\b[\s\S]*<ProductDetailLink\b|onClick=/.test(block.replace(/^<ProductDetailLink\b/, "")), false)
  }
  assert.ok(render.indexOf("</ProductDetailLink>", render.lastIndexOf("<ProductDetailLink")) < render.indexOf("<button"), "button is outside every link")
  assert.match(source, /tabIndex=\{-1\} ariaHidden/, "image link is a pointer-only duplicate of the title link")
})

test("zz) zero network attempts across the COMMERCE-5B suite", () => {
  assert.equal(networkAttempts, 0)
})
