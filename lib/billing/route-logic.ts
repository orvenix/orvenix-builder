type BillingResponse<T> = {
  status: number
  body: T
}

type BillingErrorBody = {
  error: string
  code: string
}

type SessionLike = {
  user?: {
    id?: string | null
    email?: string | null
  } | null
} | null

type SubscriptionRecord = {
  id: string
  status: string
  planId?: string | null
  interval?: string | null
  provider?: string | null
  currentPeriodEnd?: Date | null
  canceledAt?: Date | null
  stripeSubscriptionId?: string | null
  stripeCustomerId?: string | null
  mpSubscriptionId?: string | null
  plan?: {
    maxWebsites: number
    maxVisits: number
    [key: string]: unknown
  } & Record<string, unknown>
}

type PlanRecord = {
  id: string
  isActive: boolean
  stripePriceIdMonth?: string | null
  stripePriceIdYear?: string | null
}

type SubscribeRequestBody = {
  planId?: string
  interval?: string
}

const ACTIVE_STATUSES = new Set(["active", "authorized"])
const FINAL_STATUSES = new Set(["cancelled", "canceled"])

function getEffectiveAccessEnd(subscription: SubscriptionRecord | null | undefined) {
  return subscription?.canceledAt ?? subscription?.currentPeriodEnd ?? null
}

function hasScheduledCancellationAccess(subscription: SubscriptionRecord | null | undefined) {
  if (!subscription) return false
  if (!FINAL_STATUSES.has(subscription.status.toLowerCase())) return false
  const effectiveEnd = getEffectiveAccessEnd(subscription)
  return effectiveEnd instanceof Date && effectiveEnd.getTime() > Date.now()
}

function jsonError(message: string, status: number, code: string): BillingResponse<BillingErrorBody> {
  return { status, body: { error: message, code } }
}

export async function buildBillingStatusResponse(params: {
  session: SessionLike
  findSubscription: (userId: string) => Promise<SubscriptionRecord | null>
  countWebsites: (userId: string) => Promise<number>
}): Promise<
  BillingResponse<
    | { error: string }
    | {
        subscription: null
        plan: null
        isActive: false
      }
    | {
        subscription: {
          id: string
          status: string
          interval: string | null | undefined
          provider: string | null | undefined
          currentPeriodEnd: Date | null | undefined
        }
        plan: SubscriptionRecord["plan"]
        isActive: boolean
        usage: {
          websitesUsed: number
          websitesLimit: number
          visitsLimit: number
        }
      }
  >
> {
  const userId = params.session?.user?.id
  if (!userId) {
    return { status: 401, body: { error: "SESSION_REQUIRED" } }
  }

  const subscription = await params.findSubscription(userId)
  if (!subscription) {
    return { status: 200, body: { subscription: null, plan: null, isActive: false } }
  }

  const isActive = subscription.status === "authorized" || subscription.status === "active"
  const websitesUsed = await params.countWebsites(userId)

  return {
    status: 200,
    body: {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        interval: subscription.interval,
        provider: subscription.provider,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      plan: subscription.plan,
      isActive,
      usage: {
        websitesUsed,
        websitesLimit: subscription.plan?.maxWebsites ?? 0,
        visitsLimit: subscription.plan?.maxVisits ?? 0,
      },
    },
  }
}

export async function buildBillingSubscribeResponse(params: {
  session: SessionLike
  body: SubscribeRequestBody
  findPlan: (planId: string) => Promise<PlanRecord | null>
  findSubscription: (userId: string) => Promise<SubscriptionRecord | null>
  getStripePriceId: (planId: string, interval: "month" | "year", dbPriceId?: string | null) => string | null
  isStripeConfigured: () => boolean
  createStripeCheckoutSession: (params: {
    userId: string
    userEmail: string
    planId: string
    interval: "month" | "year"
    priceId: string
  }) => Promise<{ checkoutUrl: string; sessionId: string }>
  upsertSubscription: (params: {
    where: { userId: string }
    update: Record<string, unknown>
    create: Record<string, unknown>
  }) => Promise<unknown>
}): Promise<
  BillingResponse<
    | BillingErrorBody
    | {
        initPoint: string
        provider: "stripe"
        subscription: {
          status: "pending"
          planId: string
          interval: "month" | "year"
        }
      }
  >
> {
  const userId = params.session?.user?.id
  if (!userId) {
    return jsonError("SESSION_REQUIRED", 401, "SESSION_REQUIRED")
  }

  const userEmail = params.session?.user?.email
  if (!userEmail) {
    return jsonError("Tu sesión no tiene email asociado", 400, "EMAIL_REQUIRED")
  }

  const planId = params.body.planId
  const interval = params.body.interval === "year" ? "year" : "month"

  if (!planId) {
    return jsonError("Falta planId", 400, "PLAN_REQUIRED")
  }

  const [plan, existingSubscription] = await Promise.all([
    params.findPlan(planId),
    params.findSubscription(userId),
  ])

  if (!plan) {
    return jsonError("Plan no encontrado", 404, "PLAN_NOT_FOUND")
  }

  if (!plan.isActive) {
    return jsonError("Este plan ya no está disponible", 410, "PLAN_INACTIVE")
  }

  if (existingSubscription && ACTIVE_STATUSES.has(existingSubscription.status)) {
    return jsonError(
      existingSubscription.planId === planId
        ? "Ya tienes este plan activo"
        : "Ya tienes una suscripción activa. Cámbiala desde el dashboard.",
      409,
      "ACTIVE_SUBSCRIPTION_EXISTS"
    )
  }

  if (hasScheduledCancellationAccess(existingSubscription)) {
    return jsonError(
      "Tu cancelacion ya esta programada y el acceso sigue activo hasta el fin del periodo. Reactiva o cambia el plan desde el dashboard.",
      409,
      "REACTIVATE_VIA_DASHBOARD"
    )
  }

  const stripePriceId = params.getStripePriceId(
    planId,
    interval,
    interval === "year" ? plan.stripePriceIdYear : plan.stripePriceIdMonth
  )

  if (params.isStripeConfigured() && stripePriceId) {
    let result: { checkoutUrl: string; sessionId: string }
    try {
      result = await params.createStripeCheckoutSession({
        userEmail,
        userId,
        planId,
        interval,
        priceId: stripePriceId,
      })
    } catch (error) {
      const detail =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : null

      return jsonError(
        process.env.NODE_ENV === "development" && detail
          ? `No pudimos iniciar el checkout en Stripe: ${detail}`
          : "No pudimos iniciar el checkout en Stripe. Intenta de nuevo o contacta soporte.",
        502,
        "STRIPE_SUBSCRIBE_FAILED"
      )
    }

    await params.upsertSubscription({
      where: { userId },
      update: {
        provider: "stripe",
        planId,
        interval,
        status: "pending",
        mpSubscriptionId: null,
      },
      create: {
        userId,
        provider: "stripe",
        planId,
        interval,
        status: "pending",
      },
    })

    return {
      status: 200,
      body: {
        initPoint: result.checkoutUrl,
        provider: "stripe",
        subscription: {
          status: "pending",
          planId,
          interval,
        },
      },
    }
  }

  if (!params.isStripeConfigured()) {
    return jsonError(
      "Las suscripciones nuevas estan disponibles solo con Stripe en este entorno.",
      503,
      "STRIPE_SUBSCRIPTIONS_REQUIRED"
    )
  }

  return jsonError(
    "Este plan todavia no tiene el Price ID de Stripe configurado para este intervalo.",
    503,
    "STRIPE_PLAN_NOT_READY"
  )
}

export async function buildBillingCancelResponse(params: {
  session: SessionLike
  findSubscription: (userId: string) => Promise<SubscriptionRecord | null>
  isStripeConfigured: () => boolean
  cancelStripeSubscription: (stripeSubscriptionId: string) => Promise<void>
  isMpConfigured: () => boolean
  cancelMpSubscription: (mpSubscriptionId: string) => Promise<void>
  updateSubscription: (params: {
    where: { userId: string }
    data: { status: string; canceledAt: Date }
  }) => Promise<SubscriptionRecord>
}): Promise<
  BillingResponse<
    | BillingErrorBody
    | {
        ok: true
        subscription: {
          id: string
          status: string
          canceledAt: Date | null | undefined
        }
      }
  >
> {
  const userId = params.session?.user?.id
  if (!userId) {
    return jsonError("SESSION_REQUIRED", 401, "SESSION_REQUIRED")
  }

  const subscription = await params.findSubscription(userId)
  if (!subscription) {
    return jsonError("Sin suscripción activa", 404, "SUBSCRIPTION_NOT_FOUND")
  }

  if (FINAL_STATUSES.has(subscription.status)) {
    return {
      status: 200,
      body: {
        ok: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          canceledAt: subscription.canceledAt,
        },
      },
    }
  }

  if (subscription.provider === "stripe" && subscription.stripeSubscriptionId) {
    if (!params.isStripeConfigured()) {
      return jsonError("Stripe no está configurado para cancelar esta suscripción", 503, "STRIPE_NOT_CONFIGURED")
    }

    try {
      await params.cancelStripeSubscription(subscription.stripeSubscriptionId)
    } catch {
      return jsonError(
        "No pudimos cancelar en Stripe. Intenta de nuevo o contacta soporte.",
        502,
        "STRIPE_CANCEL_FAILED"
      )
    }
  } else if (subscription.mpSubscriptionId) {
    if (!params.isMpConfigured()) {
      return jsonError("MercadoPago no está configurado para cancelar esta suscripción", 503, "MP_NOT_CONFIGURED")
    }

    try {
      await params.cancelMpSubscription(subscription.mpSubscriptionId)
    } catch {
      return jsonError(
        "No pudimos cancelar en MercadoPago. Intenta de nuevo o contacta soporte.",
        502,
        "MP_CANCEL_FAILED"
      )
    }
  }

  const updated = await params.updateSubscription({
    where: { userId },
    data: { status: "cancelled", canceledAt: new Date() },
  })

  return {
    status: 200,
    body: {
      ok: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        canceledAt: updated.canceledAt,
      },
    },
  }
}
