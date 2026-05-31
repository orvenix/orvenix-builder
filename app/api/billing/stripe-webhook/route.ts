import { NextResponse } from "next/server"
import {
  getStripeWebhookSecret,
  verifyStripeWebhookSignature,
  type StripeCheckoutSession,
  type StripeSubscription,
  type StripeWebhookEvent,
} from "@/lib/stripe"
import {
  processStripeCheckoutSession,
  processStripeSubscription,
} from "@/lib/stripe-subscription-payment"
import { markWebhookEvent, recordWebhookEvent } from "@/lib/webhook-events"
import { serverError } from "@/lib/server-log"

export const runtime = "nodejs"

function jsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status })
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = getStripeWebhookSecret()

  if (!webhookSecret) {
    return jsonError("Stripe webhook no configurado", 503, "STRIPE_WEBHOOK_NOT_CONFIGURED")
  }

  if (!signature || !verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
    return jsonError("Firma de Stripe invalida", 400, "STRIPE_SIGNATURE_INVALID")
  }

  let event: StripeWebhookEvent
  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent
  } catch {
    return jsonError("Evento JSON invalido", 400, "INVALID_JSON")
  }

  const stripeObject = event.data.object as { id?: string }
  const auditId = await recordWebhookEvent({
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
    resourceId: stripeObject.id ?? null,
    payload: event,
  })

  try {
    let handled = false

    if (event.type === "checkout.session.completed") {
      await processStripeCheckoutSession(event.data.object as StripeCheckoutSession)
      handled = true
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await processStripeSubscription(event.data.object as StripeSubscription)
      handled = true
    }

    await markWebhookEvent(auditId, handled ? "processed" : "skipped")
  } catch (error) {
    serverError("[stripe:webhook] Error procesando evento", {
      eventId: event.id,
      eventType: event.type,
      error,
    })
    await markWebhookEvent(auditId, "failed", error)
    return jsonError("No se pudo procesar el webhook", 500, "STRIPE_WEBHOOK_FAILED")
  }

  return NextResponse.json({ received: true })
}
