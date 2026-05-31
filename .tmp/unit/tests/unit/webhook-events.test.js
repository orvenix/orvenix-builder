"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const webhook_event_service_1 = require("../../lib/webhook-event-service");
function createMockClient() {
    const calls = {
        create: [],
        update: [],
        findMany: [],
        count: [],
    };
    const client = {
        async create(args) {
            calls.create.push(args);
            return { id: "evt_local" };
        },
        async update(args) {
            calls.update.push(args);
            return { ok: true };
        },
        async findMany(args) {
            calls.findMany.push(args);
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
            ];
        },
        async count(args) {
            var _a;
            calls.count.push(args !== null && args !== void 0 ? args : null);
            const status = (_a = args === null || args === void 0 ? void 0 : args.where) === null || _a === void 0 ? void 0 : _a.status;
            if (!status)
                return 10;
            if (status === "processed")
                return 4;
            if (status === "failed")
                return 2;
            if (status === "skipped")
                return 1;
            if (status === "received")
                return 3;
            return 0;
        },
    };
    return { client, calls };
}
(0, node_test_1.default)("errorMessage normalizes different error values", () => {
    strict_1.default.equal((0, webhook_event_service_1.errorMessage)(new Error("boom")), "boom");
    strict_1.default.equal((0, webhook_event_service_1.errorMessage)("plain"), "plain");
    strict_1.default.equal((0, webhook_event_service_1.errorMessage)(42), "42");
});
(0, node_test_1.default)("recordWebhookEvent stores a received audit event and returns id", async () => {
    const { client, calls } = createMockClient();
    const service = (0, webhook_event_service_1.createWebhookEventService)(client);
    const id = await service.recordWebhookEvent({
        provider: "stripe",
        eventId: "evt_1",
        eventType: "checkout.session.completed",
        resourceId: "cs_test",
        payload: { ok: true },
    });
    strict_1.default.equal(id, "evt_local");
    strict_1.default.equal(calls.create.length, 1);
    strict_1.default.deepEqual(calls.create[0], {
        data: {
            provider: "stripe",
            eventId: "evt_1",
            eventType: "checkout.session.completed",
            resourceId: "cs_test",
            status: "received",
            payload: { ok: true },
        },
    });
});
(0, node_test_1.default)("markWebhookEvent updates status and error message", async () => {
    const { client, calls } = createMockClient();
    const service = (0, webhook_event_service_1.createWebhookEventService)(client);
    await service.markWebhookEvent("evt_local", "failed", new Error("signature invalid"));
    strict_1.default.equal(calls.update.length, 1);
    const updateCall = calls.update[0];
    strict_1.default.equal(updateCall.where.id, "evt_local");
    strict_1.default.equal(updateCall.data.status, "failed");
    strict_1.default.equal(updateCall.data.error, "signature invalid");
    strict_1.default.ok(updateCall.data.processedAt instanceof Date);
});
(0, node_test_1.default)("listRecentWebhookEvents and getWebhookEventStats delegate to the webhook client", async () => {
    const { client, calls } = createMockClient();
    const service = (0, webhook_event_service_1.createWebhookEventService)(client);
    const events = await service.listRecentWebhookEvents(25);
    const stats = await service.getWebhookEventStats();
    strict_1.default.equal(events.length, 1);
    strict_1.default.equal(calls.findMany.length, 1);
    strict_1.default.deepEqual(stats, {
        total: 10,
        processed: 4,
        failed: 2,
        skipped: 1,
        received: 3,
    });
    strict_1.default.equal(calls.count.length, 5);
});
