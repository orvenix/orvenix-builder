"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const route_logic_1 = require("../../lib/billing/route-logic");
(0, node_test_1.default)("buildBillingStatusResponse requires a logged-in user", async () => {
    const result = await (0, route_logic_1.buildBillingStatusResponse)({
        session: null,
        findSubscription: async () => null,
        countWebsites: async () => 0,
    });
    strict_1.default.equal(result.status, 401);
    strict_1.default.deepEqual(result.body, { error: "SESSION_REQUIRED" });
});
(0, node_test_1.default)("buildBillingStatusResponse returns usage details for active subscriptions", async () => {
    var _a;
    const result = await (0, route_logic_1.buildBillingStatusResponse)({
        session: { user: { id: "user_1" } },
        findSubscription: async () => ({
            id: "sub_1",
            status: "active",
            interval: "month",
            provider: "stripe",
            currentPeriodEnd: new Date("2026-05-19T00:00:00.000Z"),
            plan: {
                id: "pro",
                maxWebsites: 3,
                maxVisits: 5000,
            },
        }),
        countWebsites: async () => 2,
    });
    strict_1.default.equal(result.status, 200);
    strict_1.default.equal("subscription" in result.body && ((_a = result.body.subscription) === null || _a === void 0 ? void 0 : _a.id), "sub_1");
    strict_1.default.equal("isActive" in result.body && result.body.isActive, true);
    strict_1.default.deepEqual("usage" in result.body ? result.body.usage : null, {
        websitesUsed: 2,
        websitesLimit: 3,
        visitsLimit: 5000,
    });
});
(0, node_test_1.default)("buildBillingSubscribeResponse prefers Stripe when configured and a price id exists", async () => {
    let upsertPayload = null;
    const result = await (0, route_logic_1.buildBillingSubscribeResponse)({
        session: { user: { id: "user_1", email: "user@example.com" } },
        body: { planId: "pro", interval: "year" },
        findPlan: async () => ({
            id: "pro",
            isActive: true,
            stripePriceIdYear: "price_year",
        }),
        findSubscription: async () => null,
        getStripePriceId: () => "price_year",
        isStripeConfigured: () => true,
        createStripeCheckoutSession: async () => ({
            checkoutUrl: "https://stripe.test/checkout",
            sessionId: "cs_test",
        }),
        upsertSubscription: async (params) => {
            upsertPayload = params.update;
            return {};
        },
    });
    strict_1.default.equal(result.status, 200);
    strict_1.default.equal("provider" in result.body && result.body.provider, "stripe");
    strict_1.default.equal("initPoint" in result.body && result.body.initPoint, "https://stripe.test/checkout");
    strict_1.default.deepEqual(upsertPayload, {
        provider: "stripe",
        planId: "pro",
        interval: "year",
        status: "pending",
        mpSubscriptionId: null,
    });
});
(0, node_test_1.default)("buildBillingSubscribeResponse requires Stripe for new subscriptions when it is unavailable", async () => {
    const result = await (0, route_logic_1.buildBillingSubscribeResponse)({
        session: { user: { id: "user_1", email: "user@example.com" } },
        body: { planId: "starter", interval: "month" },
        findPlan: async () => ({
            id: "starter",
            isActive: true,
            stripePriceIdMonth: null,
        }),
        findSubscription: async () => null,
        getStripePriceId: () => null,
        isStripeConfigured: () => false,
        createStripeCheckoutSession: async () => {
            throw new Error("should not be called");
        },
        upsertSubscription: async () => ({}),
    });
    strict_1.default.equal(result.status, 503);
    strict_1.default.deepEqual(result.body, {
        error: "Las suscripciones nuevas estan disponibles solo con Stripe en este entorno.",
        code: "STRIPE_SUBSCRIPTIONS_REQUIRED",
    });
});
(0, node_test_1.default)("buildBillingSubscribeResponse rejects duplicate active subscriptions", async () => {
    const result = await (0, route_logic_1.buildBillingSubscribeResponse)({
        session: { user: { id: "user_1", email: "user@example.com" } },
        body: { planId: "pro", interval: "month" },
        findPlan: async () => ({
            id: "pro",
            isActive: true,
        }),
        findSubscription: async () => ({
            id: "sub_active",
            status: "active",
            planId: "starter",
        }),
        getStripePriceId: () => "price_month",
        isStripeConfigured: () => true,
        createStripeCheckoutSession: async () => ({
            checkoutUrl: "unused",
            sessionId: "unused",
        }),
        upsertSubscription: async () => ({}),
    });
    strict_1.default.equal(result.status, 409);
    strict_1.default.deepEqual(result.body, {
        error: "Ya tienes una suscripción activa. Cámbiala desde el dashboard.",
        code: "ACTIVE_SUBSCRIPTION_EXISTS",
    });
});
(0, node_test_1.default)("buildBillingSubscribeResponse sends scheduled cancellations back to dashboard reactivation", async () => {
    const result = await (0, route_logic_1.buildBillingSubscribeResponse)({
        session: { user: { id: "user_1", email: "user@example.com" } },
        body: { planId: "pro", interval: "month" },
        findPlan: async () => ({
            id: "pro",
            isActive: true,
            stripePriceIdMonth: "price_month",
        }),
        findSubscription: async () => ({
            id: "sub_cancelled",
            status: "cancelled",
            planId: "pro",
            canceledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        getStripePriceId: () => "price_month",
        isStripeConfigured: () => true,
        createStripeCheckoutSession: async () => ({
            checkoutUrl: "unused",
            sessionId: "unused",
        }),
        upsertSubscription: async () => ({}),
    });
    strict_1.default.equal(result.status, 409);
    strict_1.default.deepEqual(result.body, {
        error: "Tu cancelacion ya esta programada y el acceso sigue activo hasta el fin del periodo. Reactiva o cambia el plan desde el dashboard.",
        code: "REACTIVATE_VIA_DASHBOARD",
    });
});
(0, node_test_1.default)("buildBillingSubscribeResponse reports Stripe plan setup is missing for the selected interval", async () => {
    const result = await (0, route_logic_1.buildBillingSubscribeResponse)({
        session: { user: { id: "user_1", email: "user@example.com" } },
        body: { planId: "starter", interval: "month" },
        findPlan: async () => ({
            id: "starter",
            isActive: true,
            stripePriceIdMonth: null,
        }),
        findSubscription: async () => null,
        getStripePriceId: () => null,
        isStripeConfigured: () => true,
        createStripeCheckoutSession: async () => ({
            checkoutUrl: "unused",
            sessionId: "unused",
        }),
        upsertSubscription: async () => ({}),
    });
    strict_1.default.equal(result.status, 503);
    strict_1.default.deepEqual(result.body, {
        error: "Este plan todavia no tiene el Price ID de Stripe configurado para este intervalo.",
        code: "STRIPE_PLAN_NOT_READY",
    });
});
(0, node_test_1.default)("buildBillingCancelResponse cancels Stripe subscriptions and updates the local record", async () => {
    let cancelledStripeId = null;
    let updatedAt = null;
    const result = await (0, route_logic_1.buildBillingCancelResponse)({
        session: { user: { id: "user_1" } },
        findSubscription: async () => ({
            id: "sub_1",
            status: "active",
            provider: "stripe",
            stripeSubscriptionId: "sub_stripe",
        }),
        isStripeConfigured: () => true,
        cancelStripeSubscription: async (stripeSubscriptionId) => {
            cancelledStripeId = stripeSubscriptionId;
        },
        isMpConfigured: () => true,
        cancelMpSubscription: async () => undefined,
        updateSubscription: async ({ data }) => {
            updatedAt = data.canceledAt;
            return {
                id: "sub_1",
                status: data.status,
                canceledAt: data.canceledAt,
            };
        },
    });
    strict_1.default.equal(result.status, 200);
    strict_1.default.equal(cancelledStripeId, "sub_stripe");
    strict_1.default.ok(updatedAt instanceof Date);
    strict_1.default.equal("ok" in result.body && result.body.ok, true);
});
(0, node_test_1.default)("buildBillingCancelResponse returns configuration error for MercadoPago cancellations without MP", async () => {
    const result = await (0, route_logic_1.buildBillingCancelResponse)({
        session: { user: { id: "user_1" } },
        findSubscription: async () => ({
            id: "sub_mp",
            status: "active",
            provider: "mercadopago",
            mpSubscriptionId: "preapp_123",
        }),
        isStripeConfigured: () => true,
        cancelStripeSubscription: async () => undefined,
        isMpConfigured: () => false,
        cancelMpSubscription: async () => undefined,
        updateSubscription: async () => {
            throw new Error("should not update");
        },
    });
    strict_1.default.equal(result.status, 503);
    strict_1.default.deepEqual(result.body, {
        error: "MercadoPago no está configurado para cancelar esta suscripción",
        code: "MP_NOT_CONFIGURED",
    });
});
