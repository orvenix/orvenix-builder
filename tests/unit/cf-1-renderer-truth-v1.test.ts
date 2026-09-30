import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import Module from "node:module"

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

// CF-1 is fully offline. Credentials are deleted and fetch is a tripwire.
delete process.env.ANTHROPIC_API_KEY
delete process.env.GEMINI_API_KEY
delete process.env.PEXELS_API_KEY
let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("CF-1 test: network is forbidden")
}) as typeof fetch

// tailwindcss (a declared dependency) ships ESM-only typings; load its CJS build explicitly.
type TailwindCompilerV4 = { build: (candidates: string[]) => string }
const loadModule = Module.createRequire(path.join(process.cwd(), "package.json"))
const { compile } = loadModule("tailwindcss") as {
  compile: (css: string, options: { base: string; loadStylesheet: (id: string, base: string) => Promise<{ path: string; base: string; content: string }> }) => Promise<TailwindCompilerV4>
}
import { composeSection } from "../../lib/orvenix-ai/composer/section-composer"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import { ROLE_VISUAL_LAYOUT_VOCABULARY, type VisualLayoutKind } from "../../lib/orvenix-ai/composer/visual-layout-plan"
import type { ComposedSection, SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import type { SectionRole } from "../../lib/orvenix-ai/architect"
import type { SectionInstancePlan } from "../../lib/orvenix-ai/architect/composition-plan"
import { bindStoreProductRecordsV1, type CommerceProductFactV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import {
  buildFullSiteCommerceCapabilityManifestV1,
  FULL_SITE_LAYOUT_EQUIVALENTS_BY_ROLE_V1,
  FULL_SITE_LAYOUT_IGNORED_ROLES_V1,
  FULL_SITE_MERCHANDISING_BY_ROLE_V1,
  FULL_SITE_RHYTHM_EFFECTS_V1,
} from "../../lib/orvenix-ai/full-site-generation/capability-manifest"
import { createCommerceTestingBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/testing-provider"
import { adaptFullSiteCreativeBlueprintToCommercePlanV1 } from "../../lib/orvenix-ai/full-site-generation/commerce-adapter"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { buildNovaMarketNewStorePreviewInputV1, DISABLED_ASSET_PROVIDER_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import type { FullSiteCreativeBlueprintProviderV1, FullSiteCreativeBlueprintV1 } from "../../lib/orvenix-ai/full-site-generation/contract"
import type { EditorNode, EditorTree } from "../../types/editor"

const GLOBALS_CSS = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8")
const PRODUCTS: CommerceProductFactV1[] = bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, buildNovaMarketMockStoreRecordsV1().slice(0, 6))
const PALETTE = { primary: "#1794CC", secondary: "#0E5C80", background: "#f8fbff", text: "#0A3E57", accent: "#1BB3FA" }
const CATEGORY_LINKS = [
  { label: "Audio", href: "page:categoria-audio", imageUrl: "https://cdn.example.invalid/a.jpg" },
  { label: "Hogar", href: "page:categoria-hogar" },
]
const PRODUCTS_MERCHANDISING = FULL_SITE_MERCHANDISING_BY_ROLE_V1.products as readonly string[]
/** Marker classes that intentionally generate no CSS of their own. */
const MARKER_CLASSES = new Set(["group"])

function instance(role: SectionRole, composition: NonNullable<SectionInstancePlan["composition"]>, selection: SectionInstancePlan["selection"] = { mode: "all" }): SectionInstancePlan {
  return { id: "x", role, selection, composition, provenance: "deterministic" }
}

function compose(role: SectionRole, base: SectionCompositionContext, plan: SectionInstancePlan): ComposedSection | null {
  return composeSection(role, applySectionInstanceToContext(base, plan))
}

// ─── Deterministic inventory of classes the composer really emits ─────────────

type Inventory = { tokens: Set<string>; classNames: Set<string>; composed: number }

let inventoryCache: Inventory | null = null
function composerInventory(): Inventory {
  if (inventoryCache) return inventoryCache
  const tokens = new Set<string>()
  const classNames = new Set<string>()
  let composed = 0
  const roles: SectionRole[] = ["hero", "services", "products", "features", "content", "testimonials", "gallery", "contact", "cta", "trust", "pricing", "process", "faq", "footer", "navigation"] as SectionRole[]
  const merchandising = [undefined, ...(FULL_SITE_MERCHANDISING_BY_ROLE_V1.products as readonly string[]), ...(FULL_SITE_MERCHANDISING_BY_ROLE_V1.content as readonly string[])]
  const treatments = [undefined, "compact-catalog", "editorial", "image-led", "featured", "horizontal"] as const
  for (const role of roles) {
    for (const commerce of [false, true]) {
      const base: SectionCompositionContext = {
        businessName: "NovaMarket",
        themePalette: PALETTE,
        richComposition: true,
        ...(commerce ? { products: PRODUCTS, commerceSurfaces: true, commerceCategoryLinks: CATEGORY_LINKS } : {}),
      }
      const layouts = [undefined, ...(ROLE_VISUAL_LAYOUT_VOCABULARY[role] ?? [])]
      const commerceProducts = commerce && role === "products"
      for (const layout of layouts) for (const scale of [undefined, "large", "condensed"] as const) for (const media of [undefined, "led", "none", "supporting"] as const) for (const tone of [undefined, "contrast-led", "soft-rhythm"] as const)
        for (const merch of commerce && (role === "products" || role === "content") ? merchandising : [undefined])
          for (const treatment of commerceProducts ? treatments : [undefined])
            for (const selection of commerceProducts ? [{ mode: "all" as const }, { mode: "single-item" as const, itemIndex: 0 }, { mode: "subset" as const, indexes: [0, 1] }] : [{ mode: "all" as const }]) {
              const composition = {
                ...(layout ? { layout: { kind: layout } } : {}),
                ...(scale ? { scale } : {}),
                ...(media ? { mediaStrategy: media } : {}),
                ...(tone ? { backgroundStrategy: tone } : {}),
                ...(merch ? { merchandisingComposition: merch } : {}),
                ...(treatment ? { productCardTreatment: treatment } : {}),
              } as NonNullable<SectionInstancePlan["composition"]>
              const section = compose(role, base, instance(role, composition, selection))
              if (!section) continue
              composed += 1
              for (const node of Object.values(section.nodes)) {
                const className = node.props?.className
                if (typeof className !== "string" || !className.trim()) continue
                classNames.add(className.trim())
                for (const token of className.split(/\s+/)) if (token) tokens.add(token)
              }
            }
    }
  }
  inventoryCache = { tokens, classNames, composed }
  return inventoryCache
}

/** Every file Tailwind scans according to the @source directives (source(none) = nothing implicit). */
function scannedSourceText(sources: readonly string[]): string {
  const files: string[] = []
  const walk = (entry: string) => {
    if (!fs.existsSync(entry)) return
    const stat = fs.statSync(entry)
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(entry)) if (child !== "node_modules" && !child.startsWith(".")) walk(path.join(entry, child))
    } else if (/\.(tsx?|jsx?|css|html|mdx?)$/.test(entry)) files.push(entry)
  }
  for (const source of sources) walk(path.resolve(process.cwd(), "app", source))
  return files.map((file) => fs.readFileSync(file, "utf8")).join("\n")
}

function literallyPresent(text: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(^|[\\s"'\`])${escaped}(?=[\\s"'\`]|$)`, "m").test(text)
}

const SOURCES = [...GLOBALS_CSS.matchAll(/@source "([^"]+)";/g)].map((match) => match[1])

// ─── 1. CSS truth invariant ────────────────────────────────────────────────────

test("Tailwind source truth: explicit, narrow @source coverage of the AI visual generation modules", () => {
  assert.match(GLOBALS_CSS, /@import "tailwindcss" source\(none\);/, "no implicit repo-wide scanning")
  for (const source of ["../lib/orvenix-ai/composer", "../lib/orvenix-ai/section", "../lib/orvenix-ai/commerce", "../lib/commerce/dynamic-product-detail-tree.ts"]) {
    assert.ok(SOURCES.includes(source), source)
  }
  for (const source of SOURCES) {
    assert.doesNotMatch(source, /node_modules|\.tmp|webs de pruebas|tests|\.next|^\.\.\/?$|^\.\.\/lib\/?$/, `${source} must stay narrow`)
  }
})

test("CSS truth: EVERY class the composer emits compiles to real CSS and is visible to Tailwind", async () => {
  const { tokens, composed } = composerInventory()
  assert.ok(composed > 10_000 && tokens.size > 100, `matrix covered ${composed} compositions / ${tokens.size} classes`)

  const tailwindBase = path.dirname(loadModule.resolve("tailwindcss/package.json"))
  const compiler = await compile('@import "tailwindcss";', {
    base: process.cwd(),
    loadStylesheet: async (id: string, base: string) => {
      const file = id === "tailwindcss" ? path.join(tailwindBase, "index.css") : path.resolve(base, id)
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") }
    },
  })
  let previous = compiler.build([]).length
  const noCss: string[] = []
  for (const token of [...tokens].sort()) {
    const length = compiler.build([token]).length
    if (length <= previous && !MARKER_CLASSES.has(token)) noCss.push(token)
    previous = length
  }
  assert.deepEqual(noCss, [], "composer emits classes Tailwind cannot generate")

  const scanned = scannedSourceText(SOURCES)
  const invisible = [...tokens].filter((token) => !literallyPresent(scanned, token)).sort()
  assert.deepEqual(invisible, [], "composer emits classes no @source file contains literally (dynamic class construction?)")
})

test("root cause guard: the pre-CF-1 sources would silently drop the audited composer geometry", () => {
  const { tokens } = composerInventory()
  const audited = [
    "lg:grid-cols-[0.72fr_0.28fr]", "lg:grid-cols-[0.68fr_1.32fr]", "lg:row-span-2", "md:w-[78%]", "md:ml-auto", "md:mr-auto",
    "snap-x", "snap-start", "pr-[12vw]", "sm:min-w-[24rem]", "lg:min-w-[28rem]", "sm:min-w-[18rem]", "lg:top-24", "lg:pt-14", "lg:auto-rows-fr", "md:grid-cols-[1fr_auto]",
  ]
  for (const token of audited) assert.ok(tokens.has(token), `${token} is really emitted by the composer`)
  const before = scannedSourceText(["./", "../components", "../blocks", "../templates"])
  const after = scannedSourceText(SOURCES)
  const droppedBefore = audited.filter((token) => !literallyPresent(before, token))
  assert.ok(droppedBefore.length >= 10, `pre-CF-1 would drop: ${droppedBefore.join(" ")}`)
  assert.deepEqual(audited.filter((token) => !literallyPresent(after, token)), [])
})

// ─── 2. Responsive safety ──────────────────────────────────────────────────────

test("responsive safety: desktop geometry is breakpoint-gated; narrow screens never get fixed wide columns or visual reordering", () => {
  const { tokens, classNames } = composerInventory()
  const geometry = /^(grid-cols-\[|col-span-|row-span-|w-\[\d|min-w-\[\d|ml-auto$|mr-auto$|-?translate-|scale-)/
  const ungated = [...tokens].filter((token) => geometry.test(token))
  for (const token of ungated) {
    // Only decorative, absolutely-positioned, non-interactive layers may carry fixed sizes ungated.
    const owners = [...classNames].filter((className) => className.split(/\s+/).includes(token))
    assert.ok(owners.every((className) => /\babsolute\b/.test(className) && /\bpointer-events-none\b/.test(className)), `${token} ungated on: ${owners.join(" || ")}`)
  }
  // Rail minimums below sm are capped to the viewport.
  assert.ok(tokens.has("min-w-[min(20rem,85vw)]") && tokens.has("min-w-[min(16.5rem,72vw)]"))
  assert.equal([...tokens].some((token) => token === "min-w-[20rem]" || token === "min-w-[16.5rem]"), false)
  // DOM order is reading order: no CSS reordering anywhere in composer output.
  assert.deepEqual([...tokens].filter((token) => /(^|:)order-/.test(token)), [])
  // Horizontal rails scroll inside their own container.
  assert.ok([...classNames].some((className) => className.includes("overflow-x-auto") && className.includes("snap-x")))
})

// ─── 3. Merchandising precedence truth ─────────────────────────────────────────

const STRUCTURE_MARKER: Record<string, string> = {
  "featured-plus-grid": "Featured plus grid",
  "product-rail": "Rail productos tienda",
  "editorial-collection": "Coleccion editorial",
  "alternating-story": "Historias alternadas",
  "editorial-split": "Split products",
  "mirror-split": "Split products",
  "editorial-passage": "Grid productos tienda",
}

function productsBase(): SectionCompositionContext {
  return { businessName: "NovaMarket", products: PRODUCTS, commerceSurfaces: true, themePalette: PALETTE }
}

test("merchandising precedence: one structural owner, and the reported composition is what renders", () => {
  const displayNames = (section: ComposedSection) => Object.values(section.nodes).map((node) => node.displayName)
  const reported = (section: ComposedSection) => section.nodes[section.rootId].props.commerceComposition as string

  // Explicit multi-product merchandising owns the structure over a generic split.
  for (const merch of PRODUCTS_MERCHANDISING) {
    for (const split of ["editorial-split", "mirror-split"] as const) {
      const section = compose("products", productsBase(), instance("products", { layout: { kind: split }, merchandisingComposition: merch as never }, { mode: "subset", indexes: [0, 1, 2] }))!
      assert.equal(reported(section), merch, `${split}+${merch}`)
      if (STRUCTURE_MARKER[merch]) assert.ok(displayNames(section).includes(STRUCTURE_MARKER[merch]), `${split}+${merch} renders ${merch}`)
      assert.ok(!displayNames(section).includes("Split products"), `${split}+${merch} does not ALSO render a split`)
    }
  }
  // A single product keeps the split and says so.
  const single = compose("products", productsBase(), instance("products", { layout: { kind: "editorial-split" }, merchandisingComposition: "editorial-collection", narrativeIntent: "product-led" }, { mode: "single-item", itemIndex: 0 }))!
  assert.equal(reported(single), "editorial-split")
  assert.ok(displayNames(single).includes("Split products"))
  const eyebrow = Object.values(single.nodes).find((node) => node.displayName === "Etiqueta products")!
  assert.equal(eyebrow.props.content, "Producto destacado", "single-product label, never 'Colección editorial'")

  // category-spotlight is not a products composition: never reported by a products section.
  const spotlight = compose("products", productsBase(), instance("products", { merchandisingComposition: "category-spotlight" }, { mode: "subset", indexes: [0, 1, 2] }))!
  assert.equal(reported(spotlight), "default")
  // featured-plus-grid needs lead + support.
  const lonely = compose("products", productsBase(), instance("products", { merchandisingComposition: "featured-plus-grid" }, { mode: "single-item", itemIndex: 0 }))!
  assert.notEqual(reported(lonely), "featured-plus-grid")

  // Across the whole matrix: every reported structure is actually present.
  const { tokens } = composerInventory()
  assert.ok(tokens.size > 0)
  for (const merch of [undefined, ...PRODUCTS_MERCHANDISING, "category-spotlight"]) for (const layout of [undefined, "card-grid", "editorial-split", "mirror-split", "editorial-passage", "oversized-typography"] as const) for (const selection of [{ mode: "single-item" as const, itemIndex: 0 }, { mode: "subset" as const, indexes: [0, 1, 2, 3] }]) {
    const section = compose("products", productsBase(), instance("products", { ...(layout ? { layout: { kind: layout } } : {}), ...(merch ? { merchandisingComposition: merch as never } : {}) }, selection))!
    const composition = reported(section)
    if (STRUCTURE_MARKER[composition]) assert.ok(displayNames(section).includes(STRUCTURE_MARKER[composition]), `${merch}/${layout}/${selection.mode} reports ${composition}`)
  }

  // Category cards report only what they implement.
  const cards = compose("content", { ...productsBase(), commerceCategoryLinks: CATEGORY_LINKS }, instance("content", { merchandisingComposition: "product-rail" }))!
  assert.equal(reported(cards), "category-cards")
})

// ─── 4. Blueprint-level truth (adapter / architecture / copy) ──────────────────

async function buildFromBlueprint(blueprint: unknown) {
  const provider: FullSiteCreativeBlueprintProviderV1 = { async generate() { return structuredClone(blueprint) } }
  return runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), assetProvider: DISABLED_ASSET_PROVIDER_V1, commerceArchitecture: { provider } })
}

function rootSections(tree: EditorTree): EditorNode[] {
  return (tree.nodes[tree.rootId]?.children ?? []).map((id) => tree.nodes[id]).filter(Boolean)
}

/** Pre-order (document order) walk. */
function subtree(tree: EditorTree, id: string): EditorNode[] {
  const node = tree.nodes[id]
  return node ? [node, ...node.children.flatMap((child) => subtree(tree, child))] : []
}

function headingOf(tree: EditorTree, section: EditorNode): string | undefined {
  return subtree(tree, section.id).find((node) => node.type === "heading")?.props.text as string | undefined
}

test("editorial_passage: grounded refs survive as a real editorial passage; ref-less passages are honestly benefits", async () => {
  const blueprint = createCommerceTestingBlueprintV1("editorial-commerce") as FullSiteCreativeBlueprintV1
  const catalog = bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, buildNovaMarketMockStoreRecordsV1())
  const adapted = adaptFullSiteCreativeBlueprintToCommercePlanV1({ blueprint, products: catalog })
  assert.ok(adapted.ok)
  const home = adapted.ok ? adapted.plan.pages.find((page) => page.purpose === "home")! : null
  const passage = home!.sections[2]
  assert.equal(passage.type, "product_collection")
  assert.equal(passage.role, "products")
  assert.deepEqual(passage.layout, { kind: "editorial-passage" })
  assert.ok((passage.productIndexes?.length ?? 0) > 0, "category refs resolved to real products")
  assert.equal(passage.category, "Audio")

  const refless = structuredClone(blueprint)
  delete refless.pages[0].sections[2].refs
  const adaptedRefless = adaptFullSiteCreativeBlueprintToCommercePlanV1({ blueprint: refless, products: catalog })
  assert.ok(adaptedRefless.ok)
  if (adaptedRefless.ok) {
    assert.equal(adaptedRefless.plan.pages.find((page) => page.purpose === "home")!.sections[2].type, "commerce_benefits")
    assert.ok(adaptedRefless.warnings.some((warning) => warning.includes("editorial_passage sin refs")))
  }

  // Compiled: the passage renders the audio products under their category, not "Por que elegirnos".
  const run = await buildFromBlueprint(blueprint)
  const tree = run.plan.pages.find((page) => page.slug === "home")!.tree
  const sections = rootSections(tree)
  const passageSection = sections.find((section) => section.props.commerceComposition === "editorial-passage")!
  assert.ok(passageSection, "an editorial-passage products section exists")
  assert.equal(headingOf(tree, passageSection), "Audio")
  assert.ok(subtree(tree, passageSection.id).some((node) => node.type === "store-product-card"))
  assert.equal(sections.filter((section) => headingOf(tree, section) === "Por que elegirnos").length, 1, "only the real benefits section")
  assert.equal(networkAttempts, 0)
})

test("fallback copy semantics: a featured subset is never labelled as the whole catalog; the catalog surface still is", async () => {
  const run = await buildFromBlueprint(createCommerceTestingBlueprintV1("catalog-heavy-commerce"))
  const home = run.plan.pages.find((page) => page.slug === "home")!.tree
  const featured = rootSections(home).find((section) => section.props.commerceComposition === "featured-plus-grid")!
  assert.ok(featured)
  assert.notEqual(headingOf(home, featured), "Catálogo")
  assert.equal(headingOf(home, featured), "Productos destacados")
  const catalog = run.plan.pages.find((page) => page.slug === "productos")!.tree
  assert.ok(rootSections(catalog).some((section) => headingOf(catalog, section) === "Catálogo"))
})

// ─── 5. Capability truth ───────────────────────────────────────────────────────

function signature(section: ComposedSection | null): string {
  if (!section) return "null"
  const walk = (id: string): string => {
    const node = section.nodes[id]
    const props = node.props ?? {}
    return `${node.type}[${props.className ?? ""}|${props.maxWidth ?? ""}|${props.paddingY ?? ""}|${props.size ?? ""}|${props.align ?? ""}|${props.variant ?? ""}](${node.children.map(walk).join(",")})`
  }
  return walk(section.rootId)
}

test("layout truth: advertised layouts render distinctly; declared equivalents render identically; ignored roles ignore layout", () => {
  const manifest = buildFullSiteCommerceCapabilityManifestV1()
  const base: SectionCompositionContext = { ...productsBase(), commerceCategoryLinks: CATEGORY_LINKS }
  const render = (role: SectionRole, kind: VisualLayoutKind) => signature(compose(role, base, instance(role, { layout: { kind } })))
  for (const [role, kinds] of Object.entries(manifest.layoutsByRole) as Array<[SectionRole, readonly VisualLayoutKind[]]>) {
    const signatures = kinds.map((kind) => render(role, kind))
    assert.equal(new Set(signatures).size, kinds.length, `${role}: every advertised layout is distinct (${kinds.join(",")})`)
    for (const [alias, canonical] of Object.entries(FULL_SITE_LAYOUT_EQUIVALENTS_BY_ROLE_V1[role] ?? {})) {
      assert.equal(render(role, alias as VisualLayoutKind), render(role, canonical as VisualLayoutKind), `${role}: ${alias} ≡ ${canonical}`)
      assert.ok(!kinds.includes(alias as VisualLayoutKind), `${role}: alias ${alias} is not advertised`)
    }
    // Every kind the validator accepts is either advertised or a declared alias.
    for (const kind of ROLE_VISUAL_LAYOUT_VOCABULARY[role] ?? []) {
      assert.ok(kinds.includes(kind) || Boolean(FULL_SITE_LAYOUT_EQUIVALENTS_BY_ROLE_V1[role]?.[kind]), `${role}:${kind} accounted for`)
    }
  }
  for (const role of FULL_SITE_LAYOUT_IGNORED_ROLES_V1) {
    assert.equal(manifest.layoutsByRole[role], undefined)
    const signatures = (ROLE_VISUAL_LAYOUT_VOCABULARY[role] ?? []).map((kind) => render(role, kind))
    assert.equal(new Set(signatures).size, 1, `${role} ignores layout`)
  }
})

test("rhythm truth: values advertised as effect-less really change nothing; effective values really act", async () => {
  assert.equal(FULL_SITE_RHYTHM_EFFECTS_V1.calm, null)
  assert.equal(FULL_SITE_RHYTHM_EFFECTS_V1.dense, null)
  assert.equal(FULL_SITE_RHYTHM_EFFECTS_V1.immersive, null, "only marks the (scale-ignoring) hero opening heroic")
  assert.ok(FULL_SITE_RHYTHM_EFFECTS_V1.varied)
  const withRhythm = (rhythm: FullSiteCreativeBlueprintV1["siteConcept"]["rhythm"]) => {
    const blueprint = createCommerceTestingBlueprintV1("editorial-commerce") as FullSiteCreativeBlueprintV1
    blueprint.siteConcept.rhythm = rhythm
    // Same-side consecutive splits, so "varied" has something to alternate
    // (the stock editorial fixture already alternates explicitly).
    for (const section of blueprint.pages[0].sections) if (section.layout?.kind === "mirror-split") section.layout = { kind: "editorial-split" }
    return blueprint
  }
  const shape = async (rhythm: FullSiteCreativeBlueprintV1["siteConcept"]["rhythm"]) => {
    const run = await buildFromBlueprint(withRhythm(rhythm))
    return JSON.stringify(run.plan.pages.map((page) => rootSections(page.tree).map((section) => subtree(page.tree, section.id).map((node) => `${node.type}:${node.props.className ?? ""}:${node.props.commerceComposition ?? ""}:${node.props.maxWidth ?? ""}`))))
  }
  const [calm, dense, varied, immersive] = await Promise.all([shape("calm"), shape("dense"), shape("varied"), shape("immersive")])
  assert.equal(calm, dense, "calm and dense render identically (advertised as no own effect)")
  assert.equal(immersive, calm, "immersive renders identically (advertised as no own effect)")
  assert.notEqual(varied, calm, "varied alternates split sides")

  // The hero really ignores emphasis/scale (why immersive is effect-less).
  const { FULL_SITE_EMPHASIS_IGNORED_ROLES_V1 } = await import("../../lib/orvenix-ai/full-site-generation/capability-manifest")
  assert.deepEqual([...FULL_SITE_EMPHASIS_IGNORED_ROLES_V1], ["hero"])
  const heroBase: SectionCompositionContext = { businessName: "NovaMarket", themePalette: PALETTE }
  const hero = (scale?: "large" | "condensed") => signature(compose("hero", heroBase, instance("hero", scale ? { scale } : {})))
  assert.equal(hero("large"), hero())
  assert.equal(hero("condensed"), hero())
  // ...while scale does act on roles that advertise emphasis.
  assert.notEqual(signature(compose("products", productsBase(), instance("products", { scale: "condensed" }, { mode: "subset", indexes: [0, 1, 2] }))), signature(compose("products", productsBase(), instance("products", {}, { mode: "subset", indexes: [0, 1, 2] }))))
})

test("navigation truth: each concept's advertised rendered layout and default links match what SiteNav receives; overlay is never advertised", async () => {
  const manifest = buildFullSiteCommerceCapabilityManifestV1()
  for (const [concept, effect] of Object.entries(manifest.navigationConceptEffects)) {
    const blueprint = createCommerceTestingBlueprintV1("catalog-heavy-commerce") as FullSiteCreativeBlueprintV1
    blueprint.navigation = { concept: concept as never }
    const run = await buildFromBlueprint(blueprint)
    const home = run.plan.pages.find((page) => page.slug === "home")!.tree
    const nav = Object.values(home.nodes).find((node) => node.type === "siteNav")!
    assert.equal(nav.props.navLayout, effect.renderedLayout, `${concept} renders ${effect.renderedLayout}`)
    const slugs = (nav.props.pages as Array<{ slug: string }>).map((page) => page.slug)
    const expected = new Set(effect.defaultPrimaryPurposes.flatMap((purpose) => purpose === "home" ? ["home"] : purpose === "catalog" ? ["productos"] : []))
    for (const slug of expected) assert.ok(slugs.includes(slug), `${concept} links ${slug}`)
    assert.equal(slugs.some((slug) => slug.startsWith("categoria-")), effect.defaultPrimaryPurposes.includes("category"), `${concept} category links`)
  }
  const rendered = Object.values(manifest.navigationConceptEffects).map((effect) => effect.renderedLayout)
  assert.equal(rendered.includes("overlay" as never), false)
  assert.equal(JSON.stringify(manifest).includes("navigation-overlay"), false)
})

test("prompt carries the capability truth (no silent no-op escape valve)", async () => {
  const { buildFullSiteCreativeSystemPromptV1 } = await import("../../lib/orvenix-ai/full-site-generation/anthropic-provider")
  const prompt = buildFullSiteCreativeSystemPromptV1()
  assert.match(prompt, /calm=sin efecto propio; dense=sin efecto propio/)
  assert.match(prompt, /immersive=sin efecto propio/)
  assert.match(prompt, /role:"hero" la ignora/)
  assert.match(prompt, /compact=layout classic/)
  assert.match(prompt, /conversion-led=layout split/)
  assert.match(prompt, /role:"content" ignora layout/)
  assert.match(prompt, /role:"products": featured-plus-grid \| product-rail \| editorial-collection \| alternating-story \| dense-catalog; role:"content": category-spotlight/)
  assert.doesNotMatch(prompt, /expresala con narrative, mediaIntent, emphasis, relationToPrevious, density o rhythm/)
})

// ─── 6. Regressions ────────────────────────────────────────────────────────────

test("PCE-3C composition regression: the three testing blueprints still render the full commerce vocabulary", async () => {
  const compositions = new Set<string>()
  const treatments = new Set<string>()
  for (const mode of ["conservative-commerce", "editorial-commerce", "catalog-heavy-commerce"] as const) {
    const run = await buildFromBlueprint(createCommerceTestingBlueprintV1(mode))
    for (const page of run.plan.pages) {
      for (const section of rootSections(page.tree)) if (section.props.commerceComposition) compositions.add(String(section.props.commerceComposition))
      for (const node of Object.values(page.tree.nodes)) if (node.type === "store-product-card") treatments.add(String(node.props.treatment))
    }
  }
  for (const composition of ["featured-plus-grid", "product-rail", "dense-catalog", "category-cards", "editorial-split", "mirror-split", "editorial-passage"]) assert.ok(compositions.has(composition), composition)
  for (const treatment of ["featured", "compact-catalog", "horizontal"]) assert.ok(treatments.has(treatment), treatment)
  assert.equal(networkAttempts, 0)
})

test("non-commerce regression: a service business builds with no commerce nodes and no commerce props", async () => {
  const run = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
    business: { name: "Clinica Aurora", industry: "salud dental", description: "Atencion dental preventiva.", location: "Monterrey", objective: "Conseguir citas" },
  })
  assert.ok(run.plan.pages.length > 1)
  for (const page of run.plan.pages) {
    const nodes = Object.values(page.tree.nodes)
    assert.equal(nodes.some((node) => node.type.startsWith("store-")), false, page.slug)
    assert.equal(nodes.some((node) => node.props.commerceComposition !== undefined), false, page.slug)
  }
  assert.equal(networkAttempts, 0)
})
