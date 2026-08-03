import { editorPrisma } from "@/lib/editor-db"
import { appendOrderNote } from "@/lib/commerce/order-notes"
import {
  getMpPayment,
  parseStoreExternalReference,
} from "@/lib/mercadopago"
import { sendOrderConfirmationEmail } from "@/lib/email"
import {
  serverDebug,
  serverError,
  serverWarn,
} from "@/lib/server-log"

export interface StoreCheckoutPaymentResult {
  ok: boolean
  paymentId: string
  orderId: string | null
  siteId: string | null
  status: string | null
  processed: boolean
}

type OrderItem = {
  variantId: string
  quantity: number
}

class InsufficientStockError extends Error {
  constructor(
    public readonly variantId: string,
    public readonly quantity: number
  ) {
    super(`INSUFFICIENT_STOCK:${variantId}`)
    this.name = "InsufficientStockError"
  }
}

function result(params: {
  ok: boolean
  paymentId: string
  orderId: string | null
  siteId: string | null
  status: string | null
  processed: boolean
}): StoreCheckoutPaymentResult {
  return params
}

export async function processStoreMercadoPagoPayment(
  paymentId: string
): Promise<StoreCheckoutPaymentResult> {
  const payment = await getMpPayment(paymentId)

  const status =
    typeof payment.status === "string"
      ? payment.status
      : null

  const {
    orderId,
    siteId,
  } = parseStoreExternalReference(
    typeof payment.external_reference === "string"
      ? payment.external_reference
      : null
  )

  if (!orderId || !siteId) {
    serverWarn(
      "[store-checkout:mp] Invalid external_reference",
      payment.external_reference
    )

    return result({
      ok: false,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  if (status !== "approved") {
    serverDebug(
      `[store-checkout:mp] Payment ${paymentId} status: ${
        status ?? "unknown"
      } - skipping`
    )

    return result({
      ok: true,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  const paymentReference = String(
    payment.id ?? paymentId
  )

  const paidAmount =
    typeof payment.transaction_amount === "number"
      ? payment.transaction_amount
      : Number(payment.transaction_amount)

  const currency =
    typeof payment.currency_id === "string"
      ? payment.currency_id
      : null

  const order = await editorPrisma.order.findFirst({
    where: {
      id: orderId,
      siteId,
    },
    select: {
      id: true,
      siteId: true,
      status: true,
      items: true,
      notes: true,
      totalMxn: true,
      customerEmail: true,
      customerName: true,
      mpPaymentId: true,
    },
  })

  if (!order) {
    serverWarn(
      `[store-checkout:mp] Order not found: ${orderId}`
    )

    return result({
      ok: false,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  /*
   * totalMxn es Int. Se normalizan ambos importes a centavos
   * para evitar diferencias de representación decimal.
   */
  const expectedCents = Math.round(order.totalMxn * 100)
  const paidCents = Number.isFinite(paidAmount)
    ? Math.round(paidAmount * 100)
    : Number.NaN

  if (
    currency !== "MXN" ||
    !Number.isFinite(paidCents) ||
    paidCents !== expectedCents
  ) {
    serverWarn(
      "[store-checkout:mp] Payment validation failed",
      {
        paymentId: paymentReference,
        orderId,
        siteId,
        expectedAmount: order.totalMxn,
        receivedAmount: paidAmount,
        expectedCurrency: "MXN",
        receivedCurrency: currency,
      }
    )

    return result({
      ok: false,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  /*
   * Una orden ya cerrada no debe volver a descontar stock
   * ni enviar otro correo.
   */
  if (
    order.status === "paid" ||
    order.status === "fulfilled" ||
    order.status === "paid_review"
  ) {
    if (
      order.mpPaymentId &&
      order.mpPaymentId !== paymentReference
    ) {
      serverWarn(
        "[store-checkout:mp] Closed order received a different payment",
        {
          orderId,
          existingPaymentId: order.mpPaymentId,
          receivedPaymentId: paymentReference,
        }
      )

      return result({
        ok: false,
        paymentId,
        orderId,
        siteId,
        status,
        processed: false,
      })
    }

    return result({
      ok: true,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  const paymentAlreadyUsed =
    await editorPrisma.order.findFirst({
      where: {
        mpPaymentId: paymentReference,
        NOT: {
          id: orderId,
        },
      },
      select: {
        id: true,
        siteId: true,
      },
    })

  if (paymentAlreadyUsed) {
    serverWarn(
      "[store-checkout:mp] Payment already assigned to another order",
      {
        paymentId: paymentReference,
        requestedOrderId: orderId,
        existingOrderId: paymentAlreadyUsed.id,
        existingSiteId: paymentAlreadyUsed.siteId,
      }
    )

    return result({
      ok: false,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  const orderItems = Array.isArray(order.items)
    ? (order.items as OrderItem[])
    : []

  if (orderItems.length === 0) {
    serverWarn(
      "[store-checkout:mp] Order has no valid items",
      {
        orderId,
        siteId,
        paymentId: paymentReference,
      }
    )

    return result({
      ok: false,
      paymentId,
      orderId,
      siteId,
      status,
      processed: false,
    })
  }

  const paidNote = `paid:${paymentReference}:${new Date().toISOString()}`

  try {
    const updatedOrder =
      await editorPrisma.$transaction(async (tx) => {
        /*
         * Esta actualización obtiene el control lógico de la orden.
         * Si otro proceso ya la tomó, count será cero.
         */
        const claimed = await tx.order.updateMany({
          where: {
            id: orderId,
            siteId,
            status: {
              notIn: [
                "paid",
                "fulfilled",
                "paid_review",
                "payment_processing",
              ],
            },
            mpPaymentId: null,
          },
          data: {
            status: "payment_processing",
          },
        })

        if (claimed.count !== 1) {
          return null
        }

        for (const item of orderItems) {
          if (
            typeof item.variantId !== "string" ||
            !item.variantId ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > 99
          ) {
            throw new Error("INVALID_ORDER_ITEM")
          }

          const stockUpdate =
            await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                product: {
                  siteId,
                },
                stock: {
                  gte: item.quantity,
                },
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })

          if (stockUpdate.count !== 1) {
            throw new InsufficientStockError(
              item.variantId,
              item.quantity
            )
          }
        }

        return tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            status: "paid",
            mpPaymentId: paymentReference,
            notes: appendOrderNote(
              order.notes,
              paidNote
            ),
          },
        })
      })

    if (!updatedOrder) {
      serverDebug(
        `[store-checkout:mp] Order ${orderId} already claimed or processed`
      )

      return result({
        ok: true,
        paymentId,
        orderId,
        siteId,
        status,
        processed: false,
      })
    }

    sendOrderConfirmationEmail({
      customerEmail: updatedOrder.customerEmail,
      customerName:
        updatedOrder.customerName ?? undefined,
      orderId: updatedOrder.id,
      totalMxn: updatedOrder.totalMxn,
      items: orderItems,
    }).catch((error) => {
      serverError(
        "[store-checkout:email] Failed",
        error
      )
    })

    return result({
      ok: true,
      paymentId,
      orderId,
      siteId,
      status,
      processed: true,
    })
  } catch (error) {
    /*
     * Mercado Pago ya confirmó el cobro. Si falta stock,
     * no debemos perder la evidencia del pago ni fingir
     * que la orden sigue simplemente pendiente.
     */
    if (error instanceof InsufficientStockError) {
      serverError(
        "[store-checkout:stock] Approved payment requires manual review",
        {
          paymentId: paymentReference,
          orderId,
          siteId,
          variantId: error.variantId,
          requestedQuantity: error.quantity,
        }
      )

      const reviewNote = appendOrderNote(
        order.notes,
        [
          `paid_review:${paymentReference}`,
          `variant:${error.variantId}`,
          `quantity:${error.quantity}`,
          new Date().toISOString(),
        ].join(":")
      )

      await editorPrisma.order.updateMany({
        where: {
          id: orderId,
          siteId,
          status: {
            notIn: [
              "paid",
              "fulfilled",
              "paid_review",
            ],
          },
        },
        data: {
          status: "paid_review",
          mpPaymentId: paymentReference,
          notes: reviewNote,
        },
      })

      /*
       * processed=true significa que el pago sí fue reconocido
       * y clasificado. La orden requiere revisión manual.
       */
      return result({
        ok: false,
        paymentId,
        orderId,
        siteId,
        status,
        processed: true,
      })
    }

    serverError(
      "[store-checkout:mp] Failed processing approved payment",
      {
        paymentId: paymentReference,
        orderId,
        siteId,
        error,
      }
    )

    throw error
  }
}
