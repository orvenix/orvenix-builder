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
// V2-S3: Business Narrative / Hero Depth. getPageAwareHeroCopy's fallback
// tier (content/hero-narrative.ts) replaces the single universal sentence
// "${name}: una forma más clara de presentar lo que haces" -- previously
// identical for ANY industry outside the 4 specialized categories (dental/
// restaurant/agency/ecommerce) -- with copy grounded in real facts already
// on the context object (a real offering, businessObjective, location),
// using VisualFamily (already resolved elsewhere, V2-1.1) as a broad
// narrative-mode selector. The 4 specialized categories are untouched.
// ---------------------------------------------------------------------------

const OLD_UNIVERSAL_TAIL = "una forma más clara de presentar lo que haces"

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; parentId?: string }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

function heroH1(section: { nodes: Record<string, Node> } | null): string | undefined {
  return Object.values(nodesOf(section)).find((n) => n.type === "heading" && n.props?.level === 1)?.props?.text as string | undefined
}

/**
 * Scoped to the SAME section as the H1 (walking up via parentId to the
 * nearest "section" ancestor, then searching only within that subtree) --
 * required for full-pipeline (whole-page) trees, where the products/
 * services role's own intro text ALSO uses size:"lg" and an unscoped
 * whole-page search would ambiguously collide with it (composeSection's
 * own isolated hero-only output has no such ambiguity, but is scoped the
 * same way here for one consistent helper).
 */
function heroDescription(section: { nodes: Record<string, Node> } | null): string | undefined {
  const nodes = nodesOf(section)
  const h1 = Object.values(nodes).find((n) => n.type === "heading" && n.props?.level === 1)
  if (!h1) return undefined

  let sectionRoot: Node = h1
  while (sectionRoot.type !== "section" && sectionRoot.parentId) {
    sectionRoot = nodes[sectionRoot.parentId]
  }

  // Isolated composeSection() output has no parentId chain at all --
  // sectionRoot stays as h1 itself in that case (never reaches "section"),
  // so fall back to a whole-tree search, which is safe there: an isolated
  // hero section has exactly one size:"lg" text node, no ambiguity.
  if (sectionRoot.type !== "section") {
    return Object.values(nodes).find((n) => n.type === "text" && n.props?.size === "lg")?.props?.content as string | undefined
  }

  let found: string | undefined
  const visit = (node: Node | undefined) => {
    if (!node || found !== undefined) return
    if (node.type === "text" && node.props?.size === "lg") {
      found = node.props?.content as string | undefined
      return
    }
    for (const id of node.children ?? []) visit(nodes[id])
  }
  visit(sectionRoot)
  return found
}

const FORBIDDEN_CLAIMS = [
  // Superlative SELF-claims ("somos los mejores", "el mejor servicio") --
  // deliberately NOT a bare \bmejor\b ban, which would also match ordinary
  // benign comparative phrasing describing the VISITOR's own choice (eg.
  // pre-existing, untouched catalogPageHeroCopy's "elige la que mejor se
  // adapte a lo que necesitas" -- "whichever best fits you", not a claim
  // about the business).
  /somos (el|los) mejor(es)?\b/i,
  /\b(el mejor|los mejores|la mejor|las mejores)\s+(servicio|negocio|opci[oó]n|equipo|producto)/i,
  /\bl[ií]der(es)?\b/i,
  /a[ñn]os de experiencia/i,
  /credencial/i,
  /certificad/i,
  /garantiz/i,
  /resultados? garantizados?/i,
  /testimoni/i,
  /premiad/i,
  /premio/i,
  /metodolog[ií]a propia/i,
  /precio/i,
  /descuento/i,
  /env[ií]o gratis/i,
  /inventario/i,
  /disponibilidad/i,
  /en l[ií]nea ahora/i,
  /agenda en l[ií]nea/i,
  /compra ahora/i,
  /especializad[oa]/i,
  /expert[oa]/i,
  /premium/i,
  /aut[eé]ntic[oa]/i,
]

const BUILDER_LANGUAGE = [/\bedita\b/i, /\bconfigura\b/i, /reemplaza/i, /personaliza/i, /plantilla/i, /placeholder/i]

function assertNoneMatch(texts: string[], patterns: RegExp[], label: string) {
  for (const text of texts) {
    for (const pattern of patterns) {
      assert.ok(!pattern.test(text), `${label}: '${text}' coincide con patron prohibido ${pattern}`)
    }
  }
}

// ---------------------------------------------------------------------------
// A) Physiotherapy
// ---------------------------------------------------------------------------

test("V2-S3 A) fisioterapia: sin el fallback universal antiguo, con contexto real, sin fabricar resultados medicos", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }]
  const hero = composeSection("hero", { archetype: "overview", businessName: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", visualFamily: "health", services })
  const h1 = heroH1(hero)
  assert.ok(h1)
  assert.ok(!h1!.includes(OLD_UNIVERSAL_TAIL))
  assert.equal(h1, "Centro de Fisioterapia Monterrey: fisioterapia deportiva y más")
  assertNoneMatch([h1!, heroDescription(hero) ?? ""], FORBIDDEN_CLAIMS, "fisioterapia hero")
})

// ---------------------------------------------------------------------------
// B) Creative studio
// ---------------------------------------------------------------------------

test("V2-S3 B) estudio creativo: sin fallback universal, framing de proyecto/creativo, sin fabricar premios/clientes/metodologia", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "Identidad visual" }, { name: "Diseño editorial" }, { name: "Diseño para redes sociales" }]
  const hero = composeSection("hero", { archetype: "overview", businessName: "Taller Trama Estudio Creativo", industry: "estudio creativo", visualFamily: "creative", services })
  const h1 = heroH1(hero)
  assert.ok(h1)
  assert.ok(!h1!.includes(OLD_UNIVERSAL_TAIL))
  assert.equal(h1, "Taller Trama Estudio Creativo: identidad visual y más")
  assertNoneMatch([h1!, heroDescription(hero) ?? ""], FORBIDDEN_CLAIMS, "creative hero")

  // Sparse creative (no services/objective) still gets a creative-mode framing, not the universal template.
  const sparse = composeSection("hero", { archetype: "overview", businessName: "Estudio Vacío", industry: "diseno grafico", visualFamily: "creative" })
  const sparseH1 = heroH1(sparse)
  assert.ok(!sparseH1!.includes(OLD_UNIVERSAL_TAIL))
  assert.ok(["ideas con propósito", "diseño con intención"].some((tail) => sparseH1 === `Estudio Vacío: ${tail}`))
})

// ---------------------------------------------------------------------------
// C) Professional consulting
// ---------------------------------------------------------------------------

test("V2-S3 C) consultoria profesional: sin fallback universal, framing conservador, sin fabricar expertise/experiencia", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const hero = composeSection("hero", { archetype: "overview", businessName: "Consultoría Río", industry: "consultoría general", visualFamily: "professional", businessObjective: "Conseguir nuevos clientes" })
  const h1 = heroH1(hero)
  assert.ok(h1)
  assert.ok(!h1!.includes(OLD_UNIVERSAL_TAIL))
  // "Conseguir nuevos clientes" has no appointment/quote signal -> falls to the family/sparse pool (contact intent has no dedicated tail phrase).
  assert.ok(["un aliado para tus próximos pasos", "soluciones claras para tu proyecto"].some((tail) => h1 === `Consultoría Río: ${tail}`))
  assertNoneMatch([h1!, heroDescription(hero) ?? ""], FORBIDDEN_CLAIMS, "professional hero")
})

// ---------------------------------------------------------------------------
// D/E/F/G) Existing specialized categories preserved byte-for-byte
// ---------------------------------------------------------------------------

test("V2-S3 D) dental preservado exactamente", async () => {
  const { getPageAwareHeroCopy } = await import("../../lib/orvenix-ai/content/content-engine")
  const copy = getPageAwareHeroCopy({ industry: "salud dental", page: { archetype: "overview" } })
  assert.equal(copy.title, "Cuida tu sonrisa con atención clara y personalizada")
  assert.equal(copy.eyebrow, "Atención dental profesional")
})

test("V2-S3 E) restaurante preservado exactamente", async () => {
  const { getPageAwareHeroCopy } = await import("../../lib/orvenix-ai/content/content-engine")
  const copy = getPageAwareHeroCopy({ name: "Sabores del Valle", industry: "restaurante", page: { archetype: "overview" } })
  assert.equal(copy.title, "Sabores que convierten una comida en un buen recuerdo")
})

test("V2-S3 F) agencia preservada exactamente", async () => {
  const { getPageAwareHeroCopy } = await import("../../lib/orvenix-ai/content/content-engine")
  const copy = getPageAwareHeroCopy({ name: "Agencia Norte", industry: "agencia de marketing", page: { archetype: "overview" } })
  assert.equal(copy.title, "Haz crecer tu negocio con una presencia que comunica y convierte")
})

test("V2-S3 G) ecommerce/tienda preservado exactamente", async () => {
  const { getPageAwareHeroCopy } = await import("../../lib/orvenix-ai/content/content-engine")
  const copy = getPageAwareHeroCopy({ name: "Tienda Luna", industry: "ecommerce de accesorios", page: { archetype: "overview" } })
  assert.equal(copy.title, "Encuentra productos pensados para ti")
})

// ---------------------------------------------------------------------------
// H) Sparse unknown business: safe deterministic varied fallback
// ---------------------------------------------------------------------------

test("V2-S3 H) negocio disperso/desconocido: fallback seguro y deterministico, no el mismo template universal", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const hero = composeSection("hero", { archetype: "overview", businessName: "Negocio Sin Datos" })
  const h1 = heroH1(hero)
  assert.ok(h1)
  assert.ok(!h1!.includes(OLD_UNIVERSAL_TAIL))
  // No visualFamily -> falls to the "professional" default pool.
  assert.ok(["un aliado para tus próximos pasos", "soluciones claras para tu proyecto"].some((tail) => h1 === `Negocio Sin Datos: ${tail}`))
})

// ---------------------------------------------------------------------------
// I) Determinism
// ---------------------------------------------------------------------------

test("V2-S3 I) misma entrada produce siempre la misma copia de Hero", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const context = { archetype: "overview" as const, businessName: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", visualFamily: "health", services: [{ name: "Fisioterapia deportiva" }] }
  const first = composeSection("hero", context)
  const second = composeSection("hero", context)
  assert.equal(heroH1(first), heroH1(second))
  assert.equal(heroDescription(first), heroDescription(second))
})

// ---------------------------------------------------------------------------
// J) Different businesses, same family, different facts => different Hero copy
// ---------------------------------------------------------------------------

test("V2-S3 J) misma familia visual, hechos distintos => copia de Hero distinta", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const a = composeSection("hero", { archetype: "overview", businessName: "Centro A", visualFamily: "health", services: [{ name: "Fisioterapia deportiva" }] })
  const b = composeSection("hero", { archetype: "overview", businessName: "Centro A", visualFamily: "health", services: [{ name: "Podología clínica" }] })
  assert.notEqual(heroH1(a), heroH1(b))
})

// ---------------------------------------------------------------------------
// K) Home vs Servicios: contextually different Hero copy (full pipeline)
// ---------------------------------------------------------------------------

test("V2-S3 K) mismo negocio, Home vs Servicios => copia de Hero contextualmente distinta", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", services: [{ name: "Fisioterapia deportiva" }] },
  })
  const home = result.plan.pages.find((p) => p.isHome)!
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  assert.notEqual(heroH1(home.tree as never), heroH1(servicios.tree as never))
})

// ---------------------------------------------------------------------------
// L) Product/menu page: offering context without inventing commerce capability
// ---------------------------------------------------------------------------

test("V2-S3 L) pagina de menu/catalogo: usa contexto de oferta sin inventar capacidad de venta/pedido", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Cocina Tradicional Puebla", industry: "restaurante de cocina mexicana tradicional", products: [{ name: "Mole poblano" }, { name: "Enchiladas" }] },
  })
  const menu = result.plan.pages.find((p) => p.slug === "menu")!
  const menuH1 = heroH1(menu.tree as never)
  const menuDescription = heroDescription(menu.tree as never)
  assert.ok(menuH1)
  // catalogPageHeroCopy (untouched by V2-S3) -- still the existing, safe, non-transactional framing.
  assert.equal(menuH1, "Conoce nuestros especialidades y experiencias")
  assertNoneMatch([menuH1!, menuDescription ?? ""], FORBIDDEN_CLAIMS, "menu hero")
})

// ---------------------------------------------------------------------------
// M) Objective use remains grammatically coherent
// ---------------------------------------------------------------------------

test("V2-S3 M) el uso del objective en la descripcion del Hero es gramaticalmente coherente", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  // Deliberately a name that does NOT already contain the location (unlike
  // "Centro de Fisioterapia Monterrey"), so buildLocationPhrase's existing
  // duplication guard doesn't suppress " en {location}" here -- that guard
  // has its own dedicated coverage elsewhere; this test is about the
  // objective sentence itself.
  const hero = composeSection("hero", { archetype: "overview", businessName: "Clínica Aurora", location: "Monterrey", businessObjective: "Conseguir citas de valoración" })
  assert.equal(heroDescription(hero), "Clínica Aurora en Monterrey está aquí para ayudarte a conseguir citas de valoración.")
})

// ---------------------------------------------------------------------------
// N) Offering names not fully duplicated into Hero
// ---------------------------------------------------------------------------

test("V2-S3 N) el Hero nunca vuelca la lista completa de ofertas reales, solo una", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }]
  const hero = composeSection("hero", { archetype: "overview", businessName: "Centro de Fisioterapia Monterrey", visualFamily: "health", services })
  const h1 = heroH1(hero)!
  // The primary offering is lowercased for natural mid-sentence continuation ("${name}: fisioterapia deportiva y más").
  assert.ok(h1.includes("fisioterapia deportiva"))
  assert.ok(!h1.toLowerCase().includes("rehabilitación postoperatoria"))
  assert.ok(!h1.toLowerCase().includes("terapia manual"))
})

// ---------------------------------------------------------------------------
// O/P) No unsupported claims, no builder-facing language, across all
// family-grounded scenarios exercised above.
// ---------------------------------------------------------------------------

test("V2-S3 O/P) ningun escenario familia-fundamentado contiene afirmaciones no soportadas ni lenguaje dirigido al constructor", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const scenarios = [
    composeSection("hero", { archetype: "overview", businessName: "Centro de Fisioterapia Monterrey", visualFamily: "health", services: [{ name: "Fisioterapia deportiva" }] }),
    composeSection("hero", { archetype: "overview", businessName: "Taller Trama", visualFamily: "creative", services: [{ name: "Identidad visual" }] }),
    composeSection("hero", { archetype: "overview", businessName: "Consultoría Río", visualFamily: "professional", businessObjective: "Conseguir nuevos clientes" }),
    composeSection("hero", { archetype: "overview", businessName: "Tienda Sin Familia", visualFamily: "commerce" }),
    composeSection("hero", { archetype: "overview", businessName: "Espacio Sin Familia", visualFamily: "hospitality" }),
    composeSection("hero", { archetype: "overview", businessName: "Negocio Disperso" }),
  ]
  for (const hero of scenarios) {
    const texts = [heroH1(hero) ?? "", heroDescription(hero) ?? ""]
    assertNoneMatch(texts, FORBIDDEN_CLAIMS, `escenario Hero`)
    assertNoneMatch(texts, BUILDER_LANGUAGE, `escenario Hero`)
  }
})

// ---------------------------------------------------------------------------
// Q) Word-boundary adversarial cases (new keyword surface: none introduced
// here directly -- classifyCtaIntent is reused unchanged; VisualFamily's
// own classifier, already regression-tested, is only CONSUMED here, never
// re-derived). Re-verify the objective-intent classifier's adversarial
// safety specifically in the Hero-narrative context.
// ---------------------------------------------------------------------------

test("V2-S3 Q) seguridad de limite de palabra: 'explicita' no dispara framing de cita en el Hero", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const hero = composeSection("hero", { archetype: "overview", businessName: "Marca Explícita", visualFamily: "professional", businessObjective: "Ser una marca explícita en sus valores" })
  const h1 = heroH1(hero)
  assert.notEqual(h1, "Marca Explícita: conoce cómo agendar tu cita")
})

// ---------------------------------------------------------------------------
// R/S) Historical + physiotherapy site-type regressions preserved
// ---------------------------------------------------------------------------

test("V2-S3 R) 'Identidad visual' sigue sin clasificar health (regresion historica)", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseno",
    business: { name: "Estudio Norte", industry: "diseño gráfico", description: "Diseñamos logotipos, identidad visual y sitios web." },
  })
  assert.equal(architecture.siteType, "business")
})

test("V2-S3 S) fisioterapia sigue clasificando health (regresion del follow-up de site-type)", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({ request: "req", business: { industry: "fisioterapia" } })
  assert.equal(architecture.siteType, "health")
})

// ---------------------------------------------------------------------------
// T-Y) Downstream preservation
// ---------------------------------------------------------------------------

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  objective: "Conseguir citas de valoración",
  services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
}

test("V2-S3 T) Plan V2 sigue siendo valido con el nuevo Hero fundamentado en hechos", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const validation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
})

test("V2-S3 U) V2-1: direccion visual determinista no afectada por el cambio de copia del Hero", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  assert.equal(result.plan.theme.colors?.primary, "#1794CC")
  assert.equal(result.plan.theme.fontHeading, "Inter")
})

test("V2-S3 V) V2-2: el placeholder de provenance del hero permanece intacto", async () => {
  assert.equal(process.env.PEXELS_API_KEY, undefined)
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const home = result.plan.pages.find((p) => p.isHome)!
  const heroImage = Object.values(home.tree.nodes).find(
    (n) => n.type === "image" && (n.props?.alt === "Imagen principal del negocio" || (typeof n.props?.alt === "string" && n.props.alt.includes("imagen principal"))),
  )
  assert.ok(heroImage)
  assert.equal(heroImage!.props?.src, "")
})

test("V2-S3 W) V2-3: determinismo estructural preservado (misma entrada -> mismo conteo de nodos)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const first = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const second = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  assert.deepEqual(
    first.plan.pages.map((p) => Object.keys(p.tree.nodes).length),
    second.plan.pages.map((p) => Object.keys(p.tree.nodes).length),
  )
})

test("V2-S3 X) V2-S1: el role 'services' sigue listando los nombres reales sin cambios", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }]
  const section = composeSection("services", { archetype: "catalog", services })
  const headings = Object.values(nodesOf(section))
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  assert.deepEqual(headings, services.map((s) => s.name))
})

test("V2-S3 Y) V2-S2: trust/CTA semanticos siguen intactos tras el cambio de Hero", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const home = result.plan.pages.find((p) => p.isHome)!
  const trustTexts = Object.values(home.tree.nodes)
    .filter((n) => n.type === "text")
    .map((n) => n.props?.content)
  assert.ok(trustTexts.some((t) => typeof t === "string" && t.includes("Fisioterapia deportiva") && t.includes("Rehabilitación postoperatoria")))
})

// ---------------------------------------------------------------------------
// Section 14: cross-business collision check. Recreates the reassessment's
// representative businesses; OLD_UNIVERSAL_FALLBACK_COLLISIONS must be 0
// among fact-rich fixtures (the reassessment found the collision in 3/6).
// ---------------------------------------------------------------------------

test("V2-S3 cross-business: 0 colisiones con el fallback universal antiguo entre fixtures ricas en hechos", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const businesses = {
    FISIOTERAPIA: { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }], objective: "Conseguir citas de valoración" },
    CLINICA_DENTAL: { name: "Clínica Dental Sonrisa Total", industry: "salud dental" },
    RESTAURANT: { name: "Cocina Tradicional Puebla", industry: "restaurante de cocina mexicana tradicional", products: [{ name: "Mole poblano" }] },
    CREATIVE: { name: "Taller Trama Estudio Creativo", industry: "estudio creativo", services: [{ name: "Identidad visual" }, { name: "Diseño editorial" }], objective: "Conseguir solicitudes de cotización" },
    PROFESSIONAL: { name: "Consultoría Río", industry: "consultoría general", objective: "Conseguir nuevos clientes" },
    ECOMMERCE: { name: "Tienda Luna", industry: "ecommerce de accesorios" },
  }

  const titles: Record<string, string> = {}
  for (const [key, business] of Object.entries(businesses)) {
    const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business })
    const home = result.plan.pages.find((p) => p.isHome)!
    titles[key] = heroH1(home.tree as never) ?? ""
  }

  const factRichKeys = ["FISIOTERAPIA", "CREATIVE", "PROFESSIONAL"] // the 3 that collided in the V2-S3 audit
  for (const key of factRichKeys) {
    assert.ok(!titles[key].includes(OLD_UNIVERSAL_TAIL), `${key} todavia usa el fallback universal antiguo: '${titles[key]}'`)
  }

  const oldUniversalCollisions = factRichKeys.filter((key) => titles[key].endsWith(OLD_UNIVERSAL_TAIL)).length
  assert.equal(oldUniversalCollisions, 0, `OLD_UNIVERSAL_FALLBACK_COLLISIONS debe ser 0, evidencia: ${JSON.stringify(titles, null, 2)}`)

  // Not asserting all 6 titles are mutually unique -- legitimately equivalent
  // facts may legitimately produce equivalent wording. Report instead of forcing artificial uniqueness.
  const uniqueTitles = new Set(Object.values(titles))
  assert.ok(uniqueTitles.size >= 5, `se esperaban al menos 5 titulos distintos entre 6 negocios variados, evidencia: ${JSON.stringify(titles, null, 2)}`)
})
