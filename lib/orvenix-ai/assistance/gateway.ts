import {
  createDesignAssistanceOutputFingerprintV1,
  validateDesignAssistanceProposalV1,
  validateDesignAssistanceRequestV1,
  type DesignAssistanceFailureCodeV1,
  type DesignAssistanceProposalV1,
  type DesignAssistanceProviderV1,
  type DesignAssistanceRequestV1,
} from "./contract"

export type RequestDesignAssistanceInputV1 = {
  request: DesignAssistanceRequestV1
  provider: DesignAssistanceProviderV1
  providerKey: string
  modelKey: string
}

export type DesignAssistanceGatewayResultV1 =
  | {
      ok: true
      providerKey: string
      modelKey: string
      proposal: DesignAssistanceProposalV1
      outputFingerprint: string
    }
  | {
      ok: false
      providerKey: string
      modelKey: string
      failureCode: DesignAssistanceFailureCodeV1
    }

export class DesignAssistanceGatewayTimeoutErrorV1 extends Error {
  constructor() {
    super("Design assistance provider timed out.")
    this.name = "DesignAssistanceGatewayTimeoutErrorV1"
  }
}

const PROVIDER_MODEL_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/

function isProviderModelKey(value: unknown): value is string {
  return typeof value === "string" &&
    PROVIDER_MODEL_KEY_PATTERN.test(value) &&
    !/^(sk|rk)_(live|test)_|^whsec_/i.test(value)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function failure(
  input: Pick<RequestDesignAssistanceInputV1, "providerKey" | "modelKey">,
  failureCode: DesignAssistanceFailureCodeV1,
): DesignAssistanceGatewayResultV1 {
  return {
    ok: false,
    providerKey: input.providerKey,
    modelKey: input.modelKey,
    failureCode,
  }
}

function isTimeoutError(value: unknown) {
  return value instanceof DesignAssistanceGatewayTimeoutErrorV1
}

function proposalMatchesRequest(request: DesignAssistanceRequestV1, proposal: DesignAssistanceProposalV1) {
  return proposal.version === request.version &&
    proposal.roleKey === request.roleKey &&
    proposal.strategyKey === request.strategyKey
}

function proposalRespectsThemeConstraint(request: DesignAssistanceRequestV1, proposal: DesignAssistanceProposalV1) {
  const constraints = request.constraints
  if (constraints?.preserveTheme !== true || !constraints.theme) return true

  return Object.entries(constraints.theme).every(([key, value]) => {
    if (value === undefined) return true
    return proposal.theme[key as keyof DesignAssistanceProposalV1["theme"]] === value
  })
}

export async function requestDesignAssistanceV1(
  input: RequestDesignAssistanceInputV1,
): Promise<DesignAssistanceGatewayResultV1> {
  if (!isProviderModelKey(input.providerKey) || !isProviderModelKey(input.modelKey)) {
    return failure(input, "validation_failed")
  }

  const requestValidation = validateDesignAssistanceRequestV1(input.request)
  if (requestValidation.ok === false) {
    return failure(input, "validation_failed")
  }

  if (!input.provider || typeof input.provider !== "object" || typeof input.provider.request !== "function") {
    return failure(input, "provider_error")
  }

  let untrustedResult: unknown
  try {
    untrustedResult = await input.provider.request(requestValidation.value)
  } catch (error) {
    return failure(input, isTimeoutError(error) ? "timeout" : "provider_error")
  }

  if (!isPlainRecord(untrustedResult)) {
    return failure(input, "invalid_response")
  }

  const proposalValidation = validateDesignAssistanceProposalV1(untrustedResult)
  if (proposalValidation.ok === false) {
    return failure(input, "validation_failed")
  }

  const proposal = proposalValidation.value
  if (!proposalMatchesRequest(requestValidation.value, proposal)) {
    return failure(input, "validation_failed")
  }

  if (!proposalRespectsThemeConstraint(requestValidation.value, proposal)) {
    return failure(input, "validation_failed")
  }

  return {
    ok: true,
    providerKey: input.providerKey,
    modelKey: input.modelKey,
    proposal,
    outputFingerprint: createDesignAssistanceOutputFingerprintV1(proposal),
  }
}
