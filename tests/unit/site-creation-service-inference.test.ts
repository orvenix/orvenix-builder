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
// J9-G2: freeform -> structured services, at the ONE authoritative
// normalization boundary (normalizeSiteCreationBusiness), which composes
// inferServicesFromText only when the caller supplied no explicit services.
// ---------------------------------------------------------------------------

const FISIOTERAPIA_REQUEST =
  "Crea un sitio web profesional para Centro de Fisioterapia Monterrey. Ofrecemos fisioterapia deportiva, rehabilitación física y terapia manual en Monterrey. El objetivo principal es conseguir citas de valoración."

const ESTUDIO_NORTE_REQUEST =
  "Somos Estudio Norte en Guadalajara. Diseñamos logotipos, identidad visual y sitios web para pequeñas empresas."

test("A) inferServicesFromText: request exacto de J9-F1 produce los 3 servicios reales, en orden", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const services = inferServicesFromText(FISIOTERAPIA_REQUEST, { location: "monterrey" })

  assert.deepEqual(
    services.map((service) => service.name),
    ["fisioterapia deportiva", "rehabilitación física", "terapia manual"],
  )
})

test("B) inferServicesFromText: otra industria (diseño grafico) no depende de la frase 'Ofrecemos' ni del ejemplo de fisioterapia", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const services = inferServicesFromText(ESTUDIO_NORTE_REQUEST, { location: "guadalajara" })

  assert.deepEqual(
    services.map((service) => service.name),
    ["logotipos", "identidad visual", "sitios web"],
  )
})

test("C) normalizeSiteCreationBusiness: servicios estructurados explicitos ganan y no se reordenan ni se sobrescriben por inferencia", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")

  const result = normalizeSiteCreationBusiness(
    {
      name: "Centro de Fisioterapia Monterrey",
      industry: "fisioterapia",
      location: "Monterrey",
      objective: "Conseguir citas de valoracion",
      description: FISIOTERAPIA_REQUEST,
      services: [
        { name: "Consulta express", description: "Valoracion rapida inicial." },
        { name: "Programa mensual" },
      ],
    },
    FISIOTERAPIA_REQUEST,
  )

  assert.deepEqual(
    result.services?.map((service) => service.name),
    ["Consulta express", "Programa mensual"],
  )
})

test("C.1) normalizeSiteCreationBusiness: un array de servicios explicito pero VACIO se trata como 'no se proporcionaron servicios estructurados' (infiere), no como 'cero servicios intencional'", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")

  // Refleja el contrato real de la UI: el formulario siempre envia un
  // array (services: cleanServices), vacio cuando el usuario no llena las
  // filas de "Servicios principales" -- en ese caso SI queremos inferir
  // desde el texto libre, no tratarlo como "el usuario confirmo cero servicios".
  const result = normalizeSiteCreationBusiness(
    {
      name: "Centro de Fisioterapia Monterrey",
      location: "Monterrey",
      description: FISIOTERAPIA_REQUEST,
      services: [],
    },
    FISIOTERAPIA_REQUEST,
  )

  assert.deepEqual(
    result.services?.map((service) => service.name),
    ["fisioterapia deportiva", "rehabilitación física", "terapia manual"],
  )
})

test("D) inferServicesFromText: identidad/ubicacion/objetivo sin ofertas reales no inventa servicios", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const text =
    "Somos Consultora Aurora, ubicada en Puebla. Nuestro objetivo es generar mas prospectos calificados este trimestre."

  assert.deepEqual(inferServicesFromText(text, { location: "puebla" }), [])
})

test("E) inferServicesFromText: menciones repetidas del mismo servicio se deduplican", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const text =
    "Ofrecemos limpieza dental, limpieza dental y blanqueamiento dental en Leon. Realizamos limpieza dental tambien."

  const services = inferServicesFromText(text, { location: "leon" })
  const names = services.map((service) => service.name.toLowerCase())
  const uniqueNames = new Set(names)

  assert.equal(names.length, uniqueNames.size, "no debe haber nombres de servicio duplicados (normalizados)")
  assert.ok(names.includes("limpieza dental"))
  assert.ok(names.includes("blanqueamiento dental"))
})

test("F) inferServicesFromText: el nombre del negocio, la ubicacion y el objetivo no se convierten en servicios", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const services = inferServicesFromText(FISIOTERAPIA_REQUEST, { location: "monterrey" })
  const names = services.map((service) => service.name.toLowerCase())

  assert.equal(names.some((name) => name.includes("centro de fisioterapia monterrey")), false)
  assert.equal(names.some((name) => name === "monterrey" || name.includes("valoracion")), false)
})

test("G) inferServicesFromText: espacios y entradas vacias se sanean con seguridad", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  assert.deepEqual(inferServicesFromText(undefined), [])
  assert.deepEqual(inferServicesFromText(""), [])
  assert.deepEqual(inferServicesFromText("   "), [])

  const withMessySpacing = inferServicesFromText(
    "Ofrecemos   fisioterapia deportiva ,   rehabilitacion fisica   y terapia manual  en Monterrey.",
    { location: "monterrey" },
  )
  assert.deepEqual(
    withMessySpacing.map((service) => service.name),
    ["fisioterapia deportiva", "rehabilitacion fisica", "terapia manual"],
  )
})

test("Determinismo: la misma entrada produce exactamente la misma salida estructurada en corridas repetidas", async () => {
  const { inferServicesFromText } = await import("../../lib/orvenix-ai/site-creation/service-inference")

  const first = inferServicesFromText(FISIOTERAPIA_REQUEST, { location: "monterrey" })
  const second = inferServicesFromText(FISIOTERAPIA_REQUEST, { location: "monterrey" })

  assert.deepEqual(first, second)
})

// ---------------------------------------------------------------------------
// Phase 7 -- full pipeline: starts from the SAME freeform boundary function
// the real Site Creation action calls (normalizeSiteCreationBusiness), not
// from manually-injected services[].
// ---------------------------------------------------------------------------

type CompiledNode = { type: string; props?: Record<string, unknown>; children?: string[] }
type GeneratedPlanPage = {
  slug: string
  tree: { rootId: string; nodes: Record<string, CompiledNode> }
}

function findSiblingNodeByHeadingText(page: GeneratedPlanPage, headingText: string, siblingType: string): CompiledNode | undefined {
  const nodes = page.tree.nodes
  for (const node of Object.values(nodes)) {
    const children = (node.children ?? []).map((id) => nodes[id])
    const hasMatchingHeading = children.some((child) => child?.type === "heading" && child.props?.text === headingText)
    if (hasMatchingHeading) {
      return children.find((child) => child?.type === siblingType)
    }
  }
  return undefined
}

function findFooterNavText(page: GeneratedPlanPage): string | undefined {
  for (const node of Object.values(page.tree.nodes)) {
    if (node.type !== "text") continue
    const content = node.props?.content
    if (typeof content === "string" && content.includes(" · ")) return content
  }
  return undefined
}

function findFooterBrandText(page: GeneratedPlanPage): string | undefined {
  for (const node of Object.values(page.tree.nodes)) {
    if (node.type !== "heading") continue
    if (node.props?.level === 3 && node.props?.size === "xl" && node.props?.color === "#ffffff") {
      return typeof node.props?.text === "string" ? node.props.text : undefined
    }
  }
  return undefined
}

function cardTitlesUnder(page: GeneratedPlanPage, grid: CompiledNode | undefined): string[] {
  const nodes = page.tree.nodes
  return (grid?.children ?? [])
    .map((id) => nodes[id])
    .flatMap((card) => (card?.children ?? []).map((id) => nodes[id]))
    .map((node) => node?.props?.text)
    .filter((value): value is string => typeof value === "string")
}

test("J9-G2 + J9-G1 pipeline completo: el request exacto de J9-F1, sin servicios estructurados explicitos, produce servicios reales, footer real y CTAs correctos", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  // Misma frontera que usa la accion real: sin business.services explicito,
  // solo los campos estructurados de identidad + el texto libre de descripcion.
  const business = normalizeSiteCreationBusiness(
    {
      name: "Centro de Fisioterapia Monterrey",
      industry: "fisioterapia",
      location: "Monterrey",
      objective: "Conseguir citas de valoracion",
      description: FISIOTERAPIA_REQUEST,
    },
    FISIOTERAPIA_REQUEST,
  )

  assert.deepEqual(
    business.services?.map((service) => service.name),
    ["fisioterapia deportiva", "rehabilitación física", "terapia manual"],
    "la frontera de normalizacion debe producir los 3 servicios reales antes de tocar el builder",
  )

  const result = await runAutonomousMultiPageSiteBuilder({
    request: FISIOTERAPIA_REQUEST,
    forceFreshComposition: true,
    business: {
      name: business.name,
      industry: business.industry,
      location: business.location,
      description: business.description,
      objective: business.objective,
      services: business.services,
    },
  })

  assert.equal(result.ok, true)

  const home = result.plan.pages.find((page) => page.slug === "home")!
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!
  const contacto = result.plan.pages.find((page) => page.slug === "contacto")!

  // HOME: teaser (subconjunto), no el catalogo completo.
  const homeGrid = findSiblingNodeByHeadingText(home, "Lo que hacemos por ti", "genericWrapper")
  const homeTitles = cardTitlesUnder(home, homeGrid)
  assert.ok(homeTitles.length > 0 && homeTitles.length < 3, "Home debe mostrar un subconjunto, no el catalogo completo")
  for (const title of homeTitles) {
    assert.ok(
      ["fisioterapia deportiva", "rehabilitación física", "terapia manual"].includes(title),
      `Home muestra un titulo inesperado: "${title}"`,
    )
  }

  // SERVICIOS: los 3 servicios reales, completos.
  const serviciosGrid = findSiblingNodeByHeadingText(servicios, "Nuestro catalogo de servicios", "genericWrapper")
  const serviciosTitles = cardTitlesUnder(servicios, serviciosGrid)
  assert.deepEqual(
    serviciosTitles.sort(),
    ["fisioterapia deportiva", "rehabilitación física", "terapia manual"].sort(),
  )

  // FOOTER: nombre real del negocio, en las 3 paginas.
  for (const page of [home, servicios, contacto]) {
    assert.equal(findFooterBrandText(page), "Centro de Fisioterapia Monterrey")
  }

  // FOOTER NAV: Inicio/Servicios/Contacto, sin Precios/Productos.
  for (const page of [home, servicios, contacto]) {
    const navText = findFooterNavText(page)
    assert.equal(navText, "Inicio · Servicios · Contacto")
    assert.equal(navText?.includes("Precios"), false)
    assert.equal(navText?.includes("Productos"), false)
  }

  // Regresion CTA (J9-E1.1): no neutralizados, siguen diferenciados.
  const homeCta = findSiblingNodeByHeadingText(home, "Descubre todo lo que podemos hacer por ti", "ctaButton")
  const serviciosCta = findSiblingNodeByHeadingText(servicios, "¿Listo para dar el siguiente paso?", "ctaButton")
  assert.equal(homeCta?.props?.label, "Ver servicios")
  assert.equal(homeCta?.props?.href, "#servicios")
  assert.equal(serviciosCta?.props?.label, "Agendar ahora")
  assert.equal(serviciosCta?.props?.href, "#contacto")
})
