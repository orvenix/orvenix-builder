"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.editorPrisma = void 0;
const crypto_1 = require("crypto");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const editor_prisma_1 = require("@/generated/editor-prisma");
const file_store_1 = require("@/lib/file-store");
const storage_mode_1 = require("@/lib/storage-mode");
const globalForEditorPrisma = globalThis;
function getDatabaseUrl() {
    const url = process.env.DATABASE_URL;
    if (!url)
        throw new Error("DATABASE_URL no esta configurada");
    return url;
}
function createPrismaClient() {
    return new editor_prisma_1.PrismaClient({
        adapter: new adapter_mariadb_1.PrismaMariaDb(getDatabaseUrl()),
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}
function createFileClient() {
    return {
        user: {
            findUnique: ({ where }) => file_store_1.fileStoreApi.findUser(where),
            create: ({ data }) => {
                var _a, _b;
                return file_store_1.fileStoreApi.createUser({
                    id: (_a = data.id) !== null && _a !== void 0 ? _a : (0, crypto_1.randomUUID)(),
                    email: data.email,
                    name: (_b = data.name) !== null && _b !== void 0 ? _b : null,
                    password: data.password,
                    role: data.role,
                });
            },
            count: () => file_store_1.fileStoreApi.countUsers(),
            findMany: (args) => file_store_1.fileStoreApi.listUsers(args),
        },
        editorWebsite: {
            findMany: (args) => file_store_1.fileStoreApi.listSites(args),
            findFirst: (args) => file_store_1.fileStoreApi.findSiteFirst(args),
            findUnique: ({ where, select }) => file_store_1.fileStoreApi.findSiteUnique(where, select),
            create: ({ data }) => file_store_1.fileStoreApi.createSite(data),
            update: ({ where, data }) => file_store_1.fileStoreApi.updateSite(where, data),
            updateMany: ({ where, data }) => file_store_1.fileStoreApi.updateSites(where, data),
            deleteMany: ({ where }) => file_store_1.fileStoreApi.deleteSites(where),
            upsert: ({ where, update, create, }) => file_store_1.fileStoreApi.upsertSite(where, update, create),
            count: ({ where } = {}) => file_store_1.fileStoreApi.countSites(where),
        },
        plan: {
            findMany: (args) => file_store_1.fileStoreApi.listPlans(args),
            findUnique: ({ where, select }) => file_store_1.fileStoreApi.findPlanUnique(where, select),
            upsert: ({ where, update, create }) => file_store_1.fileStoreApi.upsertPlan(where, update, create),
            update: ({ where, data }) => file_store_1.fileStoreApi.updatePlan(where, data),
        },
        subscription: {
            findUnique: ({ where, select, include, }) => file_store_1.fileStoreApi.findSubscriptionUnique({ where, select, include }),
            upsert: ({ where, update, create, }) => file_store_1.fileStoreApi.upsertSubscription(where, update, create),
            update: ({ where, data }) => file_store_1.fileStoreApi.updateSubscription(where, data),
            updateMany: ({ where, data }) => file_store_1.fileStoreApi.updateSubscriptions(where, data),
        },
        webhookEvent: {
            create: ({ data }) => file_store_1.fileStoreApi.createWebhookEvent(data),
            update: ({ where, data }) => file_store_1.fileStoreApi.updateWebhookEvent(where, data),
            findMany: (args) => file_store_1.fileStoreApi.listWebhookEvents(args),
            count: ({ where } = {}) => file_store_1.fileStoreApi.countWebhookEvents(where),
        },
        $executeRaw: async () => {
            throw new Error("Operacion SQL no disponible en modo archivo.");
        },
        $executeRawUnsafe: async () => {
            throw new Error("Operacion SQL no disponible en modo archivo.");
        },
        $queryRaw: async () => {
            throw new Error("Operacion SQL no disponible en modo archivo.");
        },
    };
}
exports.editorPrisma = (_a = globalForEditorPrisma.editorPrisma) !== null && _a !== void 0 ? _a : ((0, storage_mode_1.getStorageMode)() === "file" ? createFileClient() : createPrismaClient());
if (process.env.NODE_ENV !== "production") {
    globalForEditorPrisma.editorPrisma = exports.editorPrisma;
}
