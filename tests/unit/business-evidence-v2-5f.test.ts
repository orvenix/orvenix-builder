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
  normalizeSiteCreationBusinessEvidence,
  summarizeBusinessEvidence,
} from "../../lib/orvenix-ai/site-creation/evidence-normalization"
import { normalizeSiteCreationBusiness } from "../../lib/orvenix-ai/site-creation/business-normalization"
import { buildCreativeDirectorRequestV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }
type Section = { role: string; rootId: string; nodes: Record<string, Node> } | null

function allText(section: Section): string {
  return Object.values(section?.nodes ?? {})
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content, node.props?.label, node.props?.href, node.props?.className])
    .filter((value): value is string => typeof value === "string")
    .join("\n")
}

// ---------------------------------------------------------------------------
// A-N: evidence-normalization.ts -- pure bounding/validation rules.
// ---------------------------------------------------------------------------

test("V2-5F: undefined/empty input normalizes to undefined", () => {
  assert.equal(normalizeSiteCreationBusinessEvidence(undefined), undefined)
  assert.equal(normalizeSiteCreationBusinessEvidence({}), undefined)
  assert.equal(normalizeSiteCreationBusinessEvidence({ people: [], testimonials: [], contact: {} }), undefined)
})

test("V2-5F (B): accepted human WhatsApp formats normalize to digits only", () => {
  const cases = ["+52 81 1234 5678", "52 81 1234 5678", "(81) 1234-5678"]
  for (const whatsapp of cases) {
    const result = normalizeSiteCreationBusinessEvidence({ contact: { whatsapp } })
    assert.ok(result?.contact?.whatsapp, `expected ${whatsapp} to normalize`)
    assert.match(result!.contact!.whatsapp!, /^\d{10,15}$/)
  }
})

test("V2-5F (C): WhatsApp containing letters is dropped, not passed through", () => {
  const result = normalizeSiteCreationBusinessEvidence({ contact: { whatsapp: "call me at 5281123456" } })
  assert.equal(result, undefined)
})

test("V2-5F (D): URL/protocol-shaped WhatsApp is dropped, never used to build an href", () => {
  const result = normalizeSiteCreationBusinessEvidence({ contact: { whatsapp: "https://wa.me/528112345678" } })
  assert.equal(result, undefined)
})

test("V2-5F (E): valid phone/email normalize and are available downstream", () => {
  const result = normalizeSiteCreationBusinessEvidence({ contact: { phone: "+52 81 1234 5678", email: "Hola@Ejemplo.com" } })
  assert.match(result!.contact!.phone!, /^\d{10,15}$/)
  assert.equal(result!.contact!.email, "hola@ejemplo.com")
})

test("V2-5F (F): invalid email is dropped, not passed through", () => {
  const result = normalizeSiteCreationBusinessEvidence({ contact: { email: "not-an-email" } })
  assert.equal(result, undefined)
})

test("V2-5F (G): people beyond 3 are capped, extras dropped", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    people: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }],
  })
  assert.equal(result?.people?.length, 3)
  assert.deepEqual(result?.people?.map((p) => p.name), ["A", "B", "C"])
})

test("V2-5F (H): empty/whitespace/duplicate people are filtered and deduped", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    people: [{ name: "  " }, { name: "Ana" }, { name: "Ana" }, { name: "" }],
  })
  assert.equal(result?.people?.length, 1)
  assert.equal(result?.people?.[0]?.name, "Ana")
})

test("V2-5F: people.detail is not part of the canonical shape (excluded from MVP)", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    people: [{ name: "Ana", role: "Directora" } as { name: string; role?: string; detail?: string }],
  })
  assert.deepEqual(result?.people, [{ name: "Ana", role: "Directora" }])
  assert.equal((result?.people?.[0] as Record<string, unknown>).detail, undefined)
})

test("V2-5F (K): testimonials beyond 3 are capped, extras dropped", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    testimonials: [
      { quote: "Uno", author: "A" },
      { quote: "Dos", author: "B" },
      { quote: "Tres", author: "C" },
      { quote: "Cuatro", author: "D" },
    ],
  })
  assert.equal(result?.testimonials?.length, 3)
})

test("V2-5F (L): empty/duplicate testimonials are filtered and deduped", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    testimonials: [
      { quote: "  ", author: "X" },
      { quote: "Excelente servicio", author: "Ana" },
      { quote: "Excelente servicio", author: "Otro" },
      { quote: "Buena atencion", author: "" },
    ],
  })
  assert.equal(result?.testimonials?.length, 1)
  assert.equal(result?.testimonials?.[0]?.author, "Ana")
})

test("V2-5F: testimonial.rating is not part of the canonical shape (excluded from MVP)", () => {
  const result = normalizeSiteCreationBusinessEvidence({
    testimonials: [{ quote: "Genial", author: "Ana", rating: "5" } as { quote: string; author: string; rating?: string }],
  })
  assert.equal((result?.testimonials?.[0] as Record<string, unknown>).rating, undefined)
})

test("V2-5F (O): summary is boolean/count only -- never raw names, quotes, or contact values", () => {
  const evidence = normalizeSiteCreationBusinessEvidence({
    contact: { whatsapp: "+52 81 1234 5678", email: "ana@ejemplo.com" },
    people: [{ name: "Dra. Ana Ruiz", role: "Directora" }],
    testimonials: [{ quote: "Excelente atencion, muy recomendado", author: "Cliente Real" }],
  })
  const summary = summarizeBusinessEvidence(evidence)
  assert.deepEqual(summary, {
    hasPeople: true,
    peopleCount: 1,
    hasTestimonials: true,
    testimonialCount: 1,
    hasWhatsapp: true,
    hasContactDetails: true,
  })

  const serialized = JSON.stringify(summary)
  assert.ok(!serialized.includes("Ana"))
  assert.ok(!serialized.includes("Cliente Real"))
  assert.ok(!serialized.includes("Excelente"))
  assert.ok(!serialized.includes("ejemplo.com"))
  assert.ok(!serialized.includes("528112345678"))
})

// ---------------------------------------------------------------------------
// P/S: normalization boundary + Preview/Confirm JSON round-trip.
// ---------------------------------------------------------------------------

test("V2-5F (S): business input without businessEvidence normalizes exactly as before", () => {
  const business = normalizeSiteCreationBusiness({ name: "Negocio X", industry: "servicios" }, "mensaje")
  assert.equal(business.businessEvidence, undefined)
})

test("V2-5F (P): businessEvidence survives a JSON.stringify/parse round-trip (preview/recovery persistence)", () => {
  const business = normalizeSiteCreationBusiness(
    {
      name: "Clinica Aurora",
      businessEvidence: {
        contact: { whatsapp: "+52 81 1234 5678" },
        people: [{ name: "Dra. Elena Ruiz", role: "Fisioterapeuta" }],
        testimonials: [{ quote: "Excelente trato", author: "Paciente" }],
      },
    },
    "mensaje",
  )

  // Mirrors preview-service.ts's toJsonValue(): JSON.parse(JSON.stringify(...)).
  const roundTripped = JSON.parse(JSON.stringify(business))
  assert.deepEqual(roundTripped.businessEvidence, business.businessEvidence)
})

// ---------------------------------------------------------------------------
// Composer activation: contact (legacy + composer paths share one source).
// ---------------------------------------------------------------------------

test("V2-5F (A): composeContact with no businessEvidence preserves the existing placeholder", () => {
  const section = composeSection("contact", {})
  const text = allText(section)
  assert.match(text, /\+52 000 000 0000/)
  assert.match(text, /contacto@tumarca\.com/)
  assert.match(text, /(^|\n)#(\n|$)/)
})

test("V2-5F (B/Q): real WhatsApp activates a real wa.me CTA and drops the fake contact copy entirely", () => {
  const section = composeSection("contact", { businessEvidence: { contact: { whatsapp: "528112345678" } } })
  const text = allText(section)
  assert.match(text, /https:\/\/wa\.me\/528112345678/)
  assert.ok(!text.includes("+52 000 000 0000"), "must not render the fake placeholder phone alongside a real one")
  assert.ok(!text.includes("contacto@tumarca.com"), "must not render a fake email just because a real WhatsApp exists")
})

test("V2-5F (Q): partial real contact (phone+email, no WhatsApp) never mixes in fake details", () => {
  const section = composeSection("contact", {
    businessEvidence: { contact: { phone: "8112345678", email: "hola@negocio.com" } },
  })
  const text = allText(section)
  assert.match(text, /8112345678/)
  assert.match(text, /hola@negocio\.com/)
  assert.ok(!text.includes("+52 000 000 0000"))
  assert.ok(!text.includes("contacto@tumarca.com"))
  // No whatsapp supplied -> CTA href must not fabricate a wa.me link.
  assert.ok(!text.includes("wa.me"))
})

// ---------------------------------------------------------------------------
// Composer activation: trustPeople (person-cards).
// ---------------------------------------------------------------------------

test("V2-5F (I): real people activate person-cards with the exact submitted name/role", () => {
  const evidence = normalizeSiteCreationBusinessEvidence({ people: [{ name: "Dra. Elena Ruiz", role: "Fisioterapeuta" }] })
  const section = composeSection("trust", {
    richComposition: true,
    aiPreferredTrustTreatment: "person-cards",
    trustPeople: evidence?.people,
  })
  const text = allText(section)
  assert.match(text, /Dra\. Elena Ruiz/)
  assert.match(text, /Fisioterapeuta/)
})

test("V2-5F (J): no people never fabricates a person-cards section", () => {
  const section = composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "person-cards" })
  const text = allText(section)
  assert.ok(!/Dra\.|Fisioterapeuta/.test(text))
})

// ---------------------------------------------------------------------------
// Composer activation: testimonials (no rating in the V2-5F canonical shape).
// ---------------------------------------------------------------------------

test("V2-5F (M): real testimonials render the exact normalized quote/author/role, never a rating", () => {
  const evidence = normalizeSiteCreationBusinessEvidence({
    testimonials: [{ quote: "La atencion fue excelente", author: "Paciente verificado", role: "Cliente frecuente" }],
  })
  const section = composeSection("testimonials", {
    richComposition: true,
    aiPreferredTestimonialTreatment: "rating-led",
    testimonials: evidence?.testimonials,
  })
  const text = allText(section)
  assert.match(text, /La atencion fue excelente/)
  assert.match(text, /Paciente verificado/)
  assert.match(text, /Cliente frecuente/)
  assert.ok(!text.includes("Testimonio pendiente de contenido real."))
  // rating-led was requested, but the V2-5F shape carries no rating field --
  // nothing should be fabricated to satisfy that preference.
  assert.ok(!/\d(\.\d)?\s*\/\s*5|\d(\.\d)?\s*estrellas/i.test(text))
})

test("V2-5F (N): no testimonials preserves the existing safe placeholder, never a real-looking fake", () => {
  const section = composeSection("testimonials", { richComposition: true })
  const text = allText(section)
  assert.match(text, /Testimonio pendiente de contenido real\./)
  assert.match(text, /Cliente/)
})

// ---------------------------------------------------------------------------
// R: pipeline threading -- blueprint-compiler wires businessEvidence into
// SectionCompositionContext, so both trust/testimonials/contact consume the
// SAME normalized evidence the legacy content-engine path also reads.
// ---------------------------------------------------------------------------

const ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "health",
  industry: "fisioterapia",
  objective: "Conseguir citas",
  businessName: "Clinica Aurora",
  services: [{ name: "Fisioterapia" }],
  pages: [
    {
      name: "Inicio",
      slug: "home",
      purpose: "Presentar la clinica.",
      archetype: "overview",
      sections: [
        { role: "hero", blockType: null, purpose: "x" },
        { role: "trust", blockType: null, purpose: "x" },
        { role: "testimonials", blockType: null, purpose: "x" },
        { role: "contact", blockType: null, purpose: "x" },
      ],
    },
  ],
}

test("V2-5F (R): businessEvidence threaded through compileSiteBlueprint reaches trust/testimonials/contact", () => {
  const evidence = normalizeSiteCreationBusinessEvidence({
    contact: { whatsapp: "528112345678" },
    people: [{ name: "Dra. Elena Ruiz", role: "Fisioterapeuta" }],
    testimonials: [{ quote: "Excelente trato y resultados", author: "Paciente real" }],
  })

  const blueprint = compileSiteBlueprint(ARCHITECTURE, {
    creativeDirection: { version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x", trustTreatment: "person-cards", pageDirections: [{ slug: "home", narrativeGoal: "x" }] },
    businessEvidence: evidence,
  })

  const homePage = blueprint.pages.find((page) => page.slug === "home")
  const text = JSON.stringify(homePage)
  assert.match(text, /Dra\. Elena Ruiz/)
  assert.match(text, /Excelente trato y resultados/)
  assert.match(text, /wa\.me\/528112345678/)
})

// ---------------------------------------------------------------------------
// O: Creative Director request carries only the boolean/count summary.
// ---------------------------------------------------------------------------

test("V2-5F (O): buildCreativeDirectorRequestV1 never leaks raw evidence, only the summary", () => {
  const evidence = normalizeSiteCreationBusinessEvidence({
    contact: { whatsapp: "528112345678", phone: "8112345678", email: "ana@ejemplo.com" },
    people: [{ name: "Dra. Elena Ruiz", role: "Fisioterapeuta" }],
    testimonials: [{ quote: "Un tratamiento excepcional y muy profesional", author: "Paciente Feliz" }],
  })

  const request = buildCreativeDirectorRequestV1({
    business: {
      name: "Clinica Aurora",
      industry: "fisioterapia",
      businessEvidenceSummary: summarizeBusinessEvidence(evidence),
    },
    architecture: ARCHITECTURE,
  })

  const serialized = JSON.stringify(request)
  for (const secret of ["Dra. Elena Ruiz", "Fisioterapeuta", "Un tratamiento excepcional", "Paciente Feliz", "528112345678", "8112345678", "ana@ejemplo.com"]) {
    assert.ok(!serialized.includes(secret), `Creative Director request must not contain raw evidence: ${secret}`)
  }

  assert.deepEqual(request.business.businessEvidenceSummary, {
    hasPeople: true,
    peopleCount: 1,
    hasTestimonials: true,
    testimonialCount: 1,
    hasWhatsapp: true,
    hasContactDetails: true,
  })
})
