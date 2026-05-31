import { editorPrisma } from "@/lib/editor-db"
import {
  mapStripeSubscriptionStatus,
  type StripeCheckoutSession,
  type StripeSubscription,
} from "@/lib/stripe"
import { serverWarn } from "@/lib/server-log"
import { dateFromUnixSeconds } from "@/lib/subscription-status"

export async function processStripeCheckoutSession(session: StripeCheckoutSession): Promise<void> {
  const userId = session.client_reference_id ?? session.metadata?.userId
  const planId = session.metadata?.planId
  const interval = session.metadata?.interval === "year" ? "year" : "month"
  const stripeSubscriptionId = session.subscription
  const stripeCustomerId = session.customer

  if (!userId || !planId || !stripeSubscriptionId) {
    serverWarn("[webhook:stripe] Checkout session sin metadata suficiente", {
      sessionId: session.id,
      hasUserId: Boolean(userId),
      hasPlanId: Boolean(planId),
      hasSubscription: Boolean(stripeSubscriptionId),
    })
    return
  }

  await editorPrisma.subscription.upsert({
    where: { userId },
    update: {
      provider: "stripe",
      planId,
      interval,
      status: session.payment_status === "paid" ? "active" : "pending",
      stripeSubscriptionId,
      stripeCustomerId,
      canceledAt: null,
    },
    create: {
      userId,
      provider: "stripe",
      planId,
      interval,
      status: session.payment_status === "paid" ? "active" : "pending",
      stripeSubscriptionId,
      stripeCustomerId,
    },
  })
}

export async function processStripeSubscription(subscription: StripeSubscription): Promise<void> {
  const planId = subscription.metadata?.planId
  const userId = subscription.metadata?.userId
  const interval = subscription.metadata?.interval === "year" ? "year" : "month"
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
  const status = cancelAtPeriodEnd ? "cancelled" : mapStripeSubscriptionStatus(subscription.status)
  const canceledAt =
    dateFromUnixSeconds(subscription.canceled_at) ??
    (cancelAtPeriodEnd ? dateFromUnixSeconds(subscription.cancel_at) ?? dateFromUnixSeconds(subscription.current_period_end) : null)

  const data = {
    provider: "stripe",
    status,
    interval,
    currentPeriodEnd: dateFromUnixSeconds(subscription.current_period_end),
    canceledAt,
    stripeCustomerId: subscription.customer,
    ...(planId ? { planId } : {}),
  }

  if (!userId) {
    await editorPrisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data,
    })
    return
  }

  await editorPrisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: data,
    create: {
      userId,
      planId: planId ?? "starter",
      stripeSubscriptionId: subscription.id,
      ...data,
    },
  })
}
