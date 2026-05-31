import { randomUUID } from "crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/editor-prisma";
import { fileStoreApi } from "@/lib/file-store";
import { getStorageMode } from "@/lib/storage-mode";

const globalForEditorPrisma = globalThis as typeof globalThis & {
  editorPrisma?: PrismaClient;
};

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no esta configurada");
  return url;
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaMariaDb(getDatabaseUrl()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function createFileClient() {
  return {
    user: {
      findUnique: ({ where }: { where: { email?: string; id?: string } }) => fileStoreApi.findUser(where),
      create: ({ data }: { data: { id?: string; email: string; name?: string | null; password: string; role: string } }) =>
        fileStoreApi.createUser({
          id: data.id ?? randomUUID(),
          email: data.email,
          name: data.name ?? null,
          password: data.password,
          role: data.role,
        }),
      count: () => fileStoreApi.countUsers(),
      findMany: (args?: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc">; select?: Record<string, unknown> }) =>
        fileStoreApi.listUsers(args),
    },
    editorWebsite: {
      findMany: (args?: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc">; select?: Record<string, unknown> }) =>
        fileStoreApi.listSites(args),
      findFirst: (args: { where?: Record<string, unknown>; select?: Record<string, unknown> }) =>
        fileStoreApi.findSiteFirst(args),
      findUnique: ({ where, select }: { where: { id: string }; select?: Record<string, unknown> }) =>
        fileStoreApi.findSiteUnique(where, select),
      create: ({ data }: { data: { id: string; name: string; description?: string; tree: unknown; published?: boolean; userId?: string | null } }) =>
        fileStoreApi.createSite(data),
      update: ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        fileStoreApi.updateSite(where, data),
      updateMany: ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
        fileStoreApi.updateSites(where, data),
      deleteMany: ({ where }: { where: Record<string, unknown> }) =>
        fileStoreApi.deleteSites(where),
      upsert: ({
        where,
        update,
        create,
      }: {
        where: { id: string };
        update: Record<string, unknown>;
        create: { id: string; name: string; tree: unknown; description?: string; published?: boolean; userId?: string | null };
      }) => fileStoreApi.upsertSite(where, update, create),
      count: ({ where }: { where?: Record<string, unknown> } = {}) => fileStoreApi.countSites(where),
    },
    plan: {
      findMany: (args?: { where?: Record<string, unknown>; orderBy?: Record<string, "asc" | "desc">; select?: Record<string, unknown> }) =>
        fileStoreApi.listPlans(args),
      findUnique: ({ where, select }: { where: { id: string }; select?: Record<string, unknown> }) =>
        fileStoreApi.findPlanUnique(where, select),
      upsert: ({ where, update, create }: { where: { id: string }; update: Record<string, unknown>; create: Record<string, unknown> }) =>
        fileStoreApi.upsertPlan(where, update, create as never),
      update: ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        fileStoreApi.updatePlan(where, data),
    },
    subscription: {
      findUnique: ({
        where,
        select,
        include,
      }: {
        where: { userId?: string; stripeSubscriptionId?: string; mpSubscriptionId?: string };
        select?: Record<string, unknown>;
        include?: Record<string, unknown>;
      }) => fileStoreApi.findSubscriptionUnique({ where, select, include }),
      upsert: ({
        where,
        update,
        create,
      }: {
        where: { userId?: string; stripeSubscriptionId?: string; mpSubscriptionId?: string };
        update: Record<string, unknown>;
        create: Record<string, unknown>;
      }) => fileStoreApi.upsertSubscription(where, update as never, create as never),
      update: ({ where, data }: { where: { userId: string }; data: Record<string, unknown> }) =>
        fileStoreApi.updateSubscription(where, data as never),
      updateMany: ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
        fileStoreApi.updateSubscriptions(where, data as never),
    },
    webhookEvent: {
      create: ({ data }: { data: Record<string, unknown> }) => fileStoreApi.createWebhookEvent(data as never),
      update: ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) =>
        fileStoreApi.updateWebhookEvent(where, data as never),
      findMany: (args: {
        orderBy: { createdAt: "asc" | "desc" };
        take: number;
        select: Record<string, unknown>;
      }) => fileStoreApi.listWebhookEvents(args),
      count: ({ where }: { where?: Record<string, unknown> } = {}) => fileStoreApi.countWebhookEvents(where),
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
  } as unknown as PrismaClient;
}

export const editorPrisma: PrismaClient =
  globalForEditorPrisma.editorPrisma ??
  (getStorageMode() === "file" ? createFileClient() : createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForEditorPrisma.editorPrisma = editorPrisma;
}
