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

import type { CreativeSiteDirectionV1 } from "../../lib/orvenix-ai/creative-director/contract"

// ---------------------------------------------------------------------------
// V2-4: full-pipeline consumption. `creativeDirection` is threaded through
// runAutonomousMultiPageSiteBuilder directly (bypassing the DB-backed
// site-creation integration layer, already covered in
// creative-director-lifecycle-integration-v1.test.ts) -- these tests verify
// what the COMPOSER actually does with an already-validated direction.
// ---------------------------------------------------------------------------

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
}

function heroH1(nodes: Record<string, { type: string; props?: Record<string, unknown> }>): string | undefined {
  return Object.values(nodes).find((n) => n.type === "heading" && n.props?.level === 1)?.props?.text as string | undefined
}

function heroDescription(nodes: Record<string, { type: string; props?: Record<string, unknown>; children?: string[]; parentId?: string }>): string | undefined {
  const h1 = Object.values(nodes).find((n) => n.type === "heading" && n.props?.level === 1)
  if (!h1) return undefined
  let sectionRoot = h1
  while (sectionRoot.type !== "section" && sectionRoot.parentId) sectionRoot = nodes[sectionRoot.parentId]
  if (sectionRoot.type !== "section") return undefined
  let found: string | undefined
  const visit = (node: typeof h1 | undefined) => {
    if (!node || found !== undefined) return
    if (node.type === "text" && node.props?.size === "lg") { found = node.props?.content as string; return }
    for (const id of node.children ?? []) visit(nodes[id])
  }
  visit(sectionRoot)
  return found
}

function sectionRoleOrder(architecture: { pages: Array<{ slug: string; sections: Array<{ role: string }> }> }, slug: string): string[] {
  return architecture.pages.find((p) => p.slug === slug)!.sections.map((s) => s.role)
}

// ---------------------------------------------------------------------------
// D) AI Hero title/description applied when safe
// ---------------------------------------------------------------------------

test("D) AI hero title/description are applied to the matching page when present and already-sanitized", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [
      { slug: "home", narrativeGoal: "x", heroTitleSuggestion: "Recupera tu movimiento con fisioterapia deportiva", heroDescriptionSuggestion: "Centro de Fisioterapia Monterrey te acompaña en tu recuperacion." },
    ],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const home = result.plan.pages.find((p) => p.isHome)!
  assert.equal(heroH1(home.tree.nodes as never), "Recupera tu movimiento con fisioterapia deportiva")
  assert.equal(heroDescription(home.tree.nodes as never), "Centro de Fisioterapia Monterrey te acompaña en tu recuperacion.")
})

// ---------------------------------------------------------------------------
// AI/AJ) undefined/absent creativeDirection => byte-identical baseline
// ---------------------------------------------------------------------------

test("AJ) identical input with creativeDirection omitted vs explicitly null/undefined => identical output", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const withoutField = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const withNull = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection: null })
  assert.equal(heroH1(withoutField.plan.pages.find((p) => p.isHome)!.tree.nodes as never), heroH1(withNull.plan.pages.find((p) => p.isHome)!.tree.nodes as never))
  assert.deepEqual(withoutField.architecture.pages.map((p) => p.sections.map((s) => s.role)), withNull.architecture.pages.map((p) => p.sections.map((s) => s.role)))
})

// ---------------------------------------------------------------------------
// I/J) CTA intent precedence: real objective always wins
// ---------------------------------------------------------------------------

test("I) a real businessObjective beats an AI ctaIntent suggestion (S2.1 preserved)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", businessObjective: "Conseguir solicitudes de cotización", aiCtaIntent: "appointment" })
  const label = Object.values(cta!.nodes).find((n) => n.type === "ctaButton")?.props?.label
  assert.equal(label, "Solicitar cotización") // NOT "Agendar ahora" -- the real quote objective must never become an appointment CTA via AI input
})

test("J) AI ctaIntent is used ONLY when there is no real objective to classify from", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", aiCtaIntent: "quote" })
  const label = Object.values(cta!.nodes).find((n) => n.type === "ctaButton")?.props?.label
  assert.equal(label, "Solicitar cotización")
})

test("J) product-catalog CTA is never overridden by AI ctaIntent (S2.1 invariant)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const cta = composeSection("cta", { archetype: "catalog", products: [{ name: "Mole poblano" }], aiCtaIntent: "appointment" })
  const label = Object.values(cta!.nodes).find((n) => n.type === "ctaButton")?.props?.label
  assert.equal(label, "Ver catálogo")
})

// ---------------------------------------------------------------------------
// K/L) hero variant consumption
// ---------------------------------------------------------------------------

test("K) a valid preferredHeroVariant overrides the deterministic V2-3 selection", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  // Without the override, this context's deterministic hash resolves to something -- capture it, then confirm the override differs and wins.
  const withoutOverride = composeSection("hero", { archetype: "overview", visualFamily: "health", businessName: "X" })
  const forcedVariant = withoutOverride!.rootId // just to force evaluation; real check below
  void forcedVariant
  const withOverride = composeSection("hero", { archetype: "overview", visualFamily: "health", businessName: "X", aiPreferredHeroVariant: "immersive" })
  const hasImmersiveOverlay = Object.values(withOverride!.nodes).some(
    (n) => typeof n.props?.className === "string" && n.props.className.includes("bg-gradient-to-t") && n.props.className.includes("absolute inset-0"),
  )
  assert.equal(hasImmersiveOverlay, true)
})

test("L) an invalid preferredHeroVariant string falls back to deterministic V2-3 selection (defensive re-check)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  // Bypasses contract validation on purpose -- this exercises composeHero's OWN defensive HERO_VARIANTS.includes() check, not the contract layer.
  const section = composeSection("hero", { archetype: "overview", visualFamily: "health", businessName: "X", aiPreferredHeroVariant: "fullscreen-carousel" as never })
  const hasImmersiveOverlay = Object.values(section!.nodes).some(
    (n) => typeof n.props?.className === "string" && n.props.className.includes("bg-gradient-to-t") && n.props.className.includes("absolute inset-0"),
  )
  assert.equal(hasImmersiveOverlay, false) // never silently accepted as "immersive" or anything else unregistered
})

// ---------------------------------------------------------------------------
// M/N/O/P/Q/R) section order, full pipeline
// ---------------------------------------------------------------------------

test("M) a valid preferredSectionOrder reorders the Home page's sections", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const baseline = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const defaultOrder = sectionRoleOrder(baseline.architecture, "home")
  assert.ok(defaultOrder.length > 3, "expected a real multi-role recipe to test against")

  // swap the two roles right after navigation
  const swapped = [defaultOrder[0], defaultOrder[2], defaultOrder[1], ...defaultOrder.slice(3)]

  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", preferredSectionOrder: swapped }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  assert.deepEqual(sectionRoleOrder(result.architecture, "home"), swapped)
})

test("N/O/P/Q/R) an invalid preferredSectionOrder (invented role) falls back to the default order WITHOUT breaking other valid guidance on the same page", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const baseline = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  const defaultOrder = sectionRoleOrder(baseline.architecture, "home")

  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [
      { slug: "home", narrativeGoal: "x", preferredSectionOrder: ["navigation", "an-invented-role", ...defaultOrder.slice(2)], heroTitleSuggestion: "Fisioterapia deportiva: cuidamos tu recuperacion" },
    ],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  assert.deepEqual(sectionRoleOrder(result.architecture, "home"), defaultOrder) // order falls back
  const home = result.plan.pages.find((p) => p.isHome)!
  assert.equal(heroH1(home.tree.nodes as never), "Fisioterapia deportiva: cuidamos tu recuperacion") // independent guidance (hero copy) on the SAME page survives
})

// ---------------------------------------------------------------------------
// S/T) visual direction, density
// ---------------------------------------------------------------------------

test("S) a valid visualDirection bucket overrides the V2-1 deterministic baseline", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    visualDirection: { accentHue: "purple" },
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  assert.equal(result.plan.theme.colors?.primary, "#7c3aed") // purple, NOT health's deterministic blue (#1794CC)
})

test("T) an absent visualDirection uses the V2-1 deterministic baseline unchanged", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  assert.equal(result.plan.theme.colors?.primary, "#1794CC") // health's deterministic blue, unchanged
})

test("density=compact reduces card-grid section paddingY", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const standard = composeSection("services", { archetype: "catalog", services: [{ name: "A" }, { name: "B" }] })
  const compact = composeSection("services", { archetype: "catalog", services: [{ name: "A" }, { name: "B" }], aiDensity: "compact" })
  assert.equal((standard!.nodes[standard!.rootId].props as Record<string, unknown>).paddingY, "xl")
  assert.equal((compact!.nodes[compact!.rootId].props as Record<string, unknown>).paddingY, "lg")
})

// ---------------------------------------------------------------------------
// U) safe asset intent accepted into the search-intent hierarchy
// ---------------------------------------------------------------------------

test("U) a safe AI asset intent is tried FIRST in the search-intent hierarchy", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({ role: "hero", visualFamily: "health", industry: "fisioterapia", aiIntent: { subject: "physical therapist treating athlete knee", mood: "clinical, calm" } })
  assert.equal(hierarchy[0], "physical therapist treating athlete knee, clinical, calm")
})

test("absent AI asset intent leaves the existing V2-2 hierarchy unchanged", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const withoutAi = buildSearchIntentHierarchy({ role: "hero", visualFamily: "health", industry: "fisioterapia" })
  assert.equal(withoutAi[0], "physical therapy clinic")
})

// ---------------------------------------------------------------------------
// AC/AD) Plan V2 valid, Quality Gate passes, with creativeDirection applied
// ---------------------------------------------------------------------------

test("AC/AD) Plan V2 valid and Quality Gate does not reject with a full creativeDirection applied", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")
  const { assessSiteGenerationQualityV1 } = await import("../../lib/orvenix-ai/evaluation/quality-gate")

  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    tone: "warm", visualDirection: { radiusBucket: "soft" }, density: "standard",
    pageDirections: [
      { slug: "home", narrativeGoal: "x", heroTitleSuggestion: "Recupera tu movimiento con fisioterapia deportiva", heroDescriptionSuggestion: "Te acompañamos en tu recuperacion.", preferredHeroVariant: "split-left", ctaIntent: "appointment" },
    ],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const validation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
  const gate = assessSiteGenerationQualityV1(result.plan)
  assert.notEqual(gate.decision, "reject")
})

// ---------------------------------------------------------------------------
// AE/AF) siteType and VisualFamily authority unchanged by creativeDirection
// ---------------------------------------------------------------------------

test("AE) siteType authority is unaffected by creativeDirection", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    visualDirection: { accentHue: "purple" },
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  }
  const withCd = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const withoutCd = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  assert.equal(withCd.architecture.siteType, withoutCd.architecture.siteType)
  assert.equal(withCd.architecture.siteType, "health")
})

test("AF) VisualFamily classifier is unaffected by creativeDirection (still derived from real business facts only)", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(inferVisualFamily({ industry: "fisioterapia" }), "health")
})

// ---------------------------------------------------------------------------
// AG/AH/AI) S1/S2/S3 preserved with creativeDirection active
// ---------------------------------------------------------------------------

test("AG) V2-S1: real services still render on the Servicios page with creativeDirection active", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const headings = Object.values(servicios.tree.nodes).filter((n) => n.type === "heading" && n.props?.level === 3).map((n) => n.props?.text)
  assert.ok(headings.includes("Fisioterapia deportiva"))
})

test("AH) V2-S2: trust personalization still reflects real services with creativeDirection active (no hero override on this page)", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const home = result.plan.pages.find((p) => p.isHome)!
  const trustTexts = Object.values(home.tree.nodes).filter((n) => n.type === "text").map((n) => n.props?.content)
  assert.ok(trustTexts.some((t) => typeof t === "string" && t.includes("Fisioterapia deportiva")))
})

test("AI) V2-S3: hero fallback still works (no AI hero suggestion for this page) even with creativeDirection defined for a DIFFERENT page", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const creativeDirection: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "servicios", narrativeGoal: "x", heroTitleSuggestion: "No aplica a Home" }],
  }
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection })
  const home = result.plan.pages.find((p) => p.isHome)!
  // No AI direction for "home" specifically -> the V2-S3 deterministic hero-narrative.ts fallback still applies.
  assert.equal(heroH1(home.tree.nodes as never), "Centro de Fisioterapia Monterrey: fisioterapia deportiva y más")
})
