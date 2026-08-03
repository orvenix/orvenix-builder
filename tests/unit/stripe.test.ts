import test from "node:test"
import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import {
  getStripePriceId,
  mapStripeSubscriptionStatus,
  resolveConfiguredStripePlanFromPrice,
  verifyStripeWebhookSignature,
} from "../../lib/stripe"
import { dateFromUnixSeconds, mapMercadoPagoSubscriptionStatus } from "../../lib/subscription-status"

test("getStripePriceId prefers database value over environment", () => {
  process.env.STRIPE_PRICE_PRO_MONTH = "price_env"
  assert.equal(getStripePriceId("pro", "month", "price_db"), "price_db")
})

test("getStripePriceId maps plan and interval to env name", () => {
  process.env.STRIPE_PRICE_COMMERCE_YEAR = "price_commerce_year"
  assert.equal(getStripePriceId("commerce", "year"), "price_commerce_year")
})


test("getStripePriceId supports business and commerce aliases", () => {
  const previousBusiness = process.env.STRIPE_PRICE_BUSINESS_MONTH
  const previousCommerce = process.env.STRIPE_PRICE_COMMERCE_MONTH
  delete process.env.STRIPE_PRICE_BUSINESS_MONTH
  process.env.STRIPE_PRICE_COMMERCE_MONTH = "price_commerce_month"

  assert.equal(getStripePriceId("business", "month"), "price_commerce_month")

  process.env.STRIPE_PRICE_BUSINESS_MONTH = "price_business_month"
  delete process.env.STRIPE_PRICE_COMMERCE_MONTH
  assert.equal(getStripePriceId("commerce", "month"), "price_business_month")

  if (previousBusiness === undefined) delete process.env.STRIPE_PRICE_BUSINESS_MONTH
  else process.env.STRIPE_PRICE_BUSINESS_MONTH = previousBusiness
  if (previousCommerce === undefined) delete process.env.STRIPE_PRICE_COMMERCE_MONTH
  else process.env.STRIPE_PRICE_COMMERCE_MONTH = previousCommerce
})

test("resolveConfiguredStripePlanFromPrice recognizes Business as the commerce database plan", () => {
  const env = {
    STRIPE_PRICE_BUSINESS_MONTH: "price_business_month",
    STRIPE_PRICE_BUSINESS_YEAR: "price_business_year",
  }

  assert.deepEqual(resolveConfiguredStripePlanFromPrice("price_business_month", env), {
    planId: "commerce",
    interval: "month",
  })
  assert.deepEqual(resolveConfiguredStripePlanFromPrice("price_business_year", env), {
    planId: "commerce",
    interval: "year",
  })
})

test("resolveConfiguredStripePlanFromPrice preserves the legacy Commerce alias", () => {
  const env = { STRIPE_PRICE_COMMERCE_MONTH: "price_commerce_month" }

  assert.deepEqual(resolveConfiguredStripePlanFromPrice("price_commerce_month", env), {
    planId: "commerce",
    interval: "month",
  })
})

test("mapStripeSubscriptionStatus normalizes Stripe status names", () => {
  assert.equal(mapStripeSubscriptionStatus("trialing"), "active")
  assert.equal(mapStripeSubscriptionStatus("canceled"), "cancelled")
  assert.equal(mapStripeSubscriptionStatus("past_due"), "past_due")
})

test("verifyStripeWebhookSignature accepts valid signed payload", () => {
  const secret = "whsec_test"
  const timestamp = Math.floor(Date.now() / 1000)
  const rawBody = JSON.stringify({ id: "evt_test" })
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")

  assert.equal(
    verifyStripeWebhookSignature(rawBody, `t=${timestamp},v1=${signature}`, secret),
    true
  )
})

test("verifyStripeWebhookSignature rejects invalid signature", () => {
  const timestamp = Math.floor(Date.now() / 1000)
  assert.equal(
    verifyStripeWebhookSignature("{}", `t=${timestamp},v1=${"0".repeat(64)}`, "whsec_test"),
    false
  )
})

test("mapMercadoPagoSubscriptionStatus normalizes MercadoPago statuses", () => {
  assert.equal(mapMercadoPagoSubscriptionStatus("authorized"), "active")
  assert.equal(mapMercadoPagoSubscriptionStatus("paused"), "paused")
  assert.equal(mapMercadoPagoSubscriptionStatus("unknown_status"), "pending")
  assert.equal(mapMercadoPagoSubscriptionStatus(null), "pending")
})

test("dateFromUnixSeconds converts Stripe timestamps safely", () => {
  assert.equal(dateFromUnixSeconds(null), null)
  assert.equal(dateFromUnixSeconds(1)?.toISOString(), "1970-01-01T00:00:01.000Z")
})
