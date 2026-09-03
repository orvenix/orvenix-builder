import { editorPrisma } from "@/lib/editor-db"
import {
  getStripePriceId,
  getStripeWebhookSecret,
  isStripeConfigured,
  resolveConfiguredStripePlanFromPrice,
} from "@/lib/stripe"

import type {
  CertificationGroup,
  CertificationResult,
} from "./types"

async function runCheck(
  id: string,
  title: string,
  callback: () => Promise<{
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
      status: "passed",
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

export async function runStripeCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  results.push(
    await runCheck(
      "stripe.configuration",
      "Configuración principal de Stripe",
      async () => {
        if (!isStripeConfigured()) {
          throw new Error("STRIPE_SECRET_KEY no está configurada.")
        }

        const publishableKey =
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

        if (!publishableKey) {
          throw new Error(
            "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está configurada."
          )
        }

        return {
          message: "Las claves principales de Stripe están configuradas.",
        }
      }
    )
  )

  results.push(
    await runCheck(
      "stripe.webhook-secret",
      "Webhook Secret de Stripe",
      async () => {
        const secret = getStripeWebhookSecret()

        if (!secret) {
          throw new Error(
            "STRIPE_WEBHOOK_SECRET no está configurado."
          )
        }

        return {
          message: "El secreto del webhook está configurado.",
        }
      }
    )
  )

  const prices = [
    {
      key: "starter-month",
      title: "Starter mensual",
      planId: "starter",
      interval: "month" as const,
    },
    {
      key: "starter-year",
      title: "Starter anual",
      planId: "starter",
      interval: "year" as const,
    },
    {
      key: "pro-month",
      title: "Pro mensual",
      planId: "pro",
      interval: "month" as const,
    },
    {
      key: "pro-year",
      title: "Pro anual",
      planId: "pro",
      interval: "year" as const,
    },
    {
      key: "business-month",
      title: "Business mensual",
      planId: "business",
      interval: "month" as const,
    },
    {
      key: "business-year",
      title: "Business anual",
      planId: "business",
      interval: "year" as const,
    },
  ]

  for (const price of prices) {
    results.push(
      await runCheck(
        `stripe.price.${price.key}`,
        `Precio ${price.title}`,
        async () => {
          const priceId = getStripePriceId(
            price.planId,
            price.interval
          )

          if (!priceId) {
            throw new Error(
              `No existe Price ID configurado para ${price.title}.`
            )
          }

          const resolved =
            resolveConfiguredStripePlanFromPrice(priceId)

          if (!resolved) {
            throw new Error(
              `El Price ID de ${price.title} no puede resolverse a un plan de Orvenix.`
            )
          }

          const expectedPlanId =
            price.planId === "business"
              ? "commerce"
              : price.planId

          if (
            resolved.planId !== expectedPlanId ||
            resolved.interval !== price.interval
          ) {
            throw new Error(
              `El Price ID de ${price.title} resuelve a ${resolved.planId}/${resolved.interval}.`
            )
          }

          return {
            message: `${price.title} está configurado y resuelve correctamente.`,
            details: {
              planId: resolved.planId,
              interval: resolved.interval,
            },
          }
        }
      )
    )
  }

  results.push(
    await runCheck(
      "stripe.webhook-health",
      "Estado de webhooks Stripe",
      async () => {
        const total = await editorPrisma.webhookEvent.count({
          where: {
            provider: "stripe",
          },
        })

        const failed = await editorPrisma.webhookEvent.count({
          where: {
            provider: "stripe",
            status: "failed",
          },
        })

        if (failed > 0) {
          throw new Error(
            `Existen ${failed} webhooks de Stripe marcados como failed.`
          )
        }

        return {
          message: `${total} eventos Stripe auditados y ninguno marcado como failed.`,
          details: {
            total,
            failed,
          },
        }
      }
    )
  )

  return {
    id: "stripe",
    title: "Stripe",
    results,
  }
}
