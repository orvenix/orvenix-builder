import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import {
  isStripeConfigured,
  reactivateStripeSubscription,
} from "@/lib/stripe"
import { BillingEvents } from "@/lib/billing/events"
import { createSubscriptionHistory } from "@/lib/billing/subscription-history"
import { serverError } from "@/lib/server-log"

export async function POST() {
  const session = await getAuthSession()
  const userId = session?.user?.id

  if (!userId) {
    return NextResponse.json(
      {
        error: "Debes iniciar sesión.",
        code: "SESSION_REQUIRED",
      },
      { status: 401 }
    )
  }

  const subscription = await editorPrisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      planId: true,
      interval: true,
      status: true,
      provider: true,
      canceledAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
    },
  })

  if (!subscription) {
    return NextResponse.json(
      {
        error: "No encontramos una suscripción.",
        code: "SUBSCRIPTION_NOT_FOUND",
      },
      { status: 404 }
    )
  }

  if (
    subscription.status !== "cancelled" &&
    subscription.status !== "canceled"
  ) {
    return NextResponse.json(
      {
        error: "La suscripción no tiene una cancelación programada.",
        code: "SUBSCRIPTION_NOT_CANCELLED",
      },
      { status: 409 }
    )
  }

  if (
    subscription.provider !== "stripe" ||
    !subscription.stripeSubscriptionId
  ) {
    return NextResponse.json(
      {
        error: "Esta suscripción no puede reactivarse desde Stripe.",
        code: "STRIPE_SUBSCRIPTION_REQUIRED",
      },
      { status: 409 }
    )
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "Stripe no está configurado.",
        code: "STRIPE_NOT_CONFIGURED",
      },
      { status: 503 }
    )
  }

  try {
    const stripeSubscription = await reactivateStripeSubscription(
      subscription.stripeSubscriptionId
    )

    const updated = await editorPrisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        canceledAt: null,
        currentPeriodEnd:
          typeof stripeSubscription.current_period_end === "number"
            ? new Date(stripeSubscription.current_period_end * 1000)
            : undefined,
      },
    })

    await createSubscriptionHistory({
      subscriptionId: subscription.id,
      userId: subscription.userId,

      oldPlanId: subscription.planId,
      newPlanId: subscription.planId,

      oldInterval: subscription.interval,
      newInterval: subscription.interval,

      oldStatus: subscription.status,
      newStatus: updated.status,

      provider: "stripe",
      reason: BillingEvents.SUBSCRIPTION_RESTORED,

      metadata: {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId ?? null,
        cancellationMode: "reactivated_before_period_end",
      },
    })

    return NextResponse.json({
      ok: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        canceledAt: updated.canceledAt,
      },
    })
  } catch (error) {
    serverError("[billing:reactivate] Stripe reactivate failed", {
      userId,
      error,
    })

    return NextResponse.json(
      {
        error: "No pudimos reactivar la suscripción en Stripe.",
        code: "STRIPE_REACTIVATE_FAILED",
      },
      { status: 502 }
    )
  }
}
