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
// V2-S2.1: CTA coherence + visitor-facing copy fix, found by real-copy E2E
// review of V2-S2 (8643c05). Two fixes:
//
// (A) resolveCtaCopy resolved body/label independently, so an explicit
//     businessObjective could rewrite the body ("...conseguir solicitudes
//     de cotización.") next to a label the archetype picked BEFORE any
//     objective existed ("Agendar ahora") -- a real semantic mismatch.
//     Fixed by resolving heading/body/label as one decision, with a small
//     bounded, word-boundary-safe objective classifier (appointment/
//     quote/contact) driving the label wherever the label is meant to be
//     a real terminal action -- catalog/default archetypes. The OVERVIEW
//     archetype's label is a deliberate, hard-locked exception: Home's
//     CTA is a bridge to the Servicios page ("Ver servicios"), never a
//     terminal action itself, so its label never gets intent-swapped.
//     catalog+real-products (menu/catalog surfaces) still always wins
//     the label outright ("Ver catálogo"), regardless of objective.
//
// (B) Two live builder-facing trust/features fallback strings, found in
//     the same E2E pass, replaced with neutral visitor-safe copy that
//     invents no guarantee/certification/experience/result.
// ---------------------------------------------------------------------------

type Node = { type: string; props?: Record<string, unknown>; children?: string[] }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

function allTexts(section: { nodes: Record<string, Node> } | null): string[] {
  return Object.values(nodesOf(section))
    .filter((n) => n.type === "text" || n.type === "heading")
    .map((n) => String(n.props?.text ?? n.props?.content ?? ""))
    .filter(Boolean)
}

function ctaLabel(section: { nodes: Record<string, Node> } | null): string | undefined {
  return Object.values(nodesOf(section)).find((n) => n.type === "ctaButton")?.props?.label as string | undefined
}

function ctaBody(section: { nodes: Record<string, Node> } | null): string | undefined {
  const candidate = Object.values(nodesOf(section)).find(
    (n) => n.type === "text" && (n.props?.color === "#dbeafe" || n.props?.color === "#e2e8f0"),
  )
  return candidate?.props?.content as string | undefined
}

const FORBIDDEN_TRANSACTION_PATTERNS = [
  /reserva(r|ci[oó]n)? en l[ií]nea/i,
  /compra(r)? en l[ií]nea/i,
  /entrega a domicilio/i,
  /env[ií]o gratis/i,
  /descuento/i,
  /\bprecio\b/i,
  /inventario/i,
]

const FORBIDDEN_UNSUPPORTED_CLAIMS = [
  /garantiz/i,
  /certificad/i,
  /a[ñn]os de experiencia/i,
  /testimoni/i,
  /m[aá]xima calidad/i,
]

function assertNoneMatch(texts: string[], patterns: RegExp[], label: string) {
  for (const text of texts) {
    for (const pattern of patterns) {
      assert.ok(!pattern.test(text), `${label}: '${text}' coincide con patron prohibido ${pattern}`)
    }
  }
}

// ---------------------------------------------------------------------------
// A) Appointment objective: coherent appointment body + action.
// ---------------------------------------------------------------------------

test("V2-S2.1 A) objective de cita: body y accion coherentes ('Agendar ahora') en catalog", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" })
  assert.equal(ctaBody(cta), "Escríbenos para conseguir citas de valoración.")
  assert.equal(ctaLabel(cta), "Agendar ahora")
})

// ---------------------------------------------------------------------------
// B) Quote/cotización objective: coherent quote/contact body + action,
//    NEVER "Agendar ahora" merely because archetype=catalog.
// ---------------------------------------------------------------------------

test("V2-S2.1 B) objective de cotizacion: body y accion coherentes ('Solicitar cotización'), nunca 'Agendar ahora'", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir solicitudes de cotización" })
  assert.equal(ctaBody(cta), "Escríbenos para conseguir solicitudes de cotización.")
  assert.equal(ctaLabel(cta), "Solicitar cotización")
  assert.notEqual(ctaLabel(cta), "Agendar ahora")
})

// ---------------------------------------------------------------------------
// C) Generic/unrecognized contact objective: safe contact action.
// ---------------------------------------------------------------------------

test("V2-S2.1 C) objective generico sin señal de cita/cotizacion: accion de contacto segura", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir nuevos clientes" })
  assert.equal(ctaLabel(cta), "Contactar")
  assert.notEqual(ctaLabel(cta), "Agendar ahora")
  assert.notEqual(ctaLabel(cta), "Solicitar cotización")
})

// ---------------------------------------------------------------------------
// D) Product/menu catalog: no unsupported purchase/order action, no matter
//    what the objective says.
// ---------------------------------------------------------------------------

test("V2-S2.1 D) catalogo de productos: accion siempre 'Ver catálogo', sin importar el objective", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const dishes = [{ name: "Mole poblano" }, { name: "Enchiladas" }]

  const noObjective = composeSection("cta", { archetype: "catalog", products: dishes })
  assert.equal(ctaLabel(noObjective), "Ver catálogo")

  const withAppointmentObjective = composeSection("cta", { archetype: "catalog", products: dishes, businessObjective: "Conseguir reservaciones" })
  assert.equal(ctaLabel(withAppointmentObjective), "Ver catálogo")
  assert.notEqual(ctaLabel(withAppointmentObjective), "Agendar ahora")

  const withQuoteObjective = composeSection("cta", { archetype: "catalog", products: dishes, businessObjective: "Conseguir solicitudes de cotización" })
  assert.equal(ctaLabel(withQuoteObjective), "Ver catálogo")
})

// ---------------------------------------------------------------------------
// E) Unknown free-form objective: safe fallback, no invented capability.
// ---------------------------------------------------------------------------

test("V2-S2.1 E) objective libre/ambiguo sin señal clara: fallback de contacto seguro, sin inventar capacidad", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", businessObjective: "Aumentar la visibilidad de la marca" })
  assert.equal(ctaLabel(cta), "Contactar")
  assertNoneMatch([String(ctaBody(cta))], FORBIDDEN_TRANSACTION_PATTERNS, "objective ambiguo")
})

// ---------------------------------------------------------------------------
// F) Objective classifier: word-boundary-safe, no substring traps (the
//    historical inferSiteType-class bug: "identidad" contains "dent";
//    here "explícita" contains "cita").
// ---------------------------------------------------------------------------

test("V2-S2.1 F) clasificador de intencion: palabras que CONTIENEN un fragmento reconocido a mitad de palabra no disparan falsos positivos", async () => {
  const { classifyCtaIntent } = await import("../../lib/orvenix-ai/composer/semantic-copy")

  // "explícita"/"explicitas" contains "cita" as a raw substring -- must NOT classify as appointment.
  assert.equal(classifyCtaIntent("Ser una marca explícita en sus valores"), "contact")
  assert.equal(classifyCtaIntent("Comunicar referencias explicitas de nuestro trabajo"), "contact")

  // "solicitud"/"solicitudes" does not contain "cotizacion" -- must not misfire quote either.
  assert.equal(classifyCtaIntent("Recibir solicitudes de informacion"), "contact")

  // Real, whole-word signals DO still match (the classifier isn't broken by the guard).
  assert.equal(classifyCtaIntent("Conseguir citas"), "appointment")
  assert.equal(classifyCtaIntent("Conseguir cotizaciones"), "quote")
})

// ---------------------------------------------------------------------------
// G) Home/overview CTA: no body/action mismatch. Overview label is a
//    deliberate, hard-locked exception (bridge to Servicios) -- it never
//    gets intent-swapped, only the body reflects the real objective.
// ---------------------------------------------------------------------------

test("V2-S2.1 G) overview: la etiqueta se mantiene 'Ver servicios' (invariante V1/V2-3 preservada), el cuerpo sigue reflejando el objective real", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const withAppointment = composeSection("cta", { archetype: "overview", businessObjective: "Conseguir citas de valoración" })
  assert.equal(ctaLabel(withAppointment), "Ver servicios")
  assert.equal(ctaBody(withAppointment), "Escríbenos para conseguir citas de valoración.")

  const withQuote = composeSection("cta", { archetype: "overview", businessObjective: "Conseguir solicitudes de cotización" })
  assert.equal(ctaLabel(withQuote), "Ver servicios")
  assert.equal(ctaBody(withQuote), "Escríbenos para conseguir solicitudes de cotización.")

  const noObjective = composeSection("cta", { archetype: "overview" })
  assert.equal(ctaLabel(noObjective), "Ver servicios")
})

// ---------------------------------------------------------------------------
// H) Catalog CTA: no body/action mismatch for any recognized/unrecognized intent.
// ---------------------------------------------------------------------------

test("V2-S2.1 H) catalog: la etiqueta siempre coincide con la intencion real del objective (nunca 'Agendar ahora' para una intencion no-cita)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const cases: Array<[string, string]> = [
    ["Conseguir citas de valoración", "Agendar ahora"],
    ["Conseguir consultas", "Agendar ahora"],
    ["Conseguir solicitudes de cotización", "Solicitar cotización"],
    ["Conseguir un presupuesto rápido", "Solicitar cotización"],
    ["Conseguir nuevos clientes", "Contactar"],
  ]

  for (const [objective, expectedLabel] of cases) {
    const cta = composeSection("cta", { archetype: "catalog", businessObjective: objective })
    assert.equal(ctaLabel(cta), expectedLabel, `objective '${objective}' debio producir la etiqueta '${expectedLabel}'`)
  }
})

// ---------------------------------------------------------------------------
// I) Builder-facing trust strings absent.
// ---------------------------------------------------------------------------

test("V2-S2.1 I) trust: los 2 leaks identificados ya no aparecen; el resto de la seccion no cambio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", {})
  const texts = allTexts(trust)
  assert.ok(!texts.includes("Explica aquí qué hace confiable al negocio."))
  assert.ok(!texts.includes("Describe cómo trabajas y qué puede esperar el cliente."))
  // Item 3 was NOT identified as a live leak in this pass -- untouched.
  assert.ok(texts.includes("Muestra los canales reales de contacto y seguimiento."))
  assert.ok(texts.includes("Atención profesional"))
  assert.ok(texts.includes("Proceso claro"))
})

// ---------------------------------------------------------------------------
// J) Builder-facing features string absent.
// ---------------------------------------------------------------------------

test("V2-S2.1 J) features: el leak identificado ya no aparece en overview ni en el fallback legacy; el resto no cambio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const overview = composeSection("features", { archetype: "overview" })
  const overviewTexts = allTexts(overview)
  assert.ok(!overviewTexts.includes("Presenta pruebas, garantias o detalles que reduzcan dudas."))
  assert.ok(overviewTexts.includes("Menos friccion")) // untouched sibling item

  const legacy = composeSection("features", {})
  const legacyTexts = allTexts(legacy)
  assert.ok(!legacyTexts.includes("Presenta pruebas, garantias o detalles que reduzcan dudas."))
  assert.ok(legacyTexts.includes("Beneficios que se entienden al instante")) // title lock preserved
  assert.ok(legacyTexts.includes("Cuida cada punto de contacto para que el sitio se sienta profesional.")) // untouched sibling item
})

// ---------------------------------------------------------------------------
// K) Replacement fallback makes no unsupported factual claim.
// ---------------------------------------------------------------------------

test("V2-S2.1 K) las nuevas lineas de reemplazo no afirman garantias/certificaciones/experiencia/testimonios/calidad maxima que no fueron suplidas", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", {})
  const featuresOverview = composeSection("features", { archetype: "overview" })
  const featuresLegacy = composeSection("features", {})

  assertNoneMatch(allTexts(trust), FORBIDDEN_UNSUPPORTED_CLAIMS, "trust fallback")
  assertNoneMatch(allTexts(featuresOverview), FORBIDDEN_UNSUPPORTED_CLAIMS, "features overview fallback")
  assertNoneMatch(allTexts(featuresLegacy), FORBIDDEN_UNSUPPORTED_CLAIMS, "features legacy fallback")
})

// ---------------------------------------------------------------------------
// L/M/N/O/P) Accepted V2-S2 behavior preserved.
// ---------------------------------------------------------------------------

test("V2-S2.1 L) personalizacion factual de trust (servicios/productos/ubicacion reales) sigue intacta", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "Fisioterapia deportiva" }, { name: "Terapia manual" }]
  const trust = composeSection("trust", { services, location: "Monterrey" })
  const texts = allTexts(trust)
  assert.ok(texts.some((t) => t.includes("Fisioterapia deportiva") && t.includes("Terapia manual")))
  assert.ok(texts.some((t) => t.includes("Atendemos en Monterrey.")))
})

test("V2-S2.1 M) conteo real de features sigue intacto", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const services = [{ name: "A" }, { name: "B" }, { name: "C" }]
  const features = composeSection("features", { archetype: "catalog", services })
  assert.ok(allTexts(features).some((t) => t.includes("Cuenta con 3 servicios para elegir.")))
})

test("V2-S2.1 N) personalizacion del intro de process (objective real) sigue intacta", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const process = composeSection("process", { archetype: "catalog", businessObjective: "Conseguir citas de valoración" })
  assert.ok(allTexts(process).includes("Así te ayudamos a conseguir citas de valoración."))
})

test("V2-S2.1 O) guardia de duplicacion de lista completa sigue intacta tras el fix de CTA", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const { joinSpanishList } = await import("../../lib/orvenix-ai/composer/semantic-copy")
  const services = [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }]
  const joined = joinSpanishList(services.map((s) => s.name))

  const trust = composeSection("trust", { services })
  const cta = composeSection("cta", { archetype: "catalog", services, businessObjective: "Conseguir solicitudes de cotización" })
  const features = composeSection("features", { archetype: "catalog", services })
  const process = composeSection("process", { archetype: "catalog", services })

  const containsJoined = (section: unknown) => allTexts(section as never).some((t) => t.includes(joined))
  const hits = [trust, cta, features, process].filter(containsJoined).length
  assert.equal(hits, 1, "la frase completa con los 3 servicios solo debe aparecer en trust")
})

test("V2-S2.1 P) precedencia de hechos explicitos sobre inferidos sigue intacta", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const business = normalizeSiteCreationBusiness(
    {
      name: "Clinica Explicita",
      industry: "fisioterapia",
      services: [{ name: "Fisioterapia deportiva explicita" }],
      description: "Servicios: masaje relajante, spa y estetica.",
    },
    "Crea un sitio web profesional para Clinica Explicita.",
  )

  const trust = composeSection("trust", { services: business.services })
  const texts = allTexts(trust)
  assert.ok(texts.some((t) => t.includes("Fisioterapia deportiva explicita")))
  assert.ok(!texts.some((t) => t.includes("masaje relajante")))
})

// ---------------------------------------------------------------------------
// Q) Determinism.
// ---------------------------------------------------------------------------

test("V2-S2.1 Q) misma entrada produce siempre la misma copia de CTA", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const context = { archetype: "catalog" as const, businessObjective: "Conseguir solicitudes de cotización", services: [{ name: "Identidad visual" }] }
  const first = composeSection("cta", context)
  const second = composeSection("cta", context)
  assert.deepEqual(allTexts(first), allTexts(second))
  assert.equal(ctaLabel(first), ctaLabel(second))
})

// ---------------------------------------------------------------------------
// R) V2-S1 semantic surfaces remain correct (regression).
// ---------------------------------------------------------------------------

test("V2-S2.1 R) V2-S1: el role 'products' sigue listando los nombres reales sin cambios", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const products = [{ name: "Mole poblano" }, { name: "Enchiladas" }]
  const section = composeSection("products", { archetype: "catalog", products })
  const headings = Object.values(nodesOf(section))
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => String(n.props?.text))
  assert.deepEqual(headings, ["Mole poblano", "Enchiladas"])
})

// ---------------------------------------------------------------------------
// S) V2-3.1 structural/contrast invariant remains green after the
//    intentional literal-assertion update (see composition-variety-v2-3-1.test.ts).
// ---------------------------------------------------------------------------

test("V2-S2.1 S) V2-3.1: el mecanismo de contraste sigue derivando el color correcto del fondo de seccion tras el cambio de copia", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", {})
  const nodes = nodesOf(trust)
  const root = nodes[trust!.rootId]
  assert.equal(root?.props?.background, "#ffffff")
  const heading = Object.values(nodes).find((n) => n.type === "heading" && n.props?.text === "Razones para confiar")
  assert.equal(heading?.props?.color, "#0f172a")
})
