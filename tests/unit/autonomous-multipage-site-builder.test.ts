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
type GeneratedPlanPage = {
  slug: string
  tree: {
    rootId: string
    nodes: Record<string, { id: string; type: string; props?: Record<string, unknown>; children?: string[] }>
  }
}

function walkNodeIds(page: GeneratedPlanPage) {
  const ids: string[] = []
  const seen = new Set<string>()

  function visit(id: string) {
    if (!id || seen.has(id)) return
    seen.add(id)
    ids.push(id)
    const node = page.tree.nodes[id]
    for (const childId of node?.children ?? []) visit(childId)
  }

  visit(page.tree.rootId)
  return ids
}

function duplicateIdsBetween(a: GeneratedPlanPage, b: GeneratedPlanPage) {
  const aIds = new Set(walkNodeIds(a))
  return walkNodeIds(b).filter((id) => aIds.has(id))
}

function firstHeadingText(page: GeneratedPlanPage) {
  const ids = walkNodeIds(page)
  for (const id of ids) {
    const node = page.tree.nodes[id]
    if (node?.type !== "heading") continue
    const text = node.props?.text
    if (typeof text === "string" && text.trim()) return text.trim()
  }
  return ""
}


test("runAutonomousMultiPageSiteBuilder genera un plan V2 multipagina valido en memoria", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
      whatsapp: "528112345678",
      services: [
        { name: "Limpieza dental", description: "Prevencion y salud bucal." },
        { name: "Diseno de sonrisa", description: "Tratamientos esteticos." },
      ],
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.selectedTemplate, null)
  assert.equal(result.architecture.siteType, "health")
  assert.ok(result.plan.pages.length >= 3)
  assert.equal(result.plan.pages[0]?.slug, "home")
  assert.equal(result.plan.pages.filter((page) => page.isHome).length, 1)
  assert.deepEqual(
    result.plan.navigation.map((item) => item.href),
    result.plan.pages.map((page) => `page:${page.slug}`),
  )

  for (const page of result.plan.pages) {
    assert.ok(page.tree.rootId)
    assert.ok(page.tree.nodes[page.tree.rootId])
    assert.deepEqual(page.tree.theme, result.plan.theme)
    assert.deepEqual(page.tree.globalTheme, result.plan.theme)
    assert.notEqual(page.tree.theme, page.tree.globalTheme)
    assert.match(page.treeHash, /^[a-f0-9]{64}$/)
  }

  const validation = validateSiteCreationPlanV2(result.plan, {
    maxPages: result.plan.pages.length,
    maxBytes: result.byteLength,
  })

  assert.equal(validation.ok, true, "errors" in validation ? validation.errors.join("\n") : "")
  assert.equal(result.planHash, validation.ok ? validation.planHash : "")
  assert.equal(result.byteLength, validation.ok ? validation.byteLength : 0)
  assert.equal(result.pageQuality.length, result.plan.pages.length)
  assert.ok(result.trace.some((entry) => entry.includes("multipagina")))
})

test("runAutonomousMultiPageSiteBuilder genera heroes page-aware e IDs unicos entre paginas", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio web profesional para una clínica dental en Monterrey llamada Clínica Dental Monterrey. Ofrecemos odontología general, limpieza dental y valoración dental. El objetivo principal es conseguir citas.",
    forceFreshComposition: true,
    business: {
      name: "Clínica Dental Monterrey",
      industry: "clínica dental",
      description: "Clínica dental en Monterrey con odontología general, limpieza dental y valoración dental.",
      objective: "Conseguir citas",
      services: [
        { name: "Odontología general" },
        { name: "Limpieza dental" },
        { name: "Valoración dental" },
      ],
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")
  const contacto = result.plan.pages.find((page) => page.slug === "contacto")

  assert.ok(home)
  assert.ok(servicios)
  assert.ok(contacto)
  assert.ok(home.tree.rootId)
  assert.ok(servicios.tree.rootId)
  assert.ok(contacto.tree.rootId)
  assert.notEqual(home.tree.rootId, servicios.tree.rootId)
  assert.notEqual(home.tree.rootId, contacto.tree.rootId)
  assert.notEqual(servicios.tree.rootId, contacto.tree.rootId)

  assert.deepEqual(duplicateIdsBetween(home, servicios), [])
  assert.deepEqual(duplicateIdsBetween(home, contacto), [])
  assert.deepEqual(duplicateIdsBetween(servicios, contacto), [])

  const homeHero = firstHeadingText(home)
  const servicesHero = firstHeadingText(servicios)
  const contactFirstHeading = firstHeadingText(contacto)

  assert.notEqual(homeHero, servicesHero)
  assert.match(servicesHero.toLowerCase(), /servicios|tratamientos/)
  assert.notEqual(contactFirstHeading, homeHero)
  assert.notEqual(contactFirstHeading, servicesHero)
})

test("runAutonomousMultiPageSiteBuilder diferencia Home y Servicios por contexto en negocio generico", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para un estudio de arquitectura con servicios de diseño y remodelación.",
    forceFreshComposition: true,
    business: {
      name: "Estudio Norte",
      industry: "arquitectura",
      description: "Estudio de arquitectura para diseño residencial, remodelación y dirección de obra.",
      objective: "Conseguir consultas",
      services: [
        { name: "Diseño residencial" },
        { name: "Remodelación" },
      ],
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")

  assert.ok(home)
  assert.ok(servicios)
  assert.notEqual(firstHeadingText(home), firstHeadingText(servicios))
  assert.match(firstHeadingText(servicios).toLowerCase(), /servicios/)
})


function findSiteNavNode(page: GeneratedPlanPage) {
  const ids = walkNodeIds(page)
  for (const id of ids) {
    const node = page.tree.nodes[id]
    if (node?.type === "siteNav") return node
  }
  return null
}

type NavPageEntry = { slug: string; href: string; label?: string; name?: string; isHome?: boolean }

test("SiteNav generado deriva exactamente las paginas del Plan V2 real (home/servicios/contacto) sin productos/precios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
      services: [
        { name: "Limpieza dental", description: "Prevencion y salud bucal." },
        { name: "Diseno de sonrisa", description: "Tratamientos esteticos." },
      ],
    },
  })

  assert.deepEqual(result.plan.pages.map((page) => page.slug), ["home", "servicios", "contacto"])

  const expectedTargets = result.plan.pages.map((page) => ({ slug: page.slug, href: `page:${page.slug}` }))

  for (const page of result.plan.pages) {
    const navNode = findSiteNavNode(page)
    assert.ok(navNode, `la pagina "${page.slug}" no genero un nodo siteNav`)

    const navPages = navNode!.props?.pages as NavPageEntry[] | undefined
    assert.ok(Array.isArray(navPages), `la pagina "${page.slug}" no genero props.pages en su siteNav`)

    assert.deepEqual(
      navPages!.map((entry) => ({ slug: entry.slug, href: entry.href })),
      expectedTargets,
      `la navegacion de "${page.slug}" no coincide con las paginas reales del Plan V2`,
    )

    for (const entry of navPages!) {
      assert.equal(entry.href, `page:${entry.slug}`)
    }

    assert.equal(navPages!.some((entry) => entry.slug === "productos"), false)
    assert.equal(navPages!.some((entry) => entry.slug === "precios"), false)
    assert.equal(navPages!.find((entry) => entry.slug === "home")?.isHome, true)
  }
})

test("composeSection('navigation') deriva paginas arbitrarias de sitePages sin hardcode de nombres (home/nosotros/equipo/blog)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("navigation", {
    sitePages: [
      { name: "Inicio", slug: "home", isHome: true },
      { name: "Nosotros", slug: "nosotros" },
      { name: "Equipo", slug: "equipo" },
      { name: "Blog", slug: "blog" },
    ],
  })

  assert.ok(section)
  const navNode = section!.nodes[section!.rootId]
  const navPages = navNode.props?.pages as NavPageEntry[] | undefined
  assert.ok(Array.isArray(navPages))

  assert.deepEqual(
    navPages!.map((entry) => entry.slug),
    ["home", "nosotros", "equipo", "blog"],
  )
  assert.deepEqual(
    navPages!.map((entry) => entry.href),
    ["page:home", "page:nosotros", "page:equipo", "page:blog"],
  )
  assert.equal(navPages!.some((entry) => entry.slug === "servicios"), false)
  assert.equal(navPages!.some((entry) => entry.slug === "contacto"), false)
})

test("composeSection('navigation') sin sitePages conserva el comportamiento legacy existente", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const withEmptyContext = composeSection("navigation", {})
  const withoutContext = composeSection("navigation")

  for (const section of [withEmptyContext, withoutContext]) {
    assert.ok(section)
    const navNode = section!.nodes[section!.rootId]
    assert.equal("pages" in (navNode.props ?? {}), false)
    assert.equal(
      navNode.props?.labelOverrides,
      "home=Inicio\nservicios=Servicios\nproductos=Productos\nprecios=Precios\ncontacto=Contacto",
    )
    assert.equal(navNode.props?.showCta, true)
    assert.equal(navNode.props?.ctaHref, "#contacto")
    assert.equal(navNode.props?.ctaLabel, "Contactar")
  }
})

test("composeSection('navigation') mantiene el CTA como concepto separado del menu principal derivado de sitePages", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("navigation", {
    sitePages: [
      { name: "Inicio", slug: "home", isHome: true },
      { name: "Servicios", slug: "servicios" },
      { name: "Contacto", slug: "contacto" },
    ],
  })

  assert.ok(section)
  const navNode = section!.nodes[section!.rootId]

  assert.equal(navNode.props?.showCta, true)
  assert.equal(navNode.props?.ctaHref, "#contacto")
  assert.equal(navNode.props?.ctaLabel, "Contactar")

  const navPages = navNode.props?.pages as NavPageEntry[] | undefined
  assert.equal(navPages!.some((entry) => entry.slug === "contacto"), true)
})

test("resolveSiteNavItemTarget resuelve el contrato canonico page:<slug> para navegacion multipagina", async () => {
  const { resolveSiteNavItemTarget } = await import("../../lib/builder-core/tree/pageLinks")

  const servicios = resolveSiteNavItemTarget({ slug: "servicios", href: "page:servicios" }, "site-1", "published")
  assert.equal(servicios.isPageLink, true)
  assert.equal(servicios.targetSlug, "servicios")
  assert.equal(servicios.runtimeHref, "/p/site-1/servicios")

  const storeResolvedPage = resolveSiteNavItemTarget({ slug: "servicios" }, "site-1", "published")
  assert.deepEqual(storeResolvedPage, servicios)

  const home = resolveSiteNavItemTarget({ slug: "home", href: "page:home" }, "site-1", "published")
  assert.equal(home.isPageLink, true)
  assert.equal(home.runtimeHref, "/p/site-1")

  const previewServicios = resolveSiteNavItemTarget({ slug: "servicios", href: "page:servicios" }, "site-1", "preview")
  assert.equal(previewServicios.runtimeHref, "/preview/site-1?page=servicios")

  const anchor = resolveSiteNavItemTarget({ slug: "link-1", href: "#contacto-form" }, "site-1", "published")
  assert.equal(anchor.isPageLink, false)
  assert.equal(anchor.targetSlug, null)
  assert.equal(anchor.runtimeHref, "#contacto-form")
})

function headingTexts(section: { nodes: Record<string, { type: string; displayName: string; props?: Record<string, unknown> }> }) {
  return Object.values(section.nodes)
    .filter((node) => node.type === "heading")
    .map((node) => node.props?.text)
    .filter((value): value is string => typeof value === "string")
}

function significantTexts(section: { nodes: Record<string, { type: string; props?: Record<string, unknown> }> }) {
  return Object.values(section.nodes)
    .filter((node) => node.type === "heading" || node.type === "text")
    .map((node) => (typeof node.props?.text === "string" ? node.props.text : node.props?.content))
    .filter((value): value is string => typeof value === "string" && value.trim().length >= 20)
}

function gridClassName(section: { nodes: Record<string, { displayName: string; props?: Record<string, unknown> }> }, role: string) {
  const grid = Object.values(section.nodes).find((node) => node.displayName === `Grid ${role}`)
  return typeof grid?.props?.className === "string" ? grid.props.className : undefined
}

test("PageArchetype: home/servicios/contacto quedan anotados como overview/catalog/conversion en el plan interno", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  const archetypeBySlug = new Map(result.architecture.pages.map((page) => [page.slug, page.archetype]))
  assert.equal(archetypeBySlug.get("home"), "overview")
  assert.equal(archetypeBySlug.get("servicios"), "catalog")
  assert.equal(archetypeBySlug.get("contacto"), "conversion")
})

test("composeSection('services'): overview y catalog no comparten contenido especifico (sin overlap de strings del role aislado)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const overview = composeSection("services", { archetype: "overview" })
  const catalog = composeSection("services", { archetype: "catalog" })
  assert.ok(overview)
  assert.ok(catalog)

  const overviewTexts = new Set(significantTexts(overview!))
  const catalogTexts = new Set(significantTexts(catalog!))
  const overlap = [...overviewTexts].filter((text) => catalogTexts.has(text))

  assert.deepEqual(overlap, [], "el role 'services' aislado no deberia compartir contenido especifico entre overview y catalog")
})

test("Headings de roles compartidos (services/cta) difieren entre overview y catalog", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  for (const role of ["services", "cta"] as const) {
    const overview = composeSection(role, { archetype: "overview" })
    const catalog = composeSection(role, { archetype: "catalog" })
    assert.ok(overview, `composeSection('${role}', overview) no debio ser null`)
    assert.ok(catalog, `composeSection('${role}', catalog) no debio ser null`)

    const overviewHeadings = new Set(headingTexts(overview!))
    const catalogHeadings = new Set(headingTexts(catalog!))
    const sharedHeadings = [...overviewHeadings].filter((text) => catalogHeadings.has(text))

    assert.deepEqual(sharedHeadings, [], `role '${role}': los headings no deberian coincidir entre overview y catalog`)
  }
})

test("FAQ: el heading/intro de seccion y la cantidad de preguntas difieren entre overview y catalog (los placeholders numerados 'Pregunta frecuente N' son scaffolding generico compartido, igual que el nav/footer)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const overview = composeSection("faq", { archetype: "overview" })
  const catalog = composeSection("faq", { archetype: "catalog" })
  assert.ok(overview)
  assert.ok(catalog)

  const overviewHeadings = headingTexts(overview!)
  const catalogHeadings = headingTexts(catalog!)

  // El heading de seccion (el primero, "Titulo faq") si es contenido especifico y debe diferir.
  assert.notEqual(overviewHeadings[0], catalogHeadings[0])

  // La profundidad (cantidad de preguntas) tambien debe diferir: overview es un teaser, catalog es completo.
  assert.notEqual(overviewHeadings.length, catalogHeadings.length)
})

test("Estructura/layout: 'services' se materializa con un grid distinto segun archetype, de forma deterministica", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const overview = composeSection("services", { archetype: "overview" })
  const catalog = composeSection("services", { archetype: "catalog" })
  assert.ok(overview)
  assert.ok(catalog)

  const overviewClassName = gridClassName(overview!, "services")
  const catalogClassName = gridClassName(catalog!, "services")

  assert.ok(overviewClassName)
  assert.ok(catalogClassName)
  assert.notEqual(overviewClassName, catalogClassName)

  // Repetir con el mismo input debe reproducir exactamente el mismo layout (determinismo).
  const catalogAgain = composeSection("services", { archetype: "catalog" })
  assert.equal(gridClassName(catalogAgain!, "services"), catalogClassName)
})

test("Determinismo: misma entrada produce mismos archetypes y mismo contenido/layout derivado en dos corridas", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const input = {
    request: "Crea un sitio web profesional para Centro de Fisioterapia Monterrey. Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey. El objetivo principal es conseguir citas de valoracion.",
    forceFreshComposition: true,
    business: {
      name: "Centro de Fisioterapia Monterrey",
      industry: "fisioterapia",
      location: "Monterrey",
      description: "Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey.",
      objective: "Conseguir citas de valoracion",
      services: [
        { name: "Fisioterapia deportiva" },
        { name: "Rehabilitacion fisica" },
        { name: "Terapia manual" },
      ],
    },
  }

  const first = await runAutonomousMultiPageSiteBuilder(input)
  const second = await runAutonomousMultiPageSiteBuilder(input)

  assert.deepEqual(
    first.architecture.pages.map((page) => ({ slug: page.slug, archetype: page.archetype })),
    second.architecture.pages.map((page) => ({ slug: page.slug, archetype: page.archetype })),
  )

  function extractSignificantTexts(page: GeneratedPlanPage) {
    return Object.values(page.tree.nodes)
      .map((node) => node.props?.text)
      .filter((value): value is string => typeof value === "string" && value.trim().length >= 20)
      .sort()
  }

  function extractClassNames(page: GeneratedPlanPage) {
    return Object.values(page.tree.nodes)
      .map((node) => node.props?.className)
      .filter((value): value is string => typeof value === "string")
      .sort()
  }

  for (const slug of ["home", "servicios", "contacto"]) {
    const firstPage = first.plan.pages.find((page) => page.slug === slug)!
    const secondPage = second.plan.pages.find((page) => page.slug === slug)!

    assert.deepEqual(extractSignificantTexts(firstPage), extractSignificantTexts(secondPage), `contenido no deterministico en "${slug}"`)
    assert.deepEqual(extractClassNames(firstPage), extractClassNames(secondPage), `layout no deterministico en "${slug}"`)
  }
})

test("Independencia de slug: archetype 'catalog'/'conversion' con slugs no estandar reciben el mismo comportamiento sin heuristica por nombre", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const standardCatalog = composeSection("services", { archetype: "catalog", pageSlug: "servicios", pageName: "Servicios" })
  const oddCatalog = composeSection("services", { archetype: "catalog", pageSlug: "tratamientos-clinicos", pageName: "Tratamientos" })
  assert.ok(standardCatalog)
  assert.ok(oddCatalog)
  assert.deepEqual(headingTexts(standardCatalog!), headingTexts(oddCatalog!))
  assert.equal(gridClassName(standardCatalog!, "services"), gridClassName(oddCatalog!, "services"))

  const standardHero = composeSection("hero", { archetype: "catalog", pageSlug: "servicios", pageName: "Servicios", industry: "fisioterapia" })
  const oddHero = composeSection("hero", { archetype: "catalog", pageSlug: "tratamientos-clinicos", pageName: "Tratamientos", industry: "fisioterapia" })
  assert.ok(standardHero)
  assert.ok(oddHero)
  assert.deepEqual(headingTexts(standardHero!), headingTexts(oddHero!))

  const standardConversionHero = composeSection("hero", { archetype: "conversion", pageSlug: "contacto", pageName: "Contacto", industry: "fisioterapia" })
  const oddConversionHero = composeSection("hero", { archetype: "conversion", pageSlug: "reservar", pageName: "Agenda", industry: "fisioterapia" })
  assert.ok(standardConversionHero)
  assert.ok(oddConversionHero)
  assert.deepEqual(headingTexts(standardConversionHero!), headingTexts(oddConversionHero!))

  // El slug "servicios"/"contacto" por si solo, SIN archetype, no debe producir el comportamiento
  // nuevo: solo debe activarse el fallback legacy (ver siguiente test).
})

test("Legacy fallback: composeSection(role) y composeSection(role, {}) conservan el literal original para los roles modificados", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const expectations: Record<string, string> = {
    services: "Servicios pensados para vender mejor",
    features: "Beneficios que se entienden al instante",
    products: "Productos destacados",
    pricing: "Elige la opcion ideal",
    process: "Un proceso simple para empezar",
    content: "Contenido principal",
    faq: "Preguntas frecuentes",
    cta: "Convierte esta visita en una oportunidad real",
  }

  for (const [role, expectedTitle] of Object.entries(expectations)) {
    const withoutArg = composeSection(role as Parameters<typeof composeSection>[0])
    const withEmptyContext = composeSection(role as Parameters<typeof composeSection>[0], {})

    for (const section of [withoutArg, withEmptyContext]) {
      assert.ok(section, `composeSection('${role}') no debio ser null`)
      const heading = headingTexts(section!)[0]
      assert.equal(heading, expectedTitle, `role '${role}' perdio su literal legacy`)
    }
  }
})

test("composeSection('hero') sin archetype conserva el fallback legacy basado en slug, y coincide con el resultado archetype-based equivalente", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const legacyServicios = composeSection("hero", { pageSlug: "servicios", industry: "fisioterapia" })
  const archetypeCatalog = composeSection("hero", { archetype: "catalog", industry: "fisioterapia" })
  assert.ok(legacyServicios)
  assert.ok(archetypeCatalog)
  assert.deepEqual(headingTexts(legacyServicios!), headingTexts(archetypeCatalog!))

  const legacyContacto = composeSection("hero", { pageSlug: "contacto", industry: "fisioterapia" })
  const archetypeConversion = composeSection("hero", { archetype: "conversion", industry: "fisioterapia" })
  assert.ok(legacyContacto)
  assert.ok(archetypeConversion)
  assert.deepEqual(headingTexts(legacyContacto!), headingTexts(archetypeConversion!))

  assert.notEqual(headingTexts(legacyServicios!)[0], headingTexts(legacyContacto!)[0])
})

test("PageArchetype 'conversion': la pagina Contacto conserva su recipe corta y enfocada (sin roles de catalogo)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  const contacto = result.architecture.pages.find((page) => page.slug === "contacto")
  assert.ok(contacto)
  assert.equal(contacto!.archetype, "conversion")
  assert.deepEqual(
    contacto!.sections.map((section) => section.role),
    ["navigation", "contact", "footer"],
  )
})

type CompiledNode = { type: string; props?: Record<string, unknown>; children?: string[] }

/**
 * Finds the direct-sibling node of a given type next to a heading with
 * exact text `headingText`, within the same parent's children list. This
 * survives the full pipeline (blueprint-compiler + applyBusinessContent),
 * unlike displayName, which does not persist to the final compiled tree.
 */
function findSiblingNodeByHeadingText(page: GeneratedPlanPage, headingText: string, siblingType: string): CompiledNode | undefined {
  const nodes = page.tree.nodes as Record<string, CompiledNode>
  for (const node of Object.values(nodes)) {
    const children = (node.children ?? []).map((id) => nodes[id])
    const hasMatchingHeading = children.some((child) => child?.type === "heading" && child.props?.text === headingText)
    if (hasMatchingHeading) {
      return children.find((child) => child?.type === siblingType)
    }
  }
  return undefined
}

test("E2E CTA: el boton contextualizado por archetype sobrevive a applyBusinessContent (ya no se neutraliza a 'Contactar'/'#contacto' en todas las paginas)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")!
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!

  // Estas cabeceras son exactas de ctaCopy() para overview/catalog respectivamente.
  const homeCtaButton = findSiblingNodeByHeadingText(home, "Descubre todo lo que podemos hacer por ti", "ctaButton")
  const serviciosCtaButton = findSiblingNodeByHeadingText(servicios, "¿Listo para dar el siguiente paso?", "ctaButton")

  assert.ok(homeCtaButton, "no se encontro el boton CTA de la seccion 'cta' en Home tras applyBusinessContent")
  assert.ok(serviciosCtaButton, "no se encontro el boton CTA de la seccion 'cta' en Servicios tras applyBusinessContent")

  // La regresion que el review encontro: ambos terminaban con label:'Contactar', href:'#contacto'.
  assert.notEqual(homeCtaButton!.props?.label, serviciosCtaButton!.props?.label)
  assert.equal(homeCtaButton!.props?.label, "Ver servicios")
  assert.equal(homeCtaButton!.props?.href, "#servicios")
  assert.equal(serviciosCtaButton!.props?.label, "Agendar ahora")
  assert.equal(serviciosCtaButton!.props?.href, "#contacto")

  // Ninguno quedo neutralizado al fallback generico anterior.
  assert.notEqual(homeCtaButton!.props?.label, "Contactar")
  assert.notEqual(serviciosCtaButton!.props?.label, "Contactar")
})

test("E2E CTA: un WhatsApp real configurado sigue teniendo prioridad sobre el href page-aware del composer", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
      whatsapp: "528112345678",
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")!
  const homeCtaButton = findSiblingNodeByHeadingText(home, "Descubre todo lo que podemos hacer por ti", "ctaButton")
  assert.ok(homeCtaButton)
  assert.equal(homeCtaButton!.props?.href, "https://wa.me/528112345678")
  // El label sigue siendo del composer: WhatsApp es "business data real" solo para el destino, no para el texto.
  assert.equal(homeCtaButton!.props?.label, "Ver servicios")
})

test("E2E layout: el grid de 'services' en Home (overview) difiere estructuralmente del de Servicios (catalog) tras el pipeline completo", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")!
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!

  const homeGrid = findSiblingNodeByHeadingText(home, "Lo que hacemos por ti", "genericWrapper")
  const serviciosGrid = findSiblingNodeByHeadingText(servicios, "Nuestro catalogo de servicios", "genericWrapper")

  assert.ok(homeGrid, "no se encontro el grid de servicios en Home")
  assert.ok(serviciosGrid, "no se encontro el grid de servicios en Servicios")

  assert.notEqual(homeGrid!.props?.className, serviciosGrid!.props?.className)
  assert.notEqual(homeGrid!.children?.length, serviciosGrid!.children?.length)

  // Valores concretos esperados (teaser compacto vs catalogo profundo).
  assert.equal(homeGrid!.props?.className, "grid gap-5 md:grid-cols-3")
  assert.equal(homeGrid!.children?.length, 2)
  assert.equal(serviciosGrid!.props?.className, "grid gap-6 md:grid-cols-2")
  assert.equal(serviciosGrid!.children?.length, 4)
})

test("CARD_GRID_ARCHETYPE_COPY: features/process/products/pricing/content no reciclan verbatim los items de overview dentro de catalog", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  for (const role of ["features", "process", "products", "pricing", "content"] as const) {
    const overview = composeSection(role, { archetype: "overview" })
    const catalog = composeSection(role, { archetype: "catalog" })
    assert.ok(overview, `composeSection('${role}', overview) no debio ser null`)
    assert.ok(catalog, `composeSection('${role}', catalog) no debio ser null`)

    const overviewTitles = new Set(headingTexts(overview!).slice(1)) // [0] es el heading de seccion, el resto son titulos de tarjeta
    const catalogTitles = new Set(headingTexts(catalog!).slice(1))

    assert.notDeepEqual(overviewTitles, catalogTitles, `role '${role}': catalog no debe tener exactamente el mismo conjunto de titulos que overview`)

    const fullyReused = [...overviewTitles].every((title) => catalogTitles.has(title))
    assert.equal(fullyReused, false, `role '${role}': catalog no debe reciclar verbatim TODOS los items de overview`)
  }
})

function hasUndefinedValue(value: unknown): boolean {
  if (typeof value === "undefined") return true
  if (!value || typeof value !== "object") return false

  if (Array.isArray(value)) return value.some(hasUndefinedValue)

  return Object.values(value as Record<string, unknown>).some(hasUndefinedValue)
}

test("runAutonomousMultiPageSiteBuilder omite location undefined en Plan V2", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio web profesional para una clínica dental en Monterrey llamada Clínica Dental Monterrey. Ofrecemos odontología general, limpieza dental y valoración dental. El objetivo principal es conseguir citas.",
    forceFreshComposition: true,
    business: {
      name: "Clínica Dental Monterrey",
      industry: "clínica dental",
      description: "Clínica dental en Monterrey con odontología general, limpieza dental y valoración dental.",
      objective: "Conseguir citas",
      services: [
        { name: "Odontología general" },
        { name: "Limpieza dental" },
        { name: "Valoración dental" },
      ],
    },
    preferredStyle: "Premium claro, moderno y confiable",
    designMemoryPrior: null,
    externalThemeAdvisory: null,
    minimumQuality: 55,
  })

  assert.equal(result.ok, true)
  assert.equal(Object.prototype.hasOwnProperty.call(result.plan.identity, "location"), false)
  assert.equal(hasUndefinedValue(result.plan), false)

  const validation = validateSiteCreationPlanV2(result.plan, {
    maxPages: result.plan.pages.length,
    maxBytes: result.byteLength,
  })

  assert.equal(validation.ok, true, "errors" in validation ? validation.errors.join("\n") : "")
  assert.equal(result.plan.pages.filter((page) => page.isHome).length, 1)
  assert.equal(new Set(result.plan.pages.map((page) => page.slug)).size, result.plan.pages.length)

  const pageSlugs = new Set(result.plan.pages.map((page) => page.slug))
  assert.deepEqual(
    result.plan.navigation.map((item) => item.slug),
    result.plan.pages.map((page) => page.slug),
  )
  assert.equal(result.plan.navigation.every((item) => pageSlugs.has(item.slug)), true)
})

test("runAutonomousSiteBuilder conserva su contrato observable de home unica", async () => {
  const { runAutonomousSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  assert.equal(result.ok, true)
  assert.ok(result.tree.rootId)
  assert.ok(result.tree.nodes[result.tree.rootId])
  assert.equal("plan" in result, false)
  assert.equal(result.architecture.pages.length >= 2, true)
})

test("Design Memory prior null conserva el theme base del planner V2", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const input = {
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
  }

  const withoutPrior = await runAutonomousMultiPageSiteBuilder(input)
  const withNullPrior = await runAutonomousMultiPageSiteBuilder({ ...input, designMemoryPrior: null })

  assert.deepEqual(withNullPrior.plan.theme, withoutPrior.plan.theme)
})

test("Design Memory L2 prior puede orientar el theme cuando no hay constraint explicita", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L2",
      patternKeyHash: "a".repeat(64),
      evidence: {
        rankingScore: 0.84,
        confidence: "high",
        qualifiedSampleSize: 42,
        fallbackUsed: false,
      },
      recommendation: {
        context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
        theme: {
          mode: "dark",
          accentHue: "purple",
          contrastBucket: "high",
          radiusBucket: "pill",
          typographyBucket: "serif",
          motionBucket: "expressive",
        },
      },
      reason: [],
    },
  })

  assert.equal(result.plan.theme.colors?.primary, "#7c3aed")
  assert.equal(result.plan.theme.colors?.background, "#06131f")
  assert.equal(result.plan.theme.radius?.card, "24px")
  assert.equal(result.plan.theme.fontHeading, "Playfair Display")
  assert.equal(result.plan.theme.motion?.duration, "320ms")

  for (const page of result.plan.pages) {
    assert.deepEqual(page.tree.theme, result.plan.theme)
    assert.deepEqual(page.tree.globalTheme, result.plan.theme)
  }
})

test("Design Memory L1 prior no inventa theme", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const input = {
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
  }

  const withoutPrior = await runAutonomousMultiPageSiteBuilder(input)
  const withL1Prior = await runAutonomousMultiPageSiteBuilder({
    ...input,
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L1",
      patternKeyHash: "b".repeat(64),
      evidence: {
        rankingScore: 0.7,
        confidence: "medium",
        qualifiedSampleSize: 20,
        fallbackUsed: true,
      },
      recommendation: {
        context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
      },
      reason: [],
    },
  })

  assert.deepEqual(withL1Prior.plan.theme, withoutPrior.plan.theme)
})

// ---------------------------------------------------------------------------
// J9-G1: personalizacion esencial (footer business name, footer nav canonica,
// servicios estructurados en el card-grid "services").
// ---------------------------------------------------------------------------

// Ubicamos el footer por su texto de navegacion (siempre contiene " · "),
// ya que displayName no sobrevive la compilacion del pipeline completo.
function findFooterSection(page: GeneratedPlanPage) {
  const nodes = page.tree.nodes as Record<string, CompiledNode>
  for (const node of Object.values(nodes)) {
    if (node.type !== "text") continue
    const content = node.props?.content
    if (typeof content === "string" && content.includes(" · ")) {
      return { navTextNode: node }
    }
  }
  return null
}

function footerBrandHeadingText(page: GeneratedPlanPage): string | undefined {
  const nodes = page.tree.nodes as Record<string, CompiledNode>
  const nav = findFooterSection(page)
  if (!nav) return undefined
  // El heading de marca del footer es "level: 3" y "size: xl" (headingNode con
  // esos props exactos); lo distinguimos de otros headings nivel-3 por esa combinacion.
  for (const node of Object.values(nodes)) {
    if (node.type !== "heading") continue
    if (node.props?.level === 3 && node.props?.size === "xl" && node.props?.color === "#ffffff") {
      return typeof node.props?.text === "string" ? node.props.text : undefined
    }
  }
  return undefined
}

function footerNavText(page: GeneratedPlanPage): string | undefined {
  const nav = findFooterSection(page)
  const content = nav?.navTextNode.props?.content
  return typeof content === "string" ? content : undefined
}

test("composeSection('footer'): usa el businessName real cuando se provee", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const withName = composeSection("footer", { businessName: "Centro de Fisioterapia Monterrey" })!
  const texts = headingTexts(withName)
  assert.ok(texts.includes("Centro de Fisioterapia Monterrey"))
  assert.equal(texts.includes("Nombre del negocio"), false)
})

test("composeSection('footer'): conserva el fallback 'Nombre del negocio' cuando no hay businessName (legacy)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const withoutContext = composeSection("footer")!
  assert.ok(headingTexts(withoutContext).includes("Nombre del negocio"))

  const withEmptyContext = composeSection("footer", {})!
  assert.ok(headingTexts(withEmptyContext).includes("Nombre del negocio"))
})

test("composeSection('footer'): la navegacion visible deriva de sitePages (sin Productos/Precios inventados)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("footer", {
    sitePages: [
      { name: "Inicio", slug: "home", isHome: true },
      { name: "Servicios", slug: "servicios" },
      { name: "Contacto", slug: "contacto" },
    ],
  })!

  const navText = significantTexts(section).find((text) => text.includes(" · "))
  assert.ok(navText, "no se encontro el texto de navegacion del footer")
  assert.equal(navText, "Inicio · Servicios · Contacto")
  assert.equal(navText!.includes("Precios"), false)
  assert.equal(navText!.includes("Productos"), false)
})

test("composeSection('footer'): sin sitePages conserva el fallback legacy exacto", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("footer")!
  const navText = significantTexts(section).find((text) => text.includes(" · "))
  assert.equal(navText, "Inicio · Servicios · Precios · Contacto")
})

const FISIOTERAPIA_SERVICES = [
  { name: "Fisioterapia deportiva", description: "Recuperacion y rendimiento para deportistas." },
  { name: "Rehabilitacion fisica", description: "Recuperacion funcional tras lesiones o cirugias." },
  { name: "Terapia manual", description: "Tecnicas manuales para aliviar dolor y mejorar movilidad." },
]

test("composeSection('services', catalog): usa los servicios reales del negocio, no las etiquetas genericas", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("services", {
    archetype: "catalog",
    services: FISIOTERAPIA_SERVICES,
  })!

  const titles = headingTexts(section)
  for (const service of FISIOTERAPIA_SERVICES) {
    assert.ok(titles.includes(service.name), `catalog no incluye el servicio real "${service.name}"`)
  }

  // No debe colar la copia generica anterior.
  assert.equal(titles.includes("Diagnostico inicial"), false)
  assert.equal(titles.includes("Plan a la medida"), false)

  // La descripcion suministrada se usa tal cual.
  const texts = significantTexts(section)
  assert.ok(texts.includes("Recuperacion y rendimiento para deportistas."))

  // El layout de catalog (grid mas ancho) se conserva sin cambios.
  assert.equal(gridClassName(section, "services"), "grid gap-6 md:grid-cols-2")
})

test("composeSection('services', overview): usa un subconjunto teaser deterministico de los servicios reales, no el catalogo completo", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("services", {
    archetype: "overview",
    services: FISIOTERAPIA_SERVICES,
  })!

  const titles = headingTexts(section)
  assert.ok(titles.includes("Fisioterapia deportiva"))
  assert.ok(titles.includes("Rehabilitacion fisica"))
  // El teaser NO debe expandirse al catalogo completo (3er servicio afuera).
  assert.equal(titles.includes("Terapia manual"), false)

  assert.equal(gridClassName(section, "services"), "grid gap-5 md:grid-cols-3")

  // Determinismo: dos corridas con el mismo input producen el mismo subconjunto.
  const again = composeSection("services", { archetype: "overview", services: FISIOTERAPIA_SERVICES })!
  assert.deepEqual(headingTexts(again), titles)
})

test("composeSection('services'): sin descripcion suministrada usa un fallback deterministico, no vacio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("services", {
    archetype: "catalog",
    services: [{ name: "Terapia manual" }],
  })!

  const texts = significantTexts(section)
  const fallback = texts.find((text) => text.toLowerCase().includes("terapia manual") && text !== "Terapia manual")
  assert.ok(fallback, "no se genero una descripcion fallback para el servicio sin description")
})

test("composeSection('services'): sin services conserva exactamente el comportamiento CARD_GRID_ARCHETYPE_COPY existente", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const catalogNoServices = composeSection("services", { archetype: "catalog" })!
  assert.deepEqual(headingTexts(catalogNoServices).slice(1), [
    "Diagnostico inicial",
    "Plan a la medida",
    "Seguimiento cercano",
    "Entrega y cierre",
  ])

  const overviewNoServices = composeSection("services", { archetype: "overview" })!
  assert.deepEqual(headingTexts(overviewNoServices).slice(1), [
    "Atencion personalizada",
    "Resultados medibles",
  ])

  const emptyServices = composeSection("services", { archetype: "catalog", services: [] })!
  assert.deepEqual(headingTexts(emptyServices).slice(1), [
    "Diagnostico inicial",
    "Plan a la medida",
    "Seguimiento cercano",
    "Entrega y cierre",
  ])
})

test("composeSection('features'): NO consume business.services (solo el role 'services' lo hace)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const withServices = composeSection("features", { archetype: "catalog", services: FISIOTERAPIA_SERVICES })!
  const withoutServices = composeSection("features", { archetype: "catalog" })!
  assert.deepEqual(headingTexts(withServices), headingTexts(withoutServices))
})

test("E2E personalizacion: nombre real, servicios reales y nav de footer canonica sobreviven al pipeline completo (applyBusinessContent incluido)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request:
      "Crea un sitio web profesional para Centro de Fisioterapia Monterrey. Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey. El objetivo principal es conseguir citas de valoracion.",
    forceFreshComposition: true,
    business: {
      name: "Centro de Fisioterapia Monterrey",
      industry: "fisioterapia",
      location: "Monterrey",
      description:
        "Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey.",
      objective: "Conseguir citas de valoracion",
      services: FISIOTERAPIA_SERVICES,
    },
  })

  const home = result.plan.pages.find((page) => page.slug === "home")!
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!
  const contacto = result.plan.pages.find((page) => page.slug === "contacto")!

  // 1) Servicios reales visibles en Servicios (catalog) tras el pipeline completo.
  const serviciosCardTitle = findSiblingNodeByHeadingText(
    servicios,
    "Nuestro catalogo de servicios",
    "genericWrapper",
  )
  assert.ok(serviciosCardTitle, "no se encontro el grid de servicios en Servicios")
  const serviciosNodes = servicios.tree.nodes as Record<string, CompiledNode>
  const serviciosCardTexts = (serviciosCardTitle!.children ?? [])
    .map((id) => serviciosNodes[id])
    .flatMap((card) => (card?.children ?? []).map((id) => serviciosNodes[id]))
    .map((node) => node?.props?.text)
    .filter((value): value is string => typeof value === "string")
  for (const service of FISIOTERAPIA_SERVICES) {
    assert.ok(serviciosCardTexts.includes(service.name), `Servicios no muestra "${service.name}" tras el pipeline completo`)
  }

  // 2) Footer: nombre real del negocio, en las 3 paginas.
  for (const page of [home, servicios, contacto]) {
    const brandText = footerBrandHeadingText(page)
    assert.equal(brandText, "Centro de Fisioterapia Monterrey", `footer de "${page.slug}" no muestra el nombre real del negocio`)
  }

  // 3) Footer: navegacion canonica (Inicio/Servicios/Contacto), sin Precios/Productos.
  for (const page of [home, servicios, contacto]) {
    const navText = footerNavText(page)
    assert.equal(navText, "Inicio · Servicios · Contacto", `footer de "${page.slug}" no deriva la navegacion real`)
    assert.equal(navText?.includes("Precios"), false)
    assert.equal(navText?.includes("Productos"), false)
  }

  // 4) Regresion J9-E1.1: los CTA de seccion siguen diferenciados (no neutralizados).
  const homeCtaButton = findSiblingNodeByHeadingText(home, "Descubre todo lo que podemos hacer por ti", "ctaButton")
  const serviciosCtaButton = findSiblingNodeByHeadingText(servicios, "¿Listo para dar el siguiente paso?", "ctaButton")
  assert.equal(homeCtaButton?.props?.label, "Ver servicios")
  assert.equal(homeCtaButton?.props?.href, "#servicios")
  assert.equal(serviciosCtaButton?.props?.label, "Agendar ahora")
  assert.equal(serviciosCtaButton?.props?.href, "#contacto")

  // 5) Regresion canonica de nav: sigue siendo exactamente home/servicios/contacto.
  const navNode = findSiteNavNode(home)
  const navPages = navNode?.props?.pages as NavPageEntry[] | undefined
  assert.deepEqual(navPages?.map((entry) => entry.slug), ["home", "servicios", "contacto"])
})

test("Legacy: runAutonomousMultiPageSiteBuilder sin business.services/business.name explicito sigue compilando y usando el contenido de fallback", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una consultoria",
    forceFreshComposition: true,
    business: {
      industry: "consultoria",
      description: "Consultoria estrategica para pymes.",
    },
  })

  assert.equal(result.ok, true)
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!
  const serviciosGrid = findSiblingNodeByHeadingText(servicios, "Nuestro catalogo de servicios", "genericWrapper")
  const serviciosNodes = servicios.tree.nodes as Record<string, CompiledNode>
  const cardTitles = (serviciosGrid?.children ?? [])
    .map((id) => serviciosNodes[id])
    .flatMap((card) => (card?.children ?? []).map((id) => serviciosNodes[id]))
    .map((node) => node?.props?.text)
    .filter((value): value is string => typeof value === "string")

  assert.deepEqual(cardTitles, ["Diagnostico inicial", "Plan a la medida", "Seguimiento cercano", "Entrega y cierre"])

  for (const page of result.plan.pages) {
    const brandText = footerBrandHeadingText(page)
    assert.equal(brandText, "Nombre del negocio")
  }
})

// ---------------------------------------------------------------------------
// J9-I1a: business identity in the page-aware Hero (Home H1, Servicios
// eyebrow). Location/objective are explicitly out of scope for this block.
// ---------------------------------------------------------------------------

/**
 * The Hero H1 is the only "heading" node at level 1 anywhere in a composed
 * page -- every other heading (section titles, card titles) uses level 2/3.
 */
function heroH1Text(page: GeneratedPlanPage): string | undefined {
  for (const node of Object.values(page.tree.nodes) as CompiledNode[]) {
    if (node.type === "heading" && node.props?.level === 1) {
      return typeof node.props?.text === "string" ? node.props.text : undefined
    }
  }
  return undefined
}

/**
 * The Hero eyebrow is the only "text" node styled with composeHero's
 * eyebrow color (#0E5C80) anywhere in a composed page.
 */
function heroEyebrowText(page: GeneratedPlanPage): string | undefined {
  for (const node of Object.values(page.tree.nodes) as CompiledNode[]) {
    if (node.type === "text" && node.props?.color === "#0E5C80") {
      return typeof node.props?.content === "string" ? node.props.content : undefined
    }
  }
  return undefined
}

const HERO_BUSINESS_NAME = "Centro de Fisioterapia Monterrey"

test("J9-I1a A) composeSection('hero'), overview: el H1 contiene el businessName real", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("hero", {
    archetype: "overview",
    industry: "fisioterapia",
    businessName: HERO_BUSINESS_NAME,
  })!

  const h1 = Object.values(section.nodes).find((node) => node.type === "heading" && node.props?.level === 1)
  assert.ok(h1, "no se encontro el H1 del hero")
  assert.equal(h1!.props?.text, `${HERO_BUSINESS_NAME}: una forma más clara de presentar lo que haces`)
  assert.equal(String(h1!.props?.text).includes("Tu negocio"), false)
})

test("J9-I1a B) composeSection('hero'), overview: sin businessName conserva el fallback 'Tu negocio'", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("hero", { archetype: "overview", industry: "fisioterapia" })!
  const h1 = Object.values(section.nodes).find((node) => node.type === "heading" && node.props?.level === 1)
  assert.equal(h1!.props?.text, "Tu negocio: una forma más clara de presentar lo que haces")
})

test("J9-I1a C) composeSection('hero'), catalog: el eyebrow contiene el businessName real, no el H1", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("hero", {
    archetype: "catalog",
    industry: "fisioterapia",
    businessName: HERO_BUSINESS_NAME,
  })!

  const eyebrow = Object.values(section.nodes).find((node) => node.type === "text" && node.props?.color === "#0E5C80")
  const h1 = Object.values(section.nodes).find((node) => node.type === "heading" && node.props?.level === 1)

  assert.equal(eyebrow?.props?.content, HERO_BUSINESS_NAME)
  assert.equal(h1?.props?.text, "Conoce nuestros servicios")
})

test("J9-I1a D) composeSection('hero'), catalog: sin businessName el eyebrow conserva 'Servicios'", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const section = composeSection("hero", { archetype: "catalog", industry: "fisioterapia" })!
  const eyebrow = Object.values(section.nodes).find((node) => node.type === "text" && node.props?.color === "#0E5C80")
  assert.equal(eyebrow?.props?.content, "Servicios")
})

test("J9-I1a E) Home y Servicios: el hero visible no se vuelve identico al personalizar", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const home = composeSection("hero", { archetype: "overview", industry: "fisioterapia", businessName: HERO_BUSINESS_NAME })!
  const servicios = composeSection("hero", { archetype: "catalog", industry: "fisioterapia", businessName: HERO_BUSINESS_NAME })!

  const homeH1 = Object.values(home.nodes).find((node) => node.type === "heading" && node.props?.level === 1)?.props?.text
  const serviciosH1 = Object.values(servicios.nodes).find((node) => node.type === "heading" && node.props?.level === 1)?.props?.text
  const homeEyebrow = Object.values(home.nodes).find((node) => node.type === "text" && node.props?.color === "#0E5C80")?.props?.content
  const serviciosEyebrow = Object.values(servicios.nodes).find((node) => node.type === "text" && node.props?.color === "#0E5C80")?.props?.content

  assert.notEqual(homeH1, serviciosH1, "el H1 de Home y Servicios no debe coincidir")
  // Home lleva la identidad en el H1; Servicios la lleva en el eyebrow -- por
  // diseno ambos mencionan el nombre del negocio, pero en campos distintos.
  assert.equal(String(homeH1).includes(HERO_BUSINESS_NAME), true)
  assert.equal(serviciosEyebrow, HERO_BUSINESS_NAME)
  assert.notEqual(homeEyebrow, serviciosEyebrow, "el eyebrow de Home y Servicios no debe coincidir")
})

test("J9-I1a F) Pipeline completo: el H1 de Home y el eyebrow de Servicios sobreviven a applyBusinessContent", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request:
      "Crea un sitio web profesional para Centro de Fisioterapia Monterrey. Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey. El objetivo principal es conseguir citas de valoracion.",
    forceFreshComposition: true,
    business: {
      name: HERO_BUSINESS_NAME,
      industry: "fisioterapia",
      location: "Monterrey",
      description: "Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey.",
      objective: "Conseguir citas de valoracion",
    },
  })

  assert.equal(result.ok, true)
  const home = result.plan.pages.find((page) => page.slug === "home")!
  const servicios = result.plan.pages.find((page) => page.slug === "servicios")!
  const contacto = result.plan.pages.find((page) => page.slug === "contacto")!

  assert.equal(heroH1Text(home), `${HERO_BUSINESS_NAME}: una forma más clara de presentar lo que haces`)
  assert.equal(heroEyebrowText(servicios), HERO_BUSINESS_NAME)
  assert.equal(heroH1Text(servicios), "Conoce nuestros servicios")

  // G) Regresion CTA: hero (hardcoded, sin cambios) + CTA de seccion (J9-E1.1).
  // "Solicitar informacion" es unico al CTA primario del hero en todo el
  // arbol, asi que su wrapper padre ("Acciones hero") identifica sin
  // ambiguedad los 2 CTA del hero (a diferencia de "Ver servicios", que
  // tambien aparece como CTA de la seccion 'cta' en overview).
  const homeNodes = home.tree.nodes as Record<string, CompiledNode>
  const heroActionsWrapper = Object.values(homeNodes).find((node) =>
    (node.children ?? []).some((id) => homeNodes[id]?.props?.label === "Solicitar informacion"),
  )
  const homeHeroCtas = (heroActionsWrapper?.children ?? [])
    .map((id) => homeNodes[id])
    .filter((node) => node?.type === "ctaButton")
  assert.equal(homeHeroCtas.length, 2, "el hero de Home debe conservar exactamente sus 2 CTA hardcoded")
  assert.ok(homeHeroCtas.some((cta) => cta.props?.label === "Solicitar informacion" && cta.props?.href === "#contacto"))
  assert.ok(homeHeroCtas.some((cta) => cta.props?.label === "Ver servicios" && cta.props?.href === "#servicios"))

  const homeSectionCta = findSiblingNodeByHeadingText(home, "Descubre todo lo que podemos hacer por ti", "ctaButton")
  const serviciosSectionCta = findSiblingNodeByHeadingText(servicios, "¿Listo para dar el siguiente paso?", "ctaButton")
  assert.equal(homeSectionCta?.props?.label, "Ver servicios")
  assert.equal(homeSectionCta?.props?.href, "#servicios")
  assert.equal(serviciosSectionCta?.props?.label, "Agendar ahora")
  assert.equal(serviciosSectionCta?.props?.href, "#contacto")

  // H) Contacto sigue sin rol 'hero' -- su H1 (agregado en J9-J) proviene
  // del propio rol 'contact', no de una seccion 'hero' nueva en la receta.
  const contactoArchitecturePage = result.architecture.pages.find((page) => page.slug === "contacto")!
  assert.equal(contactoArchitecturePage.sections.some((section) => section.role === "hero"), false)
  assert.equal(heroH1Text(contacto), "Estamos aquí para ayudarte a dar el siguiente paso")
})

test("J9-I1a I) Determinismo: la misma entrada produce exactamente el mismo Hero visible", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const context = { archetype: "overview" as const, industry: "fisioterapia", businessName: HERO_BUSINESS_NAME }
  const first = composeSection("hero", context)!
  const second = composeSection("hero", context)!

  const h1 = (section: typeof first) => Object.values(section.nodes).find((node) => node.type === "heading" && node.props?.level === 1)?.props?.text
  assert.equal(h1(first), h1(second))
})

// ---------------------------------------------------------------------------
// J9-J: final v1 visible personalization -- location (with a duplication
// guard against businessName already containing it), the real business
// objective (conservatively, only in Contacto's conversion copy), and a
// structural fix for Contacto (real H1 + a second CTA) so the existing
// Quality Gate passes because the page is actually correct, not because
// the gate was special-cased.
// ---------------------------------------------------------------------------

const FISIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  description: "Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey.",
  objective: "Conseguir citas de valoracion",
  services: [
    { name: "Fisioterapia deportiva" },
    { name: "Rehabilitacion fisica" },
    { name: "Terapia manual" },
  ],
}

// Deliberately a different industry, and -- crucially -- businessName does
// NOT already contain location, so the duplication guard should NOT
// suppress the location phrase here (contrast fixture for the guard).
const STUDIO_BUSINESS = {
  name: "Estudio Norte",
  industry: "diseño grafico",
  location: "Guadalajara",
  description: "Disenamos logotipos, identidad visual y sitios web para pequenas empresas.",
  objective: "Conseguir nuevos clientes",
  services: [
    { name: "Logotipos" },
    { name: "Identidad visual" },
    { name: "Sitios web" },
  ],
}

function allVisibleTexts(page: GeneratedPlanPage): string[] {
  const nodes = page.tree.nodes as Record<string, CompiledNode>
  return Object.values(nodes)
    .filter((node) => node.type === "heading" || node.type === "text")
    .map((node) => (typeof node.props?.text === "string" ? node.props.text : node.props?.content))
    .filter((value): value is string => typeof value === "string")
}

test("J9-J A) Negocio de referencia: 'Monterrey' es visible (via el nombre del negocio) en Home/Servicios/Contacto", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })

  for (const slug of ["home", "servicios", "contacto"]) {
    const page = result.plan.pages.find((p) => p.slug === slug)!
    const hasMonterrey = allVisibleTexts(page).some((text) => text.includes("Monterrey"))
    assert.ok(hasMonterrey, `"${slug}" no muestra "Monterrey" en ningun texto/heading visible`)
  }
})

test("J9-J B) Guardia de duplicacion: businessName ya contiene la ubicacion -> ningun texto dice 'Monterrey en Monterrey'", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })

  for (const page of result.plan.pages) {
    for (const text of allVisibleTexts(page)) {
      assert.equal(/monterrey\s+en\s+monterrey/i.test(text), false, `texto con duplicacion de ubicacion en "${page.slug}": "${text}"`)
    }
  }
})

test("J9-J B.1) Sin superposicion nombre/ubicacion: la ubicacion SI aparece explicitamente (prueba que la guardia no suprime de mas)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: STUDIO_BUSINESS })

  const home = result.plan.pages.find((p) => p.slug === "home")!
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!

  assert.ok(allVisibleTexts(home).some((text) => text.includes("en Guadalajara")), "Home no muestra la frase de ubicacion cuando no hay riesgo de duplicacion")
  assert.ok(allVisibleTexts(contacto).some((text) => text.includes("en Guadalajara")), "Contacto no muestra la frase de ubicacion cuando no hay riesgo de duplicacion")
})

test("J9-J C) Sin ubicacion: se conserva el fallback generico exacto, sin 'en undefined' ni 'en ' colgante", async () => {
  const { getPageAwareHeroCopy } = await import("../../lib/orvenix-ai/content/content-engine")

  const overview = getPageAwareHeroCopy({ industry: "fisioterapia", page: { archetype: "overview" } })
  assert.equal(overview.description, "Conoce nuestros servicios y encuentra una solución pensada para tus necesidades.")

  const conversion = getPageAwareHeroCopy({ name: "Centro de Fisioterapia Monterrey", page: { archetype: "conversion" } })
  assert.equal(conversion.description, "Comunícate con Centro de Fisioterapia Monterrey para resolver dudas, solicitar información o comenzar.")
  assert.equal(conversion.description.includes("undefined"), false)
  assert.equal(/\sen\s*$/.test(conversion.description.replace(/\.$/, "")), false)
})

test("J9-J D) El objective real llega a OrvenixSiteArchitecture.businessObjective, separado del objective interno hardcoded", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para una clinica dental",
    business: { industry: "salud", objective: "Conseguir citas de valoracion" },
  })

  assert.equal(architecture.businessObjective, "Conseguir citas de valoracion")
  // El objective interno (usado para page.purpose / trace) sigue siendo el
  // hardcoded por siteType, sin tocar -- no fue "arreglado" reescribiendolo.
  assert.equal(architecture.objective, "Conseguir citas y generar confianza")
})

test("J9-J E) El objective real afecta la copy de conversion de Contacto de forma conservadora (insercion literal, sin taxonomia)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!

  const description = allVisibleTexts(contacto).find((text) => text.startsWith("Comunícate con"))
  assert.equal(description, "Comunícate con Centro de Fisioterapia Monterrey para conseguir citas de valoracion.")
})

test("J9-J F) Sin objective suministrado: Contacto conserva la copy de conversion generica (fallback)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Taller Rio", industry: "carpinteria" },
  })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!
  const description = allVisibleTexts(contacto).find((text) => text.startsWith("Comunícate con"))
  assert.equal(description, "Comunícate con Taller Rio para resolver dudas, solicitar información o comenzar.")
})

test("J9-J G) Home y Servicios siguen siendo purpose-distinct tras los cambios de J9-J", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const home = result.plan.pages.find((p) => p.slug === "home")!
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!

  assert.equal(heroH1Text(home), "Centro de Fisioterapia Monterrey: una forma más clara de presentar lo que haces")
  assert.equal(heroEyebrowText(servicios), "Centro de Fisioterapia Monterrey")
  assert.equal(heroH1Text(servicios), "Conoce nuestros servicios")
  assert.notEqual(heroH1Text(home), heroH1Text(servicios))
})

test("J9-J H) Contacto tiene exactamente un H1 significativo", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!
  const nodes = contacto.tree.nodes as Record<string, CompiledNode>
  const h1Count = Object.values(nodes).filter((n) => n.type === "heading" && n.props?.level === 1).length
  assert.equal(h1Count, 1)
  assert.equal(heroH1Text(contacto), "Estamos aquí para ayudarte a dar el siguiente paso")
})

test("J9-J I) Contacto tiene un camino de conversion accionable (>= 2 CTA, hrefs validos)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!
  const nodes = contacto.tree.nodes as Record<string, CompiledNode>
  const ctas = Object.values(nodes).filter((n) => n.type === "ctaButton")
  assert.ok(ctas.length >= 2, `Contacto debe tener al menos 2 CTA, tiene ${ctas.length}`)
  for (const cta of ctas) {
    assert.ok(typeof cta.props?.href === "string" && (cta.props.href as string).length > 0, "cada CTA debe tener un href valido")
  }
})

test("J9-J J) Contacto sigue siendo estructuralmente mas corto que Home y Servicios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const home = result.plan.pages.find((p) => p.slug === "home")!
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!

  const count = (page: GeneratedPlanPage) => Object.keys(page.tree.nodes).length
  assert.ok(count(contacto) < count(servicios), "Contacto debe seguir siendo mas corto que Servicios")
  assert.ok(count(contacto) < count(home), "Contacto debe seguir siendo mas corto que Home")
})

test("J9-J K) Quality Gate: la advertencia de H1 faltante y de pocos CTA desaparecen para Contacto porque la estructura es correcta (no se toco el Quality Gate)", async () => {
  const { evaluateTreeQuality } = await import("../../lib/orvenix-ai/quality")
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!

  const quality = evaluateTreeQuality(contacto.tree)
  assert.equal(quality.problems.includes("El sitio no tiene un H1 principal."), false)
  assert.equal(quality.problems.includes("Hay pocas llamadas a la acción."), false)
})

test("J9-J L) No se fabrican datos de negocio: telefono/correo siguen siendo el placeholder original, sin testimonios/estadisticas inventadas", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const contacto = result.plan.pages.find((p) => p.slug === "contacto")!
  const home = result.plan.pages.find((p) => p.slug === "home")!

  const contactoTexts = allVisibleTexts(contacto)
  assert.ok(contactoTexts.includes("WhatsApp: +52 000 000 0000"), "el placeholder de WhatsApp no debe cambiar")
  assert.ok(contactoTexts.includes("Correo: contacto@tumarca.com"), "el placeholder de correo no debe cambiar")

  const homeTexts = allVisibleTexts(home)
  assert.ok(homeTexts.includes("Testimonio pendiente de contenido real."), "los testimonios siguen siendo el placeholder no-fabricado")
  assert.equal(homeTexts.some((text) => /\d{1,3}%|clientes satisfechos|premiad[oa]|certificad[oa]/i.test(text)), false, "no debe aparecer ninguna estadistica/certificacion inventada")
})

test("J9-J M) Pipeline completo desde la frontera freeform real (normalizeSiteCreationBusiness) hasta los arboles finales, para DOS industrias distintas", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const fixtures = [
    {
      request:
        "Crea un sitio web profesional para Centro de Fisioterapia Monterrey. Ofrecemos fisioterapia deportiva, rehabilitacion fisica y terapia manual en Monterrey. El objetivo principal es conseguir citas de valoracion.",
      form: {
        name: "Centro de Fisioterapia Monterrey",
        industry: "fisioterapia",
        location: "Monterrey",
        objective: "Conseguir citas de valoracion",
      },
      expectServices: ["fisioterapia deportiva", "rehabilitacion fisica", "terapia manual"],
      expectLocationVisible: false, // location is inside businessName -- guard applies
    },
    {
      request: "Somos Estudio Norte en Guadalajara. Disenamos logotipos, identidad visual y sitios web para pequenas empresas.",
      form: {
        name: "Estudio Norte",
        industry: "diseño grafico",
        location: "Guadalajara",
        objective: "Conseguir nuevos clientes",
      },
      expectServices: ["logotipos", "identidad visual", "sitios web"],
      expectLocationVisible: true,
    },
  ]

  for (const fixture of fixtures) {
    const business = normalizeSiteCreationBusiness(
      { ...fixture.form, description: fixture.request },
      fixture.request,
    )
    assert.deepEqual(business.services?.map((s) => s.name), fixture.expectServices, `servicios inferidos incorrectos para "${fixture.form.name}"`)

    const result = await runAutonomousMultiPageSiteBuilder({
      request: fixture.request,
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
    const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
    const serviciosTitles = allVisibleTexts(servicios)
    for (const serviceName of fixture.expectServices) {
      assert.ok(serviciosTitles.includes(serviceName), `Servicios no muestra "${serviceName}" para "${fixture.form.name}"`)
    }

    const contacto = result.plan.pages.find((p) => p.slug === "contacto")!
    assert.equal(heroH1Text(contacto), "Estamos aquí para ayudarte a dar el siguiente paso")
    const quality = (await import("../../lib/orvenix-ai/quality")).evaluateTreeQuality(contacto.tree)
    assert.equal(quality.problems.length, 0, `Contacto de "${fixture.form.name}" no debe tener problems de Quality Gate: ${quality.problems.join("; ")}`)

    if (fixture.expectLocationVisible) {
      assert.ok(allVisibleTexts(contacto).some((t) => t.includes(`en ${fixture.form.location}`)), `Contacto de "${fixture.form.name}" deberia mostrar la ubicacion explicitamente`)
    }
  }
})

test("J9-J N) Determinismo: la misma entrada produce exactamente la misma copy de ubicacion/objective/Contacto en corridas repetidas", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const first = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })
  const second = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIO_BUSINESS })

  const contactoFirst = first.plan.pages.find((p) => p.slug === "contacto")!
  const contactoSecond = second.plan.pages.find((p) => p.slug === "contacto")!
  // Sorted comparison: object-key enumeration order is an implementation
  // detail, not a contract: what must be deterministic is the SET of
  // visible copy, not the raw iteration order of Object.values(nodes).
  assert.deepEqual([...allVisibleTexts(contactoFirst)].sort(), [...allVisibleTexts(contactoSecond)].sort())

  const homeFirst = first.plan.pages.find((p) => p.slug === "home")!
  const homeSecond = second.plan.pages.find((p) => p.slug === "home")!
  assert.equal(heroH1Text(homeFirst), heroH1Text(homeSecond))
})

// ---------------------------------------------------------------------------
// Regression: inferSiteType must not misroute a business into an unrelated
// architecture branch merely because its own copy contains a keyword as a
// MID-WORD substring (found via the final V1 acceptance E2E: "identidad
// visual" for a graphic design studio was misclassified as "health"
// because "identidad" contains "dent").
// ---------------------------------------------------------------------------

test("inferSiteType: una palabra ordinaria que contiene 'dent' a mitad de palabra (p.ej. 'identidad') NO dispara la rama 'health'", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseño",
    business: {
      name: "Estudio Norte",
      industry: "diseño gráfico",
      location: "Guadalajara",
      description: "Diseñamos logotipos, identidad visual y sitios web para negocios en Guadalajara.",
      objective: "Conseguir solicitudes de cotización",
    },
  })

  assert.equal(architecture.siteType, "business")

  // La copia visible/SEO no debe contener lenguaje de clinica dental.
  const home = architecture.pages.find((page) => page.slug === "home")!
  assert.equal(home.purpose.toLowerCase().includes("clinica"), false)
  assert.equal(home.purpose.toLowerCase().includes("cita"), false)
})

test("inferSiteType: 'dent' al INICIO de palabra (dental/dentista) sigue disparando 'health' normalmente", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const dentalArchitecture = buildSiteArchitecture({
    request: "Crea un sitio para una clinica dental",
    business: { industry: "salud dental", description: "Somos una clinica dental en la ciudad." },
  })
  assert.equal(dentalArchitecture.siteType, "health")

  const dentistaArchitecture = buildSiteArchitecture({
    request: "req",
    business: { description: "Soy dentista y atiendo pacientes particulares." },
  })
  assert.equal(dentistaArchitecture.siteType, "health")
})

test("inferSiteType: otras palabras ordinarias que contienen keywords a mitad de palabra tampoco disparan falsos positivos", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  // "residente"/"presidente"/"accidente" tambien contienen "dent" a mitad de palabra.
  const a1 = buildSiteArchitecture({ request: "req", business: { description: "Atendemos a todo residente de la zona tras un accidente." } })
  assert.equal(a1.siteType, "business")

  // "reproductor"/"productor" contienen "producto" como prefijo real (no deberian dispararlo salvo que sea intencional);
  // se documenta el comportamiento actual: coincide como prefijo de palabra, igual que antes de este fix.
  const a2 = buildSiteArchitecture({ request: "req", business: { description: "Vendemos productos artesanales." } })
  assert.equal(a2.siteType, "ecommerce")
})
