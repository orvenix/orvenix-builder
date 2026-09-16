import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  DesignAssistanceGatewayTimeoutErrorV1,
  createDesignAssistanceOutputFingerprintV1,
  createDeterministicDesignAssistanceProviderV1,
  requestDesignAssistanceV1,
  validateDesignAssistanceProposalV1,
  type DesignAssistanceProposalV1,
  type DesignAssistanceProviderV1,
  type DesignAssistanceRequestV1,
} from "../../lib/orvenix-ai/assistance"

const baseRequest: DesignAssistanceRequestV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  context: {
    industryBucket: "health",
    objectiveBucket: "lead_generation",
    styleBucket: "premium",
    siteType: "clinic",
  },
}

const baseProposal: DesignAssistanceProposalV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  theme: {
    mode: "light",
    accentHue: "blue",
    contrastBucket: "high",
    radiusBucket: "soft",
    typographyBucket: "sans",
    motionBucket: "subtle",
  },
}

function providerReturning(value: unknown): DesignAssistanceProviderV1 {
  return {
    async request() {
      return value as DesignAssistanceProposalV1
    },
  }
}

function gateway(provider: DesignAssistanceProviderV1, request = baseRequest) {
  return requestDesignAssistanceV1({
    request,
    provider,
    providerKey: "deterministic_test",
    modelKey: "theme_v1",
  })
}

test("valid request + provider produce success", async () => {
  const result = await gateway(createDeterministicDesignAssistanceProviderV1())

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.proposal.roleKey, baseRequest.roleKey)
    assert.equal(result.proposal.strategyKey, baseRequest.strategyKey)
  }
})

test("proposal valida retorna fingerprint calculado por Gateway", async () => {
  const result = await gateway(providerReturning(baseProposal))

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.outputFingerprint, createDesignAssistanceOutputFingerprintV1(baseProposal))
  }
})

test("mismo request/provider produce resultado deterministico", async () => {
  const provider = createDeterministicDesignAssistanceProviderV1()
  const first = await gateway(provider)
  const second = await gateway(provider)

  assert.deepEqual(first, second)
})

test("provider identity preservada", async () => {
  const result = await requestDesignAssistanceV1({
    request: baseRequest,
    provider: providerReturning(baseProposal),
    providerKey: "provider_a",
    modelKey: "model_a",
  })

  assert.equal(result.providerKey, "provider_a")
  assert.equal(result.modelKey, "model_a")
})

test("role mismatch produce validation_failed", async () => {
  const result = await gateway(providerReturning({
    ...baseProposal,
    roleKey: "other_role",
  }))

  assert.deepEqual(result, {
    ok: false,
    providerKey: "deterministic_test",
    modelKey: "theme_v1",
    failureCode: "validation_failed",
  })
})

test("strategy mismatch produce validation_failed", async () => {
  const result = await gateway(providerReturning({
    ...baseProposal,
    strategyKey: "other_strategy",
  }))

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("invalid proposal produce controlled failure", async () => {
  const result = await gateway(providerReturning({
    ...baseProposal,
    theme: {
      accentHue: "ultraviolet",
    },
  }))

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("arbitrary provider object rechazado", async () => {
  const result = await requestDesignAssistanceV1({
    request: baseRequest,
    provider: {} as DesignAssistanceProviderV1,
    providerKey: "provider_a",
    modelKey: "model_a",
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "provider_error")
})

test("provider throws produce provider_error", async () => {
  const result = await gateway({
    async request() {
      throw new Error("private provider error")
    },
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "provider_error")
})

test("provider rejected promise produce provider_error", async () => {
  const result = await gateway({
    request() {
      return Promise.reject(new Error("private provider rejection"))
    },
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "provider_error")
})

test("controlled timeout produce timeout", async () => {
  const result = await gateway({
    async request() {
      throw new DesignAssistanceGatewayTimeoutErrorV1()
    },
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "timeout")
})

test("no retry automatico y provider llamado exactamente una vez", async () => {
  let calls = 0
  const result = await gateway({
    async request() {
      calls += 1
      throw new Error("single failure")
    },
  })

  assert.equal(result.ok, false)
  assert.equal(calls, 1)
})

test("no fallback provider", async () => {
  let fallbackCalls = 0
  const fallback = {
    async request() {
      fallbackCalls += 1
      return baseProposal
    },
  }

  const result = await gateway({
    async request() {
      void fallback
      throw new Error("primary failed")
    },
  })

  assert.equal(result.ok, false)
  assert.equal(fallbackCalls, 0)
})

test("provider no puede suministrar fingerprint", async () => {
  const result = await gateway(providerReturning({
    ...baseProposal,
    outputFingerprint: "a".repeat(64),
  }))

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("preserveTheme respetado", async () => {
  const request: DesignAssistanceRequestV1 = {
    ...baseRequest,
    constraints: {
      preserveTheme: true,
      theme: {
        accentHue: "purple",
        motionBucket: "none",
      },
    },
  }
  const result = await gateway(createDeterministicDesignAssistanceProviderV1(), request)

  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.proposal.theme.accentHue, "purple")
    assert.equal(result.proposal.theme.motionBucket, "none")
  }
})

test("incompatible preserveTheme rechazado", async () => {
  const request: DesignAssistanceRequestV1 = {
    ...baseRequest,
    constraints: {
      preserveTheme: true,
      theme: {
        accentHue: "purple",
      },
    },
  }
  const result = await gateway(providerReturning(baseProposal), request)

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("preserveStyle no inventa heuristica", async () => {
  const request: DesignAssistanceRequestV1 = {
    ...baseRequest,
    constraints: {
      preserveStyle: true,
    },
  }
  const result = await gateway(providerReturning(baseProposal), request)

  assert.equal(result.ok, true)
})

test("deterministic test provider produce proposal valida", async () => {
  const proposal = await createDeterministicDesignAssistanceProviderV1().request(baseRequest)

  assert.equal(validateDesignAssistanceProposalV1(proposal).ok, true)
})

test("deterministic provider misma entrada produce misma salida", async () => {
  const provider = createDeterministicDesignAssistanceProviderV1()

  assert.deepEqual(await provider.request(baseRequest), await provider.request(baseRequest))
})

test("deterministic provider no randomness, clock, network ni DB", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/orvenix-ai/assistance/testing/deterministic-provider.ts"),
    "utf-8",
  )

  assert.equal(/Math\.random|crypto|randomUUID|Date\.now|new Date|fetch\(|XMLHttpRequest|editorPrisma|prisma/i.test(source), false)
})

test("Gateway no importa Prisma, lifecycle ni DesignGeneration", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/gateway.ts"), "utf-8")

  assert.equal(/from "\.\/lifecycle"|from '\.\/lifecycle'/.test(source), false)
  assert.equal(/prisma|editorPrisma|DesignGeneration|designGeneration/i.test(source), false)
})

test("Gateway no crea attribution", async () => {
  const result = await gateway(providerReturning(baseProposal))

  assert.equal(result.ok, true)
  assert.equal("assistanceId" in result, false)
  assert.equal("status" in result, false)
})

test("Gateway no expone raw response", async () => {
  const result = await gateway(providerReturning(baseProposal))

  assert.equal(result.ok, true)
  assert.equal("raw" in result, false)
  assert.equal("rawOutput" in result, false)
  assert.equal("response" in result, false)
})

test("Gateway no acepta secrets en provider identity", async () => {
  const result = await requestDesignAssistanceV1({
    request: baseRequest,
    provider: providerReturning(baseProposal),
    providerKey: "sk_test_secret",
    modelKey: "model_a",
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("Gateway no decide applied/rejected", async () => {
  const result = await gateway(providerReturning(baseProposal))

  assert.equal(result.ok, true)
  assert.equal("applied" in result, false)
  assert.equal("rejected" in result, false)
})

test("invalid_response para output no interpretable", async () => {
  const result = await gateway(providerReturning(null))

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "invalid_response")
})

test("validation_failed para estructura interpretable que viola contrato", async () => {
  const result = await gateway(providerReturning({
    ...baseProposal,
    theme: {},
  }))

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("input request no mutado", async () => {
  const request = structuredClone(baseRequest)
  const before = structuredClone(request)

  await gateway(createDeterministicDesignAssistanceProviderV1(), request)

  assert.deepEqual(request, before)
})

test("proposal no mutada por Gateway", async () => {
  const proposal = structuredClone(baseProposal)
  const before = structuredClone(proposal)

  await gateway(providerReturning(proposal))

  assert.deepEqual(proposal, before)
})

test("no private data añadida al resultado", async () => {
  const result = await gateway(providerReturning(baseProposal))

  assert.equal(JSON.stringify(result).includes("private"), false)
  assert.equal("userId" in result, false)
  assert.equal("siteId" in result, false)
  assert.equal("request" in result, false)
})
