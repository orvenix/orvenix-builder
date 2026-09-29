/**
 * COMMERCE-6: the public, authoritative view of ONE store product for the
 * dynamic product-detail runtime. Pure (the DB read lives in
 * public-product-detail-repository.ts).
 *
 * Same publicity rule as checkout (lib/commerce/checkout-pricing.ts): a
 * product is public only when it belongs to THIS site and is "active".
 * Anything else -- another site's product, a draft, a product with no
 * valid variant -- fails closed (null). Only display facts leave: no SKU,
 * no metadata, no Mercado Pago ids. Every value is copied from the row;
 * nothing is derived or invented.
 */

export interface PublicProductVariantV1 {
  variantId: string
  label: string
  priceMxn: number
  comparePriceMxn?: number
  /** Authoritative stock (the existing card convention: -1 = unlimited). */
  stock: number
}

export interface PublicProductDetailV1 {
  productId: string
  name: string
  description?: string
  imageUrl?: string
  variants: PublicProductVariantV1[]
}

export interface PublicProductRowV1 {
  id: string
  siteId: string
  name: string
  description: string | null
  status: string
  media: unknown
  variants: ReadonlyArray<{ id: string; name: string; priceMxn: number; comparePriceMxn: number | null; stock: number }>
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,191}$/

function primaryImageUrl(media: unknown): string | undefined {
  if (!Array.isArray(media)) return undefined
  for (const entry of media) {
    if (typeof entry !== "string") continue
    const url = entry.trim()
    if (/^https:\/\/\S+$/i.test(url) || /^\/(?!\/)\S+$/.test(url)) return url
  }
  return undefined
}

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

export function toPublicProductDetailV1(row: PublicProductRowV1 | null | undefined, siteId: string): PublicProductDetailV1 | null {
  if (!row || row.siteId !== siteId || row.status !== "active" || !ID_PATTERN.test(row.id)) return null
  const name = row.name?.trim()
  if (!name) return null

  const variants: PublicProductVariantV1[] = []
  for (const variant of row.variants) {
    if (!ID_PATTERN.test(variant.id) || !validPrice(variant.priceMxn) || !Number.isInteger(variant.stock)) continue
    variants.push({
      variantId: variant.id,
      label: variant.name?.trim() || "Única",
      priceMxn: variant.priceMxn,
      ...(validPrice(variant.comparePriceMxn) && variant.comparePriceMxn > variant.priceMxn ? { comparePriceMxn: variant.comparePriceMxn } : {}),
      stock: variant.stock,
    })
  }
  if (!variants.length) return null

  const description = row.description?.trim()
  const imageUrl = primaryImageUrl(row.media)
  return {
    productId: row.id,
    name,
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    variants,
  }
}
