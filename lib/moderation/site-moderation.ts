import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"

/**
 * ADMIN MODERATION MINIMUM: the moderation state of a site is not a column.
 * It is the latest SUSPEND | REACTIVATE | TERMINATE row of AuditLog with
 * module = "moderation" (WARNING never changes it). The audit trail is the
 * state, so the two can never disagree. These rows are permanent: no cleanup
 * may purge module = "moderation".
 *
 * Suspension never touches `published`: reactivating returns the site to
 * whatever its own publication state is.
 */

export const MODERATION_MODULE = "moderation"

export const MODERATION_ACTIONS = ["WARNING", "SUSPEND", "REACTIVATE", "TERMINATE"] as const
export type ModerationAction = (typeof MODERATION_ACTIONS)[number]

export const STATE_CHANGING_MODERATION_ACTIONS = ["SUSPEND", "REACTIVATE", "TERMINATE"] as const

export type SiteModerationState = "active" | "suspended" | "terminated"

export const MODERATION_REASON_MIN_LENGTH = 5
export const MODERATION_REASON_MAX_LENGTH = 500

export interface SiteModerationStatus {
  state: SiteModerationState
  /** The reason of the event that set the current state (plain text). */
  reason: string | null
  at: Date | null
}

export const ACTIVE_MODERATION_STATUS: SiteModerationStatus = { state: "active", reason: null, at: null }

export const MODERATION_STATE_LABEL: Record<SiteModerationState, string> = {
  active: "Activo",
  suspended: "Suspendido",
  terminated: "Terminado",
}

export function isModerationAction(value: unknown): value is ModerationAction {
  return typeof value === "string" && (MODERATION_ACTIONS as readonly string[]).includes(value)
}

/** The state an action leaves the site in; WARNING leaves it unchanged (null). */
export function stateAfterModerationAction(action: ModerationAction): SiteModerationState | null {
  if (action === "SUSPEND") return "suspended"
  if (action === "TERMINATE") return "terminated"
  if (action === "REACTIVATE") return "active"
  return null
}

/** Suspended and terminated sites are never served to the public. */
export function isPubliclyBlocked(state: SiteModerationState): boolean {
  return state !== "active"
}

/** Site ids are short opaque tokens (`site_<hex>`); anything else is rejected before any query. */
export function isValidSiteId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value)
}

/**
 * A moderation reason is plain text: tags and angle brackets are removed,
 * control characters and runs of whitespace collapse to one space, and the
 * length is bounded. Output is still always escaped where it is rendered.
 */
export function sanitizeModerationReason(raw: unknown): { ok: true; reason: string } | { ok: false; error: string } {
  const text = (typeof raw === "string" ? raw : "")
    .normalize("NFC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length < MODERATION_REASON_MIN_LENGTH) {
    return { ok: false, error: `Escribe el motivo (mínimo ${MODERATION_REASON_MIN_LENGTH} caracteres).` }
  }
  if (text.length > MODERATION_REASON_MAX_LENGTH) {
    return { ok: false, error: `El motivo no puede pasar de ${MODERATION_REASON_MAX_LENGTH} caracteres.` }
  }
  return { ok: true, reason: text }
}

/** Which actions make sense from the current state (WARNING always does). */
export function validateModerationTransition(current: SiteModerationState, action: ModerationAction): { ok: true } | { ok: false; error: string } {
  if (action === "WARNING") return { ok: true }
  if (action === "SUSPEND") {
    if (current === "suspended") return { ok: false, error: "El sitio ya está suspendido." }
    if (current === "terminated") return { ok: false, error: "El sitio está terminado; reactívalo antes de cambiar su estado." }
    return { ok: true }
  }
  if (action === "TERMINATE") {
    return current === "terminated" ? { ok: false, error: "El sitio ya está terminado." } : { ok: true }
  }
  return current === "active" ? { ok: false, error: "El sitio ya está activo." } : { ok: true }
}

type ModerationRow = { siteId?: string | null; action: string; message: string; createdAt: Date }

function statusFromRow(row: ModerationRow | null | undefined): SiteModerationStatus {
  if (!row || !isModerationAction(row.action)) return ACTIVE_MODERATION_STATUS
  const state = stateAfterModerationAction(row.action)
  if (!state || state === "active") return ACTIVE_MODERATION_STATUS
  return { state, reason: row.message, at: row.createdAt }
}

const LATEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }]

/** Current moderation state of one site (latest state-changing event wins). */
export async function getSiteModerationStatus(siteId: string): Promise<SiteModerationStatus> {
  if (isFileStorageMode() || !isValidSiteId(siteId)) return ACTIVE_MODERATION_STATUS
  const row = await editorPrisma.auditLog.findFirst({
    where: { module: MODERATION_MODULE, siteId, action: { in: [...STATE_CHANGING_MODERATION_ACTIONS] } },
    orderBy: LATEST_FIRST,
    select: { action: true, message: true, createdAt: true },
  })
  return statusFromRow(row)
}

export interface SiteModerationSummary extends SiteModerationStatus {
  lastWarningAt: Date | null
}

/** Moderation state of many sites in one query (dashboard, Admin Sitios). */
export async function getSitesModerationSummary(siteIds: string[]): Promise<Map<string, SiteModerationSummary>> {
  const ids = [...new Set(siteIds.filter(isValidSiteId))]
  const summary = new Map<string, SiteModerationSummary>(ids.map((id) => [id, { ...ACTIVE_MODERATION_STATUS, lastWarningAt: null }]))
  if (isFileStorageMode() || ids.length === 0) return summary
  const rows = await editorPrisma.auditLog.findMany({
    where: { module: MODERATION_MODULE, siteId: { in: ids } },
    orderBy: LATEST_FIRST,
    select: { siteId: true, action: true, message: true, createdAt: true },
  })
  const settled = new Set<string>()
  for (const row of rows) {
    const id = row.siteId
    if (!id || !summary.has(id)) continue
    const entry = summary.get(id)!
    if (row.action === "WARNING" && !entry.lastWarningAt) entry.lastWarningAt = row.createdAt
    if (!settled.has(id) && (STATE_CHANGING_MODERATION_ACTIONS as readonly string[]).includes(row.action)) {
      settled.add(id)
      summary.set(id, { ...statusFromRow(row), lastWarningAt: entry.lastWarningAt })
    }
  }
  return summary
}

/**
 * Can the public see this site at all? It must exist, be published and not
 * be suspended or terminated. Used by every public entry that does not go
 * through getPublishedSite (static artifacts).
 */
export async function isSitePubliclyServable(siteId: string): Promise<boolean> {
  if (!isValidSiteId(siteId)) return false
  const site = await editorPrisma.editorWebsite.findFirst({ where: { id: siteId, published: true }, select: { id: true } })
  if (!site) return false
  return !isPubliclyBlocked((await getSiteModerationStatus(siteId)).state)
}

/** What the owner is told in the dashboard and the editor. */
export function ownerModerationNotice(status: SiteModerationStatus): { title: string; body: string } | null {
  if (status.state === "suspended") {
    return {
      title: "Sitio suspendido",
      body: "Orvenix suspendió este sitio. Puedes seguir editándolo y guardando para corregirlo, pero no se muestra al público y no podrás publicarlo ni eliminarlo hasta que lo reactivemos.",
    }
  }
  if (status.state === "terminated") {
    return {
      title: "Sitio terminado",
      body: "Orvenix terminó este sitio. Tus datos se conservan, pero no se muestra al público y no puedes publicarlo ni eliminarlo. Escríbenos si crees que es un error.",
    }
  }
  return null
}

export const MODERATED_SITE_PUBLISH_MESSAGE = "Este sitio está suspendido o terminado por Orvenix. No puedes publicarlo hasta que lo reactivemos."
export const MODERATED_SITE_DELETE_MESSAGE = "Este sitio está suspendido o terminado por Orvenix y no se puede eliminar."
