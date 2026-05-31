"use client";

type LogLevel = "debug" | "warn" | "error";

function getConsole() {
  if (typeof window !== "undefined") return window.console;
  return globalThis["console"];
}

function write(level: LogLevel, message: string, ...details: unknown[]) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const consoleRef = getConsole();
  if (!consoleRef) return;

  const payload = details.length > 0 ? [message, ...details] : [message];

  if (level === "debug") {
    consoleRef.info(...payload);
    return;
  }

  if (level === "warn") {
    consoleRef.warn(...payload);
    return;
  }

  consoleRef.error(...payload);
}

export function editorDebug(message: string, ...details: unknown[]) {
  write("debug", message, ...details);
}

export function editorWarn(message: string, ...details: unknown[]) {
  write("warn", message, ...details);
}

export function editorError(message: string, ...details: unknown[]) {
  write("error", message, ...details);
}
