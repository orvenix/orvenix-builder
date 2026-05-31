import { serverWarn } from "./server-log"

type WebhookProvider = "stripe" | "mercadopago"
type WebhookStatus = "received" | "processed" | "skipped" | "failed"

export type WebhookEventClient = {
  create: (args: {
    data: {
      provider: WebhookProvider
      eventId?: string | null
      eventType: string
      resourceId?: string | null
      status?: WebhookStatus
      payload?: unknown
    }
  }) => Promise<{ id: string }>
  update: (args: {
    where: { id: string }
    data: {
      status: WebhookStatus
      error?: string | null
      processedAt?: Date
    }
  }) => Promise<unknown>
  findMany: (args: {
    orderBy: { createdAt: "desc" }
    take: number
    select: {
      id: true
      provider: true
      eventId: true
      eventType: true
      resourceId: true
      status: true
      error: true
      createdAt: true
      processedAt: true
    }
  }) => Promise<Array<{
    id: string
    provider: string
    eventId: string | null
    eventType: string
    resourceId: string | null
    status: string
    error: string | null
    createdAt: Date
    processedAt: Date | null
  }>>
  count: (args?: { where?: { status?: string } }) => Promise<number>
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export function createWebhookEventService(client?: WebhookEventClient | null) {
  return {
    async recordWebhookEvent(params: {
      provider: WebhookProvider
      eventId?: string | null
      eventType: string
      resourceId?: string | null
      payload?: unknown
    }) {
      try {
        if (!client) return null

        const event = await client.create({
          data: {
            provider: params.provider,
            eventId: params.eventId ?? null,
            eventType: params.eventType,
            resourceId: params.resourceId ?? null,
            status: "received",
            payload: params.payload,
          },
        })

        return event.id
      } catch (error) {
        serverWarn("[webhook:audit] No se pudo registrar evento", {
          provider: params.provider,
          eventType: params.eventType,
          error: errorMessage(error),
        })
        return null
      }
    },

    async markWebhookEvent(
      id: string | null,
      status: WebhookStatus,
      error?: unknown
    ) {
      if (!id) return

      try {
        if (!client) return

        await client.update({
          where: { id },
          data: {
            status,
            error: error ? errorMessage(error) : null,
            processedAt: new Date(),
          },
        })
      } catch (updateError) {
        serverWarn("[webhook:audit] No se pudo actualizar evento", {
          id,
          status,
          error: errorMessage(updateError),
        })
      }
    },

    async listRecentWebhookEvents(limit = 50) {
      if (!client) return []

      return client.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          provider: true,
          eventId: true,
          eventType: true,
          resourceId: true,
          status: true,
          error: true,
          createdAt: true,
          processedAt: true,
        },
      })
    },

    async getWebhookEventStats() {
      if (!client) {
        return { total: 0, processed: 0, failed: 0, skipped: 0, received: 0 }
      }

      const [total, processed, failed, skipped, received] = await Promise.all([
        client.count(),
        client.count({ where: { status: "processed" } }),
        client.count({ where: { status: "failed" } }),
        client.count({ where: { status: "skipped" } }),
        client.count({ where: { status: "received" } }),
      ])

      return { total, processed, failed, skipped, received }
    },
  }
}
