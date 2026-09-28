import {
  COMMERCE_FACT_LIMITS_V1,
  commerceCategoryKeyV1,
  type CommerceProductFactV1,
} from "./product-facts"

/**
 * COMMERCE-2A: the deterministic, bounded description of the store rows a
 * NEW-STORE Site Creation WOULD create after the user confirms.
 *
 * Built at PREVIEW time from already-normalized PRESENTATION facts (no DB
 * access, no ids), embedded in SiteCreationPlanV2.commerce, and therefore
 * covered by the same planHash the user confirms (previewHash). At
 * confirm, lib/orvenix-ai/commerce/provisioning-executor.ts creates exactly
 * these rows inside the site-creation transaction; nothing here is ever
 * AI-generated -- names/prices/stock trace back to `sourceIndex`, the
 * index of the product in the approved architecture's product list.
 *
 * All-or-nothing: a plan is only produced when EVERY product has at least
 * one priced variant, so a store never ships half-purchasable. Products
 * without a grounded price keep the COMMERCE-1 presentation behavior.
 */

export const COMMERCE_PROVISIONING_PLAN_VERSION_V1 = 1

export type CommerceProvisioningVariantV1 = {
  variantIndex: number
  label: string
  sku: string
  /** Integer MXN cents -- seeds ProductVariant.priceMxn; the DB is authoritative afterwards. */
  priceMxn: number
  comparePriceMxn?: number
  /** Seeds ProductVariant.stock (>= 0). Absent in the facts -> 0, the schema default (unavailable). */
  initialStock: number
}

export type CommerceProvisioningProductV1 = {
  sourceIndex: number
  name: string
  description: string
  category?: string
  variants: CommerceProvisioningVariantV1[]
}

export type CommerceProvisioningPlanV1 = {
  version: typeof COMMERCE_PROVISIONING_PLAN_VERSION_V1
  mode: "new_store"
  products: CommerceProvisioningProductV1[]
}

/** The SiteCreationPlanV2 `commerce` block (hash-covered). */
export type SiteCreationPlanV2CommerceV1 = {
  version: 1
  provisioning: CommerceProvisioningPlanV1
}

/** COMMERCE-2B: exported so the client commerce brief validates SKUs with the SAME server rule. */
export const COMMERCE_SKU_PATTERN_V1 = /^[A-Za-z0-9._-]{1,128}$/
const SKU_PATTERN = COMMERCE_SKU_PATTERN_V1

function fallbackSku(sourceIndex: number, variantIndex: number): string {
  return `ORV-${String(sourceIndex + 1).padStart(3, "0")}-${variantIndex + 1}`
}

export function buildCommerceProvisioningPlanV1(products: readonly CommerceProductFactV1[] | undefined): CommerceProvisioningPlanV1 | null {
  if (!products?.length || products.length > COMMERCE_FACT_LIMITS_V1.maxProducts) return null
  if (products.some((product) => product.storeBinding || !product.variants?.length)) return null

  const usedSkus = new Set<string>()
  const planned: CommerceProvisioningProductV1[] = products.map((product, sourceIndex) => ({
    sourceIndex,
    name: product.name,
    description: product.description ?? "",
    ...(product.category && commerceCategoryKeyV1(product.category) ? { category: product.category } : {}),
    variants: (product.variants ?? []).slice(0, COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct).map((variant, variantIndex) => {
      const candidate = variant.sku && SKU_PATTERN.test(variant.sku) && !usedSkus.has(variant.sku) ? variant.sku : fallbackSku(sourceIndex, variantIndex)
      usedSkus.add(candidate)
      return {
        variantIndex,
        label: variant.label,
        sku: candidate,
        priceMxn: variant.priceMxn,
        ...(variant.comparePriceMxn !== undefined && variant.comparePriceMxn > variant.priceMxn ? { comparePriceMxn: variant.comparePriceMxn } : {}),
        initialStock: variant.initialStock ?? 0,
      }
    }),
  }))

  return { version: COMMERCE_PROVISIONING_PLAN_VERSION_V1, mode: "new_store", products: planned }
}

/**
 * The variant a pending card represents: the first with initial stock,
 * else the first -- the same rule executableVariantForProductV1 applies to
 * bound products, so the confirmed card shows the variant previewed.
 */
export function pendingVariantIndexV1(product: CommerceProvisioningProductV1): number {
  return product.variants.find((variant) => variant.initialStock > 0)?.variantIndex ?? product.variants[0]?.variantIndex ?? 0
}

/** Marks the approved architecture products as pending provisioning (pure; order and content unchanged otherwise). */
export function markProductsPendingProvisioningV1(
  products: readonly CommerceProductFactV1[],
  plan: CommerceProvisioningPlanV1,
): CommerceProductFactV1[] {
  const bySource = new Map(plan.products.map((product) => [product.sourceIndex, product]))
  return products.map((product, index) => {
    const planned = bySource.get(index)
    return planned ? { ...product, pendingProvisioning: { sourceIndex: index, variantIndex: pendingVariantIndexV1(planned) } } : product
  })
}

export const PROVISIONING_REF_PREFIX_V1 = "orv-prov"

export function formatProvisioningRefV1(sourceIndex: number, variantIndex: number): string {
  return `${PROVISIONING_REF_PREFIX_V1}:${sourceIndex}:${variantIndex}`
}

export function parseProvisioningRefV1(value: unknown): { sourceIndex: number; variantIndex: number } | null {
  if (typeof value !== "string") return null
  const match = /^orv-prov:(\d{1,3}):(\d{1,2})$/.exec(value)
  if (!match) return null
  return { sourceIndex: Number(match[1]), variantIndex: Number(match[2]) }
}

// ---------------------------------------------------------------- strict validation (Plan V2 boundary)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, errors: string[]) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key} no es un campo permitido.`)
}

function isBoundedInt(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
}

function isBoundedText(value: unknown, max: number, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= max && (allowEmpty || value.trim().length > 0)
}

export function validateSiteCreationPlanV2CommerceV1(value: unknown): string[] {
  const errors: string[] = []
  if (!isRecord(value)) return ["commerce debe ser un objeto."]
  onlyKeys(value, ["version", "provisioning"], "commerce", errors)
  if (value.version !== 1) errors.push("commerce.version no es valido.")

  const plan = value.provisioning
  if (!isRecord(plan)) return [...errors, "commerce.provisioning debe ser un objeto."]
  onlyKeys(plan, ["version", "mode", "products"], "commerce.provisioning", errors)
  if (plan.version !== COMMERCE_PROVISIONING_PLAN_VERSION_V1) errors.push("commerce.provisioning.version no es valido.")
  if (plan.mode !== "new_store") errors.push("commerce.provisioning.mode no es valido.")
  if (!Array.isArray(plan.products) || plan.products.length < 1 || plan.products.length > COMMERCE_FACT_LIMITS_V1.maxProducts) {
    return [...errors, "commerce.provisioning.products fuera de limites."]
  }

  const skus = new Set<string>()
  for (const [index, product] of plan.products.entries()) {
    const path = `commerce.provisioning.products[${index}]`
    if (!isRecord(product)) {
      errors.push(`${path} debe ser un objeto.`)
      continue
    }
    onlyKeys(product, ["sourceIndex", "name", "description", "category", "variants"], path, errors)
    if (product.sourceIndex !== index) errors.push(`${path}.sourceIndex debe coincidir con su posicion.`)
    if (!isBoundedText(product.name, COMMERCE_FACT_LIMITS_V1.maxNameLength)) errors.push(`${path}.name invalido.`)
    if (!isBoundedText(product.description, COMMERCE_FACT_LIMITS_V1.maxDescriptionLength, true)) errors.push(`${path}.description invalida.`)
    if (product.category !== undefined && (!isBoundedText(product.category, COMMERCE_FACT_LIMITS_V1.maxCategoryLength) || !commerceCategoryKeyV1(product.category))) {
      errors.push(`${path}.category invalida.`)
    }
    if (!Array.isArray(product.variants) || product.variants.length < 1 || product.variants.length > COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct) {
      errors.push(`${path}.variants fuera de limites.`)
      continue
    }
    for (const [variantIndex, variant] of product.variants.entries()) {
      const variantPath = `${path}.variants[${variantIndex}]`
      if (!isRecord(variant)) {
        errors.push(`${variantPath} debe ser un objeto.`)
        continue
      }
      onlyKeys(variant, ["variantIndex", "label", "sku", "priceMxn", "comparePriceMxn", "initialStock"], variantPath, errors)
      if (variant.variantIndex !== variantIndex) errors.push(`${variantPath}.variantIndex debe coincidir con su posicion.`)
      if (!isBoundedText(variant.label, COMMERCE_FACT_LIMITS_V1.maxVariantLabelLength)) errors.push(`${variantPath}.label invalido.`)
      if (typeof variant.sku !== "string" || !SKU_PATTERN.test(variant.sku) || skus.has(variant.sku)) errors.push(`${variantPath}.sku invalido o duplicado.`)
      else skus.add(variant.sku)
      if (!isBoundedInt(variant.priceMxn, 1, COMMERCE_FACT_LIMITS_V1.maxPriceMxn)) errors.push(`${variantPath}.priceMxn debe ser un entero positivo en centavos.`)
      if (variant.comparePriceMxn !== undefined && (!isBoundedInt(variant.comparePriceMxn, 1, COMMERCE_FACT_LIMITS_V1.maxPriceMxn) || variant.comparePriceMxn <= (variant.priceMxn as number))) {
        errors.push(`${variantPath}.comparePriceMxn debe ser mayor que priceMxn.`)
      }
      if (!isBoundedInt(variant.initialStock, 0, COMMERCE_FACT_LIMITS_V1.maxInitialStock)) errors.push(`${variantPath}.initialStock debe ser un entero >= 0.`)
    }
  }
  return errors
}
