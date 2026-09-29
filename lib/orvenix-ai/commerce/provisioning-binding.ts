import {
  normalizeSiteCreationPlanV2,
  type SiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { EditorNode, EditorTree } from "@/types/editor"
import { parseProvisioningRefV1 } from "./provisioning-plan"
import type { ProvisionedProductRefV1 } from "./provisioning-executor"
import { injectStoreCartShellIntoTreeV1 } from "./store-shell"
import { parsePendingProductDetailHrefV1 } from "./product-detail-target"

/**
 * COMMERCE-2A: the confirm-time PREVIEW -> FINAL transition. Pure.
 *
 * Takes the APPROVED (hash-verified) preview plan and the authoritative ids
 * the provisioning repository returned, and produces the final plan by
 * ONLY:
 *   1. replacing each pending card's `provisioningRef` with the real
 *      `productId` / `variantId` of the row created for that
 *      (sourceIndex, variantIndex);
 *   2. adding the existing cart shell once per page with bound cards.
 * No recompile, no composer, no AI call: page universe, section order,
 * product selection/grouping, copy and layout are byte-for-byte the
 * approved preview's. Any unresolved reference fails closed.
 */

export class CommerceBindingErrorV1 extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CommerceBindingErrorV1"
  }
}

function bindTree(
  tree: EditorTree,
  idsByRef: Map<string, { productId: string; variantId: string }>,
  productIdBySource: Map<number, string>,
): { tree: EditorTree; boundCards: number } {
  const nodes = structuredClone(tree.nodes) as Record<string, EditorNode>
  let boundCards = 0
  for (const node of Object.values(nodes)) {
    if (node.type !== "store-product-card") continue
    // COMMERCE-6: a pending dynamic detail target becomes the created product's runtime target.
    const pendingDetail = parsePendingProductDetailHrefV1(node.props.detailHref)
    if (pendingDetail !== null) {
      const productId = productIdBySource.get(pendingDetail)
      if (!productId) throw new CommerceBindingErrorV1("Un enlace de detalle del Preview no tiene un producto aprovisionado.")
      node.props = { ...node.props, detailHref: `product:${productId}` }
    }
    if (node.props.provisioningRef === undefined) continue
    const ref = parseProvisioningRefV1(node.props.provisioningRef)
    const ids = ref ? idsByRef.get(`${ref.sourceIndex}:${ref.variantIndex}`) : undefined
    if (!ids) throw new CommerceBindingErrorV1("Una tarjeta de producto del Preview no tiene un producto aprovisionado.")
    const { provisioningRef: _provisioningRef, ...rest } = node.props
    void _provisioningRef
    node.props = { ...rest, productId: ids.productId, variantId: ids.variantId }
    boundCards += 1
  }
  return { tree: { ...tree, nodes }, boundCards }
}

export function bindProvisionedCommerceIntoPlanV1(plan: SiteCreationPlanV2, provisioned: readonly ProvisionedProductRefV1[]): SiteCreationPlanV2 {
  const provisioning = plan.commerce?.provisioning
  if (!provisioning) throw new CommerceBindingErrorV1("El plan no contiene aprovisionamiento de tienda.")

  const bySource = new Map(provisioned.map((product) => [product.sourceIndex, product]))
  const idsByRef = new Map<string, { productId: string; variantId: string }>()
  for (const planned of provisioning.products) {
    const created = bySource.get(planned.sourceIndex)
    if (!created) throw new CommerceBindingErrorV1(`Falta el producto aprovisionado ${planned.sourceIndex}.`)
    for (const variant of planned.variants) {
      const createdVariant = created.variants.find((entry) => entry.variantIndex === variant.variantIndex)
      if (!createdVariant) throw new CommerceBindingErrorV1(`Falta la variante aprovisionada ${planned.sourceIndex}:${variant.variantIndex}.`)
      idsByRef.set(`${planned.sourceIndex}:${variant.variantIndex}`, { productId: created.productId, variantId: createdVariant.variantId })
    }
  }

  const productIdBySource = new Map([...bySource.entries()].map(([sourceIndex, product]) => [sourceIndex, product.productId]))
  const accent = plan.theme.colors?.accent
  const pages = plan.pages.map((page) => {
    const bound = bindTree(page.tree, idsByRef, productIdBySource)
    return { ...page, tree: bound.boundCards > 0 ? injectStoreCartShellIntoTreeV1(bound.tree, accent) : bound.tree }
  })

  return normalizeSiteCreationPlanV2({ ...plan, pages })
}

export function countPendingProvisioningCardsV1(plan: SiteCreationPlanV2): number {
  return plan.pages.reduce(
    (count, page) => count + Object.values(page.tree.nodes as Record<string, EditorNode>).filter((node) => node.type === "store-product-card" && node.props.provisioningRef !== undefined).length,
    0,
  )
}
