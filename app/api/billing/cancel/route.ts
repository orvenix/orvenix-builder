import { BillingEvents } from "@/lib/billing/events"
import { createSubscriptionHistory } from "@/lib/billing/subscription-history"
import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { buildBillingCancelResponse } from "@/lib/billing/route-logic"
import { editorPrisma } from "@/lib/editor-db"
import { cancelMpSubscription, isMpConfigured } from "@/lib/mercadopago"
import { cancelStripeSubscription, isStripeConfigured } from "@/lib/stripe"

// POST /api/billing/cancel — cancela la suscripción activa del usuario
export async function POST() {
  const session = await getAuthSession()
  const userId = session?.user?.id

  const before = userId
    ? await editorPrisma.subscription.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          planId: true,
          interval: true,
          status: true,
          canceledAt: true,
          currentPeriodEnd: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
        },
      })
    : null

  const result = await buildBillingCancelResponse({
    session,
    findSubscription: (id) =>
      editorPrisma.subscription.findUnique({
        where: { userId: id },
      }),
    isStripeConfigured,
    cancelStripeSubscription,
    isMpConfigured,
    cancelMpSubscription,
    updateSubscription: (params) =>
      editorPrisma.subscription.update({
        where: params.where,
        data: params.data,
      }),
  })

  if (
    result.status === 200 &&
    before &&
    result.body &&
    "ok" in result.body &&
    result.body.ok
  ) {
    const after = await editorPrisma.subscription.findUnique({
      where: { userId: before.userId },
      select: {
        status: true,
        canceledAt: true,
      },
    })

    if (after && before.status !== after.status) {
      await createSubscriptionHistory({
        subscriptionId: before.id,
        userId: before.userId,

        oldPlanId: before.planId,
        newPlanId: before.planId,

        oldInterval: before.interval,
        newInterval: before.interval,

        oldStatus: before.status,
        newStatus: after.status,

        provider: "stripe",
        reason: BillingEvents.SUBSCRIPTION_CANCELLED,

        metadata: {
          effectiveAt: after.canceledAt?.toISOString() ?? null,
          currentPeriodEnd:
            before.currentPeriodEnd?.toISOString() ?? null,
          stripeSubscriptionId:
            before.stripeSubscriptionId ?? null,
          stripeCustomerId:
            before.stripeCustomerId ?? null,
          cancellationMode: "end_of_period",
        },
      })
    }
  }

  return NextResponse.json(result.body, {
    status: result.status,
  })
}
