import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  DESIGN_ASSISTANCE_FAILURE_CODES_V1,
  DESIGN_ASSISTANCE_ROLE_KEYS_V1,
  DESIGN_ASSISTANCE_STATUSES_V1,
  DESIGN_ASSISTANCE_STRATEGY_KEYS_V1,
  canonicalDesignAssistanceJsonV1,
  createDesignAssistanceInputFingerprintV1,
  createDesignAssistanceOutputFingerprintV1,
  validateDesignAssistanceAttributionV1,
  validateDesignAssistanceProposalV1,
  validateDesignAssistanceRequestV1,
  type DesignAssistanceAttributionV1,
  type DesignAssistanceProposalV1,
  type DesignAssistanceRequestV1,
} from "../../lib/orvenix-ai/assistance"

const request: DesignAssistanceRequestV1 = {
  version: 1,
  roleKey: "theme_direction_advisor_v1",
  strategyKey: "theme_bucket_recommendation_v1",
  context: {
    industryBucket: "health",
    objectiveBucket: "lead_generation",
    styleBucket: "premium",
    siteType: "health",
  },
  constraints: {
    preserveStyle: true,
  },
}

const proposal: DesignAssistanceProposalV1 = {
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

function inputFingerprint() {
  return createDesignAssistanceInputFingerprintV1(request)
}

function outputFingerprint() {
  return createDesignAssistanceOutputFingerprintV1(proposal)
}

function attribution(status: DesignAssistanceAttributionV1["status"]): Record<string, unknown> {
  return {
    version: 1,
    roleKey: "theme_direction_advisor_v1",
    strategyKey: "theme_bucket_recommendation_v1",
    providerKey: "provider_a",
    modelKey: "model_x-1",
    status,
    inputFingerprint: inputFingerprint(),
    ...(
      status === "applied" || status === "rejected"
        ? { outputFingerprint: outputFingerprint() }
        : {}
    ),
    ...(status === "failed" ? { failureCode: "timeout" } : {}),
  }
}

test("request V1 valido", () => {
  const result = validateDesignAssistanceRequestV1(request)
  assert.equal(result.ok, true)
})

test("proposal V1 valida", () => {
  const result = validateDesignAssistanceProposalV1(proposal)
  assert.equal(result.ok, true)
})

test("attribution requested valida", () => {
  assert.equal(validateDesignAssistanceAttributionV1(attribution("requested")).ok, true)
})

test("attribution applied valida", () => {
  assert.equal(validateDesignAssistanceAttributionV1(attribution("applied")).ok, true)
})

test("attribution rejected valida", () => {
  assert.equal(validateDesignAssistanceAttributionV1(attribution("rejected")).ok, true)
})

test("attribution failed valida", () => {
  assert.equal(validateDesignAssistanceAttributionV1(attribution("failed")).ok, true)
})

test("applied requiere outputFingerprint", () => {
  const result = validateDesignAssistanceAttributionV1({
    ...attribution("applied"),
    outputFingerprint: undefined,
  })
  assert.equal(result.ok, false)
})

test("rejected requiere outputFingerprint", () => {
  const result = validateDesignAssistanceAttributionV1({
    ...attribution("rejected"),
    outputFingerprint: undefined,
  })
  assert.equal(result.ok, false)
})

test("requested rechaza outputFingerprint", () => {
  const result = validateDesignAssistanceAttributionV1({
    ...attribution("requested"),
    outputFingerprint: outputFingerprint(),
  })
  assert.equal(result.ok, false)
})

test("failed rechaza outputFingerprint", () => {
  const result = validateDesignAssistanceAttributionV1({
    ...attribution("failed"),
    outputFingerprint: outputFingerprint(),
  })
  assert.equal(result.ok, false)
})

test("role desconocido rechazado", () => {
  assert.equal(validateDesignAssistanceRequestV1({ ...request, roleKey: "copy_advisor_v1" }).ok, false)
})

test("strategy desconocida rechazada", () => {
  assert.equal(validateDesignAssistanceProposalV1({ ...proposal, strategyKey: "freeform_strategy" }).ok, false)
})

test("providerKey invalido rechazado", () => {
  assert.equal(validateDesignAssistanceAttributionV1({ ...attribution("requested"), providerKey: "Provider A" }).ok, false)
})

test("modelKey invalido rechazado", () => {
  assert.equal(validateDesignAssistanceAttributionV1({ ...attribution("requested"), modelKey: "modelo/externo" }).ok, false)
})

test("input fingerprint deterministico", () => {
  assert.equal(inputFingerprint(), inputFingerprint())
})

test("input fingerprint independiente del orden de keys", () => {
  const reordered = {
    strategyKey: request.strategyKey,
    context: {
      siteType: "health",
      styleBucket: "premium",
      objectiveBucket: "lead_generation",
      industryBucket: "health",
    },
    constraints: {
      preserveStyle: true,
    },
    roleKey: request.roleKey,
    version: 1,
  } as DesignAssistanceRequestV1

  assert.equal(createDesignAssistanceInputFingerprintV1(reordered), inputFingerprint())
})

test("output fingerprint deterministico", () => {
  assert.equal(outputFingerprint(), outputFingerprint())
})

test("output fingerprint independiente del orden", () => {
  const reordered = {
    strategyKey: proposal.strategyKey,
    theme: {
      motionBucket: "subtle",
      typographyBucket: "sans",
      radiusBucket: "soft",
      contrastBucket: "high",
      accentHue: "blue",
      mode: "light",
    },
    roleKey: proposal.roleKey,
    version: 1,
  } as DesignAssistanceProposalV1

  assert.equal(createDesignAssistanceOutputFingerprintV1(reordered), outputFingerprint())
})

test("fingerprints tienen 64 lowercase hex", () => {
  assert.match(inputFingerprint(), /^[a-f0-9]{64}$/)
  assert.match(outputFingerprint(), /^[a-f0-9]{64}$/)
})

test("provider/model no afectan inputFingerprint", () => {
  const first = validateDesignAssistanceAttributionV1({
    ...attribution("applied"),
    providerKey: "provider_a",
    modelKey: "model_1",
  })
  const second = validateDesignAssistanceAttributionV1({
    ...attribution("applied"),
    providerKey: "provider_b",
    modelKey: "model_2",
  })

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.equal(inputFingerprint(), inputFingerprint())
})

test("timestamps no forman parte del fingerprint", () => {
  const withTimestamp = {
    ...request,
    requestedAt: "2026-09-15T00:00:00.000Z",
  }

  assert.equal(validateDesignAssistanceRequestV1(withTimestamp).ok, false)
  assert.equal(createDesignAssistanceInputFingerprintV1(request), inputFingerprint())
})

test("propuesta no puede contener arbitrary text", () => {
  assert.equal(validateDesignAssistanceProposalV1({
    ...proposal,
    instruction: "usa un hero futurista",
  }).ok, false)
})

test("request no acepta datos privados", () => {
  for (const key of ["userId", "siteId", "request", "businessName", "phone", "email", "url", "image", "prompt", "apiKey"]) {
    assert.equal(validateDesignAssistanceRequestV1({ ...request, [key]: "private" }).ok, false, key)
  }
})

test("proposal no acepta datos privados", () => {
  for (const key of ["response", "rawOutput", "email", "phone", "url", "image", "prompt"]) {
    assert.equal(validateDesignAssistanceProposalV1({ ...proposal, [key]: "private" }).ok, false, key)
  }
})

test("attribution no acepta datos privados", () => {
  for (const key of ["userId", "siteId", "request", "initialPlan", "rawInput", "rawOutput", "apiKey"]) {
    assert.equal(validateDesignAssistanceAttributionV1({ ...attribution("applied"), [key]: "private" }).ok, false, key)
  }
})

test("attribution no contiene Outcome ni Ranking", () => {
  for (const key of ["outcomeScore", "editDistance", "publishRate", "rankingScore"]) {
    assert.equal(validateDesignAssistanceAttributionV1({ ...attribution("applied"), [key]: 1 }).ok, false, key)
  }
})

test("misma semantica produce mismo fingerprint", () => {
  const normalized = validateDesignAssistanceRequestV1(JSON.parse(JSON.stringify(request)))
  assert.equal(normalized.ok, true)
  assert.equal(createDesignAssistanceInputFingerprintV1(normalized.value), inputFingerprint())
})

test("cambio semantico produce fingerprint diferente", () => {
  const changed: DesignAssistanceRequestV1 = {
    ...request,
    context: {
      ...request.context,
      styleBucket: "minimal",
    },
  }

  assert.notEqual(createDesignAssistanceInputFingerprintV1(changed), inputFingerprint())
})

test("no randomness", () => {
  const values = new Set(Array.from({ length: 20 }, () => createDesignAssistanceOutputFingerprintV1(proposal)))
  assert.equal(values.size, 1)
})

test("no Prisma import", () => {
  const source = readFileSync(join(process.cwd(), "lib/orvenix-ai/assistance/contract.ts"), "utf-8")
  assert.equal(/prisma/i.test(source), false)
})

test("preserveTheme requiere theme abstracto", () => {
  assert.equal(validateDesignAssistanceRequestV1({
    ...request,
    constraints: {
      preserveTheme: true,
    },
  }).ok, false)
})

test("canonicalizacion rechaza JSON no valido", () => {
  assert.throws(() => canonicalDesignAssistanceJsonV1({ value: Number.NaN }))
})


test("schema DesignAssistance conserva los campos contract V1", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/editor.prisma"), "utf-8")
  const model = schema.slice(
    schema.indexOf("model DesignAssistance {"),
    schema.indexOf("\nmodel AiGenerationJob {"),
  )

  for (const field of [
    "siteCreationAttemptId String",
    "version            Int              @default(1)",
    "roleKey            String           @db.VarChar(64)",
    "strategyKey        String           @db.VarChar(64)",
    "providerKey        String           @db.VarChar(64)",
    "modelKey           String           @db.VarChar(64)",
    "status             String           @db.VarChar(32)",
    "inputFingerprint   String           @db.VarChar(64)",
    "attemptKey         String           @db.VarChar(96)",
    "outputFingerprint  String?          @db.VarChar(64)",
    "appliedProposal   Json?",
    "failureCode        String?          @db.VarChar(32)",
    "requestedAt        DateTime         @default(now())",
    "completedAt        DateTime?",
  ]) {
    assert.ok(model.includes(field), field)
  }

  assert.ok(model.includes("@@map(\"design_assistances\")"))
  assert.ok(model.includes('@relation("SiteCreationAttemptDesignAssistances", fields: [siteCreationAttemptId], references: [id], onDelete: Cascade)'))

  const generationModel = schema.slice(
    schema.indexOf("model DesignGeneration {"),
    schema.indexOf("\nmodel DesignAssistance {"),
  )
  assert.ok(generationModel.includes("siteCreationAttemptId String?"))
  assert.ok(generationModel.includes('@relation("SiteCreationAttemptDesignGeneration", fields: [siteCreationAttemptId], references: [id], onDelete: SetNull)'))
})

test("schema DesignAssistance define indices simples para analytics V1", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/editor.prisma"), "utf-8")
  const model = schema.slice(
    schema.indexOf("model DesignAssistance {"),
    schema.indexOf("\nmodel AiGenerationJob {"),
  )

  assert.ok(model.includes("@@index([siteCreationAttemptId])"))
  assert.ok(model.includes("@@index([strategyKey, providerKey, modelKey, status])"))
  assert.ok(model.includes("@@index([inputFingerprint])"))
  assert.ok(model.includes("@@index([status])"))
  assert.equal(model.includes("@@unique"), false)
})

test("schema DesignAssistance no duplica contexto ni outcome", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/editor.prisma"), "utf-8")
  const model = schema.slice(
    schema.indexOf("model DesignAssistance {"),
    schema.indexOf("\nmodel AiGenerationJob {"),
  )
  const fieldNames = model
    .split("\n")
    .map((line) => line.trim().match(/^([A-Za-z][A-Za-z0-9_]*)\s+/)?.[1]?.toLowerCase())
    .filter(Boolean)

  for (const forbidden of [
    "request",
    "prompt",
    "response",
    "rawinput",
    "rawoutput",
    "businessname",
    "phone",
    "email",
    "url",
    "image",
    "apikey",
    "initialplan",
    "proposal",
    "rejectedproposal",
    "planv2",
    "outcomescore",
    "editdistance",
    "rankingscore",
    "industrybucket",
    "objectivebucket",
    "stylebucket",
    "sitetype",
  ]) {
    assert.equal(fieldNames.includes(forbidden), false, forbidden)
  }
})

test("migracion DesignAssistance respeta relationMode prisma sin FK SQL manual", () => {
  const sql = readFileSync(
    join(process.cwd(), "prisma/migrations/20260915001000_add_design_assistance_attribution/migration.sql"),
    "utf-8",
  )

  assert.ok(sql.includes("CREATE TABLE `design_assistances`"))
  assert.ok(sql.includes("`siteCreationAttemptId` VARCHAR(191) NOT NULL"))
  assert.ok(sql.includes("`attemptKey` VARCHAR(96) NOT NULL"))
  assert.ok(sql.includes("`siteCreationAttemptId` VARCHAR(191) NULL"))
  assert.equal(/FOREIGN\s+KEY/i.test(sql), false)
  assert.equal(/CONSTRAINT/i.test(sql), false)
})

test("schema/contract V1 mantienen semantica en TypeScript y no en enums Prisma", () => {
  const schema = readFileSync(join(process.cwd(), "prisma/editor.prisma"), "utf-8")
  const model = schema.slice(
    schema.indexOf("model DesignAssistance {"),
    schema.indexOf("\nmodel AiGenerationJob {"),
  )

  assert.deepEqual(DESIGN_ASSISTANCE_ROLE_KEYS_V1, ["theme_direction_advisor_v1"])
  assert.deepEqual(DESIGN_ASSISTANCE_STRATEGY_KEYS_V1, ["theme_bucket_recommendation_v1"])
  assert.deepEqual(DESIGN_ASSISTANCE_STATUSES_V1, ["requested", "applied", "rejected", "failed"])
  assert.deepEqual(DESIGN_ASSISTANCE_FAILURE_CODES_V1, ["timeout", "provider_error", "invalid_response", "validation_failed"])
  assert.equal(/enum\s+DesignAssistance/i.test(schema), false)
  assert.ok(model.includes("status             String"))
  assert.ok(model.includes("failureCode        String?"))
})
