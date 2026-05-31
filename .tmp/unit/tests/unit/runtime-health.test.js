"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const runtime_health_core_1 = require("../../lib/runtime-health-core");
const billing_config_1 = require("../../lib/billing-config");
const storage_mode_1 = require("../../lib/storage-mode");
const stripeReadyEnv = {
    NEXTAUTH_SECRET: "secret",
    NEXTAUTH_URL: "https://example.com",
    AUTH_URL: "https://example.com",
    ANTHROPIC_API_KEY: "sk-ant-live",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_value",
    STRIPE_SECRET_KEY: "sk_live_value",
    STRIPE_WEBHOOK_SECRET: "whsec_live_value",
    STRIPE_PRICE_STARTER_MONTH: "price_1",
    STRIPE_PRICE_STARTER_YEAR: "price_2",
    STRIPE_PRICE_PRO_MONTH: "price_3",
    STRIPE_PRICE_PRO_YEAR: "price_4",
    STRIPE_PRICE_COMMERCE_MONTH: "price_5",
    STRIPE_PRICE_COMMERCE_YEAR: "price_6",
};
(0, node_test_1.default)("buildRuntimeHealth reports an operational app in healthy file mode", async () => {
    var _a, _b, _c;
    const report = await (0, runtime_health_core_1.buildRuntimeHealth)({
        env: Object.assign(Object.assign({}, stripeReadyEnv), { ORVENIX_STORAGE_MODE: "file" }),
        countUsers: async () => 4,
        billing: (0, billing_config_1.getBillingConfigReport)(stripeReadyEnv),
        storageMode: "file",
        isFileStorage: true,
        isPlaceholderDatabaseUrl: storage_mode_1.isPlaceholderDatabaseUrl,
    });
    strict_1.default.equal(report.status, "operational");
    strict_1.default.equal((_a = report.services.find((service) => service.name === "Persistencia")) === null || _a === void 0 ? void 0 : _a.status, "operational");
    strict_1.default.equal((_b = report.services.find((service) => service.name === "Billing")) === null || _b === void 0 ? void 0 : _b.status, "operational");
    strict_1.default.match((_c = report.warnings[0]) !== null && _c !== void 0 ? _c : "", /modo archivo/i);
});
(0, node_test_1.default)("buildRuntimeHealth degrades billing when MercadoPago is the only ready gateway", async () => {
    var _a, _b, _c;
    const env = {
        NEXTAUTH_SECRET: "secret",
        NEXTAUTH_URL: "https://example.com",
        AUTH_URL: "https://example.com",
        MP_ACCESS_TOKEN: "APP_USR-real-token-value",
        ORVENIX_STORAGE_MODE: "file",
    };
    const report = await (0, runtime_health_core_1.buildRuntimeHealth)({
        env,
        countUsers: async () => 1,
        billing: (0, billing_config_1.getBillingConfigReport)(env),
        storageMode: "file",
        isFileStorage: true,
        isPlaceholderDatabaseUrl: storage_mode_1.isPlaceholderDatabaseUrl,
    });
    strict_1.default.equal(report.status, "degraded");
    strict_1.default.equal((_a = report.services.find((service) => service.name === "Billing")) === null || _a === void 0 ? void 0 : _a.status, "degraded");
    strict_1.default.match((_c = (_b = report.services.find((service) => service.name === "Billing")) === null || _b === void 0 ? void 0 : _b.detail) !== null && _c !== void 0 ? _c : "", /MercadoPago esta disponible como respaldo/i);
});
(0, node_test_1.default)("buildRuntimeHealth marks persistence and auth as down when file storage count fails and auth is missing", async () => {
    var _a, _b;
    const report = await (0, runtime_health_core_1.buildRuntimeHealth)({
        env: {
            ORVENIX_STORAGE_MODE: "file",
            NEXTAUTH_URL: "https://example.com/base",
        },
        countUsers: async () => {
            throw new Error("disk unavailable");
        },
        billing: (0, billing_config_1.getBillingConfigReport)({}),
        storageMode: "file",
        isFileStorage: true,
        isPlaceholderDatabaseUrl: storage_mode_1.isPlaceholderDatabaseUrl,
    });
    strict_1.default.equal(report.status, "down");
    strict_1.default.equal((_a = report.services.find((service) => service.name === "Persistencia")) === null || _a === void 0 ? void 0 : _a.status, "down");
    strict_1.default.equal((_b = report.services.find((service) => service.name === "Auth y dashboard")) === null || _b === void 0 ? void 0 : _b.status, "down");
    strict_1.default.match(report.warnings.join(" "), /no usa basePath/i);
});
(0, node_test_1.default)("buildRuntimeHealth warns when public URLs are misaligned or non-https in production", async () => {
    const env = Object.assign(Object.assign({}, stripeReadyEnv), { NODE_ENV: "production", NEXTAUTH_URL: "http://orvenix.com.mx", AUTH_URL: "https://orvenix.com.mx", NEXT_PUBLIC_API_URL: "https://api.orvenix.com.mx", ORVENIX_STORAGE_MODE: "file" });
    const report = await (0, runtime_health_core_1.buildRuntimeHealth)({
        env,
        countUsers: async () => 2,
        billing: (0, billing_config_1.getBillingConfigReport)(env),
        storageMode: "file",
        isFileStorage: true,
        isPlaceholderDatabaseUrl: storage_mode_1.isPlaceholderDatabaseUrl,
    });
    strict_1.default.match(report.warnings.join(" "), /deben apuntar al mismo origen publico/i);
    strict_1.default.match(report.warnings.join(" "), /NEXTAUTH_URL usa http:/i);
});
