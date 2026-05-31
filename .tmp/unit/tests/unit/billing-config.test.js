"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const billing_config_1 = require("../../lib/billing-config");
const allStripePrices = {
    STRIPE_PRICE_STARTER_MONTH: "price_starter_month",
    STRIPE_PRICE_STARTER_YEAR: "price_starter_year",
    STRIPE_PRICE_PRO_MONTH: "price_pro_month",
    STRIPE_PRICE_PRO_YEAR: "price_pro_year",
    STRIPE_PRICE_COMMERCE_MONTH: "price_commerce_month",
    STRIPE_PRICE_COMMERCE_YEAR: "price_commerce_year",
};
(0, node_test_1.default)("billing config is ok when Stripe core and all prices exist", () => {
    const report = (0, billing_config_1.getBillingConfigReport)(Object.assign({ STRIPE_SECRET_KEY: "sk_test_value", STRIPE_WEBHOOK_SECRET: "whsec_value", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_value", AUTH_URL: "https://example.com" }, allStripePrices));
    strict_1.default.equal(report.status, "ok");
    strict_1.default.equal(report.stripeReady, true);
});
(0, node_test_1.default)("billing config is degraded when Stripe is incomplete but MercadoPago exists", () => {
    const report = (0, billing_config_1.getBillingConfigReport)({
        MP_ACCESS_TOKEN: "APP_USR-value",
        AUTH_URL: "https://example.com",
    });
    strict_1.default.equal(report.status, "warning");
    strict_1.default.equal(report.stripeReady, false);
    strict_1.default.equal(report.mercadoPagoReady, true);
});
(0, node_test_1.default)("billing config treats placeholders as missing", () => {
    var _a;
    const report = (0, billing_config_1.getBillingConfigReport)(Object.assign({ STRIPE_SECRET_KEY: "sk_test_placeholder", STRIPE_WEBHOOK_SECRET: "whsec_placeholder", AUTH_URL: "https://example.com" }, allStripePrices));
    strict_1.default.equal(report.status, "missing");
    strict_1.default.equal((_a = report.checks.find((item) => item.key === "stripe_secret")) === null || _a === void 0 ? void 0 : _a.status, "missing");
});
