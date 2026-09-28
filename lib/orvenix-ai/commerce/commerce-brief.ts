import { COMMERCE_FACT_LIMITS_V1, commerceCategoryKeyV1 } from "./product-facts"
import { COMMERCE_SKU_PATTERN_V1 } from "./provisioning-plan"
import { SITE_CREATION_OFFERING_LIMITS_V1 } from "@/lib/orvenix-ai/site-creation/offering-limits"

/**
 * COMMERCE-2B: the pure, client-safe model behind the Site Creation
 * "commerce brief" (app/dashboard/CommerceBriefEditor.tsx). UX only -- the
 * server normalizers (business-normalization.ts + product-facts.ts) and the
 * provisioning-plan validator remain the trust boundary and re-check
 * everything. Every limit here is imported from those same modules, never
 * re-declared, so the two sides cannot drift into incompatible contracts.
 *
 * Draft `uiId`s exist ONLY for React keys / error addressing. The payload
 * builder copies an explicit allowlist of fields, so they (and any other
 * field) can never be submitted as Product/Variant ids.
 */

export const COMMERCE_BRIEF_LIMITS_V1 = {
  maxProducts: SITE_CREATION_OFFERING_LIMITS_V1.maxItems,
  maxVariantsPerProduct: COMMERCE_FACT_LIMITS_V1.maxVariantsPerProduct,
  maxNameLength: SITE_CREATION_OFFERING_LIMITS_V1.maxNameLength,
  maxDescriptionLength: SITE_CREATION_OFFERING_LIMITS_V1.maxDescriptionLength,
  maxCategoryLength: COMMERCE_FACT_LIMITS_V1.maxCategoryLength,
  maxVariantLabelLength: COMMERCE_FACT_LIMITS_V1.maxVariantLabelLength,
  maxSkuLength: COMMERCE_FACT_LIMITS_V1.maxSkuLength,
  maxPriceMxn: COMMERCE_FACT_LIMITS_V1.maxPriceMxn,
  maxInitialStock: COMMERCE_FACT_LIMITS_V1.maxInitialStock,
} as const

export const DEFAULT_VARIANT_LABEL_V1 = "Única"

export type CommerceBriefVariantDraftV1 = {
  uiId: string
  label: string
  /** Human MXN amount as typed, eg. "5499.00". */
  price: string
  comparePrice: string
  /** Whole units as typed. Required: blank never becomes an invented stock. */
  initialStock: string
  sku: string
}

export type CommerceBriefProductDraftV1 = {
  uiId: string
  name: string
  description: string
  category: string
  variants: CommerceBriefVariantDraftV1[]
}

export type CommerceBriefDraftV1 = {
  enabled: boolean
  products: CommerceBriefProductDraftV1[]
}

/** Exactly the public `business.products[]` element accepted by runOrvenixSiteCreationAction. */
export type CommerceBriefProductPayloadV1 = {
  name: string
  description?: string
  category?: string
  variants: Array<{
    label: string
    priceMxn: number
    comparePriceMxn?: number
    initialStock: number
    sku?: string
  }>
}

export type CommerceBriefErrorsV1 = Record<string, string>

export type CommerceBriefValidationV1 =
  | { ok: true; products: CommerceBriefProductPayloadV1[] | undefined }
  | { ok: false; errors: CommerceBriefErrorsV1; firstError: string }

function uiId(prefix: string): string {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

export function createCommerceVariantDraftV1(label = ""): CommerceBriefVariantDraftV1 {
  return { uiId: uiId("ui-variant"), label, price: "", comparePrice: "", initialStock: "", sku: "" }
}

export function createCommerceProductDraftV1(): CommerceBriefProductDraftV1 {
  return { uiId: uiId("ui-product"), name: "", description: "", category: "", variants: [createCommerceVariantDraftV1(DEFAULT_VARIANT_LABEL_V1)] }
}

export function createCommerceBriefDraftV1(): CommerceBriefDraftV1 {
  return { enabled: false, products: [createCommerceProductDraftV1()] }
}

// ---------------------------------------------------------------- MXN -> integer cents

export type MxnParseResultV1 = { ok: true; cents: number } | { ok: false; error: string }

const MXN_PATTERN = /^(\d{1,8})(?:\.(\d{1,2}))?$/

/**
 * Deterministic string -> integer cents. No floating point: the whole and
 * fractional parts are parsed as integers separately ("5499.9" -> 549990).
 * Accepts an optional leading "$" and surrounding spaces; rejects commas
 * (ambiguous decimal separator), signs, exponents, >2 decimals, zero and
 * anything above the server maximum.
 */
export function parseMxnToCentsV1(input: string): MxnParseResultV1 {
  const value = input.trim().replace(/^\$\s*/, "")
  if (!value) return { ok: false, error: "Indica un precio." }
  if (value.includes(",")) return { ok: false, error: "Usa punto para los decimales, sin comas (ej. 5499.00)." }
  const match = MXN_PATTERN.exec(value)
  if (!match) return { ok: false, error: "Precio inválido. Usa un número con hasta 2 decimales (ej. 5499.00)." }
  const cents = Number.parseInt(match[1], 10) * 100 + Number.parseInt((match[2] ?? "").padEnd(2, "0") || "0", 10)
  if (!Number.isSafeInteger(cents) || cents <= 0) return { ok: false, error: "El precio debe ser mayor que 0." }
  if (cents > COMMERCE_BRIEF_LIMITS_V1.maxPriceMxn) return { ok: false, error: "El precio excede el máximo permitido." }
  return { ok: true, cents }
}

export function formatCentsAsMxnInputV1(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`
}

// ---------------------------------------------------------------- stock / sku / category

export type StockParseResultV1 = { ok: true; units: number } | { ok: false; error: string }

export function parseInitialStockV1(input: string): StockParseResultV1 {
  const value = input.trim()
  if (!value) return { ok: false, error: "Indica el inventario inicial (0 si aún no tienes existencias)." }
  if (!/^\d{1,7}$/.test(value)) return { ok: false, error: "El inventario debe ser un número entero igual o mayor que 0." }
  const units = Number.parseInt(value, 10)
  if (units > COMMERCE_BRIEF_LIMITS_V1.maxInitialStock) return { ok: false, error: "El inventario excede el máximo permitido." }
  return { ok: true, units }
}

export function isValidCommerceSkuV1(sku: string): boolean {
  return COMMERCE_SKU_PATTERN_V1.test(sku)
}

// ---------------------------------------------------------------- validation + payload

export function commerceBriefFieldKeyV1(uiIdValue: string, field: string): string {
  return `${uiIdValue}.${field}`
}

/**
 * Validates the draft and, only when fully valid, builds the public payload.
 * Disabled brief -> `products: undefined` (no fake empty store is sent).
 */
export function validateCommerceBriefV1(draft: CommerceBriefDraftV1): CommerceBriefValidationV1 {
  if (!draft.enabled) return { ok: true, products: undefined }

  const errors: CommerceBriefErrorsV1 = {}
  const set = (key: string, message: string) => {
    if (!errors[key]) errors[key] = message
  }

  if (draft.products.length === 0) set("brief", "Agrega al menos un producto o desactiva la tienda.")
  if (draft.products.length > COMMERCE_BRIEF_LIMITS_V1.maxProducts) set("brief", `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxProducts} productos.`)

  const skuOwners = new Map<string, string>()
  const products: CommerceBriefProductPayloadV1[] = []

  for (const product of draft.products.slice(0, COMMERCE_BRIEF_LIMITS_V1.maxProducts)) {
    const name = product.name.trim()
    const description = product.description.trim()
    const category = product.category.trim()
    if (!name) set(commerceBriefFieldKeyV1(product.uiId, "name"), "El nombre del producto es obligatorio.")
    else if (name.length > COMMERCE_BRIEF_LIMITS_V1.maxNameLength) set(commerceBriefFieldKeyV1(product.uiId, "name"), `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxNameLength} caracteres.`)
    if (description.length > COMMERCE_BRIEF_LIMITS_V1.maxDescriptionLength) set(commerceBriefFieldKeyV1(product.uiId, "description"), `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxDescriptionLength} caracteres.`)
    if (category.length > COMMERCE_BRIEF_LIMITS_V1.maxCategoryLength) set(commerceBriefFieldKeyV1(product.uiId, "category"), `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxCategoryLength} caracteres.`)
    else if (category && !commerceCategoryKeyV1(category)) set(commerceBriefFieldKeyV1(product.uiId, "category"), "La categoría debe incluir letras o números.")

    if (product.variants.length === 0) set(commerceBriefFieldKeyV1(product.uiId, "variants"), "Cada producto necesita al menos una variante.")
    if (product.variants.length > COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct) set(commerceBriefFieldKeyV1(product.uiId, "variants"), `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct} variantes por producto.`)

    const variants: CommerceBriefProductPayloadV1["variants"] = []
    for (const variant of product.variants.slice(0, COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct)) {
      const key = (field: string) => commerceBriefFieldKeyV1(variant.uiId, field)
      const label = variant.label.trim()
      if (!label) set(key("label"), "Indica el nombre de la variante (ej. Única).")
      else if (label.length > COMMERCE_BRIEF_LIMITS_V1.maxVariantLabelLength) set(key("label"), `Máximo ${COMMERCE_BRIEF_LIMITS_V1.maxVariantLabelLength} caracteres.`)

      const price = parseMxnToCentsV1(variant.price)
      if ("error" in price) set(key("price"), price.error)

      let comparePriceMxn: number | undefined
      if (variant.comparePrice.trim()) {
        const compare = parseMxnToCentsV1(variant.comparePrice)
        if ("error" in compare) set(key("comparePrice"), compare.error)
        else if ("cents" in price && compare.cents <= price.cents) set(key("comparePrice"), "El precio anterior debe ser mayor que el precio actual.")
        else comparePriceMxn = compare.cents
      }

      const stock = parseInitialStockV1(variant.initialStock)
      if ("error" in stock) set(key("initialStock"), stock.error)

      const sku = variant.sku.trim()
      if (sku) {
        if (!isValidCommerceSkuV1(sku)) set(key("sku"), "SKU inválido: usa letras, números, punto, guion o guion bajo (máx. 128).")
        else if (skuOwners.has(sku)) {
          set(key("sku"), "Este SKU ya se usa en otra variante.")
          set(commerceBriefFieldKeyV1(skuOwners.get(sku)!, "sku"), "Este SKU ya se usa en otra variante.")
        } else skuOwners.set(sku, variant.uiId)
      }

      if (label && "cents" in price && "units" in stock) {
        variants.push({
          label,
          priceMxn: price.cents,
          ...(comparePriceMxn !== undefined ? { comparePriceMxn } : {}),
          initialStock: stock.units,
          ...(sku && isValidCommerceSkuV1(sku) ? { sku } : {}),
        })
      }
    }

    // Explicit allowlist: uiIds and any other draft field are never copied.
    products.push({
      name,
      ...(description ? { description } : {}),
      ...(category ? { category } : {}),
      variants,
    })
  }

  const keys = Object.keys(errors)
  if (keys.length) return { ok: false, errors, firstError: errors[keys[0]] }
  return { ok: true, products }
}

/** Count of pending (planned, not yet created) store cards in preview trees -- used for customer-facing messaging only. */
export function countPlannedStoreProductsInTreesV1(trees: ReadonlyArray<{ nodes: Record<string, { type: string; props?: Record<string, unknown> }> }>): number {
  let count = 0
  for (const tree of trees) {
    for (const node of Object.values(tree.nodes)) {
      if (node.type === "store-product-card" && typeof node.props?.provisioningRef === "string" && !node.props?.variantId) count += 1
    }
  }
  return count
}
