"use server"

import { revalidatePath } from "next/cache"

import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { sendSiteModerationWarningEmail } from "@/lib/email"
import {
  getSiteModerationStatus,
  isModerationAction,
  isValidSiteId,
  MODERATION_MODULE,
  sanitizeModerationReason,
  stateAfterModerationAction,
  validateModerationTransition,
  type ModerationAction,
  type SiteModerationState,
} from "@/lib/moderation/site-moderation"

export type ModerateSiteResult =
  | { success: true; action: ModerationAction; state: SiteModerationState; email?: ModerationEmailOutcome }
  | { success: false; message: string }

type ModerationEmailOutcome = "sent" | "skipped" | "failed" | "no-recipient"

/**
 * ADMIN MODERATION MINIMUM: WARNING | SUSPEND | REACTIVATE | TERMINATE.
 *
 * Authorization is server-side only: the role is read from the database for
 * the session user; nothing the client sends (role, owner, state) is trusted.
 * The AuditLog INSERT *is* the moderation change: if it cannot be written the
 * action fails and nothing is applied. Nothing here deletes data or changes
 * `published`.
 */
export async function moderateSiteAction(input: unknown): Promise<ModerateSiteResult> {
  const session = await getAuthSession()
  const sessionUserId = session?.user?.id
  if (!sessionUserId) return { success: false, message: "Inicia sesión como administrador." }

  const admin = await editorPrisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true, role: true } })
  if (admin?.role !== "ADMIN") return { success: false, message: "No tienes permiso para moderar sitios." }

  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const { siteId, action, confirmSiteId } = body
  if (!isModerationAction(action)) return { success: false, message: "Acción de moderación no válida." }
  if (!isValidSiteId(siteId)) return { success: false, message: "Identificador de sitio no válido." }
  const reason = sanitizeModerationReason(body.reason)
  if ("error" in reason) return { success: false, message: reason.error }
  if (action === "TERMINATE" && confirmSiteId !== siteId) {
    return { success: false, message: "Para terminar el sitio escribe exactamente su identificador." }
  }

  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { id: true, name: true, userId: true, published: true, user: { select: { email: true, name: true } } },
  })
  if (!site) return { success: false, message: "El sitio no existe." }

  const current = await getSiteModerationStatus(siteId)
  const transition = validateModerationTransition(current.state, action)
  if ("error" in transition) return { success: false, message: transition.error }
  const nextState = stateAfterModerationAction(action) ?? current.state

  const metadata = {
    ownerId: site.userId ?? null,
    previousState: current.state,
    nextState,
    published: site.published,
    ...(action === "WARNING" ? { email: "pending" } : {}),
  }

  let rowId: string
  try {
    const row = await editorPrisma.auditLog.create({
      data: {
        level: action === "WARNING" ? "warning" : "security",
        module: MODERATION_MODULE,
        action,
        userId: admin.id,
        siteId,
        entityType: "site",
        entityId: siteId,
        message: reason.reason,
        metadata,
      },
      select: { id: true },
    })
    rowId = row.id
  } catch (error) {
    console.error("[moderation] audit insert failed", error)
    return { success: false, message: "No se pudo registrar la acción; no se aplicó ningún cambio." }
  }

  let email: ModerationEmailOutcome | undefined
  if (action === "WARNING") {
    email = await notifyOwner(site, reason.reason)
    try {
      await editorPrisma.auditLog.update({ where: { id: rowId }, data: { metadata: { ...metadata, email } } })
    } catch (error) {
      // The warning itself is recorded; only the delivery note could not be added.
      console.error("[moderation] could not record the warning email outcome", error)
    }
  }

  for (const path of ["/admin/sitios", "/admin/logs", "/dashboard", `/p/${siteId}`, `/editor/${siteId}`]) revalidatePath(path)
  return { success: true, action, state: nextState, ...(email ? { email } : {}) }
}

async function notifyOwner(
  site: { name: string; user: { email: string; name: string | null } | null },
  reason: string,
): Promise<ModerationEmailOutcome> {
  const to = site.user?.email
  if (!to) return "no-recipient"
  try {
    const result = await sendSiteModerationWarningEmail({ to, ownerName: site.user?.name ?? "", siteName: site.name, reason })
    if (!result.ok) return "failed"
    return "skipped" in result && result.skipped ? "skipped" : "sent"
  } catch {
    return "failed"
  }
}
