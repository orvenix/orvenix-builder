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
  CREATIVE_DIRECTOR_BOOKING_PRESENTATIONS_V1,
  CREATIVE_DIRECTOR_TESTIMONIAL_TREATMENTS_V1,
  CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import type { CreativeDesignReferenceV1 } from "../../lib/orvenix-ai/creative-director/reference-context"
import { buildCreativeDirectorRequestV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import {
  BOOKING_PRESENTATIONS,
  TESTIMONIAL_TREATMENTS,
  TRUST_TREATMENTS,
} from "../../lib/orvenix-ai/composer/composition-context"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }
type Section = { role: string; rootId: string; nodes: Record<string, Node> } | null

function nodesOf(section: Section): Record<string, Node> {
  return section?.nodes ?? {}
}

function allText(section: Section): string {
  return Object.values(nodesOf(section))
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content, node.props?.label, node.props?.className])
    .filter((value): value is string => typeof value === "string")
    .join("\n")
}

function hasDisplayName(section: Section, displayName: string): boolean {
  return Object.values(nodesOf(section)).some((node) => node.displayName === displayName)
}

function direction(overrides: Partial<CreativeSiteDirectionV1> = {}): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
    ...overrides,
  }
}

function reference(overrides: Partial<CreativeDesignReferenceV1> = {}): CreativeDesignReferenceV1 {
  return {
    id: "webs:fixture",
    relevance: { contributionRoles: ["section-rhythm"], diversityReason: "primary-relevance-anchor", relevanceScore: 0.9 },
    visualGrammar: { visualFamily: "saas-conversion", designPersonality: "warm-approachable", mode: "light", accent: "cool", radius: "soft", shadow: "soft", contrast: "medium" },
    heroGrammar: { backgroundTreatment: "solid-gradient", alignment: "center", mediaStrategy: "none", ctaArrangement: "single-cta" },
    sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" },
    assetGrammar: { strategy: "none", placement: "none" },
    conversionGrammar: { ctaStrategy: "single-action", contactPattern: "generic-form" },
    navGrammar: { surfaceTreatment: "light-glass", position: "sticky", shadowBehavior: "static", ctaPattern: "prominent-single", hasTwoTierBar: false },
    distinctiveTraits: [],
    ...overrides,
  }
}

function refs(overrides: Partial<CreativeDesignReferenceV1>, prefix: string): CreativeDesignReferenceV1[] {
  return [0, 1, 2].map((index) => reference({ ...overrides, id: `webs:${prefix}-${index}` as never }))
}

const ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "health",
  industry: "clinica",
  objective: "agendar citas",
  businessName: "Clinica Aurora",
  services: [{ name: "Consulta inicial" }],
  pages: [
    { name: "Inicio", slug: "home", purpose: "Captar citas", archetype: "overview", sections: [
      { role: "trust", blockType: null, purpose: "x" },
      { role: "testimonials", blockType: null, purpose: "x" },
      { role: "contact", blockType: null, purpose: "x" },
    ] },
  ],
}

function baseRequest(referenceContext: CreativeDesignReferenceV1[]): CreativeDirectorRequestV1 {
  return {
    ...buildCreativeDirectorRequestV1({ business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas", services: [{ name: "Consulta inicial" }] }, architecture: ARCHITECTURE }),
    referenceContext,
  }
}

async function trustDecision(referenceContext: CreativeDesignReferenceV1[]) {
  const result = await requestCreativeDirectionV1({
    request: baseRequest(referenceContext),
    provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("unreachable")
  return {
    trustTreatment: result.proposal.trustTreatment,
    testimonialTreatment: result.proposal.testimonialTreatment,
    bookingPresentation: result.proposal.bookingPresentation,
  }
}

test("V2-5D contract vocabularies match composer executable vocabularies", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1].sort(), [...TRUST_TREATMENTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_TESTIMONIAL_TREATMENTS_V1].sort(), [...TESTIMONIAL_TREATMENTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_BOOKING_PRESENTATIONS_V1].sort(), [...BOOKING_PRESENTATIONS].sort())
})

test("V2-5D contract accepts valid trust/testimonial/booking values and drops invalid ones independently", () => {
  const valid = validateCreativeSiteDirectionV1(direction({ trustTreatment: "person-cards", testimonialTreatment: "rating-led", bookingPresentation: "booking-card" }))
  assert.equal(valid.ok, true)
  if (valid.ok) {
    assert.equal(valid.value.trustTreatment, "person-cards")
    assert.equal(valid.value.testimonialTreatment, "rating-led")
    assert.equal(valid.value.bookingPresentation, "booking-card")
  }

  const invalid = validateCreativeSiteDirectionV1(direction({
    // @ts-expect-error deliberately invalid
    trustTreatment: "award-wall",
    // @ts-expect-error deliberately invalid
    testimonialTreatment: "five-star-carousel",
    bookingPresentation: "booking-card",
  }))
  assert.equal(invalid.ok, true)
  if (invalid.ok) {
    assert.equal(invalid.value.trustTreatment, undefined)
    assert.equal(invalid.value.testimonialTreatment, undefined)
    assert.equal(invalid.value.bookingPresentation, "booking-card")
  }
})

const TRUST_CONTEXT_A = refs({ sectionGrammar: { recurringTreatments: ["credibility-stat-row"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["credibility-stat-row"] }, "stats")
const TRUST_CONTEXT_B = refs({ sectionGrammar: { recurringTreatments: ["rated-card-grid"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["rated-person-card"] }, "rated")
const TRUST_CONTEXT_C = refs({ sectionGrammar: { recurringTreatments: ["logo-strip"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["logo-strip"], conversionGrammar: { ctaStrategy: "single-action", contactPattern: "booking-form" } }, "logos-booking")

test("V2-5D reference grammar contexts A/B/C produce distinct bounded trust decisions", async () => {
  assert.deepEqual(await trustDecision(TRUST_CONTEXT_A), { trustTreatment: "credibility-strip", testimonialTreatment: "standard", bookingPresentation: "standard" })
  assert.deepEqual(await trustDecision(TRUST_CONTEXT_B), { trustTreatment: "person-cards", testimonialTreatment: "rating-led", bookingPresentation: "standard" })
  assert.deepEqual(await trustDecision(TRUST_CONTEXT_C), { trustTreatment: "logo-strip", testimonialTreatment: "standard", bookingPresentation: "booking-card" })
})

test("V2-5D reference ids cannot select a trust decision; grammar changes can", async () => {
  const original = await trustDecision(TRUST_CONTEXT_B)
  const renamed = await trustDecision(TRUST_CONTEXT_B.map((entry, index) => ({ ...entry, id: `webs:different-${index}` as never })))
  assert.deepEqual(original, renamed)

  const sameIdStats = await trustDecision([reference({ id: "webs:same", sectionGrammar: { recurringTreatments: ["credibility-stat-row"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["credibility-stat-row"] })])
  const sameIdBooking = await trustDecision([reference({ id: "webs:same", sectionGrammar: { recurringTreatments: ["logo-strip"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["logo-strip"], conversionGrammar: { ctaStrategy: "single-action", contactPattern: "booking-form" } })])
  assert.notDeepEqual(sameIdStats, sameIdBooking)
})

test("V2-5D composer renders richer trust/testimonial structures only from real structured data", () => {
  const people = composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "person-cards", trustPeople: [{ name: "Dra. Elena Ruiz", role: "Fisioterapeuta", detail: "Valoracion y seguimiento." }] })
  assert.ok(hasDisplayName(people, "Confianza (personas)"))
  assert.match(allText(people), /Dra\. Elena Ruiz/)

  const logos = composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "logo-strip", trustOrganizations: [{ name: "Colegio Medico Local" }] })
  assert.ok(hasDisplayName(logos, "Confianza (organizaciones)"))
  assert.match(allText(logos), /Colegio Medico Local/)

  const testimonial = composeSection("testimonials", { richComposition: true, aiPreferredTestimonialTreatment: "rating-led", testimonials: [{ quote: "La atencion fue clara.", author: "Paciente verificado", rating: "4.8/5" }] })
  assert.match(allText(testimonial), /4\.8\/5/)
  assert.match(allText(testimonial), /La atencion fue clara\./)
})

test("V2-5D fact safety: rich grammar without real data does not fabricate ratings, credentials, awards, stats, logos or availability", () => {
  const sections = [
    composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "logo-strip" }),
    composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "person-cards" }),
    composeSection("testimonials", { richComposition: true, aiPreferredTestimonialTreatment: "rating-led" }),
    composeSection("contact", { richComposition: true, aiPreferredBookingPresentation: "booking-card" }),
  ]
  const text = sections.map(allText).join("\n")
  for (const forbidden of ["4.9", "500+", "15 años", "certificado", "premiado", "disponible hoy"]) {
    assert.equal(text.includes(forbidden), false, `no debe aparecer claim fabricado: ${forbidden}`)
  }
})

test("V2-5D compileSiteBlueprint threads site-level trust decisions and executes booking presentation", () => {
  const blueprint = compileSiteBlueprint(ARCHITECTURE, {
    creativeDirection: direction({ trustTreatment: "logo-strip", testimonialTreatment: "rating-led", bookingPresentation: "booking-card" }),
  })
  const text = Object.values(blueprint.pages[0].tree.nodes)
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content, node.props?.label])
    .filter((value): value is string => typeof value === "string")
    .join("\n")

  assert.match(text, /Solicitar cita/)
  assert.match(text, /Agenda el siguiente paso/)
  assert.equal(text.includes("4.9"), false)
})

test("V2-5D backward compatibility: existing proposal shape without new fields remains valid", () => {
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    density: "standard",
    navigationSurfaceStyle: "solid",
    pageDirections: [{ slug: "home", narrativeGoal: "x", heroTreatment: "abstract-glow" }],
  })
  assert.equal(result.ok, true)
})
