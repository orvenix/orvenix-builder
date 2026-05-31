import { pbkdf2Sync, randomBytes } from "crypto";
import { editorPrisma } from "@/lib/editor-db";
import { getDefaultStarterEditorTree } from "@/lib/editorWebs";
import type { Prisma } from "@/generated/editor-prisma";
import type { EditorTree } from "@/types/editor";

export type UserRole = "ADMIN" | "CLIENT";

// ─── Password helpers ────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return hash === verify;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export function normalizeRole(role?: string | null): UserRole {
  return role === "ADMIN" ? "ADMIN" : "CLIENT";
}

function configuredAdminEmails() {
  return (process.env.ORVENIX_ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(email: string, storedRole?: string | null): UserRole {
  if (configuredAdminEmails().includes(email.toLowerCase())) return "ADMIN";
  return normalizeRole(storedRole);
}

export async function getUserByEmail(email: string) {
  return editorPrisma.user.findUnique({ where: { email } });
}

export async function createUser(email: string, name: string, password: string, role?: UserRole) {
  const normalizedEmail = email.trim().toLowerCase();
  return editorPrisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      password: hashPassword(password),
      role: role ?? roleForEmail(normalizedEmail),
    },
  });
}

// ─── Site helpers ─────────────────────────────────────────────────────────────

export async function getSitesByUser(userId: string) {
  return editorPrisma.editorWebsite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, published: true, updatedAt: true, userId: true },
  });
}

export async function getAllSitesForAdmin() {
  return editorPrisma.editorWebsite.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      published: true,
      updatedAt: true,
      userId: true,
      user: { select: { email: true, name: true } },
    },
  });
}

export async function getSitesForRole(userId: string, role: UserRole) {
  return role === "ADMIN" ? getAllSitesForAdmin() : getSitesByUser(userId);
}

export async function createSite(name: string, description: string, userId: string) {
  const id = `site_${randomBytes(6).toString("hex")}`;
  const starterTree = getDefaultStarterEditorTree();

  return editorPrisma.editorWebsite.create({
    data: { id, name, description, tree: toPrismaJson(starterTree), userId },
  });
}

function toPrismaJson(tree: EditorTree): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(tree)) as Prisma.InputJsonValue;
}

export async function createSiteFromTree({
  name,
  description,
  userId,
  tree,
}: {
  name: string;
  description: string;
  userId: string;
  tree: EditorTree;
}) {
  const id = `site_${randomBytes(6).toString("hex")}`;

  return editorPrisma.editorWebsite.create({
    data: {
      id,
      name,
      description,
      tree: toPrismaJson(tree),
      userId,
    },
  });
}

export async function deleteSite(id: string, userId: string) {
  return editorPrisma.editorWebsite.deleteMany({ where: { id, userId } });
}

export async function deleteSiteForRole(id: string, userId: string, role: UserRole) {
  if (role === "ADMIN") {
    return editorPrisma.editorWebsite.deleteMany({ where: { id } });
  }
  return deleteSite(id, userId);
}

export async function publishSite(id: string, userId: string) {
  return editorPrisma.editorWebsite.updateMany({
    where: { id, userId },
    data: { published: true },
  });
}

export async function unpublishSite(id: string, userId: string) {
  return editorPrisma.editorWebsite.updateMany({
    where: { id, userId },
    data: { published: false },
  });
}

export async function getPublishedSite(id: string) {
  return editorPrisma.editorWebsite.findFirst({
    where: { id, published: true },
    select: { id: true, name: true, description: true, tree: true },
  });
}

export async function getSiteForRole(id: string, userId: string, role: UserRole) {
  if (role === "ADMIN") {
    return editorPrisma.editorWebsite.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        published: true,
        updatedAt: true,
        userId: true,
      },
    });
  }

  return editorPrisma.editorWebsite.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      description: true,
      published: true,
      updatedAt: true,
      userId: true,
    },
  });
}

export async function siteOwnedBy(id: string, userId: string): Promise<boolean> {
  const site = await editorPrisma.editorWebsite.findFirst({ where: { id, userId } });
  return !!site;
}

export async function canManageSite(id: string, userId: string, role: UserRole): Promise<boolean> {
  if (role === "ADMIN") return true;
  return siteOwnedBy(id, userId);
}
