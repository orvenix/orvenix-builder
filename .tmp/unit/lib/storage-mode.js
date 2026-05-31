"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaceholderDatabaseUrl = isPlaceholderDatabaseUrl;
exports.getStorageMode = getStorageMode;
exports.isFileStorageMode = isFileStorageMode;
function isPlaceholderDatabaseUrl(url) {
    if (!url)
        return true;
    return (url.includes("usuario:password@") ||
        url.includes("localhost:3306/orvenix_saas"));
}
function getStorageMode() {
    var _a;
    const forced = (_a = process.env.ORVENIX_STORAGE_MODE) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (forced === "prisma")
        return "prisma";
    if (forced === "file")
        return "file";
    return isPlaceholderDatabaseUrl(process.env.DATABASE_URL) ? "file" : "prisma";
}
function isFileStorageMode() {
    return getStorageMode() === "file";
}
