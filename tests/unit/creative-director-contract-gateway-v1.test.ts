import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  CREATIVE_DIRECTOR_HERO_VARIANTS_V1,
  createCreativeDirectorInputFingerprintV1,
  createCreativeDirectorOutputFingerprintV1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { CreativeDirectorGatewayTimeoutErrorV1, requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { HERO_VARIANTS } from "../../lib/orvenix-ai/composer/composition-context"

// ---------------------------------------------------------------------------
// V2-4: CreativeSiteDirectionV1 contract + gateway. Mirrors the proven
// assistance/contract.ts + gateway.ts validation discipline (bounded enums,
// closed-shape allowlisting, canonical-JSON fingerprinting, revalidate
// everything regardless of what the provider claims).
// ---------------------------------------------------------------------------

const baseRequest: CreativeDirectorRequestV1 = {
  version: 1,
  roleKey: "creative_director_v1",
  strategyKey: "site_narrative_v1",
  business: {
    name: "Centro de Fisioterapia Monterrey",
    industry: "fisioterapia",
    location: "Monterrey",
    objective: "Conseguir citas de valoración",
    services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
  },
  designMemory: { industryBucket: "health", objectiveBucket: "lead_generation", styleBucket: "professional", siteType: "health" },
  pages: [
    { slug: "home", purpose: "Presentar la clinica.", archetype: "overview", availableRoles: ["navigation", "hero", "trust", "services", "cta", "footer"], requiredRoles: ["navigation", "hero", "trust", "services", "cta", "footer"], defaultOrder: ["navigation", "hero", "trust", "services", "cta", "footer"] },
    { slug: "servicios", purpose: "Detallar servicios.", archetype: "catalog", availableRoles: ["navigation", "hero", "services", "faq", "cta", "footer"], requiredRoles: ["navigation", "hero", "services", "faq", "cta", "footer"], defaultOrder: ["navigation", "hero", "services", "faq", "cta", "footer"] },
  ],
}

function validProposal(overrides: Partial<CreativeSiteDirectionV1> = {}): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "Clinica de fisioterapia enfocada en recuperacion deportiva.",
    tone: "warm",
    visualDirection: { accentHue: "blue", radiusBucket: "soft" },
    density: "standard",
    pageDirections: [
      {
        slug: "home",
        narrativeGoal: "Presentar la clinica y su enfoque en fisioterapia deportiva.",
        heroDirection: { emphasis: "offering", preferredOfferingName: "Fisioterapia deportiva" },
        heroTitleSuggestion: "Recupera tu movimiento con fisioterapia deportiva",
        heroDescriptionSuggestion: "Centro de Fisioterapia Monterrey te acompaña en tu recuperacion.",
        preferredHeroVariant: "split-left",
        highlightedOfferings: ["Fisioterapia deportiva", "Rehabilitación postoperatoria"],
        ctaIntent: "appointment",
        assetIntent: { subject: "physical therapist treating athlete knee", mood: "clinical, calm" },
        preferredSectionOrder: ["navigation", "hero", "trust", "services", "cta", "footer"],
      },
    ],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Contract: schema validation
// ---------------------------------------------------------------------------

test("valid CreativeSiteDirectionV1 passes validation", () => {
  const result = validateCreativeSiteDirectionV1(validProposal())
  assert.equal(result.ok, true)
})

test("rejects unrecognized top-level fields (closed shape)", () => {
  const result = validateCreativeSiteDirectionV1({ ...validProposal(), extraField: "should not be allowed" })
  assert.equal(result.ok, false)
})

test("rejects private/PII-shaped field names anywhere in the shape", () => {
  const proposal = validProposal() as unknown as Record<string, unknown>
  const result = validateCreativeSiteDirectionV1({ ...proposal, userId: "should never validate" })
  assert.equal(result.ok, false)
})

test("rejects heroTitleSuggestion over 80 chars", () => {
  const proposal = validProposal()
  proposal.pageDirections[0].heroTitleSuggestion = "x".repeat(81)
  const result = validateCreativeSiteDirectionV1(proposal)
  // Oversized heroTitleSuggestion is simply dropped (undefined), not a hard reject -- proposal still validates minus that field.
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pageDirections[0].heroTitleSuggestion, undefined)
})

test("rejects heroDescriptionSuggestion over 180 chars (dropped, not hard-rejected)", () => {
  const proposal = validProposal()
  proposal.pageDirections[0].heroDescriptionSuggestion = "x".repeat(181)
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pageDirections[0].heroDescriptionSuggestion, undefined)
})

test("rejects more than 2 highlightedOfferings", () => {
  const proposal = validProposal()
  proposal.pageDirections[0].highlightedOfferings = ["A", "B", "C"]
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pageDirections[0].highlightedOfferings, undefined)
})

test("drops an invalid preferredHeroVariant enum value, keeps the rest of the direction (section 8)", () => {
  const proposal = validProposal() as unknown as { pageDirections: Array<Record<string, unknown>> }
  proposal.pageDirections[0].preferredHeroVariant = "fullscreen-carousel"
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.pageDirections[0].preferredHeroVariant, undefined)
    // Independent guidance on the SAME direction survives.
    assert.equal(result.value.pageDirections[0].heroTitleSuggestion, "Recupera tu movimiento con fisioterapia deportiva")
  }
})

test("drops assetIntent entirely when subject contains a URL (never a hard reject)", () => {
  const proposal = validProposal()
  proposal.pageDirections[0].assetIntent = { subject: "visit https://example.com now" }
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pageDirections[0].assetIntent, undefined)
})

test("drops assetIntent when subject is over 60 chars", () => {
  const proposal = validProposal()
  proposal.pageDirections[0].assetIntent = { subject: "x".repeat(61) }
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pageDirections[0].assetIntent, undefined)
})

test("drops only the unrecognized visualDirection axis, keeps the proposal valid", () => {
  const proposal = validProposal() as unknown as { visualDirection: Record<string, unknown> }
  proposal.visualDirection = { accentHue: "invisible-pink" }
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.visualDirection, undefined)
})

test("R) one pageDirection with a missing slug is dropped; a sibling VALID pageDirection still survives", () => {
  const proposal = validProposal()
  proposal.pageDirections.push({ slug: "servicios", narrativeGoal: "Detallar servicios reales." })
  ;(proposal.pageDirections[0] as unknown as Record<string, unknown>).slug = "NOT A VALID SLUG!!"
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.pageDirections.length, 1)
    assert.equal(result.value.pageDirections[0].slug, "servicios")
  }
})

test("whole proposal fails when EVERY pageDirection is invalid (nothing usable remains)", () => {
  const proposal = validProposal()
  ;(proposal.pageDirections[0] as unknown as Record<string, unknown>).slug = "NOT A VALID SLUG!!"
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, false)
})

test("rejects more than 8 pageDirections", () => {
  const proposal = validProposal()
  proposal.pageDirections = Array.from({ length: 9 }, (_, i) => ({ slug: `page-${i}`, narrativeGoal: "x" }))
  const result = validateCreativeSiteDirectionV1(proposal)
  assert.equal(result.ok, false)
})

test("CREATIVE_DIRECTOR_HERO_VARIANTS_V1 matches composition-context.ts's HERO_VARIANTS exactly", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_HERO_VARIANTS_V1].sort(), [...HERO_VARIANTS].sort())
})

// ---------------------------------------------------------------------------
// Fingerprinting
// ---------------------------------------------------------------------------

test("input fingerprint is deterministic for identical requests", () => {
  const a = createCreativeDirectorInputFingerprintV1(baseRequest)
  const b = createCreativeDirectorInputFingerprintV1(structuredClone(baseRequest))
  assert.equal(a, b)
  assert.match(a, /^[a-f0-9]{64}$/)
})

test("output fingerprint changes when the proposal changes", () => {
  const a = createCreativeDirectorOutputFingerprintV1(validProposal())
  const b = createCreativeDirectorOutputFingerprintV1(validProposal({ siteNarrative: "Una narrativa distinta." }))
  assert.notEqual(a, b)
})

// ---------------------------------------------------------------------------
// Gateway: revalidates everything, never trusts the provider
// ---------------------------------------------------------------------------

test("W/Y) gateway: provider timeout resolves to a clean failure, never throws", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => { throw new CreativeDirectorGatewayTimeoutErrorV1() } },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "timeout")
})

test("X) gateway: generic provider error resolves to provider_error", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => { throw new Error("network down") } },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "provider_error")
})

test("Y) gateway: invalid JSON shape (schema-invalid) resolves to validation_failed, not a throw", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => ({ not_a_valid_shape: true }) as unknown as CreativeSiteDirectionV1 },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("gateway: null provider response resolves to invalid_response", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => null },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "invalid_response")
})

test("gateway: proposal referencing a page slug NOT in the request is rejected", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => validProposal({ pageDirections: [{ slug: "an-unrequested-page", narrativeGoal: "x" }] }) },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

test("gateway: valid, matching proposal is accepted", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => validProposal() },
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.proposal.siteNarrative, "Clinica de fisioterapia enfocada en recuperacion deportiva.")
    assert.match(result.outputFingerprint, /^[a-f0-9]{64}$/)
  }
})

test("gateway: rejects a secret-shaped providerKey (defense in depth)", async () => {
  const result = await requestCreativeDirectionV1({
    request: baseRequest,
    provider: { request: async () => validProposal() },
    providerKey: "sk_live_abcdefgh",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})
