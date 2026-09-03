import { randomUUID } from "crypto"

import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"
import type { MutationScope } from "@/lib/orvenix-ai/policy"

import type { OrvenixAISnapshot } from "./types"

export const AI_UNDO_JOB_TYPE = "ai_undo_snapshot"
export const AI_UNDO_EXPIRES_MS = 24 * 60 * 60 * 1000

export type AIUndoStatus = "completed" | "processing" | "consumed" | "failed"

export interface AIUndoRecord {
  id: string
  userId: string
  siteId: string
  pageSlug: string
  snapshot: OrvenixAISnapshot
  appliedTreeHash: string
  scope: MutationScope
  createdAt: string
  expiresAt: string
  status: AIUndoStatus
  error?: string | null
}

type AIGenerationJobRecord = Awaited<ReturnType<typeof editorPrisma.aiGenerationJob.findUnique>>

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}

function normalizeRecord(job: AIGenerationJobRecord): AIUndoRecord | null {
  if (!job || job.type !== AI_UNDO_JOB_TYPE || typeof job.input !== "object" || job.input === null) {
    return null
  }

  const input = job.input as Partial<AIUndoRecord>

  if (
    typeof input.userId !== "string" ||
    typeof input.siteId !== "string" ||
    typeof input.pageSlug !== "string" ||
    typeof input.appliedTreeHash !== "string" ||
    typeof input.createdAt !== "string" ||
    typeof input.expiresAt !== "string" ||
    !input.snapshot
  ) {
    return null
  }

  return {
    id: job.id,
    userId: input.userId,
    siteId: input.siteId,
    pageSlug: input.pageSlug,
    snapshot: input.snapshot,
    appliedTreeHash: input.appliedTreeHash,
    scope: input.scope ?? "site_redesign",
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    status: job.status as AIUndoStatus,
    error: job.error,
  }
}

export async function rememberAIUndoRecord(params: {
  userId: string
  siteId: string
  pageSlug: string
  snapshot: OrvenixAISnapshot
  appliedTreeHash: string
  scope: MutationScope
}) {
  if (isFileStorageMode()) {
    throw new Error("El rollback seguro de Orvenix AI requiere almacenamiento Prisma.")
  }

  const id = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + AI_UNDO_EXPIRES_MS)

  const payload = {
    userId: params.userId,
    siteId: params.siteId,
    pageSlug: params.pageSlug,
    snapshot: structuredClone(params.snapshot),
    appliedTreeHash: params.appliedTreeHash,
    scope: params.scope,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies Omit<AIUndoRecord, "id" | "status" | "error">

  const job = await editorPrisma.aiGenerationJob.create({
    data: {
      id,
      siteId: params.siteId,
      pageId: null,
      type: AI_UNDO_JOB_TYPE,
      input: toJsonValue(payload),
      output: null,
      status: "completed",
      error: null,
    },
  })

  const record = normalizeRecord(job)

  if (!record) {
    throw new Error("No se pudo normalizar el registro de rollback de Orvenix AI.")
  }

  return record
}

export async function getAIUndoRecord(undoId: string) {
  if (isFileStorageMode()) return null

  return normalizeRecord(
    await editorPrisma.aiGenerationJob.findUnique({
      where: { id: undoId },
    }),
  )
}

export async function claimAIUndoRecord(undoId: string) {
  if (isFileStorageMode()) return false

  const result = await editorPrisma.aiGenerationJob.updateMany({
    where: {
      id: undoId,
      type: AI_UNDO_JOB_TYPE,
      status: "completed",
    },
    data: {
      status: "processing",
      error: null,
    },
  })

  return result.count === 1
}

export async function completeAIUndoRecord(undoId: string, output: unknown) {
  if (isFileStorageMode()) return false

  const result = await editorPrisma.aiGenerationJob.updateMany({
    where: {
      id: undoId,
      type: AI_UNDO_JOB_TYPE,
      status: "processing",
    },
    data: {
      status: "consumed",
      output: toJsonValue(output),
      error: null,
    },
  })

  return result.count === 1
}

export async function releaseAIUndoRecord(undoId: string, error: unknown) {
  if (isFileStorageMode()) return false

  const result = await editorPrisma.aiGenerationJob.updateMany({
    where: {
      id: undoId,
      type: AI_UNDO_JOB_TYPE,
      status: "processing",
    },
    data: {
      status: "completed",
      error: error instanceof Error ? error.message : "AI_UNDO_ROLLBACK_FAILED",
    },
  })

  return result.count === 1
}
