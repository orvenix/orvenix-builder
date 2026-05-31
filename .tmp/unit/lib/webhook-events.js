"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMessage = exports.createWebhookEventService = void 0;
exports.recordWebhookEvent = recordWebhookEvent;
exports.markWebhookEvent = markWebhookEvent;
exports.listRecentWebhookEvents = listRecentWebhookEvents;
exports.getWebhookEventStats = getWebhookEventStats;
const editor_db_1 = require("@/lib/editor-db");
const webhook_event_service_1 = require("./webhook-event-service");
Object.defineProperty(exports, "createWebhookEventService", { enumerable: true, get: function () { return webhook_event_service_1.createWebhookEventService; } });
Object.defineProperty(exports, "errorMessage", { enumerable: true, get: function () { return webhook_event_service_1.errorMessage; } });
function getWebhookClient() {
    return editor_db_1.editorPrisma.webhookEvent;
}
async function recordWebhookEvent(params) {
    return (0, webhook_event_service_1.createWebhookEventService)(getWebhookClient()).recordWebhookEvent(params);
}
async function markWebhookEvent(...args) {
    return (0, webhook_event_service_1.createWebhookEventService)(getWebhookClient()).markWebhookEvent(...args);
}
async function listRecentWebhookEvents(limit = 50) {
    return (0, webhook_event_service_1.createWebhookEventService)(getWebhookClient()).listRecentWebhookEvents(limit);
}
async function getWebhookEventStats() {
    return (0, webhook_event_service_1.createWebhookEventService)(getWebhookClient()).getWebhookEventStats();
}
