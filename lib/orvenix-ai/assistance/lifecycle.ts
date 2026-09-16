import { createHash } from "node:crypto"

import {
  createDesignAssistanceInputFingerprintV1,
  createDesignAssistanceOutputFingerprintV1,
  validateDesignAssistanceAttributionV1,
  validateDesignAssistanceProposalV1,
  validateDesignAssistanceRequestV1,
  type DesignAssistanceFailureCodeV1,
  type DesignAssistanceProposalV1,
  type DesignAssistanceRequestV1,
  type DesignAssistanceStatusV1,
} from "./contract"

export const DESIGN_ASSISTANCE_ID_PREFIX_V1 = "da_"

export type RecordDesignAssistanceRequestedInputV1 = {
  userId: string
  siteCreationAttemptId: string
  attemptKey: string
  request: DesignAssistanceRequestV1
  providerKey: string
  modelKey: string
}

export type MarkDesignAssistanceAppliedInputV1 = {
  assistanceId: string
  proposal: DesignAssistanceProposalV1
}

export type MarkDesignAssistanceRejectedInputV1 = {
  assistanceId: string
  proposal: DesignAssistanceProposalV1
}

export type MarkDesignAssistanceFailedInputV1 = {
  assistanceId: string
  failureCode: DesignAssistanceFailureCodeV1
}

export type DesignAssistanceLifecycleResultV1 =
  | {
      ok: true
      assistanceId: string
      status: DesignAssistanceStatusV1
      idempotent: boolean
      inputFingerprint?: string
      outputFingerprint?: string
      proposal?: DesignAssistanceProposalV1
      requestedAt?: Date
      completedAt?: Date | null
    }
  | {
      ok: false
      error: DesignAssistanceLifecycleErrorCodeV1
    }

export type DesignAssistanceLifecycleErrorCodeV1 =
  | "invalid_input"
  | "site_creation_attempt_not_found"
  | "assistance_not_found"
  | "conflict"
  | "invalid_transition"
  | "integrity_error"
  | "persistence_failed"

export type DesignAssistanceLifecycleRowV1 = {
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

export type DesignAssistanceLifecycleClientV1 = {
  aiGenerationJob: {
    findUnique: (args: {
      where: { id: string }
      select: { id: true; type: true; status: true; input: true }
    }) => Promise<{ id: string; type: string; status: string; input: unknown } | null>
  }
  designAssistance: {
    upsert: (args: {
      where: { id: string }
      create: {
        id: string
        siteCreationAttemptId: string
        version: number
        roleKey: string
        strategyKey: string
        providerKey: string
        modelKey: string
        status: "requested"
        inputFingerprint: string
        attemptKey: string
        outputFingerprint: null
        appliedProposal: null
        failureCode: null
        completedAt: null
      }
      update: Record<string, never>
      select: DesignAssistanceLifecycleSelectV1
    }) => Promise<DesignAssistanceLifecycleRowV1>
    findUnique: (args: {
      where: { id: string }
      select: DesignAssistanceLifecycleSelectV1
    }) => Promise<DesignAssistanceLifecycleRowV1 | null>
    updateMany: (args: {
      where: { id: string; status: "requested" }
      data: {
        status: "applied" | "rejected" | "failed"
        outputFingerprint?: string | null
        appliedProposal?: unknown | null
        failureCode?: string | null
        completedAt: Date
      }
    }) => Promise<{ count: number }>
  }
}

type DesignAssistanceLifecycleSelectV1 = {
  id: true
  siteCreationAttemptId: true
  version: true
  roleKey: true
  strategyKey: true
  providerKey: true
  modelKey: true
  status: true
  inputFingerprint: true
  attemptKey: true
  outputFingerprint: true
  appliedProposal: true
  failureCode: true
  requestedAt: true
  completedAt: true
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
} satisfies DesignAssistanceLifecycleSelectV1


async function resolveLifecycleClient(client?: DesignAssistanceLifecycleClientV1) {
  if (client) return client
  const { editorPrisma } = await import("../../editor-db")
  return editorPrisma as unknown as DesignAssistanceLifecycleClientV1
}

const ATTEMPT_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,96}$/
const ASSISTANCE_ID_PATTERN = /^da_[a-f0-9]{64}$/

function isValidAttemptKey(value: unknown): value is string {
  return typeof value === "string" && ATTEMPT_KEY_PATTERN.test(value) && !looksLikeCustomerData(value)
}

function looksLikeCustomerData(value: string) {
  return value.includes("@") || /^https?:\/\//i.test(value) || /\s/.test(value)
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

export function createDesignAssistanceIdV1(input: {
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

  return `${DESIGN_ASSISTANCE_ID_PREFIX_V1}${digest}`
}

function persistenceFailed(): DesignAssistanceLifecycleResultV1 {
  console.error("[Orvenix Assistance] No se pudo persistir la atribucion de asistencia.")
  return { ok: false, error: "persistence_failed" }
}

function cloneProposal(proposal: DesignAssistanceProposalV1): DesignAssistanceProposalV1 {
  return JSON.parse(JSON.stringify(proposal)) as DesignAssistanceProposalV1
}

function readValidatedAppliedProposal(row: DesignAssistanceLifecycleRowV1): DesignAssistanceProposalV1 | null {
  if (row.status !== "applied" || !row.outputFingerprint || !row.appliedProposal) return null

  const validation = validateDesignAssistanceProposalV1(row.appliedProposal)
  if (validation.ok === false) return null

  const proposal = validation.value
  if (createDesignAssistanceOutputFingerprintV1(proposal) !== row.outputFingerprint) return null

  return cloneProposal(proposal)
}

function rowResult(row: DesignAssistanceLifecycleRowV1, idempotent: boolean): DesignAssistanceLifecycleResultV1 {
  const proposal = row.status === "applied" ? readValidatedAppliedProposal(row) : null

  if (row.status === "applied" && !proposal) {
    return { ok: false, error: "integrity_error" }
  }

  return {
    ok: true,
    assistanceId: row.id,
    status: row.status as DesignAssistanceStatusV1,
    idempotent,
    inputFingerprint: row.inputFingerprint,
    ...(row.outputFingerprint ? { outputFingerprint: row.outputFingerprint } : {}),
    ...(proposal ? { proposal } : {}),
    requestedAt: row.requestedAt,
    completedAt: row.completedAt,
  }
}

function terminalResultForExisting(params: {
  row: DesignAssistanceLifecycleRowV1
  targetStatus: "applied" | "rejected"
  outputFingerprint: string
}) {
  if (params.row.status === params.targetStatus) {
    if (params.targetStatus === "applied" && !readValidatedAppliedProposal(params.row)) {
      return { ok: false, error: "integrity_error" } satisfies DesignAssistanceLifecycleResultV1
    }

    if (params.row.outputFingerprint === params.outputFingerprint) {
      return rowResult(params.row, true)
    }

    return { ok: false, error: "conflict" } satisfies DesignAssistanceLifecycleResultV1
  }

  if (params.row.status === "applied" || params.row.status === "rejected" || params.row.status === "failed") {
    return { ok: false, error: "invalid_transition" } satisfies DesignAssistanceLifecycleResultV1
  }

  return { ok: false, error: "assistance_not_found" } satisfies DesignAssistanceLifecycleResultV1
}

export async function recordDesignAssistanceRequested(
  input: RecordDesignAssistanceRequestedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<DesignAssistanceLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)
    const requestValidation = validateDesignAssistanceRequestV1(input.request)

    if (
      requestValidation.ok === false ||
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

    const request = requestValidation.value
    const inputFingerprint = createDesignAssistanceInputFingerprintV1(request)
    const assistanceId = createDesignAssistanceIdV1({
      siteCreationAttemptId: attempt.id,
      roleKey: request.roleKey,
      strategyKey: request.strategyKey,
      providerKey: input.providerKey,
      modelKey: input.modelKey,
      inputFingerprint,
      attemptKey: input.attemptKey,
    })

    const existing = await lifecycleClient.designAssistance.findUnique({
      where: { id: assistanceId },
      select: DESIGN_ASSISTANCE_SELECT_V1,
    })

    if (existing) {
      return rowResult(existing, true)
    }

    if (attempt.status !== "planning") {
      return { ok: false, error: "site_creation_attempt_not_found" }
    }

    const row = await lifecycleClient.designAssistance.upsert({
      where: { id: assistanceId },
      create: {
        id: assistanceId,
        siteCreationAttemptId: attempt.id,
        version: request.version,
        roleKey: request.roleKey,
        strategyKey: request.strategyKey,
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

    return rowResult(row, false)
  } catch {
    return persistenceFailed()
  }
}

async function markWithProposal(
  input: MarkDesignAssistanceAppliedInputV1 | MarkDesignAssistanceRejectedInputV1,
  status: "applied" | "rejected",
  client?: DesignAssistanceLifecycleClientV1,
): Promise<DesignAssistanceLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)
    const validation = validateDesignAssistanceProposalV1(input.proposal)
    if (validation.ok === false || !isValidAssistanceId(input.assistanceId)) {
      return { ok: false, error: "invalid_input" }
    }

    const proposal = cloneProposal(validation.value)
    const outputFingerprint = createDesignAssistanceOutputFingerprintV1(proposal)
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

    const row = await lifecycleClient.designAssistance.findUnique({
      where: { id: input.assistanceId },
      select: DESIGN_ASSISTANCE_SELECT_V1,
    })

    if (!row) {
      return { ok: false, error: "assistance_not_found" }
    }

    if (updated.count === 1) {
      return rowResult(row, false)
    }

    return terminalResultForExisting({ row, targetStatus: status, outputFingerprint })
  } catch {
    return persistenceFailed()
  }
}

export async function markDesignAssistanceApplied(
  input: MarkDesignAssistanceAppliedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<DesignAssistanceLifecycleResultV1> {
  return markWithProposal(input, "applied", client)
}

export async function markDesignAssistanceRejected(
  input: MarkDesignAssistanceRejectedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<DesignAssistanceLifecycleResultV1> {
  return markWithProposal(input, "rejected", client)
}

export async function markDesignAssistanceFailed(
  input: MarkDesignAssistanceFailedInputV1,
  client?: DesignAssistanceLifecycleClientV1,
): Promise<DesignAssistanceLifecycleResultV1> {
  try {
    const lifecycleClient = await resolveLifecycleClient(client)
    if (!isValidAssistanceId(input.assistanceId)) {
      return { ok: false, error: "invalid_input" }
    }

    const attributionValidation = validateDesignAssistanceAttributionV1({
      version: 1,
      roleKey: "theme_direction_advisor_v1",
      strategyKey: "theme_bucket_recommendation_v1",
      providerKey: "provider_a",
      modelKey: "model_a",
      status: "failed",
      inputFingerprint: "0".repeat(64),
      failureCode: input.failureCode,
    })

    if (attributionValidation.ok === false) {
      return { ok: false, error: "invalid_input" }
    }

    const updated = await lifecycleClient.designAssistance.updateMany({
      where: { id: input.assistanceId, status: "requested" },
      data: {
        status: "failed",
        outputFingerprint: null,
        appliedProposal: null,
        failureCode: input.failureCode,
        completedAt: new Date(),
      },
    })

    const row = await lifecycleClient.designAssistance.findUnique({
      where: { id: input.assistanceId },
      select: DESIGN_ASSISTANCE_SELECT_V1,
    })

    if (!row) {
      return { ok: false, error: "assistance_not_found" }
    }

    if (updated.count === 1) {
      return rowResult(row, false)
    }

    if (row.status === "failed" && row.failureCode === input.failureCode) {
      return rowResult(row, true)
    }

    if (row.status === "failed") {
      return { ok: false, error: "conflict" }
    }

    if (row.status === "applied" || row.status === "rejected") {
      return { ok: false, error: "invalid_transition" }
    }

    return { ok: false, error: "assistance_not_found" }
  } catch {
    return persistenceFailed()
  }
}
