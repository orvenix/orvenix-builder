import {
  markDesignAssistanceApplied,
  markDesignAssistanceFailed,
  markDesignAssistanceRejected,
  recordDesignAssistanceRequested,
  type DesignAssistanceLifecycleClientV1,
  type DesignAssistanceLifecycleErrorCodeV1,
} from "./lifecycle"
import { requestDesignAssistanceV1 } from "./gateway"
import type {
  DesignAssistanceFailureCodeV1,
  DesignAssistanceProposalV1,
  DesignAssistanceProviderV1,
  DesignAssistanceRequestV1,
} from "./contract"

export type DesignAssistanceDecisionV1 =
  | { decision: "apply" }
  | { decision: "reject" }

export type DecideDesignAssistanceProposalInputV1 = {
  request: DesignAssistanceRequestV1
  proposal: DesignAssistanceProposalV1
  providerKey: string
  modelKey: string
}

export type RunDesignAssistanceInputV1 = {
  userId: string
  siteCreationAttemptId: string
  attemptKey: string
  request: DesignAssistanceRequestV1
  provider: DesignAssistanceProviderV1
  providerKey: string
  modelKey: string
  decideProposal: (input: DecideDesignAssistanceProposalInputV1) => DesignAssistanceDecisionV1 | Promise<DesignAssistanceDecisionV1>
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}

export type RunDesignAssistanceResultV1 =
  | {
      ok: true
      assistanceId: string
      status: "applied"
      proposal?: DesignAssistanceProposalV1
      outputFingerprint?: string
      idempotent: boolean
    }
  | {
      ok: true
      assistanceId: string
      status: "rejected"
      outputFingerprint?: string
      idempotent: boolean
    }
  | {
      ok: true
      assistanceId: string
      status: "failed"
      failureCode?: DesignAssistanceFailureCodeV1
      idempotent: boolean
    }
  | {
      ok: false
      assistanceId?: string
      error: DesignAssistanceOrchestrationErrorCodeV1
      lifecycleError?: DesignAssistanceLifecycleErrorCodeV1
    }

export type DesignAssistanceOrchestrationErrorCodeV1 =
  | "requested_failed"
  | "decision_failed"
  | "terminal_transition_failed"

function isTerminalStatus(status: string): status is "applied" | "rejected" | "failed" {
  return status === "applied" || status === "rejected" || status === "failed"
}

function isDecision(value: unknown): value is DesignAssistanceDecisionV1 {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    ((value as { decision?: unknown }).decision === "apply" || (value as { decision?: unknown }).decision === "reject")
}

async function markFailure(params: {
  assistanceId: string
  failureCode: DesignAssistanceFailureCodeV1
  lifecycleClient?: DesignAssistanceLifecycleClientV1
}): Promise<RunDesignAssistanceResultV1> {
  const marked = await markDesignAssistanceFailed({
    assistanceId: params.assistanceId,
    failureCode: params.failureCode,
  }, params.lifecycleClient)

  if (marked.ok === true && marked.status === "failed") {
    return {
      ok: true,
      assistanceId: marked.assistanceId,
      status: "failed",
      failureCode: params.failureCode,
      idempotent: marked.idempotent,
    }
  }

  return {
    ok: false,
    assistanceId: params.assistanceId,
    error: "terminal_transition_failed",
    lifecycleError: marked.ok === false ? marked.error : undefined,
  }
}

function terminalResult(params: {
  assistanceId: string
  status: "applied" | "rejected" | "failed"
  outputFingerprint?: string
  proposal?: DesignAssistanceProposalV1
  idempotent: boolean
}): RunDesignAssistanceResultV1 {
  if (params.status === "applied") {
    return {
      ok: true,
      assistanceId: params.assistanceId,
      status: "applied",
      ...(params.proposal ? { proposal: params.proposal } : {}),
      outputFingerprint: params.outputFingerprint,
      idempotent: true,
    }
  }

  if (params.status === "rejected") {
    return {
      ok: true,
      assistanceId: params.assistanceId,
      status: "rejected",
      outputFingerprint: params.outputFingerprint,
      idempotent: true,
    }
  }

  return {
    ok: true,
    assistanceId: params.assistanceId,
    status: "failed",
    idempotent: true,
  }
}

export async function runDesignAssistanceV1(
  input: RunDesignAssistanceInputV1,
): Promise<RunDesignAssistanceResultV1> {
  const requested = await recordDesignAssistanceRequested({
    userId: input.userId,
    siteCreationAttemptId: input.siteCreationAttemptId,
    attemptKey: input.attemptKey,
    request: input.request,
    providerKey: input.providerKey,
    modelKey: input.modelKey,
  }, input.lifecycleClient)

  if (requested.ok === false) {
    return {
      ok: false,
      error: "requested_failed",
      lifecycleError: requested.error,
    }
  }

  if (isTerminalStatus(requested.status)) {
    return terminalResult({
      assistanceId: requested.assistanceId,
      status: requested.status,
      outputFingerprint: requested.outputFingerprint,
      proposal: requested.proposal,
      idempotent: requested.idempotent,
    })
  }

  const gatewayResult = await requestDesignAssistanceV1({
    request: input.request,
    provider: input.provider,
    providerKey: input.providerKey,
    modelKey: input.modelKey,
  })

  if (gatewayResult.ok === false) {
    return markFailure({
      assistanceId: requested.assistanceId,
      failureCode: gatewayResult.failureCode,
      lifecycleClient: input.lifecycleClient,
    })
  }

  let decision: DesignAssistanceDecisionV1
  try {
    const untrustedDecision = await input.decideProposal({
      request: input.request,
      proposal: gatewayResult.proposal,
      providerKey: gatewayResult.providerKey,
      modelKey: gatewayResult.modelKey,
    })

    if (!isDecision(untrustedDecision)) {
      return markFailure({
        assistanceId: requested.assistanceId,
        failureCode: "validation_failed",
        lifecycleClient: input.lifecycleClient,
      })
    }

    decision = untrustedDecision
  } catch {
    return markFailure({
      assistanceId: requested.assistanceId,
      failureCode: "validation_failed",
      lifecycleClient: input.lifecycleClient,
    })
  }

  if (decision.decision === "apply") {
    const marked = await markDesignAssistanceApplied({
      assistanceId: requested.assistanceId,
      proposal: gatewayResult.proposal,
    }, input.lifecycleClient)

    if (marked.ok === true && marked.status === "applied") {
      return {
        ok: true,
        assistanceId: marked.assistanceId,
        status: "applied",
        proposal: gatewayResult.proposal,
        outputFingerprint: gatewayResult.outputFingerprint,
        idempotent: marked.idempotent,
      }
    }

    return {
      ok: false,
      assistanceId: requested.assistanceId,
      error: "terminal_transition_failed",
      lifecycleError: marked.ok === false ? marked.error : undefined,
    }
  }

  const marked = await markDesignAssistanceRejected({
    assistanceId: requested.assistanceId,
    proposal: gatewayResult.proposal,
  }, input.lifecycleClient)

  if (marked.ok === true && marked.status === "rejected") {
    return {
      ok: true,
      assistanceId: marked.assistanceId,
      status: "rejected",
      outputFingerprint: gatewayResult.outputFingerprint,
      idempotent: marked.idempotent,
    }
  }

  return {
    ok: false,
    assistanceId: requested.assistanceId,
    error: "terminal_transition_failed",
    lifecycleError: marked.ok === false ? marked.error : undefined,
  }
}
