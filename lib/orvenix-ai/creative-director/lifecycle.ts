import { createHash } from "node:crypto"
import type { DesignAssistanceLifecycleClientV1, DesignAssistanceLifecycleErrorCodeV1 } from "@/lib/orvenix-ai/assistance/lifecycle"
import {
  createCreativeDirectorInputFingerprintV1,
  createCreativeDirectorOutputFingerprintV1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorFailureCodeV1,
  type CreativeDirectorRequestV1,
  type CreativeDirectorStatusV1,
  type CreativeSiteDirectionV1,
} from "./contract"

/**
 * V2-4: persists to the SAME `DesignAssistance` table the theme-advisor
 * role already uses (roleKey/strategyKey/appliedProposal are plain
 * string/Json columns -- no migration needed for a new roleKey). This
 * module duplicates assistance/lifecycle.ts's proven persistence pattern
 * rather than genericizing it (see contract.ts's module header) --
 * DesignAssistanceLifecycleClientV1 is reused verbatim since it describes
 * the DB CLIENT/table shape, not theme-specific business logic.
 */

export const CREATIVE_DIRECTOR_ID_PREFIX_V1 = "cd_"

export type RecordCreativeDirectionRequestedInputV1 = {
  userId: string
  siteCreationAttemptId: string
  attemptKey: string
  request: CreativeDirectorRequestV1
  providerKey: string
  modelKey: string
}

export type MarkCreativeDirectionAppliedInputV1 = { assistanceId: string; proposal: CreativeSiteDirectionV1 }
export type MarkCreativeDirectionRejectedInputV1 = { assistanceId: string; proposal: CreativeSiteDirectionV1 }
export type MarkCreativeDirectionFailedInputV1 = { assistanceId: string; failureCode: CreativeDirectorFailureCodeV1 }

export type CreativeDirectorLifecycleResultV1 =
  | {
      ok: true
      assistanceId: string
      status: CreativeDirectorStatusV1
      idempotent: boolean
      inputFingerprint?: string
      outputFingerprint?: string
      proposal?: CreativeSiteDirectionV1
      requestedAt?: Date
      completedAt?: Date | null
    }
  | { ok: false; error: DesignAssistanceLifecycleErrorCodeV1 }

async function resolveLifecycleClient(client?: DesignAssistanceLifecycleClientV1) {
  if (client) return client
  const { editorPrisma } = await import("../../editor-db")
  return editorPrisma as unknown as DesignAssistanceLifecycleClientV1
}

const ATTEMPT_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,96}$/
const ASSISTANCE_ID_PATTERN = /^cd_[a-f0-9]{64}$/

function looksLikeCustomerData(value: string) {
  return value.includes("@") || /^https?:\/\//i.test(value) || /\s/.test(value)
}

function isValidAttemptKey(value: unknown): value is string {
  return typeof value === "string" && ATTEMPT_KEY_PATTERN.test(value) && !looksLikeCustomerData(value)
}

function isValidAssistanceId(value: unknown): value is string {
  return typeof value === "string" && ASSISTANCE_ID_PATTERN.test(value)
}

function isProviderModelKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(value)
}

function stableJson(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new Error("invalid canonical number")
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`
  }
  throw new Error("invalid canonical value")
}

export function createCreativeDirectorIdV1(input: {
  siteCreationAttemptId: string
  roleKey: string
  strategyKey: string
  providerKey: string
  modelKey: string
  inputFingerprint: string
  attemptKey: string
}) {
  const digest = createHash("sha256")
    .update(stableJson({
      siteCreationAttemptId: input.siteCreationAttemptId,
      roleKey: input.roleKey,
      strategyKey: input.strategyKey,
      providerKey: input.providerKey,
      modelKey: input.modelKey,
      inputFingerprint: input.inputFingerprint,
      attemptKey: input.attemptKey,
    }))
    .digest("hex")
  return `${CREATIVE_DIRECTOR_ID_PREFIX_V1}${digest}`
}

function persistenceFailed(): CreativeDirectorLifecycleResultV1 {
  console.error("[Orvenix Creative Director] No se pudo persistir la atribucion.")
  return { ok: false, error: "persistence_failed" }
}

function cloneProposal(proposal: CreativeSiteDirectionV1): CreativeSiteDirectionV1 {
  return JSON.parse(JSON.stringify(proposal)) as CreativeSiteDirectionV1
}

type RowV1 = {
  id: string
  siteCreationAttemptId: string
  version: number
  roleKey: string
  strategyKey: string
  providerKey: string
  modelKey: string
  status: string
  inputFingerprint: string
  attemptKey: string
  outputFingerprint: string | null
  appliedProposal: unknown | null
  failureCode: string | null
  requestedAt: Date
  completedAt: Date | null
}

function readValidatedAppliedProposal(row: RowV1): CreativeSiteDirectionV1 | null {
  if (row.status !== "applied" || !row.outputFingerprint || !row.appliedProposal) return null
  const validation = validateCreativeSiteDirectionV1(row.appliedProposal)
  if (validation.ok === false) return null
  const proposal = validation.value
  if (createCreativeDirectorOutputFingerprintV1(proposal) !== row.outputFingerprint) return null
  return cloneProposal(proposal)
}

function rowResult(row: RowV1, idempotent: boolean): CreativeDirectorLifecycleResultV1 {
  const proposal = row.status === "applied" ? readValidatedAppliedProposal(row) : null
  if (row.status === "applied" && !proposal) return { ok: false, error: "integrity_error" }

  return {
    ok: true,
    assistanceId: row.id,
    status: row.status as CreativeDirectorStatusV1,
    idempotent,
    inputFingerprint: row.inputFingerprint,
    ...(row.outputFingerprint ? { outputFingerprint: row.outputFingerprint } : {}),
    ...(proposal ? { proposal } : {}),
    requestedAt: row.requestedAt,
    completedAt: row.completedAt,
  }
}

function terminalResultForExisting(params: { row: RowV1; targetStatus: "applied" | "rejected"; outputFingerprint: string }) {
  if (params.row.status === params.targetStatus) {
    if (params.targetStatus === "applied" && !readValidatedAppliedProposal(params.row)) {
      return { ok: false, error: "integrity_error" } satisfies CreativeDirectorLifecycleResultV1
    }
    if (params.row.outputFingerprint === params.outputFingerprint) return rowResult(params.row, true)
    return { ok: false, error: "conflict" } satisfies CreativeDirectorLifecycleResultV1
  }
  if (params.row.status === "applied" || params.row.status === "rejected" || params.row.status === "failed") {
    return { ok: false, error: "invalid_transition" } satisfies CreativeDirectorLifecycleResultV1
  }
  return { ok: false, error: "assistance_not_found" } satisfies CreativeDirectorLifecycleResultV1
}

export async function recordCreativeDirectionRequested(
  input: RecordCreativeDirectionRequestedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<CreativeDirectorLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)

    if (
      !input.userId.trim() ||
      !input.siteCreationAttemptId.trim() ||
      !isValidAttemptKey(input.attemptKey) ||
      !isProviderModelKey(input.providerKey) ||
      !isProviderModelKey(input.modelKey)
    ) {
      return { ok: false, error: "invalid_input" }
    }

    const attempt = await lifecycleClient.aiGenerationJob.findUnique({
      where: { id: input.siteCreationAttemptId },
      select: { id: true, type: true, status: true, input: true },
    })

    if (!attempt || attempt.type !== "ai_site_creation_preview") {
      return { ok: false, error: "site_creation_attempt_not_found" }
    }

    const attemptInput = attempt.input as { userId?: unknown } | null
    if (!attemptInput || attemptInput.userId !== input.userId) {
      return { ok: false, error: "site_creation_attempt_not_found" }
    }

    const inputFingerprint = createCreativeDirectorInputFingerprintV1(input.request)
    const assistanceId = createCreativeDirectorIdV1({
      siteCreationAttemptId: attempt.id,
      roleKey: input.request.roleKey,
      strategyKey: input.request.strategyKey,
      providerKey: input.providerKey,
      modelKey: input.modelKey,
      inputFingerprint,
      attemptKey: input.attemptKey,
    })

    const existing = await lifecycleClient.designAssistance.findUnique({
      where: { id: assistanceId },
      select: DESIGN_ASSISTANCE_SELECT_V1,
    })

    if (existing) return rowResult(existing as RowV1, true)

    if (attempt.status !== "planning") {
      return { ok: false, error: "site_creation_attempt_not_found" }
    }

    const row = await lifecycleClient.designAssistance.upsert({
      where: { id: assistanceId },
      create: {
        id: assistanceId,
        siteCreationAttemptId: attempt.id,
        version: input.request.version,
        roleKey: input.request.roleKey,
        strategyKey: input.request.strategyKey,
        providerKey: input.providerKey,
        modelKey: input.modelKey,
        status: "requested",
        inputFingerprint,
        attemptKey: input.attemptKey,
        outputFingerprint: null,
        appliedProposal: null,
        failureCode: null,
        completedAt: null,
      },
      update: {},
      select: DESIGN_ASSISTANCE_SELECT_V1,
    })

    return rowResult(row as RowV1, false)
  } catch {
    return persistenceFailed()
  }
}

async function markWithProposal(
  input: MarkCreativeDirectionAppliedInputV1 | MarkCreativeDirectionRejectedInputV1,
  status: "applied" | "rejected",
  client?: DesignAssistanceLifecycleClientV1,
): Promise<CreativeDirectorLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)
    const validation = validateCreativeSiteDirectionV1(input.proposal)
    if (validation.ok === false || !isValidAssistanceId(input.assistanceId)) {
      return { ok: false, error: "invalid_input" }
    }

    const proposal = cloneProposal(validation.value)
    const outputFingerprint = createCreativeDirectorOutputFingerprintV1(proposal)
    const updated = await lifecycleClient.designAssistance.updateMany({
      where: { id: input.assistanceId, status: "requested" },
      data: {
        status,
        outputFingerprint,
        appliedProposal: status === "applied" ? proposal : null,
        failureCode: null,
        completedAt: new Date(),
      },
    })

    const row = await lifecycleClient.designAssistance.findUnique({ where: { id: input.assistanceId }, select: DESIGN_ASSISTANCE_SELECT_V1 })
    if (!row) return { ok: false, error: "assistance_not_found" }

    if (updated.count === 1) return rowResult(row as RowV1, false)
    return terminalResultForExisting({ row: row as RowV1, targetStatus: status, outputFingerprint })
  } catch {
    return persistenceFailed()
  }
}

export async function markCreativeDirectionApplied(input: MarkCreativeDirectionAppliedInputV1, client?: DesignAssistanceLifecycleClientV1) {
  return markWithProposal(input, "applied", client)
}

export async function markCreativeDirectionRejected(input: MarkCreativeDirectionRejectedInputV1, client?: DesignAssistanceLifecycleClientV1) {
  return markWithProposal(input, "rejected", client)
}

export async function markCreativeDirectionFailed(
  input: MarkCreativeDirectionFailedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<CreativeDirectorLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)
    if (!isValidAssistanceId(input.assistanceId)) return { ok: false, error: "invalid_input" }

    const updated = await lifecycleClient.designAssistance.updateMany({
      where: { id: input.assistanceId, status: "requested" },
      data: { status: "failed", outputFingerprint: null, appliedProposal: null, failureCode: input.failureCode, completedAt: new Date() },
    })

    const row = await lifecycleClient.designAssistance.findUnique({ where: { id: input.assistanceId }, select: DESIGN_ASSISTANCE_SELECT_V1 })
    if (!row) return { ok: false, error: "assistance_not_found" }

    if (updated.count === 1) return rowResult(row as RowV1, false)
    if (row.status === "failed" && row.failureCode === input.failureCode) return rowResult(row as RowV1, true)
    if (row.status === "failed") return { ok: false, error: "conflict" }
    if (row.status === "applied" || row.status === "rejected") return { ok: false, error: "invalid_transition" }
    return { ok: false, error: "assistance_not_found" }
  } catch {
    return persistenceFailed()
  }
}

const DESIGN_ASSISTANCE_SELECT_V1 = {
  id: true,
  siteCreationAttemptId: true,
  version: true,
  roleKey: true,
  strategyKey: true,
  providerKey: true,
  modelKey: true,
  status: true,
  inputFingerprint: true,
  attemptKey: true,
  outputFingerprint: true,
  appliedProposal: true,
  failureCode: true,
  requestedAt: true,
  completedAt: true,
} as const
