import { editorPrisma } from "@/lib/editor-db"
import { appendOrderNote } from "@/lib/commerce/order-notes"
import { getMpPayment, parseStoreExternalReference } from "@/lib/mercadopago"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { serverDebug, serverError, serverWarn } from "@/lib/server-log"

export interface StoreCheckoutPaymentResult {
  ok: boolean
  paymentId: string
  orderId: string | null
  siteId: string | null
  status: string | null
  processed: boolean
}

export async function processStoreMercadoPagoPayment(paymentId: string): Promise<StoreCheckoutPaymentResult> {
  const payment = await getMpPayment(paymentId)
  const status = typeof payment.status === "string" ? payment.status : null
  const { orderId, siteId } = parseStoreExternalReference(payment.external_reference)

  if (!orderId || !siteId) {
    serverWarn("[store-checkout:mp] Invalid external_reference", payment.external_reference)
    return { ok: false, paymentId, orderId, siteId, status, processed: false }
  }

  if (status !== "approved") {
    serverDebug(`[store-checkout:mp] Payment ${paymentId} status: ${status ?? "unknown"} - skipping`)
    return { ok: true, paymentId, orderId, siteId, status, processed: false }
  }

  const order = await editorPrisma.order.findFirst({
    where: { id: orderId, siteId },
    select: { id: true, status: true, notes: true },
  })

  if (!order) {
    serverWarn(`[store-checkout:mp] Order not found: ${orderId}`)
    return { ok: false, paymentId, orderId, siteId, status, processed: false }
  }

  if (order.status === "paid" || order.status === "fulfilled") {
    return { ok: true, paymentId, orderId, siteId, status, processed: false }
  }

  const updatedOrder = await editorPrisma.order.update({
    where: { id: orderId },
    data: {
      status: "paid",
      mpPaymentId: String(payment.id ?? paymentId),
      notes: appendOrderNote(order.notes, `paid:${payment.id ?? paymentId}:${new Date().toISOString()}`),
    },
  })

  // Reduce stock for each variant
  type OrderItem = { variantId: string; quantity: number }
  const orderItems = Array.isArray(updatedOrder.items) ? (updatedOrder.items as OrderItem[]) : []
  for (const item of orderItems) {
    if (item.variantId && typeof item.quantity === "number") {
      await editorPrisma.productVariant.updateMany({
        where: { id: item.variantId, stock: { gt: 0 } },
        data: { stock: { decrement: item.quantity } },
      }).catch(() => {}) // non-blocking — don't fail payment processing if stock update fails
    }
  }

  // Send order confirmation email (non-blocking)
  sendOrderConfirmationEmail({
    customerEmail: updatedOrder.customerEmail,
    customerName: updatedOrder.customerName ?? undefined,
    orderId: updatedOrder.id,
    totalMxn: updatedOrder.totalMxn,
    items: orderItems,
  }).catch((err) => serverError("[store-checkout:email] Failed", err))

  return { ok: true, paymentId, orderId, siteId, status, processed: true }
}
