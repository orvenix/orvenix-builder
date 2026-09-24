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
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import { attachDesignReferenceContextV1, buildCreativeDirectorRequestV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

/**
 * V2-5C section N/O: local, no-network diagnostic scenarios run through the
 * ACTUAL reference-augmented pathway: normalized business facts ->
 * buildCreativeDirectorRequestV1 -> attachDesignReferenceContextV1
 * (retrieval + sanitization) -> requestCreativeDirectionV1 (gateway,
 * deterministic testing provider, full schema+fact validation) ->
 * compileSiteBlueprint (composer). Each test prints ONLY bounded,
 * non-content diagnostic fields (reference ids, contribution roles,
 * bounded creative decisions, a structural composition summary) -- never
 * source copy, URLs, or demo facts.
 */

type Scenario = {
  label: string
  business: Parameters<typeof buildCreativeDirectorRequestV1>[0]["business"]
  architecture: OrvenixSiteArchitecture
}

const SCENARIOS: Scenario[] = [
  {
    label: "A) Physiotherapy (appointment objective, services/contact)",
    business: {
      name: "Centro de Fisioterapia Monterrey",
      industry: "fisioterapia",
      objective: "Conseguir citas de valoración",
      services: [{ name: "Fisioterapia deportiva" }, { name: "Terapia manual" }],
    },
    architecture: {
      siteType: "health",
      industry: "fisioterapia",
      objective: "x",
      services: [{ name: "Fisioterapia deportiva" }, { name: "Terapia manual" }],
      pages: [
        { name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "services", blockType: null, purpose: "x" }, { role: "contact", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
      ],
    },
  },
  {
    label: "B) Restaurant (booking/catalog/contact)",
    business: {
      name: "Restaurante Sabor de Casa",
      industry: "restaurante",
      objective: "Reservaciones de mesa",
      products: [{ name: "Menu de temporada" }, { name: "Mariscos" }],
    },
    architecture: {
      siteType: "restaurant",
      industry: "restaurante",
      objective: "x",
      products: [{ name: "Menu de temporada" }, { name: "Mariscos" }],
      pages: [
        { name: "Inicio", slug: "home", purpose: "x", archetype: "catalog", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "products", blockType: null, purpose: "x" }, { role: "contact", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
      ],
    },
  },
  {
    label: "C) Creative studio (lead/contact)",
    business: {
      name: "Estudio Luz y Forma",
      industry: "agencia creativa",
      objective: "Generar solicitudes de cotización",
      services: [{ name: "Identidad de marca" }, { name: "Fotografia de producto" }],
    },
    architecture: {
      siteType: "agency",
      industry: "agencia creativa",
      objective: "x",
      services: [{ name: "Identidad de marca" }, { name: "Fotografia de producto" }],
      pages: [
        { name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "services", blockType: null, purpose: "x" }, { role: "contact", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
      ],
    },
  },
  {
    label: "D) Ecommerce (catalog/products/contact)",
    business: {
      name: "Tienda Vistamoda",
      industry: "tienda de ropa",
      objective: "Vender en linea",
      products: [{ name: "Coleccion primavera" }, { name: "Accesorios" }],
    },
    architecture: {
      siteType: "ecommerce",
      industry: "tienda de ropa",
      objective: "x",
      products: [{ name: "Coleccion primavera" }, { name: "Accesorios" }],
      pages: [
        { name: "Inicio", slug: "home", purpose: "x", archetype: "catalog", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "products", blockType: null, purpose: "x" }, { role: "contact", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
      ],
    },
  },
  {
    label: "E) SaaS (pricing/contact)",
    business: {
      name: "Launchpro",
      industry: "software",
      objective: "Conseguir suscripciones",
      services: [{ name: "Plan equipo" }, { name: "Plan empresa" }],
    },
    architecture: {
      siteType: "business",
      industry: "software",
      objective: "x",
      services: [{ name: "Plan equipo" }, { name: "Plan empresa" }],
      pages: [
        { name: "Inicio", slug: "home", purpose: "x", archetype: "overview", sections: [{ role: "navigation", blockType: null, purpose: "x" }, { role: "hero", blockType: null, purpose: "x" }, { role: "pricing", blockType: null, purpose: "x" }, { role: "contact", blockType: null, purpose: "x" }, { role: "footer", blockType: null, purpose: "x" }] },
      ],
    },
  },
]

function compositionSummary(nodes: Record<string, { type: string; displayName: string; props?: Record<string, unknown> }>): string[] {
  const markers: string[] = []
  for (const node of Object.values(nodes)) {
    if (node.displayName === "Hero autonomo variante abstract-glow") markers.push("hero:abstract-glow")
    if (typeof node.displayName === "string" && /\((cards|numbered|editorial-list|asymmetric-featured|paired-layout|alternating-rows|compact-matrix)\)$/.test(node.displayName)) {
      markers.push(`layout:${node.displayName.match(/\(([a-z-]+)\)$/)![1]}`)
    }
  }
  return Array.from(new Set(markers))
}

for (const scenario of SCENARIOS) {
  test(`V2-5C diagnostic ${scenario.label}`, async () => {
    const baseRequest = buildCreativeDirectorRequestV1({ business: scenario.business, architecture: scenario.architecture })
    const request = attachDesignReferenceContextV1(baseRequest, scenario.architecture.siteType)

    const gatewayResult = await requestCreativeDirectionV1({
      request,
      provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
      providerKey: "anthropic",
      modelKey: "claude_haiku_4_5",
    })
    assert.equal(gatewayResult.ok, true)
    if (!gatewayResult.ok) return

    const blueprint = compileSiteBlueprint(scenario.architecture, { creativeDirection: gatewayResult.proposal })
    const nodes = blueprint.pages[0].tree.nodes as never

    const referenceIds = (request.referenceContext ?? []).map((r) => r.id)
    const contributionRoles = Array.from(new Set((request.referenceContext ?? []).flatMap((r) => r.relevance.contributionRoles)))
    const decisions = {
      heroTreatment: gatewayResult.proposal.pageDirections[0].heroTreatment,
      processTreatment: gatewayResult.proposal.pageDirections[0].processTreatment,
      twoItemLayoutTreatment: gatewayResult.proposal.pageDirections[0].twoItemLayoutTreatment,
    }
    const summary = compositionSummary(nodes)

    console.log(
      `[V2-5C DIAGNOSTIC] ${scenario.label} :: REFERENCE_IDS=${JSON.stringify(referenceIds)} CONTRIBUTION_ROLES=${JSON.stringify(contributionRoles)} CREATIVE_DECISIONS=${JSON.stringify(decisions)} EXECUTED_COMPOSITION_SUMMARY=${JSON.stringify(summary)}`,
    )

    // No source copy, no URLs, no demo facts anywhere in what was printed/derived.
    assert.equal(/https?:\/\/|@/.test(JSON.stringify({ referenceIds, contributionRoles, decisions, summary })), false)
  })
}

// ---------------------------------------------------------------------------
// O) Diversity: SAME normalized business facts, two valid creative
// directions, materially different bounded compositions, unchanged
// semantic business content.
// ---------------------------------------------------------------------------

test("O) same business facts, two valid creative directions produce materially different bounded compositions", () => {
  const architecture: OrvenixSiteArchitecture = {
    siteType: "health",
    industry: "fisioterapia",
    objective: "x",
    services: [{ name: "Fisioterapia deportiva" }, { name: "Terapia manual" }],
    pages: [
      {
        name: "Inicio",
        slug: "home",
        purpose: "x",
        // "catalog" gives process 3 scaffolded items -- "overview" gives exactly 2, which
        // would instead route through the two-item-layout branch, masking processTreatment.
        archetype: "catalog",
        sections: [
          { role: "navigation", blockType: null, purpose: "x" },
          { role: "hero", blockType: null, purpose: "x" },
          { role: "process", blockType: null, purpose: "x" },
          { role: "footer", blockType: null, purpose: "x" },
        ],
      },
    ],
  }

  const directionA: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", heroTreatment: "abstract-glow", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" }],
  }
  const directionB: CreativeSiteDirectionV1 = {
    version: 1, roleKey: "creative_director_v1", strategyKey: "site_narrative_v1", siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", heroTreatment: "standard", processTreatment: "cards", sectionToneStrategy: "contrast-led" }],
  }

  const blueprintA = compileSiteBlueprint(architecture, { creativeDirection: directionA })
  const blueprintB = compileSiteBlueprint(architecture, { creativeDirection: directionB })

  const summaryA = compositionSummary(blueprintA.pages[0].tree.nodes as never)
  const summaryB = compositionSummary(blueprintB.pages[0].tree.nodes as never)

  console.log(`[V2-5C DIAGNOSTIC O] DIRECTION_A=${JSON.stringify(summaryA)} DIRECTION_B=${JSON.stringify(summaryB)}`)

  assert.ok(summaryA.includes("hero:abstract-glow"))
  assert.ok(!summaryB.includes("hero:abstract-glow"))
  assert.ok(summaryA.includes("layout:numbered"))
  assert.ok(summaryB.includes("layout:cards"))

  // Semantic business content (real service names) unchanged between the two.
  const namesA = Object.values(blueprintA.pages[0].tree.nodes).filter((n) => n.type === "heading" && n.props?.level === 3).map((n) => n.props?.text).sort()
  const namesB = Object.values(blueprintB.pages[0].tree.nodes).filter((n) => n.type === "heading" && n.props?.level === 3).map((n) => n.props?.text).sort()
  assert.deepEqual(namesA, namesB)
})
