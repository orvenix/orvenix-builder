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
// V2-1: deterministic visual-direction baseline (theme colors/fonts/radius
// by siteType family) + generated-content iconography. No external APIs,
// no new npm dependencies, no randomness.
// ---------------------------------------------------------------------------

const HEALTH_BUSINESS = { name: "Clinica Salud Total", industry: "salud", location: "Monterrey" }
const RESTAURANT_BUSINESS = { name: "Sabores del Valle", industry: "restaurante", location: "Puebla" }
const AGENCY_BUSINESS = { name: "Agencia Norte", industry: "agencia de marketing", location: "Guadalajara" }
const ECOMMERCE_BUSINESS = { name: "Tienda Luna", industry: "ecommerce de accesorios", location: "CDMX" }
const GENERIC_BUSINESS = { name: "Consultoria Rio", industry: "consultoria general", location: "Leon" }

test("A) direccion visual determinista: familia 'health' produce paleta/tipografia/radius propios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: HEALTH_BUSINESS })
  assert.equal(result.architecture.siteType, "health")
  assert.equal(result.plan.theme.colors?.primary, "#1794CC")
  assert.equal(result.plan.theme.fontHeading, "Inter")
})

test("B) direccion visual determinista: familia 'restaurant' produce paleta/tipografia/radius propios y distintos de health", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const health = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: HEALTH_BUSINESS })
  const restaurant = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: RESTAURANT_BUSINESS })

  assert.equal(restaurant.architecture.siteType, "restaurant")
  assert.equal(restaurant.plan.theme.colors?.primary, "#ea580c")
  assert.equal(restaurant.plan.theme.fontHeading, "Playfair Display")

  assert.notEqual(restaurant.plan.theme.colors?.primary, health.plan.theme.colors?.primary)
  assert.notEqual(restaurant.plan.theme.fontHeading, health.plan.theme.fontHeading)
})

test("C) direccion visual determinista: familia 'agency' produce paleta/tipografia/radius propios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: AGENCY_BUSINESS })
  assert.equal(result.architecture.siteType, "agency")
  assert.equal(result.plan.theme.colors?.primary, "#7c3aed")
  assert.equal(result.plan.theme.fontHeading, "Oswald")
  assert.equal(result.plan.theme.radius?.card, "4px")
})

test("D) direccion visual determinista: familia 'ecommerce' produce paleta/radius propios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: ECOMMERCE_BUSINESS })
  assert.equal(result.architecture.siteType, "ecommerce")
  assert.equal(result.plan.theme.colors?.primary, "#16a34a")
  assert.equal(result.plan.theme.radius?.card, "24px")
})

test("E) fallback seguro: negocio generico/no clasificado conserva la direccion 'business' neutra y deterministica", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const first = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: GENERIC_BUSINESS })
  const second = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: GENERIC_BUSINESS })

  assert.equal(first.architecture.siteType, "business")
  assert.equal(first.plan.theme.colors?.primary, "#334155")
  assert.equal(first.plan.theme.fontHeading, "Inter")
  // determinismo: misma entrada -> mismo resultado exacto
  assert.deepEqual(first.plan.theme, second.plan.theme)
})

test("F) las 5 familias no colapsan al mismo sistema visual (paleta+tipografia combinadas)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const fixtures = [HEALTH_BUSINESS, RESTAURANT_BUSINESS, AGENCY_BUSINESS, ECOMMERCE_BUSINESS, GENERIC_BUSINESS]
  const signatures = new Set<string>()

  for (const business of fixtures) {
    const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business })
    signatures.add(`${result.plan.theme.colors?.primary}|${result.plan.theme.fontHeading}|${result.plan.theme.radius?.card}`)
  }

  assert.equal(signatures.size, 5, "las 5 familias deben producir 5 firmas visuales distintas, no colapsar a menos")
})

test("G) Design Memory L2 sigue teniendo precedencia sobre la direccion determinista (no se rompe la jerarquia existente)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: HEALTH_BUSINESS,
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L2",
      patternKeyHash: "c".repeat(64),
      evidence: { rankingScore: 0.9, confidence: "high", qualifiedSampleSize: 50, fallbackUsed: false },
      recommendation: {
        context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
        theme: { accentHue: "pink" },
      },
      reason: [],
    } as never,
  })

  // La direccion determinista para 'health' es azul; si L2 sigue ganando,
  // el resultado debe ser el tono L2 (pink), no el azul determinista.
  assert.notEqual(result.plan.theme.colors?.primary, "#1794CC")
  assert.equal(result.plan.theme.colors?.primary, "#db2777")
})

test("H) guardia de contraste: getVisualDirectionForFamily + hasSafeContrast existen y validan combinaciones reales", async () => {
  const { getVisualDirectionForFamily, hasSafeContrast, contrastRatio } = await import("../../lib/orvenix-ai/theme/visual-direction")

  for (const family of ["health", "hospitality", "creative", "commerce", "professional", undefined] as const) {
    const direction = getVisualDirectionForFamily(family)
    assert.ok(direction, `family '${family}' debe producir una direccion`)
  }

  assert.equal(hasSafeContrast("#000000", "#ffffff"), true)
  assert.equal(hasSafeContrast("#fefefe", "#ffffff"), false)
  assert.equal(contrastRatio("not-a-color", "#ffffff"), null)
})

test("I) iconografia generada: services/features/trust/process reciben iconos del allowlist seguro; productos/pricing/testimonios no", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const ALLOWLIST = ["sparkles", "shield-check", "workflow", "message-circle", "check-circle", "star", "zap", "list-checks"]

  for (const role of ["trust", "services", "features", "process"] as const) {
    const section = composeSection(role, { archetype: "overview" })!
    const icons = Object.values(section.nodes).filter((n) => n.type === "icon")
    assert.ok(icons.length > 0, `role '${role}' deberia tener al menos un icono`)
    for (const icon of icons) {
      assert.ok(ALLOWLIST.includes(String(icon.props?.name)), `icono '${icon.props?.name}' no esta en el allowlist seguro`)
    }
  }

  for (const role of ["pricing", "testimonials", "faq"] as const) {
    const section = composeSection(role, { archetype: "overview" })!
    const icons = Object.values(section.nodes).filter((n) => n.type === "icon")
    assert.equal(icons.length, 0, `role '${role}' no deberia recibir iconos en V2-1 (evitar decorar todo)`)
  }
})

test("J) iconografia es deterministica: misma entrada produce exactamente los mismos iconos en el mismo orden", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const first = composeSection("services", { archetype: "catalog", services: [{ name: "A" }, { name: "B" }, { name: "C" }] })!
  const second = composeSection("services", { archetype: "catalog", services: [{ name: "A" }, { name: "B" }, { name: "C" }] })!

  const namesOf = (section: typeof first) => Object.values(section.nodes).filter((n) => n.type === "icon").map((n) => n.props?.name)
  assert.deepEqual(namesOf(first), namesOf(second))
})

test("K) resolucion de fuentes: el nombre de fuente del tema se resuelve a la variable CSS del catalogo real (sin next/font en la capa de negocio)", async () => {
  const { resolveFontCssValue } = await import("../../components/editor/theme/font-registry")

  assert.equal(resolveFontCssValue("Inter"), "var(--font-inter)")
  assert.equal(resolveFontCssValue("Playfair Display"), "var(--font-playfair-display)")
  assert.equal(resolveFontCssValue("Oswald"), "var(--font-oswald)")
  assert.equal(resolveFontCssValue("JetBrains Mono"), "var(--font-jetbrains-mono)")
  // Fallback seguro: un nombre no reconocido pasa sin cambios (comportamiento legacy).
  assert.equal(resolveFontCssValue("Comic Sans MS"), "Comic Sans MS")
  assert.equal(resolveFontCssValue(undefined), undefined)
})

test("L) regresion Estudio Norte: 'identidad visual' sigue sin clasificar como health/dental tras V2-1", async () => {
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
})

test("M) Plan V2 / PageArchetype / navegacion canonica / servicios reales siguen intactos tras V2-1 (Estudio Norte, pipeline completo)", async () => {
  const { normalizeSiteCreationBusiness } = await import("../../lib/orvenix-ai/site-creation/business-normalization")
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const request =
    "Crea un sitio web profesional para Estudio Norte. Diseñamos logotipos, identidad visual y sitios web para negocios en Guadalajara. El objetivo principal es conseguir solicitudes de cotizacion."
  const business = normalizeSiteCreationBusiness(
    { name: "Estudio Norte", industry: "diseño gráfico", location: "Guadalajara", objective: "Conseguir solicitudes de cotizacion", description: request },
    request,
  )

  const result = await runAutonomousMultiPageSiteBuilder({
    request,
    forceFreshComposition: true,
    business: { name: business.name, industry: business.industry, location: business.location, description: business.description, objective: business.objective, services: business.services },
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.plan.pages.map((p) => p.slug), ["home", "servicios", "contacto"])
  assert.deepEqual(result.plan.navigation.map((n) => n.label), ["Inicio", "Servicios", "Contacto"])

  const archetypeBySlug = new Map(result.architecture.pages.map((p) => [p.slug, p.archetype]))
  assert.equal(archetypeBySlug.get("home"), "overview")
  assert.equal(archetypeBySlug.get("servicios"), "catalog")
  assert.equal(archetypeBySlug.get("contacto"), "conversion")

  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const serviceTitles = Object.values(servicios.tree.nodes)
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  assert.ok(serviceTitles.includes("logotipos"))
  assert.ok(serviceTitles.includes("identidad visual"))
  assert.ok(serviceTitles.includes("sitios web"))
})
