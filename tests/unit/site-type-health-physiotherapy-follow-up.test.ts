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

// ---------------------------------------------------------------------------
// Site-type follow-up: FOLLOW_UP_SITE_TYPE_GAP=fisioterapia_not_health.
// inferSiteType (site-architect.ts) previously recognized only "clinica",
// "dent", "salud", "doctor" as health signals -- a business explicitly
// describing physiotherapy (industry "fisioterapia", real services like
// "Fisioterapia deportiva") fell through to the generic "business"
// siteType. Two changes, both minimal and additive:
//
// 1. A new "fisioterap" health keyword, using the SAME word-START
//    (startsWordIn) mechanism already protecting "dent" -- covers
//    fisioterapia/fisioterapeuta/fisioterapeutas/fisioterapéutico(a) via
//    one shared prefix, without matching anything that merely CONTAINS
//    "fisioterap"/"terapia" mid-word.
// 2. inferSiteType's input text now also includes real business.services/
//    products NAMES (already on the same context object, no contract
//    change) alongside industry/description/request.
//
// Deliberately NOT added: "terapia"/"rehabilitacion" alone as independent
// triggers -- both appear in real non-medical contexts (couples therapy,
// generic wellness branding) and the task explicitly calls for caution
// here (see test I).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// A/B/C) Physiotherapy recognition
// ---------------------------------------------------------------------------

test("A) industry explicito 'fisioterapia' => health", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", location: "Monterrey" },
  })
  assert.equal(architecture.siteType, "health")
})

test("B) 'Fisioterapia deportiva' (nombre de servicio real, sin la palabra en industry/description) => health", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "Crea un sitio profesional",
    business: {
      name: "Centro Deportivo Integral",
      industry: "bienestar",
      services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
    },
  })
  assert.equal(architecture.siteType, "health")
})

test("C) terminologia profesional (fisioterapeuta/fisioterapeutas) => health", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const singular = buildSiteArchitecture({
    request: "req",
    business: { description: "Soy fisioterapeuta y atiendo pacientes particulares." },
  })
  assert.equal(singular.siteType, "health")

  const plural = buildSiteArchitecture({
    request: "req",
    business: { description: "Contamos con fisioterapeutas certificados en el equipo." },
  })
  assert.equal(plural.siteType, "health")
})

// ---------------------------------------------------------------------------
// D) Existing health signals remain intact
// ---------------------------------------------------------------------------

test("D) clinica/dent/salud/doctor siguen clasificando health sin cambios", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  assert.equal(buildSiteArchitecture({ request: "req", business: { industry: "salud dental" } }).siteType, "health")
  assert.equal(buildSiteArchitecture({ request: "req", business: { description: "Somos una clinica dental en la ciudad." } }).siteType, "health")
  assert.equal(buildSiteArchitecture({ request: "req", business: { description: "Soy dentista y atiendo pacientes particulares." } }).siteType, "health")
  assert.equal(buildSiteArchitecture({ request: "req", business: { industry: "salud" } }).siteType, "health")
  assert.equal(buildSiteArchitecture({ request: "req", business: { description: "Consulta con el doctor disponible en la semana." } }).siteType, "health")
})

// ---------------------------------------------------------------------------
// E) Boundary safety -- the historical "identidad visual" regression
// ---------------------------------------------------------------------------

test("E) 'Identidad visual' (industry/description Y como nombre de servicio) sigue SIN clasificar health", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const viaDescription = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseno",
    business: {
      name: "Estudio Norte",
      industry: "diseño gráfico",
      location: "Guadalajara",
      description: "Diseñamos logotipos, identidad visual y sitios web para negocios en Guadalajara.",
      objective: "Conseguir solicitudes de cotización",
    },
  })
  assert.equal(viaDescription.siteType, "business")

  // Also as a real SERVICE NAME now that services feed the classifier text.
  const viaServiceName = buildSiteArchitecture({
    request: "req",
    business: { name: "Estudio Norte", industry: "diseño gráfico", services: [{ name: "Identidad visual" }, { name: "Logotipos" }] },
  })
  assert.equal(viaServiceName.siteType, "business")
})

test("E2) otras palabras que contienen 'dent'/'fisioterap' a mitad de palabra tampoco disparan falsos positivos", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  assert.equal(
    buildSiteArchitecture({ request: "req", business: { description: "Atendemos a todo residente de la zona tras un accidente." } }).siteType,
    "business",
  )

  // Contains "terapia" mid-word (fisioterapia's own suffix) but NOT the "fisioterap" prefix itself.
  assert.equal(
    buildSiteArchitecture({ request: "req", business: { description: "Ofrecemos aromaterapia y musicoterapia en un ambiente relajante." } }).siteType,
    "business",
  )
})

// ---------------------------------------------------------------------------
// F/G/H) Other site types unaffected
// ---------------------------------------------------------------------------

test("F) Estudio Norte-style creative input permanece business (arquitectura); VisualFamily sigue siendo 'creative' via su propio mecanismo", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Estudio Norte", industry: "diseno grafico", description: "Disenamos logotipos, identidad visual y sitios web." },
  })
  assert.equal(architecture.siteType, "business")
  assert.equal(inferVisualFamily({ industry: "diseno grafico" }), "creative")
})

test("G) input de restaurante permanece restaurant", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Sabores del Valle", industry: "restaurante", location: "Puebla" },
  })
  assert.equal(architecture.siteType, "restaurant")
})

test("H) input de ecommerce permanece ecommerce", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Tienda Luna", industry: "ecommerce de accesorios", location: "CDMX" },
  })
  assert.equal(architecture.siteType, "ecommerce")
})

// ---------------------------------------------------------------------------
// I) Ambiguous non-health terminology does not accidentally classify health
// ---------------------------------------------------------------------------

test("I) 'terapia'/'rehabilitacion' solas, en contexto no medico, NO disparan health", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const coupleTherapy = buildSiteArchitecture({
    request: "req",
    business: { name: "Espacio Vinculo", description: "Ofrecemos terapia de pareja y consejeria para parejas." },
  })
  assert.equal(coupleTherapy.siteType, "business")

  const genericRehab = buildSiteArchitecture({
    request: "req",
    business: { name: "Centro Rio", description: "Programa de rehabilitacion para atletas amateur, enfocado en mejorar el rendimiento deportivo." },
  })
  assert.equal(genericRehab.siteType, "business")

  const wellnessBranding = buildSiteArchitecture({
    request: "req",
    business: { name: "Espacio Zen", description: "Sesiones de risoterapia y musicoterapia para grupos." },
  })
  assert.equal(wellnessBranding.siteType, "business")
})

// ---------------------------------------------------------------------------
// J) Accent/case normalization
// ---------------------------------------------------------------------------

test("J) normalizacion de acentos/mayusculas no cambia el resultado", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const variants = ["fisioterapia", "FISIOTERAPIA", "FisioTerapia", "físioterapia", "FISIOTERÁPIA"]
  const results = variants.map((industry) => buildSiteArchitecture({ request: "req", business: { industry } }).siteType)
  assert.ok(results.every((siteType) => siteType === "health"), `todas las variantes de acentos/mayusculas deben producir 'health': ${JSON.stringify(results)}`)
})

// ---------------------------------------------------------------------------
// K) Determinism
// ---------------------------------------------------------------------------

test("K) misma entrada produce siempre el mismo siteType", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const business = { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", location: "Monterrey", services: [{ name: "Fisioterapia deportiva" }] }

  const first = buildSiteArchitecture({ request: "req", business })
  const second = buildSiteArchitecture({ request: "req", business })
  assert.equal(first.siteType, second.siteType)
  assert.equal(first.siteType, "health")
})

// ---------------------------------------------------------------------------
// Section 8: VisualFamily decoupling preserved -- siteType now correctly
// "health" for physiotherapy, but VisualFamily is still its OWN
// independent inference (V2-1.1), never siteType-driven.
// ---------------------------------------------------------------------------

test("visual family sigue siendo independiente de siteType tras la correccion de fisioterapia", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  // Same call shape V2-1.1's own test uses -- siteTypeHint is advisory only.
  assert.equal(
    inferVisualFamily({ industry: "fisioterapia", description: "Ofrecemos fisioterapia deportiva y rehabilitacion fisica en Monterrey.", siteTypeHint: "health" }),
    "health",
  )
})

// ---------------------------------------------------------------------------
// Section 7: downstream regression -- full physiotherapy pipeline fixture.
// Confirms siteType=health while real services/copy remain correct across
// Plan V2, V2-2 provenance placeholder, V2-3 determinism, and V2-S1/V2-S2
// semantic surfaces.
// ---------------------------------------------------------------------------

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  objective: "Conseguir citas de valoración",
  services: [
    { name: "Fisioterapia deportiva" },
    { name: "Rehabilitación postoperatoria" },
    { name: "Terapia manual" },
  ],
}

test("downstream: pipeline completo de fisioterapia produce siteType=health con servicios reales intactos", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })

  assert.equal(result.ok, true)
  assert.equal(result.architecture.siteType, "health")
  assert.deepEqual(
    result.architecture.services?.map((s) => s.name),
    ["Fisioterapia deportiva", "Rehabilitación postoperatoria", "Terapia manual"],
  )

  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const serviceHeadings = Object.values(servicios.tree.nodes)
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  for (const name of ["Fisioterapia deportiva", "Rehabilitación postoperatoria", "Terapia manual"]) {
    assert.ok(serviceHeadings.includes(name), `Servicios no muestra '${name}' tras el fix de siteType`)
  }
})

test("downstream: Plan V2 sigue siendo valido para el fixture de fisioterapia corregido", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const validation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
})

test("downstream: Quality Gate no rechaza el plan corregido", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { assessSiteGenerationQualityV1 } = await import("../../lib/orvenix-ai/evaluation/quality-gate")

  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const gate = assessSiteGenerationQualityV1(result.plan)
  assert.notEqual(gate.decision, "reject")
})

test("downstream: V2-2 provenance placeholder (sin PEXELS_API_KEY) permanece intacto", async () => {
  assert.equal(process.env.PEXELS_API_KEY, undefined)
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const home = result.plan.pages.find((p) => p.isHome)!
  const heroImage = Object.values(home.tree.nodes).find(
    (n) => n.type === "image" && (n.props?.alt === "Imagen principal del negocio" || (typeof n.props?.alt === "string" && n.props.alt.includes("imagen principal"))),
  )
  assert.ok(heroImage)
  assert.equal(heroImage!.props?.src, "")
  assert.equal(heroImage!.props?.asset, undefined)
})

test("downstream: V2-3 determinismo estructural preservado para el fixture corregido", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const first = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const second = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  assert.deepEqual(
    first.plan.pages.map((p) => Object.keys(p.tree.nodes).length),
    second.plan.pages.map((p) => Object.keys(p.tree.nodes).length),
  )
})

test("downstream: V2-S2 copia semantica (trust/CTA) sigue coherente tras el cambio de siteType", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })

  const home = result.plan.pages.find((p) => p.isHome)!
  const trustTexts = Object.values(home.tree.nodes)
    .filter((n) => n.type === "text")
    .map((n) => n.props?.content)
  assert.ok(trustTexts.some((t) => typeof t === "string" && t.includes("Fisioterapia deportiva") && t.includes("Rehabilitación postoperatoria")))

  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const serviciosNodes = servicios.tree.nodes as Record<string, { type: string; props?: Record<string, unknown>; children?: string[]; parentId?: string }>
  // The CTA-role section's own button, NOT the hero's ("Solicitar informacion"/
  // "Ver servicios" primary/secondary) -- scoped via the CTA role's own known
  // heading, same technique established elsewhere in this suite, since a
  // page-wide unscoped ctaButton search would ambiguously match the hero's
  // buttons first.
  const ctaHeading = Object.values(serviciosNodes).find((n) => n.type === "heading" && n.props?.text === "¿Listo para dar el siguiente paso?")
  let ctaSectionRoot = ctaHeading
  while (ctaSectionRoot && ctaSectionRoot.type !== "section" && ctaSectionRoot.parentId) {
    ctaSectionRoot = serviciosNodes[ctaSectionRoot.parentId]
  }
  let ctaButton: { type: string; props?: Record<string, unknown> } | undefined
  const stack = [...(ctaSectionRoot?.children ?? [])]
  while (stack.length && !ctaButton) {
    const node = serviciosNodes[stack.shift()!]
    if (!node) continue
    if (node.type === "ctaButton") ctaButton = node
    else stack.push(...(node.children ?? []))
  }
  // health siteType's Servicios page has NO "process" role (see site-architect.ts) --
  // this alone confirms the architecture branch genuinely changed, not just the label.
  const hasProcessRole = result.architecture.pages.find((p) => p.slug === "servicios")!.sections.some((s) => s.role === "process")
  assert.equal(hasProcessRole, false)
  assert.ok(ctaButton, "Servicios debe conservar su boton CTA de la seccion 'cta' tras el cambio de arquitectura")
  assert.equal(ctaButton!.props?.label, "Agendar ahora")
})
