import { editorPrisma } from "@/lib/editor-db";
import { getBillingConfigReport } from "@/lib/billing-config";
import { getStorageMode, isFileStorageMode, isPlaceholderDatabaseUrl } from "@/lib/storage-mode";
import { buildRuntimeHealth, type HealthReport, type HealthState } from "@/lib/runtime-health-core";

export type { HealthState };

export async function getRuntimeHealth(): Promise<HealthReport> {
  return buildRuntimeHealth({
    env: process.env,
    countUsers: () => editorPrisma.user.count(),
    billing: getBillingConfigReport(),
    storageMode: getStorageMode(),
    isFileStorage: isFileStorageMode(),
    isPlaceholderDatabaseUrl,
  })
}
