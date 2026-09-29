import type { EditorNode, EditorTree } from "@/types/editor"
import { injectStoreCartShellNodesV1 } from "@/lib/orvenix-ai/commerce/store-shell"
import { resolveCommerceSurfaceV1, type CommerceThemePaletteV1 } from "@/lib/orvenix-ai/commerce/commerce-surface"
import type { PublicProductDetailV1 } from "./public-product-detail"

/**
 * COMMERCE-6: the bounded, reusable composition of the dynamic product
 * detail page. Pure. It does NOT design anything per product: it reuses
 * the site's own generated chrome -- the navigation, the store cart shell
 * and the footer (the last root section) from a real site page -- plus the
 * site theme/brand, and places ONE `store-product-detail` block (fed only
 * authoritative row data) in a store-styled section, with an optional
 * "back to catalog" link through the canonical `page:<slug>` contract.
 */

export const DYNAMIC_PRODUCT_DETAIL_SECTION_ID_V1 = "dyn-product-detail-section"
export const DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1 = "dyn-product-detail"
const STORE_SECTION_BACKGROUND = "#0f172a"

function subtreeIds(nodes: Record<string, EditorNode>, rootId: string): string[] {
  const out: string[] = []
  const stack = [rootId]
  const seen = new Set<string>()
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id) || !nodes[id]) continue
    seen.add(id)
    out.push(id)
    stack.push(...nodes[id].children)
  }
  return out
}

function subtreeHas(nodes: Record<string, EditorNode>, rootId: string, type: string): boolean {
  return subtreeIds(nodes, rootId).some((id) => nodes[id]?.type === type)
}

const HEX = /^#[0-9a-f]{6}$/i

/** The site theme's colors, only when every token is a real hex (else no themed surface). */
function themePaletteOf(tree: EditorTree): CommerceThemePaletteV1 | null {
  const colors = ((tree.globalTheme ?? tree.theme) as { colors?: Record<string, unknown> } | undefined)?.colors
  if (!colors) return null
  const keys = ["primary", "secondary", "background", "text", "accent"] as const
  if (!keys.every((key) => typeof colors[key] === "string" && HEX.test(colors[key] as string))) return null
  return { primary: colors.primary as string, secondary: colors.secondary as string, background: colors.background as string, text: colors.text as string, accent: colors.accent as string }
}

function node(id: string, type: string, props: EditorNode["props"], parentId: string, children: string[] = []): EditorNode {
  return { id, type, props, children, version: 1, parentId }
}

export function buildDynamicProductDetailTreeV1(params: {
  baseTree: EditorTree
  product: PublicProductDetailV1
  catalogSlug?: string
  accentColor?: string
}): EditorTree {
  const { baseTree, product, catalogSlug, accentColor } = params
  const baseRoot = baseTree.nodes[baseTree.rootId]
  if (!baseRoot) throw new Error("dynamic_product_detail_base_tree_without_root")
  // PCE-2: the site's own theme decides the detail surface; a tree without usable theme colors keeps the legacy look.
  const surface = themePaletteOf(baseTree) ? resolveCommerceSurfaceV1(themePaletteOf(baseTree)!, { relation: "continuous" }) : undefined

  const isNav = (id: string) => subtreeHas(baseTree.nodes, id, "siteNav")
  const isShell = (id: string) => subtreeHas(baseTree.nodes, id, "store-cart-drawer")
  const navIds = baseRoot.children.filter(isNav)
  const shellIds = baseRoot.children.filter((id) => !isNav(id) && isShell(id))
  // The footer is the last root SECTION (PCE-2: the nav-integrated cart drawer may now follow it).
  const footerId = [...baseRoot.children].reverse().find((id) => !isNav(id) && !isShell(id) && baseTree.nodes[id]?.type === "section")
  const footerIsGeneratedChrome = footerId !== undefined && !subtreeHas(baseTree.nodes, footerId, "store-product-card")

  const keptFooter = footerIsGeneratedChrome && footerId ? [footerId] : []
  const nodes: Record<string, EditorNode> = {}
  for (const keptRoot of [...navIds, ...shellIds, ...keptFooter]) {
    for (const id of subtreeIds(baseTree.nodes, keptRoot)) nodes[id] = structuredClone(baseTree.nodes[id])
  }

  const sectionId = DYNAMIC_PRODUCT_DETAIL_SECTION_ID_V1
  const sectionChildren: string[] = []
  if (catalogSlug) {
    const rowId = "dyn-product-detail-back"
    const buttonId = "dyn-product-detail-back-button"
    nodes[buttonId] = node(buttonId, "ctaButton", { label: "Volver al catálogo", href: `page:${catalogSlug}`, variant: "ghost", size: "sm" }, rowId)
    nodes[rowId] = node(rowId, "genericWrapper", { tag: "div", className: "mb-8 flex" }, sectionId, [buttonId])
    sectionChildren.push(rowId)
  }
  nodes[DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1] = node(
    DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1,
    "store-product-detail",
    {
      productId: product.productId,
      productName: product.name,
      ...(product.description ? { description: product.description } : {}),
      ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
      ...(product.imageUrls?.length ? { imageUrls: [...product.imageUrls] } : {}),
      variants: product.variants.map((variant) => ({ ...variant })),
      ...(accentColor ? { accentColor } : {}),
      ...(surface ? { surface } : {}),
    },
    sectionId,
  )
  sectionChildren.push(DYNAMIC_PRODUCT_DETAIL_BLOCK_ID_V1)
  nodes[sectionId] = node(sectionId, "section", { maxWidth: "xl", paddingY: "xl", paddingX: "lg", background: surface?.background ?? STORE_SECTION_BACKGROUND }, baseTree.rootId, sectionChildren)

  let children = [...navIds, ...shellIds, sectionId, ...keptFooter]
  if (!shellIds.length) children = injectStoreCartShellNodesV1(nodes, baseTree.rootId, children, accentColor)
  nodes[baseTree.rootId] = { ...structuredClone(baseRoot), children }

  return {
    ...baseTree,
    nodes,
    seo: { ...(baseTree.seo ?? {}), title: product.name, ...(product.description ? { description: product.description.slice(0, 160) } : {}) },
  }
}
