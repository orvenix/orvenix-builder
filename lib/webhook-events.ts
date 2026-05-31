import { editorPrisma } from "@/lib/editor-db"
import {
  createWebhookEventService as createService,
  type WebhookEventClient,
  errorMessage,
} from "./webhook-event-service"

function getWebhookClient() {
  return (editorPrisma as unknown as { webhookEvent?: WebhookEventClient }).webhookEvent
}

export { createService as createWebhookEventService, errorMessage, type WebhookEventClient }

export async function recordWebhookEvent(params: Parameters<ReturnType<typeof createService>["recordWebhookEvent"]>[0]) {
  return createService(getWebhookClient()).recordWebhookEvent(params)
}

export async function markWebhookEvent(...args: Parameters<ReturnType<typeof createService>["markWebhookEvent"]>) {
  return createService(getWebhookClient()).markWebhookEvent(...args)
}

export async function listRecentWebhookEvents(limit = 50) {
  return createService(getWebhookClient()).listRecentWebhookEvents(limit)
}

export async function getWebhookEventStats() {
  return createService(getWebhookClient()).getWebhookEventStats()
}
