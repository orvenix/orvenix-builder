import { getBillingConfigReport } from "./billing-config"
import { isPlaceholderDatabaseUrl } from "./storage-mode"

export type ProductionReadinessStatus = "ready" | "attention" | "manual"

export type ProductionReadinessCheck = {
  key: string
  label: string
  status: ProductionReadinessStatus
  detail: string
}

export type ProductionReadinessReport = {
  summary: ProductionReadinessStatus
  automaticChecks: ProductionReadinessCheck[]
  manualChecks: ProductionReadinessCheck[]
}

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim() && !value.includes("placeholder"))
}

function normalizeOrigin(url: string | undefined) {
  if (!hasValue(url)) return null

  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function buildPublicUrlCheck(env: NodeJS.ProcessEnv): ProductionReadinessCheck {
  const authUrl = normalizeOrigin(env.AUTH_URL)
  const nextAuthUrl = normalizeOrigin(env.NEXTAUTH_URL)
  const publicApiUrl = normalizeOrigin(env.NEXT_PUBLIC_API_URL)
  const configured = [
    authUrl ? `AUTH_URL=${authUrl}` : null,
    nextAuthUrl ? `NEXTAUTH_URL=${nextAuthUrl}` : null,
    publicApiUrl ? `NEXT_PUBLIC_API_URL=${publicApiUrl}` : null,
  ].filter((value): value is string => Boolean(value))

  if (configured.length === 0) {
    return {
      key: "public_urls",
      label: "URLs publicas base",
      status: "attention",
      detail: "Faltan AUTH_URL, NEXTAUTH_URL y NEXT_PUBLIC_API_URL. Produccion necesita al menos el origen publico principal.",
    }
  }

  const origins = [authUrl, nextAuthUrl, publicApiUrl].filter((value): value is string => Boolean(value))
  const sameOrigin = origins.every((value) => value === origins[0])
  const allHttps = origins.every((value) => value.startsWith("https://"))

  if (!sameOrigin) {
    return {
      key: "public_urls",
      label: "URLs publicas base",
      status: "attention",
      detail: `${configured.join(" · ")}. Deben apuntar al mismo origen publico.`,
    }
  }

  if (!allHttps) {
    return {
      key: "public_urls",
      label: "URLs publicas base",
      status: "attention",
      detail: `${configured.join(" · ")}. En produccion deben usar https.`,
    }
  }

  return {
    key: "public_urls",
    label: "URLs publicas base",
    status: "ready",
    detail: configured.join(" · "),
  }
}

function buildAuthSecretCheck(env: NodeJS.ProcessEnv): ProductionReadinessCheck {
  const authSecret = env.AUTH_SECRET
  const nextAuthSecret = env.NEXTAUTH_SECRET
  const hasAuthSecret = hasValue(authSecret)
  const hasNextAuthSecret = hasValue(nextAuthSecret)

  if (!hasAuthSecret && !hasNextAuthSecret) {
    return {
      key: "auth_secret",
      label: "Secrets de autenticacion",
      status: "attention",
      detail: "Falta AUTH_SECRET o NEXTAUTH_SECRET.",
    }
  }

  if (hasAuthSecret && hasNextAuthSecret && authSecret !== nextAuthSecret) {
    return {
      key: "auth_secret",
      label: "Secrets de autenticacion",
      status: "attention",
      detail: "AUTH_SECRET y NEXTAUTH_SECRET existen pero no coinciden. Conviene unificarlos para evitar configuraciones ambiguas.",
    }
  }

  return {
    key: "auth_secret",
    label: "Secrets de autenticacion",
    status: "ready",
    detail: hasAuthSecret && hasNextAuthSecret ? "AUTH_SECRET y NEXTAUTH_SECRET estan definidos y alineados." : "Hay un secret valido definido para autenticacion.",
  }
}

function buildStorageCheck(env: NodeJS.ProcessEnv): ProductionReadinessCheck {
  const storageMode = env.ORVENIX_STORAGE_MODE?.trim() ?? "file"
  const databaseUrl = env.DATABASE_URL

  if (storageMode !== "prisma") {
    return {
      key: "storage_mode",
      label: "Persistencia de produccion",
      status: "attention",
      detail: `ORVENIX_STORAGE_MODE=${storageMode}. En Vercel o produccion serverless conviene usar prisma con una base de datos real.`,
    }
  }

  if (!hasValue(databaseUrl)) {
    return {
      key: "storage_mode",
      label: "Persistencia de produccion",
      status: "attention",
      detail: "ORVENIX_STORAGE_MODE=prisma pero falta DATABASE_URL.",
    }
  }

  if (isPlaceholderDatabaseUrl(databaseUrl)) {
    return {
      key: "storage_mode",
      label: "Persistencia de produccion",
      status: "attention",
      detail: "DATABASE_URL sigue usando un valor de ejemplo.",
    }
  }

  return {
    key: "storage_mode",
    label: "Persistencia de produccion",
    status: "ready",
    detail: "Prisma apunta a una base de datos no-placeholder.",
  }
}

function buildBillingCheck(env: NodeJS.ProcessEnv): ProductionReadinessCheck {
  const billing = getBillingConfigReport(env)

  if (billing.status === "ok") {
    return {
      key: "billing_config",
      label: "Configuracion de billing",
      status: "ready",
      detail: "Stripe esta completo para suscripciones nuevas y webhooks; quedan pruebas publicas y checkout real de tienda.",
    }
  }

  if (billing.status === "warning") {
    return {
      key: "billing_config",
      label: "Configuracion de billing",
      status: "attention",
      detail: "Hay configuracion parcial de pagos. Revisa /admin/billing antes de validar Stripe publico o checkout real de tienda.",
    }
  }

  return {
    key: "billing_config",
    label: "Configuracion de billing",
    status: "attention",
    detail: "Faltan variables o precios de pago. No esta listo para pruebas reales.",
  }
}

function buildEmailCheck(env: NodeJS.ProcessEnv): ProductionReadinessCheck {
  const hasResendKey = hasValue(env.RESEND_API_KEY)
  const hasResendFrom = hasValue(env.RESEND_FROM)

  if (hasResendKey && hasResendFrom) {
    return {
      key: "email",
      label: "Email transaccional",
      status: "ready",
      detail: `RESEND_FROM=${env.RESEND_FROM}`,
    }
  }

  return {
    key: "email",
    label: "Email transaccional",
    status: "attention",
    detail: "Falta RESEND_API_KEY o RESEND_FROM. Esto afecta confirmaciones y correos operativos reales.",
  }
}

export function getProductionReadinessReport(env: NodeJS.ProcessEnv = process.env): ProductionReadinessReport {
  const automaticChecks = [
    buildPublicUrlCheck(env),
    buildAuthSecretCheck(env),
    buildStorageCheck(env),
    buildBillingCheck(env),
    buildEmailCheck(env),
  ]

  const manualChecks: ProductionReadinessCheck[] = [
    {
      key: "vercel_env",
      label: "Variables reales del entorno",
      status: "manual",
      detail: "Confirmar que el servidor o plataforma activa usa valores reales de produccion para auth, DB, billing y email.",
    },
    {
      key: "migrate_deploy",
      label: "Esquema Prisma aplicado",
      status: "manual",
      detail: "Si la base ya existia, ejecutar una sola vez npm run prisma:resolve-baseline. Despues correr npm run prisma:deploy-schema sobre la base productiva.",
    },
    {
      key: "health_public",
      label: "Health check publico",
      status: "manual",
      detail: "Verificar /api/health desde el dominio real y revisar advertencias residuales.",
    },
    {
      key: "stripe_public",
      label: "Stripe real",
      status: "manual",
      detail: "Probar checkout, webhook, cancelacion y reactivacion reales en modo test o produccion controlada.",
    },
    {
      key: "mercadopago_public",
      label: "MercadoPago real",
      status: "manual",
      detail: "Probar checkout de tienda, webhook y ordenes reales desde dominio publico. Las suscripciones nuevas dependen de Stripe.",
    },
  ]

  const summary = automaticChecks.some((check) => check.status === "attention") ? "attention" : "ready"

  return {
    summary,
    automaticChecks,
    manualChecks,
  }
}
