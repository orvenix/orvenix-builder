import { buildPublicFunnelActionHref } from "./public-funnel-url"
import { getPublicFunnelOfferQuery } from "./funnel-offer-public"
import type { FunnelStepKind } from "./funnels"

export function buildFunnelOfferPreviewLinks(
  pathname: string,
  stepKind: FunnelStepKind,
  settings: unknown
) {
  const offerQuery = getPublicFunnelOfferQuery(stepKind, settings)
  if (!offerQuery) return null

  const acceptHref = buildPublicFunnelActionHref(pathname, undefined, {
    cart: "open",
    storeCheckout: null,
    orderId: null,
    offerStepKind: offerQuery.offerStepKind,
    offerType: offerQuery.offerType,
    offerLabel: offerQuery.offerLabel,
    offerValue: offerQuery.offerValue,
    offerDiscountPercent: offerQuery.offerDiscountPercent,
    offerDiscountFixed: offerQuery.offerDiscountFixed,
    offerPriceMxn: offerQuery.offerPriceMxn,
  })
  const declineHref = buildPublicFunnelActionHref(pathname, undefined, {
    cart: null,
    storeCheckout: null,
    orderId: null,
    offerStepKind: null,
    offerType: null,
    offerLabel: null,
    offerValue: null,
    offerDiscountPercent: null,
    offerDiscountFixed: null,
    offerPriceMxn: null,
  })

  return {
    offerQuery,
    acceptHref,
    declineHref,
  }
}
