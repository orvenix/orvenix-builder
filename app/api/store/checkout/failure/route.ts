import { redirect } from "next/navigation"
import { trackFunnelEvent } from "@/lib/commerce/funnel-analytics"
import { buildFunnelStepRedirectPath, isFunnelStepKind } from "@/lib/commerce/funnel-runtime"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const orderId = searchParams.get("orderId") ?? ""
  const funnelId = searchParams.get("funnelId") ?? ""
  const funnelStep = searchParams.get("funnelStep") ?? ""
  const funnelStepId = searchParams.get("funnelStepId") ?? ""
  const experimentId = searchParams.get("experimentId") ?? ""
  const experimentVariant = searchParams.get("experimentVariant") ?? ""
  const offerType = searchParams.get("offerType") ?? ""
  const offerLabel = searchParams.get("offerLabel") ?? ""
  const offerValue = searchParams.get("offerValue") ?? ""
  if (siteId && funnelId) {
    trackFunnelEvent({
      siteId,
      funnelId,
      step: "checkout",
      eventType: "checkout_failed",
    }).catch(() => {})
  }
  const target = await buildFunnelStepRedirectPath({
    siteId,
    funnelId: funnelId || undefined,
    targetStepId: funnelStepId || undefined,
    targetStep: isFunnelStepKind(funnelStep) ? funnelStep : "checkout",
    fallbackPath: `/p/${encodeURIComponent(siteId)}`,
    searchParams: {
      storeCheckout: "failure",
      orderId,
      funnelId,
      funnelStep: funnelStep || "checkout",
      funnelStepId: funnelStepId || undefined,
      experimentId,
      experimentVariant,
      offerType: offerType || undefined,
      offerLabel: offerLabel || undefined,
      offerValue: offerValue || undefined,
    },
  })
  redirect(target)
}
