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

import {
  CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1,
  CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import { buildCreativeDirectorRequestV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import type { CreativeDesignReferenceV1 } from "../../lib/orvenix-ai/creative-director/reference-context"
import {
  NAVIGATION_CONTAINMENTS,
  NAVIGATION_CTA_EMPHASES,
  NAVIGATION_LINK_STYLES,
  NAVIGATION_SURFACE_STYLES,
} from "../../lib/orvenix-ai/composer/composition-context"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function directionWithNav(overrides: Partial<CreativeSiteDirectionV1> = {}): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
    ...overrides,
  }
}

function fixtureReference(overrides: Partial<CreativeDesignReferenceV1> = {}): CreativeDesignReferenceV1 {
  return {
    id: "webs:fixture",
    relevance: { contributionRoles: ["hero-composition"], diversityReason: "primary-relevance-anchor", relevanceScore: 0.9 },
    visualGrammar: { visualFamily: "ambient-dark-abstract", designPersonality: "bold-confident", mode: "dark", accent: "cool", radius: "soft", shadow: "soft", contrast: "high" },
    heroGrammar: { backgroundTreatment: "solid-gradient", alignment: "center", mediaStrategy: "none", ctaArrangement: "dual-cta" },
    sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" },
    assetGrammar: { strategy: "abstract", placement: "none" },
    conversionGrammar: { ctaStrategy: "dual-action", contactPattern: "generic-form" },
    navGrammar: { surfaceTreatment: "dark-glass", position: "fixed", shadowBehavior: "scroll-triggered", ctaPattern: "prominent-single", hasTwoTierBar: false },
    distinctiveTraits: [],
    ...overrides,
  }
}

function threeReferences(overrides: Partial<CreativeDesignReferenceV1>, idPrefix: string): CreativeDesignReferenceV1[] {
  return [0, 1, 2].map((i) => fixtureReference({ ...overrides, id: `webs:${idPrefix}-${i}` as never }))
}

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  services: [{ name: "Fisioterapia deportiva" }, { name: "Terapia manual" }],
}

const PHYSIO_ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "health",
  industry: "fisioterapia",
  objective: "x",
  services: PHYSIO_BUSINESS.services,
  pages: [
    {
      name: "Inicio",
      slug: "home",
      purpose: "x",
      archetype: "overview",
      sections: [
        { role: "navigation", blockType: null, purpose: "x" },
        { role: "hero", blockType: null, purpose: "x" },
        { role: "footer", blockType: null, purpose: "x" },
      ],
    },
  ],
}

function baseRequest(): CreativeDirectorRequestV1 {
  return buildCreativeDirectorRequestV1({ business: PHYSIO_BUSINESS, architecture: PHYSIO_ARCHITECTURE })
}

// ---------------------------------------------------------------------------
// Contract: cross-module vocabulary match
// ---------------------------------------------------------------------------

test("CREATIVE_DIRECTOR_NAVIGATION_*_V1 match the composer's own executable navigation vocabulary exactly", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1].sort(), [...NAVIGATION_SURFACE_STYLES].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1].sort(), [...NAVIGATION_CONTAINMENTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1].sort(), [...NAVIGATION_LINK_STYLES].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1].sort(), [...NAVIGATION_CTA_EMPHASES].sort())
})

// ---------------------------------------------------------------------------
// Contract: accepts valid values, drops unknown ones (lenient, site fields
// survive independently), existing V2-4/V2-5C proposals remain valid.
// ---------------------------------------------------------------------------

test("contract accepts every valid navigation field value", () => {
  for (const navigationSurfaceStyle of CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithNav({ navigationSurfaceStyle }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.navigationSurfaceStyle, navigationSurfaceStyle)
  }
  for (const navigationContainment of CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithNav({ navigationContainment }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.navigationContainment, navigationContainment)
  }
  for (const navigationLinkStyle of CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithNav({ navigationLinkStyle }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.navigationLinkStyle, navigationLinkStyle)
  }
  for (const navigationCtaEmphasis of CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithNav({ navigationCtaEmphasis }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.navigationCtaEmphasis, navigationCtaEmphasis)
  }
})

test("contract drops unrecognized navigation values (site-level fields independently, never a hard reject)", () => {
  const result = validateCreativeSiteDirectionV1(
    directionWithNav({
      // @ts-expect-error -- deliberately invalid
      navigationSurfaceStyle: "frosted",
      // @ts-expect-error -- deliberately invalid
      navigationContainment: "sidebar",
      navigationLinkStyle: "pill", // valid, must survive independently
      // @ts-expect-error -- deliberately invalid
      navigationCtaEmphasis: "aggressive",
    }),
  )
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.navigationSurfaceStyle, undefined)
    assert.equal(result.value.navigationContainment, undefined)
    assert.equal(result.value.navigationLinkStyle, "pill") // independent guidance survives
    assert.equal(result.value.navigationCtaEmphasis, undefined)
  }
})

test("no arbitrary color/CSS accepted as a navigation value (closed enums only)", () => {
  const result = validateCreativeSiteDirectionV1(
    directionWithNav({
      // @ts-expect-error -- deliberately invalid
      navigationSurfaceStyle: "#1BB3FA",
      // @ts-expect-error -- deliberately invalid
      navigationContainment: "bg-slate-950 backdrop-blur-xl",
    }),
  )
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.value.navigationSurfaceStyle, undefined)
    assert.equal(result.value.navigationContainment, undefined)
  }
})

test("an existing V2-4/V2-5C-shaped proposal with NO navigation fields at all remains fully valid", () => {
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    tone: "warm",
    density: "standard",
    pageDirections: [{ slug: "home", narrativeGoal: "x", preferredHeroVariant: "centered", heroTreatment: "abstract-glow" }],
  })
  assert.equal(result.ok, true)
})

test("AI cannot set navigationSurface/dark-light color pairing directly -- not a recognized key on the site-level shape", () => {
  const result = validateCreativeSiteDirectionV1({ ...directionWithNav(), navigationSurface: "dark" } as never)
  assert.equal(result.ok, false) // unknown key -> closed-shape rejection (site-level, only pageDirection is one; whole proposal fails since it's the only content)
})

// ---------------------------------------------------------------------------
// Phase L: NAV_CONTEXT_A/B/C -- same business, different navGrammar -> materially
// different bounded navigation decisions, through the actual gateway pathway.
// ---------------------------------------------------------------------------

const NAV_CONTEXT_A = threeReferences(
  { navGrammar: { surfaceTreatment: "solid", position: "sticky", shadowBehavior: "static", ctaPattern: "icon-actions-only", hasTwoTierBar: false } },
  "solid-noncta",
)
const NAV_CONTEXT_B = threeReferences(
  { navGrammar: { surfaceTreatment: "dark-glass", position: "fixed", shadowBehavior: "scroll-triggered", ctaPattern: "prominent-single", hasTwoTierBar: false } },
  "glass-prominent",
)
const NAV_CONTEXT_C = threeReferences(
  { navGrammar: { surfaceTreatment: "solid", position: "sticky", shadowBehavior: "static", ctaPattern: "prominent-single", hasTwoTierBar: true } },
  "solid-prominent",
)

async function navDecisionFor(referenceContext: CreativeDesignReferenceV1[]) {
  const request: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext }
  const result = await requestCreativeDirectionV1({
    request,
    provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("unreachable")
  return { navigationSurfaceStyle: result.proposal.navigationSurfaceStyle, navigationCtaEmphasis: result.proposal.navigationCtaEmphasis }
}

test("NAV_CONTEXT_A (solid surface, icon-actions/no-text-CTA grammar) yields navigationSurfaceStyle=solid, navigationCtaEmphasis=none", async () => {
  const decision = await navDecisionFor(NAV_CONTEXT_A)
  assert.deepEqual(decision, { navigationSurfaceStyle: "solid", navigationCtaEmphasis: "none" })
})

test("NAV_CONTEXT_B (dark-glass, prominent-CTA grammar) yields navigationSurfaceStyle=glass, navigationCtaEmphasis=prominent", async () => {
  const decision = await navDecisionFor(NAV_CONTEXT_B)
  assert.deepEqual(decision, { navigationSurfaceStyle: "glass", navigationCtaEmphasis: "prominent" })
})

test("NAV_CONTEXT_C (solid, prominent-CTA grammar) yields navigationSurfaceStyle=solid, navigationCtaEmphasis=prominent -- distinct from A and B", async () => {
  const decision = await navDecisionFor(NAV_CONTEXT_C)
  assert.deepEqual(decision, { navigationSurfaceStyle: "solid", navigationCtaEmphasis: "prominent" })
})

test("A/B/C navigation decisions are all pairwise distinct", async () => {
  const a = await navDecisionFor(NAV_CONTEXT_A)
  const b = await navDecisionFor(NAV_CONTEXT_B)
  const c = await navDecisionFor(NAV_CONTEXT_C)
  const fa = JSON.stringify(a)
  const fb = JSON.stringify(b)
  const fc = JSON.stringify(c)
  assert.notEqual(fa, fb)
  assert.notEqual(fb, fc)
  assert.notEqual(fa, fc)
})

test("reference id ALONE cannot select a navigation decision -- same grammar, different ids, same decision", async () => {
  const withOriginalIds = await navDecisionFor(NAV_CONTEXT_B)
  const withDifferentIds = await navDecisionFor(NAV_CONTEXT_B.map((r, i) => ({ ...r, id: `webs:totally-different-${i}` as never })))
  assert.deepEqual(withOriginalIds, withDifferentIds)
})

test("changing navGrammar (same ids) changes the deterministic navigation decision", async () => {
  const glassRefs = [fixtureReference({ id: "webs:same-id", navGrammar: { ...fixtureReference().navGrammar, surfaceTreatment: "dark-glass", ctaPattern: "prominent-single" } })]
  const solidRefs = [fixtureReference({ id: "webs:same-id", navGrammar: { ...fixtureReference().navGrammar, surfaceTreatment: "solid", ctaPattern: "icon-actions-only" } })]
  const glassDecision = await navDecisionFor(glassRefs)
  const solidDecision = await navDecisionFor(solidRefs)
  assert.notEqual(JSON.stringify(glassDecision), JSON.stringify(solidDecision))
})

// ---------------------------------------------------------------------------
// Full-pipeline execution: validated site-level navigation decision reaches
// the actual composed EditorTree through compileSiteBlueprint.
// ---------------------------------------------------------------------------

test("a validated site-level navigation decision executes through compileSiteBlueprint end to end", () => {
  const architecture: OrvenixSiteArchitecture = {
    siteType: "health",
    industry: "fisioterapia",
    objective: "x",
    pages: [
      { name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
    ],
  }
  const direction: CreativeSiteDirectionV1 = directionWithNav({
    navigationSurfaceStyle: "solid",
    navigationContainment: "floating",
    navigationLinkStyle: "pill",
    navigationCtaEmphasis: "none",
  })
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: direction })
  const navNode = Object.values(blueprint.pages[0].tree.nodes).find((n) => n.type === "siteNav")!
  const props = navNode.props as Record<string, unknown>
  assert.equal(props.surfaceStyle, "solid")
  assert.equal(props.chrome, "floating")
  assert.equal(props.variant, "pill")
  assert.equal(props.showCta, false)
})

test("no navigation decision on the CreativeDirection -> compileSiteBlueprint output for navigation is unaffected by CD being active for other reasons", () => {
  const architecture: OrvenixSiteArchitecture = {
    siteType: "health",
    industry: "fisioterapia",
    objective: "x",
    pages: [
      { name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
    ],
  }
  const withoutCd = compileSiteBlueprint(architecture, {})
  const withUnrelatedCd: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", heroTreatment: "abstract-glow" }],
  }
  const withCd = compileSiteBlueprint(architecture, { creativeDirection: withUnrelatedCd })
  const navA = Object.values(withoutCd.pages[0].tree.nodes).find((n) => n.type === "siteNav")!.props
  const navB = Object.values(withCd.pages[0].tree.nodes).find((n) => n.type === "siteNav")!.props
  assert.deepEqual(navA, navB)
})

// ---------------------------------------------------------------------------
// Phase O: deterministic visual diagnostics, no real AI, for 5 business
// scenarios -- references / navGrammar / selected direction / executed
// structural signature.
// ---------------------------------------------------------------------------

type Scenario = { label: string; business: Parameters<typeof buildCreativeDirectorRequestV1>[0]["business"]; architecture: OrvenixSiteArchitecture }

const SCENARIOS: Scenario[] = [
  {
    label: "A) health/appointment",
    business: { name: "Centro Movimiento Norte", industry: "fisioterapia deportiva", objective: "Agendar valoraciones", services: [{ name: "Valoración fisioterapéutica" }, { name: "Terapia manual" }] },
    architecture: { siteType: "health", industry: "fisioterapia deportiva", objective: "x", services: [{ name: "Valoración fisioterapéutica" }, { name: "Terapia manual" }], pages: [{ name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] }] },
  },
  {
    label: "B) restaurant",
    business: { name: "Restaurante Sabor de Casa", industry: "restaurante", objective: "Reservaciones", products: [{ name: "Menu de temporada" }] },
    architecture: { siteType: "restaurant", industry: "restaurante", objective: "x", products: [{ name: "Menu de temporada" }], pages: [{ name: "Inicio", slug: "home", purpose: "x", archetype: "catalog", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] }] },
  },
  {
    label: "C) creative studio",
    business: { name: "Estudio Luz y Forma", industry: "agencia creativa", objective: "Cotizaciones", services: [{ name: "Identidad de marca" }] },
    architecture: { siteType: "agency", industry: "agencia creativa", objective: "x", services: [{ name: "Identidad de marca" }], pages: [{ name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] }] },
  },
  {
    label: "D) ecommerce",
    business: { name: "Tienda Vistamoda", industry: "tienda de ropa", objective: "Vender en linea", products: [{ name: "Coleccion primavera" }] },
    architecture: { siteType: "ecommerce", industry: "tienda de ropa", objective: "x", products: [{ name: "Coleccion primavera" }], pages: [{ name: "Inicio", slug: "home", purpose: "x", archetype: "catalog", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] }] },
  },
  {
    label: "E) SaaS/professional",
    business: { name: "Launchpro", industry: "software", objective: "Suscripciones", services: [{ name: "Plan equipo" }] },
    architecture: { siteType: "business", industry: "software", objective: "x", services: [{ name: "Plan equipo" }], pages: [{ name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] }] },
  },
]

// ---------------------------------------------------------------------------
// Phase G: extraction sanitization + determinism for navGrammar.
// ---------------------------------------------------------------------------

test("navGrammar extraction is deterministic for the same source text", async () => {
  const { extractDesignReference } = await import("../../lib/orvenix-ai/design-reference/extract")
  const os = await import("node:os")
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs")
  const root = mkdtempSync(path.join(os.tmpdir(), "nav-grammar-determinism-"))
  const dirPath = path.join(root, "fixture")
  mkdirSync(dirPath)
  writeFileSync(
    path.join(dirPath, "page.tsx"),
    `export default function Page() { return (<header className="sticky top-0 bg-white/92 backdrop-blur-xl shadow-sm"><nav>x</nav></header>) }`,
    "utf8",
  )
  try {
    const a = extractDesignReference({ slug: "fixture", dirPath })
    const b = extractDesignReference({ slug: "fixture", dirPath })
    assert.deepEqual(a.navGrammar, b.navGrammar)
    assert.equal(a.navGrammar.surfaceTreatment, "light-glass")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("navGrammar never carries a URL/email/price/literal-copy shape (sanitization remains strict)", async () => {
  const { getDesignReferences } = await import("../../lib/orvenix-ai/design-reference/library")
  const { findSanitizationViolations } = await import("../../lib/orvenix-ai/design-reference/sanitize")
  for (const reference of getDesignReferences()) {
    const violations = findSanitizationViolations(reference)
    assert.deepEqual(violations, [], `${reference.id} should have no sanitization violations`)
  }
})

for (const scenario of SCENARIOS) {
  test(`V2-5C.1 diagnostic ${scenario.label}`, async () => {
    const { attachDesignReferenceContextV1 } = await import("../../lib/orvenix-ai/site-creation/creative-direction")
    const baseReq = buildCreativeDirectorRequestV1({ business: scenario.business, architecture: scenario.architecture })
    const request = attachDesignReferenceContextV1(baseReq, scenario.architecture.siteType)

    const gatewayResult = await requestCreativeDirectionV1({
      request,
      provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
      providerKey: "anthropic",
      modelKey: "claude_haiku_4_5",
    })
    assert.equal(gatewayResult.ok, true)
    if (!gatewayResult.ok) return

    const blueprint = compileSiteBlueprint(scenario.architecture, { creativeDirection: gatewayResult.proposal })
    const navNode = Object.values(blueprint.pages[0].tree.nodes).find((n) => n.type === "siteNav")!
    const props = navNode.props as Record<string, unknown>

    const referenceIds = (request.referenceContext ?? []).map((r) => r.id)
    const navGrammarSample = (request.referenceContext ?? []).map((r) => r.navGrammar.surfaceTreatment)
    const decision = { navigationSurfaceStyle: gatewayResult.proposal.navigationSurfaceStyle, navigationCtaEmphasis: gatewayResult.proposal.navigationCtaEmphasis }
    const executedSignature = { surfaceStyle: props.surfaceStyle, chrome: props.chrome, variant: props.variant, showCta: props.showCta, surface: props.surface }

    console.log(
      `[V2-5C.1 DIAGNOSTIC] ${scenario.label} :: REFERENCE_IDS=${JSON.stringify(referenceIds)} NAV_GRAMMAR_SAMPLE=${JSON.stringify(navGrammarSample)} SELECTED_DIRECTION=${JSON.stringify(decision)} EXECUTED_SIGNATURE=${JSON.stringify(executedSignature)}`,
    )

    // No source copy, no URLs.
    assert.equal(/https?:\/\/|@/.test(JSON.stringify({ referenceIds, navGrammarSample, decision, executedSignature })), false)
  })
}
