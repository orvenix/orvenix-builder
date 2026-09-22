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
// V2-S1: Semantic Intelligence Foundation. Extends the existing services
// contract with a parallel, optional `products` collection; generalizes
// service-inference.ts to a bounded, deterministic, kind-aware parser
// (service vs product, decided ONLY by the business's own wording); wires
// composeCardGridSection to consume real offerings for BOTH services and
// products; and switches the restaurant Menu page's architecture role from
// generic "content" to offering-aware "products" (a siteType-scoped rule,
// not a slug/business-name special case).
// ---------------------------------------------------------------------------

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; parentId?: string }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

/**
 * A full compiled page's node tree also carries OTHER level-3 headings
 * unrelated to the offering surface being checked -- eg. composeFooter's
 * brand heading is level 3 too. Scope the search to the "products"
 * section specifically: find it by its own known section title, walk up
 * to its "section" ancestor, then collect descendant level-3 headings
 * only within that subtree (same technique established in V2-3's tests).
 */
const PRODUCTS_SECTION_TITLES = ["Lo mas destacado", "Explora el catalogo completo"]

function collectProductsSectionTitles(nodes: Record<string, Node>): string[] {
  const sectionHeading = Object.values(nodes).find(
    (n) => n.type === "heading" && PRODUCTS_SECTION_TITLES.includes(String(n.props?.text)),
  )
  if (!sectionHeading) return []

  let sectionRoot: Node | undefined = sectionHeading
  while (sectionRoot && sectionRoot.type !== "section" && sectionRoot.parentId) {
    sectionRoot = nodes[sectionRoot.parentId]
  }
  if (!sectionRoot) return []

  const titles: string[] = []
  const visit = (node: Node | undefined) => {
    if (!node) return
    if (node.type === "heading" && node.props?.level === 3 && typeof node.props?.text === "string") titles.push(node.props.text)
    for (const id of node.children ?? []) visit(nodes[id])
  }
  visit(sectionRoot)
  return titles
}

function headingTexts(section: { nodes: Record<string, Node> } | null): string[] {
  return Object.values(nodesOf(section))
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => String(n.props?.text))
}

// ---------------------------------------------------------------------------
// A/B/C/D: service-inference.ts coverage and safety
// ---------------------------------------------------------------------------

test("V2-S1 A) inferencia V1 existente sigue funcionando: 'Ofrecemos A, B y C' extrae los 3 servicios", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")
  const result = inferServicesFromText("Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual.")
  assert.deepEqual(result.map((s) => s.name), ["fisioterapia deportiva", "rehabilitacion fisica", "terapia manual"])
  assert.ok(result.every((s) => s.kind === "service"))
})

test("V2-S1 B) fraseos comunes adicionales en espanol se reconocen: etiqueta con dos puntos, 'nos especializamos en', 'contamos con'", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const labelHeader = inferServicesFromText("Servicios: corte de cabello, barba y tinte.")
  assert.deepEqual(labelHeader.map((s) => s.name), ["corte de cabello", "barba", "tinte"])
  assert.ok(labelHeader.every((s) => s.kind === "service"))

  const specializes = inferServicesFromText("Nos especializamos en contabilidad, nomina y auditoria.")
  assert.deepEqual(specializes.map((s) => s.name), ["contabilidad", "nomina", "auditoria"])

  const counts = inferServicesFromText("Contamos con asesoria legal, tramites y notariado.")
  assert.deepEqual(counts.map((s) => s.name), ["asesoria legal", "tramites", "notariado"])
})

test("V2-S1 C) frases adversarias/sin patron claro no producen servicios inventados", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  // No lead-in phrase present at all.
  assert.deepEqual(inferServicesFromText("Somos un negocio familiar con mas de 10 anos de experiencia."), [])

  // "servicios" appears but NOT as an exact label header (extra words before the colon) -- must not match.
  assert.deepEqual(inferServicesFromText("Nuestros servicios de calidad: consulta."), [])

  // A single item after a legitimate lead-in verb is valid, PRE-EXISTING
  // V1 behavior (no comma/list required) -- not adversarial on its own.
  assert.deepEqual(inferServicesFromText("Brindamos servicios profesionales desde hace anios."), [
    { name: "servicios profesionales desde hace anios", kind: "service" },
  ])

  // Genuinely adversarial: no registered lead-in verb/label anywhere, and
  // "servicios" appears only mid-word-adjacent to unrelated text.
  assert.deepEqual(inferServicesFromText("Nuestros valores son honestidad, respeto y compromiso con la comunidad."), [])
  assert.deepEqual(inferServicesFromText("Somos una empresa fundada por profesionales con anios de trayectoria."), [])
})

test("V2-S1 D) duplicados (mismo nombre normalizado, distinto acento/mayusculas) se deduplican", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")
  const result = inferServicesFromText("Ofrecemos Fisioterapia, FISIOTERAPIA y fisioterapia deportiva.")
  const names = result.map((s) => s.name)
  assert.equal(names.filter((n) => n.toLowerCase() === "fisioterapia").length, 1)
})

test("V2-S1 D2) etiqueta 'Platillos:' se clasifica como product, no service", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")
  const result = inferServicesFromText("Platillos: mole poblano, chiles en nogada y enchiladas.")
  assert.deepEqual(result.map((s) => s.name), ["mole poblano", "chiles en nogada", "enchiladas"])
  assert.ok(result.every((s) => s.kind === "product"))
})

// ---------------------------------------------------------------------------
// E: explicit input outranks inference
// ---------------------------------------------------------------------------

test("V2-S1 E) servicios/productos estructurados explicitos tienen precedencia sobre la inferencia", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")

  const business = normalizeSiteCreationBusiness(
    {
      name: "Negocio X",
      description: "Ofrecemos corte de cabello, barba y tinte.",
      services: [{ name: "Servicio explicito unico" }],
    },
    "req",
  )

  assert.deepEqual(business.services, [{ name: "Servicio explicito unico", description: "" }])
})

// ---------------------------------------------------------------------------
// F/G: products role real-data path + safe fallback
// ---------------------------------------------------------------------------

test("V2-S1 F) rol 'products' consume datos reales de producto/oferta cuando existen", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("products", {
    archetype: "catalog",
    products: [{ name: "Mole poblano", description: "Platillo tradicional con chocolate y chiles." }, { name: "Chiles en nogada" }, { name: "Enchiladas" }],
  })
  assert.ok(section)
  const titles = headingTexts(section)
  assert.ok(titles.includes("Mole poblano"))
  assert.ok(titles.includes("Chiles en nogada"))
  assert.ok(titles.includes("Enchiladas"))
})

test("V2-S1 G) rol 'products' sin items reales NO fabrica productos (fallback generico existente, sin cambios)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("products", { archetype: "catalog" })
  assert.ok(section)
  const titles = headingTexts(section)
  // Exactly the pre-existing, generic, non-factual CARD_GRID_ARCHETYPE_COPY.products.catalog items -- never an invented dish/product name.
  assert.deepEqual(titles, ["Variedad disponible", "Detalle por opcion", "Listo para elegir"])
})

// ---------------------------------------------------------------------------
// H/I: restaurant menu architecture, full pipeline
// ---------------------------------------------------------------------------

test("V2-S1 H) arquitectura de menu de restaurante consume platillos explicitamente suministrados", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: {
      name: "Fixture De Prueba",
      industry: "restaurante",
      location: "Puebla",
      products: [
        { name: "Mole poblano", description: "Platillo tradicional con chocolate y chiles." },
        { name: "Chiles en nogada" },
        { name: "Enchiladas" },
      ],
    },
  })

  assert.equal(result.architecture.siteType, "restaurant")
  const menu = result.plan.pages.find((p) => p.slug === "menu")!
  assert.ok(menu, "la pagina 'menu' debe existir")

  const titles = collectProductsSectionTitles(menu.tree.nodes as Record<string, Node>)

  assert.deepEqual(titles, ["Mole poblano", "Chiles en nogada", "Enchiladas"])
})

test("V2-S1 I) restaurante SIN platillos suministrados no inventa platillos", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  // Sabores del Valle's accepted benchmark fixture: no explicit products,
  // and its description (or lack of one) does not match any offering
  // lead-in pattern -- the correct, honest result is the safe generic
  // fallback, never fabricated dish names.
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Sabores del Valle", industry: "restaurante", location: "Puebla" },
  })

  const menu = result.plan.pages.find((p) => p.slug === "menu")!
  const titles = collectProductsSectionTitles(menu.tree.nodes as Record<string, Node>)

  const fabricatedLookingDishNames = ["Mole poblano", "Chiles en nogada", "Enchiladas", "Tacos", "Pozole"]
  for (const dish of fabricatedLookingDishNames) assert.ok(!titles.includes(dish), `no debio inventar el platillo '${dish}'`)
  // The honest result is the pre-existing generic products.catalog copy.
  assert.deepEqual(titles, ["Variedad disponible", "Detalle por opcion", "Listo para elegir"])
})

// ---------------------------------------------------------------------------
// J/K: category integrity + determinism
// ---------------------------------------------------------------------------

test("V2-S1 J) negocio de servicios permanece orientado a servicios (no termina clasificado como productos)", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const business = normalizeSiteCreationBusiness(
    { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", description: "Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual." },
    "req",
  )
  assert.ok(business.services?.length)
  assert.equal(business.products, undefined)
})

test("V2-S1 K) misma entrada es deterministica", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const business = { name: "Fixture De Prueba", industry: "restaurante", location: "Puebla", products: [{ name: "Mole poblano" }, { name: "Enchiladas" }] }

  const first = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business })
  const second = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business })

  const titlesOf = (r: typeof first) =>
    collectProductsSectionTitles(r.plan.pages.find((p) => p.slug === "menu")!.tree.nodes as Record<string, Node>)

  assert.deepEqual(titlesOf(first), titlesOf(second))
})

// ---------------------------------------------------------------------------
// L/M/N/O: V1/V2-1/V2-2/V2-3 contract preservation
// ---------------------------------------------------------------------------

test("V2-S1 L) Plan V2 sigue siendo valido con productos reales", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Fixture De Prueba", industry: "restaurante", location: "Puebla", products: [{ name: "Mole poblano" }, { name: "Enchiladas" }] },
  })

  const validation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
})

test("V2-S1 M) V2-2: la estructura de nodo imagen (contrato de provenance) permanece intacta para el hero del menu", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Fixture De Prueba", industry: "restaurante", location: "Puebla", products: [{ name: "Mole poblano" }] },
  })
  const home = result.plan.pages.find((p) => p.isHome)!
  const heroImage = Object.values(home.tree.nodes).find(
    (n) => n.type === "image" && (n.props?.alt === "Imagen principal del negocio" || (typeof n.props?.alt === "string" && n.props.alt.includes("imagen principal"))),
  )
  assert.ok(heroImage)
  // No PEXELS_API_KEY in this test environment -- placeholder preserved, asset field absent (never fabricated).
  assert.equal(heroImage!.props?.src, "")
})

test("V2-S1 N) V2-3: la seleccion estructural (variant selector) sigue siendo deterministica", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const context = { visualFamily: "hospitality", industry: "restaurante", archetype: "catalog" as const, products: [{ name: "Mole poblano" }, { name: "Enchiladas" }] }
  const first = composeSection("products", context)
  const second = composeSection("products", context)
  assert.deepEqual(headingTexts(first), headingTexts(second))
})

test("V2-S1 O) regresion inferSiteType existente ('identidad visual' de Estudio Norte) sigue intacta", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseno",
    business: {
      name: "Estudio Norte",
      industry: "diseno grafico",
      location: "Guadalajara",
      description: "Disenamos logotipos, identidad visual y sitios web para negocios en Guadalajara.",
      objective: "Conseguir solicitudes de cotizacion",
    },
  })
  assert.equal(architecture.siteType, "business")
})

test("V2-S1 O2) el rol de la pagina 'menu' de restaurante sigue siendo determinado por siteType, no por slug/nombre de negocio", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const architecture = buildSiteArchitecture({
    request: "req",
    business: { name: "Cualquier Nombre De Negocio", industry: "restaurante" },
  })
  const menuPage = architecture.pages.find((p) => p.slug === "menu")!
  assert.ok(menuPage.sections.some((s) => s.role === "products"))
  assert.ok(!menuPage.sections.some((s) => s.role === "content"))
})
