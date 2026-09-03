import { editorPrisma } from "@/lib/editor-db"
import {
  getMpPayment,
  getMpSubscription,
  isMpConfigured,
} from "@/lib/mercadopago"

import type {
  CertificationGroup,
  CertificationResult,
} from "./types"

async function runCheck(
  id: string,
  title: string,
  callback: () => Promise<{
    status?: "passed" | "warning"
    message: string
    details?: Record<string, unknown>
  }>
): Promise<CertificationResult> {
  const startedAt = Date.now()

  try {
    const result = await callback()

    return {
      id,
      title,
      status: result.status ?? "passed",
      message: result.message,
      durationMs: Date.now() - startedAt,
      details: result.details,
    }
  } catch (error) {
    return {
      id,
      title,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : String(error),
      durationMs: Date.now() - startedAt,
    }
  }
}
  

export async function runMercadoPagoCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  results.push(
    await runCheck(
      "mercadopago.configuration",
      "Configuración principal de Mercado Pago",
      async () => {
        if (!isMpConfigured()) {
          throw new Error(
            "Mercado Pago no está configurado correctamente."
          )
        }

        if (!process.env.MP_PUBLIC_KEY) {
          throw new Error(
            "MP_PUBLIC_KEY no está configurada."
          )
        }

        return {
          message:
            "Las credenciales principales de Mercado Pago están configuradas.",
        }
      }
    )
  )

  results.push(
    await runCheck(
      "mercadopago.sandbox",
      "Modo de Mercado Pago",
      async () => {
        const raw = process.env.MP_SANDBOX?.trim().toLowerCase()
        const sandbox =
          raw === "true" ||
          raw === "1" ||
          raw === "yes"

        return {
          message: sandbox
            ? "Mercado Pago está configurado en modo sandbox."
            : "Mercado Pago está configurado fuera de sandbox.",
          details: {
            sandbox,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "mercadopago.webhook-health",
      "Estado de webhooks Mercado Pago",
      async () => {
        const total = await editorPrisma.webhookEvent.count({
          where: {
            provider: "mercadopago",
          },
        })

        const failed = await editorPrisma.webhookEvent.count({
          where: {
            provider: "mercadopago",
            status: "failed",
          },
        })

        if (failed > 0) {
  throw new Error(
    `Existen ${failed} webhooks de Mercado Pago marcados como failed.`
  )
}

        if (total === 0) {
          return {
            status: "warning" as const,
            message:
              "No hay webhooks de Mercado Pago registrados todavía.",
            details: {
             total,
             failed,
           },
          }
      }

          return {
             message:
           `${total} eventos Mercado Pago auditados y ninguno marcado como failed.`,
            details: {
            total,
            failed,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "mercadopago.payment-access",
      "Acceso a pagos Mercado Pago",
      async () => {
        const recentPayment = await editorPrisma.webhookEvent.findFirst({
          where: {
            provider: "mercadopago",
            resourceId: {
              not: null,
            },
            OR: [
              { eventType: "payment" },
              { eventType: "payment.created" },
              { eventType: "payment.updated" },
              { eventType: "legacy.payment" },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            resourceId: true,
          },
        })

        if (!recentPayment?.resourceId) {
  return {
    status: "warning" as const,
    message:
      "No hay pagos recientes de Mercado Pago para validar consulta remota.",
    details: {
      tested: false,
    },
  }
}

        await getMpPayment(recentPayment.resourceId)

        return {
          message:
            "La API de pagos de Mercado Pago responde correctamente.",
          details: {
            tested: true,
            resourceId: recentPayment.resourceId,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "mercadopago.subscription-access",
      "Acceso a suscripciones Mercado Pago",
      async () => {
        const subscription =
          await editorPrisma.subscription.findFirst({
            where: {
              mpSubscriptionId: {
                not: null,
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
            select: {
              mpSubscriptionId: true,
            },
          })

        if (!subscription?.mpSubscriptionId) {
  return {
    status: "warning" as const,
    message:
      "No hay suscripciones Mercado Pago para validar consulta remota.",
    details: {
      tested: false,
    },
  }
}

        await getMpSubscription(
          subscription.mpSubscriptionId
        )

        return {
          message:
            "La API de suscripciones de Mercado Pago responde correctamente.",
          details: {
            tested: true,
            mpSubscriptionId:
              subscription.mpSubscriptionId,
          },
        }
      }
    )
  )

  return {
    id: "mercadopago",
    title: "Mercado Pago",
    results,
  }
}
