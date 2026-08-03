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
  processStripeInvoice,
  processStripeSubscription,
  processStripeSubscriptionSchedule,
  processStripeInvoicePaymentFailed,
  type StripeInvoicePayload,
} from "@/lib/stripe-subscription-payment"
import { markWebhookEvent, recordWebhookEvent } from "@/lib/webhook-events"
import { serverError } from "@/lib/server-log"
import { audit } from "@/lib/audit"

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

  const stripeObject =
    event?.data?.object && typeof event.data.object === "object"
      ? (event.data.object as { id?: string })
      : null

  const webhookRecord = await recordWebhookEvent({
  provider: "stripe",
  eventId: event.id,
  eventType: event.type,
  resourceId: stripeObject.id ?? null,
  payload: event,
})

if (webhookRecord.duplicate) {
  return NextResponse.json({
    received: true,
    duplicate: true,
  })
}

const auditId = webhookRecord.id

  if (!stripeObject) {
    await markWebhookEvent(auditId, "skipped")

    await audit({
      module: "stripe",
      action: "webhook_skipped",
      level: "warning",
      entityType: "stripe_event",
      entityId: event.id,
      message: `Webhook de Stripe ignorado porque no trae data.object: ${event.type}`,
      metadata: {
        eventType: event.type,
      },
    })

    return NextResponse.json({ received: true, skipped: true })
  }

  await audit({
    module: "stripe",
    action: "webhook_received",
    level: "info",
    entityType: "stripe_event",
    entityId: event.id,
    message: `Webhook de Stripe recibido: ${event.type}`,
    metadata: {
      eventType: event.type,
      resourceId: stripeObject.id ?? null,
    },
  })

  try {    
	let handled = false

    switch (event.type as string) {
      case "checkout.session.completed":
        await processStripeCheckoutSession(event.data.object as StripeCheckoutSession)
        handled = true
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await processStripeSubscription(
          event.data.object as StripeSubscription
        )
        handled = true
        break

      case "invoice.paid":
      case "invoice.payment_succeeded":
        await processStripeInvoice(
          event.data.object as StripeInvoicePayload
        )
        handled = true
        break

      case "subscription_schedule.created":
      case "subscription_schedule.updated":
        await processStripeSubscriptionSchedule(
          event.data.object as Parameters<
            typeof processStripeSubscriptionSchedule
          >[0]
        )
        handled = true
        break

      case "invoice.payment_failed":
        await processStripeInvoicePaymentFailed(
          event.data.object as Parameters<
            typeof processStripeInvoicePaymentFailed
          >[0]
        )
        handled = true
        break

      }

    await markWebhookEvent(auditId, handled ? "processed" : "skipped")

    await audit({
      module: "stripe",
      action: handled ? "webhook_processed" : "webhook_skipped",
      level: handled ? "info" : "warning",
      entityType: "stripe_event",
      entityId: event.id,
      message: handled
        ? `Webhook de Stripe procesado correctamente: ${event.type}`
        : `Webhook de Stripe ignorado: ${event.type}`,
      metadata: {
        eventType: event.type,
        resourceId: stripeObject.id ?? null,
      },
    })
  } catch (error) {
    serverError("[stripe:webhook] Error procesando evento", {
      eventId: event.id,
      eventType: event.type,
      error,
    })

    await audit({
      module: "stripe",
      action: "webhook_failed",
      level: "error",
      entityType: "stripe_event",
      entityId: event.id,
      message: `Error procesando webhook de Stripe: ${event.type}`,
      metadata: {
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error),
      },
    })

    await markWebhookEvent(auditId, "failed", error)
    return jsonError("No se pudo procesar el webhook", 500, "STRIPE_WEBHOOK_FAILED")
  }

  return NextResponse.json({ received: true })
}
