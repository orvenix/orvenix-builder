import { createHash, randomBytes } from "crypto"

import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"

export const PASSWORD_RESET_JOB_TYPE = "password_reset_token"
export const PASSWORD_RESET_EXPIRES_MS = 30 * 60 * 1000 // 30 minutos
export const PASSWORD_RESET_TOKEN_BYTES = 32
export const PASSWORD_RESET_TOKEN_HEX_LENGTH = PASSWORD_RESET_TOKEN_BYTES * 2

export type PasswordResetTokenStatus = "completed" | "processing" | "consumed"

interface PasswordResetTokenInput {
  userId: string
  createdAt: string
  expiresAt: string
}

type AIGenerationJobRecord = Awaited<ReturnType<typeof editorPrisma.aiGenerationJob.findUnique>>
type ResetTokenTx = Prisma.TransactionClient

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidResetTokenFormat(token: string) {
  return new RegExp(`^[a-f0-9]{${PASSWORD_RESET_TOKEN_HEX_LENGTH}}$`, "i").test(token)
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function getPasswordResetJobIdForToken(token: string) {
  if (!isValidResetTokenFormat(token)) return null
  return `password_reset:${hashResetToken(token)}`
}

function normalizeInput(job: AIGenerationJobRecord): (PasswordResetTokenInput & { id: string; status: string }) | null {
  if (!job || job.type !== PASSWORD_RESET_JOB_TYPE || !isObject(job.input)) return null

  const { userId, createdAt, expiresAt } = job.input
  if (typeof userId !== "string" || typeof createdAt !== "string" || typeof expiresAt !== "string") {
    return null
  }

  return {
    id: job.id,
    userId,
    createdAt,
    expiresAt,
    status: job.status,
  }
}

function isExpired(expiresAt: string) {
  const timestamp = Date.parse(expiresAt)
  return !Number.isFinite(timestamp) || timestamp <= Date.now()
}

async function cleanupExpiredPasswordResetJobs(limit = 100) {
  const candidates = await editorPrisma.aiGenerationJob.findMany({
    where: {
      type: PASSWORD_RESET_JOB_TYPE,
      status: { in: ["completed", "processing"] },
      createdAt: { lt: new Date(Date.now() - PASSWORD_RESET_EXPIRES_MS) },
    },
    select: { id: true },
    take: limit,
  })

  if (candidates.length === 0) return

  await editorPrisma.aiGenerationJob.deleteMany({
    where: {
      id: { in: candidates.map((job) => job.id) },
      type: PASSWORD_RESET_JOB_TYPE,
      status: { in: ["completed", "processing"] },
    },
  })
}

export async function createResetTokenForUser(userId: string): Promise<string> {
  await cleanupExpiredPasswordResetJobs()

  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex")
  const jobId = getPasswordResetJobIdForToken(token)
  if (!jobId) throw new Error("No se pudo generar el token de recuperacion.")

  const now = new Date()
  const input: PasswordResetTokenInput = {
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_EXPIRES_MS).toISOString(),
  }

  await editorPrisma.aiGenerationJob.create({
    data: {
      id: jobId,
      siteId: null,
      pageId: null,
      type: PASSWORD_RESET_JOB_TYPE,
      input: toJsonValue(input),
      output: null,
      status: "completed",
      error: null,
    },
  })

  return token
}

export async function validateResetToken(token: string): Promise<{ valid: true; userId: string } | { valid: false }> {
  const jobId = getPasswordResetJobIdForToken(token)
  if (!jobId) return { valid: false }

  const record = normalizeInput(
    await editorPrisma.aiGenerationJob.findUnique({
      where: { id: jobId },
    }),
  )

  if (!record || record.status !== "completed" || isExpired(record.expiresAt)) return { valid: false }
  return { valid: true, userId: record.userId }
}

export async function consumeResetTokenAndUpdatePassword(token: string, passwordHash: string): Promise<{ ok: true; userId: string } | { ok: false }> {
  const jobId = getPasswordResetJobIdForToken(token)
  if (!jobId) return { ok: false as const }

  return editorPrisma.$transaction(async (tx: ResetTokenTx) => {
    const record = normalizeInput(
      await tx.aiGenerationJob.findUnique({
        where: { id: jobId },
      }),
    )

    if (!record || record.status !== "completed" || isExpired(record.expiresAt)) return { ok: false as const }

    const claimed = await tx.aiGenerationJob.updateMany({
      where: {
        id: jobId,
        type: PASSWORD_RESET_JOB_TYPE,
        status: "completed",
      },
      data: {
        status: "processing",
        error: null,
      },
    })

    if (claimed.count !== 1) return { ok: false as const }

    await tx.user.update({
      where: { id: record.userId },
      data: { password: passwordHash },
    })

    const consumed = await tx.aiGenerationJob.updateMany({
      where: {
        id: jobId,
        type: PASSWORD_RESET_JOB_TYPE,
        status: "processing",
      },
      data: {
        status: "consumed",
        output: toJsonValue({ consumedAt: new Date().toISOString() }),
        error: null,
      },
    })

    if (consumed.count !== 1) {
      throw new Error("PASSWORD_RESET_CONSUME_FAILED")
    }

    return { ok: true as const, userId: record.userId }
  })
}
