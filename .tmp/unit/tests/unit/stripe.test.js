"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const stripe_1 = require("../../lib/stripe");
const subscription_status_1 = require("../../lib/subscription-status");
(0, node_test_1.default)("getStripePriceId prefers database value over environment", () => {
    process.env.STRIPE_PRICE_PRO_MONTH = "price_env";
    strict_1.default.equal((0, stripe_1.getStripePriceId)("pro", "month", "price_db"), "price_db");
});
(0, node_test_1.default)("getStripePriceId maps plan and interval to env name", () => {
    process.env.STRIPE_PRICE_COMMERCE_YEAR = "price_commerce_year";
    strict_1.default.equal((0, stripe_1.getStripePriceId)("commerce", "year"), "price_commerce_year");
});
(0, node_test_1.default)("mapStripeSubscriptionStatus normalizes Stripe status names", () => {
    strict_1.default.equal((0, stripe_1.mapStripeSubscriptionStatus)("trialing"), "active");
    strict_1.default.equal((0, stripe_1.mapStripeSubscriptionStatus)("canceled"), "cancelled");
    strict_1.default.equal((0, stripe_1.mapStripeSubscriptionStatus)("past_due"), "past_due");
});
(0, node_test_1.default)("verifyStripeWebhookSignature accepts valid signed payload", () => {
    const secret = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const rawBody = JSON.stringify({ id: "evt_test" });
    const signature = (0, node_crypto_1.createHmac)("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    strict_1.default.equal((0, stripe_1.verifyStripeWebhookSignature)(rawBody, `t=${timestamp},v1=${signature}`, secret), true);
});
(0, node_test_1.default)("verifyStripeWebhookSignature rejects invalid signature", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    strict_1.default.equal((0, stripe_1.verifyStripeWebhookSignature)("{}", `t=${timestamp},v1=${"0".repeat(64)}`, "whsec_test"), false);
});
(0, node_test_1.default)("mapMercadoPagoSubscriptionStatus normalizes MercadoPago statuses", () => {
    strict_1.default.equal((0, subscription_status_1.mapMercadoPagoSubscriptionStatus)("authorized"), "active");
    strict_1.default.equal((0, subscription_status_1.mapMercadoPagoSubscriptionStatus)("paused"), "paused");
    strict_1.default.equal((0, subscription_status_1.mapMercadoPagoSubscriptionStatus)("unknown_status"), "pending");
    strict_1.default.equal((0, subscription_status_1.mapMercadoPagoSubscriptionStatus)(null), "pending");
});
(0, node_test_1.default)("dateFromUnixSeconds converts Stripe timestamps safely", () => {
    var _a;
    strict_1.default.equal((0, subscription_status_1.dateFromUnixSeconds)(null), null);
    strict_1.default.equal((_a = (0, subscription_status_1.dateFromUnixSeconds)(1)) === null || _a === void 0 ? void 0 : _a.toISOString(), "1970-01-01T00:00:01.000Z");
});
