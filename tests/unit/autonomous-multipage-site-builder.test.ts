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
