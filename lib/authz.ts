import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"

/**
 * SEC-1: the shared authorization layer for route handlers.
 *
 * - Ownership stays defined in ONE place: `canManageSite` (owner, or ADMIN by
 *   existing policy). This module only composes it with tenant-scoped
 *   lookups of nested resources.
 * - Fail closed: any missing/blank id or failed lookup is a failure.
 * - A nested resource that exists under ANOTHER site is indistinguishable
 *   from one that does not exist (`NOT_FOUND`), and no row data is returned.
 */

export type AuthzFailureCodeV1 = "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND"
export type AuthzFailureV1 = { ok: false; status: 401 | 403 | 404; code: AuthzFailureCodeV1 }
export type AuthzResultV1<T> = { ok: true; value: T } | AuthzFailureV1

export type SessionUserV1 = { id: string; role: UserRole; email: string | null; name: string | null }

const AUTH_REQUIRED: AuthzFailureV1 = { ok: false, status: 401, code: "AUTH_REQUIRED" }
const FORBIDDEN: AuthzFailureV1 = { ok: false, status: 403, code: "FORBIDDEN" }
const NOT_FOUND: AuthzFailureV1 = { ok: false, status: 404, code: "NOT_FOUND" }

function isId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 191
}

export async function requireSessionUser(): Promise<AuthzResultV1<SessionUserV1>> {
  const session = await getAuthSession()
  const user = session?.user
  if (!user || !isId(user.id)) return AUTH_REQUIRED
  return {
    ok: true,
    value: {
      id: user.id,
      role: user.role === "ADMIN" ? "ADMIN" : "CLIENT",
      email: user.email ?? null,
      name: user.name ?? null,
    },
  }
}

export async function requireManagedSite(user: Pick<SessionUserV1, "id" | "role">, siteId: unknown): Promise<AuthzResultV1<{ siteId: string }>> {
  if (!isId(siteId)) return FORBIDDEN
  const allowed = await canManageSite(siteId, user.id, user.role).catch(() => false)
  return allowed ? { ok: true, value: { siteId } } : FORBIDDEN
}

/** Proves `productId` belongs to `siteId`. Call only after `requireManagedSite`. */
export async function requireSiteProduct(siteId: string, productId: unknown): Promise<AuthzResultV1<{ productId: string; siteId: string }>> {
  if (!isId(siteId) || !isId(productId)) return NOT_FOUND
  const product = await editorPrisma.product.findFirst({ where: { id: productId, siteId }, select: { id: true } })
  return product ? { ok: true, value: { productId: product.id, siteId } } : NOT_FOUND
}

/** Proves `variantId` belongs to `productId`, which belongs to `siteId`. */
export async function requireSiteVariant(
  siteId: string,
  productId: unknown,
  variantId: unknown,
): Promise<AuthzResultV1<{ variantId: string; productId: string; siteId: string }>> {
  if (!isId(siteId) || !isId(productId) || !isId(variantId)) return NOT_FOUND
  const variant = await editorPrisma.productVariant.findFirst({
    where: { id: variantId, productId, product: { siteId } },
    select: { id: true },
  })
  return variant ? { ok: true, value: { variantId: variant.id, productId, siteId } } : NOT_FOUND
}

export function authzErrorResponse(failure: AuthzFailureV1) {
  return NextResponse.json({ error: failure.code }, { status: failure.status })
}
