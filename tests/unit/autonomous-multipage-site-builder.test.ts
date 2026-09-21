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
