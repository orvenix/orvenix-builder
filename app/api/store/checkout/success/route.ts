import { redirect } from "next/navigation"
import { processStoreMercadoPagoPayment } from "@/lib/store-checkout-payment"
import { trackFunnelEvent } from "@/lib/commerce/funnel-analytics"
import { trackExperimentEvent } from "@/lib/commerce/experiment-analytics"
import { buildFunnelStepRedirectPath, getNextFunnelStepContext, isFunnelStepKind } from "@/lib/commerce/funnel-runtime"
import { serverError } from "@/lib/server-log"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const orderId = searchParams.get("orderId") ?? ""
  const funnelId = searchParams.get("funnelId") ?? ""
  const funnelStep = searchParams.get("funnelStep") ?? ""
  const funnelStepId = searchParams.get("funnelStepId") ?? ""
  const experimentId = searchParams.get("experimentId") ?? ""
  const experimentVariant = searchParams.get("experimentVariant") === "B" ? "B" : "A"
  const offerType = searchParams.get("offerType") ?? ""
  const offerLabel = searchParams.get("offerLabel") ?? ""
  const offerValue = searchParams.get("offerValue") ?? ""
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

  const nextStep = siteId && funnelId
    ? await getNextFunnelStepContext(siteId, funnelId, {
        stepId: funnelStepId || undefined,
        stepKind: isFunnelStepKind(funnelStep) ? funnelStep : undefined,
      })
    : null
  const target = await buildFunnelStepRedirectPath({
    siteId,
    funnelId: funnelId || undefined,
    targetStepId: nextStep?.stepId,
    targetStep: nextStep?.stepKind ?? "thankyou",
    fallbackPath: `/p/${encodeURIComponent(siteId)}`,
    searchParams: {
      storeCheckout: "success",
      orderId,
      funnelId,
      funnelStep: nextStep?.stepKind ?? "thankyou",
      funnelStepId: nextStep?.stepId,
      experimentId,
      experimentVariant,
      offerType: offerType || undefined,
      offerLabel: offerLabel || undefined,
      offerValue: offerValue || undefined,
    },
  })
  redirect(target)
}
