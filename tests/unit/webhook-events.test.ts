import test from "node:test"
import assert from "node:assert/strict"
import { createWebhookEventService, errorMessage, type WebhookEventClient } from "../../lib/webhook-event-service"

function createMockClient() {
  const calls: {
  create: Array<Parameters<WebhookEventClient["create"]>[0]>
  update: Array<Parameters<WebhookEventClient["update"]>[0]>
  findMany: Array<Parameters<WebhookEventClient["findMany"]>[0]>
  count: Array<Parameters<WebhookEventClient["count"]>[0] | null>
} = {
    create: [],
    update: [],
    findMany: [],
    count: [],
  }

  const client: WebhookEventClient = {
    async create(args) {
      calls.create.push(args)
      return { id: "evt_local" }
    },
    async update(args) {
      calls.update.push(args)
      return { ok: true }
    },
    async findMany(args) {
      calls.findMany.push(args)
      return [
        {
          id: "evt_local",
          provider: "stripe",
          eventId: "evt_1",
          eventType: "checkout.session.completed",
          resourceId: "cs_test",
          status: "processed",
          error: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          processedAt: new Date("2026-01-01T00:00:01.000Z"),
        },
      ]
    },
    async count(args) {
      calls.count.push(args ?? null)
      const status = args?.where?.status
      if (!status) return 10
      if (status === "processed") return 4
      if (status === "failed") return 2
      if (status === "skipped") return 1
      if (status === "received") return 3
      return 0
    },
  }

  return { client, calls }
}

test("errorMessage normalizes different error values", () => {
  assert.equal(errorMessage(new Error("boom")), "boom")
  assert.equal(errorMessage("plain"), "plain")
  assert.equal(errorMessage(42), "42")
})

test("recordWebhookEvent stores a received audit event and returns result", async () => {
  const { client, calls } = createMockClient()
  const service = createWebhookEventService(client)

  const result = await service.recordWebhookEvent({
    provider: "stripe",
    eventId: "evt_1",
    eventType: "checkout.session.completed",
    resourceId: "cs_test",
    payload: { ok: true },
  })

  assert.equal(result.duplicate, false)
  assert.equal(typeof result.id, "string")
  assert.ok(result.id.length > 0)

  assert.equal(calls.create.length, 1)
  const created = calls.create[0].data

  assert.equal(typeof created.id, "string")
  assert.ok(created.id.startsWith("wh_"))
  assert.equal(created.provider, "stripe")
  assert.equal(created.eventId, "evt_1")
  assert.equal(created.eventType, "checkout.session.completed")
  assert.equal(created.resourceId, "cs_test")
  assert.equal(created.status, "received")
  assert.deepEqual(created.payload, { ok: true })
})

test("markWebhookEvent updates status and error message", async () => {
  const { client, calls } = createMockClient()
  const service = createWebhookEventService(client)

  await service.markWebhookEvent("evt_local", "failed", new Error("signature invalid"))

  assert.equal(calls.update.length, 1)
  const updateCall = calls.update[0] as {
    where: { id: string }
    data: { status: string; error: string | null; processedAt: Date }
  }
  assert.equal(updateCall.where.id, "evt_local")
  assert.equal(updateCall.data.status, "failed")
  assert.equal(updateCall.data.error, "signature invalid")
  assert.ok(updateCall.data.processedAt instanceof Date)
})

test("listRecentWebhookEvents and getWebhookEventStats delegate to the webhook client", async () => {
  const { client, calls } = createMockClient()
  const service = createWebhookEventService(client)

  const events = await service.listRecentWebhookEvents(25)
  const stats = await service.getWebhookEventStats()

  assert.equal(events.length, 1)
  assert.equal(calls.findMany.length, 1)
  assert.deepEqual(stats, {
    total: 10,
    processed: 4,
    failed: 2,
    skipped: 1,
    received: 3,
  })
  assert.equal(calls.count.length, 5)
})
