"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const plan_guard_messages_1 = require("../../lib/plan-guard-messages");
(0, node_test_1.default)("getWebsiteLimitMessage returns upgrade message when there is no active plan", () => {
    const message = (0, plan_guard_messages_1.getWebsiteLimitMessage)({ isActive: false, plan: null });
    strict_1.default.equal(message, "Necesitas un plan activo para crear sitios. Actualiza tu plan en /precios.");
});
(0, node_test_1.default)("getWebsiteLimitMessage uses singular when limit is one", () => {
    const access = {
        isActive: true,
        plan: {
            id: "starter",
            name: "Starter",
            maxWebsites: 1,
            maxVisits: 1000,
            hasEcommerce: false,
            hasAI: false,
            hasExport: false,
        },
    };
    const message = (0, plan_guard_messages_1.getWebsiteLimitMessage)(access);
    strict_1.default.equal(message, "Has alcanzado el límite de 1 sitio de tu plan. Actualiza tu plan en /precios.");
});
(0, node_test_1.default)("getWebsiteLimitMessage uses plural when limit is greater than one", () => {
    const access = {
        isActive: true,
        plan: {
            id: "pro",
            name: "Pro",
            maxWebsites: 3,
            maxVisits: 5000,
            hasEcommerce: true,
            hasAI: true,
            hasExport: true,
        },
    };
    const message = (0, plan_guard_messages_1.getWebsiteLimitMessage)(access);
    strict_1.default.equal(message, "Has alcanzado el límite de 3 sitios de tu plan. Actualiza tu plan en /precios.");
});
(0, node_test_1.default)("getFeatureLimitMessage returns the correct copy for each gated feature", () => {
    strict_1.default.match((0, plan_guard_messages_1.getFeatureLimitMessage)("ecommerce"), /e-commerce requiere un plan con tienda incluida/i);
    strict_1.default.match((0, plan_guard_messages_1.getFeatureLimitMessage)("export"), /exportacion requiere un plan Pro o superior/i);
    strict_1.default.match((0, plan_guard_messages_1.getFeatureLimitMessage)("ai"), /Orvenix AI requiere un plan con IA incluida/i);
});
