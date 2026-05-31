"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const production_readiness_1 = require("../../lib/production-readiness");
const stripeReadyEnv = {
    AUTH_SECRET: "secret",
    NEXTAUTH_SECRET: "secret",
    AUTH_URL: "https://orvenix.com.mx",
    NEXTAUTH_URL: "https://orvenix.com.mx",
    NEXT_PUBLIC_API_URL: "https://orvenix.com.mx",
    ORVENIX_STORAGE_MODE: "prisma",
    DATABASE_URL: "mysql://user:password@db.example.com:3306/orvenix",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_value",
    STRIPE_SECRET_KEY: "sk_live_value",
    STRIPE_WEBHOOK_SECRET: "whsec_live_value",
    STRIPE_PRICE_STARTER_MONTH: "price_1",
    STRIPE_PRICE_STARTER_YEAR: "price_2",
    STRIPE_PRICE_PRO_MONTH: "price_3",
    STRIPE_PRICE_PRO_YEAR: "price_4",
    STRIPE_PRICE_COMMERCE_MONTH: "price_5",
    STRIPE_PRICE_COMMERCE_YEAR: "price_6",
    RESEND_API_KEY: "re_live_value",
    RESEND_FROM: "Orvenix <hola@orvenix.com.mx>",
};
(0, node_test_1.default)("production readiness is ready when automatic checks are aligned", () => {
    const report = (0, production_readiness_1.getProductionReadinessReport)(stripeReadyEnv);
    strict_1.default.equal(report.summary, "ready");
    strict_1.default.equal(report.automaticChecks.every((check) => check.status === "ready"), true);
    strict_1.default.equal(report.manualChecks.every((check) => check.status === "manual"), true);
});
(0, node_test_1.default)("production readiness flags mixed public URLs and file mode", () => {
    var _a, _b;
    const report = (0, production_readiness_1.getProductionReadinessReport)({
        AUTH_SECRET: "secret",
        NEXTAUTH_URL: "http://orvenix.com.mx",
        AUTH_URL: "https://orvenix.com.mx",
        NEXT_PUBLIC_API_URL: "https://api.orvenix.com.mx",
        ORVENIX_STORAGE_MODE: "file",
        MP_ACCESS_TOKEN: "APP_USR-real-token-value",
    });
    strict_1.default.equal(report.summary, "attention");
    strict_1.default.equal((_a = report.automaticChecks.find((check) => check.key === "public_urls")) === null || _a === void 0 ? void 0 : _a.status, "attention");
    strict_1.default.equal((_b = report.automaticChecks.find((check) => check.key === "storage_mode")) === null || _b === void 0 ? void 0 : _b.status, "attention");
});
