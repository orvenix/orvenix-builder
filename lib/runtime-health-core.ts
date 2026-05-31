import type { getBillingConfigReport } from "@/lib/billing-config";

export type HealthState = "operational" | "degraded" | "down";

export interface HealthService {
  name: string;
  status: HealthState;
  detail: string;
}

export interface HealthReport {
  checkedAt: string;
  status: HealthState;
  services: HealthService[];
  warnings: string[];
}

function validateNextAuthUrl(url?: string, env: NodeJS.ProcessEnv = process.env) {
  if (!url) return "NEXTAUTH_URL no esta configurada.";

  try {
    const parsed = new URL(url);
    const hasUnexpectedPath = parsed.pathname !== "/" && parsed.pathname !== "";
    const looksOutdatedLocalUrl =
      env.NODE_ENV === "development" &&
      (parsed.host !== "127.0.0.1:3000" && parsed.host !== "localhost:3000");

    if (hasUnexpectedPath) {
      return `NEXTAUTH_URL apunta a "${parsed.pathname}" pero la app actual no usa basePath.`;
    }

    if (looksOutdatedLocalUrl) {
      return `NEXTAUTH_URL apunta a ${parsed.host} y los scripts locales corren en 127.0.0.1:3000.`;
    }

    return null;
  } catch {
    return "NEXTAUTH_URL no es una URL valida.";
  }
}

function normalizeOrigin(url?: string) {
  if (!url) return null;

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function validatePublicUrlAlignment(env: NodeJS.ProcessEnv = process.env) {
  const configured = [
    ["AUTH_URL", normalizeOrigin(env.AUTH_URL)],
    ["NEXTAUTH_URL", normalizeOrigin(env.NEXTAUTH_URL)],
    ["NEXT_PUBLIC_API_URL", normalizeOrigin(env.NEXT_PUBLIC_API_URL)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  if (configured.length <= 1) return null;

  const uniqueOrigins = new Set(configured.map(([, origin]) => origin));
  if (uniqueOrigins.size <= 1) return null;

  return `${configured.map(([key, origin]) => `${key}=${origin}`).join(" · ")}. Deben apuntar al mismo origen publico.`;
}

function validateHttpsOrigins(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "production") return [];

  const configured = [
    ["AUTH_URL", env.AUTH_URL],
    ["NEXTAUTH_URL", env.NEXTAUTH_URL],
    ["NEXT_PUBLIC_API_URL", env.NEXT_PUBLIC_API_URL],
  ];

  return configured.flatMap(([key, value]) => {
    if (!value) return [];

    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" ? [] : [`${key} usa ${parsed.protocol} y en produccion debe usar https.`];
    } catch {
      return [`${key} no es una URL valida.`];
    }
  });
}

export type RuntimeHealthDeps = {
  env: NodeJS.ProcessEnv
  countUsers: () => Promise<number>
  billing: ReturnType<typeof getBillingConfigReport>
  storageMode: "prisma" | "file"
  isFileStorage: boolean
  isPlaceholderDatabaseUrl: (url?: string) => boolean
}

export async function buildRuntimeHealth(deps: RuntimeHealthDeps): Promise<HealthReport> {
  const services: HealthService[] = [];
  const warnings: string[] = [];

  services.push({
    name: "Frontend publico",
    status: "operational",
    detail: "El sitio compila y las rutas publicas principales responden correctamente.",
  });

  const databaseUrl = deps.env.DATABASE_URL;
  const authSecret = deps.env.NEXTAUTH_SECRET ?? deps.env.AUTH_SECRET;
  const anthropicKey = deps.env.ANTHROPIC_API_KEY;

  if (deps.isFileStorage) {
    try {
      await deps.countUsers();
      services.push({
        name: "Persistencia",
        status: "operational",
        detail: "Modo archivo activo. Usuarios, sitios y tickets se guardan en disco local.",
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "No se pudo conectar a la base de datos.";
      services.push({
        name: "Persistencia",
        status: "down",
        detail,
      });
    }
  } else if (!databaseUrl) {
    services.push({
      name: "Base de datos",
      status: "down",
      detail: "DATABASE_URL no esta configurada.",
    });
  } else if (deps.isPlaceholderDatabaseUrl(databaseUrl)) {
    services.push({
      name: "Base de datos",
      status: "down",
      detail: "DATABASE_URL sigue usando el valor de ejemplo y no una conexion real.",
    });
  }

  if (!authSecret) {
    services.push({
      name: "Auth y dashboard",
      status: "down",
      detail: "Falta AUTH_SECRET o NEXTAUTH_SECRET.",
    });
  } else if (services.some((service) => ["Base de datos", "Persistencia"].includes(service.name) && service.status !== "operational")) {
    services.push({
      name: "Auth y dashboard",
      status: "degraded",
      detail: "La autenticacion existe, pero depende de una persistencia saludable.",
    });
  } else {
    services.push({
      name: "Auth y dashboard",
      status: "operational",
      detail: "Configuracion base presente para sesiones y panel privado.",
    });
  }

  if (!anthropicKey) {
    services.push({
      name: "Asistente IA",
      status: "degraded",
      detail: "Sin ANTHROPIC_API_KEY. Se usara respuesta local de respaldo.",
    });
  } else {
    services.push({
      name: "Asistente IA",
      status: "operational",
      detail: "Clave configurada para respuestas con Anthropic.",
    });
  }

  const billing = deps.billing;
  if (billing.status === "ok") {
    services.push({
      name: "Billing",
      status: "operational",
      detail: "Stripe esta configurado para suscripciones y webhooks.",
    });
  } else if (billing.status === "warning") {
    services.push({
      name: "Billing",
      status: "degraded",
      detail: "Stripe no esta completo, pero MercadoPago esta disponible como respaldo.",
    });
  } else {
    services.push({
      name: "Billing",
      status: "down",
      detail: `Faltan ${billing.missing} requisito${billing.missing === 1 ? "" : "s"} de pagos. Revisa /admin/billing.`,
    });
  }

  const nextAuthWarning = validateNextAuthUrl(deps.env.NEXTAUTH_URL, deps.env);
  if (nextAuthWarning) warnings.push(nextAuthWarning);

  const publicUrlAlignmentWarning = validatePublicUrlAlignment(deps.env);
  if (publicUrlAlignmentWarning) warnings.push(publicUrlAlignmentWarning);

  warnings.push(...validateHttpsOrigins(deps.env));

  warnings.push(
    ...billing.checks
      .filter((item) => item.status === "warning")
      .map((item) => `${item.label}: ${item.detail}`)
  );

  if (deps.env.NEXT_PUBLIC_BASE_PATH) {
    warnings.push(
      `NEXT_PUBLIC_BASE_PATH esta configurado como "${deps.env.NEXT_PUBLIC_BASE_PATH}", pero next.config.ts no define basePath.`
    );
  }

  if (deps.storageMode === "file") {
    warnings.push("El modo archivo es ideal para desarrollo o despliegue Node con disco persistente. No es recomendable en hosting serverless efimero.");
  }

  const status: HealthState = services.some((service) => service.status === "down")
    ? "down"
    : services.some((service) => service.status === "degraded")
      ? "degraded"
      : "operational";

  return {
    checkedAt: new Date().toISOString(),
    status,
    services,
    warnings,
  };
}
