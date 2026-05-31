import { redirect } from "next/navigation"
import { trackFunnelEvent } from "@/lib/commerce/funnel-analytics"
import { buildFunnelStepRedirectPath } from "@/lib/commerce/funnel-runtime"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const orderId = searchParams.get("orderId") ?? ""
  const funnelId = searchParams.get("funnelId") ?? ""
  const funnelStep = searchParams.get("funnelStep") ?? ""
  const experimentId = searchParams.get("experimentId") ?? ""
  const experimentVariant = searchParams.get("experimentVariant") ?? ""
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
    targetStep: "checkout",
    fallbackPath: `/p/${encodeURIComponent(siteId)}`,
    searchParams: {
      storeCheckout: "failure",
      orderId,
      funnelId,
      funnelStep: funnelStep || "checkout",
      experimentId,
      experimentVariant,
    },
  })
  redirect(target)
}
