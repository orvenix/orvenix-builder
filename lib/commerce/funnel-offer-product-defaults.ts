import type { FunnelStepOfferDraft } from "./funnel-offer-draft"

export type FunnelOfferCatalogVariant = {
  priceMxn: number
}

export type FunnelOfferCatalogProduct = {
  id: string
  name: string
  media?: unknown
  variants?: FunnelOfferCatalogVariant[]
}

function getPrimaryMediaUrl(media: unknown) {
  if (!Array.isArray(media)) return ""

  for (const entry of media) {
    if (typeof entry === "string" && entry.trim()) return entry.trim()
  }

  return ""
}

function getPrimaryPriceMxn(variants: FunnelOfferCatalogVariant[] | undefined) {
  if (!Array.isArray(variants) || variants.length === 0) return ""

  const prices = variants
    .map((variant) => variant.priceMxn)
    .filter((price) => Number.isFinite(price) && price >= 0)

  if (prices.length === 0) return ""
  return String(Math.min(...prices))
}

export function getFunnelOfferProductAutofill(
  product: FunnelOfferCatalogProduct | null | undefined,
  offerType: FunnelStepOfferDraft["type"],
  currentDraft: FunnelStepOfferDraft
): Partial<FunnelStepOfferDraft> {
  if (!product) return {}

  const nextPatch: Partial<FunnelStepOfferDraft> = {
    productId: product.id,
  }

  if (!currentDraft.label.trim()) {
    nextPatch.label = product.name
  }

  const primaryMediaUrl = getPrimaryMediaUrl(product.media)
  if (!currentDraft.imageUrl.trim() && primaryMediaUrl) {
    nextPatch.imageUrl = primaryMediaUrl
  }

  if (offerType === "free_gift") {
    nextPatch.priceMxn = ""
    return nextPatch
  }

  if (!currentDraft.priceMxn.trim()) {
    const primaryPriceMxn = getPrimaryPriceMxn(product.variants)
    if (primaryPriceMxn) nextPatch.priceMxn = primaryPriceMxn
  }

  return nextPatch
}
