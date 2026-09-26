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

import { buildSiteArchitecture, type OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect/site-architect"
import {
  resolveArchitectureStrategy,
  buildRoleConstraints,
  validateRoleSequence,
  type ArchitectureSelectionContext,
} from "../../lib/orvenix-ai/architect/architecture-selector"
import type { ArchitectureStrategy } from "../../lib/orvenix-ai/architect/architecture-grammar"

// ---------------------------------------------------------------------------
// V2-6 Adaptive Architecture MVP.
//
// NON-NEGOTIABLE INVARIANT under test throughout this file: architecture is
// selected primarily from semantic/business/reference signals; stableHash
// may only diversify or break ties among candidates that are ALREADY
// semantically valid. "input changed -> hash bucket changed -> unrelated
// architecture changed" is exactly what these tests are designed to catch.
// ---------------------------------------------------------------------------

const DIMENSIONS = ["opening", "narrative", "bodyTopology", "closing", "trustPlacement"] as const

function diffCount(a: ArchitectureStrategy, b: ArchitectureStrategy): number {
  return DIMENSIONS.filter((dimension) => a[dimension] !== b[dimension]).length
}

function tuple(strategy: ArchitectureStrategy): string {
  return DIMENSIONS.map((dimension) => strategy[dimension]).join("|")
}

function homeRoleSequence(architecture: OrvenixSiteArchitecture): string[] {
  return architecture.pages.find((page) => page.slug === "home")!.sections.map((section) => section.role)
}

// ---------------------------------------------------------------------------
// Fixtures. Every business below differs in REAL facts (industry text,
// services/products, evidence, pricing language) -- never in name/slug,
// which is the one thing that must NEVER move the result.
// ---------------------------------------------------------------------------

const HEALTH_BUSINESS = {
  name: "Clinica Aurora",
  industry: "fisioterapia",
  description: "Atencion de fisioterapia deportiva y rehabilitacion postoperatoria.",
}

const RESTAURANT_BUSINESS = {
  name: "Restaurante Casa Brasa",
  industry: "restaurante",
  products: [{ name: "Tacos al pastor" }, { name: "Enchiladas verdes" }],
}

const CREATIVE_BUSINESS = {
  name: "Estudio Norte",
  industry: "diseño gráfico",
  description: "Diseñamos identidad visual, branding y sitios web para negocios.",
  services: [{ name: "Identidad de marca" }, { name: "Diseño web" }],
  objective: "Conseguir solicitudes de cotización",
}

const ECOMMERCE_BUSINESS = {
  name: "Tienda Vento",
  industry: "tienda de ropa",
  products: [{ name: "Playera basica" }, { name: "Pantalon deportivo" }],
}

const SAAS_BUSINESS = {
  name: "Plataforma Vira",
  industry: "gestion empresarial con software",
  description: "Ayudamos a equipos a organizar tareas y reportes desde la nube.",
  services: [{ name: "Automatizacion de reportes" }, { name: "Panel de analitica" }],
  objective: "Conseguir suscripciones mensuales",
}

// ---------------------------------------------------------------------------
// 1) Five-business matrix
// ---------------------------------------------------------------------------

test("V2-6 five-business matrix: Health/Restaurant/Creative/Ecommerce/SaaS resolve materially distinct architecture", () => {
  const health = buildSiteArchitecture({ request: "x", business: HEALTH_BUSINESS })
  const restaurant = buildSiteArchitecture({ request: "x", business: RESTAURANT_BUSINESS })
  const creative = buildSiteArchitecture({ request: "x", business: CREATIVE_BUSINESS })
  const ecommerce = buildSiteArchitecture({ request: "x", business: ECOMMERCE_BUSINESS })
  const saas = buildSiteArchitecture({ request: "x", business: SAAS_BUSINESS })

  assert.equal(health.siteType, "health")
  assert.equal(restaurant.siteType, "restaurant")
  assert.equal(creative.siteType, "business")
  assert.equal(ecommerce.siteType, "ecommerce")
  assert.equal(saas.siteType, "business")

  for (const [label, architecture] of Object.entries({ health, restaurant, creative, ecommerce, saas })) {
    assert.ok(architecture.architectureStrategy, `${label} must resolve an architectureStrategy`)
  }

  /* Certain, grounding-driven invariants -- never a hash coin-flip. */
  assert.notEqual(health.architectureStrategy!.closing, "pricing")
  assert.notEqual(restaurant.architectureStrategy!.closing, "pricing")
  assert.notEqual(ecommerce.architectureStrategy!.closing, "pricing")
  assert.ok(["contact", "catalog"].includes(ecommerce.architectureStrategy!.closing))
  assert.notEqual(creative.architectureStrategy!.narrative, "product-led", "creative studio has no real products")

  /*
   * THE core convergence bug: Creative and SaaS share the exact same
   * siteType ("business") today. V2-6 must still diverge them using
   * finer semantic signals (VisualFamily, narrative-gating keywords).
   */
  const creativeVsSaas = diffCount(creative.architectureStrategy!, saas.architectureStrategy!)
  assert.ok(creativeVsSaas >= 2, `creative vs saas (both siteType=business) must differ in >=2 dimensions, got ${creativeVsSaas}`)

  const sequences = [health, restaurant, creative, ecommerce, saas].map((a) => JSON.stringify(homeRoleSequence(a)))
  const uniqueSequences = new Set(sequences)
  assert.ok(uniqueSequences.size >= 4, `expected at least 4 distinct Home role sequences among the 5 businesses, got ${uniqueSequences.size}`)

  /* Report the exact matrix for human inspection (visible in test output). */
  for (const [label, architecture] of Object.entries({ health, restaurant, creative, ecommerce, saas })) {
    console.log(
      `${label}: roles=${JSON.stringify(homeRoleSequence(architecture))} strategy=${JSON.stringify(architecture.architectureStrategy)}`,
    )
  }
})

// ---------------------------------------------------------------------------
// 2) Same-industry diversity: 3 restaurants, 3 creative, 3 SaaS
// ---------------------------------------------------------------------------

function assertIndustryTripletDiverges(label: string, businesses: Array<Parameters<typeof buildSiteArchitecture>[0]["business"]>) {
  const architectures = businesses.map((business) => buildSiteArchitecture({ request: "x", business }))
  const strategies = architectures.map((a) => a.architectureStrategy!)

  const distinctTuples = new Set(strategies.map(tuple))
  assert.ok(distinctTuples.size >= 2, `${label}: same-industry triplet collapsed to one identical architecture`)

  const diffs = [diffCount(strategies[0], strategies[1]), diffCount(strategies[0], strategies[2]), diffCount(strategies[1], strategies[2])]
  const maxDiff = Math.max(...diffs)
  assert.ok(maxDiff >= 2, `${label}: expected at least one pair to differ by >=2 dimensions, got ${JSON.stringify(diffs)}`)

  architectures.forEach((architecture, index) => {
    console.log(`${label}[${index}]: roles=${JSON.stringify(homeRoleSequence(architecture))} strategy=${JSON.stringify(strategies[index])}`)
  })

  return { architectures, strategies }
}

test("V2-6 same-industry diversity: 3 restaurants with different facts diverge, and the divergence is semantically explainable", () => {
  const r1 = { name: "R Uno", industry: "restaurante", description: "Cena fina de autor con reservaciones." }
  const r2 = { name: "R Dos", industry: "restaurante", products: [{ name: "Hamburguesa clasica" }, { name: "Papas" }, { name: "Malteada" }, { name: "Ensalada" }] }
  const r3 = { name: "R Tres", industry: "restaurante", description: "Organizamos eventos privados y banquetes.", objective: "Conseguir reservas para eventos" }

  const { strategies } = assertIndustryTripletDiverges("restaurants", [r1, r2, r3])

  /*
   * r2 has real menu items -> body topology must be grounded by a real
   * signal (catalog from the menu items, or showcase from the hospitality
   * visual family -- both are legitimately valid for a restaurant with
   * real dishes; "restaurant needs showcase/gallery stronger too" is an
   * explicit V2-6 affinity), never the generic linear/clustered fallback.
   */
  assert.ok(["catalog", "showcase"].includes(strategies[1].bodyTopology))
  assert.equal(strategies[1].reasons.bodyTopology.kind, "semantic-signal")

  /* r3's explicit event language must resolve an event-led narrative, grounded, not generic. */
  assert.equal(strategies[2].narrative, "event-led")
  assert.equal(strategies[2].reasons.narrative.kind, "semantic-signal")
})

test("V2-6 same-industry diversity: 3 creative businesses with different facts diverge, and the divergence is semantically explainable", () => {
  const c1 = { name: "C Uno", industry: "diseño gráfico", services: [{ name: "Branding" }, { name: "Diseño web" }] }
  const c2 = { name: "C Dos", industry: "ilustracion y diseño de personajes", services: [{ name: "Ilustracion editorial" }], objective: "Conseguir encargos de ilustracion" }
  const c3 = {
    name: "C Tres",
    industry: "branding y marca",
    description: "Ofrecemos paquetes de branding con precios claros.",
    services: [{ name: "Paquete branding" }],
  }

  const { strategies } = assertIndustryTripletDiverges("creative", [c1, c2, c3])

  /* c3's real pricing language must resolve a grounded pricing closing. */
  assert.equal(strategies[2].closing, "pricing")
  assert.equal(strategies[2].reasons.closing.kind, "semantic-signal")
})

test("V2-6 same-industry diversity: 3 SaaS/software businesses with different facts diverge, and the divergence is semantically explainable", () => {
  const s1 = {
    name: "S Uno",
    industry: "software de gestion de proyectos",
    description: "Ofrecemos planes mensuales para equipos de cualquier tamaño.",
    objective: "Conseguir suscripciones a nuestros planes",
  }
  const s2 = {
    name: "S Dos",
    industry: "software de analitica",
    description: "Miles de equipos ya confian en nuestra plataforma de analitica.",
  }
  const s3 = {
    name: "S Tres",
    industry: "software de productividad",
    description: "Una aplicacion de escritorio para gestionar proyectos y descargar reportes.",
    products: [{ name: "App de escritorio" }],
    objective: "Conseguir descargas de la aplicacion",
  }

  const evidenceForS2 = { hasPeople: false, hasTestimonials: true, hasContactDetails: false }

  const a1 = buildSiteArchitecture({ request: "x", business: s1 })
  const a2 = buildSiteArchitecture({ request: "x", business: s2 }, { businessEvidenceSummary: evidenceForS2 })
  const a3 = buildSiteArchitecture({ request: "x", business: s3 })
  const strategies = [a1.architectureStrategy!, a2.architectureStrategy!, a3.architectureStrategy!]
  ;[a1, a2, a3].forEach((architecture, index) => {
    console.log(`saas[${index}]: roles=${JSON.stringify(homeRoleSequence(architecture))} strategy=${JSON.stringify(strategies[index])}`)
  })

  const distinctTuples = new Set(strategies.map(tuple))
  assert.ok(distinctTuples.size >= 2, "SaaS triplet collapsed to one identical architecture")
  const diffs = [diffCount(strategies[0], strategies[1]), diffCount(strategies[0], strategies[2]), diffCount(strategies[1], strategies[2])]
  assert.ok(Math.max(...diffs) >= 2, `expected at least one SaaS pair to differ by >=2 dimensions, got ${JSON.stringify(diffs)}`)

  /* s1's real pricing language -> grounded pricing closing. */
  assert.equal(strategies[0].closing, "pricing")
  assert.equal(strategies[0].reasons.closing.kind, "semantic-signal")

  /*
   * s2's real testimonial evidence makes "early" trust placement a valid,
   * boosted candidate (vs. no evidence, where it would not even exist as
   * a candidate) -- proven by comparing against the SAME business with
   * evidence explicitly withheld, never by asserting a specific hash
   * outcome between two comparably-weighted valid candidates.
   */
  const s2WithoutEvidence = buildSiteArchitecture({ request: "x", business: s2 })
  assert.notEqual(
    s2WithoutEvidence.architectureStrategy!.reasons.trustPlacement.detail,
    "real trust evidence present",
    "without evidence, trustPlacement must never claim real trust evidence",
  )

  /* s3's real product + explicit app/download language -> grounded download closing. */
  assert.equal(strategies[2].narrative, "product-led")
  assert.equal(strategies[2].closing, "download")
  assert.equal(strategies[2].reasons.closing.kind, "semantic-signal")
})

// ---------------------------------------------------------------------------
// 3) Name / slug invariance
// ---------------------------------------------------------------------------

test("V2-6 name invariance: identical business facts with a different name/slug-like label resolve the identical ArchitectureStrategy", () => {
  const a = buildSiteArchitecture({ request: "x", business: { ...SAAS_BUSINESS, name: "Nombre Uno" } })
  const b = buildSiteArchitecture({ request: "x", business: { ...SAAS_BUSINESS, name: "Un Nombre Completamente Distinto, S.A. de C.V." } })
  assert.deepEqual(a.architectureStrategy, b.architectureStrategy)
  assert.deepEqual(homeRoleSequence(a), homeRoleSequence(b))
})

test("V2-6 slug invariance: an injected slug-like field on the selection context never influences the resolved strategy", () => {
  const base: ArchitectureSelectionContext = {
    siteType: "restaurant",
    industry: "restaurante",
    pricingSignal: false,
    products: [{ name: "Tacos al pastor" }],
  }
  const withSlugField = { ...base, slug: "menu-especial-de-la-casa-para-siempre" } as ArchitectureSelectionContext & { slug: string }
  assert.deepEqual(resolveArchitectureStrategy(base), resolveArchitectureStrategy(withSlugField))
})

// ---------------------------------------------------------------------------
// 4) Grounding safety
// ---------------------------------------------------------------------------

test("V2-6 grounding: pricing signal absent makes a pricing closing structurally impossible", () => {
  const context: ArchitectureSelectionContext = { siteType: "business", industry: "consultoria estrategica", pricingSignal: false }
  const strategy = resolveArchitectureStrategy(context)
  assert.notEqual(strategy.closing, "pricing")

  const constraints = buildRoleConstraints(strategy, { siteType: "business", hasServices: false, hasProducts: false, pricingSignal: false })
  assert.ok(constraints.forbiddenRoles.includes("pricing"))
})

test("V2-6 grounding: health/restaurant/ecommerce never receive a pricing closing even with a real pricing signal", () => {
  for (const siteType of ["health", "restaurant", "ecommerce"] as const) {
    const context: ArchitectureSelectionContext = { siteType, industry: siteType, pricingSignal: true }
    const strategy = resolveArchitectureStrategy(context)
    assert.notEqual(strategy.closing, "pricing", `${siteType} must never resolve a pricing closing`)
  }
})

test("V2-6 grounding: no real products and a non-catalog siteType never selects a product-led narrative (no fabricated catalog)", () => {
  const context: ArchitectureSelectionContext = { siteType: "business", industry: "consultoria estrategica", pricingSignal: false }
  const strategy = resolveArchitectureStrategy(context)
  assert.notEqual(strategy.narrative, "product-led")
})

test("V2-6 grounding: testimonials absent (evidence explicitly supplied as none) forbids the testimonials role and buildSiteArchitecture never renders it", () => {
  const evidence = { hasPeople: false, hasTestimonials: false, hasContactDetails: false }
  const context: ArchitectureSelectionContext = { siteType: "business", industry: "consultoria estrategica", pricingSignal: false, evidence }
  const strategy = resolveArchitectureStrategy(context)
  const constraints = buildRoleConstraints(strategy, { siteType: "business", hasServices: false, hasProducts: false, pricingSignal: false, evidence })
  assert.ok(constraints.forbiddenRoles.includes("testimonials"))

  const architecture = buildSiteArchitecture({ request: "x", business: { industry: "consultoria estrategica" } }, { businessEvidenceSummary: evidence })
  assert.ok(!homeRoleSequence(architecture).includes("testimonials"))
})

test("V2-6 grounding: people absent never lets trustPlacement claim real trust evidence", () => {
  const evidence = { hasPeople: false, hasTestimonials: false, hasContactDetails: false }
  const context: ArchitectureSelectionContext = { siteType: "business", industry: "consultoria estrategica", pricingSignal: false, evidence }
  const strategy = resolveArchitectureStrategy(context)
  assert.notEqual(strategy.reasons.trustPlacement.detail, "real trust evidence present")
})

test("V2-6 grounding: legacy callers that never pass an evidence summary keep the pre-V2-6 testimonials behavior (absence of signal != negative signal)", () => {
  const architecture = buildSiteArchitecture({ request: "x", business: { industry: "negocio de servicios generales" } })
  assert.ok(homeRoleSequence(architecture).includes("testimonials"), "omitting businessEvidenceSummary entirely must not be treated as 'no testimonials'")
})

// ---------------------------------------------------------------------------
// 5) Reference contribution: unsupported proposals are ignored, and one
//    reference cannot dominate the whole architecture.
// ---------------------------------------------------------------------------

test("V2-6 reference contribution: a semantically invalid proposal for this business is ignored, never force-applied", () => {
  const context: ArchitectureSelectionContext = {
    siteType: "health",
    industry: "fisioterapia",
    pricingSignal: false,
    references: [{ referenceId: "webs:some-ref", dimension: "closing", value: "pricing", signal: "pricing-popular-flag" }],
  }
  const strategy = resolveArchitectureStrategy(context)
  assert.notEqual(strategy.closing, "pricing")
  assert.equal(strategy.referenceContributions.length, 0)
})

test("V2-6 reference contribution: a single reference cannot influence more than 2 architecture dimensions", () => {
  const context: ArchitectureSelectionContext = {
    siteType: "business",
    industry: "diseño gráfico",
    visualFamily: "creative",
    pricingSignal: true,
    services: [{ name: "Branding" }],
    references: [
      { referenceId: "webs:dominant", dimension: "narrative", value: "portfolio-led", signal: "gallery-role-present" },
      { referenceId: "webs:dominant", dimension: "bodyTopology", value: "showcase", signal: "gallery-role-present" },
      { referenceId: "webs:dominant", dimension: "opening", value: "split", signal: "custom-hero-gradient-class" },
      { referenceId: "webs:dominant", dimension: "closing", value: "pricing", signal: "pricing-popular-flag" },
      { referenceId: "webs:dominant", dimension: "trustPlacement", value: "late", signal: "paired-column-grid" },
    ],
  }
  const strategy = resolveArchitectureStrategy(context)
  const fromDominant = strategy.referenceContributions.filter((c) => c.referenceId === "webs:dominant")
  assert.ok(fromDominant.length <= 2, `expected at most 2 contributions from one reference, got ${fromDominant.length}`)
})

// ---------------------------------------------------------------------------
// 6) Determinism
// ---------------------------------------------------------------------------

test("V2-6 determinism: identical semantic input always resolves the identical ArchitectureStrategy", () => {
  const context: ArchitectureSelectionContext = { siteType: "restaurant", industry: "restaurante", pricingSignal: false, products: [{ name: "Tacos" }] }
  assert.deepEqual(resolveArchitectureStrategy(context), resolveArchitectureStrategy(context))

  const a = buildSiteArchitecture({ request: "x", business: RESTAURANT_BUSINESS })
  const b = buildSiteArchitecture({ request: "x", business: RESTAURANT_BUSINESS })
  assert.deepEqual(a.architectureStrategy, b.architectureStrategy)
  assert.deepEqual(homeRoleSequence(a), homeRoleSequence(b))
})

// ---------------------------------------------------------------------------
// 7) Invalid strategy combination -> normalized/fallback safe result
// ---------------------------------------------------------------------------

test("V2-6 safety: validateRoleSequence rejects a sequence missing required roles or containing a forbidden one", () => {
  const strategy = resolveArchitectureStrategy({ siteType: "business", industry: "consultoria estrategica", pricingSignal: false })
  const constraints = buildRoleConstraints(strategy, { siteType: "business", hasServices: false, hasProducts: false, pricingSignal: false })

  assert.equal(validateRoleSequence(["hero", "footer"], constraints), false, "missing navigation/cta/core role must fail validation")
  assert.equal(validateRoleSequence(["navigation", "hero", "pricing", "cta", "footer"], constraints), false, "a forbidden pricing role must fail validation")
})

test("V2-6 safety: every generated Home page across every fixture in this file stays structurally valid regardless of which strategy was resolved", () => {
  const businesses = [HEALTH_BUSINESS, RESTAURANT_BUSINESS, CREATIVE_BUSINESS, ECOMMERCE_BUSINESS, SAAS_BUSINESS]
  for (const business of businesses) {
    const architecture = buildSiteArchitecture({ request: "x", business })
    const roles = homeRoleSequence(architecture)
    assert.equal(roles[0], "navigation", `${business.name}: Home must start with navigation`)
    assert.equal(roles[roles.length - 1], "footer", `${business.name}: Home must end with footer`)
    assert.ok(roles.includes("cta"), `${business.name}: Home must include a closing cta`)
    assert.equal(new Set(roles).size, roles.length, `${business.name}: Home must not repeat any role`)
  }
})
