import test from "node:test"
import assert from "node:assert/strict"
import { buildRuntimeHealth } from "../../lib/runtime-health-core"
import { getBillingConfigReport } from "../../lib/billing-config"
import { isPlaceholderDatabaseUrl } from "../../lib/storage-mode"

const stripeReadyEnv = {
  NEXTAUTH_SECRET: "secret",
  NEXTAUTH_URL: "https://example.com",
  AUTH_URL: "https://example.com",
  ANTHROPIC_API_KEY: "sk-ant-live",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_value",
  STRIPE_SECRET_KEY: "sk_live_value",
  STRIPE_WEBHOOK_SECRET: "whsec_live_value",
  STRIPE_PRICE_STARTER_MONTH: "price_1",
  STRIPE_PRICE_STARTER_YEAR: "price_2",
  STRIPE_PRICE_PRO_MONTH: "price_3",
  STRIPE_PRICE_PRO_YEAR: "price_4",
  STRIPE_PRICE_COMMERCE_MONTH: "price_5",
  STRIPE_PRICE_COMMERCE_YEAR: "price_6",
} satisfies NodeJS.ProcessEnv

test("buildRuntimeHealth reports an operational app in healthy file mode", async () => {
  const report = await buildRuntimeHealth({
    env: {
      ...stripeReadyEnv,
      ORVENIX_STORAGE_MODE: "file",
    },
    countUsers: async () => 4,
    billing: getBillingConfigReport(stripeReadyEnv),
    storageMode: "file",
    isFileStorage: true,
    isPlaceholderDatabaseUrl,
  })

  assert.equal(report.status, "operational")
  assert.equal(report.services.find((service) => service.name === "Persistencia")?.status, "operational")
  assert.equal(report.services.find((service) => service.name === "Billing")?.status, "operational")
  assert.match(report.warnings[0] ?? "", /modo archivo/i)
})

test("buildRuntimeHealth degrades billing when MercadoPago is the only ready gateway", async () => {
  const env = {
    NEXTAUTH_SECRET: "secret",
    NEXTAUTH_URL: "https://example.com",
    AUTH_URL: "https://example.com",
    MP_ACCESS_TOKEN: "APP_USR-real-token-value",
    ORVENIX_STORAGE_MODE: "file",
  } satisfies NodeJS.ProcessEnv

  const report = await buildRuntimeHealth({
    env,
    countUsers: async () => 1,
    billing: getBillingConfigReport(env),
    storageMode: "file",
    isFileStorage: true,
    isPlaceholderDatabaseUrl,
  })

  assert.equal(report.status, "degraded")
  assert.equal(report.services.find((service) => service.name === "Billing")?.status, "degraded")
  assert.match(
    report.services.find((service) => service.name === "Billing")?.detail ?? "",
    /MercadoPago esta disponible como respaldo/i
  )
})

test("buildRuntimeHealth marks persistence and auth as down when file storage count fails and auth is missing", async () => {
  const report = await buildRuntimeHealth({
    env: {
      ORVENIX_STORAGE_MODE: "file",
      NEXTAUTH_URL: "https://example.com/base",
    },
    countUsers: async () => {
      throw new Error("disk unavailable")
    },
    billing: getBillingConfigReport({}),
    storageMode: "file",
    isFileStorage: true,
    isPlaceholderDatabaseUrl,
  })

  assert.equal(report.status, "down")
  assert.equal(report.services.find((service) => service.name === "Persistencia")?.status, "down")
  assert.equal(report.services.find((service) => service.name === "Auth y dashboard")?.status, "down")
  assert.match(report.warnings.join(" "), /no usa basePath/i)
})

test("buildRuntimeHealth warns when public URLs are misaligned or non-https in production", async () => {
  const env = {
    ...stripeReadyEnv,
    NODE_ENV: "production",
    NEXTAUTH_URL: "http://orvenix.com.mx",
    AUTH_URL: "https://orvenix.com.mx",
    NEXT_PUBLIC_API_URL: "https://api.orvenix.com.mx",
    ORVENIX_STORAGE_MODE: "file",
  } satisfies NodeJS.ProcessEnv

  const report = await buildRuntimeHealth({
    env,
    countUsers: async () => 2,
    billing: getBillingConfigReport(env),
    storageMode: "file",
    isFileStorage: true,
    isPlaceholderDatabaseUrl,
  })

  assert.match(report.warnings.join(" "), /deben apuntar al mismo origen publico/i)
  assert.match(report.warnings.join(" "), /NEXTAUTH_URL usa http:/i)
})
