import { editorPrisma } from "@/lib/editor-db"
import { isValidDynamicProductId } from "@/lib/builder-core/tree/pageLinks"
import { toPublicProductDetailV1, type PublicProductDetailV1 } from "./public-product-detail"

/**
 * COMMERCE-6: read-only lookup for the dynamic product-detail runtime. The
 * query itself is scoped to (id, siteId, status "active") -- a product of
 * another store can never be read through a site's URL -- and the pure
 * normalizer re-checks the same rule. Malformed ids never reach the DB.
 */
export async function getPublicProductDetailV1(siteId: string, productId: string): Promise<PublicProductDetailV1 | null> {
  if (!isValidDynamicProductId(productId)) return null
  const row = await editorPrisma.product.findFirst({
    where: { id: productId, siteId, status: "active" },
    select: {
      id: true,
      siteId: true,
      name: true,
      description: true,
      status: true,
      media: true,
      variants: {
        select: { id: true, name: true, priceMxn: true, comparePriceMxn: true, stock: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  return toPublicProductDetailV1(row, siteId)
}
