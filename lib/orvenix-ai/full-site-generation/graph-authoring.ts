import type { CommerceArchitectureSectionV1 } from "@/lib/orvenix-ai/commerce/architecture-contract"
import { isExecutableCommerceProductV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import { graphFingerprintV1 } from "@/lib/orvenix-ai/composer/graph/fingerprint"
import { normalizeGraphForPositionV1, validateGraphSectionV1 } from "@/lib/orvenix-ai/composer/graph/validator"
import type { GraphGroundingV1, GraphRegionV1, GraphSectionV1 } from "@/lib/orvenix-ai/composer/graph/contract"
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media"
import { guardCreativeCopyV1 } from "./copy-guard"
import type { FullSiteCreativeBlueprintV1, FullSiteCreativeSectionV1 } from "./contract"

/**
 * CF-3A: provider-authored composition graphs + creative copy, carried from
 * the validated blueprint onto commerce sections. Two kinds of diagnostics:
 *
 * - ADVISORY grounding diagnostics (warnings): the same strict graph
 *   validator, run early against the catalog, so a lifecycle shows what the
 *   compiler will do. The compiler remains the ONE authoritative fallback
 *   point (it re-validates with the exact per-section context and records
 *   the reason on the section).
 * - DEGENERACY diagnostics (warnings only): obvious aesthetic sameness. A
 *   restrained site is legitimate, so nothing here rejects anything.
 */

function isRenderable(product: CommerceProductFactV1): boolean {
  if (isExecutableCommerceProductV1(product)) return true
  const pending = product.pendingProvisioning
  return Boolean(pending && product.variants?.[pending.variantIndex])
}

export function catalogGraphGroundingV1(products: readonly CommerceProductFactV1[], categoryKeys: readonly string[]): GraphGroundingV1 {
  return {
    productCount: products.length,
    renderableProductIndexes: new Set(products.map((product, index) => (isRenderable(product) ? index : -1)).filter((index) => index >= 0)),
    mediaProductIndexes: new Set(products.map((product, index) => (product.imageUrls?.some(isSafeProductMediaUrlV1) ? index : -1)).filter((index) => index >= 0)),
    categoryKeys: new Set(categoryKeys),
    // Advisory: Orvenix resolves the real action later; the compiler re-checks.
    hasCtaAction: true,
  }
}

/** Texts numbers in creative copy may be matched against (authoritative catalog facts only). */
export function groundedCopyTextsV1(products: readonly CommerceProductFactV1[]): string[] {
  return products.flatMap((product) => [product.name, product.category ?? "", ...(product.variants ?? []).map((variant) => variant.label ?? "")]).filter(Boolean)
}

export function attachProviderAuthoringV1(params: {
  section: FullSiteCreativeSectionV1
  commerceSection: CommerceArchitectureSectionV1
  groundedTexts: readonly string[]
  path: string
  warnings: string[]
}): CommerceArchitectureSectionV1 {
  const { section, path, warnings } = params
  let out = params.commerceSection
  if (section.composition) {
    const graphRole = (section.composition as { role?: unknown }).role
    if (graphRole !== out.role) warnings.push(`${path}.composition: role ${String(graphRole)} no corresponde a la seccion (${out.role}); la seccion usa V1.`)
    else out = { ...out, graph: section.composition }
  }
  if (section.copy) {
    const report = guardCreativeCopyV1(section.copy, { groundedTexts: params.groundedTexts })
    for (const rejected of report.rejected) warnings.push(`${path}.copy.${rejected.slot}: ${rejected.code}; se usa el copy de Orvenix para ese campo.`)
    out = {
      ...out,
      ...(Object.keys(report.copy).length ? { creativeCopy: report.copy } : {}),
      ...(report.rejected.length ? { creativeCopyFallback: report.rejected } : {}),
    }
  }
  return out
}

/** Advisory, per page, with page positions (open/close/peaks) among that page's graph sections. */
export function diagnoseProviderGraphsV1(pages: ReadonlyArray<{ path: string; sections: ReadonlyArray<{ path: string; graph?: GraphSectionV1; hasCtaAction?: boolean }> }>, grounding: GraphGroundingV1): string[] {
  const warnings: string[] = []
  for (const page of pages) {
    const graphs = page.sections.filter((section) => section.graph)
    let peaks = 0
    graphs.forEach((section, index) => {
      const position = { index, total: graphs.length, peaksBefore: peaks }
      // Same (only) normalization the compiler applies: a no-effect terminal continuity is dropped, reported here.
      const { graph, normalizations } = normalizeGraphForPositionV1(section.graph, position)
      for (const code of normalizations) warnings.push(`${section.path}.composition.continuityToNext: ${code}; no hay una seccion con grafo despues.`)
      const result = validateGraphSectionV1(graph, { ...grounding, hasCtaAction: section.hasCtaAction ?? grounding.hasCtaAction }, position)
      if (result.ok === false) {
        warnings.push(`${section.path}.composition: ${[...new Set(result.diagnostics.map((diagnostic) => diagnostic.code))].join(",")}; la seccion usara V1.`)
      } else if (result.graph.beat === "peak") peaks += 1
    })
  }
  return warnings
}

function regionsOf(graph: GraphSectionV1): GraphRegionV1[] {
  const out: GraphRegionV1[] = []
  const walk = (regions: readonly GraphRegionV1[]) => {
    for (const region of regions) {
      out.push(region)
      if (region.regions) walk(region.regions)
    }
  }
  walk(Array.isArray(graph.regions) ? graph.regions : [])
  return out
}

/** Aesthetic degeneracy -> warnings only (a simple, restrained site is legitimate). */
export function diagnoseGraphDegeneracyV1(blueprint: FullSiteCreativeBlueprintV1): string[] {
  const warnings: string[] = []
  const pageFingerprints: string[] = []
  const all: GraphSectionV1[] = []
  for (const [pageIndex, page] of blueprint.pages.entries()) {
    const graphs = page.sections.map((section) => section.composition).filter((graph): graph is GraphSectionV1 => Boolean(graph))
    all.push(...graphs)
    if (graphs.length >= 3 && new Set(graphs.map(graphFingerprintV1)).size === 1) warnings.push(`degeneracy: pages[${pageIndex}] repite el mismo grafo en todas sus secciones.`)
    if (graphs.length) pageFingerprints.push(graphs.map(graphFingerprintV1).join("|"))
  }
  if (pageFingerprints.length >= 2 && new Set(pageFingerprints).size === 1) warnings.push("degeneracy: todas las paginas usan exactamente los mismos grafos.")
  if (all.length >= 3) {
    if (all.every((graph) => graph.density === 3)) warnings.push("degeneracy: todas las secciones con grafo tienen density 3.")
    const weights = all.flatMap((graph) => regionsOf(graph).map((region) => region.weight))
    if (weights.length && weights.every((weight) => weight === 5)) warnings.push("degeneracy: todas las regiones tienen weight 5 (sin jerarquia).")
    const continuities = all.map((graph) => graph.continuityToNext).filter(Boolean)
    if (continuities.length >= 3 && continuities.every((continuity) => continuity === "contrast")) warnings.push("degeneracy: todas las transiciones son contrast.")
    if (all.every((graph) => regionsOf(graph).some((region) => region.anchor))) warnings.push("degeneracy: todas las secciones declaran un ancla focal.")
  }
  return warnings
}
