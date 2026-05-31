import { redirect } from "next/navigation"
import { processStoreMercadoPagoPayment } from "@/lib/store-checkout-payment"
import { trackFunnelEvent } from "@/lib/commerce/funnel-analytics"
import { trackExperimentEvent } from "@/lib/commerce/experiment-analytics"
import { buildFunnelStepRedirectPath } from "@/lib/commerce/funnel-runtime"
import { serverError } from "@/lib/server-log"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const orderId = searchParams.get("orderId") ?? ""
  const funnelId = searchParams.get("funnelId") ?? ""
  const funnelStep = searchParams.get("funnelStep") ?? ""
  const experimentId = searchParams.get("experimentId") ?? ""
  const experimentVariant = searchParams.get("experimentVariant") === "B" ? "B" : "A"
  const paymentId = searchParams.get("payment_id") ?? searchParams.get("collection_id")

  if (paymentId) {
    try {
      await processStoreMercadoPagoPayment(paymentId)
    } catch (error) {
      serverError("[store-checkout:success] Payment verification failed", error)
    }
  }

  if (siteId && funnelId) {
    trackFunnelEvent({
      siteId,
      funnelId,
      step: "thankyou",
      eventType: "checkout_success",
    }).catch(() => {})
  }
  if (siteId && experimentId) {
    trackExperimentEvent({
      siteId,
      experimentId,
      variant: experimentVariant,
      eventType: "checkout_success",
    }).catch(() => {})
  }

  const target = await buildFunnelStepRedirectPath({
    siteId,
    funnelId: funnelId || undefined,
    targetStep: "thankyou",
    fallbackPath: `/p/${encodeURIComponent(siteId)}`,
    searchParams: {
      storeCheckout: "success",
      orderId,
      funnelId,
      funnelStep: funnelStep || "thankyou",
      experimentId,
      experimentVariant,
    },
  })
  redirect(target)
}
