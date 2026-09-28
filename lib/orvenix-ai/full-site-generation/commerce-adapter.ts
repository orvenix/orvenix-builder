import { commerceCategoryKeyV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import type {
  CommerceArchitecturePageV1,
  CommerceArchitecturePlanV1,
  CommerceArchitectureSectionV1,
  CommerceNavigationStyleV1,
  CommerceStoreStrategyV1,
} from "@/lib/orvenix-ai/commerce/architecture-contract"
import {
  COMMERCE_ARCHITECTURE_PLAN_VERSION_V1,
  COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
  COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
} from "@/lib/orvenix-ai/commerce/architecture-contract"
import type { FullSiteContentRefV1, FullSiteCreativeBlueprintV1, FullSiteCreativePageV1, FullSiteCreativeSectionV1 } from "./contract"
import { validateFullSiteCreativeBlueprintV1 } from "./validator"
import { resolveSectionCreativeIntentV1 } from "./creative-intent"

export type CommerceBlueprintAdapterResultV1 =
  | { ok: true; plan: CommerceArchitecturePlanV1; warnings: string[]; fingerprint: string }
  | { ok: false; errors: string[]; warnings: string[] }

type CategoryGroup = { key: string; label: string; productIndexes: number[] }

function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "pagina"
}

function categoryGroups(products: readonly CommerceProductFactV1[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>()
  for (const [index, product] of products.entries()) {
    const label = product.category?.trim()
    const key = label ? commerceCategoryKeyV1(label) : ""
    if (!label || !key) continue
    const existing = groups.get(key)
    if (existing) existing.productIndexes.push(index)
    else groups.set(key, { key, label, productIndexes: [index] })
  }
  return [...groups.values()]
}

function pageSlugFor(page: FullSiteCreativeBlueprintV1["pages"][number], products: readonly CommerceProductFactV1[], groups: readonly CategoryGroup[]): string {
  if (page.purpose === "home") return "home"
  if (page.purpose === "catalog") return "productos"
  const target = page.target
  if (page.purpose === "category" && target?.kind === "category") {
    const group = groups.find((entry) => entry.key === target.key)
    return `categoria-${slugify(group?.label ?? target.key)}`
  }
  if (page.purpose === "product_detail" && page.target?.kind === "product") {
    return `producto-${slugify(products[page.target.index]?.name ?? `producto-${page.target.index + 1}`)}`
  }
  return slugify(page.purpose)
}

function pageNameFor(page: FullSiteCreativeBlueprintV1["pages"][number], products: readonly CommerceProductFactV1[], groups: readonly CategoryGroup[]): string {
  if (page.purpose === "home") return "Inicio"
  if (page.purpose === "catalog") return "Productos"
  const target = page.target
  if (page.purpose === "category" && target?.kind === "category") return groups.find((entry) => entry.key === target.key)?.label ?? "Categoria"
  if (page.purpose === "product_detail" && page.target?.kind === "product") return products[page.target.index]?.name ?? "Producto"
  return "Ayuda"
}

function indexesFromRefs(refs: readonly FullSiteContentRefV1[] | undefined, products: readonly CommerceProductFactV1[], groups: readonly CategoryGroup[]): number[] {
  const indexes: number[] = []
  const seen = new Set<number>()
  for (const ref of refs ?? []) {
    if (ref.kind === "product") indexes.push(ref.index)
    if (ref.kind === "category") indexes.push(...(groups.find((group) => group.key === ref.key)?.productIndexes ?? []))
  }
  return indexes.filter((index) => {
    if (index < 0 || index >= products.length || seen.has(index)) return false
    seen.add(index)
    return true
  })
}

function commerceSectionFromCreative(
  section: FullSiteCreativeSectionV1,
  products: readonly CommerceProductFactV1[],
  groups: readonly CategoryGroup[],
  blueprint: FullSiteCreativeBlueprintV1,
  page: FullSiteCreativePageV1,
): CommerceArchitectureSectionV1 | null {
  const productIndexes = indexesFromRefs(section.refs, products, groups)
  const categoryRef = section.refs?.find((ref): ref is Extract<FullSiteContentRefV1, { kind: "category" }> => ref.kind === "category")
  const category = categoryRef ? groups.find((group) => group.key === categoryRef.key)?.label : undefined
  // COMMERCE-3C: every accepted creative field survives as a CLOSED enum on the commerce section.
  const creativeIntent = resolveSectionCreativeIntentV1({ blueprint, page, section })
  const common = {
    ...(productIndexes.length ? { productIndexes } : {}),
    ...(category ? { category } : {}),
    ...(section.layout ? { layout: section.layout } : {}),
    creativeIntent,
  }

  if (section.intent === "opening") return { type: "commerce_hero", role: "hero", ...common }
  if (section.intent === "navigation_discovery") return { type: "category_navigation", role: "content", ...common }
  if (section.intent === "featured_collection") return productIndexes.length ? { type: "featured_products", role: "products", ...common } : null
  if (section.intent === "collection") return productIndexes.length ? { type: "product_collection", role: "products", ...common } : null
  if (section.intent === "spotlight") return productIndexes.length ? { type: "product_spotlight", role: "products", productIndexes: productIndexes.slice(0, 1), ...(section.layout ? { layout: section.layout } : {}), creativeIntent } : null
  if (section.intent === "editorial_passage") return { type: "promotional_banner", role: "features", ...common }
  if (section.intent === "benefits") return { type: "commerce_benefits", role: "features", ...common }
  if (section.intent === "trust") return { type: "commerce_trust", role: "trust", ...common }
  if (section.intent === "catalog_surface") return { type: "catalog_grid", role: "products", productIndexes: productIndexes.length ? productIndexes : products.map((_, index) => index), ...(section.layout ? { layout: section.layout } : {}), creativeIntent }
  if (section.intent === "detail_surface") return productIndexes.length ? { type: "product_detail", role: "products", productIndexes: productIndexes.slice(0, 1), ...(section.layout ? { layout: section.layout } : {}), creativeIntent } : null
  if (section.intent === "related_items") return productIndexes.length ? { type: "related_products", role: "products", ...common } : null
  if (section.intent === "closing") return { type: "commerce_closing", role: "cta", ...common }
  return null
}

function strategyFromBlueprint(blueprint: FullSiteCreativeBlueprintV1): CommerceStoreStrategyV1 {
  if (blueprint.siteConcept.narrative === "catalog") return "catalog-first"
  if (blueprint.siteConcept.narrative === "product-led") return "product-led"
  if (blueprint.siteConcept.narrative === "conversion-led") return "promotional"
  return "editorial-commerce"
}

function navFromBlueprint(blueprint: FullSiteCreativeBlueprintV1): CommerceNavigationStyleV1 {
  if (blueprint.navigation.concept === "catalog-forward") return "category-forward"
  if (blueprint.navigation.concept === "editorial") return "editorial-commerce"
  if (blueprint.navigation.concept === "compact") return "compact-catalog"
  if (blueprint.navigation.concept === "conversion-led") return "promotional"
  return "classic-store"
}

const MAX_PRIMARY_CATEGORY_LINKS = 4

/**
 * COMMERCE-3C: navigation.primaryPurposes -> ordered, REAL generated page
 * slugs. Orvenix owns destinations: only pages that exist in this plan,
 * product-detail pages never flood the primary nav, category pages are
 * capped. Without primaryPurposes the concept decides a safe default.
 */
function primaryNavigationSlugsFromBlueprint(blueprint: FullSiteCreativeBlueprintV1, pages: readonly CommerceArchitecturePageV1[]): string[] {
  const defaults: Record<FullSiteCreativeBlueprintV1["navigation"]["concept"], string[]> = {
    classic: ["home", "catalog", "category", "help"],
    editorial: ["home", "catalog", "help"],
    "catalog-forward": ["home", "catalog", "category"],
    compact: ["home", "catalog"],
    "conversion-led": ["home", "catalog"],
  }
  const purposes = blueprint.navigation.primaryPurposes?.length ? blueprint.navigation.primaryPurposes : defaults[blueprint.navigation.concept]
  const slugs: string[] = []
  for (const purpose of purposes) {
    if (purpose === "product_detail") continue
    const matches = pages.filter((page) => page.purpose === purpose).map((page) => page.slug)
    for (const slug of purpose === "category" ? matches.slice(0, MAX_PRIMARY_CATEGORY_LINKS) : matches.slice(0, 1)) {
      if (!slugs.includes(slug)) slugs.push(slug)
    }
  }
  return slugs
}

export function adaptFullSiteCreativeBlueprintToCommercePlanV1(params: {
  blueprint: unknown
  products: readonly CommerceProductFactV1[]
}): CommerceBlueprintAdapterResultV1 {
  const groups = categoryGroups(params.products)
  const validation = validateFullSiteCreativeBlueprintV1(params.blueprint, {
    productCount: params.products.length,
    categoryKeys: groups.map((group) => group.key),
    maxPages: 12,
  })
  if (validation.ok === false) return validation

  const pages: CommerceArchitecturePageV1[] = []
  const slugs = new Set<string>()
  for (const page of validation.blueprint.pages) {
    if (!["home", "catalog", "category", "product_detail", "help"].includes(page.purpose)) continue
    if (page.purpose === "category" && page.target?.kind !== "category") continue
    if (page.purpose === "product_detail" && page.target?.kind !== "product") continue
    const baseSlug = pageSlugFor(page, params.products, groups)
    if (page.purpose !== "product_detail" && slugs.has(baseSlug)) continue
    let slug = baseSlug
    for (let suffix = 2; slugs.has(slug); suffix += 1) slug = `${baseSlug}-${suffix}`
    const ownProduct = page.purpose === "product_detail" && page.target?.kind === "product" ? page.target.index : undefined
    const sections = page.sections
      .map((section) => commerceSectionFromCreative(section, params.products, groups, validation.blueprint, page))
      .filter((section): section is CommerceArchitectureSectionV1 => Boolean(section))
      // A product's own detail page never lists that same product as "related".
      .map((section) => section.type === "related_products" && ownProduct !== undefined ? { ...section, productIndexes: section.productIndexes?.filter((index) => index !== ownProduct) } : section)
      .filter((section) => section.type !== "related_products" || Boolean(section.productIndexes?.length))
    if (!sections.length) continue
    slugs.add(slug)
    pages.push({
      purpose: page.purpose === "help" ? "help" : page.purpose,
      slug,
      name: pageNameFor(page, params.products, groups),
      sections,
      ...(page.target?.kind === "product" ? { productIndex: page.target.index } : {}),
      ...(page.target?.kind === "category" ? { category: groups.find((group) => group.key === (page.target as { kind: "category"; key: string }).key)?.label } : {}),
    } as CommerceArchitecturePageV1)
  }

  if (!pages.some((page) => page.purpose === "home") || !pages.some((page) => page.purpose === "catalog")) {
    return { ok: false, errors: ["commerce blueprint debe producir home y catalogo."], warnings: validation.warnings }
  }

  return {
    ok: true,
    plan: {
      version: COMMERCE_ARCHITECTURE_PLAN_VERSION_V1,
      roleKey: COMMERCE_ARCHITECTURE_ROLE_KEY_V1,
      strategyKey: COMMERCE_ARCHITECTURE_STRATEGY_KEY_V1,
      storeStrategy: strategyFromBlueprint(validation.blueprint),
      navigationStyle: navFromBlueprint(validation.blueprint),
      primaryNavigationSlugs: primaryNavigationSlugsFromBlueprint(validation.blueprint, pages),
      siteDensity: validation.blueprint.siteConcept.density === "rich" ? "compact" : validation.blueprint.siteConcept.density === "minimal" ? "spacious" : "balanced",
      siteRhythm: validation.blueprint.siteConcept.rhythm,
      pages,
    },
    warnings: validation.warnings,
    fingerprint: validation.fingerprint,
  }
}
