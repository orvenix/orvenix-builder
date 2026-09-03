import type { PrismaClient } from "@/generated/editor-prisma"
import type { UserRole } from "@/lib/auth"
import type { OrvenixAgentResponse } from "@/lib/orvenix-ai/agent/types"
import { editorPrisma } from "@/lib/editor-db"
import { ensureHomePage, HOME_PAGE_SLUG } from "@/lib/builder-core/tree/sitePages"
import { validateEditorTreeSafety } from "@/lib/orvenix-ai/safety"
import { serverError } from "@/lib/server-log"
import { isFileStorageMode } from "@/lib/storage-mode"
import { validateTree } from "@/types/validateTree"
import type { EditorTree, GlobalTheme } from "@/types/editor"

import { hashEditorTree } from "./executor"
import {
  AI_UNDO_JOB_TYPE,
  claimAIUndoRecord,
  rememberAIUndoRecord,
  getAIUndoRecord,
  releaseAIUndoRecord,
  type AIUndoRecord,
} from "./undo-store"

export type AIUndoFailureCode =
  | "invalid_undo"
  | "unavailable"
  | "expired"
  | "forbidden"
  | "already_used"
  | "stale_tree"
  | "restore_failed"

export interface AIUndoRollbackResult {
  ok: boolean
  code?: AIUndoFailureCode
  message: string
  undoId?: string
  siteId?: string
  pageSlug?: string
  tree?: EditorTree
  restoredHash?: string
}

export interface AIUndoActor {
  userId: string
  role: UserRole
}

export interface AIUndoMetadata {
  id: string
  siteId: string
  pageSlug: string
  expiresAt: string
}

export async function registerAIUndoForExecutedResult(params: {
  result: OrvenixAgentResponse
  userId: string
  siteId: string
  pageSlug: string
  readCanonicalTree: (siteId: string, pageSlug: string) => Promise<EditorTree>
  rememberUndo?: typeof rememberAIUndoRecord
}): Promise<{ undo?: AIUndoMetadata; undoWarning?: string }> {
  const { result } = params

  if (
    result.ok !== true ||
    result.action !== "executed" ||
    result.scope === "publish" ||
    result.scope === "site_creation" ||
    !result.snapshot ||
    !result.plan?.after
  ) {
    return {}
  }

  try {
    const appliedTree = await params.readCanonicalTree(params.siteId, params.pageSlug)
    const record = await (params.rememberUndo ?? rememberAIUndoRecord)({
      userId: params.userId,
      siteId: params.siteId,
      pageSlug: params.pageSlug,
      snapshot: result.snapshot,
      appliedTreeHash: hashEditorTree(appliedTree),
      scope: result.scope,
    })

    return {
      undo: {
        id: record.id,
        siteId: record.siteId,
        pageSlug: record.pageSlug,
        expiresAt: record.expiresAt,
      },
    }
  } catch (error) {
    return {
      undoWarning:
        error instanceof Error
          ? error.message
          : "El cambio se aplicó, pero no se pudo preparar Deshacer.",
    }
  }
}

export interface AIUndoRollbackDeps {
  getRecord: (undoId: string) => Promise<AIUndoRecord | null>
  claimRecord: (undoId: string) => Promise<boolean>
  releaseRecord: (undoId: string, error: unknown) => Promise<boolean>
  canManageSite: (siteId: string, userId: string, role: UserRole) => Promise<boolean>
  restoreAndConsume: (record: AIUndoRecord, undoId: string, now: Date) => Promise<{ tree: EditorTree; restoredHash: string }>
  now: () => Date
}

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

type WebsiteLockRow = {
  id: string
  tree: unknown
}

type PageLockRow = {
  id: string
  tree: unknown
}

type ThemeLockRow = {
  id: string
  tokens: unknown
}

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null))
}

function normalizeThemeTokens(value: unknown): GlobalTheme | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as GlobalTheme
}

export function shouldRestoreEditorWebsiteTreeForUndo(pageSlug: string) {
  return pageSlug === HOME_PAGE_SLUG
}

export function buildSitePageUndoUpdateData(snapshotTree: EditorTree) {
  return {
    tree: toJsonValue(snapshotTree),
    seo: toJsonValue(snapshotTree.seo ?? null),
  }
}

function buildResolvedTree(pageTree: unknown, themeTokens: unknown): EditorTree {
  const tree = validateTree(pageTree)
  const theme = normalizeThemeTokens(themeTokens)

  if (!theme) {
    return tree
  }

  return {
    ...tree,
    theme,
    globalTheme: theme,
  }
}

async function lockWebsite(tx: TxClient, siteId: string) {
  const rows = await tx.$queryRawUnsafe<WebsiteLockRow[]>(
    "SELECT id, tree FROM editor_websites WHERE id = ? FOR UPDATE",
    siteId,
  )

  return rows[0] ?? null
}

async function lockPage(tx: TxClient, siteId: string, pageSlug: string) {
  if (pageSlug === HOME_PAGE_SLUG) {
    const rows = await tx.$queryRawUnsafe<PageLockRow[]>(
      "SELECT id, tree FROM site_pages WHERE siteId = ? AND isHome = true ORDER BY createdAt ASC LIMIT 1 FOR UPDATE",
      siteId,
    )

    return rows[0] ?? null
  }

  const rows = await tx.$queryRawUnsafe<PageLockRow[]>(
    "SELECT id, tree FROM site_pages WHERE siteId = ? AND slug = ? LIMIT 1 FOR UPDATE",
    siteId,
    pageSlug,
  )

  return rows[0] ?? null
}

async function lockTheme(tx: TxClient, siteId: string) {
  const rows = await tx.$queryRawUnsafe<ThemeLockRow[]>(
    "SELECT id, tokens FROM site_themes WHERE siteId = ? LIMIT 1 FOR UPDATE",
    siteId,
  )

  return rows[0] ?? null
}

export async function restoreAndConsumeAIUndoSnapshot(record: AIUndoRecord, undoId: string, now = new Date()) {
  if (isFileStorageMode()) {
    throw new Error("El rollback seguro de Orvenix AI requiere almacenamiento Prisma.")
  }

  if (record.pageSlug === HOME_PAGE_SLUG) {
    await ensureHomePage(record.siteId)
  }

  return editorPrisma.$transaction(async (tx) => {
    const website = await lockWebsite(tx, record.siteId)

    if (!website) {
      throw new Error("Sitio no encontrado para rollback de Orvenix AI.")
    }

    const page = await lockPage(tx, record.siteId, record.pageSlug)
    const theme = await lockTheme(tx, record.siteId)

    if (!page && record.pageSlug !== HOME_PAGE_SLUG) {
      throw new Error("Pagina no encontrada para rollback de Orvenix AI.")
    }

    const currentTree = buildResolvedTree(page?.tree ?? website.tree, theme?.tokens)
    const currentHash = hashEditorTree(currentTree)

    if (currentHash !== record.appliedTreeHash) {
      const error = new Error("El sitio cambió después del cambio de IA. No se deshizo para no borrar trabajo reciente.")
      error.name = "AI_UNDO_STALE_TREE"
      throw error
    }

    const snapshotTree = validateTree(record.snapshot.tree)
    const safety = validateEditorTreeSafety(snapshotTree)

    if (!safety.safe) {
      throw new Error("El snapshot de rollback no superó Safety Validator.")
    }

    const snapshotJson = toJsonValue(snapshotTree)
    const restoresHome = shouldRestoreEditorWebsiteTreeForUndo(record.pageSlug)

    if (restoresHome) {
      await tx.editorWebsite.update({
        where: { id: record.siteId },
        data: { tree: snapshotJson },
      })
    }

    if (page) {
      await tx.sitePage.update({
        where: { id: page.id },
        data: buildSitePageUndoUpdateData(snapshotTree),
      })
    }

    const snapshotTheme = snapshotTree.theme ?? snapshotTree.globalTheme

    if (restoresHome && snapshotTheme) {
      await tx.siteTheme.upsert({
        where: { siteId: record.siteId },
        update: { tokens: toJsonValue(snapshotTheme) },
        create: { siteId: record.siteId, tokens: toJsonValue(snapshotTheme) },
      })
    }

    const restoredTheme = restoresHome ? snapshotTheme ?? theme?.tokens : theme?.tokens
    const expectedTree = buildResolvedTree(snapshotTree, restoredTheme)
    const expectedHash = hashEditorTree(expectedTree)

    const verifiedWebsite = restoresHome
      ? await tx.editorWebsite.findUnique({
          where: { id: record.siteId },
          select: { tree: true },
        })
      : null

    const verifiedPage = page
      ? await tx.sitePage.findUnique({
          where: { id: page.id },
          select: { tree: true },
        })
      : null

    const verifiedTheme = await tx.siteTheme.findUnique({
      where: { siteId: record.siteId },
      select: { tokens: true },
    })

    const restoredTree = buildResolvedTree(
      verifiedPage?.tree ?? verifiedWebsite?.tree ?? snapshotTree,
      verifiedTheme?.tokens ?? restoredTheme,
    )
    const restoredHash = hashEditorTree(restoredTree)

    if (restoredHash !== expectedHash) {
      throw new Error("El rollback se escribió pero no pudo verificarse.")
    }

    const consumed = await tx.aiGenerationJob.updateMany({
      where: {
        id: undoId,
        type: AI_UNDO_JOB_TYPE,
        status: "processing",
      },
      data: {
        status: "consumed",
        output: toJsonValue({
          consumedAt: now.toISOString(),
          restoredHash,
        }),
        error: null,
      },
    })

    if (consumed.count !== 1) {
      throw new Error("No se pudo consumir el registro de deshacer de Orvenix AI.")
    }

    return {
      tree: restoredTree,
      restoredHash,
    }
  })
}

function getFailureCode(error: unknown): AIUndoFailureCode {
  if (error instanceof Error && error.name === "AI_UNDO_STALE_TREE") return "stale_tree"
  return "restore_failed"
}

function getFailureMessage(error: unknown) {
  if (error instanceof Error && error.name === "AI_UNDO_STALE_TREE") {
    return "El sitio cambió después del cambio de IA. No se deshizo para no borrar trabajo reciente."
  }

  return "No se pudo deshacer el cambio de Orvenix AI."
}

export async function rollbackOrvenixAIChange(params: {
  undoId: string
  actor: AIUndoActor
  deps?: Partial<AIUndoRollbackDeps>
}): Promise<AIUndoRollbackResult> {
  const undoId = params.undoId.trim()

  if (!undoId) {
    return {
      ok: false,
      code: "invalid_undo",
      message: "El identificador de deshacer no es valido.",
    }
  }

  const deps: AIUndoRollbackDeps = {
    getRecord: getAIUndoRecord,
    claimRecord: claimAIUndoRecord,
    releaseRecord: releaseAIUndoRecord,
    canManageSite: async () => false,
    restoreAndConsume: restoreAndConsumeAIUndoSnapshot,
    now: () => new Date(),
    ...params.deps,
  }

  const record = await deps.getRecord(undoId)

  if (!record) {
    return {
      ok: false,
      code: "invalid_undo",
      message: "No encontré un cambio de IA para deshacer.",
    }
  }

  if (record.userId !== params.actor.userId) {
    return {
      ok: false,
      code: "forbidden",
      message: "No tienes permiso para deshacer este cambio de IA.",
    }
  }

  if (record.status === "consumed") {
    return {
      ok: false,
      code: "already_used",
      message: "Este cambio de IA ya fue deshecho.",
    }
  }

  if (record.status !== "completed") {
    return {
      ok: false,
      code: "unavailable",
      message: "Este cambio de IA no está disponible para deshacer en este momento.",
    }
  }

  if (Date.parse(record.expiresAt) <= deps.now().getTime()) {
    return {
      ok: false,
      code: "expired",
      message: "Este deshacer expiró. Por seguridad, genera un nuevo cambio de IA.",
    }
  }

  const allowed = await deps.canManageSite(record.siteId, params.actor.userId, params.actor.role)

  if (!allowed) {
    return {
      ok: false,
      code: "forbidden",
      message: "No tienes permiso para modificar este sitio.",
    }
  }

  const claimed = await deps.claimRecord(undoId)

  if (!claimed) {
    return {
      ok: false,
      code: "unavailable",
      message: "Este cambio de IA ya se está procesando o fue usado.",
    }
  }

  try {
    const restored = await deps.restoreAndConsume(record, undoId, deps.now())

    return {
      ok: true,
      message: "Cambio de IA deshecho correctamente.",
      undoId,
      siteId: record.siteId,
      pageSlug: record.pageSlug,
      tree: restored.tree,
      restoredHash: restored.restoredHash,
    }
  } catch (error) {
    serverError("[orvenix-ai:undo] Rollback failed", {
      undoId,
      siteId: record.siteId,
      pageSlug: record.pageSlug,
      userId: params.actor.userId,
      code: getFailureCode(error),
      error: error instanceof Error ? error.message : String(error),
    })

    await deps.releaseRecord(undoId, error)

    return {
      ok: false,
      code: getFailureCode(error),
      message: getFailureMessage(error),
      undoId,
      siteId: record.siteId,
      pageSlug: record.pageSlug,
    }
  }
}
