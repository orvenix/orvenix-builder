type LogLevel = "debug" | "warn" | "error";

function write(level: LogLevel, message: string, ...details: unknown[]) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

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

export function serverDebug(message: string, ...details: unknown[]) {
  write("debug", message, ...details);
}

export function serverWarn(message: string, ...details: unknown[]) {
  write("warn", message, ...details);
}

export function serverError(message: string, ...details: unknown[]) {
  write("error", message, ...details);
}
