/**
 * COMMERCE-1: bounded commerce fact contract for AI Site Creation.
 *
 * Two kinds of product fact flow through the site-creation pipeline:
 *
 *   PRESENTATION product -- name/description plus OPTIONAL display facts
 *     (category, variants with price/compare price/availability). Never
 *     carries store identifiers. Compiles to static presentation content
 *     only; it can never emit a functional add-to-cart control. This is
 *     the ONLY kind normalizeCommercePresentationProductsV1 produces, no
 *     matter what the (possibly customer-controlled) input contains --
 *     any productId/variantId/binding-looking field is dropped, never
 *     inferred.
 *
 *   BOUND EXECUTABLE product -- produced ONLY by
 *     bindStoreProductRecordsV1 from already-fetched, server-side store
 *     records (Product + ProductVariant rows, status "active"). Carries
 *     the real Product.id / ProductVariant.id so the compiler can emit the
 *     EXISTING `store-product-card` block, whose add-to-cart feeds the
 *     EXISTING cart store -> CartDrawer -> /api/store/[siteId]/checkout.
 *
 * The store backend stays authoritative: checkout re-reads every variant
 * and price from the DB (lib/commerce/checkout-pricing.ts); display facts
 * here are never charged. AI/Assisted only ever sees bounded, id-free
 * views of these facts (assisted-generation/request-context.ts) and can
 * only select/reorder/group existing products -- it never writes a fact.
 */

export const COMMERCE_FACT_LIMITS_V1 = {
  maxProducts: 60,
  maxVariantsPerProduct: 8,
  maxNameLength: 120,
  maxDescriptionLength: 400,
  maxCategoryLength: 60,
  maxVariantLabelLength: 60,
  maxSkuLength: 128,
  maxIdLength: 191,
  /** Integer MXN cents -- same unit as ProductVariant.priceMxn. */
  maxPriceMxn: 1_000_000_000,
  maxInitialStock: 1_000_000,
  /** Mirrors ProductCard's default lowStockThreshold. */
  lowStockThreshold: 5,
} as const

export type CommerceAvailabilityV1 = "in_stock" | "low_stock" | "out_of_stock" | "preorder"

const PRESENTATION_AVAILABILITIES = new Set<CommerceAvailabilityV1>(["in_stock", "low_stock", "out_of_stock", "preorder"])

export type CommerceVariantFactV1 = {
  label: string
  /** Integer MXN cents. Display only -- checkout recomputes from the DB. */
  priceMxn: number
  /** Integer MXN cents, only when strictly greater than priceMxn. */
  comparePriceMxn?: number
  availability: CommerceAvailabilityV1
  sku?: string
  /** BOUND products only: real ProductVariant.id. */
  variantId?: string
  /** BOUND products only: real ProductVariant.stock (>= 0). */
  stock?: number
  /**
   * COMMERCE-2A: PRESENTATION-only seed for a future ProductVariant.stock
   * when a new store is provisioned after confirmation. Never makes a
   * product executable; ignored for bound products (DB stock wins).
   */
  initialStock?: number
}

export type CommerceStoreBindingV1 = {
  /** Real Product.id. */
  productId: string
}

/**
 * The product element type carried by AutonomousBusinessInput.products,
 * OrvenixSiteArchitecture.products and SectionCompositionContext.products.
 * A legacy `{ name, description? }` object is a valid (presentation)
 * CommerceProductFactV1 -- every commerce field is optional.
 */
export type CommerceProductFactV1 = {
  name: string
  description?: string
  /** Grounded display label, eg. "Tecnología". Never invented downstream. */
  category?: string
  variants?: CommerceVariantFactV1[]
  /** Present ONLY on BOUND executable products (bindStoreProductRecordsV1). */
  storeBinding?: CommerceStoreBindingV1
  /**
   * COMMERCE-2A: set ONLY by the builder when a trusted caller requested
   * new-store provisioning and this product is in the approved
   * CommerceProvisioningPlanV1. Compiles to a NON-executable pending
   * `store-product-card` (a provisioning reference, no ids) that the
   * confirm step binds to the real rows it creates. Never accepted from
   * input: normalizeCommercePresentationProductsV1 never copies it.
   */
  pendingProvisioning?: { sourceIndex: number; variantIndex: number }
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function cleanPrice(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) return undefined
  if (value <= 0 || value > COMMERCE_FACT_LIMITS_V1.maxPriceMxn) return undefined
  return value
}

/** Stable, closed-world key for a category label ("Tecnología" -> "tecnologia"). */
export function commerceCategoryKeyV1(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, COMMERCE_FACT_LIMITS_V1.maxCategoryLength)
}

export function availabilityFromStockV1(stock: number): CommerceAvailabilityV1 {
  if (stock <= 0) return "out_of_stock"
  if (stock <= COMMERCE_FACT_LIMITS_V1.lowStockThreshold) return "low_stock"
  return "in_stock"
}

function normalizePresentationVariant(value: unknown): CommerceVariantFactV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const label = cleanString(record.label, COMMERCE_FACT_LIMITS_V1.maxVariantLabelLength)
  const priceMxn = cleanPrice(record.priceMxn)
  if (!label || priceMxn === undefined) return null

  const comparePriceMxn = cleanPrice(record.comparePriceMxn)
  const availability = typeof record.availability === "string" && PRESENTATION_AVAILABILITIES.has(record.availability as CommerceAvailabilityV1)
    ? (record.availability as CommerceAvailabilityV1)
    : "in_stock"
  const sku = cleanString(record.sku, COMMERCE_FACT_LIMITS_V1.maxSkuLength)
  const initialStock = typeof record.initialStock === "number" && Number.isInteger(record.initialStock) && record.initialStock >= 0 && record.initialStock <= COMMERCE_FACT_LIMITS_V1.maxInitialStock
    ? record.initialStock
    : undefined

  // Deliberately NO variantId/stock: a presentation variant can never become executable.
  return {
    label,
    priceMxn,
    ...(comparePriceMxn !== undefined && comparePriceMxn > priceMxn ? { comparePriceMxn } : {}),
    availability,
    ...(sku ? { sku } : {}),
    ...(initialStock !== undefined ? { initialStock } : {}),
  }
}

/**
 * Normalizes caller-supplied (possibly customer-controlled) product facts
 * into bounded PRESENTATION facts. Accepts the legacy `{ name,
 * description? }` shape unchanged. Drops storeBinding/variantId/stock and
 * every unknown field -- this function can never produce an executable
 * product.
 */
export function normalizeCommercePresentationProductsV1(products: unknown): CommerceProductFactV1[] | undefined {
  if (!Array.isArray(products)) return undefined

  const normalized: CommerceProductFactV1[] = []
  for (const value of products.slice(0, COMMERCE_FACT_LIMITS_V1.maxProducts)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    const record = value as Record<string, unknown>
    const name = cleanString(record.name, COMMERCE_FACT_LIMITS_V1.maxNameLength)
    if (!name) continue

    const description = cleanString(record.description, COMMERCE_FACT_LIMITS_V1.maxDescriptionLength)
    const category = cleanString(record.category, COMMERCE_FACT_LIMITS_V1.maxCategoryLength)
    const variants = Array.isArray(record.variants)
      ? record.variants
          .slice(0, COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct)
          .map(normalizePresentationVariant)
          .filter((variant): variant is CommerceVariantFactV1 => variant !== null)
      : []

    normalized.push({
      name,
      ...(description ? { description } : {}),
      ...(category && commerceCategoryKeyV1(category) ? { category } : {}),
      ...(variants.length ? { variants } : {}),
    })
  }

  return normalized.length ? normalized : undefined
}

/**
 * Structural subset of the Prisma Product/ProductVariant rows
 * (prisma/editor.prisma) a TRUSTED server-side caller has already read for
 * the site being generated. This module never queries the DB itself.
 */
export type StoreProductRecordV1 = {
  id: string
  siteId: string
  name: string
  description?: string | null
  status: string
  /** Product.metadata JSON -- only a string `category` is read. */
  metadata?: unknown
  variants: Array<{
    id: string
    sku: string
    name: string
    priceMxn: number
    comparePriceMxn?: number | null
    stock: number
  }>
}

function metadataCategory(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return ""
  return cleanString((metadata as Record<string, unknown>).category, COMMERCE_FACT_LIMITS_V1.maxCategoryLength)
}

function cleanId(value: unknown): string {
  const id = cleanString(value, COMMERCE_FACT_LIMITS_V1.maxIdLength)
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : ""
}

/**
 * TRUSTED server-side binding: turns already-fetched store rows for ONE
 * site into BOUND executable product facts. Only `status === "active"`
 * products of `siteId` with >= 1 valid variant are kept (mirrors the
 * checkout route's own `product: { siteId, status: "active" }` filter).
 * Real ids are copied verbatim, never generated.
 */
export function bindStoreProductRecordsV1(siteId: string, records: readonly StoreProductRecordV1[]): CommerceProductFactV1[] {
  const boundSiteId = cleanId(siteId)
  if (!boundSiteId) return []

  const bound: CommerceProductFactV1[] = []
  for (const record of records.slice(0, COMMERCE_FACT_LIMITS_V1.maxProducts)) {
    if (record.siteId !== boundSiteId || record.status !== "active") continue
    const productId = cleanId(record.id)
    const name = cleanString(record.name, COMMERCE_FACT_LIMITS_V1.maxNameLength)
    if (!productId || !name) continue

    const variants: CommerceVariantFactV1[] = []
    for (const variant of record.variants.slice(0, COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct)) {
      const variantId = cleanId(variant.id)
      const priceMxn = cleanPrice(variant.priceMxn)
      const stock = Number.isInteger(variant.stock) && variant.stock >= 0 ? variant.stock : 0
      if (!variantId || priceMxn === undefined) continue
      const comparePriceMxn = cleanPrice(variant.comparePriceMxn ?? undefined)
      const sku = cleanString(variant.sku, COMMERCE_FACT_LIMITS_V1.maxSkuLength)
      variants.push({
        label: cleanString(variant.name, COMMERCE_FACT_LIMITS_V1.maxVariantLabelLength) || name,
        priceMxn,
        ...(comparePriceMxn !== undefined && comparePriceMxn > priceMxn ? { comparePriceMxn } : {}),
        availability: availabilityFromStockV1(stock),
        ...(sku ? { sku } : {}),
        variantId,
        stock,
      })
    }
    if (!variants.length) continue

    const description = cleanString(record.description, COMMERCE_FACT_LIMITS_V1.maxDescriptionLength)
    const category = metadataCategory(record.metadata)
    bound.push({
      name,
      ...(description ? { description } : {}),
      ...(category && commerceCategoryKeyV1(category) ? { category } : {}),
      variants,
      storeBinding: { productId },
    })
  }
  return bound
}

/**
 * The one variant a generated `store-product-card` binds to: the first
 * bound variant that is purchasable (stock > 0), else the first bound
 * variant (rendered as "Sin stock" by the existing card). `null` -> the
 * product is not executable and must render presentation-only.
 */
export function executableVariantForProductV1(product: CommerceProductFactV1): (CommerceVariantFactV1 & { variantId: string }) | null {
  if (!product.storeBinding?.productId) return null
  const bound = (product.variants ?? []).filter((variant): variant is CommerceVariantFactV1 & { variantId: string } => Boolean(variant.variantId))
  return bound.find((variant) => (variant.stock ?? 0) > 0) ?? bound[0] ?? null
}

export function isExecutableCommerceProductV1(product: CommerceProductFactV1): boolean {
  return executableVariantForProductV1(product) !== null
}

export function formatMxnCentsV1(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
}

/** Grounded display price line for PRESENTATION cards (lowest variant price, "Desde" when prices differ). */
export function presentationPriceLineV1(product: CommerceProductFactV1): string | undefined {
  const prices = (product.variants ?? []).map((variant) => variant.priceMxn)
  if (!prices.length) return undefined
  const lowest = Math.min(...prices)
  return `${new Set(prices).size > 1 ? "Desde " : ""}${formatMxnCentsV1(lowest)}`
}
