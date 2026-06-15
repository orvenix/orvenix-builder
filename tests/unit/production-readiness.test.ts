import test from "node:test"
import assert from "node:assert/strict"
import { getProductionReadinessReport } from "../../lib/production-readiness"

const stripeReadyEnv = {
  AUTH_SECRET: "secret",
  NEXTAUTH_SECRET: "secret",
  AUTH_URL: "https://orvenix.com.mx",
  NEXTAUTH_URL: "https://orvenix.com.mx",
  NEXT_PUBLIC_API_URL: "https://orvenix.com.mx",
  ORVENIX_STORAGE_MODE: "prisma",
  DATABASE_URL: "mysql://orvenix_user@db.orvenix.internal:3306/orvenix",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_value",
  STRIPE_SECRET_KEY: "sk_live_value",
  STRIPE_WEBHOOK_SECRET: "whsec_live_value",
  STRIPE_PRICE_STARTER_MONTH: "price_1",
  STRIPE_PRICE_STARTER_YEAR: "price_2",
  STRIPE_PRICE_PRO_MONTH: "price_3",
  STRIPE_PRICE_PRO_YEAR: "price_4",
  STRIPE_PRICE_COMMERCE_MONTH: "price_5",
  STRIPE_PRICE_COMMERCE_YEAR: "price_6",
  RESEND_API_KEY: "re_live_value",
  RESEND_FROM: "Orvenix <hola@orvenix.com.mx>",
} satisfies NodeJS.ProcessEnv

test("production readiness is ready when automatic checks are aligned", () => {
  const report = getProductionReadinessReport(stripeReadyEnv)

  assert.equal(report.summary, "ready")
  assert.equal(report.automaticChecks.every((check) => check.status === "ready"), true)
  assert.equal(report.manualChecks.every((check) => check.status === "manual"), true)
})

test("production readiness flags mixed public URLs and file mode", () => {
  const report = getProductionReadinessReport({
    AUTH_SECRET: "secret",
    NEXTAUTH_URL: "http://orvenix.com.mx",
    AUTH_URL: "https://orvenix.com.mx",
    NEXT_PUBLIC_API_URL: "https://api.orvenix.com.mx",
    ORVENIX_STORAGE_MODE: "file",
    MP_ACCESS_TOKEN: "APP_USR-real-token-value",
  })

  assert.equal(report.summary, "attention")
  assert.equal(report.automaticChecks.find((check) => check.key === "public_urls")?.status, "attention")
  assert.equal(report.automaticChecks.find((check) => check.key === "storage_mode")?.status, "attention")
})


test("production readiness rejects placeholder-looking secrets", () => {
  const report = getProductionReadinessReport({
    AUTH_SECRET: "<GENERATED_AUTH_SECRET>",
    NEXTAUTH_SECRET: "<GENERATED_AUTH_SECRET>",
    AUTH_URL: "https://orvenix.com.mx",
    NEXTAUTH_URL: "https://orvenix.com.mx",
    NEXT_PUBLIC_API_URL: "https://orvenix.com.mx",
    ORVENIX_STORAGE_MODE: "prisma",
    DATABASE_URL: "mysql://<USER>:<PASSWORD>@<HOST>:3306/<DATABASE>",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "<STRIPE_PUBLISHABLE_KEY>",
    STRIPE_SECRET_KEY: "<STRIPE_RESTRICTED_OR_SECRET_KEY>",
    STRIPE_WEBHOOK_SECRET: "<STRIPE_WEBHOOK_SECRET>",
    STRIPE_PRICE_STARTER_MONTH: "<STRIPE_PRICE_STARTER_MONTH>",
    STRIPE_PRICE_STARTER_YEAR: "<STRIPE_PRICE_STARTER_YEAR>",
    STRIPE_PRICE_PRO_MONTH: "<STRIPE_PRICE_PRO_MONTH>",
    STRIPE_PRICE_PRO_YEAR: "<STRIPE_PRICE_PRO_YEAR>",
    STRIPE_PRICE_COMMERCE_MONTH: "<STRIPE_PRICE_COMMERCE_MONTH>",
    STRIPE_PRICE_COMMERCE_YEAR: "<STRIPE_PRICE_COMMERCE_YEAR>",
    RESEND_API_KEY: "<RESEND_API_KEY>",
    RESEND_FROM: "Orvenix <contacto@orvenix.com.mx>",
  })

  assert.equal(report.summary, "attention")
  assert.equal(report.automaticChecks.find((check) => check.key === "auth_secret")?.status, "attention")
  assert.equal(report.automaticChecks.find((check) => check.key === "storage_mode")?.status, "attention")
  assert.equal(report.automaticChecks.find((check) => check.key === "billing_config")?.status, "attention")
})
