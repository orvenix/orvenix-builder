import {
  applyOfferDiscount,
  getStepOffer,
  resolveStepOffer,
  type FunnelStepOffer,
} from "./funnel-step-offers"
import type { FunnelStepKind } from "./funnels"

export type CheckoutLineItem = {
  variantId: string
  productId: string
  productName: string
  variantName: string
  sku: string
  quantity: number
  priceMxn: number
  subtotalMxn: number
}

type CheckoutFunnelStepLike = {
  id: string
  kind: FunnelStepKind
  settings?: Record<string, unknown> | null
}

type CheckoutFunnelLike = {
  steps?: CheckoutFunnelStepLike[]
}

export type AppliedCheckoutOffer = {
  stepId: string
  stepKind: FunnelStepKind
  type: FunnelStepOffer["type"]
  label: string
  discountMxn: number
  priceMxn: number
}

export function resolveCheckoutFunnelOffer(input: {
  funnel: CheckoutFunnelLike | null
  funnelStepId?: string | null
  funnelStep?: FunnelStepKind | null
  offerAccepted?: boolean
  totalMxn: number
}): {
  totalMxn: number
  appliedOffer: AppliedCheckoutOffer | null
  error?: "FUNNEL_STEP_NOT_FOUND"
} {
  if (!input.offerAccepted) {
    return { totalMxn: input.totalMxn, appliedOffer: null }
  }

  const steps = Array.isArray(input.funnel?.steps) ? input.funnel.steps : []
  const step = input.funnelStepId
    ? steps.find((entry) => entry.id === input.funnelStepId) ?? null
    : (input.funnelStep ? steps.find((entry) => entry.kind === input.funnelStep) ?? null : null)

  if (!step) {
    return {
      totalMxn: input.totalMxn,
      appliedOffer: null,
      error: "FUNNEL_STEP_NOT_FOUND",
    }
  }

  const offer = getStepOffer(step.settings)
  if (!offer?.enabled) {
    return { totalMxn: input.totalMxn, appliedOffer: null }
  }

  const resolved = resolveStepOffer(offer)
  const discountedTotal = applyOfferDiscount(input.totalMxn, resolved)
  const discountMxn = Math.max(0, input.totalMxn - discountedTotal)
  const priceMxn = resolved.type === "discount"
    ? 0
    : Math.max(0, resolved.priceMxn ?? 0)
  const nextTotalMxn = resolved.type === "discount"
    ? discountedTotal
    : discountedTotal + priceMxn

  return {
    totalMxn: nextTotalMxn,
    appliedOffer: {
      stepId: step.id,
      stepKind: step.kind,
      type: resolved.type,
      label: resolved.label,
      discountMxn,
      priceMxn,
    },
  }
}

function getOfferLineSku(type: FunnelStepOffer["type"]) {
  if (type === "discount") return "FUNNEL-DISCOUNT"
  if (type === "free_gift") return "FUNNEL-GIFT"
  if (type === "order_bump") return "FUNNEL-BUMP"
  return "FUNNEL-OFFER"
}

function getOfferVariantName(type: FunnelStepOffer["type"]) {
  if (type === "discount") return "discount"
  if (type === "free_gift") return "free_gift"
  if (type === "order_bump") return "order_bump"
  return "product"
}

export function appendCheckoutOfferLineItem(
  items: CheckoutLineItem[],
  appliedOffer: AppliedCheckoutOffer | null
): CheckoutLineItem[] {
  if (!appliedOffer) return items

  if (appliedOffer.type === "discount") {
    if (appliedOffer.discountMxn <= 0) return items

    return [
      ...items,
      {
        variantId: "",
        productId: "",
        productName: appliedOffer.label || "Descuento aplicado",
        variantName: getOfferVariantName(appliedOffer.type),
        sku: getOfferLineSku(appliedOffer.type),
        quantity: 1,
        priceMxn: -appliedOffer.discountMxn,
        subtotalMxn: -appliedOffer.discountMxn,
      },
    ]
  }

  return [
    ...items,
    {
      variantId: "",
      productId: "",
      productName: appliedOffer.label || "Oferta activa",
      variantName: getOfferVariantName(appliedOffer.type),
      sku: getOfferLineSku(appliedOffer.type),
      quantity: 1,
      priceMxn: appliedOffer.type === "free_gift" ? 0 : appliedOffer.priceMxn,
      subtotalMxn: appliedOffer.type === "free_gift" ? 0 : appliedOffer.priceMxn,
    },
  ]
}

export function buildStorePreferenceItemsFromOrder(items: CheckoutLineItem[]) {
  const positiveItems = items.filter((item) => item.subtotalMxn > 0)
  const discountMxn = Math.abs(items.filter((item) => item.subtotalMxn < 0).reduce((sum, item) => sum + item.subtotalMxn, 0))
  const totalMxn = items.reduce((sum, item) => sum + item.subtotalMxn, 0)

  if (positiveItems.length === 0) return []

  if (discountMxn <= 0) {
    return positiveItems.map((item) => ({
      id: item.variantId,
      title: `${item.productName} - ${item.variantName}`,
      quantity: item.quantity,
      unitPriceMxn: item.priceMxn / 100,
    }))
  }

  return [{
    id: positiveItems[0].variantId || "store-order",
    title: `Compra en tienda Orvenix (${positiveItems.length} item${positiveItems.length === 1 ? "" : "s"})`,
    quantity: 1,
    unitPriceMxn: totalMxn / 100,
  }]
}
