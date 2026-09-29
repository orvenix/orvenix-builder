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

// COMMERCE-3C: zero Anthropic / Pexels / Mercado Pago / network / DB.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-3C test: network is forbidden")
}) as typeof fetch

import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { validateEditorTreeSafety } from "../../lib/orvenix-ai/safety"
import { isValidSectionInstancePlan, type SectionInstancePlan } from "../../lib/orvenix-ai/architect/composition-plan"
import { buildNovaMarketNewStorePreviewInputV1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { createCommerceTestingBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import { normalizeMediaIntentV1, normalizeNarrativeIntentV1 } from "../../lib/orvenix-ai/full-site-generation/creative-intent"
import type { FullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import type { EditorNode, EditorTree } from "../../types/editor"

// ---------------------------------------------------------------- helpers

type Blueprint = FullSiteCreativeBlueprintV1
const editorial = () => structuredClone(createCommerceTestingBlueprintV1("editorial-commerce")) as Blueprint
const catalog = () => structuredClone(createCommerceTestingBlueprintV1("catalog-heavy-commerce")) as Blueprint

async function build(blueprint: unknown): Promise<AutonomousMultiPageSiteBuilderResult> {
  return runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), commerceArchitecture: { mode: "mock-ai", proposal: blueprint } })
}

async function buildDeterministic(): Promise<AutonomousMultiPageSiteBuilderResult> {
  return runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
}

function ordered(tree: EditorTree, rootId = tree.rootId): EditorNode[] {
  const out: EditorNode[] = []
  const walk = (id: string) => {
    const node = tree.nodes[id] as EditorNode | undefined
    if (!node) return
    out.push(node)
    node.children.forEach(walk)
  }
  walk(rootId)
  return out
}

function page(run: AutonomousMultiPageSiteBuilderResult, slug: string) {
  const found = run.plan.pages.find((entry) => entry.slug === slug)
  assert.ok(found, `page ${slug} exists (have ${run.plan.pages.map((entry) => entry.slug).join(",")})`)
  return found!
}

function nav(tree: EditorTree): EditorNode {
  return ordered(tree).find((node) => node.type === "siteNav")!
}

/** Root-level sections of a page, each with the nodes of its subtree. */
function sections(tree: EditorTree) {
  const root = tree.nodes[tree.rootId] as EditorNode
  return root.children.map((id) => ({ root: tree.nodes[id] as EditorNode, nodes: ordered(tree, id) }))
}

function productSections(tree: EditorTree) {
  return sections(tree).filter((section) => section.nodes.some((node) => node.type === "store-product-card"))
}

function headingOf(section: { nodes: EditorNode[] }): string | undefined {
  return section.nodes.find((node) => node.type === "heading")?.props.text as string | undefined
}

/** The wrapper that directly holds the store cards (the validated plan does not keep displayName, so match structurally). */
function gridClass(section: { nodes: EditorNode[] }): string | undefined {
  const cardIds = new Set(section.nodes.filter((node) => node.type === "store-product-card").map((node) => node.id))
  return section.nodes.find((node) => node.type === "genericWrapper" && node.children.some((child) => cardIds.has(child)))?.props.className as string | undefined
}

function ctas(tree: EditorTree) {
  return ordered(tree).filter((node) => node.type === "ctaButton").map((node) => ({ label: node.props.label as string, href: node.props.href as string }))
}

function instances(run: AutonomousMultiPageSiteBuilderResult, slug: string): SectionInstancePlan[] {
  return run.architecture.pages.find((entry) => entry.slug === slug)!.sections.map((section) => section.instance).filter((instance): instance is SectionInstancePlan => Boolean(instance))
}

function allPageHrefs(run: AutonomousMultiPageSiteBuilderResult): string[] {
  const hrefs: string[] = []
  for (const entry of run.plan.pages) {
    for (const node of ordered(entry.tree)) {
      if (typeof node.props.href === "string") hrefs.push(node.props.href)
      for (const link of (node.props.pages as Array<{ href?: string }> | undefined) ?? []) if (link.href) hrefs.push(link.href)
    }
  }
  return hrefs.filter((href) => href.startsWith("page:"))
}

function assertValid(run: AutonomousMultiPageSiteBuilderResult) {
  const validation = validateSiteCreationPlanV2(run.plan, { maxPages: 12, maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
  for (const entry of run.plan.pages) assert.equal(validateEditorTreeSafety(entry.tree).safe, true, entry.slug)
}

/** Grounded product facts carried by every rendered card, keyed by product name (must be identical across blueprints). */
function cardFacts(run: AutonomousMultiPageSiteBuilderResult) {
  const facts = new Map<string, string>()
  for (const entry of run.plan.pages) for (const node of ordered(entry.tree)) {
    if (node.type === "store-product-card") facts.set(String(node.props.productName), JSON.stringify({ price: node.props.priceMxn, compare: node.props.comparePriceMxn ?? null, stock: node.props.stock, variant: node.props.variantName, ref: node.props.provisioningRef }))
  }
  return facts
}

function homeSpotlight(blueprint: Blueprint) {
  return blueprint.pages[0].sections.find((section) => section.intent === "spotlight")!
}

function homeCollection(blueprint: Blueprint) {
  return blueprint.pages[0].sections.find((section) => section.intent === "collection")!
}

// ---------------------------------------------------------------- 0) link integrity (fixes the "/"-slug dead-link defect)

test("links: every generated page: href (nav, CTAs, category links) targets a REAL generated page -- deterministic and AI", async () => {
  for (const run of [await buildDeterministic(), await build(editorial()), await build(catalog())]) {
    const slugs = new Set(run.plan.pages.map((entry) => entry.slug))
    const hrefs = allPageHrefs(run)
    assert.ok(hrefs.length > 0)
    for (const href of hrefs) assert.ok(slugs.has(href.slice("page:".length)), `dead internal link ${href}`)
    for (const entry of run.plan.pages) {
      const navLinks = ((nav(entry.tree).props.pages as Array<{ slug: string }>) ?? []).map((link) => link.slug)
      assert.equal(navLinks.some((slug) => slug.startsWith("producto-")), false, `${entry.slug}: product-detail pages never flood the primary nav`)
    }
    assertValid(run)
  }
})

// ---------------------------------------------------------------- 1) navigation

test("navigation.concept survives to SiteNav: editorial -> centered-editorial, catalog-forward -> split, classic -> classic", async () => {
  const layouts: Record<string, string | undefined> = {}
  for (const concept of ["editorial", "catalog-forward", "classic"] as const) {
    const blueprint = editorial()
    blueprint.navigation = { ...blueprint.navigation, concept }
    const run = await build(blueprint)
    layouts[concept] = nav(page(run, "home").tree).props.navLayout as string | undefined
  }
  assert.deepEqual(layouts, { editorial: "centered-editorial", "catalog-forward": "split", classic: "classic" })
})

test("navigation.primaryPurposes select and order the SiteNav links (only generated pages, product detail excluded)", async () => {
  const a = catalog()
  a.navigation = { ...a.navigation, primaryPurposes: ["home", "catalog"] }
  const b = catalog()
  b.navigation = { ...b.navigation, primaryPurposes: ["home", "category", "catalog", "product_detail"] }
  const linksA = ((nav(page(await build(a), "home").tree).props.pages as Array<{ slug: string }>)).map((link) => link.slug)
  const linksB = ((nav(page(await build(b), "home").tree).props.pages as Array<{ slug: string }>)).map((link) => link.slug)
  assert.deepEqual(linksA, ["home", "productos"])
  assert.deepEqual(linksB, ["home", "categoria-tecnologia", "categoria-audio", "productos"])
})

// ---------------------------------------------------------------- 2) narrative

test("page.narrativeGoal changes the framing of sections that carry no narrative of their own", async () => {
  const a = editorial()
  a.pages[0].narrativeGoal = "Presentacion minima y sobria"
  const b = editorial()
  b.pages[0].narrativeGoal = "Construir confianza con informacion clara"
  for (const blueprint of [a, b]) for (const section of blueprint.pages[0].sections) delete section.narrative
  const collectionA = productSections(page(await build(a), "home").tree).find((section) => section.nodes.filter((node) => node.type === "store-product-card").length === 3)!
  const collectionB = productSections(page(await build(b), "home").tree).find((section) => section.nodes.filter((node) => node.type === "store-product-card").length === 3)!
  assert.equal(headingOf(collectionA), "Productos")
  assert.equal(headingOf(collectionB), "Compra con información clara")
})

test("section.narrative (free text) is classified into a closed intent and reframes the section", async () => {
  const a = editorial()
  homeCollection(a).narrative = "Descubrir la coleccion por categoria"
  const b = editorial()
  homeCollection(b).narrative = "Llevar a la compra"
  const headingA = productSections(page(await build(a), "home").tree).map(headingOf)
  const headingB = productSections(page(await build(b), "home").tree).map(headingOf)
  assert.ok(headingA.includes("Explora por categoría"), headingA.join("|"))
  assert.ok(headingB.includes("Elige tu producto"), headingB.join("|"))
  assert.equal(normalizeNarrativeIntentV1("editorial-story"), "editorial-story", "exact vocabulary token")
  assert.equal(normalizeNarrativeIntentV1("zzz"), undefined, "unclassifiable prose is advisory, never rendered")
})

// ---------------------------------------------------------------- 3) media

test("section.mediaIntent changes the visual share of the product section", async () => {
  const a = editorial()
  homeCollection(a).mediaIntent = "producto dominante"
  homeCollection(a).layout = { kind: "card-grid" }
  const b = editorial()
  homeCollection(b).mediaIntent = "minimal"
  homeCollection(b).layout = { kind: "card-grid" }
  const pick = (run: AutonomousMultiPageSiteBuilderResult) => productSections(page(run, "home").tree).find((section) => section.nodes.filter((node) => node.type === "store-product-card").length === 3)!
  const gridA = gridClass(pick(await build(a)))
  const gridB = gridClass(pick(await build(b)))
  assert.equal(gridA, "grid gap-8 sm:grid-cols-2")
  assert.equal(gridB, "grid gap-4 sm:grid-cols-2 lg:grid-cols-4")
  assert.equal(normalizeMediaIntentV1("fondo"), "supporting", "unsupported 'background' media degrades to supporting (documented)")
})

// ---------------------------------------------------------------- 4) CTA

test("section.ctaIntent resolves to REAL Orvenix actions (or none) -- never provider hrefs", async () => {
  const a = editorial()
  homeSpotlight(a).ctaIntent = "buy"
  a.pages[0].sections.find((section) => section.intent === "closing")!.ctaIntent = "browse"
  const b = editorial()
  homeSpotlight(b).ctaIntent = "none"
  b.pages[0].sections.find((section) => section.intent === "closing")!.ctaIntent = "none"
  const runA = await build(a)
  const runB = await build(b)
  const ctaA = ctas(page(runA, "home").tree)
  const ctaB = ctas(page(runB, "home").tree)
  assert.ok(ctaA.some((cta) => cta.label === "Ver producto" && cta.href === "page:producto-bocina-portatil-pulse"))
  assert.equal(ctaB.some((cta) => cta.href === "page:producto-bocina-portatil-pulse"), false, "ctaIntent none removes that spotlight's action")
  const closingA = sections(page(runA, "home").tree).at(-2)!
  const closingB = sections(page(runB, "home").tree).at(-2)!
  assert.equal(closingA.nodes.filter((node) => node.type === "ctaButton").length, 1)
  assert.equal(closingB.nodes.filter((node) => node.type === "ctaButton").length, 0)
  for (const cta of [...ctaA, ...ctaB]) assert.match(cta.href, /^page:[a-z0-9-]+$/)
})

// ---------------------------------------------------------------- 5) emphasis / density / rhythm / relation

test("section.emphasis changes bounded scale (section width / spacing)", async () => {
  const a = editorial()
  homeCollection(a).emphasis = "heroic"
  const b = editorial()
  homeCollection(b).emphasis = "quiet"
  const scaleA = instances(await build(a), "home").find((instance) => instance.role === "products" && instance.selection.mode === "subset")!.composition?.scale
  const runB = await build(b)
  const scaleB = instances(runB, "home").find((instance) => instance.role === "products" && instance.selection.mode === "subset")!.composition?.scale
  assert.equal(scaleA, "large")
  assert.equal(scaleB, "condensed")
  const quietSection = productSections(page(runB, "home").tree).find((section) => section.nodes.filter((node) => node.type === "store-product-card").length === 3)!
  assert.deepEqual({ maxWidth: quietSection.root.props.maxWidth, paddingY: quietSection.root.props.paddingY }, { maxWidth: "lg", paddingY: "lg" })
})

test("siteConcept.density and page.density (page wins) change grid density through layout rhythm", async () => {
  const rhythmOf = async (blueprint: Blueprint) => instances(await build(blueprint), "productos").find((instance) => instance.role === "products")!.composition?.layout?.rhythm
  const rich = catalog()
  delete rich.pages[1].density
  rich.pages[1].sections.find((section) => section.intent === "catalog_surface")!.layout = { kind: "card-grid" }
  const minimal = structuredClone(rich)
  minimal.siteConcept.density = "minimal"
  const pageOverride = structuredClone(minimal)
  pageOverride.pages[1].density = "compact"
  assert.equal(await rhythmOf(rich), "compact", "site rich -> compact")
  assert.equal(await rhythmOf(minimal), "spacious", "site minimal -> spacious")
  assert.equal(await rhythmOf(pageOverride), "compact", "page density overrides site density")
})

test("siteConcept.rhythm 'varied' alternates consecutive split sections; 'calm' keeps them aligned", async () => {
  const splits = async (rhythm: Blueprint["siteConcept"]["rhythm"]) => {
    const blueprint = editorial()
    blueprint.siteConcept.rhythm = rhythm
    homeCollection(blueprint).layout = { kind: "editorial-split" } // authored: three same-side splits
    return instances(await build(blueprint), "home").filter((instance) => instance.composition?.layout?.kind === "editorial-split" || instance.composition?.layout?.kind === "mirror-split").map((instance) => Boolean(instance.composition?.layout?.mirror) || instance.composition?.layout?.kind === "mirror-split")
  }
  const varied = await splits("varied")
  const calm = await splits("calm")
  assert.ok(varied.length >= 3)
  assert.deepEqual(varied, [false, true, false], "varied alternates sides")
  assert.deepEqual(calm, [false, false, false], "calm keeps the authored alignment")
})

test("section.relationToPrevious 'contrast' / 'continuous' change the section tone (background)", async () => {
  // PCE-2: still three distinct tones, now derived from the site theme instead of fixed navy.
  let themeBackground: string | undefined
  const backgroundOf = async (relation: "standard" | "contrast" | "continuous") => {
    const blueprint = editorial()
    homeCollection(blueprint).relationToPrevious = relation
    const run = await build(blueprint)
    themeBackground = run.plan.theme.colors?.background?.toLowerCase()
    return productSections(page(run, "home").tree).find((section) => section.nodes.filter((node) => node.type === "store-product-card").length === 3)!.root.props.background
  }
  const tones = [await backgroundOf("standard"), await backgroundOf("contrast"), await backgroundOf("continuous")]
  assert.equal(new Set(tones).size, 3, "each relation is a materially different surface")
  assert.equal(tones[0], themeBackground, "standard = continuous with the page's own theme background")
  for (const legacy of ["#0f172a", "#020617", "#111827"]) assert.equal(tones.includes(legacy), false, `no fixed commerce navy ${legacy}`)
})

// ---------------------------------------------------------------- 6) full EditorTree difference

function siteSignature(run: AutonomousMultiPageSiteBuilderResult) {
  return {
    pageCount: run.plan.pages.length,
    purposes: run.architecture.pages.map((entry) => entry.purpose),
    sectionOrder: run.plan.pages.map((entry) => sections(entry.tree).map((section) => `${section.root.type}:${section.root.props.background ?? ""}`).join(">")),
    nodeTypes: Object.entries(run.plan.pages.flatMap((entry) => ordered(entry.tree)).reduce<Record<string, number>>((acc, node) => ({ ...acc, [node.type]: (acc[node.type] ?? 0) + 1 }), {})).sort(),
    layouts: run.plan.pages.flatMap((entry) => productSections(entry.tree).map((section) => gridClass(section) ?? "-")),
    nav: run.plan.pages.map((entry) => `${nav(entry.tree).props.navLayout}:${((nav(entry.tree).props.pages as Array<{ slug: string }>) ?? []).length}`),
    grouping: run.plan.pages.map((entry) => productSections(entry.tree).map((section) => section.nodes.filter((node) => node.type === "store-product-card").length).join("+")),
    ctaActions: [...new Set(run.plan.pages.flatMap((entry) => ctas(entry.tree).map((cta) => cta.label)))].sort(),
    mediaBearing: run.plan.pages.map((entry) => ordered(entry.tree).filter((node) => node.type === "image").length),
    storeCardPlacement: run.plan.pages.map((entry) => sections(entry.tree).map((section, index) => (section.nodes.some((node) => node.type === "store-product-card") ? index : -1)).filter((index) => index >= 0).join(",")),
  }
}

test("EDITOR_TREE_CREATIVE_DIFFERENCE: same NovaMarket facts, editorial vs catalog blueprint -> materially different trees", async () => {
  const editorialRun = await build(editorial())
  const catalogRun = await build(catalog())
  assertValid(editorialRun)
  assertValid(catalogRun)
  const a = siteSignature(editorialRun)
  const b = siteSignature(catalogRun)
  const differing = (Object.keys(a) as Array<keyof typeof a>).filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
  for (const key of ["purposes", "layouts", "nav", "grouping", "storeCardPlacement", "nodeTypes"] as const) assert.ok(differing.includes(key), `expected ${key} to differ`)
  // Facts stay authoritative: every product rendered in both sites carries identical price/stock/variant facts.
  const factsA = cardFacts(editorialRun)
  const factsB = cardFacts(catalogRun)
  for (const [name, facts] of factsA) if (factsB.has(name)) assert.equal(factsB.get(name), facts, name)
  assert.deepEqual(editorialRun.plan.commerce?.provisioning, catalogRun.plan.commerce?.provisioning, "the provisioning plan (prices/stock/SKU) is identical")
})

test("PRODUCT_DETAIL: same product facts, editorial vs compact blueprint -> different composition", async () => {
  const withDetail = (sections: Blueprint["pages"][number]["sections"]) => {
    const blueprint = editorial()
    blueprint.pages = [blueprint.pages[0], blueprint.pages[1], { purpose: "product_detail", target: { kind: "product", index: 17 }, sections }]
    return blueprint
  }
  const editorialDetail = withDetail([
    { intent: "opening", role: "hero", emphasis: "heroic", layout: { kind: "oversized-typography" } },
    { intent: "detail_surface", role: "products", refs: [{ kind: "product", index: 17 }], mediaIntent: "dominant", narrative: "editorial-story", layout: { kind: "editorial-split", rhythm: "spacious" } },
    { intent: "related_items", role: "products", refs: [{ kind: "category", key: "audio" }], layout: { kind: "card-grid" } },
    { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
  ])
  const compactDetail = withDetail([
    { intent: "detail_surface", role: "products", refs: [{ kind: "product", index: 17 }], mediaIntent: "minimal", emphasis: "quiet", layout: { kind: "card-grid" } },
    { intent: "related_items", role: "products", refs: [{ kind: "category", key: "audio" }], mediaIntent: "minimal", layout: { kind: "card-grid", rhythm: "compact" } },
    { intent: "closing", role: "cta" },
  ])
  const slug = "producto-bocina-portatil-pulse"
  const a = page(await build(editorialDetail), slug)
  const b = page(await build(compactDetail), slug)
  const shape = (tree: EditorTree) => sections(tree).map((section) => `${section.root.type}|${section.root.props.maxWidth}|${section.root.props.paddingY}|${gridClass(section) ?? "-"}`)
  assert.notDeepEqual(shape(a.tree), shape(b.tree))
  const mainCard = (tree: EditorTree) => {
    const card = ordered(tree).find((node) => node.type === "store-product-card" && node.props.productName === "Bocina portátil Pulse")!
    return { price: card.props.priceMxn, stock: card.props.stock, variant: card.props.variantName, ref: card.props.provisioningRef }
  }
  assert.deepEqual(mainCard(a.tree), mainCard(b.tree), "identical authoritative product facts")
  const related = (tree: EditorTree) => productSections(tree).slice(1).flatMap((section) => section.nodes.filter((node) => node.type === "store-product-card").map((node) => node.props.productName))
  assert.equal(related(a.tree).includes("Bocina portátil Pulse"), false, "a product is never 'related' to itself")
})

// ---------------------------------------------------------------- 6b) advisory boundary + representational ceiling

test("PCE-2: navigation.cartProminence is consumed ONLY as the bounded siteNav cart treatment (everything else identical)", async () => {
  const shapeOf = async (cartProminence: "none" | "prominent") => {
    const blueprint = editorial()
    blueprint.navigation = { ...blueprint.navigation, cartProminence }
    const run = await build(blueprint)
    return {
      navProminence: run.plan.pages.map((entry) => nav(entry.tree).props.cartProminence),
      rest: run.plan.pages.map((entry) => ordered(entry.tree).map((node) => `${node.type}:${JSON.stringify({ ...node.props, provisioningRef: undefined, cartProminence: undefined })}`).join("|")),
    }
  }
  const quiet = await shapeOf("none")
  const loud = await shapeOf("prominent")
  assert.ok(quiet.navProminence.every((value) => value === "none"))
  assert.ok(loud.navProminence.every((value) => value === "prominent"))
  assert.deepEqual(quiet.rest, loud.rest, "no other node or prop changes")
})

test("ceiling: a single-product store blueprint renders a product-led site within the current commerce runtime", async () => {
  const input = buildNovaMarketNewStorePreviewInputV1()
  const oneProduct = { ...input, business: { ...input.business, products: input.business.products.slice(0, 1) } }
  const blueprint: Blueprint = {
    ...editorial(),
    siteConcept: { narrative: "product-led", rhythm: "calm", density: "minimal" },
    navigation: { concept: "compact" },
    pages: [
      { purpose: "home", sections: [
        { intent: "opening", role: "hero", emphasis: "heroic", layout: { kind: "oversized-typography" } },
        { intent: "spotlight", role: "products", refs: [{ kind: "product", index: 0 }], mediaIntent: "dominant", ctaIntent: "buy", layout: { kind: "editorial-split" } },
        { intent: "closing", role: "cta", ctaIntent: "buy" },
      ] },
      { purpose: "catalog", sections: [{ intent: "catalog_surface", role: "products", layout: { kind: "card-grid" } }] },
      { purpose: "product_detail", target: { kind: "product", index: 0 }, sections: [{ intent: "detail_surface", role: "products", refs: [{ kind: "product", index: 0 }], layout: { kind: "editorial-split", rhythm: "spacious" } }] },
    ],
  }
  const run = await runAutonomousMultiPageSiteBuilder({ ...oneProduct, commerceArchitecture: { mode: "mock-ai", proposal: blueprint } })
  assertValid(run)
  assert.deepEqual(run.plan.pages.map((entry) => entry.slug), ["home", "productos", "producto-tablet-nova-10"])
  const home = page(run, "home").tree
  assert.deepEqual(((nav(home).props.pages as Array<{ slug: string }>)).map((link) => link.slug), ["home", "productos"], "compact concept -> minimal nav")
  assert.ok(ctas(home).some((cta) => cta.href === "page:producto-tablet-nova-10"))
  assert.equal(productSections(home).length, 1)
})

// ---------------------------------------------------------------- 7) copy hallucination audit

const UNSUPPORTED_CLAIMS = /\b((el|la|los|las|lo) mejor(es)?|#1|n[uú]mero uno|premium|calidad|env[ií]o gratis|gratis|garantiz|garant[ií]a|devoluci|m[aá]s vendid|popular|rese[ñn]a|descuento|oferta|rebaja|origen|hecho a mano|artesanal|material(es)?|100%|oficial)\b/i

test("copy audit: no rendered string makes an unsupported factual claim (quality, shipping, returns, warranty, popularity, discounts...)", async () => {
  const product = new Set(buildNovaMarketNewStorePreviewInputV1().business.products.flatMap((entry) => [entry.name, entry.description ?? "", entry.category ?? ""]))
  for (const run of [await buildDeterministic(), await build(editorial()), await build(catalog())]) {
    for (const entry of run.plan.pages) {
      for (const node of ordered(entry.tree)) {
        for (const key of ["text", "content", "label", "title", "subtitle"]) {
          const value = node.props[key]
          if (typeof value !== "string" || product.has(value)) continue
          assert.equal(UNSUPPORTED_CLAIMS.test(value), false, `${entry.slug}/${node.type}.${key}: "${value}"`)
        }
      }
    }
  }
})

// ---------------------------------------------------------------- 8) hostile creative propagation

const HOSTILE_VALUES = ["javascript:alert(1)", "https://evil.example/x", "<div class=\"x\">", "style=position:fixed", "<script>alert(1)</script>", "React.createElement(Evil)", "page:../../admin"]

test("hostile: malicious narrative/mediaIntent/ctaIntent/emphasis/density/rhythm/concept never reach the tree", async () => {
  const cases: Array<[string, (blueprint: Blueprint) => void]> = []
  for (const value of HOSTILE_VALUES) {
    cases.push([`narrative ${value}`, (bp) => { homeCollection(bp).narrative = value }])
    cases.push([`mediaIntent ${value}`, (bp) => { homeCollection(bp).mediaIntent = value }])
    cases.push([`narrativeGoal ${value}`, (bp) => { bp.pages[0].narrativeGoal = value }])
  }
  cases.push(["ctaIntent", (bp) => { homeCollection(bp).ctaIntent = "javascript:alert(1)" as never }])
  cases.push(["emphasis", (bp) => { homeCollection(bp).emphasis = "className:fixed" as never }])
  cases.push(["relation", (bp) => { homeCollection(bp).relationToPrevious = "https://evil.example" as never }])
  cases.push(["page density", (bp) => { bp.pages[0].density = "url(evil)" as never }])
  cases.push(["site density", (bp) => { bp.siteConcept.density = "<b>" as never }])
  cases.push(["rhythm", (bp) => { bp.siteConcept.rhythm = "style" as never }])
  cases.push(["nav concept", (bp) => { bp.navigation.concept = "https://evil.example" as never }])
  cases.push(["nav purposes", (bp) => { bp.navigation.primaryPurposes = ["home", "https://evil.example" as never, "../admin" as never] }])
  cases.push(["component key", (bp) => { (homeCollection(bp) as unknown as Record<string, unknown>).component = "Evil" }])

  for (const [name, mutate] of cases) {
    const blueprint = editorial()
    mutate(blueprint)
    const run = await build(blueprint)
    const serialized = JSON.stringify(run.plan)
    for (const marker of ["javascript:", "evil.example", "<script", "position:fixed", "createElement", "className:fixed", "url(evil)", "../admin", "Evil"]) {
      assert.equal(serialized.includes(marker), false, `${name}: "${marker}" leaked`)
    }
    for (const href of allPageHrefs(run)) assert.ok(run.plan.pages.some((entry) => `page:${entry.slug}` === href), `${name}: ${href}`)
    assertValid(run)
  }
})

test("hostile: the composition carrier itself rejects unsafe CTA/category/narrative values", () => {
  const base = { id: "x", role: "products" as const, selection: { mode: "all" as const }, provenance: "deterministic" as const }
  const ok = (composition: Record<string, unknown>) => isValidSectionInstancePlan({ ...base, composition })
  assert.equal(ok({ ctaAction: { label: "Ver catálogo", href: "page:productos" } }), true)
  for (const href of ["https://evil.example", "javascript:alert(1)", "#contacto", "page:../admin", "page:producto/x", "page:"]) assert.equal(ok({ ctaAction: { label: "Ver catálogo", href } }), false, href)
  assert.equal(ok({ ctaAction: { label: "Compra ya y gana", href: "page:productos" } }), false, "labels are a closed vocabulary")
  assert.equal(ok({ categoryLinks: [{ label: "<b>x</b>", href: "page:categoria-audio" }] }), false)
  assert.equal(ok({ categoryLinks: [{ label: "Audio", href: "https://evil.example" }] }), false)
  assert.equal(ok({ narrativeIntent: "rewrite the page" }), false)
  assert.equal(ok({ omitCta: "yes" }), false)
  assert.equal(ok({ narrativeIntent: "editorial-story", categoryLinks: [{ label: "Audio", href: "page:categoria-audio" }], omitCta: true }), true)
})

test("zz) zero network attempts across the COMMERCE-3C suite", () => {
  assert.equal(networkAttempts, 0)
})
