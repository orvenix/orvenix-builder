import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { createStripeBillingPortalSession, isStripeConfigured } from "@/lib/stripe"
import { serverError } from "@/lib/server-log"

function jsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status })
}

function getStripeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : ""
}

function isPortalConfigurationError(error: unknown) {
  const message = getStripeErrorMessage(error).toLowerCase()
  return (
    message.includes("configuration") &&
    (message.includes("billing portal") || message.includes("customer portal") || message.includes("portal"))
  )
}

function isStripeModeMismatchError(error: unknown) {
  const message = getStripeErrorMessage(error).toLowerCase()
  return message.includes("exists in test mode") || message.includes("live mode key was used")
}

export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return jsonError("SESSION_REQUIRED", 401, "SESSION_REQUIRED")
  }

  if (!isStripeConfigured()) {
    return jsonError("Stripe no está configurado", 503, "STRIPE_NOT_CONFIGURED")
  }

  const subscription = await editorPrisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: {
      provider: true,
      stripeCustomerId: true,
      status: true,
    },
  })

  if (!subscription || subscription.provider !== "stripe" || !subscription.stripeCustomerId) {
    return jsonError("No hay una suscripción Stripe vinculada", 404, "STRIPE_SUBSCRIPTION_NOT_FOUND")
  }

  try {
    const portal = await createStripeBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnPath: "/dashboard?billing=portal",
    })

    return NextResponse.json({ url: portal.url })
  } catch (error) {
    serverError("[billing:portal] Stripe portal failed", {
      userId: session.user.id,
      error,
    })

    if (isStripeModeMismatchError(error)) {
      return jsonError(
        "Esta suscripción fue creada en modo prueba de Stripe, pero la plataforma está usando llaves live. Activa el plan nuevamente con Stripe live para generar un cliente de producción.",
        409,
        "STRIPE_MODE_MISMATCH"
      )
    }

    if (isPortalConfigurationError(error)) {
      return jsonError(
        "El portal de facturación de Stripe todavía no está configurado. Actívalo en Stripe Customer Portal o define STRIPE_BILLING_PORTAL_CONFIGURATION_ID.",
        503,
        "STRIPE_PORTAL_CONFIGURATION_REQUIRED"
      )
    }

    return jsonError(
      "No pudimos abrir el portal de Stripe. Intenta de nuevo o contacta soporte.",
      502,
      "STRIPE_PORTAL_FAILED"
    )
  }
}
