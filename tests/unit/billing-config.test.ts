import test from "node:test"
import assert from "node:assert/strict"
import { getBillingConfigReport } from "../../lib/billing-config"

const allStripePrices = {
  STRIPE_PRICE_STARTER_MONTH: "price_starter_month",
  STRIPE_PRICE_STARTER_YEAR: "price_starter_year",
  STRIPE_PRICE_PRO_MONTH: "price_pro_month",
  STRIPE_PRICE_PRO_YEAR: "price_pro_year",
  STRIPE_PRICE_COMMERCE_MONTH: "price_commerce_month",
  STRIPE_PRICE_COMMERCE_YEAR: "price_commerce_year",
}

test("billing config is ok when Stripe core and all prices exist", () => {
  const report = getBillingConfigReport({
    STRIPE_SECRET_KEY: "sk_test_value",
    STRIPE_WEBHOOK_SECRET: "whsec_value",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_value",
    AUTH_URL: "https://example.com",
    ...allStripePrices,
  })

  assert.equal(report.status, "ok")
  assert.equal(report.stripeReady, true)
})

test("billing config is degraded when Stripe is incomplete but MercadoPago exists", () => {
  const report = getBillingConfigReport({
    MP_ACCESS_TOKEN: "APP_USR-value",
    AUTH_URL: "https://example.com",
  })

  assert.equal(report.status, "warning")
  assert.equal(report.stripeReady, false)
  assert.equal(report.mercadoPagoReady, true)
})

test("billing config treats placeholders as missing", () => {
  const report = getBillingConfigReport({
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
    AUTH_URL: "https://example.com",
    ...allStripePrices,
  })

  assert.equal(report.status, "missing")
  assert.equal(report.checks.find((item) => item.key === "stripe_secret")?.status, "missing")
})
