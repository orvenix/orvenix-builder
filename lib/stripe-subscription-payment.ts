import { editorPrisma } from "@/lib/editor-db"; 
import {
  type StripeCheckoutSession,
  type StripeSubscription,
  mapStripeSubscriptionStatus,
  resolveConfiguredStripePlanFromPrice,
  retrieveStripeSubscription,
} from "@/lib/stripe"

import {
  applyPaidPlan,
  markPaymentFailed,
  schedulePlanChange,
  syncStripeSubscription,
} from "@/lib/billing/subscription-engine"

import { serverWarn } from "@/lib/server-log"
import { dateFromUnixSeconds } from "@/lib/subscription-status"

type StripeSubscriptionPayload = StripeSubscription & {
  items?: {
    data?: Array<{
      price?: { id?: string | null }
      plan?: { id?: string | null }
      current_period_end?: number | null
    }>
  }
  plan?: { id?: string | null }
}

export type StripeInvoicePayload = {
  id: string
  customer?: string | null
  customer_email?: string | null
  subscription?: string | null
  amount_paid?: number | null
  amount_due?: number | null
  currency?: string | null
  next_payment_attempt?: number | null

  parent?: {
    subscription_details?: {
      subscription?: string | null
      metadata?: {
        userId?: string
        planId?: string
        interval?: string
      } | null
    } | null
  } | null

  lines?: {
    data?: Array<{
      metadata?: {
        userId?: string
        planId?: string
        interval?: string
      } | null

      price?: {
        id?: string | null
      } | null

      pricing?: {
        price_details?: {
          price?: string | null
        } | null
      } | null

      period?: {
        end?: number | null
      } | null

      parent?: {
        subscription_item_details?: {
          subscription?: string | null
        } | null
      } | null
    }>
  } | null
}

async function resolvePlanFromStripePrice(priceId?: string | null) {
  const configuredPlan = resolveConfiguredStripePlanFromPrice(priceId)
  if (configuredPlan || !priceId) return configuredPlan

  const plans = await editorPrisma.plan.findMany({
    select: {
      id: true,
      stripePriceIdMonth: true,
      stripePriceIdYear: true,
    },
  })

  for (const plan of plans) {
    if (plan.stripePriceIdMonth === priceId) {
      return { planId: plan.id, interval: "month" as const }
    }
    if (plan.stripePriceIdYear === priceId) {
      return { planId: plan.id, interval: "year" as const }
    }
  }

  return null
}

function getSubscriptionPriceId(subscription: StripeSubscriptionPayload) {
  return (
    subscription.items?.data?.[0]?.price?.id ??
    subscription.items?.data?.[0]?.plan?.id ??
    subscription.plan?.id ??
    null
  )
}

function getSubscriptionPeriodEnd(subscription: StripeSubscriptionPayload) {
  return (
    dateFromUnixSeconds(subscription.current_period_end) ??
    dateFromUnixSeconds(subscription.items?.data?.[0]?.current_period_end) ??
    null
  )
}

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

export async function processStripeSubscription(subscription: StripeSubscriptionPayload): Promise<void> {
  const priceId = getSubscriptionPriceId(subscription)
  const resolvedPlan = await resolvePlanFromStripePrice(priceId)

  const planId = resolvedPlan?.planId ?? subscription.metadata?.planId
  const userId = subscription.metadata?.userId
  const interval =
    resolvedPlan?.interval ??
    (subscription.metadata?.interval === "year" ? "year" : "month")

  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)
  const status = cancelAtPeriodEnd ? "cancelled" : mapStripeSubscriptionStatus(subscription.status)

  const canceledAt =
    dateFromUnixSeconds(subscription.canceled_at) ??
    (cancelAtPeriodEnd
      ? dateFromUnixSeconds(subscription.cancel_at) ?? getSubscriptionPeriodEnd(subscription)
      : null)

  const result = await syncStripeSubscription({
  stripeSubscriptionId: subscription.id,
  stripeCustomerId: subscription.customer,

  userId: userId ?? null,
  planId: planId ?? null,
  interval,
  status,

  currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
  canceledAt,
})

if (!result.ok) {
  serverWarn("[webhook:stripe] Suscripción sin usuario o registro local", {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    userId,
    planId,
  })
}

}

export async function processStripeInvoice(invoice: StripeInvoicePayload): Promise<void> {
  const subscriptionId =
    invoice.subscription ??
    invoice.parent?.subscription_details?.subscription ??
    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
    null
    
  const invoiceUserId =
    invoice.parent?.subscription_details?.metadata?.userId ??
    invoice.lines?.data?.[0]?.metadata?.userId ??
    null

  const priceId =
    invoice.lines?.data?.[0]?.pricing?.price_details?.price ??
    invoice.lines?.data?.[0]?.price?.id ??
    null

  const resolvedPlan = await resolvePlanFromStripePrice(priceId)

  if (!subscriptionId || !resolvedPlan) {
    serverWarn("[webhook:stripe] Invoice sin subscriptionId o priceId reconocido", {
      invoiceId: invoice.id,
      subscriptionId,
      priceId,
    })
    return
  }

const paidPlanInput = {
  stripeSubscriptionId: subscriptionId,
  stripeCustomerId: invoice.customer ?? null,
  planId: resolvedPlan.planId,
  interval: resolvedPlan.interval,
  currentPeriodEnd: dateFromUnixSeconds(
    invoice.lines?.data?.[0]?.period?.end
  ),
  invoiceId: invoice.id,
  stripePriceId: priceId,
  amountPaid: invoice.amount_paid ?? null,
  currency: invoice.currency ?? null,
}

let result = await applyPaidPlan(paidPlanInput)

if (!result.ok) {
  serverWarn("[webhook:stripe] Suscripción local ausente; intentando sincronizar", {
    invoiceId: invoice.id,
    subscriptionId,
    priceId,
  })

if (!invoiceUserId) {
  serverWarn("[webhook:stripe] Invoice sin userId para autorrecuperación", {
    invoiceId: invoice.id,
    subscriptionId,
    priceId,
  })
}

  try {
    const stripeSubscription =
  await retrieveStripeSubscription(subscriptionId)

if (!invoiceUserId) {
  serverWarn(
    "[webhook:stripe] No se pudo identificar usuario para autorrecuperación",
    {
      invoiceId: invoice.id,
      subscriptionId,
      stripeCustomerId: invoice.customer ?? null,
      customerEmail: invoice.customer_email ?? null,
    }
  )

  return
}

stripeSubscription.metadata = {
  ...(stripeSubscription.metadata ?? {}),
  userId: invoiceUserId,
  planId: resolvedPlan.planId,
  interval: resolvedPlan.interval,
}

await processStripeSubscription(stripeSubscription)

result = await applyPaidPlan(paidPlanInput)
  } catch (error) {
    serverWarn("[webhook:stripe] No se pudo recuperar la suscripción desde Stripe", {
      invoiceId: invoice.id,
      subscriptionId,
      priceId,
      error: error instanceof Error ? error.message : String(error),
    })

    return
  }
}

if (!result.ok) {
  serverWarn("[webhook:stripe] La suscripción sigue sin existir después de sincronizar", {
    invoiceId: invoice.id,
    subscriptionId,
    priceId,
  })
}
}

type StripeSubscriptionSchedulePayload = {
  id?: string | null
  subscription?: string | null
  phases?: Array<{
    start_date?: number | null
    items?: Array<{
      price?: string | null
      plan?: string | null
    }> | null
  }> | null
}

export async function processStripeSubscriptionSchedule(
  schedule: StripeSubscriptionSchedulePayload
): Promise<void> {
  const subscriptionId = schedule.subscription ?? null
  const futurePhase = schedule.phases?.[1] ?? null
  const futureItem = futurePhase?.items?.[0] ?? null
  const futurePriceId = futureItem?.price ?? futureItem?.plan ?? null
  const resolvedPlan = await resolvePlanFromStripePrice(futurePriceId)

  if (!subscriptionId || !futurePhase || !futurePriceId || !resolvedPlan) {
    serverWarn("[webhook:stripe] Schedule sin cambio futuro reconocible", {
      scheduleId: schedule.id,
      subscriptionId,
      futurePriceId,
    })
    return
  }

  const result = await schedulePlanChange({
    stripeSubscriptionId: subscriptionId,
    planId: resolvedPlan.planId,
    interval: resolvedPlan.interval,
    startsAt: dateFromUnixSeconds(futurePhase.start_date),
    stripePriceId: futurePriceId,
    scheduleId: schedule.id ?? null,
  })

  if (!result.ok) {
    serverWarn("[webhook:stripe] No existe suscripción local para schedule", {
      scheduleId: schedule.id,
      subscriptionId,
      futurePriceId,
    })
  }
}

export async function processStripeInvoicePaymentFailed(
  invoice: StripeInvoicePayload
): Promise<void> {
  const subscriptionId =
    invoice.subscription ??
    invoice.parent?.subscription_details?.subscription ??
    invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ??
    null

  if (!subscriptionId) {
    serverWarn("[webhook:stripe] Invoice fallida sin subscriptionId", {
      invoiceId: invoice.id,
    })
    return
  }

  const result = await markPaymentFailed({
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: invoice.customer ?? null,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due ?? null,
    currency: invoice.currency ?? null,
    nextPaymentAttempt: dateFromUnixSeconds(
      invoice.next_payment_attempt
    ),
  })

  if (!result.ok) {
    serverWarn("[webhook:stripe] Suscripción local no encontrada para pago fallido", {
      invoiceId: invoice.id,
      subscriptionId,
    })
  }
}
