import { COMMERCE_FACT_LIMITS_V1, commerceCategoryKeyV1, type CommerceAvailabilityV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media"
import { buildCreativeDirectorReferenceContextV1, type CreativeDesignReferenceV1 } from "@/lib/orvenix-ai/creative-director/reference-context"
import { retrieveDesignReferences } from "@/lib/orvenix-ai/design-reference/retrieve"
import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import { compositionMemoryProvenanceV1, emptyCompositionMemoryV1, type CompositionMemoryV1 } from "@/lib/orvenix-ai/design-memory/composition-memory"
import { catalogScaleV2, retrieveReferenceMotifsV2, toProviderDesignMotifsV2, type MotifPurposeV2, type MotifRetrievalContextV2, type ProviderDesignMotifV2 } from "@/lib/orvenix-ai/design-reference/motifs"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
} from "./contract"
import { buildFullSiteCommerceCapabilityManifestV1, FULL_SITE_BLUEPRINT_LIMITS_V1, FULL_SITE_COMMERCE_PAGE_PURPOSES_V1, FULL_SITE_CONTEXT_MAX_PRODUCTS_V1, type FullSiteCapabilityManifestV1 } from "./capability-manifest"
import type { FullSiteCreativeGroundingContextV1 } from "./validator"

/**
 * FULL-SITE-4A: the bounded, sanitized request the external Full-Site
 * Creative Architect receives. Built ONLY from already-normalized Orvenix
 * facts through an explicit field allowlist -- never by spreading an
 * input object -- so ids, bindings, SKUs, stock counts, emails, preview
 * ids, credentials, EditorTrees and DB records cannot be carried along.
 *
 * Prices are included as READ-ONLY merchandising context (the validator
 * rejects any price/stock/sku field in the output, and checkout stays
 * DB-authoritative). Availability is an enum, never a stock number.
 *
 * Bounds: the INTERNAL architect universe (up to COMMERCE_FACT_LIMITS_V1
 * .maxProducts = 60, enough for the 24-product NovaMarket stress test) --
 * deliberately NOT the public 8-product Site Creation form limit.
 */

export const FULL_SITE_REQUEST_LIMITS_V1 = {
  maxProducts: FULL_SITE_CONTEXT_MAX_PRODUCTS_V1,
  maxVariantLabelsPerProduct: 4,
  maxCategories: 24,
  maxDesignReferences: 4,
  maxNameLength: COMMERCE_FACT_LIMITS_V1.maxNameLength,
  maxDescriptionLength: 200,
  maxBusinessTextLength: 180,
  /** Hard ceiling on the serialized user message (characters). */
  maxSerializedLength: 60_000,
} as const

const REDACTIONS: ReadonlyArray<RegExp> = [
  /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, // emails
  /\b(?:https?|ftp|file|javascript|data):\S*/gi, // URLs / schemes
  /\bwww\.\S+/gi,
  /\b(?:sk|pk|rk|key|api|tok)[-_][A-Za-z0-9_-]{8,}\b/gi, // key-shaped tokens
  /\b(?:site|scp|prod|var|cm2a|user|usr|preview|order|pay|mp)_[A-Za-z0-9_]{4,}\b/gi, // internal ids
  /\bc[a-z0-9]{20,}\b/g, // cuid-like DB ids
  /\b[A-Fa-f0-9]{32,}\b/g, // hashes
  /(?:\/(?:home|var|etc|usr|tmp|opt|srv|root|api|app|lib|prisma|p|preview|editor)\/)\S*/g, // internal paths/routes
  /[A-Za-z]:\\\S*/g,
  // FULL-SITE-5C: gaps found by the canonical request guard (request-guard.ts).
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUID-shaped ids
  /\bBearer\s+\S+/gi, // bearer credentials
  /(?:^|(?<=[^A-Za-z0-9._-]))\/dev-[a-z0-9-]+(?:[/?#]\S*)?/gi, // internal dev routes
  /\b(?:DATABASE_URL|NEXTAUTH_SECRET|API_KEY|SECRET_KEY|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_(?:API_KEY|SECRET|SECRET_KEY|PASSWORD|TOKEN|PRIVATE_KEY))\b/g, // secret env-var names (case-sensitive)
]

function safeText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined
  let text = value.replace(/[\u0000-\u001f<>{}`]/g, " ")
  for (const pattern of REDACTIONS) text = text.replace(pattern, " ")
  text = text.replace(/\s+/g, " ").trim().slice(0, max).trim()
  return text || undefined
}

export type FullSiteRequestProductV1 = {
  index: number
  name: string
  description?: string
  categoryKey?: string
  priceMxn?: number
  comparePriceMxn?: number
  availability?: CommerceAvailabilityV1
  variantCount?: number
  variantLabels?: string[]
  /** CF-3A: present (true) only when the product has an authoritative image -> eligible for product-media refs. */
  hasImage?: true
}

export type FullSiteRequestCategoryV1 = { key: string; label: string; productIndexes: number[] }

export type FullSiteCreativeRequestContextV1 = {
  outputContract: { version: typeof FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1; roleKey: typeof FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1; strategyKey: typeof FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 }
  business: { siteType: "ecommerce"; industry?: string; objective?: string; location?: string }
  catalog: { productCount: number; products: FullSiteRequestProductV1[]; categories: FullSiteRequestCategoryV1[] }
  capabilities: FullSiteCapabilityManifestV1
  /** CF-4B: SLIM descriptive inspiration only (structure now comes from designMotifs). */
  designReferences?: FullSiteDesignReferenceSignalV1[]
  /** CF-4B: business-conditioned, structurally diverse, de-identified relational motifs (request-local labels A-F). */
  designMotifs?: ProviderDesignMotifV2[]
  designDirection?: { tone?: string; density?: string; premiumCompositionTreatment?: string }
}

export type FullSiteCreativeRequestV1 = {
  context: FullSiteCreativeRequestContextV1
  grounding: FullSiteCreativeGroundingContextV1
  /** CF-4C: Orvenix-side diagnostics, NEVER sent to the provider (the provider only sees the resulting motif selection). */
  diagnostics: {
    motifMemory: ReturnType<typeof compositionMemoryProvenanceV1> & { downweightedMotifIds: string[]; selectedMotifIds: string[] }
  }
}

export class FullSiteRequestContextErrorV1 extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FullSiteRequestContextErrorV1"
  }
}

function productContext(product: CommerceProductFactV1, index: number, compact: boolean): FullSiteRequestProductV1 {
  const variants = product.variants ?? []
  const cheapest = variants.length ? variants.reduce((low, variant) => (variant.priceMxn < low.priceMxn ? variant : low)) : undefined
  const availabilities = new Set(variants.map((variant) => variant.availability))
  const categoryKey = product.category ? commerceCategoryKeyV1(product.category) : ""
  const description = compact ? undefined : safeText(product.description, FULL_SITE_REQUEST_LIMITS_V1.maxDescriptionLength)
  const labels = compact ? [] : variants.slice(0, FULL_SITE_REQUEST_LIMITS_V1.maxVariantLabelsPerProduct).map((variant) => safeText(variant.label, COMMERCE_FACT_LIMITS_V1.maxVariantLabelLength)).filter((label): label is string => Boolean(label))
  return {
    index,
    name: safeText(product.name, FULL_SITE_REQUEST_LIMITS_V1.maxNameLength) ?? `Producto ${index + 1}`,
    ...(description ? { description } : {}),
    ...(categoryKey ? { categoryKey } : {}),
    ...(cheapest && Number.isInteger(cheapest.priceMxn) ? { priceMxn: cheapest.priceMxn } : {}),
    ...(cheapest?.comparePriceMxn !== undefined && cheapest.comparePriceMxn > cheapest.priceMxn ? { comparePriceMxn: cheapest.comparePriceMxn } : {}),
    ...(availabilities.size === 1 ? { availability: [...availabilities][0] } : availabilities.size > 1 ? { availability: availabilities.has("in_stock") ? "in_stock" : [...availabilities][0] } : {}),
    ...(variants.length > 1 ? { variantCount: Math.min(variants.length, COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct) } : {}),
    ...(labels.length > 1 ? { variantLabels: labels } : {}),
    ...(product.imageUrls?.some(isSafeProductMediaUrlV1) ? { hasImage: true as const } : {}),
  }
}

/**
 * CF-4B: what a Design Reference still contributes once motifs carry the
 * structure -- a short descriptive signal the provider can act on
 * (personality, density tendency, hero alignment/media, commerce traits).
 * Dropped from the provider view: theme mode/accent/radius/shadow/contrast
 * (Orvenix owns the theme), nav surface/position/shadow (not
 * provider-controllable), recurring treatments the renderer cannot
 * produce, and the retrieval diagnostics (relevanceScore,
 * diversityReason, contributionRoles). The underlying retrieval and
 * CreativeDesignReferenceV1 are unchanged.
 */
export type FullSiteDesignReferenceSignalV1 = {
  personality: CreativeDesignReferenceV1["visualGrammar"]["designPersonality"]
  density: CreativeDesignReferenceV1["sectionGrammar"]["density"]
  hero: { alignment: CreativeDesignReferenceV1["heroGrammar"]["alignment"]; media: CreativeDesignReferenceV1["heroGrammar"]["mediaStrategy"] }
  traits: CreativeDesignReferenceV1["distinctiveTraits"]
}

export function slimFullSiteDesignReferenceV1(reference: CreativeDesignReferenceV1): FullSiteDesignReferenceSignalV1 {
  return {
    personality: reference.visualGrammar.designPersonality,
    density: reference.sectionGrammar.density,
    hero: { alignment: reference.heroGrammar.alignment, media: reference.heroGrammar.mediaStrategy },
    traits: [...reference.distinctiveTraits],
  }
}

/**
 * CF-4B: motif retrieval context from facts this request already has --
 * offering kind (commerce), catalog size, category count, planned page
 * purposes, Creative Director tone/density, description richness, grounded
 * media. Never an industry string.
 *
 * Catalog size: `catalogTotalCount` when a trusted caller knows the
 * authoritative total; otherwise the builder's normalized product facts
 * (themselves capped at COMMERCE_FACT_LIMITS_V1.maxProducts) -- recorded
 * as `builder_facts` so the limitation stays visible.
 */
export function deriveFullSiteMotifContextV1(params: {
  products: readonly CommerceProductFactV1[]
  categoryCount: number
  creativeDirection?: CreativeSiteDirectionV1 | null
  catalogTotalCount?: number
  avoidShapeSignatures?: readonly string[]
}): MotifRetrievalContextV2 {
  const authoritative = typeof params.catalogTotalCount === "number" && Number.isInteger(params.catalogTotalCount) && params.catalogTotalCount >= 0
  const count = authoritative ? params.catalogTotalCount! : params.products.length
  const scale = catalogScaleV2(count)
  const tone = params.creativeDirection?.tone
  const density = params.creativeDirection?.density
  const described = params.products.filter((product) => (product.description?.trim().length ?? 0) >= 60).length
  return {
    mode: "commerce",
    ...(tone === "playful" || tone === "warm" ? { secondaryMode: "editorial" as const } : {}),
    scale,
    catalogCount: count,
    catalogCountSource: authoritative ? "authoritative" : "builder_facts",
    categoryCount: params.categoryCount,
    purposes: [...FULL_SITE_COMMERCE_PAGE_PURPOSES_V1] as MotifPurposeV2[],
    densityPreference: density === "compact" ? "rich" : density === "spacious" ? "sparse" : density === "standard" ? "balanced" : scale === "large" ? "rich" : scale === "small" ? "sparse" : "balanced",
    restrained: tone === "formal" || tone === "conservative",
    contentRichness: params.products.length && described / params.products.length >= 0.5 ? "rich" : "sparse",
    hasGroundedMedia: params.products.some((product) => product.imageUrls?.some(isSafeProductMediaUrlV1)),
    ...(params.avoidShapeSignatures?.length ? { avoidShapeSignatures: [...params.avoidShapeSignatures] } : {}),
  }
}

export function buildFullSiteCreativeRequestV1(params: {
  industry?: string
  objective?: string
  location?: string
  products: readonly CommerceProductFactV1[]
  designReferences?: readonly CreativeDesignReferenceV1[]
  creativeDirection?: CreativeSiteDirectionV1 | null
  /** CF-4B: authoritative catalog total when known (else builder facts are used and recorded as such). */
  catalogTotalCount?: number
  /** CF-4C hook: recently used shape signatures to down-weight. */
  avoidShapeSignatures?: readonly string[]
  /** CF-4C: the owner's derived composition memory (recency -> soft avoid). Absent -> exact CF-4B behavior. */
  compositionMemory?: CompositionMemoryV1 | null
}): FullSiteCreativeRequestV1 {
  const products = params.products.slice(0, FULL_SITE_REQUEST_LIMITS_V1.maxProducts)
  if (!products.length) throw new FullSiteRequestContextErrorV1("full_site_context_requires_products")

  const categories = new Map<string, FullSiteRequestCategoryV1>()
  for (const [index, product] of products.entries()) {
    // Key from the raw grounded label (exactly what the commerce adapter grounds against); only the display label is redacted.
    const key = product.category?.trim() ? commerceCategoryKeyV1(product.category.trim()) : ""
    const label = safeText(product.category, COMMERCE_FACT_LIMITS_V1.maxCategoryLength) ?? key
    if (!label || !key) continue
    const entry = categories.get(key) ?? { key, label, productIndexes: [] }
    entry.productIndexes.push(index)
    categories.set(key, entry)
  }
  const categoryList = [...categories.values()].slice(0, FULL_SITE_REQUEST_LIMITS_V1.maxCategories)
  const avoidShapeSignatures = [...new Set([...(params.avoidShapeSignatures ?? []), ...(params.compositionMemory?.recentShapeSignatures ?? [])])]
  const motifContext = deriveFullSiteMotifContextV1({ products: params.products, categoryCount: categoryList.length, creativeDirection: params.creativeDirection, catalogTotalCount: params.catalogTotalCount, avoidShapeSignatures })
  const motifResult = retrieveReferenceMotifsV2(motifContext)
  const designMotifs = toProviderDesignMotifsV2(motifResult.selections, motifContext.purposes)
  const memoryProvenance = compositionMemoryProvenanceV1(params.compositionMemory ?? emptyCompositionMemoryV1())

  const direction = params.creativeDirection
  const designDirection = direction
    ? {
        ...(typeof direction.tone === "string" ? { tone: direction.tone } : {}),
        ...(typeof direction.density === "string" ? { density: direction.density } : {}),
        ...(typeof direction.premiumCompositionTreatment === "string" ? { premiumCompositionTreatment: direction.premiumCompositionTreatment } : {}),
      }
    : undefined

  const build = (compact: boolean): FullSiteCreativeRequestContextV1 => {
    const industry = safeText(params.industry, FULL_SITE_REQUEST_LIMITS_V1.maxBusinessTextLength)
    const objective = safeText(params.objective, FULL_SITE_REQUEST_LIMITS_V1.maxBusinessTextLength)
    const location = safeText(params.location, 120)
    const references = (params.designReferences ?? []).slice(0, FULL_SITE_REQUEST_LIMITS_V1.maxDesignReferences).map(slimFullSiteDesignReferenceV1)
    return {
      outputContract: { version: FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1, roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 },
      business: { siteType: "ecommerce", ...(industry ? { industry } : {}), ...(objective ? { objective } : {}), ...(location ? { location } : {}) },
      catalog: { productCount: products.length, products: products.map((product, index) => productContext(product, index, compact)), categories: categoryList },
      capabilities: buildFullSiteCommerceCapabilityManifestV1(),
      ...(references.length && !compact ? { designReferences: references } : {}),
      // Structure survives the compact fallback; descriptive references do not.
      ...(designMotifs.length ? { designMotifs } : {}),
      ...(designDirection && Object.keys(designDirection).length ? { designDirection } : {}),
    }
  }

  let context = build(false)
  if (JSON.stringify(context).length > FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength) context = build(true)
  if (JSON.stringify(context).length > FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength) throw new FullSiteRequestContextErrorV1("full_site_context_too_large")

  return {
    context,
    grounding: { productCount: products.length, categoryKeys: categoryList.map((category) => category.key), maxPages: FULL_SITE_BLUEPRINT_LIMITS_V1.maxPages },
    diagnostics: { motifMemory: { ...memoryProvenance, downweightedMotifIds: motifResult.downweightedIds, selectedMotifIds: motifResult.selections.map((selection) => selection.motif.motifId) } },
  }
}

/**
 * Reuses the accepted deterministic Design Reference retrieval (relevance +
 * MMR diversity) and the Creative Director's sanitizer -- grammar only, no
 * source copy/URLs. Pure and local: no network.
 */
export function retrieveFullSiteCommerceDesignReferencesV1(): CreativeDesignReferenceV1[] {
  return buildCreativeDirectorReferenceContextV1(
    retrieveDesignReferences({ businessAffinity: "retail-commerce", conversionIntent: "catalog", pagePurposes: ["home", "catalog"], hasProducts: true, siteType: "ecommerce" }, { count: FULL_SITE_REQUEST_LIMITS_V1.maxDesignReferences }),
  )
}
