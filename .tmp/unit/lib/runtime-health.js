"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeHealth = getRuntimeHealth;
const editor_db_1 = require("@/lib/editor-db");
const billing_config_1 = require("@/lib/billing-config");
const storage_mode_1 = require("@/lib/storage-mode");
const runtime_health_core_1 = require("@/lib/runtime-health-core");
async function getRuntimeHealth() {
    return (0, runtime_health_core_1.buildRuntimeHealth)({
        env: process.env,
        countUsers: () => editor_db_1.editorPrisma.user.count(),
        billing: (0, billing_config_1.getBillingConfigReport)(),
        storageMode: (0, storage_mode_1.getStorageMode)(),
        isFileStorage: (0, storage_mode_1.isFileStorageMode)(),
        isPlaceholderDatabaseUrl: storage_mode_1.isPlaceholderDatabaseUrl,
    });
}
