"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverDebug = serverDebug;
exports.serverWarn = serverWarn;
exports.serverError = serverError;
function write(level, message, ...details) {
    if (level === "debug" && process.env.NODE_ENV === "production")
        return;
    const payload = details.length > 0 ? [message, ...details] : [message];
    if (level === "debug") {
        console.info(...payload);
        return;
    }
    if (level === "warn") {
        console.warn(...payload);
        return;
    }
    console.error(...payload);
}
function serverDebug(message, ...details) {
    write("debug", message, ...details);
}
function serverWarn(message, ...details) {
    write("warn", message, ...details);
}
function serverError(message, ...details) {
    write("error", message, ...details);
}
