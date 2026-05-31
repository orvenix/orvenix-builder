export type StorageMode = "prisma" | "file";

export function isPlaceholderDatabaseUrl(url?: string) {
  if (!url) return true;
  return (
    url.includes("usuario:password@") ||
    url.includes("localhost:3306/orvenix_saas")
  );
}

export function getStorageMode(): StorageMode {
  const forced = process.env.ORVENIX_STORAGE_MODE?.trim().toLowerCase();

  if (forced === "prisma") return "prisma";
  if (forced === "file") return "file";

  return isPlaceholderDatabaseUrl(process.env.DATABASE_URL) ? "file" : "prisma";
}

export function isFileStorageMode() {
  return getStorageMode() === "file";
}

