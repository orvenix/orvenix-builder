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
import type { DesignPlannerPriorV1 } from "../../lib/orvenix-ai/design-memory/planner-prior"

/**
 * V2-5C fix 1: proves the theme pipeline reorg in site-builder.ts (theme
 * resolved ONCE, before compileSiteBlueprint, and reused for both the
 * composer's accentColor and the final plan.theme) leaves no room for
 * composition's accent-soft tone to diverge from the site's actually-
 * applied theme accent, across every advisory precedence tier.
 */

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
}

function richDirection(overrides: Record<string, unknown> = {}): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [
      { slug: "home", narrativeGoal: "x", sectionToneStrategy: "soft-rhythm" },
      { slug: "servicios", narrativeGoal: "x", sectionToneStrategy: "soft-rhythm" },
    ],
    ...overrides,
  } as CreativeSiteDirectionV1
}

function l2Prior(theme: Record<string, unknown>): DesignPlannerPriorV1 {
  return {
    version: 1,
    source: "design_memory",
    mode: "advisory",
    rankingVersion: 1,
    patternVersion: 1,
    level: "L2",
    patternKeyHash: "a".repeat(64),
    evidence: { rankingScore: 1, confidence: "high", qualifiedSampleSize: 25, fallbackUsed: false },
    recommendation: { theme },
    reason: ["test fixture"],
  }
}

function servicesTintedBackground(tree: { nodes: Record<string, { type: string; props?: Record<string, unknown> }> }): string[] {
  return Object.values(tree.nodes)
    .filter((n) => n.type === "section")
    .map((n) => n.props?.background)
    .filter((b): b is string => typeof b === "string")
}

// ---------------------------------------------------------------------------
// Structural regression guard: exactly ONE theme-resolution call site.
// ---------------------------------------------------------------------------

test("theme resolution (applySiteCreationThemeAdvisories) is called exactly once in site-builder.ts (single authority, no divergent second call)", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/autonomous/site-builder.ts"), "utf8")
  const allOccurrences = source.match(/applySiteCreationThemeAdvisories\(/g) ?? []
  const definitionSites = source.match(/function applySiteCreationThemeAdvisories\(/g) ?? []
  const callSites = allOccurrences.length - definitionSites.length
  assert.equal(definitionSites.length, 1)
  assert.equal(callSites, 1, `expected exactly one CALL to applySiteCreationThemeAdvisories, found ${callSites}`)
})

// ---------------------------------------------------------------------------
// 1) Baseline deterministic accent reaches composition
// ---------------------------------------------------------------------------

test("1) baseline (no advisory) accent reaches composition: servicios page contains a tint of plan.theme.colors.accent", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { lightAccentTint } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection: richDirection() })
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const expectedTint = lightAccentTint(result.plan.theme.colors!.accent)

  assert.equal(result.plan.theme.colors!.accent, "#1BB3FA") // health's deterministic baseline accent, unchanged
  assert.ok(servicesTintedBackground(servicios.tree as never).includes(expectedTint!))
})

// ---------------------------------------------------------------------------
// 2) Higher-priority advisory (Design Memory L2) changes BOTH final accent
// and composition accent to the SAME new value.
// ---------------------------------------------------------------------------

test("2) Design Memory L2 advisory changes final theme accent AND composition accent-soft tint together", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { lightAccentTint } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const baseline = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS, creativeDirection: richDirection() })
  const withL2 = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: PHYSIO_BUSINESS,
    creativeDirection: richDirection(),
    designMemoryPrior: l2Prior({ accentHue: "purple" }),
  })

  assert.equal(withL2.plan.theme.colors!.accent, "#a78bfa")
  assert.notEqual(withL2.plan.theme.colors!.accent, baseline.plan.theme.colors!.accent)

  const servicios = withL2.plan.pages.find((p) => p.slug === "servicios")!
  const expectedTint = lightAccentTint(withL2.plan.theme.colors!.accent)
  const baselineTint = lightAccentTint(baseline.plan.theme.colors!.accent)

  assert.ok(servicesTintedBackground(servicios.tree as never).includes(expectedTint!))
  assert.notEqual(expectedTint, baselineTint) // the composition-visible tint actually moved with the advisory
})

// ---------------------------------------------------------------------------
// 3) Creative Director visualDirection accent path stays synchronized too
// (lowest advisory priority, only reached when no L2/external advisory).
// ---------------------------------------------------------------------------

test("3) Creative Director visualDirection accent path also stays synchronized between final theme and composition", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { lightAccentTint } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: PHYSIO_BUSINESS,
    creativeDirection: richDirection({ visualDirection: { accentHue: "pink" } }),
  })

  assert.equal(result.plan.theme.colors!.accent, "#f472b6")
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const expectedTint = lightAccentTint(result.plan.theme.colors!.accent)
  assert.ok(servicesTintedBackground(servicios.tree as never).includes(expectedTint!))
})

test("3b) advisory precedence is preserved: Design Memory L2 still wins over a simultaneous CD visualDirection, and composition follows the WINNER", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { lightAccentTint } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: PHYSIO_BUSINESS,
    creativeDirection: richDirection({ visualDirection: { accentHue: "green" } }),
    designMemoryPrior: l2Prior({ accentHue: "purple" }),
  })

  assert.equal(result.plan.theme.colors!.accent, "#a78bfa") // L2's purple wins, not CD's green
  const servicios = result.plan.pages.find((p) => p.slug === "servicios")!
  const expectedTint = lightAccentTint(result.plan.theme.colors!.accent)
  assert.ok(servicesTintedBackground(servicios.tree as never).includes(expectedTint!))
})

// ---------------------------------------------------------------------------
// 4) Fallback/no-advisory path remains unchanged
// ---------------------------------------------------------------------------

test("4) fallback/no-advisory path is unaffected by the reorg: no richComposition, no creativeDirection at all -> unchanged deterministic theme", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: PHYSIO_BUSINESS })
  assert.equal(result.plan.theme.colors!.accent, "#1BB3FA")
})

// ---------------------------------------------------------------------------
// 5) AI cannot directly emit accentColor (already covered in
// creative-director-reference-augmented-v2-5c.test.ts; re-asserted here for
// this file's own completeness against the CreativeDirectorPageDirectionV1 shape).
// ---------------------------------------------------------------------------

test("5) AI cannot directly emit accentColor: not a key on the bounded pageDirection shape", async () => {
  const { validateCreativeSiteDirectionV1 } = await import("../../lib/orvenix-ai/creative-director/contract")
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", accentColor: "#ff00ff" }],
  })
  assert.equal(result.ok, false) // unknown key -> whole (only) pageDirection dropped -> nothing usable remains
})
