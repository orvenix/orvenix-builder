type BillingCheckStatus = "ok" | "missing" | "warning"

export type BillingConfigCheck = {
  key: string
  label: string
  status: BillingCheckStatus
  detail: string
}

type BillingEnv = NodeJS.ProcessEnv

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim() && !value.includes("placeholder"))
}

function hasStripePrice(env: BillingEnv, plan: string, interval: "MONTH" | "YEAR") {
  return hasValue(env[`STRIPE_PRICE_${plan}_${interval}`])
}

function check(key: string, label: string, condition: boolean, detail: string): BillingConfigCheck {
  return {
    key,
    label,
    status: condition ? "ok" : "missing",
    detail,
  }
}

function warning(key: string, label: string, condition: boolean, detail: string): BillingConfigCheck {
  return {
    key,
    label,
    status: condition ? "ok" : "warning",
    detail,
  }
}

function stripeModeFromValue(value: string | undefined) {
  if (!hasValue(value)) return null
  if (value.includes("_test_")) return "test"
  if (value.includes("_live_")) return "live"
  return "unknown"
}

function normalizeUrl(url: string | undefined) {
  if (!hasValue(url)) return null
  try {
    return new URL(url).origin
  } catch {
    return url?.trim() ?? null
  }
}

function formatStripeMode(mode: ReturnType<typeof stripeModeFromValue>) {
  if (mode === null) return "sin definir"
  if (mode === "unknown") return "desconocido"
  return mode
}

function buildStripeModeDetail(publishableMode: ReturnType<typeof stripeModeFromValue>, secretMode: ReturnType<typeof stripeModeFromValue>) {
  if (publishableMode === null || secretMode === null) {
    return "La publishable y la secret deben ser ambas test o ambas live para evitar checkouts rotos."
  }

  return `Detectado publishable=${formatStripeMode(publishableMode)} y secret=${formatStripeMode(secretMode)}. Deben coincidir.`
}

function buildUrlAlignmentDetail(authUrl: string | null, nextAuthUrl: string | null, publicApiUrl: string | null) {
  const configured = [
    authUrl ? `AUTH_URL=${authUrl}` : null,
    nextAuthUrl ? `NEXTAUTH_URL=${nextAuthUrl}` : null,
    publicApiUrl ? `NEXT_PUBLIC_API_URL=${publicApiUrl}` : null,
  ].filter((value): value is string => Boolean(value))

  if (configured.length <= 1) {
    return "AUTH_URL, NEXTAUTH_URL y NEXT_PUBLIC_API_URL deben apuntar al mismo origen publico para retornos y webhooks."
  }

  return `Detectado ${configured.join(" · ")}. Deben apuntar al mismo origen publico.`
}

export function getBillingConfigReport(env: BillingEnv = process.env) {
  const stripePriceChecks = [
    check("stripe_price_starter_month", "Stripe Starter mensual", hasStripePrice(env, "STARTER", "MONTH"), "Requiere STRIPE_PRICE_STARTER_MONTH."),
    check("stripe_price_starter_year", "Stripe Starter anual", hasStripePrice(env, "STARTER", "YEAR"), "Requiere STRIPE_PRICE_STARTER_YEAR."),
    check("stripe_price_pro_month", "Stripe Pro mensual", hasStripePrice(env, "PRO", "MONTH"), "Requiere STRIPE_PRICE_PRO_MONTH."),
    check("stripe_price_pro_year", "Stripe Pro anual", hasStripePrice(env, "PRO", "YEAR"), "Requiere STRIPE_PRICE_PRO_YEAR."),
    check("stripe_price_commerce_month", "Stripe Commerce mensual", hasStripePrice(env, "COMMERCE", "MONTH"), "Requiere STRIPE_PRICE_COMMERCE_MONTH."),
    check("stripe_price_commerce_year", "Stripe Commerce anual", hasStripePrice(env, "COMMERCE", "YEAR"), "Requiere STRIPE_PRICE_COMMERCE_YEAR."),
  ]

  const stripePublishableMode = stripeModeFromValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  const stripeSecretMode = stripeModeFromValue(env.STRIPE_SECRET_KEY)
  const stripeModesAligned =
    stripePublishableMode !== null &&
    stripeSecretMode !== null &&
    stripePublishableMode !== "unknown" &&
    stripeSecretMode !== "unknown" &&
    stripePublishableMode === stripeSecretMode

  const authUrl = normalizeUrl(env.AUTH_URL)
  const nextAuthUrl = normalizeUrl(env.NEXTAUTH_URL)
  const publicApiUrl = normalizeUrl(env.NEXT_PUBLIC_API_URL)
  const configuredUrls = [authUrl, nextAuthUrl, publicApiUrl].filter((value): value is string => Boolean(value))
  const urlsAligned = configuredUrls.length <= 1 || configuredUrls.every((value) => value === configuredUrls[0])

  const checks: BillingConfigCheck[] = [
    check("stripe_publishable", "Stripe publishable key", hasValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), "Requiere NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."),
    check("stripe_secret", "Stripe secret key", hasValue(env.STRIPE_SECRET_KEY), "Requiere STRIPE_SECRET_KEY."),
    check("stripe_webhook", "Stripe webhook secret", hasValue(env.STRIPE_WEBHOOK_SECRET), "Requiere STRIPE_WEBHOOK_SECRET desde Developers > Webhooks."),
    ...stripePriceChecks,
    warning(
      "stripe_mode_alignment",
      "Stripe modo consistente",
      !hasValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) || !hasValue(env.STRIPE_SECRET_KEY) || stripeModesAligned,
      buildStripeModeDetail(stripePublishableMode, stripeSecretMode)
    ),
    check("mp_access_token", "MercadoPago access token", hasValue(env.MP_ACCESS_TOKEN), "Requiere MP_ACCESS_TOKEN si MercadoPago se usara como respaldo."),
    check("app_url", "URL publica de la app", hasValue(env.AUTH_URL) || hasValue(env.NEXTAUTH_URL) || hasValue(env.NEXT_PUBLIC_API_URL), "Requiere AUTH_URL, NEXTAUTH_URL o NEXT_PUBLIC_API_URL."),
    warning(
      "app_url_alignment",
      "URLs base alineadas",
      configuredUrls.length <= 1 || urlsAligned,
      buildUrlAlignmentDetail(authUrl, nextAuthUrl, publicApiUrl)
    ),
  ]

  const stripeCoreOk =
    hasValue(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) &&
    hasValue(env.STRIPE_SECRET_KEY) &&
    hasValue(env.STRIPE_WEBHOOK_SECRET) &&
    stripePriceChecks.every((item) => item.status === "ok")
  const mercadoPagoOk = hasValue(env.MP_ACCESS_TOKEN)

  const hasWarnings = checks.some((item) => item.status === "warning")
  const status: BillingCheckStatus = stripeCoreOk ? (hasWarnings ? "warning" : "ok") : mercadoPagoOk ? "warning" : "missing"

  return {
    status,
    stripeReady: stripeCoreOk,
    mercadoPagoReady: mercadoPagoOk,
    checks,
    missing: checks.filter((item) => item.status === "missing").length,
    warnings: checks.filter((item) => item.status === "warning").length,
  }
}
