import type {
  OrvenixSiteArchitecture,
  OrvenixSitePagePlan,
  OrvenixSiteSectionPlan,
  SectionRole,
} from "@/lib/orvenix-ai/architect"
import type { SectionInstanceComposition, SectionInstancePlan } from "@/lib/orvenix-ai/architect/composition-plan"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import { adaptFullSiteCreativeBlueprintToCommercePlanV1 } from "@/lib/orvenix-ai/full-site-generation/commerce-adapter"
import { commerceCategoryKeyV1, type CommerceProductFactV1 } from "./product-facts"
import { resolveProductDetailTargetV1 } from "./product-detail-target"
import {
  COMMERCE_ARCHITECTURE_PLAN_VERSION_V1,
  COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
  COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
  COMMERCE_NAVIGATION_STYLES_V1,
  COMMERCE_PAGE_PURPOSES_V1,
  COMMERCE_SECTION_TYPES_V1,
  COMMERCE_STORE_STRATEGIES_V1,
  type CommerceArchitecturePageV1,
  type CommerceArchitecturePlanV1,
  type CommerceArchitectureSectionV1,
  type CommerceCreativeCtaIntentV1,
  type CommerceCreativeIntentV1,
  type CommerceNavigationStyleV1,
  type CommercePagePurposeV1,
  type CommerceSectionTypeV1,
  type CommerceStoreStrategyV1,
} from "./architecture-contract"

export type CommerceArchitectureResolveModeV1 = "deterministic" | "mock-ai"

export interface CommerceArchitectureFactsV1 {
  products: CommerceProductFactV1[]
  mode?: CommerceArchitectureResolveModeV1
  proposal?: unknown
}

export interface CommerceArchitectureResultV1 {
  architecture: OrvenixSiteArchitecture
  plan: CommerceArchitecturePlanV1 | null
  warnings: string[]
  fallbackApplied: boolean
}

type CategoryGroup = {
  label: string
  key: string
  productIndexes: number[]
}

const PURPOSES = new Set<string>(COMMERCE_PAGE_PURPOSES_V1)
const SECTION_TYPES = new Set<string>(COMMERCE_SECTION_TYPES_V1)
const STORE_STRATEGIES = new Set<string>(COMMERCE_STORE_STRATEGIES_V1)
const NAV_STYLES = new Set<string>(COMMERCE_NAVIGATION_STYLES_V1)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "catalogo"
}

/*
 * COMMERCE-3C fix: slugs are emitted in their FINAL normalized form
 * (normalizeSiteCreationSlug-compatible, no "/"). Previously
 * "producto/<x>" / "categoria/<x>" were normalized to "producto-<x>" /
 * "categoria-<x>" by Plan V2 while navigation still pointed at the raw
 * form, producing dead internal links.
 */
function productSlug(product: CommerceProductFactV1, index: number): string {
  return `producto-${slugify(product.name || `producto-${index + 1}`)}`
}

function categorySlug(category: string): string {
  return `categoria-${slugify(category)}`
}

function uniqueSlug(slug: string, taken: Set<string>): string {
  let candidate = slug
  for (let suffix = 2; taken.has(candidate); suffix += 1) candidate = `${slug}-${suffix}`
  taken.add(candidate)
  return candidate
}

function categoryGroups(products: readonly CommerceProductFactV1[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>()
  for (const [index, product] of products.entries()) {
    const label = product.category?.trim()
    const key = label ? commerceCategoryKeyV1(label) : ""
    if (!label || !key) continue
    const existing = groups.get(key)
    if (existing) {
      existing.productIndexes.push(index)
    } else {
      groups.set(key, { label, key, productIndexes: [index] })
    }
  }
  return [...groups.values()].sort((a, b) => b.productIndexes.length - a.productIndexes.length || a.label.localeCompare(b.label))
}

function hasPricedProducts(products: readonly CommerceProductFactV1[]): boolean {
  return products.some((product) => product.variants?.some((variant) => Number.isInteger(variant.priceMxn)))
}

function chooseStrategy(products: readonly CommerceProductFactV1[], groups: readonly CategoryGroup[]): CommerceStoreStrategyV1 {
  if (products.length <= 2) return "product-led"
  if (groups.length >= 3 || products.length >= 12) return "catalog-first"
  if (products.some((product) => product.variants?.some((variant) => variant.comparePriceMxn && variant.comparePriceMxn > variant.priceMxn))) {
    return "promotional"
  }
  return "editorial-commerce"
}

function chooseNavigationStyle(strategy: CommerceStoreStrategyV1, groups: readonly CategoryGroup[]): CommerceNavigationStyleV1 {
  if (strategy === "catalog-first" && groups.length >= 2) return "category-forward"
  if (strategy === "product-led") return "editorial-commerce"
  if (strategy === "promotional") return "promotional"
  return "classic-store"
}

function section(
  type: CommerceSectionTypeV1,
  role: SectionRole,
  options: Omit<CommerceArchitectureSectionV1, "type" | "role"> = {},
): CommerceArchitectureSectionV1 {
  return { type, role, ...options }
}

function homeSections(strategy: CommerceStoreStrategyV1, products: readonly CommerceProductFactV1[], groups: readonly CategoryGroup[]): CommerceArchitectureSectionV1[] {
  const featured = products.slice(0, products.length >= 6 ? 6 : Math.min(3, products.length)).map((_, index) => index)
  const spotlight = products.length > 1 ? [1] : [0]
  const secondGroup = groups[1]?.productIndexes.slice(0, 4)

  if (strategy === "catalog-first") {
    return [
      section("commerce_hero", "hero", { layout: { kind: "editorial-passage", rhythm: "spacious" } }),
      section("category_navigation", "content"),
      section("featured_products", "products", { productIndexes: featured, layout: { kind: "card-grid", rhythm: "standard" } }),
      section("catalog_grid", "products", { productIndexes: products.slice(0, Math.min(8, products.length)).map((_, index) => index), layout: { kind: "card-grid" } }),
      section("commerce_trust", "trust"),
      section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
    ]
  }

  if (strategy === "product-led") {
    return [
      section("commerce_hero", "hero", { layout: { kind: "oversized-typography", rhythm: "spacious" } }),
      section("product_spotlight", "products", { productIndexes: spotlight, layout: { kind: "editorial-split", rhythm: "spacious" } }),
      section("featured_products", "products", { productIndexes: featured, layout: { kind: "card-grid" } }),
      section("category_navigation", "content"),
      section("commerce_benefits", "features"),
      section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
    ]
  }

  if (strategy === "promotional") {
    return [
      section("commerce_hero", "hero", { layout: { kind: "editorial-passage" } }),
      section("featured_products", "products", { productIndexes: featured, layout: { kind: "card-grid" } }),
      section("promotional_banner", "features", { layout: { kind: "editorial-split" } }),
      section("category_navigation", "content"),
      section("product_collection", "products", { productIndexes: secondGroup ?? featured, layout: { kind: "mirror-split" } }),
      section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
    ]
  }

  return [
    section("commerce_hero", "hero", { layout: { kind: "editorial-passage", rhythm: "spacious" } }),
    section("category_navigation", "content"),
    section("featured_products", "products", { productIndexes: featured, layout: { kind: "card-grid" } }),
    section("product_spotlight", "products", { productIndexes: spotlight, layout: { kind: "editorial-split", rhythm: "spacious" } }),
    section("commerce_benefits", "features"),
    section("product_collection", "products", { productIndexes: secondGroup ?? featured, layout: { kind: "mirror-split" } }),
    section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
  ]
}

function makeCommercePlan(products: CommerceProductFactV1[], mode: CommerceArchitectureResolveModeV1): CommerceArchitecturePlanV1 {
  const groups = categoryGroups(products)
  const strategy = mode === "mock-ai" && products.length >= 4 ? "editorial-commerce" : chooseStrategy(products, groups)
  const navStyle = chooseNavigationStyle(strategy, groups)
  const pages: CommerceArchitecturePageV1[] = [
    {
      purpose: "home",
      slug: "home",
      name: "Inicio",
      sections: homeSections(strategy, products, groups),
    },
    {
      purpose: "catalog",
      slug: "productos",
      name: "Productos",
      sections: [
        section("commerce_hero", "hero", { layout: { kind: "oversized-typography" } }),
        section("category_navigation", "content"),
        section("catalog_grid", "products", { productIndexes: products.map((_, index) => index), layout: { kind: "card-grid" } }),
        section("commerce_trust", "trust"),
        section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
      ],
    },
  ]

  const takenSlugs = new Set<string>(["home", "productos"])
  for (const group of groups.filter((entry) => entry.productIndexes.length >= 2).slice(0, 4)) {
    pages.push({
      purpose: "category",
      slug: uniqueSlug(categorySlug(group.label), takenSlugs),
      name: group.label,
      category: group.label,
      sections: [
        section("commerce_hero", "hero"),
        section("product_collection", "products", { category: group.label, productIndexes: group.productIndexes, layout: { kind: "card-grid" } }),
        section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
      ],
    })
  }

  const detailLimit = products.length <= 8 ? products.length : Math.min(6, Math.max(3, groups.length))
  const featuredDetailIndexes = [...new Set([...pages[0].sections.flatMap((entry) => entry.productIndexes ?? []), ...products.map((_, index) => index)])].slice(0, detailLimit)
  for (const index of featuredDetailIndexes) {
    const product = products[index]
    if (!product) continue
    pages.push({
      purpose: "product_detail",
      slug: uniqueSlug(productSlug(product, index), takenSlugs),
      name: product.name,
      productIndex: index,
      category: product.category,
      sections: [
        section("commerce_hero", "hero", { layout: { kind: "editorial-passage" } }),
        section("product_detail", "products", { productIndexes: [index], layout: { kind: "editorial-split", rhythm: "spacious" } }),
        section("related_products", "products", { productIndexes: relatedIndexes(products, index), layout: { kind: "card-grid" } }),
        section("commerce_benefits", "features"),
        section("commerce_closing", "cta", { layout: { kind: "dramatic-closing" } }),
      ],
    })
  }

  return {
    version: COMMERCE_ARCHITECTURE_PLAN_VERSION_V1,
    roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
    strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
    storeStrategy: strategy,
    navigationStyle: navStyle,
    primaryNavigationSlugs: ["home", "productos", ...pages.filter((page) => page.purpose === "category").slice(0, 4).map((page) => page.slug)],
    siteDensity: strategy === "catalog-first" ? "compact" : strategy === "product-led" ? "spacious" : "balanced",
    siteRhythm: strategy === "catalog-first" ? "dense" : strategy === "product-led" ? "calm" : "varied",
    pages: pages.slice(0, 12),
  }
}

function relatedIndexes(products: readonly CommerceProductFactV1[], index: number): number[] {
  const product = products[index]
  const sameCategory = product?.category
    ? products
        .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
        .filter((entry) => entry.candidateIndex !== index && entry.candidate.category === product.category)
        .map((entry) => entry.candidateIndex)
    : []
  return [...sameCategory, ...products.map((_, candidateIndex) => candidateIndex).filter((candidateIndex) => candidateIndex !== index)]
    .slice(0, 3)
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, max)
  return normalized || undefined
}

function intArray(value: unknown, max: number): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const seen = new Set<number>()
  const result: number[] = []
  for (const item of value) {
    if (!Number.isInteger(item) || item < 0 || item >= max || seen.has(item)) continue
    seen.add(item)
    result.push(item)
  }
  return result.length ? result : undefined
}

export function validateCommerceArchitecturePlanV1(value: unknown, products: readonly CommerceProductFactV1[]): { ok: true; plan: CommerceArchitecturePlanV1; warnings: string[] } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  if (!isRecord(value)) return { ok: false, errors: ["commerce architecture debe ser un objeto."] }
  if (value.version !== COMMERCE_ARCHITECTURE_PLAN_VERSION_V1) errors.push("version invalida.")
  if (value.roleKey !== COMMERCE_ARCHITECTURE_ROLE_KEY_V1) errors.push("roleKey invalido.")
  if (value.strategyKey !== COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1) errors.push("strategyKey invalido.")
  if (!STORE_STRATEGIES.has(value.storeStrategy as string)) errors.push("storeStrategy invalido.")
  if (!NAV_STYLES.has(value.navigationStyle as string)) errors.push("navigationStyle invalido.")
  if (!Array.isArray(value.pages) || value.pages.length < 2 || value.pages.length > 12) errors.push("pages fuera de limites.")
  if (errors.length) return { ok: false, errors }

  const seenSlugs = new Set<string>()
  const pages: CommerceArchitecturePageV1[] = []
  for (const [pageIndex, rawPage] of (value.pages as unknown[]).entries()) {
    if (!isRecord(rawPage)) {
      warnings.push(`pages[${pageIndex}] rechazado: no es objeto.`)
      continue
    }
    const purpose = rawPage.purpose
    const slug = text(rawPage.slug, 80)
    const name = text(rawPage.name, 80)
    if (typeof purpose !== "string" || !PURPOSES.has(purpose) || !slug || !name || seenSlugs.has(slug)) {
      warnings.push(`pages[${pageIndex}] rechazado: proposito, slug o nombre invalido.`)
      continue
    }
    const sections: CommerceArchitectureSectionV1[] = []
    for (const [sectionIndex, rawSection] of (Array.isArray(rawPage.sections) ? rawPage.sections : []).entries()) {
      if (!isRecord(rawSection)) {
        warnings.push(`${slug}.sections[${sectionIndex}] rechazado: no es objeto.`)
        continue
      }
      if (typeof rawSection.type !== "string" || !SECTION_TYPES.has(rawSection.type)) {
        warnings.push(`${slug}.sections[${sectionIndex}] rechazado: tipo desconocido.`)
        continue
      }
      const sectionType = rawSection.type as CommerceSectionTypeV1
      const role = commerceSectionRole(sectionType)
      const productIndexes = intArray(rawSection.productIndexes, products.length)
      const category = text(rawSection.category, 60)
      if (category && !categoryGroups(products).some((group) => group.label === category)) {
        warnings.push(`${slug}.sections[${sectionIndex}] categoria inventada rechazada.`)
        continue
      }
      if ((sectionType === "featured_products" || sectionType === "product_collection" || sectionType === "product_spotlight" || sectionType === "product_detail" || sectionType === "related_products") && !productIndexes?.length) {
        warnings.push(`${slug}.sections[${sectionIndex}] sin productos reales.`)
        continue
      }
      sections.push({ type: sectionType, role, ...(productIndexes ? { productIndexes } : {}), ...(category ? { category } : {}) })
    }
    if (!sections.length) continue
    seenSlugs.add(slug)
    const productIndex = rawPage.productIndex
    pages.push({
      purpose: purpose as CommercePagePurposeV1,
      slug,
      name,
      sections,
      ...(typeof productIndex === "number" && Number.isInteger(productIndex) && productIndex >= 0 && productIndex < products.length ? { productIndex } : {}),
      ...(typeof rawPage.category === "string" ? { category: rawPage.category } : {}),
    })
  }
  return pages.some((page) => page.purpose === "home") && pages.some((page) => page.purpose === "catalog")
    ? { ok: true, plan: { version: 1, roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1, strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1, storeStrategy: value.storeStrategy as CommerceStoreStrategyV1, navigationStyle: value.navigationStyle as CommerceNavigationStyleV1, pages }, warnings }
    : { ok: false, errors: ["La arquitectura comercio debe conservar home y catalogo."] }
}

function commerceSectionRole(type: CommerceSectionTypeV1): SectionRole {
  if (type === "commerce_hero") return "hero"
  if (type === "category_navigation") return "content"
  if (type === "commerce_benefits" || type === "promotional_banner") return "features"
  if (type === "commerce_trust") return "trust"
  if (type === "commerce_closing") return "cta"
  return "products"
}

function purposeFor(type: CommerceSectionTypeV1): string {
  const purposes: Record<CommerceSectionTypeV1, string> = {
    commerce_hero: "Presentar la tienda y orientar la compra.",
    category_navigation: "Ayudar a descubrir categorias reales.",
    featured_products: "Destacar productos reales seleccionados.",
    product_collection: "Agrupar productos reales relacionados.",
    product_spotlight: "Profundizar en un producto real.",
    promotional_banner: "Resaltar una oportunidad comercial sin inventar descuentos.",
    commerce_benefits: "Explicar beneficios de compra verificables.",
    commerce_trust: "Aumentar confianza alrededor de la compra.",
    catalog_grid: "Mostrar catalogo funcional de productos reales.",
    product_detail: "Presentar detalle de un producto real.",
    related_products: "Mostrar productos relacionados reales.",
    commerce_closing: "Cerrar con una accion comercial honesta.",
  }
  return purposes[type]
}

type CommerceCtaActionV1 = NonNullable<SectionInstanceComposition["ctaAction"]>

const NAVIGATION_LAYOUT_BY_STYLE: Record<CommerceNavigationStyleV1, SectionVisualLayoutPlan> = {
  "classic-store": { kind: "navigation-classic" },
  "category-forward": { kind: "navigation-split" },
  "editorial-commerce": { kind: "navigation-centered-editorial" },
  "compact-catalog": { kind: "navigation-classic", rhythm: "compact" },
  promotional: { kind: "navigation-split", rhythm: "spacious" },
}

type PlanIndex = {
  plan: CommerceArchitecturePlanV1
  products: readonly CommerceProductFactV1[]
  catalogSlug?: string
  helpSlug?: string
  categorySlugByLabel: Map<string, string>
  productSlugByIndex: Map<number, string>
}

function indexPlan(plan: CommerceArchitecturePlanV1, products: readonly CommerceProductFactV1[]): PlanIndex {
  return {
    plan,
    products,
    catalogSlug: plan.pages.find((page) => page.purpose === "catalog")?.slug,
    helpSlug: plan.pages.find((page) => page.purpose === "help")?.slug,
    categorySlugByLabel: new Map(plan.pages.filter((page) => page.purpose === "category" && page.category).map((page) => [page.category as string, page.slug])),
    productSlugByIndex: productSlugByIndexFor(plan, products),
  }
}

/**
 * COMMERCE-5B: the ONE authority for "this exact product has a generated
 * detail page": a product_detail page whose productIndex is a real product.
 * First page wins for a product; never derived from names or slugs.
 */
function productSlugByIndexFor(plan: CommerceArchitecturePlanV1, products: readonly CommerceProductFactV1[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const page of plan.pages) {
    const productIndex = page.productIndex
    if (page.purpose !== "product_detail" || typeof productIndex !== "number" || !Number.isInteger(productIndex)) continue
    if (productIndex < 0 || productIndex >= products.length || map.has(productIndex)) continue
    map.set(productIndex, page.slug)
  }
  return map
}

/** COMMERCE-5B/6: detail targets for the products this section shows, decided ONLY by resolveProductDetailTargetV1. */
function productDetailLinksFor(page: CommerceArchitecturePageV1, entry: CommerceArchitectureSectionV1, index: PlanIndex): SectionInstanceComposition["productDetailLinks"] {
  const shown = entry.productIndexes ?? index.products.map((_, productIndex) => productIndex)
  const links: NonNullable<SectionInstanceComposition["productDetailLinks"]> = []
  for (const productIndex of new Set(shown)) {
    const href = resolveProductDetailTargetV1({
      product: index.products[productIndex],
      productIndex,
      creativeSlugByIndex: index.productSlugByIndex,
      currentPage: { slug: page.slug, productIndex: page.productIndex },
    })
    if (href) links.push({ productIndex, href })
  }
  return links.length ? links : undefined
}

function defaultCtaIntent(page: CommerceArchitecturePageV1, entry: CommerceArchitectureSectionV1): CommerceCreativeCtaIntentV1 | undefined {
  if (entry.role === "hero" || entry.role === "cta") return page.purpose === "catalog" ? "view_category" : "browse_catalog"
  if (entry.type === "product_spotlight") return "view_product"
  if (entry.type === "featured_products" || entry.type === "product_collection" || entry.type === "related_products") return "browse_catalog"
  return undefined
}

/**
 * COMMERCE-3C: AI proposes an action INTENT; Orvenix alone resolves the
 * destination to a page that exists in this plan (never the current page,
 * never an arbitrary URL). Unresolvable -> no action (the button is
 * omitted rather than pointing nowhere).
 */
function resolveCtaAction(intent: CommerceCreativeCtaIntentV1 | undefined, page: CommerceArchitecturePageV1, entry: CommerceArchitectureSectionV1, index: PlanIndex): CommerceCtaActionV1 | "none" | undefined {
  if (!intent) return undefined
  if (intent === "none") return "none"
  const target = (slug: string | undefined, label: CommerceCtaActionV1["label"]): CommerceCtaActionV1 | undefined =>
    slug && slug !== page.slug ? { label, href: `page:${slug}` } : undefined
  const firstProduct = entry.productIndexes?.[0] ?? page.productIndex
  const category = entry.category ?? page.category ?? (typeof firstProduct === "number" ? index.products[firstProduct]?.category : undefined)
  const firstCategorySlug = [...index.categorySlugByLabel.values()].find((slug) => slug !== page.slug)
  switch (intent) {
    case "browse_catalog":
      return target(index.catalogSlug, "Ver catálogo") ?? target(firstCategorySlug, "Ver categoría") ?? "none"
    case "view_category":
      return target(category ? index.categorySlugByLabel.get(category) : undefined, "Ver categoría") ?? target(firstCategorySlug, "Ver categoría") ?? target(index.catalogSlug, "Ver catálogo") ?? "none"
    case "view_product":
      return target(typeof firstProduct === "number" ? index.productSlugByIndex.get(firstProduct) : undefined, "Ver producto") ?? target(index.catalogSlug, "Ver catálogo") ?? "none"
    case "continue_shopping":
      return target(index.catalogSlug, "Seguir explorando") ?? target(firstCategorySlug, "Seguir explorando") ?? "none"
    case "contact":
      return target(index.helpSlug, "Ver ayuda") ?? "none"
  }
}

function categoryLinksFor(page: CommerceArchitecturePageV1, index: PlanIndex): SectionInstanceComposition["categoryLinks"] {
  const links = [...index.categorySlugByLabel.entries()]
    .filter(([, slug]) => slug !== page.slug)
    .slice(0, 6)
    .map(([label, slug]) => ({ label, href: `page:${slug}` }))
  return links.length ? links : undefined
}

/** Structural narrative defaults by commerce section type (used when no creative intent supplied one). */
const DEFAULT_NARRATIVE_BY_TYPE: Partial<Record<CommerceArchitectureSectionV1["type"], NonNullable<CommerceCreativeIntentV1["narrative"]>>> = {
  featured_products: "product-led",
  product_spotlight: "product-led",
  product_detail: "product-led",
  product_collection: "category-discovery",
  related_products: "category-discovery",
  catalog_grid: "catalog-orientation",
  category_navigation: "category-discovery",
}

function scaleForEmphasis(emphasis: CommerceCreativeIntentV1["emphasis"]): SectionInstanceComposition["scale"] | undefined {
  if (emphasis === "heroic" || emphasis === "strong") return "large"
  if (emphasis === "quiet") return "condensed"
  return undefined
}

function mediaStrategyFor(media: CommerceCreativeIntentV1["media"]): SectionInstanceComposition["mediaStrategy"] | undefined {
  if (media === "dominant" || media === "product-focus" || media === "gallery") return "led"
  if (media === "supporting") return "supporting"
  if (media === "minimal" || media === "none") return "none"
  return undefined
}

function layoutWithDensity(layout: SectionVisualLayoutPlan | undefined, density: CommerceCreativeIntentV1["density"], scale: SectionInstanceComposition["scale"] | undefined): SectionVisualLayoutPlan | undefined {
  if (!layout || layout.rhythm || scale) return layout
  if (density === "compact") return { ...layout, rhythm: "compact" }
  if (density === "spacious") return { ...layout, rhythm: "spacious" }
  return layout
}

function compositionFor(
  page: CommerceArchitecturePageV1,
  entry: CommerceArchitectureSectionV1,
  index: PlanIndex,
  mirrorOverride: boolean | undefined,
): SectionInstanceComposition {
  const intent: CommerceCreativeIntentV1 = { density: index.plan.siteDensity, narrative: DEFAULT_NARRATIVE_BY_TYPE[entry.type], ...entry.creativeIntent }
  const scale = scaleForEmphasis(intent.emphasis)
  const baseLayout = entry.layout ?? (entry.role === "products" ? { kind: "card-grid" as const } : undefined)
  const withDensity = layoutWithDensity(baseLayout, intent.density, scale)
  const layout = withDensity && mirrorOverride !== undefined && (withDensity.kind === "editorial-split" || withDensity.kind === "mirror-split")
    ? { ...withDensity, kind: "editorial-split" as const, mirror: mirrorOverride }
    : withDensity
  const cta = resolveCtaAction(intent.cta ?? defaultCtaIntent(page, entry), page, entry, index)
  const mediaStrategy = mediaStrategyFor(intent.media)
  const categoryLinks = entry.type === "category_navigation" ? categoryLinksFor(page, index) : undefined
  const productDetailLinks = entry.role === "products" ? productDetailLinksFor(page, entry, index) : undefined
  return {
    ...(layout ? { layout } : {}),
    ...(scale ? { scale } : {}),
    ...(mediaStrategy ? { mediaStrategy } : {}),
    ...(intent.relation === "contrast" ? { backgroundStrategy: "contrast-led" as const } : intent.relation === "continuous" ? { backgroundStrategy: "soft-rhythm" as const } : {}),
    ...(intent.narrative ? { narrativeIntent: intent.narrative } : {}),
    ...(cta === "none" ? { omitCta: true } : cta ? { ctaAction: cta } : {}),
    ...(categoryLinks ? { categoryLinks } : {}),
    ...(productDetailLinks ? { productDetailLinks } : {}),
    ...((entry.type === "product_detail" || entry.type === "product_spotlight") && !scale ? { alignment: "left" as const } : {}),
  }
}

function instanceFor(page: CommerceArchitecturePageV1, entry: CommerceArchitectureSectionV1, sectionIndex: number, index: PlanIndex, mirrorOverride: boolean | undefined): SectionInstancePlan {
  const indexes = entry.productIndexes ?? []
  return {
    id: `${page.slug}:${entry.type}:${sectionIndex}`,
    role: entry.role,
    selection: entry.role !== "products"
      ? { mode: "all" }
      : indexes.length === 1 ? { mode: "single-item", itemIndex: indexes[0] } : { mode: "subset", indexes },
    composition: compositionFor(page, entry, index, mirrorOverride),
    provenance: entry.creativeIntent ? "creative-director" : "deterministic",
  }
}

function footerSlugsFor(index: PlanIndex): string[] {
  const existing = new Set(index.plan.pages.map((page) => page.slug))
  const slugs = (index.plan.primaryNavigationSlugs ?? []).filter((slug) => existing.has(slug))
  if (index.helpSlug && !slugs.includes(index.helpSlug)) slugs.push(index.helpSlug)
  return slugs
}

function pageFromCommercePlan(page: CommerceArchitecturePageV1, index: PlanIndex): OrvenixSitePagePlan {
  // Site rhythm "varied": consecutive split layouts on one page alternate sides (bounded, deterministic).
  let lastMirror: boolean | undefined
  const alternate = index.plan.siteRhythm === "varied"
  const entries = page.sections
    // A discovery row with no real category destination would only render placeholder copy: omit it.
    .filter((entry) => entry.type !== "category_navigation" || Boolean(categoryLinksFor(page, index)))
  // COMMERCE-5B: the nav CTA is a grounded "contact" action (the help page) or omitted -- never a "#contacto" anchor no page renders.
  const navCta = resolveCtaAction("contact", page, { type: "commerce_closing", role: "navigation" }, index)
  const sections: OrvenixSiteSectionPlan[] = [
    {
      role: "navigation",
      blockType: null,
      purpose: "Navegacion de tienda.",
      instance: {
        id: `${page.slug}:navigation`,
        role: "navigation",
        selection: { mode: "all" },
        composition: {
          layout: NAVIGATION_LAYOUT_BY_STYLE[index.plan.navigationStyle],
          ...(index.plan.primaryNavigationSlugs?.length ? { navigationSlugs: index.plan.primaryNavigationSlugs } : {}),
          ...(navCta && navCta !== "none" ? { ctaAction: navCta } : { omitCta: true as const }),
          ...(index.plan.cartProminence ? { cartProminence: index.plan.cartProminence } : {}),
        },
        provenance: "deterministic",
      },
    },
    ...entries.map((entry, sectionIndex) => {
      const isSplit = entry.layout?.kind === "editorial-split" || entry.layout?.kind === "mirror-split"
      let mirrorOverride: boolean | undefined
      if (alternate && isSplit) {
        mirrorOverride = lastMirror === undefined ? entry.layout?.kind === "mirror-split" || entry.layout?.mirror === true : !lastMirror
        lastMirror = mirrorOverride
      }
      return {
        role: entry.role,
        blockType: null,
        purpose: purposeFor(entry.type),
        instance: instanceFor(page, entry, sectionIndex, index, mirrorOverride),
      }
    }),
    {
      role: "footer",
      blockType: null,
      purpose: "Cerrar navegacion y datos del sitio.",
      // PCE-2: footer links = the plan's own primary pages (+ help when it exists) -- real generated pages only.
      ...(footerSlugsFor(index).length
        ? { instance: { id: `${page.slug}:footer`, role: "footer" as const, selection: { mode: "all" as const }, composition: { navigationSlugs: footerSlugsFor(index) }, provenance: "deterministic" as const } }
        : {}),
    },
  ]
  return {
    name: page.name,
    slug: page.slug,
    purpose: `Comercio: ${page.purpose}.`,
    archetype: page.purpose === "home" ? "overview" : page.purpose === "product_detail" ? "conversion" : "catalog",
    sections,
  }
}

function applyPlan(architecture: OrvenixSiteArchitecture, plan: CommerceArchitecturePlanV1, products: readonly CommerceProductFactV1[]): OrvenixSiteArchitecture {
  const index = indexPlan(plan, products)
  return {
    ...architecture,
    pages: plan.pages.map((page) => pageFromCommercePlan(page, index)),
  }
}

export function resolveCommerceArchitectureV1(params: {
  architecture: OrvenixSiteArchitecture
  facts: CommerceArchitectureFactsV1
}): CommerceArchitectureResultV1 {
  if (params.architecture.siteType !== "ecommerce" || !params.facts.products.length || !hasPricedProducts(params.facts.products)) {
    return { architecture: params.architecture, plan: null, warnings: [], fallbackApplied: false }
  }

  const deterministic = makeCommercePlan(params.facts.products, "deterministic")
  if (params.facts.mode === "mock-ai" && params.facts.proposal) {
    const fullSite = adaptFullSiteCreativeBlueprintToCommercePlanV1({ blueprint: params.facts.proposal, products: params.facts.products })
    if (fullSite.ok === true) {
      return { architecture: applyPlan(params.architecture, fullSite.plan, params.facts.products), plan: fullSite.plan, warnings: fullSite.warnings, fallbackApplied: false }
    }

    const legacy = validateCommerceArchitecturePlanV1(params.facts.proposal, params.facts.products)
    if (legacy.ok === true) {
      return { architecture: applyPlan(params.architecture, legacy.plan, params.facts.products), plan: legacy.plan, warnings: legacy.warnings, fallbackApplied: false }
    }

    return { architecture: applyPlan(params.architecture, deterministic, params.facts.products), plan: deterministic, warnings: [...fullSite.errors, ...(legacy.ok === false ? legacy.errors : [])], fallbackApplied: true }
  }

  return { architecture: applyPlan(params.architecture, deterministic, params.facts.products), plan: deterministic, warnings: [], fallbackApplied: false }
}


export {
  COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
  COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
} from "./architecture-contract"
