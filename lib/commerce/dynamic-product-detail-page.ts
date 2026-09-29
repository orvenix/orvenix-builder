import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext"
import type { EditorTree } from "@/types/editor"
import type { SitePageListItem } from "@/lib/builder-core/tree/sitePages"
import { buildDynamicProductDetailTreeV1 } from "./dynamic-product-detail-tree"
import { getPublicProductDetailV1 } from "./public-product-detail-repository"

/** The catalog page the generated commerce architecture creates; linked back to only when it exists. */
const CATALOG_PAGE_SLUG = "productos"

export interface DynamicProductDetailPageV1 {
  tree: EditorTree
  pages: SitePageListItem[]
  activePageSlug: string
  productName: string
}

/**
 * COMMERCE-6: server loader shared by the published route and the owner
 * preview. Read-only. Fails closed (null) when the product is not a public
 * product of THIS site or the site has no resolvable home page. The
 * caller has already decided the site is viewable (published / owner).
 */
export async function loadDynamicProductDetailPageV1(siteId: string, productId: string): Promise<DynamicProductDetailPageV1 | null> {
  const product = await getPublicProductDetailV1(siteId, productId)
  if (!product) return null

  const runtime = await getResolvedSiteRuntimeContext(siteId, "home")
  if (!runtime) return null

  const catalogSlug = runtime.pages.some((page) => page.slug === CATALOG_PAGE_SLUG) ? CATALOG_PAGE_SLUG : undefined
  const colors = (runtime.tree.theme as { colors?: { accent?: unknown; primary?: unknown } } | undefined)?.colors
  const accent = typeof colors?.accent === "string" ? colors.accent : typeof colors?.primary === "string" ? colors.primary : undefined

  return {
    tree: buildDynamicProductDetailTreeV1({ baseTree: runtime.tree, product, catalogSlug, accentColor: accent }),
    pages: runtime.pages,
    activePageSlug: catalogSlug ?? runtime.activePageSlug,
    productName: product.name,
  }
}
