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
import { normalizeNarrativeIntentV1, resolveSectionCreativeIntentV1 } from "./creative-intent"
import { DEFAULT_PRIMARY_PURPOSES_BY_CONCEPT_V1, NAVIGATION_STYLE_BY_CONCEPT_V1 } from "./navigation-concepts"
import { attachProviderAuthoringV1, catalogGraphGroundingV1, diagnoseGraphDegeneracyV1, diagnoseProviderGraphsV1, groundedCopyTextsV1 } from "./graph-authoring"

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

/**
 * CF-3D: a products section may express its content ONLY through its graph
 * (refs inside regions, no section-level refs). Those are the provider's own
 * refs for THIS section, so they become the section's products (range-checked,
 * de-duplicated, in authored order) instead of the section being dropped. The
 * graph itself is still validated strictly by the compiler (an invalid graph
 * falls back to V1 with these same products). Only explicit product refs are
 * used: anchors are never read, nothing is inferred.
 */
function productIndexesFromGraphRefs(composition: FullSiteCreativeSectionV1["composition"], products: readonly CommerceProductFactV1[]): number[] {
  const refs: FullSiteContentRefV1[] = []
  const walk = (regions: unknown) => {
    if (!Array.isArray(regions)) return
    for (const region of regions as Array<{ refs?: unknown; regions?: unknown }>) {
      if (Array.isArray(region?.refs)) for (const ref of region.refs as Array<{ kind?: unknown; index?: unknown }>) if (ref?.kind === "product" && Number.isInteger(ref.index)) refs.push({ kind: "product", index: ref.index as number })
      walk(region?.regions)
    }
  }
  if (composition?.role === "products") walk(composition.regions)
  return indexesFromRefs(refs, products, [])
}

function commerceSectionFromCreative(
  section: FullSiteCreativeSectionV1,
  products: readonly CommerceProductFactV1[],
  groups: readonly CategoryGroup[],
  blueprint: FullSiteCreativeBlueprintV1,
  page: FullSiteCreativePageV1,
  warnings: string[],
  path: string = section.intent,
): CommerceArchitectureSectionV1 | null {
  const sectionIndexes = indexesFromRefs(section.refs, products, groups)
  const graphIndexes = sectionIndexes.length ? [] : productIndexesFromGraphRefs(section.composition, products)
  if (graphIndexes.length) warnings.push(`${path}: section_products_from_graph_refs; la seccion no tiene refs propias y usa las refs de producto de su composition.`)
  const productIndexes = sectionIndexes.length ? sectionIndexes : graphIndexes
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
  if (section.intent === "editorial_passage") {
    /*
     * CF-1 renderer truth: a grounded editorial passage keeps its refs --
     * it compiles as a products section with the composer's real
     * editorial-passage structure (narrow editorial column over the
     * referenced products/category). Without product/category refs there is
     * nothing grounded to pass through: it is honestly the benefits section
     * (which is exactly what it rendered before), with a warning.
     */
    if (productIndexes.length) {
      const explicitNarrative = normalizeNarrativeIntentV1(section.narrative) ?? normalizeNarrativeIntentV1(page.narrativeGoal)
      return {
        type: "product_collection",
        role: "products",
        ...common,
        layout: section.layout ?? { kind: "editorial-passage" },
        creativeIntent: { ...creativeIntent, narrative: explicitNarrative ?? "editorial-story" },
      }
    }
    warnings.push("editorial_passage sin refs de producto/categoria se compila como benefits.")
    return { type: "commerce_benefits", role: "features", ...common }
  }
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
  return NAVIGATION_STYLE_BY_CONCEPT_V1[blueprint.navigation.concept]
}

const MAX_PRIMARY_CATEGORY_LINKS = 4

/**
 * COMMERCE-3C: navigation.primaryPurposes -> ordered, REAL generated page
 * slugs. Orvenix owns destinations: only pages that exist in this plan,
 * product-detail pages never flood the primary nav, category pages are
 * capped. Without primaryPurposes the concept decides a safe default.
 */
function primaryNavigationSlugsFromBlueprint(blueprint: FullSiteCreativeBlueprintV1, pages: readonly CommerceArchitecturePageV1[]): string[] {
  const purposes = blueprint.navigation.primaryPurposes?.length ? blueprint.navigation.primaryPurposes : DEFAULT_PRIMARY_PURPOSES_BY_CONCEPT_V1[blueprint.navigation.concept]
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
  const warnings = [...validation.warnings]
  const groundedTexts = groundedCopyTextsV1(params.products)
  const graphDiagnosticPages: Array<{ path: string; sections: Array<{ path: string; graph?: CommerceArchitectureSectionV1["graph"]; hasCtaAction?: boolean }> }> = []
  // Category refs in a graph must be REAL destinations: categories that have their own category page.
  const categoryPageKeys = validation.blueprint.pages.flatMap((page) => (page.purpose === "category" && page.target?.kind === "category" ? [page.target.key] : []))
  for (const page of validation.blueprint.pages) {
    if (!["home", "catalog", "category", "product_detail", "help"].includes(page.purpose)) continue
    if (page.purpose === "category" && page.target?.kind !== "category") continue
    if (page.purpose === "product_detail" && page.target?.kind !== "product") continue
    const baseSlug = pageSlugFor(page, params.products, groups)
    if (page.purpose !== "product_detail" && slugs.has(baseSlug)) continue
    let slug = baseSlug
    for (let suffix = 2; slugs.has(slug); suffix += 1) slug = `${baseSlug}-${suffix}`
    const ownProduct = page.purpose === "product_detail" && page.target?.kind === "product" ? page.target.index : undefined
    const pageIndex = validation.blueprint.pages.indexOf(page)
    const tracked = page.sections
      .map((section, sectionIndex) => {
        const path = `pages[${pageIndex}].sections[${sectionIndex}]`
        const commerceSection = commerceSectionFromCreative(section, params.products, groups, validation.blueprint, page, warnings, path)
        // CF-3D: never lose a provider graph silently.
        if (!commerceSection && section.composition) warnings.push(`${path}.composition: graph_section_dropped_no_content; la seccion no tiene contenido compilable y se omite.`)
        if (!commerceSection) return null
        // CF-3A: optional provider graph + claim-guarded copy (each falls back alone).
        return { path, hasCtaAction: section.ctaIntent === undefined ? undefined : section.ctaIntent !== "none", section: attachProviderAuthoringV1({ section, commerceSection, groundedTexts, path, warnings }) }
      })
      .filter((entry): entry is { path: string; hasCtaAction: boolean | undefined; section: CommerceArchitectureSectionV1 } => Boolean(entry))
    graphDiagnosticPages.push({ path: `pages[${pageIndex}]`, sections: tracked.map((entry) => ({ path: entry.path, graph: entry.section.graph, ...(entry.hasCtaAction !== undefined ? { hasCtaAction: entry.hasCtaAction } : {}) })) })
    const sections = tracked.map((entry) => entry.section)
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

  // CF-3A: advisory graph diagnostics (the compiler re-validates and records the authoritative fallback) + degeneracy warnings.
  warnings.push(...diagnoseProviderGraphsV1(graphDiagnosticPages, catalogGraphGroundingV1(params.products, categoryPageKeys)))
  warnings.push(...diagnoseGraphDegeneracyV1(validation.blueprint))

  if (!pages.some((page) => page.purpose === "home") || !pages.some((page) => page.purpose === "catalog")) {
    return { ok: false, errors: ["commerce blueprint debe producir home y catalogo."], warnings }
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
      ...(validation.blueprint.navigation.cartProminence ? { cartProminence: validation.blueprint.navigation.cartProminence } : {}),
      siteDensity: validation.blueprint.siteConcept.density === "rich" ? "compact" : validation.blueprint.siteConcept.density === "minimal" ? "spacious" : "balanced",
      siteRhythm: validation.blueprint.siteConcept.rhythm,
      pages,
    },
    warnings,
    fingerprint: validation.fingerprint,
  }
}
