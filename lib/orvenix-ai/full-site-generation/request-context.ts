import { COMMERCE_FACT_LIMITS_V1, commerceCategoryKeyV1, type CommerceAvailabilityV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import { isSafeProductMediaUrlV1 } from "@/lib/commerce/product-media"
import { buildCreativeDirectorReferenceContextV1, type CreativeDesignReferenceV1 } from "@/lib/orvenix-ai/creative-director/reference-context"
import { retrieveDesignReferences } from "@/lib/orvenix-ai/design-reference/retrieve"
import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
} from "./contract"
import { buildFullSiteCommerceCapabilityManifestV1, FULL_SITE_BLUEPRINT_LIMITS_V1, FULL_SITE_CONTEXT_MAX_PRODUCTS_V1, type FullSiteCapabilityManifestV1 } from "./capability-manifest"
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
  designReferences?: Array<Omit<CreativeDesignReferenceV1, "id">>
  designDirection?: { tone?: string; density?: string; premiumCompositionTreatment?: string }
}

export type FullSiteCreativeRequestV1 = {
  context: FullSiteCreativeRequestContextV1
  grounding: FullSiteCreativeGroundingContextV1
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

function stripReferenceId(reference: CreativeDesignReferenceV1): Omit<CreativeDesignReferenceV1, "id"> {
  const { id: _id, ...grammar } = reference
  void _id
  return structuredClone(grammar)
}

export function buildFullSiteCreativeRequestV1(params: {
  industry?: string
  objective?: string
  location?: string
  products: readonly CommerceProductFactV1[]
  designReferences?: readonly CreativeDesignReferenceV1[]
  creativeDirection?: CreativeSiteDirectionV1 | null
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
    const references = (params.designReferences ?? []).slice(0, FULL_SITE_REQUEST_LIMITS_V1.maxDesignReferences).map(stripReferenceId)
    return {
      outputContract: { version: FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1, roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1, strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1 },
      business: { siteType: "ecommerce", ...(industry ? { industry } : {}), ...(objective ? { objective } : {}), ...(location ? { location } : {}) },
      catalog: { productCount: products.length, products: products.map((product, index) => productContext(product, index, compact)), categories: categoryList },
      capabilities: buildFullSiteCommerceCapabilityManifestV1(),
      ...(references.length && !compact ? { designReferences: references } : {}),
      ...(designDirection && Object.keys(designDirection).length ? { designDirection } : {}),
    }
  }

  let context = build(false)
  if (JSON.stringify(context).length > FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength) context = build(true)
  if (JSON.stringify(context).length > FULL_SITE_REQUEST_LIMITS_V1.maxSerializedLength) throw new FullSiteRequestContextErrorV1("full_site_context_too_large")

  return {
    context,
    grounding: { productCount: products.length, categoryKeys: categoryList.map((category) => category.key), maxPages: FULL_SITE_BLUEPRINT_LIMITS_V1.maxPages },
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
