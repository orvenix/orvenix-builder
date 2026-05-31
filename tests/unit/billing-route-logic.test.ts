import test from "node:test"
import assert from "node:assert/strict"
import {
  buildBillingCancelResponse,
  buildBillingStatusResponse,
  buildBillingSubscribeResponse,
} from "../../lib/billing/route-logic"

test("buildBillingStatusResponse requires a logged-in user", async () => {
  const result = await buildBillingStatusResponse({
    session: null,
    findSubscription: async () => null,
    countWebsites: async () => 0,
  })

  assert.equal(result.status, 401)
  assert.deepEqual(result.body, { error: "SESSION_REQUIRED" })
})

test("buildBillingStatusResponse returns usage details for active subscriptions", async () => {
  const result = await buildBillingStatusResponse({
    session: { user: { id: "user_1" } },
    findSubscription: async () => ({
      id: "sub_1",
      status: "active",
      interval: "month",
      provider: "stripe",
      currentPeriodEnd: new Date("2026-05-19T00:00:00.000Z"),
      plan: {
        id: "pro",
        maxWebsites: 3,
        maxVisits: 5000,
      },
    }),
    countWebsites: async () => 2,
  })

  assert.equal(result.status, 200)
  assert.equal("subscription" in result.body && result.body.subscription?.id, "sub_1")
  assert.equal("isActive" in result.body && result.body.isActive, true)
  assert.deepEqual("usage" in result.body ? result.body.usage : null, {
    websitesUsed: 2,
    websitesLimit: 3,
    visitsLimit: 5000,
  })
})

test("buildBillingSubscribeResponse prefers Stripe when configured and a price id exists", async () => {
  let upsertPayload: Record<string, unknown> | null = null

  const result = await buildBillingSubscribeResponse({
    session: { user: { id: "user_1", email: "user@example.com" } },
    body: { planId: "pro", interval: "year" },
    findPlan: async () => ({
      id: "pro",
      isActive: true,
      stripePriceIdYear: "price_year",
    }),
    findSubscription: async () => null,
    getStripePriceId: () => "price_year",
    isStripeConfigured: () => true,
    createStripeCheckoutSession: async () => ({
      checkoutUrl: "https://stripe.test/checkout",
      sessionId: "cs_test",
    }),
    upsertSubscription: async (params) => {
      upsertPayload = params.update
      return {}
    },
  })

  assert.equal(result.status, 200)
  assert.equal("provider" in result.body && result.body.provider, "stripe")
  assert.equal("initPoint" in result.body && result.body.initPoint, "https://stripe.test/checkout")
  assert.deepEqual(upsertPayload, {
    provider: "stripe",
    planId: "pro",
    interval: "year",
    status: "pending",
    mpSubscriptionId: null,
  })
})

test("buildBillingSubscribeResponse requires Stripe for new subscriptions when it is unavailable", async () => {
  const result = await buildBillingSubscribeResponse({
    session: { user: { id: "user_1", email: "user@example.com" } },
    body: { planId: "starter", interval: "month" },
    findPlan: async () => ({
      id: "starter",
      isActive: true,
      stripePriceIdMonth: null,
    }),
    findSubscription: async () => null,
    getStripePriceId: () => null,
    isStripeConfigured: () => false,
    createStripeCheckoutSession: async () => {
      throw new Error("should not be called")
    },
    upsertSubscription: async () => ({}),
  })

  assert.equal(result.status, 503)
  assert.deepEqual(result.body, {
    error: "Las suscripciones nuevas estan disponibles solo con Stripe en este entorno.",
    code: "STRIPE_SUBSCRIPTIONS_REQUIRED",
  })
})

test("buildBillingSubscribeResponse rejects duplicate active subscriptions", async () => {
  const result = await buildBillingSubscribeResponse({
    session: { user: { id: "user_1", email: "user@example.com" } },
    body: { planId: "pro", interval: "month" },
    findPlan: async () => ({
      id: "pro",
      isActive: true,
    }),
    findSubscription: async () => ({
      id: "sub_active",
      status: "active",
      planId: "starter",
    }),
    getStripePriceId: () => "price_month",
    isStripeConfigured: () => true,
    createStripeCheckoutSession: async () => ({
      checkoutUrl: "unused",
      sessionId: "unused",
    }),
    upsertSubscription: async () => ({}),
  })

  assert.equal(result.status, 409)
  assert.deepEqual(result.body, {
    error: "Ya tienes una suscripción activa. Cámbiala desde el dashboard.",
    code: "ACTIVE_SUBSCRIPTION_EXISTS",
  })
})

test("buildBillingSubscribeResponse sends scheduled cancellations back to dashboard reactivation", async () => {
  const result = await buildBillingSubscribeResponse({
    session: { user: { id: "user_1", email: "user@example.com" } },
    body: { planId: "pro", interval: "month" },
    findPlan: async () => ({
      id: "pro",
      isActive: true,
      stripePriceIdMonth: "price_month",
    }),
    findSubscription: async () => ({
      id: "sub_cancelled",
      status: "cancelled",
      planId: "pro",
      canceledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }),
    getStripePriceId: () => "price_month",
    isStripeConfigured: () => true,
    createStripeCheckoutSession: async () => ({
      checkoutUrl: "unused",
      sessionId: "unused",
    }),
    upsertSubscription: async () => ({}),
  })

  assert.equal(result.status, 409)
  assert.deepEqual(result.body, {
    error: "Tu cancelacion ya esta programada y el acceso sigue activo hasta el fin del periodo. Reactiva o cambia el plan desde el dashboard.",
    code: "REACTIVATE_VIA_DASHBOARD",
  })
})

test("buildBillingSubscribeResponse reports Stripe plan setup is missing for the selected interval", async () => {
  const result = await buildBillingSubscribeResponse({
    session: { user: { id: "user_1", email: "user@example.com" } },
    body: { planId: "starter", interval: "month" },
    findPlan: async () => ({
      id: "starter",
      isActive: true,
      stripePriceIdMonth: null,
    }),
    findSubscription: async () => null,
    getStripePriceId: () => null,
    isStripeConfigured: () => true,
    createStripeCheckoutSession: async () => ({
      checkoutUrl: "unused",
      sessionId: "unused",
    }),
    upsertSubscription: async () => ({}),
  })

  assert.equal(result.status, 503)
  assert.deepEqual(result.body, {
    error: "Este plan todavia no tiene el Price ID de Stripe configurado para este intervalo.",
    code: "STRIPE_PLAN_NOT_READY",
  })
})

test("buildBillingCancelResponse cancels Stripe subscriptions and updates the local record", async () => {
  let cancelledStripeId: string | null = null
  let updatedAt: Date | null = null

  const result = await buildBillingCancelResponse({
    session: { user: { id: "user_1" } },
    findSubscription: async () => ({
      id: "sub_1",
      status: "active",
      provider: "stripe",
      stripeSubscriptionId: "sub_stripe",
    }),
    isStripeConfigured: () => true,
    cancelStripeSubscription: async (stripeSubscriptionId) => {
      cancelledStripeId = stripeSubscriptionId
    },
    isMpConfigured: () => true,
    cancelMpSubscription: async () => undefined,
    updateSubscription: async ({ data }) => {
      updatedAt = data.canceledAt
      return {
        id: "sub_1",
        status: data.status,
        canceledAt: data.canceledAt,
      }
    },
  })

  assert.equal(result.status, 200)
  assert.equal(cancelledStripeId, "sub_stripe")
  assert.ok(updatedAt instanceof Date)
  assert.equal("ok" in result.body && result.body.ok, true)
})

test("buildBillingCancelResponse returns configuration error for MercadoPago cancellations without MP", async () => {
  const result = await buildBillingCancelResponse({
    session: { user: { id: "user_1" } },
    findSubscription: async () => ({
      id: "sub_mp",
      status: "active",
      provider: "mercadopago",
      mpSubscriptionId: "preapp_123",
    }),
    isStripeConfigured: () => true,
    cancelStripeSubscription: async () => undefined,
    isMpConfigured: () => false,
    cancelMpSubscription: async () => undefined,
    updateSubscription: async () => {
      throw new Error("should not update")
    },
  })

  assert.equal(result.status, 503)
  assert.deepEqual(result.body, {
    error: "MercadoPago no está configurado para cancelar esta suscripción",
    code: "MP_NOT_CONFIGURED",
  })
})
