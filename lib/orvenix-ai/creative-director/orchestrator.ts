import {
  markCreativeDirectionApplied,
  markCreativeDirectionFailed,
  markCreativeDirectionRejected,
  recordCreativeDirectionRequested,
  type CreativeDirectorLifecycleResultV1,
} from "./lifecycle"
import { requestCreativeDirectionV1 } from "./gateway"
import type { DesignAssistanceLifecycleClientV1, DesignAssistanceLifecycleErrorCodeV1 } from "@/lib/orvenix-ai/assistance/lifecycle"
import type {
  CreativeDirectorFailureCodeV1,
  CreativeDirectorProviderV1,
  CreativeDirectorRequestV1,
  CreativeSiteDirectionV1,
} from "./contract"

/**
 * V2-4: mirrors assistance/orchestrator.ts's request -> gateway -> decide
 * -> persist flow, retargeted at the Creative Director contract/lifecycle.
 */

export type CreativeDirectorDecisionV1 = { decision: "apply" } | { decision: "reject" }

export type DecideCreativeDirectionInputV1 = {
  request: CreativeDirectorRequestV1
  proposal: CreativeSiteDirectionV1
  providerKey: string
  modelKey: string
}

export type RunCreativeDirectorInputV1 = {
  userId: string
  siteCreationAttemptId: string
  attemptKey: string
  request: CreativeDirectorRequestV1
  provider: CreativeDirectorProviderV1
  providerKey: string
  modelKey: string
  decideProposal: (input: DecideCreativeDirectionInputV1) => CreativeDirectorDecisionV1 | Promise<CreativeDirectorDecisionV1>
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}

export type RunCreativeDirectorResultV1 =
  | { ok: true; assistanceId: string; status: "applied"; proposal?: CreativeSiteDirectionV1; outputFingerprint?: string; idempotent: boolean }
  | { ok: true; assistanceId: string; status: "rejected"; outputFingerprint?: string; idempotent: boolean }
  | { ok: true; assistanceId: string; status: "failed"; failureCode?: CreativeDirectorFailureCodeV1; idempotent: boolean }
  | { ok: false; assistanceId?: string; error: CreativeDirectorOrchestrationErrorCodeV1; lifecycleError?: DesignAssistanceLifecycleErrorCodeV1 }

export type CreativeDirectorOrchestrationErrorCodeV1 = "requested_failed" | "decision_failed" | "terminal_transition_failed"

function isTerminalStatus(status: string): status is "applied" | "rejected" | "failed" {
  return status === "applied" || status === "rejected" || status === "failed"
}

function isDecision(value: unknown): value is CreativeDirectorDecisionV1 {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    ((value as { decision?: unknown }).decision === "apply" || (value as { decision?: unknown }).decision === "reject")
}

async function markFailure(params: {
  assistanceId: string
  failureCode: CreativeDirectorFailureCodeV1
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}): Promise<RunCreativeDirectorResultV1> {
  const marked = await markCreativeDirectionFailed({ assistanceId: params.assistanceId, failureCode: params.failureCode }, params.lifecycleClient)
  if (marked.ok === true && marked.status === "failed") {
    return { ok: true, assistanceId: marked.assistanceId, status: "failed", failureCode: params.failureCode, idempotent: marked.idempotent }
  }
  return { ok: false, assistanceId: params.assistanceId, error: "terminal_transition_failed", lifecycleError: marked.ok === false ? marked.error : undefined }
}

function terminalResult(params: {
  assistanceId: string
  status: "applied" | "rejected" | "failed"
  outputFingerprint?: string
  proposal?: CreativeSiteDirectionV1
  idempotent: boolean
}): RunCreativeDirectorResultV1 {
  if (params.status === "applied") {
    return { ok: true, assistanceId: params.assistanceId, status: "applied", ...(params.proposal ? { proposal: params.proposal } : {}), outputFingerprint: params.outputFingerprint, idempotent: true }
  }
  if (params.status === "rejected") {
    return { ok: true, assistanceId: params.assistanceId, status: "rejected", outputFingerprint: params.outputFingerprint, idempotent: true }
  }
  return { ok: true, assistanceId: params.assistanceId, status: "failed", idempotent: true }
}

export async function runCreativeDirectorV1(input: RunCreativeDirectorInputV1): Promise<RunCreativeDirectorResultV1> {
  const requested: CreativeDirectorLifecycleResultV1 = await recordCreativeDirectionRequested(
    { userId: input.userId, siteCreationAttemptId: input.siteCreationAttemptId, attemptKey: input.attemptKey, request: input.request, providerKey: input.providerKey, modelKey: input.modelKey },
    input.lifecycleClient,
  )

  if (requested.ok === false) {
    return { ok: false, error: "requested_failed", lifecycleError: requested.error }
  }

  if (isTerminalStatus(requested.status)) {
    return terminalResult({ assistanceId: requested.assistanceId, status: requested.status, outputFingerprint: requested.outputFingerprint, proposal: requested.proposal, idempotent: requested.idempotent })
  }

  const gatewayResult = await requestCreativeDirectionV1({ request: input.request, provider: input.provider, providerKey: input.providerKey, modelKey: input.modelKey })

  if (gatewayResult.ok === false) {
    return markFailure({ assistanceId: requested.assistanceId, failureCode: gatewayResult.failureCode, lifecycleClient: input.lifecycleClient })
  }

  let decision: CreativeDirectorDecisionV1
  try {
    const untrustedDecision = await input.decideProposal({ request: input.request, proposal: gatewayResult.proposal, providerKey: gatewayResult.providerKey, modelKey: gatewayResult.modelKey })
    if (!isDecision(untrustedDecision)) {
      return markFailure({ assistanceId: requested.assistanceId, failureCode: "validation_failed", lifecycleClient: input.lifecycleClient })
    }
    decision = untrustedDecision
  } catch {
    return markFailure({ assistanceId: requested.assistanceId, failureCode: "validation_failed", lifecycleClient: input.lifecycleClient })
  }

  if (decision.decision === "apply") {
    const marked = await markCreativeDirectionApplied({ assistanceId: requested.assistanceId, proposal: gatewayResult.proposal }, input.lifecycleClient)
    if (marked.ok === true && marked.status === "applied") {
      return { ok: true, assistanceId: marked.assistanceId, status: "applied", proposal: gatewayResult.proposal, outputFingerprint: gatewayResult.outputFingerprint, idempotent: marked.idempotent }
    }
    return { ok: false, assistanceId: requested.assistanceId, error: "terminal_transition_failed", lifecycleError: marked.ok === false ? marked.error : undefined }
  }

  const marked = await markCreativeDirectionRejected({ assistanceId: requested.assistanceId, proposal: gatewayResult.proposal }, input.lifecycleClient)
  if (marked.ok === true && marked.status === "rejected") {
    return { ok: true, assistanceId: marked.assistanceId, status: "rejected", outputFingerprint: gatewayResult.outputFingerprint, idempotent: marked.idempotent }
  }
  return { ok: false, assistanceId: requested.assistanceId, error: "terminal_transition_failed", lifecycleError: marked.ok === false ? marked.error : undefined }
}
