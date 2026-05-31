"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBillingStatusResponse = buildBillingStatusResponse;
exports.buildBillingSubscribeResponse = buildBillingSubscribeResponse;
exports.buildBillingCancelResponse = buildBillingCancelResponse;
const ACTIVE_STATUSES = new Set(["active", "authorized"]);
const FINAL_STATUSES = new Set(["cancelled", "canceled"]);
function getEffectiveAccessEnd(subscription) {
    var _a, _b;
    return (_b = (_a = subscription === null || subscription === void 0 ? void 0 : subscription.canceledAt) !== null && _a !== void 0 ? _a : subscription === null || subscription === void 0 ? void 0 : subscription.currentPeriodEnd) !== null && _b !== void 0 ? _b : null;
}
function hasScheduledCancellationAccess(subscription) {
    if (!subscription)
        return false;
    if (!FINAL_STATUSES.has(subscription.status.toLowerCase()))
        return false;
    const effectiveEnd = getEffectiveAccessEnd(subscription);
    return effectiveEnd instanceof Date && effectiveEnd.getTime() > Date.now();
}
function jsonError(message, status, code) {
    return { status, body: { error: message, code } };
}
async function buildBillingStatusResponse(params) {
    var _a, _b, _c, _d, _e, _f;
    const userId = (_b = (_a = params.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        return { status: 401, body: { error: "SESSION_REQUIRED" } };
    }
    const subscription = await params.findSubscription(userId);
    if (!subscription) {
        return { status: 200, body: { subscription: null, plan: null, isActive: false } };
    }
    const isActive = subscription.status === "authorized" || subscription.status === "active";
    const websitesUsed = await params.countWebsites(userId);
    return {
        status: 200,
        body: {
            subscription: {
                id: subscription.id,
                status: subscription.status,
                interval: subscription.interval,
                provider: subscription.provider,
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
            plan: subscription.plan,
            isActive,
            usage: {
                websitesUsed,
                websitesLimit: (_d = (_c = subscription.plan) === null || _c === void 0 ? void 0 : _c.maxWebsites) !== null && _d !== void 0 ? _d : 0,
                visitsLimit: (_f = (_e = subscription.plan) === null || _e === void 0 ? void 0 : _e.maxVisits) !== null && _f !== void 0 ? _f : 0,
            },
        },
    };
}
async function buildBillingSubscribeResponse(params) {
    var _a, _b, _c, _d;
    const userId = (_b = (_a = params.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        return jsonError("SESSION_REQUIRED", 401, "SESSION_REQUIRED");
    }
    const userEmail = (_d = (_c = params.session) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.email;
    if (!userEmail) {
        return jsonError("Tu sesión no tiene email asociado", 400, "EMAIL_REQUIRED");
    }
    const planId = params.body.planId;
    const interval = params.body.interval === "year" ? "year" : "month";
    if (!planId) {
        return jsonError("Falta planId", 400, "PLAN_REQUIRED");
    }
    const [plan, existingSubscription] = await Promise.all([
        params.findPlan(planId),
        params.findSubscription(userId),
    ]);
    if (!plan) {
        return jsonError("Plan no encontrado", 404, "PLAN_NOT_FOUND");
    }
    if (!plan.isActive) {
        return jsonError("Este plan ya no está disponible", 410, "PLAN_INACTIVE");
    }
    if (existingSubscription && ACTIVE_STATUSES.has(existingSubscription.status)) {
        return jsonError(existingSubscription.planId === planId
            ? "Ya tienes este plan activo"
            : "Ya tienes una suscripción activa. Cámbiala desde el dashboard.", 409, "ACTIVE_SUBSCRIPTION_EXISTS");
    }
    if (hasScheduledCancellationAccess(existingSubscription)) {
        return jsonError("Tu cancelacion ya esta programada y el acceso sigue activo hasta el fin del periodo. Reactiva o cambia el plan desde el dashboard.", 409, "REACTIVATE_VIA_DASHBOARD");
    }
    const stripePriceId = params.getStripePriceId(planId, interval, interval === "year" ? plan.stripePriceIdYear : plan.stripePriceIdMonth);
    if (params.isStripeConfigured() && stripePriceId) {
        let result;
        try {
            result = await params.createStripeCheckoutSession({
                userEmail,
                userId,
                planId,
                interval,
                priceId: stripePriceId,
            });
        }
        catch (error) {
            const detail = typeof error === "object" &&
                error !== null &&
                "message" in error &&
                typeof error.message === "string"
                ? error.message
                : null;
            return jsonError(process.env.NODE_ENV === "development" && detail
                ? `No pudimos iniciar el checkout en Stripe: ${detail}`
                : "No pudimos iniciar el checkout en Stripe. Intenta de nuevo o contacta soporte.", 502, "STRIPE_SUBSCRIBE_FAILED");
        }
        await params.upsertSubscription({
            where: { userId },
            update: {
                provider: "stripe",
                planId,
                interval,
                status: "pending",
                mpSubscriptionId: null,
            },
            create: {
                userId,
                provider: "stripe",
                planId,
                interval,
                status: "pending",
            },
        });
        return {
            status: 200,
            body: {
                initPoint: result.checkoutUrl,
                provider: "stripe",
                subscription: {
                    status: "pending",
                    planId,
                    interval,
                },
            },
        };
    }
    if (!params.isStripeConfigured()) {
        return jsonError("Las suscripciones nuevas estan disponibles solo con Stripe en este entorno.", 503, "STRIPE_SUBSCRIPTIONS_REQUIRED");
    }
    return jsonError("Este plan todavia no tiene el Price ID de Stripe configurado para este intervalo.", 503, "STRIPE_PLAN_NOT_READY");
}
async function buildBillingCancelResponse(params) {
    var _a, _b;
    const userId = (_b = (_a = params.session) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
    if (!userId) {
        return jsonError("SESSION_REQUIRED", 401, "SESSION_REQUIRED");
    }
    const subscription = await params.findSubscription(userId);
    if (!subscription) {
        return jsonError("Sin suscripción activa", 404, "SUBSCRIPTION_NOT_FOUND");
    }
    if (FINAL_STATUSES.has(subscription.status)) {
        return {
            status: 200,
            body: {
                ok: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    canceledAt: subscription.canceledAt,
                },
            },
        };
    }
    if (subscription.provider === "stripe" && subscription.stripeSubscriptionId) {
        if (!params.isStripeConfigured()) {
            return jsonError("Stripe no está configurado para cancelar esta suscripción", 503, "STRIPE_NOT_CONFIGURED");
        }
        try {
            await params.cancelStripeSubscription(subscription.stripeSubscriptionId);
        }
        catch (_c) {
            return jsonError("No pudimos cancelar en Stripe. Intenta de nuevo o contacta soporte.", 502, "STRIPE_CANCEL_FAILED");
        }
    }
    else if (subscription.mpSubscriptionId) {
        if (!params.isMpConfigured()) {
            return jsonError("MercadoPago no está configurado para cancelar esta suscripción", 503, "MP_NOT_CONFIGURED");
        }
        try {
            await params.cancelMpSubscription(subscription.mpSubscriptionId);
        }
        catch (_d) {
            return jsonError("No pudimos cancelar en MercadoPago. Intenta de nuevo o contacta soporte.", 502, "MP_CANCEL_FAILED");
        }
    }
    const updated = await params.updateSubscription({
        where: { userId },
        data: { status: "cancelled", canceledAt: new Date() },
    });
    return {
        status: 200,
        body: {
            ok: true,
            subscription: {
                id: updated.id,
                status: updated.status,
                canceledAt: updated.canceledAt,
            },
        },
    };
}
