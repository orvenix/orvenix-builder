import { createHmac, timingSafeEqual } from "crypto"

const STRIPE_API_VERSION = "2026-04-22.dahlia"
const STRIPE_API_BASE = "https://api.stripe.com/v1"

type StripeSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"

export type StripeCheckoutSession = {
  id: string
  url: string | null
  customer: string | null
  subscription: string | null
  payment_status: string | null
  client_reference_id: string | null
  metadata?: Record<string, string>
}

export type StripeSubscription = {
  id: string
  customer: string | null
  status: StripeSubscriptionStatus | string
  current_period_end?: number | null
  cancel_at_period_end?: boolean | null
  cancel_at?: number | null
  canceled_at?: number | null
  metadata?: Record<string, string>
}

export type StripeWebhookEvent = {
  id: string
  type: string
  data: {
    object: StripeCheckoutSession | StripeSubscription | Record<string, unknown>
  }
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? ""
}

export function getStripeAppUrl() {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

export function getStripePriceId(planId: string, interval: "month" | "year", dbPriceId?: string | null) {
  if (dbPriceId) return dbPriceId

  const normalizedPlan = planId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")
  const normalizedInterval = interval.toUpperCase()
  return process.env[`STRIPE_PRICE_${normalizedPlan}_${normalizedInterval}`] ?? null
}

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY no esta configurada")
  }
  return secretKey
}

async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      "Stripe-Version": STRIPE_API_VERSION,
      ...init.headers,
    },
  })

  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `Stripe request failed: ${res.status}`
    throw new Error(message)
  }

  return payload as T
}

export async function createStripeCheckoutSession(params: {
  userId: string
  userEmail: string
  planId: string
  interval: "month" | "year"
  priceId: string
}) {
  const appUrl = getStripeAppUrl()
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": "1",
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    success_url: `${appUrl}/dashboard?sub=ok&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/precios?cancelled=1&provider=stripe`,
    "metadata[userId]": params.userId,
    "metadata[planId]": params.planId,
    "metadata[interval]": params.interval,
    "subscription_data[metadata][userId]": params.userId,
    "subscription_data[metadata][planId]": params.planId,
    "subscription_data[metadata][interval]": params.interval,
  })

  const session = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!session.url) {
    throw new Error("Stripe no devolvio URL de Checkout")
  }

  return { checkoutUrl: session.url, sessionId: session.id }
}

export async function cancelStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  const body = new URLSearchParams({ cancel_at_period_end: "true" })
  await stripeRequest<StripeSubscription>(`/subscriptions/${stripeSubscriptionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}

export async function createStripeBillingPortalSession(params: {
  customerId: string
  returnPath?: string
}) {
  const appUrl = getStripeAppUrl()
  const body = new URLSearchParams({
    customer: params.customerId,
    return_url: `${appUrl}${params.returnPath ?? "/dashboard"}`,
  })

  const session = await stripeRequest<{ id: string; url: string }>("/billing_portal/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  return session
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=")
      return [key, value]
    })
  )
  const timestamp = parts.t
  const expected = parts.v1

  if (!timestamp || !expected) return false

  const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000)
  if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000) return false

  const digest = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
  const digestBuffer = Buffer.from(digest, "hex")
  const expectedBuffer = Buffer.from(expected, "hex")

  return digestBuffer.length === expectedBuffer.length && timingSafeEqual(digestBuffer, expectedBuffer)
}

export function mapStripeSubscriptionStatus(status: string) {
  if (status === "trialing") return "active"
  if (status === "canceled") return "cancelled"
  return status
}
