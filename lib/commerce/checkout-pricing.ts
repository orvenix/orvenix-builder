import { z } from "zod"

/**
 * COMMERCE-1: the pure, server-authoritative core of
 * POST /api/store/[siteId]/checkout, extracted verbatim from the route so
 * it can be proven without a DB, Order rows or Mercado Pago.
 *
 * Authority rules (unchanged from the route):
 *   - the browser may send ONLY { variantId, quantity } per item (plus
 *     buyer/funnel/experiment fields); zod strips every other key, so a
 *     client-supplied price/name/productId can never reach pricing;
 *   - every line item's name, SKU and priceMxn come from the DB variant
 *     row, and the total is recomputed here;
 *   - every requested variant must resolve to a row of THIS site whose
 *     product is "active", or the whole checkout is INVALID_ITEMS;
 *   - a variant id may appear only ONCE per request (duplicates were
 *     already INVALID_ITEMS via the row-count check; now explicit), so
 *     quantities can't be split across lines to dodge the stock check;
 *   - COMMERCE-1 security pass: requested quantity must be <= the
 *     variant's CURRENT stock, else INSUFFICIENT_STOCK -- evaluated before
 *     the route creates any Order or Mercado Pago preference.
 *
 * Stock semantics (derived, not invented): ProductVariant.stock is a
 * non-null Int, default 0, every write API enforces >= 0, and the payment
 * webhook only decrements when `stock >= quantity`. So stock is always
 * tracked and finite; 0 (or any negative value written out-of-band) means
 * unavailable. The UI-only "-1 = unlimited" convention in ProductCard /
 * product-detail.ts is NOT honored by the DB/webhook, so it is not honored
 * here either.
 *
 * This prevents obviously impossible checkouts. It does NOT reserve stock:
 * two concurrent checkouts can both pass and race at payment time, where
 * the webhook's conditional decrement still guards (the loser becomes
 * "paid_review").
 */
export const StoreCheckoutSchemaV1 = z.object({
  customerEmail: z.string().email().max(191),
  customerName: z.string().max(191).optional(),
  funnelId: z.string().min(1).max(191).optional(),
  funnelStep: z.enum(["landing", "checkout", "upsell", "downsell", "thankyou"]).optional(),
  funnelStepId: z.string().min(1).max(191).optional(),
  offerAccepted: z.boolean().optional(),
  experimentId: z.string().min(1).max(191).optional(),
  experimentVariant: z.enum(["A", "B"]).optional(),
  items: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
})

export type StoreCheckoutRequestedItemV1 = { variantId: string; quantity: number }

/** Structural subset of `productVariant.findMany({ include: { product: true } })` rows. */
export type StoreCheckoutVariantRowV1 = {
  id: string
  productId: string
  name: string
  sku: string
  priceMxn: number
  stock: number
  product: { name: string; siteId: string; status: string }
}

export type StoreCheckoutBaseItemV1 = {
  variantId: string
  productId: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  priceMxn: number
  subtotalMxn: number
}

export type StoreCheckoutPricingResultV1 =
  | { ok: true; items: StoreCheckoutBaseItemV1[]; totalMxn: number }
  | { ok: false; error: "INVALID_ITEMS" }
  | { ok: false; error: "INSUFFICIENT_STOCK"; variantId: string }

const MAX_ITEM_QUANTITY = 99

export function buildStoreCheckoutBaseItemsV1(params: {
  siteId: string
  requestedItems: readonly StoreCheckoutRequestedItemV1[]
  variants: readonly StoreCheckoutVariantRowV1[]
}): StoreCheckoutPricingResultV1 {
  const requestedByVariant = new Map<string, number>()
  for (const item of params.requestedItems) {
    if (requestedByVariant.has(item.variantId)) return { ok: false, error: "INVALID_ITEMS" }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) return { ok: false, error: "INVALID_ITEMS" }
    requestedByVariant.set(item.variantId, item.quantity)
  }

  if (params.variants.length !== params.requestedItems.length) return { ok: false, error: "INVALID_ITEMS" }
  const seenRows = new Set<string>()
  for (const variant of params.variants) {
    // Defense in depth: the route's DB query already filters by site + active product.
    if (seenRows.has(variant.id) || !requestedByVariant.has(variant.id) || variant.product.siteId !== params.siteId || variant.product.status !== "active") {
      return { ok: false, error: "INVALID_ITEMS" }
    }
    seenRows.add(variant.id)
  }

  for (const variant of params.variants) {
    const quantity = requestedByVariant.get(variant.id) ?? 0
    if (!Number.isInteger(variant.stock) || variant.stock < quantity) {
      return { ok: false, error: "INSUFFICIENT_STOCK", variantId: variant.id }
    }
  }

  const items = params.variants.map((variant) => {
    const quantity = requestedByVariant.get(variant.id) ?? 1
    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity,
      priceMxn: variant.priceMxn,
      subtotalMxn: variant.priceMxn * quantity,
    }
  })
  return { ok: true, items, totalMxn: items.reduce((sum, item) => sum + item.subtotalMxn, 0) }
}
