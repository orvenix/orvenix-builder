import test from "node:test"
import assert from "node:assert/strict"
import { createWebhookEventService, errorMessage, type WebhookEventClient } from "../../lib/webhook-event-service"

function createMockClient() {
  const calls: {
    create: Array<unknown>
    update: Array<unknown>
    findMany: Array<unknown>
    count: Array<unknown>
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

test("recordWebhookEvent stores a received audit event and returns id", async () => {
  const { client, calls } = createMockClient()
  const service = createWebhookEventService(client)

  const id = await service.recordWebhookEvent({
    provider: "stripe",
    eventId: "evt_1",
    eventType: "checkout.session.completed",
    resourceId: "cs_test",
    payload: { ok: true },
  })

  assert.equal(id, "evt_local")
  assert.equal(calls.create.length, 1)
  assert.deepEqual(calls.create[0], {
    data: {
      provider: "stripe",
      eventId: "evt_1",
      eventType: "checkout.session.completed",
      resourceId: "cs_test",
      status: "received",
      payload: { ok: true },
    },
  })
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
