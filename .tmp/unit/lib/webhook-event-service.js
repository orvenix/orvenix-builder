"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessage = errorMessage;
exports.createWebhookEventService = createWebhookEventService;
const server_log_1 = require("./server-log");
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function createWebhookEventService(client) {
    return {
        async recordWebhookEvent(params) {
            var _a, _b;
            try {
                if (!client)
                    return null;
                const event = await client.create({
                    data: {
                        provider: params.provider,
                        eventId: (_a = params.eventId) !== null && _a !== void 0 ? _a : null,
                        eventType: params.eventType,
                        resourceId: (_b = params.resourceId) !== null && _b !== void 0 ? _b : null,
                        status: "received",
                        payload: params.payload,
                    },
                });
                return event.id;
            }
            catch (error) {
                (0, server_log_1.serverWarn)("[webhook:audit] No se pudo registrar evento", {
                    provider: params.provider,
                    eventType: params.eventType,
                    error: errorMessage(error),
                });
                return null;
            }
        },
        async markWebhookEvent(id, status, error) {
            if (!id)
                return;
            try {
                if (!client)
                    return;
                await client.update({
                    where: { id },
                    data: {
                        status,
                        error: error ? errorMessage(error) : null,
                        processedAt: new Date(),
                    },
                });
            }
            catch (updateError) {
                (0, server_log_1.serverWarn)("[webhook:audit] No se pudo actualizar evento", {
                    id,
                    status,
                    error: errorMessage(updateError),
                });
            }
        },
        async listRecentWebhookEvents(limit = 50) {
            if (!client)
                return [];
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
            });
        },
        async getWebhookEventStats() {
            if (!client) {
                return { total: 0, processed: 0, failed: 0, skipped: 0, received: 0 };
            }
            const [total, processed, failed, skipped, received] = await Promise.all([
                client.count(),
                client.count({ where: { status: "processed" } }),
                client.count({ where: { status: "failed" } }),
                client.count({ where: { status: "skipped" } }),
                client.count({ where: { status: "received" } }),
            ]);
            return { total, processed, failed, skipped, received };
        },
    };
}
