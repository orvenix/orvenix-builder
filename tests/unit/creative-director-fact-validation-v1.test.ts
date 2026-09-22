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
  containsForbiddenClaim,
  containsSuspiciousNumberClaim,
  containsUrlOrEmail,
  isKnownOffering,
  isSafeHeroCopyText,
  sanitizeCreativeDirectorPageDirectionV1,
  sanitizeCreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/fact-validation"
import type { CreativeDirectorPageDirectionV1, CreativeSiteDirectionV1 } from "../../lib/orvenix-ai/creative-director/contract"

// ---------------------------------------------------------------------------
// V2-4 section 6/8: the semantic fact-safety layer. Never claims to prove
// arbitrary natural-language factuality -- catches KNOWN failure patterns
// (fabricated credentials/superlatives/numbers, unknown offerings, URLs),
// and NEVER destroys one page's independent valid guidance because another
// field was unsafe.
// ---------------------------------------------------------------------------

const REAL_OFFERINGS = ["Fisioterapia deportiva", "Rehabilitación postoperatoria", "Terapia manual"]

// ---------------------------------------------------------------------------
// F) invented number/credential claim rejected
// ---------------------------------------------------------------------------

test("F) frases con numero+credencial/anos/clientes se marcan como sospechosas", () => {
  assert.equal(containsSuspiciousNumberClaim("Contamos con 10 años de experiencia"), true)
  assert.equal(containsSuspiciousNumberClaim("Más de 500 clientes satisfechos"), true)
  assert.equal(containsSuspiciousNumberClaim("3 premios internacionales"), true)
  assert.equal(containsSuspiciousNumberClaim("Fisioterapia deportiva y más"), false)
})

test("F) frases con afirmaciones de credenciales/superlativos prohibidos se detectan", () => {
  assert.equal(containsForbiddenClaim("Somos los mejores fisioterapeutas de la ciudad"), true)
  assert.equal(containsForbiddenClaim("Contamos con certificacion internacional"), true)
  assert.equal(containsForbiddenClaim("Resultados garantizados en 3 sesiones"), true)
  assert.equal(containsForbiddenClaim("Recupera tu movimiento con fisioterapia deportiva"), false)
})

test("isSafeHeroCopyText combina ambos barridos", () => {
  assert.equal(isSafeHeroCopyText("Fisioterapia deportiva y más"), true)
  assert.equal(isSafeHeroCopyText("Somos los mejores, con 10 años de experiencia"), false)
})

// ---------------------------------------------------------------------------
// U/V) URL/email rejection
// ---------------------------------------------------------------------------

test("V) URLs y correos se detectan en texto libre", () => {
  assert.equal(containsUrlOrEmail("visita https://ejemplo.com"), true)
  assert.equal(containsUrlOrEmail("escribenos a contacto@ejemplo.com"), true)
  assert.equal(containsUrlOrEmail("www.ejemplo.com tiene mas info"), true)
  assert.equal(containsUrlOrEmail("physical therapist treating athlete knee"), false)
})

// ---------------------------------------------------------------------------
// G/H) offering-name matching
// ---------------------------------------------------------------------------

test("G) un nombre de oferta que NO esta en los hechos reales no se reconoce", () => {
  assert.equal(isKnownOffering("Servicio Que No Existe", REAL_OFFERINGS), false)
})

test("H) un nombre de oferta real SI se reconoce, incluso con acentos/mayusculas distintas", () => {
  assert.equal(isKnownOffering("fisioterapia deportiva", REAL_OFFERINGS), true)
  assert.equal(isKnownOffering("FISIOTERAPIA DEPORTIVA", REAL_OFFERINGS), true)
  assert.equal(isKnownOffering("Rehabilitacion postoperatoria", REAL_OFFERINGS), true) // no accent in input, still matches
})

// ---------------------------------------------------------------------------
// E) sanitization: unsafe Hero copy is dropped, independent guidance survives
// ---------------------------------------------------------------------------

test("E/R) heroTitleSuggestion no seguro se elimina; highlightedOfferings/assetIntent/ctaIntent del MISMO page direction sobreviven", () => {
  const direction: CreativeDirectorPageDirectionV1 = {
    slug: "home",
    narrativeGoal: "Presentar la clinica.",
    heroTitleSuggestion: "Somos los mejores fisioterapeutas con 10 años de experiencia",
    heroDescriptionSuggestion: "Centro de Fisioterapia Monterrey te acompaña en tu recuperacion.",
    highlightedOfferings: ["Fisioterapia deportiva"],
    ctaIntent: "appointment",
    assetIntent: { subject: "physical therapist treating athlete knee" },
  }

  const sanitized = sanitizeCreativeDirectorPageDirectionV1(direction, { offeringNames: REAL_OFFERINGS })

  assert.equal(sanitized.heroTitleSuggestion, undefined)
  assert.equal(sanitized.heroDescriptionSuggestion, "Centro de Fisioterapia Monterrey te acompaña en tu recuperacion.")
  assert.deepEqual(sanitized.highlightedOfferings, ["Fisioterapia deportiva"])
  assert.equal(sanitized.ctaIntent, "appointment")
  assert.deepEqual(sanitized.assetIntent, { subject: "physical therapist treating athlete knee" })
})

test("G) highlightedOfferings con un nombre desconocido se filtra, conservando solo los reales", () => {
  const direction: CreativeDirectorPageDirectionV1 = {
    slug: "home",
    narrativeGoal: "x",
    highlightedOfferings: ["Fisioterapia deportiva", "Servicio Que No Existe"],
  }
  const sanitized = sanitizeCreativeDirectorPageDirectionV1(direction, { offeringNames: REAL_OFFERINGS })
  assert.deepEqual(sanitized.highlightedOfferings, ["Fisioterapia deportiva"])
})

test("G) heroDirection.preferredOfferingName desconocido se degrada a solo 'emphasis' (nunca se descarta heroDirection completo)", () => {
  const direction: CreativeDirectorPageDirectionV1 = {
    slug: "home",
    narrativeGoal: "x",
    heroDirection: { emphasis: "offering", preferredOfferingName: "Servicio Que No Existe" },
  }
  const sanitized = sanitizeCreativeDirectorPageDirectionV1(direction, { offeringNames: REAL_OFFERINGS })
  assert.deepEqual(sanitized.heroDirection, { emphasis: "offering" })
})

test("H) heroDirection.preferredOfferingName real se conserva intacto", () => {
  const direction: CreativeDirectorPageDirectionV1 = {
    slug: "home",
    narrativeGoal: "x",
    heroDirection: { emphasis: "offering", preferredOfferingName: "Fisioterapia deportiva" },
  }
  const sanitized = sanitizeCreativeDirectorPageDirectionV1(direction, { offeringNames: REAL_OFFERINGS })
  assert.deepEqual(sanitized.heroDirection, { emphasis: "offering", preferredOfferingName: "Fisioterapia deportiva" })
})

test("un assetIntent que esconde una URL se elimina, sin afectar el resto de la direccion", () => {
  const direction: CreativeDirectorPageDirectionV1 = {
    slug: "home",
    narrativeGoal: "x",
    assetIntent: { subject: "visit https://example.com" },
    ctaIntent: "contact",
  }
  const sanitized = sanitizeCreativeDirectorPageDirectionV1(direction, { offeringNames: REAL_OFFERINGS })
  assert.equal(sanitized.assetIntent, undefined)
  assert.equal(sanitized.ctaIntent, "contact")
})

// ---------------------------------------------------------------------------
// R) whole-proposal sanitization: one bad page never destroys another
// ---------------------------------------------------------------------------

test("R) sanitizeCreativeSiteDirectionV1: una pagina insegura no afecta la guia valida de otra pagina", () => {
  const proposal: CreativeSiteDirectionV1 = {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [
      { slug: "home", narrativeGoal: "x", heroTitleSuggestion: "Somos los mejores con 10 años de experiencia" },
      { slug: "servicios", narrativeGoal: "x", heroTitleSuggestion: "Fisioterapia deportiva y más" },
    ],
  }

  const facts = new Map([
    ["home", { offeringNames: REAL_OFFERINGS }],
    ["servicios", { offeringNames: REAL_OFFERINGS }],
  ])

  const sanitized = sanitizeCreativeSiteDirectionV1(proposal, facts)
  assert.equal(sanitized.pageDirections[0].heroTitleSuggestion, undefined)
  assert.equal(sanitized.pageDirections[1].heroTitleSuggestion, "Fisioterapia deportiva y más")
})
