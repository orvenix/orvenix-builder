"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStripeConfigured = isStripeConfigured;
exports.getStripeWebhookSecret = getStripeWebhookSecret;
exports.getStripeAppUrl = getStripeAppUrl;
exports.getStripePriceId = getStripePriceId;
exports.createStripeCheckoutSession = createStripeCheckoutSession;
exports.cancelStripeSubscription = cancelStripeSubscription;
exports.createStripeBillingPortalSession = createStripeBillingPortalSession;
exports.verifyStripeWebhookSignature = verifyStripeWebhookSignature;
exports.mapStripeSubscriptionStatus = mapStripeSubscriptionStatus;
const crypto_1 = require("crypto");
const STRIPE_API_VERSION = "2026-04-22.dahlia";
const STRIPE_API_BASE = "https://api.stripe.com/v1";
function isStripeConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY);
}
function getStripeWebhookSecret() {
    var _a;
    return (_a = process.env.STRIPE_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : "";
}
function getStripeAppUrl() {
    var _a, _b, _c;
    return ((_c = (_b = (_a = process.env.AUTH_URL) !== null && _a !== void 0 ? _a : process.env.NEXTAUTH_URL) !== null && _b !== void 0 ? _b : process.env.NEXT_PUBLIC_API_URL) !== null && _c !== void 0 ? _c : "http://localhost:3000").replace(/\/$/, "");
}
function getStripePriceId(planId, interval, dbPriceId) {
    var _a;
    if (dbPriceId)
        return dbPriceId;
    const normalizedPlan = planId.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    const normalizedInterval = interval.toUpperCase();
    return (_a = process.env[`STRIPE_PRICE_${normalizedPlan}_${normalizedInterval}`]) !== null && _a !== void 0 ? _a : null;
}
function getStripeSecretKey() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY no esta configurada");
    }
    return secretKey;
}
async function stripeRequest(path, init = {}) {
    var _a;
    const res = await fetch(`${STRIPE_API_BASE}${path}`, Object.assign(Object.assign({}, init), { headers: Object.assign({ Authorization: `Bearer ${getStripeSecretKey()}`, "Stripe-Version": STRIPE_API_VERSION }, init.headers) }));
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = typeof ((_a = payload === null || payload === void 0 ? void 0 : payload.error) === null || _a === void 0 ? void 0 : _a.message) === "string"
            ? payload.error.message
            : `Stripe request failed: ${res.status}`;
        throw new Error(message);
    }
    return payload;
}
async function createStripeCheckoutSession(params) {
    const appUrl = getStripeAppUrl();
    const body = new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": params.priceId,
        "line_items[0][quantity]": "1",
        customer_email: params.userEmail,
        client_reference_id: params.userId,
        success_url: `${appUrl}/dashboard?sub=ok&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/precios?cancelled=1&provider=stripe`,
        "metadata[userId]": params.userId,
        "metadata[planId]": params.planId,
        "metadata[interval]": params.interval,
        "subscription_data[metadata][userId]": params.userId,
        "subscription_data[metadata][planId]": params.planId,
        "subscription_data[metadata][interval]": params.interval,
    });
    const session = await stripeRequest("/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    if (!session.url) {
        throw new Error("Stripe no devolvio URL de Checkout");
    }
    return { checkoutUrl: session.url, sessionId: session.id };
}
async function cancelStripeSubscription(stripeSubscriptionId) {
    const body = new URLSearchParams({ cancel_at_period_end: "true" });
    await stripeRequest(`/subscriptions/${stripeSubscriptionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
}
async function createStripeBillingPortalSession(params) {
    var _a;
    const appUrl = getStripeAppUrl();
    const body = new URLSearchParams({
        customer: params.customerId,
        return_url: `${appUrl}${(_a = params.returnPath) !== null && _a !== void 0 ? _a : "/dashboard"}`,
    });
    const session = await stripeRequest("/billing_portal/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    return session;
}
function verifyStripeWebhookSignature(rawBody, signatureHeader, secret) {
    const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
        const [key, value] = part.split("=");
        return [key, value];
    }));
    const timestamp = parts.t;
    const expected = parts.v1;
    if (!timestamp || !expected)
        return false;
    const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000);
    if (!Number.isFinite(ageMs) || ageMs > 5 * 60 * 1000)
        return false;
    const digest = (0, crypto_1.createHmac)("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const digestBuffer = Buffer.from(digest, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return digestBuffer.length === expectedBuffer.length && (0, crypto_1.timingSafeEqual)(digestBuffer, expectedBuffer);
}
function mapStripeSubscriptionStatus(status) {
    if (status === "trialing")
        return "active";
    if (status === "canceled")
        return "cancelled";
    return status;
}
