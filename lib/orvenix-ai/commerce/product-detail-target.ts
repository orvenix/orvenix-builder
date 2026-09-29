import {
  DYNAMIC_PRODUCT_DETAIL_HREF_PATTERN,
  PENDING_PRODUCT_DETAIL_HREF_PATTERN,
  SECTION_INSTANCE_PAGE_HREF_PATTERN,
} from "@/lib/orvenix-ai/architect/composition-plan"
import type { CommerceProductFactV1 } from "./product-facts"

/**
 * COMMERCE-6: the ONE authority deciding where a product's detail
 * affordance leads. Priority:
 *   1. the generated creative detail page for this EXACT product
 *      (`page:<slug>`, from the plan's productIndex -> slug map);
 *   2. the Orvenix dynamic detail runtime for the authoritative store
 *      product (`product:<productId>` when bound, `product-ref:<source
 *      index>` while pending provisioning -- the confirm step swaps in the
 *      real id).
 * A product never links to its own page, and a product with no store
 * identity (presentation-only) gets no target: nothing is invented.
 * Identity is the product's index / store binding -- never its name.
 */
export function resolveProductDetailTargetV1(params: {
  product: CommerceProductFactV1 | undefined
  productIndex: number
  creativeSlugByIndex: ReadonlyMap<number, string>
  currentPage: { slug: string; productIndex?: number }
}): string | undefined {
  const { product, productIndex, creativeSlugByIndex, currentPage } = params
  if (!product || productIndex === currentPage.productIndex) return undefined

  const creativeSlug = creativeSlugByIndex.get(productIndex)
  if (creativeSlug) {
    const href = `page:${creativeSlug}`
    if (creativeSlug === currentPage.slug || !SECTION_INSTANCE_PAGE_HREF_PATTERN.test(href)) return undefined
    return href
  }

  const productId = product.storeBinding?.productId
  if (typeof productId === "string") {
    const href = `product:${productId}`
    return DYNAMIC_PRODUCT_DETAIL_HREF_PATTERN.test(href) ? href : undefined
  }

  const pending = product.pendingProvisioning
  if (pending && Number.isInteger(pending.sourceIndex) && pending.sourceIndex >= 0) {
    const href = `product-ref:${pending.sourceIndex}`
    return PENDING_PRODUCT_DETAIL_HREF_PATTERN.test(href) ? href : undefined
  }
  return undefined
}

export function parsePendingProductDetailHrefV1(href: unknown): number | null {
  if (typeof href !== "string" || !PENDING_PRODUCT_DETAIL_HREF_PATTERN.test(href)) return null
  return Number(href.slice("product-ref:".length))
}
