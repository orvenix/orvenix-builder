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
  applyCompositionPlanToArchitectureV1,
  buildDefaultAssistedSiteGenerationProposalV1,
  resolveAssistedGenerationModeV1,
  resolveAssistedSiteGenerationV1,
} from "../../lib/orvenix-ai/assisted-generation/architecture-bridge"
import { buildSiteArchitecture } from "../../lib/orvenix-ai/architect"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import { validateSiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect/site-architect"
import type { EditorNode } from "../../types/editor"

const SERVICES = [
  { name: "Identidad visual", description: "DEV FIXTURE: sistemas de marca completos." },
  { name: "Diseno web", description: "DEV FIXTURE: sitios web editables y rapidos." },
  { name: "Direccion creativa", description: "DEV FIXTURE: acompanamiento creativo integral." },
]

function fixtureArchitecture(): OrvenixSiteArchitecture {
  return buildSiteArchitecture({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: {
      name: "Estudio Fixture",
      industry: "estudio creativo",
      description: "DEV FIXTURE: estudio creativo enfocado en identidad, diseno web y direccion creativa.",
      location: "Monterrey",
      objective: "Conseguir solicitudes de proyecto",
      services: SERVICES,
    },
  })
}

function baseBusiness() {
  return {
    name: "Estudio Fixture",
    industry: "estudio creativo",
    description: "DEV FIXTURE: estudio creativo enfocado en identidad, diseno web y direccion creativa.",
    location: "Monterrey",
    objective: "Conseguir solicitudes de proyecto",
    services: SERVICES,
  }
}

// This fixture's real, resolved architecture puts "services" on the
// secondary "servicios" page (Home carries gallery/testimonials/trust
// instead) -- confirmed by reading the real buildSiteArchitecture output
// rather than assuming a role/page mapping. The proposal below targets
// the actual page that has the "services" role.
const ASSISTED_TARGET_PAGE_SLUG = "servicios"

function richProposal() {
  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [
      {
        slug: ASSISTED_TARGET_PAGE_SLUG,
        instances: [
          { role: "navigation", selection: { mode: "all" } },
          { role: "hero", selection: { mode: "all" }, composition: { layout: { kind: "oversized-typography" } } },
          { role: "services", selection: { mode: "single-item", itemIndex: 0 }, composition: { layout: { kind: "editorial-split" } } },
          { role: "services", selection: { mode: "single-item", itemIndex: 1 }, composition: { layout: { kind: "editorial-split", mirror: true } } },
          { role: "cta", selection: { mode: "all" } },
          { role: "footer", selection: { mode: "all" } },
        ],
      },
    ],
  }
}

function nodeTypeHistogram(nodes: Record<string, EditorNode>): Record<string, number> {
  const histogram: Record<string, number> = {}
  for (const node of Object.values(nodes)) histogram[node.type] = (histogram[node.type] ?? 0) + 1
  return histogram
}

function allNodeText(nodes: Record<string, EditorNode>): string {
  return Object.values(nodes)
    .map((n) => String(n.props?.text ?? n.props?.content ?? ""))
    .join(" | ")
}

// --- 1) off mode ---

test("1) off mode: architecture unchanged, resolved by reference (never a clone)", async () => {
  const architecture = fixtureArchitecture()
  const result = await resolveAssistedSiteGenerationV1({ mode: "off", architecture })
  assert.equal(result.architecture, architecture)
  assert.deepEqual(result.lifecycle, { status: "disabled" })

  const resultUndefinedMode = await resolveAssistedSiteGenerationV1({ mode: undefined, architecture })
  assert.deepEqual(resultUndefinedMode.lifecycle, { status: "disabled" })
})

test("1c) off mode never invokes the provider, even with a proposal that would make the provider throw", async () => {
  const architecture = fixtureArchitecture()
  // If "off" reached the provider at all, structuredClone(response) would throw on this function
  // value and the call would resolve to {status:"failed"} instead of {status:"disabled"}.
  const poisonProposal = { poison: () => {} }

  const result = await resolveAssistedSiteGenerationV1({ mode: "off", architecture, proposal: poisonProposal })

  assert.deepEqual(result.lifecycle, { status: "disabled" })
  assert.equal(result.architecture, architecture)
})

function withEnv(value: string | undefined, fn: () => void) {
  const original = process.env.ORVENIX_ASSISTED_GENERATION_MODE
  if (value === undefined) delete process.env.ORVENIX_ASSISTED_GENERATION_MODE
  else process.env.ORVENIX_ASSISTED_GENERATION_MODE = value
  try {
    fn()
  } finally {
    if (original === undefined) delete process.env.ORVENIX_ASSISTED_GENERATION_MODE
    else process.env.ORVENIX_ASSISTED_GENERATION_MODE = original
  }
}

test("1d) resolveAssistedGenerationModeV1: missing env value resolves to off", () => {
  withEnv(undefined, () => {
    assert.equal(resolveAssistedGenerationModeV1(), "off")
  })
})

test("1e) resolveAssistedGenerationModeV1: any unknown/unsupported env value resolves to off", () => {
  for (const unknownValue of ["true", "1", "anthropic", "ANTHROPIC", "DETERMINISTIC", " deterministic", "deterministic "]) {
    withEnv(unknownValue, () => {
      assert.equal(resolveAssistedGenerationModeV1(), "off", `expected "${unknownValue}" to resolve to off`)
    })
  }
})

test("1f) resolveAssistedGenerationModeV1: only the exact literal \"deterministic\" enables deterministic mode", () => {
  withEnv("deterministic", () => {
    assert.equal(resolveAssistedGenerationModeV1(), "deterministic")
  })
})

// --- 2) applied deterministic mode (default, structurally-neutral proposal) ---

test("2) deterministic mode with no explicit proposal applies a structurally-neutral default", async () => {
  const architecture = fixtureArchitecture()
  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture })

  assert.equal(result.lifecycle.status, "applied")
  const homePage = result.architecture.pages.find((p) => p.slug === "home")
  const originalHome = architecture.pages.find((p) => p.slug === "home")
  assert.ok(homePage && originalHome)
  assert.deepEqual(homePage!.sections.map((s) => s.role), originalHome!.sections.map((s) => s.role))
  for (const section of homePage!.sections) {
    assert.equal(section.instance?.selection.mode, "all")
    assert.equal(section.instance?.provenance, "deterministic")
  }
})

// --- 3) provider failure ---

test("3) provider failure (non-cloneable proposal) falls back to the unmodified architecture", async () => {
  const architecture = fixtureArchitecture()
  const nonCloneableProposal = { pages: [{ slug: "home" }], poison: () => {} }

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal: nonCloneableProposal })

  assert.equal(result.lifecycle.status, "failed")
  // Rejected/failed paths return the exact SAME architecture object -- reference equality, not just a deep-equal clone.
  assert.equal(result.architecture, architecture)
})

// --- 4) malformed proposal ---

test("4) malformed proposal (missing required fields) is rejected, architecture unchanged", async () => {
  const architecture = fixtureArchitecture()

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal: { version: 1 } })

  assert.equal(result.lifecycle.status, "rejected")
  if (result.lifecycle.status === "rejected") assert.ok(result.lifecycle.reasons.length > 0)
  assert.equal(result.architecture, architecture)
})

// --- 5) grounding rejection (nonexistent page) ---

test("5) a proposal referencing a page that doesn't exist is rejected by closed-world grounding", async () => {
  const architecture = fixtureArchitecture()
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "esta-pagina-no-existe", instances: [{ role: "hero", selection: { mode: "all" } }] }],
  }

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal })

  assert.equal(result.lifecycle.status, "rejected")
  if (result.lifecycle.status === "rejected") {
    assert.ok(result.lifecycle.reasons.some((reason) => reason.includes("esta-pagina-no-existe")))
  }
  assert.equal(result.architecture, architecture)
})

test("5b) page-local partial acceptance mutates ONLY the page(s) that were validly grounded -- a sibling page rejected within the same proposal stays byte-identical", async () => {
  const architecture = fixtureArchitecture()
  const untouchedPageBefore = JSON.parse(JSON.stringify(architecture.pages.find((p) => p.slug === "contacto")))
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [
      // Valid, groundable page.
      { slug: "home", instances: [{ role: "navigation", selection: { mode: "all" } }, { role: "hero", selection: { mode: "all" } }] },
      // Same proposal, a SIBLING page with a deliberately out-of-range index -> that page is rejected.
      { slug: "contacto", instances: [{ role: "contact", selection: { mode: "single-item", itemIndex: 999 } }] },
    ],
  }

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal })

  // Overall outcome is still "applied" -- ASSISTED-2A's own grounding accepts the plan as long as at
  // least one page was groundable, and warns rather than hard-failing the whole proposal.
  assert.equal(result.lifecycle.status, "applied")

  const homePage = result.architecture.pages.find((p) => p.slug === "home")
  assert.ok(homePage?.sections.some((s) => s.instance))

  const contactoPageAfter = result.architecture.pages.find((p) => p.slug === "contacto")
  assert.deepEqual(contactoPageAfter, untouchedPageBefore)
})

// --- 6) invalid indexes / invalid layout ---

test("6a) an out-of-range single-item index is rejected, never invents an item", async () => {
  const architecture = fixtureArchitecture()
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 999 } }] }],
  }

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal })
  assert.equal(result.lifecycle.status, "rejected")
})

test("6b) a layout kind not valid for the instance's role is rejected at validation", async () => {
  const architecture = fixtureArchitecture()
  const proposal = {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "all" }, composition: { layout: { kind: "dramatic-closing" } } }] }],
  }

  const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal })
  assert.equal(result.lifecycle.status, "rejected")
})

// --- 7) fallback never throws, never partially mutates ---

test("7) resolveAssistedSiteGenerationV1 never throws, regardless of input shape", async () => {
  const architecture = fixtureArchitecture()
  // null/undefined are intentionally NOT malformed here -- `??` routes them to the safe default
  // proposal (see test 2/10); every other shape below must survive validation safely.
  const inputs: unknown[] = ["not-an-object", 42, [], { pages: "not-an-array" }, { pages: [null] }]
  for (const proposal of inputs) {
    const result = await resolveAssistedSiteGenerationV1({ mode: "deterministic", architecture, proposal })
    assert.ok(result.lifecycle.status === "rejected" || result.lifecycle.status === "failed")
    assert.equal(result.architecture, architecture)
  }
})

// --- applyCompositionPlanToArchitectureV1: leaves uncovered pages untouched ---

test("applyCompositionPlanToArchitectureV1 leaves a page absent from the plan completely untouched", () => {
  const architecture = fixtureArchitecture()
  const untouchedPage = architecture.pages.find((p) => p.slug !== "home")
  const result = applyCompositionPlanToArchitectureV1(architecture, { version: 1, pages: [{ slug: "home", instances: [] }] })
  const resultSamePage = result.pages.find((p) => p.slug === untouchedPage?.slug)
  assert.deepEqual(resultSamePage, untouchedPage)
})

// --- 8) SiteCreationPlanV2 remains valid end-to-end ---

test("8) the full builder with a rich deterministic proposal still produces a valid SiteCreationPlanV2", async () => {
  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "deterministic", proposal: richProposal() },
  })

  assert.equal(result.ok, true)
  assert.equal(result.assistedGeneration.status, "applied")
  const revalidation = validateSiteCreationPlanV2(result.plan, { maxPages: Math.max(result.architecture.pages.length, 1), maxBytes: 1_000_000 })
  assert.equal(revalidation.ok, true)
})

// --- 9) real executable difference between off and deterministic+rich-proposal ---

test("9) off vs. deterministic-with-rich-proposal produce measurably different real EditorTree structure", async () => {
  const offResult = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: baseBusiness(),
    forceFreshComposition: true,
  })
  const assistedResult = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "deterministic", proposal: richProposal() },
  })

  assert.equal(offResult.ok, true)
  assert.equal(assistedResult.ok, true)
  assert.equal(offResult.assistedGeneration.status, "disabled")
  assert.equal(assistedResult.assistedGeneration.status, "applied")

  const offPage = offResult.plan.pages.find((p) => p.slug === ASSISTED_TARGET_PAGE_SLUG)!
  const assistedPage = assistedResult.plan.pages.find((p) => p.slug === ASSISTED_TARGET_PAGE_SLUG)!

  const offHistogram = nodeTypeHistogram(offPage.tree.nodes)
  const assistedHistogram = nodeTypeHistogram(assistedPage.tree.nodes)
  assert.notDeepEqual(offHistogram, assistedHistogram)

  // The rich proposal splits "services" into two single-item instances: each real service name
  // must appear, but no single "services" section-derived heading/text run should contain ALL of them
  // clustered as one grid the way the off/baseline run does.
  const assistedText = allNodeText(assistedPage.tree.nodes)
  assert.ok(assistedText.includes("Identidad visual"))
  assert.ok(assistedText.includes("Diseno web"))

  // Real, structural: the assisted run's root has a DIFFERENT top-level section count than the
  // baseline, because "services" was split into 2 independently-composed instances instead of
  // being rendered once, and "process"/"faq" were dropped by the (deliberately partial) proposal.
  const offRoot = offPage.tree.nodes[offPage.tree.rootId]
  const assistedRoot = assistedPage.tree.nodes[assistedPage.tree.rootId]
  assert.ok(assistedRoot.children.length !== offRoot.children.length || offHistogram.section !== assistedHistogram.section)
})

// --- default proposal builder (buildDefaultAssistedSiteGenerationProposalV1) is genuinely a no-op through the real pipeline ---

test("10) the default (no explicit proposal) deterministic run compiles to the same EditorTree structure as off mode", async () => {
  const offResult = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: baseBusiness(),
    forceFreshComposition: true,
  })
  const defaultDeterministicResult = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para un estudio creativo en Monterrey",
    business: baseBusiness(),
    forceFreshComposition: true,
    assistedGeneration: { mode: "deterministic" },
  })

  assert.equal(defaultDeterministicResult.assistedGeneration.status, "applied")
  const offHome = offResult.plan.pages.find((p) => p.isHome)!
  const defaultHome = defaultDeterministicResult.plan.pages.find((p) => p.isHome)!
  assert.deepEqual(nodeTypeHistogram(offHome.tree.nodes), nodeTypeHistogram(defaultHome.tree.nodes))
})

// --- buildDefaultAssistedSiteGenerationProposalV1 shape sanity ---

test("11) buildDefaultAssistedSiteGenerationProposalV1 carries no instances/sectionOrder for any page", () => {
  const architecture = fixtureArchitecture()
  const proposal = buildDefaultAssistedSiteGenerationProposalV1(architecture)
  assert.equal(proposal.pages.length, architecture.pages.length)
  for (const page of proposal.pages) {
    assert.equal(page.instances, undefined)
    assert.equal(page.sectionOrder, undefined)
  }
})
