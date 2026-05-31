import { config as loadEnv } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/editor-prisma/index.js";

loadEnv({ path: ".env.local" });
loadEnv();

export function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL no esta configurada.");
  }
  return databaseUrl;
}

export function createPrisma() {
  return new PrismaClient({
    adapter: new PrismaMariaDb(requireDatabaseUrl()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}
