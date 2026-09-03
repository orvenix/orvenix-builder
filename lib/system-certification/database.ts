import { editorPrisma } from "@/lib/editor-db"
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

export async function runDatabaseCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  results.push(
    await runCheck(
      "database.connection",
      "Conexión con MariaDB",
      async () => {
        const rows = await editorPrisma.$queryRaw<
          Array<{ databaseName: string | null }>
        >`
          SELECT DATABASE() AS databaseName
        `

        const databaseName = rows[0]?.databaseName ?? null

        if (!databaseName) {
          throw new Error(
            "La conexión no devolvió una base de datos activa."
          )
        }

        return {
          message: `Conectado correctamente a ${databaseName}.`,
          details: { databaseName },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "database.users",
      "Tabla de usuarios",
      async () => {
        const total = await editorPrisma.user.count()

        return {
          message: `La tabla users responde correctamente (${total} usuarios).`,
          details: { total },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "database.subscriptions",
      "Tabla de suscripciones",
      async () => {
        const total = await editorPrisma.subscription.count()

        return {
          message: `La tabla subscriptions responde correctamente (${total} suscripciones).`,
          details: { total },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "database.webhooks",
      "Auditoría de webhooks",
      async () => {
        const total = await editorPrisma.webhookEvent.count()
        const failed = await editorPrisma.webhookEvent.count({
          where: { status: "failed" },
        })

        return {
          message:
            failed === 0
              ? `Webhooks disponibles (${total} eventos, ninguno fallido).`
              : `Webhooks disponibles, pero existen ${failed} eventos fallidos.`,
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
      "database.webhook-idempotency",
      "Idempotencia de webhooks",
      async () => {
        const duplicates = await editorPrisma.$queryRaw<
          Array<{
            provider: string
            eventId: string
            total: bigint
          }>
        >`
          SELECT
            provider,
            eventId,
            COUNT(*) AS total
          FROM webhook_events
          WHERE eventId IS NOT NULL
          GROUP BY provider, eventId
          HAVING COUNT(*) > 1
          LIMIT 10
        `

        if (duplicates.length > 0) {
          throw new Error(
            `Se encontraron ${duplicates.length} eventos webhook duplicados.`
          )
        }

        return {
          message:
            "No existen eventos duplicados por provider y eventId.",
          details: {
            duplicates: 0,
          },
        }
      }
    )
  )

  results.push(
    await runCheck(
      "database.subscription-history",
      "Historial de suscripciones",
      async () => {
        const total =
          await editorPrisma.subscriptionHistory.count()

        return {
          message: `El historial responde correctamente (${total} registros).`,
          details: { total },
        }
      }
    )
  )

  return {
    id: "database",
    title: "Base de datos",
    results,
  }
}
