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
// V2-S2: Semantic Content Personalization. A small, deterministic,
// fact-gated copy layer (composer/semantic-copy.ts) makes trust/CTA/
// features/process respond to REAL business facts (services, products,
// location, businessObjective) already available from V2-S1, without
// fabricating claims, and without ever losing the pre-existing
// no-facts fallback byte-for-byte.
// ---------------------------------------------------------------------------

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; parentId?: string; displayName?: string }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

function headingTexts(section: { nodes: Record<string, Node> } | null): string[] {
  return Object.values(nodesOf(section))
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => String(n.props?.text))
}

function allTexts(section: { nodes: Record<string, Node> } | null): string[] {
  return Object.values(nodesOf(section))
    .filter((n) => n.type === "text" || n.type === "heading")
    .map((n) => String(n.props?.text ?? n.props?.content ?? ""))
    .filter(Boolean)
}

const FISIOTERAPIA_SERVICES = [
  { name: "fisioterapia deportiva" },
  { name: "rehabilitación postoperatoria" },
  { name: "terapia manual" },
]

const RESTAURANT_DISHES = [
  { name: "Mole poblano" },
  { name: "Chiles en nogada" },
  { name: "Enchiladas" },
]

/**
 * V2-S2 section 3/G: real claims/superlatives that must never be
 * synthesized by this layer, regardless of business facts.
 */
const FORBIDDEN_SUPERLATIVES = [
  /somos los mejores/i,
  /expertos? certificados?/i,
  /a[ñn]os de experiencia/i,
  /resultados? garantizados?/i,
  /m[aá]xima calidad/i,
  /clientes satisfechos/i,
  /ingredientes frescos/i,
  /aut[eé]ntico/i,
  /premiado/i,
  /\bl[ií]der\b/i,
  /n[uú]mero uno/i,
]

/**
 * V2-S2 section 3/4: capability/transaction claims this layer must never
 * invent (booking systems, ordering, delivery, inventory, pricing).
 */
const UNSUPPORTED_TRANSACTION_PATTERNS = [
  /reserva(r|ci[oó]n)? en l[ií]nea/i,
  /compra(r)? en l[ií]nea/i,
  /entrega a domicilio/i,
  /env[ií]o gratis/i,
  /descuento/i,
  /\bprecio\b/i,
  /inventario/i,
  /disponibilidad garantizada/i,
]

/** Same V2-S1.1 builder-facing detector, reused to audit the NEW V2-S2 copy paths. */
const BUILDER_FACING_PATTERNS = [
  /puedes reemplazar/i,
  /puedes cambiar/i,
  /personaliza/i,
  /listo para personalizar/i,
  /estructura.*editable/i,
  /\bedita\b/i,
  /\bconfigura\b/i,
  /plantilla/i,
  /\bpublicar\b/i,
  /placeholder/i,
]

function assertNoForbidden(texts: string[], patterns: RegExp[], label: string) {
  for (const text of texts) {
    for (const pattern of patterns) {
      assert.ok(!pattern.test(text), `${label}: '${text}' coincide con patron prohibido ${pattern}`)
    }
  }
}

// ---------------------------------------------------------------------------
// A) Physiotherapy / health: explicit services -> trust/CTA context-aware,
//    no unsupported medical claims.
// ---------------------------------------------------------------------------

test("V2-S2 A1) trust: fisioterapia con servicios reales -- primer item nombra los servicios reales, sin claims medicos no soportados", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", { services: FISIOTERAPIA_SERVICES })
  assert.ok(trust)
  const texts = allTexts(trust)
  assert.ok(texts.some((t) => t.includes("fisioterapia deportiva") && t.includes("rehabilitación postoperatoria") && t.includes("terapia manual")))
  assertNoForbidden(texts, FORBIDDEN_SUPERLATIVES, "trust fisioterapia")
})

test("V2-S2 A2) CTA: pagina de servicios (catalog) con servicios reales conserva el fallback orientado a cita -- ya cumple el patron 'appointment-oriented'", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })
  assert.ok(cta)
  const label = Object.values(nodesOf(cta)).find((n) => n.type === "ctaButton")?.props?.label
  assert.equal(label, "Agendar ahora")
})

test("V2-S2 A3) CTA: businessObjective explicito se refleja en el cuerpo sin inventar sistema de citas", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", services: FISIOTERAPIA_SERVICES, businessObjective: "Conseguir citas de valoración" })
  assert.ok(cta)
  const body = Object.values(nodesOf(cta)).find((n) => n.type === "text" && n.props?.content?.toString().startsWith("Escríbenos"))
  assert.ok(body)
  assert.equal(body!.props?.content, "Escríbenos para conseguir citas de valoración.")
  assertNoForbidden([String(body!.props?.content)], UNSUPPORTED_TRANSACTION_PATTERNS, "cta objective fisioterapia")
})

// ---------------------------------------------------------------------------
// B) Restaurant with explicit dishes: CTA/trust reference offerings without
//    inventing quality/price/freshness/authenticity/ordering/delivery.
// ---------------------------------------------------------------------------

test("V2-S2 B1) CTA: pagina de menu (catalog) con platillos reales usa framing de explorar/contactar, no de agendar valoracion", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", products: RESTAURANT_DISHES })
  assert.ok(cta)
  const label = Object.values(nodesOf(cta)).find((n) => n.type === "ctaButton")?.props?.label
  const body = Object.values(nodesOf(cta)).find((n) => n.type === "text" && n.props?.color === "#dbeafe")
  assert.equal(label, "Ver catálogo")
  assert.equal(body!.props?.content, "Contáctanos para conocer más sobre lo que ofrecemos.")
  const texts = allTexts(cta)
  assertNoForbidden(texts, FORBIDDEN_SUPERLATIVES, "cta menu")
  assertNoForbidden(texts, UNSUPPORTED_TRANSACTION_PATTERNS, "cta menu")
})

test("V2-S2 B2) trust: restaurante con platillos reales nombra los platillos reales sin inventar frescura/autenticidad/premios", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", { products: RESTAURANT_DISHES })
  assert.ok(trust)
  const texts = allTexts(trust)
  assert.ok(texts.some((t) => t.includes("Mole poblano") && t.includes("Chiles en nogada") && t.includes("Enchiladas")))
  assertNoForbidden(texts, FORBIDDEN_SUPERLATIVES, "trust menu")
})

// ---------------------------------------------------------------------------
// C) Restaurant with NO dishes: no fabrication, CTA stays truthful.
// ---------------------------------------------------------------------------

test("V2-S2 C) sin platillos/servicios reales: trust y CTA no inventan ningun nombre de platillo/servicio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", { archetype: "overview" })
  const cta = composeSection("cta", { archetype: "catalog" })
  assert.ok(trust && cta)
  const texts = [...allTexts(trust), ...allTexts(cta)]
  for (const dish of RESTAURANT_DISHES.map((d) => d.name)) {
    assert.ok(!texts.some((t) => t.includes(dish)), `no debio aparecer el platillo no suplido '${dish}'`)
  }
  for (const service of FISIOTERAPIA_SERVICES.map((s) => s.name)) {
    assert.ok(!texts.some((t) => t.includes(service)), `no debio aparecer el servicio no suplido '${service}'`)
  }
  const label = Object.values(nodesOf(cta)).find((n) => n.type === "ctaButton")?.props?.label
  assert.equal(label, "Agendar ahora")
})

// ---------------------------------------------------------------------------
// D) Creative/professional: CTA responds to objective, no invented
//    methodology/experience/awards/clients.
// ---------------------------------------------------------------------------

test("V2-S2 D) negocio creativo/profesional: CTA usa el objective real sin inventar metodologia, experiencia, premios o clientes", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", industry: "diseno grafico", businessObjective: "Conseguir solicitudes de cotización" })
  assert.ok(cta)
  const body = Object.values(nodesOf(cta)).find((n) => n.type === "text" && n.props?.content?.toString().startsWith("Escríbenos"))
  assert.equal(body!.props?.content, "Escríbenos para conseguir solicitudes de cotización.")
  assertNoForbidden(allTexts(cta), FORBIDDEN_SUPERLATIVES, "cta creativo")
  assertNoForbidden(allTexts(cta), UNSUPPORTED_TRANSACTION_PATTERNS, "cta creativo")
})

// ---------------------------------------------------------------------------
// E) Explicit structured facts still outrank inferred facts (full pipeline:
//    explicit business.services wins over a contradicting inferable
//    description -- the V2-S1 precedence, exercised through V2-S2's new
//    consumer).
// ---------------------------------------------------------------------------

test("V2-S2 E) trust usa los servicios EXPLICITOS del negocio, no los que podrian inferirse (contradictorios) de la descripcion", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const request = "Crea un sitio web profesional para Clinica Explicita."
  const business = normalizeSiteCreationBusiness(
    {
      name: "Clinica Explicita",
      industry: "fisioterapia",
      services: [{ name: "Fisioterapia deportiva explicita" }],
      description: "Servicios: masaje relajante, spa y estetica.",
    },
    request,
  )

  const trust = composeSection("trust", { services: business.services })
  const texts = allTexts(trust)
  assert.ok(texts.some((t) => t.includes("Fisioterapia deportiva explicita")))
  assert.ok(!texts.some((t) => t.includes("masaje relajante")))
})

// ---------------------------------------------------------------------------
// F) Missing business facts use safe fallback (byte-identical to pre-V2-S2).
// ---------------------------------------------------------------------------

test("V2-S2 F) sin hechos de negocio: trust/cta/features/process son identicos al fallback pre-existente", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const trust = composeSection("trust", {})
  const trustTexts = allTexts(trust)
  // V2-S2.1 updated this literal (builder-facing leak fix) -- see
  // semantic-content-personalization-v2-s2-1.test.ts for the dedicated
  // coverage. This test's own job (safe fallback when no facts) still
  // holds: the fallback is still fixed, generic, and fact-free.
  assert.ok(trustTexts.includes("Resolvemos tus dudas de forma clara y directa."))

  const ctaOverview = composeSection("cta", { archetype: "overview" })
  const ctaBody = Object.values(nodesOf(ctaOverview)).find((n) => n.type === "text" && n.props?.color === "#dbeafe")
  assert.equal(ctaBody!.props?.content, "Conoce el detalle completo de nuestros servicios y encuentra la opcion ideal.")

  const featuresOverview = composeSection("features", { archetype: "overview" })
  assert.deepEqual(headingTexts(featuresOverview), ["Mas confianza", "Menos friccion"])
})

// ---------------------------------------------------------------------------
// G) No unsupported superlatives/guarantees, across every fact-rich
//    scenario exercised above.
// ---------------------------------------------------------------------------

test("V2-S2 G) ninguna superlativa/garantia no soportada aparece en ningun escenario con hechos reales", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const scenarios = [
    composeSection("trust", { services: FISIOTERAPIA_SERVICES, location: "Monterrey" }),
    composeSection("trust", { products: RESTAURANT_DISHES }),
    composeSection("cta", { archetype: "catalog", products: RESTAURANT_DISHES }),
    composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" }),
    composeSection("features", { archetype: "catalog", services: FISIOTERAPIA_SERVICES }),
    composeSection("process", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" }),
  ]

  for (const section of scenarios) {
    assertNoForbidden(allTexts(section), FORBIDDEN_SUPERLATIVES, `escenario ${section?.role}`)
  }
})

// ---------------------------------------------------------------------------
// H) No builder-facing language in the touched surfaces (new V2-S2 copy
//    paths specifically).
// ---------------------------------------------------------------------------

test("V2-S2 H) ninguna de las superficies tocadas (trust/cta/features/process) contiene lenguaje dirigido al constructor del sitio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const scenarios = [
    composeSection("trust", { services: FISIOTERAPIA_SERVICES, location: "Monterrey" }),
    composeSection("trust", { products: RESTAURANT_DISHES }),
    composeSection("cta", { archetype: "catalog", products: RESTAURANT_DISHES }),
    composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" }),
    composeSection("features", { archetype: "catalog", services: FISIOTERAPIA_SERVICES }),
    composeSection("process", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" }),
  ]

  for (const section of scenarios) {
    assertNoForbidden(allTexts(section), BUILDER_FACING_PATTERNS, `escenario ${section?.role}`)
  }
})

// ---------------------------------------------------------------------------
// I) No mechanical full-list duplication across roles.
// ---------------------------------------------------------------------------

test("V2-S2 I) la lista completa de servicios/platillos reales no se repite mecanicamente en mas de un role -- solo trust la referencia como prosa acotada", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const { joinSpanishList } = await import("../../lib/orvenix-ai/composer/semantic-copy")

  const joined = joinSpanishList(FISIOTERAPIA_SERVICES.map((s) => s.name))

  const trust = composeSection("trust", { services: FISIOTERAPIA_SERVICES })
  const cta = composeSection("cta", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })
  const features = composeSection("features", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })
  const process = composeSection("process", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })

  const containsJoined = (section: unknown) => allTexts(section as never).some((t) => t.includes(joined))
  const hits = [trust, cta, features, process].filter(containsJoined).length
  assert.equal(hits, 1, "la frase completa con los 3 servicios solo debe aparecer en trust")

  // Ademas: ningun NOMBRE real aparece como encabezado (nivel 3) fuera del
  // propio role 'services' -- esa es la duplicacion mecanica prohibida.
  for (const section of [trust, cta, features, process]) {
    for (const heading of headingTexts(section)) {
      assert.ok(!FISIOTERAPIA_SERVICES.some((s) => s.name === heading), `'${heading}' no debio aparecer como encabezado fuera de 'services'`)
    }
  }
})

// ---------------------------------------------------------------------------
// J) Determinism: same input -> identical semantic copy.
// ---------------------------------------------------------------------------

test("V2-S2 J) misma entrada produce siempre la misma copia semantica (trust/cta/features/process)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const context = { services: FISIOTERAPIA_SERVICES, location: "Monterrey", businessObjective: "Conseguir citas de valoración", archetype: "catalog" as const }

  for (const role of ["trust", "cta", "features", "process"] as const) {
    const first = composeSection(role, context)
    const second = composeSection(role, context)
    assert.deepEqual(allTexts(first), allTexts(second), `role '${role}' no es deterministico`)
  }
})

// ---------------------------------------------------------------------------
// K) V2-S1 product/service surfaces remain correct (regression).
// ---------------------------------------------------------------------------

test("V2-S2 K) V2-S1: el role 'services' sigue listando los nombres reales sin cambios", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = composeSection("services", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })
  assert.deepEqual(headingTexts(services), FISIOTERAPIA_SERVICES.map((s) => s.name))
})

// ---------------------------------------------------------------------------
// L/M/N/O: V1/V2-1/V2-2/V2-3 contract preservation through the full pipeline.
// ---------------------------------------------------------------------------

test("V2-S2 L) Plan V2 sigue siendo valido con la copia semantica personalizada", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Centro Fisioterapia Prueba", industry: "fisioterapia", location: "Monterrey", services: FISIOTERAPIA_SERVICES, objective: "Conseguir citas de valoración" },
  })

  const validation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
})

test("V2-S2 M) Quality Gate no rechaza el plan con copia semantica personalizada", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { assessSiteGenerationQualityV1 } = await import("../../lib/orvenix-ai/evaluation/quality-gate")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Cocina Prueba", industry: "restaurante", location: "Puebla", products: RESTAURANT_DISHES, objective: "Conseguir reservaciones" },
  })

  const gate = assessSiteGenerationQualityV1(result.plan)
  assert.notEqual(gate.decision, "reject")
})

test("V2-S2 N) V2-2: el contrato de provenance del hero permanece intacto (placeholder src, sin fabricar asset)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Centro Fisioterapia Prueba", industry: "fisioterapia", location: "Monterrey", services: FISIOTERAPIA_SERVICES },
  })
  const home = result.plan.pages.find((p) => p.isHome)!
  const heroImage = Object.values(home.tree.nodes).find(
    (n) => n.type === "image" && (n.props?.alt === "Imagen principal del negocio" || (typeof n.props?.alt === "string" && n.props.alt.includes("imagen principal"))),
  )
  assert.ok(heroImage)
  assert.equal(heroImage!.props?.src, "")
  assert.equal(heroImage!.props?.asset, undefined)
})

test("V2-S2 O) V2-3: la seleccion estructural (variant selector) sigue siendo deterministica y no depende de la copia semantica", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  // Same structural-hash inputs (role/visualFamily/siteType/industry/...),
  // DIFFERENT factual copy inputs (services/products/location/objective) --
  // the chosen variant (displayName carries it) must be identical, because
  // the hash never reads those fields (see variant-selector.ts).
  const withoutFacts = composeSection("trust", { visualFamily: "health", industry: "fisioterapia" })
  const withFacts = composeSection("trust", { visualFamily: "health", industry: "fisioterapia", services: FISIOTERAPIA_SERVICES, location: "Monterrey" })
  assert.ok(withoutFacts && withFacts)
  const rootA = nodesOf(withoutFacts)[withoutFacts!.rootId]
  const rootB = nodesOf(withFacts)[withFacts!.rootId]
  assert.equal(rootA.displayName, rootB.displayName)
})
