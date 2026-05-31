import { NextResponse } from "next/server"
import { processMercadoPagoPayment } from "@/lib/checkout-payment"
import { processMercadoPagoSubscription } from "@/lib/subscription-payment"
import { processStoreMercadoPagoPayment } from "@/lib/store-checkout-payment"
import { markWebhookEvent, recordWebhookEvent } from "@/lib/webhook-events"
import { serverError } from "@/lib/server-log"

export const runtime = "nodejs"

// MercadoPago llama a este endpoint para pagos únicos y suscripciones.
// Formato IPN: POST con body { type, action, data: { id } }

export async function POST(request: Request) {
  let auditId: string | null = null
  try {
    const body = await request.json() as {
      type?: string
      action?: string
      data?: { id?: string | number }
    }

    const id = String(body.data?.id ?? "")
    if (!id) return NextResponse.json({ error: "Sin id" }, { status: 400 })

    const eventType = body.action ?? body.type ?? "unknown"
    auditId = await recordWebhookEvent({
      provider: "mercadopago",
      eventId: eventType ? `${eventType}:${id}` : id,
      eventType,
      resourceId: id,
      payload: body,
    })

    // Suscripciones (preapproval)
    if (body.type === "subscription_preapproval" || body.action?.startsWith("subscription")) {
      await processMercadoPagoSubscription(id)
      await markWebhookEvent(auditId, "processed")
      return NextResponse.json({ ok: true })
    }

    // Pagos únicos — detectar si es orden de tienda o compra de sitio/template
    if (body.type === "payment" || body.action === "payment.created" || body.action === "payment.updated") {
      const storeResult = await processStoreMercadoPagoPayment(id)
      if (!storeResult.processed && storeResult.orderId === null) {
        // Not a store order — try template/site purchase
        await processMercadoPagoPayment(id)
      }
      await markWebhookEvent(auditId, "processed")
      return NextResponse.json({ ok: true })
    }

    await markWebhookEvent(auditId, "skipped")
    return NextResponse.json({ ok: true, skipped: true })
  } catch (err) {
    serverError("[webhook:mp] Error", err)
    await markWebhookEvent(auditId, "failed", err)
    return NextResponse.json({ ok: true, error: "internal" })
  }
}

// IPN legacy (GET) — algunos planes de MP lo usan
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get("topic")
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ ok: true, skipped: true })

  const auditId = await recordWebhookEvent({
    provider: "mercadopago",
    eventId: topic ? `legacy:${topic}:${id}` : `legacy:${id}`,
    eventType: topic ? `legacy.${topic}` : "legacy.unknown",
    resourceId: id,
    payload: Object.fromEntries(searchParams.entries()),
  })

  try {
    if (topic === "subscription_preapproval") {
      await processMercadoPagoSubscription(id)
      await markWebhookEvent(auditId, "processed")
    } else if (topic === "payment") {
      const storeResult = await processStoreMercadoPagoPayment(id)
      if (!storeResult.processed && storeResult.orderId === null) {
        await processMercadoPagoPayment(id)
      }
      await markWebhookEvent(auditId, "processed")
    } else {
      await markWebhookEvent(auditId, "skipped")
    }
  } catch (err) {
    serverError("[webhook:mp:get] Error", err)
    await markWebhookEvent(auditId, "failed", err)
  }

  return NextResponse.json({ ok: true })
}
