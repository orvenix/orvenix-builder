import {
  createCreativeDirectorOutputFingerprintV1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorFailureCodeV1,
  type CreativeDirectorProviderV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "./contract"

/**
 * V2-4: mirrors assistance/gateway.ts's revalidate-everything discipline
 * exactly, retargeted at the new contract. SCHEMA validation only -- the
 * semantic/fact-safety sweep (fact-validation.ts) runs afterward, on the
 * caller side, so a schema-invalid response never reaches it.
 */

export type RequestCreativeDirectionInputV1 = {
  request: CreativeDirectorRequestV1
  provider: CreativeDirectorProviderV1
  providerKey: string
  modelKey: string
}

export type CreativeDirectorGatewayResultV1 =
  | {
      ok: true
      providerKey: string
      modelKey: string
      proposal: CreativeSiteDirectionV1
      outputFingerprint: string
    }
  | {
      ok: false
      providerKey: string
      modelKey: string
      failureCode: CreativeDirectorFailureCodeV1
    }

export class CreativeDirectorGatewayTimeoutErrorV1 extends Error {
  constructor() {
    super("Creative Director provider timed out.")
    this.name = "CreativeDirectorGatewayTimeoutErrorV1"
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
  input: Pick<RequestCreativeDirectionInputV1, "providerKey" | "modelKey">,
  failureCode: CreativeDirectorFailureCodeV1,
): CreativeDirectorGatewayResultV1 {
  return { ok: false, providerKey: input.providerKey, modelKey: input.modelKey, failureCode }
}

function isTimeoutError(value: unknown) {
  return value instanceof CreativeDirectorGatewayTimeoutErrorV1
}

function proposalMatchesRequest(request: CreativeDirectorRequestV1, proposal: CreativeSiteDirectionV1) {
  return proposal.version === request.version && proposal.roleKey === request.roleKey && proposal.strategyKey === request.strategyKey
}

/** A proposal must only direct pages the request actually described -- never a slug the architecture doesn't have. */
function proposalOnlyReferencesRequestedPages(request: CreativeDirectorRequestV1, proposal: CreativeSiteDirectionV1) {
  const requestedSlugs = new Set(request.pages.map((page) => page.slug))
  return proposal.pageDirections.every((direction) => requestedSlugs.has(direction.slug))
}

export async function requestCreativeDirectionV1(
  input: RequestCreativeDirectionInputV1,
): Promise<CreativeDirectorGatewayResultV1> {
  if (!isProviderModelKey(input.providerKey) || !isProviderModelKey(input.modelKey)) {
    return failure(input, "validation_failed")
  }

  if (!input.provider || typeof input.provider !== "object" || typeof input.provider.request !== "function") {
    return failure(input, "provider_error")
  }

  let untrustedResult: unknown
  try {
    untrustedResult = await input.provider.request(input.request)
  } catch (error) {
    return failure(input, isTimeoutError(error) ? "timeout" : "provider_error")
  }

  if (!isPlainRecord(untrustedResult)) {
    return failure(input, "invalid_response")
  }

  const proposalValidation = validateCreativeSiteDirectionV1(untrustedResult)
  if (proposalValidation.ok === false) {
    return failure(input, "validation_failed")
  }

  const proposal = proposalValidation.value
  if (!proposalMatchesRequest(input.request, proposal) || !proposalOnlyReferencesRequestedPages(input.request, proposal)) {
    return failure(input, "validation_failed")
  }

  return {
    ok: true,
    providerKey: input.providerKey,
    modelKey: input.modelKey,
    proposal,
    outputFingerprint: createCreativeDirectorOutputFingerprintV1(proposal),
  }
}
