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
  isValidSectionInstancePlan,
  legacyArchitectureToCompositionPlan,
  legacyPageToCompositionPlan,
  selectGroundedItems,
  type SectionInstancePlan,
} from "../../lib/orvenix-ai/architect/composition-plan"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture, OrvenixSitePagePlan, OrvenixSiteSectionPlan } from "../../lib/orvenix-ai/architect/site-architect"
import type { SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import type { EditorNode } from "../../types/editor"

const SERVICES = [
  { name: "Identidad visual", description: "DEV FIXTURE: sistemas de marca completos." },
  { name: "Diseno web", description: "DEV FIXTURE: sitios web editables y rapidos." },
  { name: "Direccion creativa", description: "DEV FIXTURE: acompanamiento creativo integral." },
]

function baseContext(): SectionCompositionContext {
  return { services: SERVICES, products: [{ name: "Producto A" }] }
}

function serviceInstance(index: number, id = `services-${index}`): SectionInstancePlan {
  return {
    id,
    role: "services",
    selection: { mode: "single-item", itemIndex: index },
    composition: { treatment: "featured-asymmetric", alignment: index % 2 === 0 ? "left" : "right", scale: "large" },
    provenance: "deterministic",
  }
}

// --- 1) legacy role adapter preserves existing behavior ---

test("1) legacy role adapter preserves existing behavior: one all-mode deterministic instance per existing section, same order", () => {
  const legacyPage = { slug: "home", sections: [{ role: "hero" as const }, { role: "services" as const }, { role: "cta" as const }] }
  const plan = legacyPageToCompositionPlan(legacyPage)

  assert.equal(plan.slug, "home")
  assert.equal(plan.instances.length, 3)
  assert.deepEqual(plan.instances.map((i) => i.role), ["hero", "services", "cta"])
  for (const instance of plan.instances) {
    assert.equal(instance.selection.mode, "all")
    assert.equal(instance.provenance, "deterministic")
    assert.ok(isValidSectionInstancePlan(instance))
  }

  const sitePlan = legacyArchitectureToCompositionPlan([legacyPage])
  assert.equal(sitePlan.version, 1)
  assert.deepEqual(sitePlan.pages[0], plan)
})

// --- 2) same role can occur multiple times ---

test("2) the same role can occur multiple times in one page's instance list", () => {
  const instances = [serviceInstance(0), serviceInstance(1), serviceInstance(2)]
  assert.equal(instances.filter((i) => i.role === "services").length, 3)
  const ids = new Set(instances.map((i) => i.id))
  assert.equal(ids.size, 3)
})

// --- 3) single-item selection isolates exactly one item ---

test("3) single-item selection isolates exactly one real item, never the full collection", () => {
  const selected = selectGroundedItems(SERVICES, { mode: "single-item", itemIndex: 1 })
  assert.deepEqual(selected, [SERVICES[1]])
  assert.equal(selected.length, 1)
})

// --- 4) subset selection isolates requested real items ---

test("4) subset selection isolates exactly the requested real items, in request order, deduplicated", () => {
  const selected = selectGroundedItems(SERVICES, { mode: "subset", indexes: [2, 0, 2] })
  assert.deepEqual(selected, [SERVICES[2], SERVICES[0]])
})

// --- 5) out-of-range selection fails safely ---

test("5) out-of-range selection fails safely instead of throwing or inventing an item", () => {
  assert.deepEqual(selectGroundedItems(SERVICES, { mode: "single-item", itemIndex: 99 }), [])
  assert.deepEqual(selectGroundedItems(SERVICES, { mode: "single-item", itemIndex: -1 }), [])
  assert.deepEqual(selectGroundedItems(SERVICES, { mode: "subset", indexes: [99, -3, 1] }), [SERVICES[1]])
})

// --- 6) empty source fails safely ---

test("6) an empty or missing source collection fails safely to an empty result", () => {
  assert.deepEqual(selectGroundedItems([], { mode: "all" }), [])
  assert.deepEqual(selectGroundedItems(undefined, { mode: "single-item", itemIndex: 0 }), [])
  assert.deepEqual(selectGroundedItems(undefined, { mode: "subset", indexes: [0, 1] }), [])
})

// --- 7) no accidental cross-instance context mutation ---

test("7) applySectionInstanceToContext never mutates the base context or its arrays", () => {
  const base = baseContext()
  const originalServices = base.services
  const sliced = applySectionInstanceToContext(base, serviceInstance(1))

  assert.notEqual(sliced, base)
  assert.equal(base.services, originalServices)
  assert.deepEqual(base.services, SERVICES)
  assert.deepEqual(sliced.services, [SERVICES[1]])

  // A second instance derived from the SAME base still sees the full source.
  const slicedAgain = applySectionInstanceToContext(base, serviceInstance(2))
  assert.deepEqual(slicedAgain.services, [SERVICES[2]])
  assert.deepEqual(base.services, SERVICES)
})

// --- 8) three service instances can select 0/1/2 independently ---

test("8) three sibling services instances each isolate exactly one distinct real item", () => {
  const base = baseContext()
  const contexts = [0, 1, 2].map((index) => applySectionInstanceToContext(base, serviceInstance(index)))

  assert.deepEqual(contexts[0].services, [SERVICES[0]])
  assert.deepEqual(contexts[1].services, [SERVICES[1]])
  assert.deepEqual(contexts[2].services, [SERVICES[2]])
  // None contains all 3, and none contains another instance's item.
  for (const [index, context] of contexts.entries()) {
    assert.equal(context.services?.length, 1)
    assert.equal(context.services?.[0].name, SERVICES[index].name)
  }
})

// --- 9) composition directives are bounded ---

test("9) composition directives are bounded: an unrecognized enum value is rejected by the validator", () => {
  const valid: SectionInstancePlan = serviceInstance(0)
  assert.ok(isValidSectionInstancePlan(valid))

  const invalidTreatment = { ...valid, composition: { treatment: "totally-made-up" } }
  assert.equal(isValidSectionInstancePlan(invalidTreatment), false)

  const invalidAlignment = { ...valid, composition: { alignment: "center" } }
  assert.equal(isValidSectionInstancePlan(invalidAlignment), false)

  const invalidScale = { ...valid, composition: { scale: "huge" } }
  assert.equal(isValidSectionInstancePlan(invalidScale), false)

  const invalidMode = { ...valid, selection: { mode: "everything" } }
  assert.equal(isValidSectionInstancePlan(invalidMode), false)

  const invalidProvenance = { ...valid, provenance: "made-up" }
  assert.equal(isValidSectionInstancePlan(invalidProvenance), false)
})

// --- 10) arbitrary CSS/HTML/component injection impossible by contract ---

test("10) arbitrary CSS/className/HTML/component-name injection is impossible through the contract", () => {
  const attempt1 = {
    id: "x",
    role: "services",
    selection: { mode: "all" },
    composition: { className: "evil-class", style: "color:red" },
    provenance: "deterministic",
  }
  assert.equal(isValidSectionInstancePlan(attempt1), false)

  const attempt2 = {
    id: "x",
    role: "services",
    selection: { mode: "all" },
    provenance: "deterministic",
    componentOverride: "<script>alert(1)</script>",
  }
  assert.equal(isValidSectionInstancePlan(attempt2), false)

  const attempt3 = {
    id: "x",
    role: "services",
    selection: { mode: "all", rawHtml: "<div>injected</div>" },
    provenance: "deterministic",
  }
  assert.equal(isValidSectionInstancePlan(attempt3), false)
})

// --- 11) deterministic output ---

test("11) the same CompositionPlan compiles to byte-identical section counts/structure across repeated runs", () => {
  const architecture: OrvenixSiteArchitecture = {
    siteType: "creative",
    industry: "diseno",
    objective: "mostrar servicios",
    businessName: "Estudio Fixture",
    services: SERVICES,
    pages: [
      {
        name: "Inicio",
        slug: "home",
        purpose: "presentar",
        archetype: "overview",
        sections: [
          { role: "navigation", blockType: null, purpose: "nav" },
          ...[0, 1, 2].map((index): OrvenixSiteSectionPlan => ({
            role: "services",
            blockType: null,
            purpose: `servicio ${index}`,
            instance: serviceInstance(index),
          })),
          { role: "cta", blockType: null, purpose: "cerrar" },
          { role: "footer", blockType: null, purpose: "footer" },
        ],
      } satisfies OrvenixSitePagePlan,
    ],
  }

  const first = compileSiteBlueprint(architecture)
  const second = compileSiteBlueprint(architecture)

  const summarize = (nodes: Record<string, EditorNode>) =>
    Object.values(nodes)
      .map((node) => node.type)
      .sort()

  assert.deepEqual(summarize(first.pages[0].tree.nodes), summarize(second.pages[0].tree.nodes))
  assert.equal(Object.keys(first.pages[0].tree.nodes).length, Object.keys(second.pages[0].tree.nodes).length)

  // Every section composes (none returns null): navigation + 3 services instances + cta + footer.
  const root = first.pages[0].tree.nodes[first.pages[0].tree.rootId]
  assert.equal(root.children.length, 6)
})

// --- 12) backward compatibility: sections without `instance` behave exactly as before ---

test("12) a section with no `instance` field composes against the full, unsliced business context (unchanged legacy behavior)", () => {
  const architecture: OrvenixSiteArchitecture = {
    siteType: "creative",
    industry: "diseno",
    objective: "mostrar servicios",
    businessName: "Estudio Fixture",
    services: SERVICES,
    pages: [
      {
        name: "Inicio",
        slug: "home",
        purpose: "presentar",
        archetype: "catalog",
        sections: [{ role: "services", blockType: null, purpose: "servicios" }],
      },
    ],
  }

  const compiled = compileSiteBlueprint(architecture)
  const allText = Object.values(compiled.pages[0].tree.nodes)
    .map((n) => String(n.props.text ?? n.props.content ?? ""))
    .join(" | ")
  // Legacy (non-instance) services section renders from the FULL services array -- every real service name should be present somewhere.
  for (const service of SERVICES) {
    assert.ok(allText.includes(service.name), `expected legacy services section to include "${service.name}"`)
  }
})
