import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { buildBillingSubscribeResponse } from "@/lib/billing/route-logic"
import { editorPrisma } from "@/lib/editor-db"
import {
  createStripeCheckoutSession,
  getStripePriceId,
  isStripeConfigured,
  isStripeModeMismatchError,
  retrieveStripeCustomer,
} from "@/lib/stripe"
import { serverError } from "@/lib/server-log"
import { parseDesignIntentId } from "@/lib/commercial/sales-funnel"

// POST /api/billing/subscribe
// Body: { planId: "starter"|"pro"|"commerce", interval: "month"|"year" }
export async function POST(request: Request) {
  let body: { planId?: string; interval?: string; repairActiveSubscription?: boolean; designId?: unknown }
  try {
    body = await request.json() as { planId?: string; interval?: string; repairActiveSubscription?: boolean; designId?: unknown }
  } catch {
    return NextResponse.json({ error: "Body JSON invalido", code: "INVALID_JSON" }, { status: 400 })
  }

  try {
    const session = await getAuthSession()
    // SALES-2: only a sellable Orvenix design id rides back on the success URL; anything else is dropped.
    const designId = parseDesignIntentId(body.designId)?.templateId ?? null
    const result = await buildBillingSubscribeResponse({
      session,
      body,
      findPlan: (planId) => editorPrisma.plan.findUnique({ where: { id: planId } }),
      findSubscription: (userId) => editorPrisma.subscription.findUnique({ where: { userId } }),
      getStripePriceId,
      isStripeConfigured,
      createStripeCheckoutSession: (checkout) => createStripeCheckoutSession({ ...checkout, designId }),
      canReplaceActiveSubscription: async (subscription) => {
        if (subscription.provider !== "stripe") return false
        if (!subscription.stripeCustomerId) return true

        try {
          await retrieveStripeCustomer(subscription.stripeCustomerId)
          return true
        } catch (error) {
          return isStripeModeMismatchError(error)
        }
      },
      upsertSubscription: (params) => editorPrisma.subscription.upsert(params as never),
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    serverError("[billing:subscribe] Unexpected checkout error", error)
    return NextResponse.json(
      {
        error: "No pudimos iniciar el checkout. Intenta de nuevo o contacta soporte.",
        code: "CHECKOUT_UNEXPECTED_ERROR",
      },
      { status: 500 }
    )
  }
}
