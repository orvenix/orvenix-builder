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
  selectGroundedItems,
  type SectionInstancePlan,
} from "../../lib/orvenix-ai/architect/composition-plan"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { SECTION_INSTANCE_VISUAL_PRIMITIVES } from "../../lib/orvenix-ai/composer/composition-context"
import type { ComposedNode, ComposedSection, SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"
import type { OrvenixSiteArchitecture, OrvenixSitePagePlan } from "../../lib/orvenix-ai/architect/site-architect"
import type { EditorNode } from "../../types/editor"

const SERVICES = [
  { name: "Identidad visual", description: "DEV FIXTURE: sistemas de marca completos." },
  { name: "Diseno web", description: "DEV FIXTURE: sitios web editables y rapidos." },
  { name: "Direccion creativa", description: "DEV FIXTURE: acompanamiento creativo integral." },
]

function allClassNames(section: ComposedSection): string[] {
  return Object.values(section.nodes)
    .map((n) => n.props?.className)
    .filter((v): v is string => typeof v === "string")
}

function allTexts(section: ComposedSection): string[] {
  return Object.values(section.nodes)
    .map((n) => (typeof n.props?.text === "string" ? n.props.text : typeof n.props?.content === "string" ? n.props.content : ""))
    .filter(Boolean)
}

function findByDisplayNameSuffix(section: ComposedSection, suffix: string): ComposedNode | undefined {
  return Object.values(section.nodes).find((n) => n.displayName.endsWith(suffix))
}

function childDisplayNames(section: ComposedSection, node: ComposedNode | undefined): string[] {
  if (!node) return []
  return node.children.map((childTempId) => section.nodes[childTempId]?.displayName ?? "?")
}

function servicesInstance(id: string, itemIndex: number, extra: SectionInstancePlan["composition"] = {}): SectionInstancePlan {
  return {
    id,
    role: "services",
    selection: { mode: "single-item", itemIndex },
    composition: extra,
    provenance: "deterministic",
  }
}

// --- 1) primitive identifier is bounded ---

test("1) the visual primitive identifier is a closed, bounded set", () => {
  assert.deepEqual([...SECTION_INSTANCE_VISUAL_PRIMITIVES].sort(), [
    "dramatic-closing",
    "editorial-split",
    "full-bleed-media",
    "oversized-typography",
    "standard",
  ])
  const plan = servicesInstance("s0", 0, { visualPrimitive: "editorial-split" })
  assert.ok(isValidSectionInstancePlan(plan))
  const invalid = { ...plan, composition: { visualPrimitive: "totally-made-up" } }
  assert.equal(isValidSectionInstancePlan(invalid), false)
})

// --- 2) unknown primitive cannot inject arbitrary rendering ---

test("2) an unrecognized visualPrimitive never reaches the composer and never changes rendering", () => {
  const base: SectionCompositionContext = { services: SERVICES }
  const maliciousPlan = {
    id: "s0",
    role: "services",
    selection: { mode: "single-item", itemIndex: 0 },
    // Simulates untrusted/dynamic input reaching the compiler directly, bypassing the TS union.
    composition: { visualPrimitive: "<script>alert(1)</script>" },
    provenance: "deterministic",
  } as unknown as SectionInstancePlan
  const context = applySectionInstanceToContext(base, maliciousPlan)
  assert.equal(context.instanceVisualPrimitive, undefined)

  const composed = composeSection("services", context)
  assert.ok(composed)
  // Falls through to the ordinary single-item card rendering -- no split/oversized/full-bleed/dramatic markers.
  const displayNames = Object.values(composed!.nodes).map((n) => n.displayName)
  assert.ok(!displayNames.some((name) => /split|oversized-typography|full-bleed-media|dramatic-closing/.test(name)))
})

// --- 3) editorial-split single service contains only selected item ---

test("3) editorial-split renders only the selected real service, never the others", () => {
  const base: SectionCompositionContext = { services: SERVICES }
  const plan = servicesInstance("s1", 1, { visualPrimitive: "editorial-split", alignment: "left" })
  const context = applySectionInstanceToContext(base, plan)
  const composed = composeSection("services", context)
  assert.ok(composed)

  const texts = allTexts(composed!).join(" | ")
  assert.ok(texts.includes("Diseno web"))
  assert.ok(!texts.includes("Identidad visual"))
  assert.ok(!texts.includes("Direccion creativa"))
})

// --- 4) mirrored editorial split produces materially different layout metadata/tree ---

test("4) alignment left vs right produces a materially different child order in the real tree, not just text-align", () => {
  const base: SectionCompositionContext = { services: SERVICES }

  const leftContext = applySectionInstanceToContext(base, servicesInstance("s0-left", 0, { visualPrimitive: "editorial-split", alignment: "left" }))
  const rightContext = applySectionInstanceToContext(base, servicesInstance("s0-right", 0, { visualPrimitive: "editorial-split", alignment: "right" }))

  const leftComposed = composeSection("services", leftContext)!
  const rightComposed = composeSection("services", rightContext)!

  const leftSplit = findByDisplayNameSuffix(leftComposed, " split")
  const rightSplit = findByDisplayNameSuffix(rightComposed, " split")
  assert.ok(leftSplit && rightSplit)

  const leftOrder = childDisplayNames(leftComposed, leftSplit)
  const rightOrder = childDisplayNames(rightComposed, rightSplit)

  assert.equal(leftOrder.length, 2)
  assert.equal(rightOrder.length, 2)
  // The text block and the media/graphic block swap DOM positions -- a real order difference, not a CSS-only mirror.
  assert.ok(leftOrder[0].endsWith("bloque texto"))
  assert.ok(rightOrder[1].endsWith("bloque texto"))
  assert.notDeepEqual(leftOrder, rightOrder)
})

// --- 5) oversized typography does not emit card-grid structure ---

test("5) oversized-typography emits no card/grid wrapper classes at all", () => {
  const base: SectionCompositionContext = { services: SERVICES }
  const plan = servicesInstance("s2", 2, { visualPrimitive: "oversized-typography", scale: "condensed" })
  const context = applySectionInstanceToContext(base, plan)
  const composed = composeSection("services", context)!

  const classNames = allClassNames(composed).join(" ")
  assert.ok(!/grid-cols|\bgrid\b/.test(classNames))
  assert.ok(!/rounded-/.test(classNames))
  assert.ok(!/border/.test(classNames))

  const heading = Object.values(composed.nodes).find((n) => n.type === "heading")
  assert.ok(heading)
  assert.ok(["6xl", "7xl"].includes(String(heading!.props.size)))
})

// --- 6) typography opening can omit image and CTA ---

test("6) the typographic hero opening renders with zero image nodes and zero CTA buttons when instructed", () => {
  const context: SectionCompositionContext = {
    businessName: "Estudio Fixture",
    instanceVisualPrimitive: "oversized-typography",
    instanceOmitCta: true,
  }
  const composed = composeSection("hero", context)!
  const nodeTypes = Object.values(composed.nodes).map((n) => n.type)
  assert.equal(nodeTypes.filter((t) => t === "image").length, 0)
  assert.equal(nodeTypes.filter((t) => t === "ctaButton").length, 0)

  const heading = Object.values(composed.nodes).find((n) => n.type === "heading")
  assert.equal(heading?.props.size, "7xl")
})

// --- 7) full-bleed media uses grounded asset ---

test("7) full-bleed-media renders the real, grounded asset src verbatim and reaches the viewport edge", () => {
  const context: SectionCompositionContext = {
    instanceVisualPrimitive: "full-bleed-media",
    resolvedGalleryAssets: [{ src: "/local-fixture/portfolio-1.jpg", alt: "Trabajo real" }],
  }
  const composed = composeSection("gallery", context)!
  const image = Object.values(composed.nodes).find((n) => n.type === "image")
  assert.equal(image?.props.src, "/local-fixture/portfolio-1.jpg")

  const root = composed.nodes[composed.rootId]
  assert.equal(root.props.maxWidth, "full")
  assert.equal(root.props.paddingX, "none")
})

// --- 8) missing media falls back safely ---

test("8) full-bleed-media with no usable asset falls back to the ordinary safe gallery grid, never a fabricated image", () => {
  const context: SectionCompositionContext = { instanceVisualPrimitive: "full-bleed-media" }
  const composed = composeSection("gallery", context)!
  const root = composed.nodes[composed.rootId]
  assert.notEqual(root.props.maxWidth, "full")
  assert.notEqual(root.displayName, "Galeria (full-bleed-media)")

  const images = Object.values(composed.nodes).filter((n) => n.type === "image")
  assert.ok(images.length > 0)
  for (const image of images) assert.equal(image.props.src, "")
})

// --- 9) dramatic closing does not invent contact evidence ---

test("9) dramatic-closing never invents contact details -- real evidence renders verbatim, absent evidence keeps the existing safe placeholder", () => {
  const withRealEvidence = composeSection("contact", {
    instanceVisualPrimitive: "dramatic-closing",
    businessEvidence: { contact: { whatsapp: "+52 81 3333 4444" } } as SectionCompositionContext["businessEvidence"],
  })!
  const realTexts = allTexts(withRealEvidence).join(" | ")
  assert.ok(realTexts.includes("+52 81 3333 4444"))
  assert.ok(!/\+52 000 000 0000/.test(realTexts))

  const withoutEvidence = composeSection("contact", { instanceVisualPrimitive: "dramatic-closing" })!
  const fallbackTexts = allTexts(withoutEvidence).join(" | ")
  assert.ok(fallbackTexts.includes("+52 000 000 0000"))
})

// --- 10) legacy plan remains unchanged ---

test("10) a legacy section with no `instance` (and therefore no visualPrimitive) renders byte-identical to pre-V2-6.2 output", () => {
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
      } satisfies OrvenixSitePagePlan,
    ],
  }
  const compiled = compileSiteBlueprint(architecture)
  const classNames = Object.values(compiled.pages[0].tree.nodes)
    .map((n: EditorNode) => n.props?.className)
    .filter((v): v is string => typeof v === "string")
    .join(" ")
  assert.ok(classNames.length > 0)
  const headingSizes = Object.values(compiled.pages[0].tree.nodes)
    .filter((n: EditorNode) => n.type === "heading")
    .map((n: EditorNode) => n.props?.size)
  assert.ok(!headingSizes.includes("6xl") && !headingSizes.includes("7xl"))
})

// --- 11) CompositionPlan deterministic ---

test("11) the same visualPrimitive-bearing CompositionPlan compiles to identical structure across repeated runs", () => {
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
          { role: "hero", blockType: null, purpose: "apertura", instance: { id: "opening", role: "hero", selection: { mode: "all" }, composition: { visualPrimitive: "oversized-typography" }, provenance: "deterministic" } },
          ...[0, 1, 2].map((index) => ({
            role: "services" as const,
            blockType: null,
            purpose: `servicio ${index}`,
            instance: servicesInstance(`svc-${index}`, index, { visualPrimitive: index === 2 ? "oversized-typography" : "editorial-split", alignment: index === 0 ? "left" : "right" }),
          })),
        ],
      } satisfies OrvenixSitePagePlan,
    ],
  }
  const first = compileSiteBlueprint(architecture)
  const second = compileSiteBlueprint(architecture)
  const summarize = (nodes: Record<string, EditorNode>) => Object.values(nodes).map((n) => `${n.type}:${n.displayName}`).sort()
  assert.deepEqual(summarize(first.pages[0].tree.nodes), summarize(second.pages[0].tree.nodes))
})

// --- 12) per-instance context remains isolated ---

test("12) instanceVisualPrimitive never leaks across sibling instances or back into the base context", () => {
  const base: SectionCompositionContext = { services: SERVICES }
  const splitContext = applySectionInstanceToContext(base, servicesInstance("a", 0, { visualPrimitive: "editorial-split" }))
  const typographyContext = applySectionInstanceToContext(base, servicesInstance("b", 1, { visualPrimitive: "oversized-typography" }))

  assert.equal(splitContext.instanceVisualPrimitive, "editorial-split")
  assert.equal(typographyContext.instanceVisualPrimitive, "oversized-typography")
  assert.equal(base.instanceVisualPrimitive, undefined)

  // Selection isolation still holds (V2-6.1 guarantee) alongside the new primitive field.
  assert.deepEqual(splitContext.services, [SERVICES[0]])
  assert.deepEqual(typographyContext.services, [SERVICES[1]])
})

// Sanity: selectGroundedItems import stays exercised so tsc never flags it unused across refactors.
test("sanity) selectGroundedItems still behaves for a trivial case", () => {
  assert.deepEqual(selectGroundedItems(SERVICES, { mode: "single-item", itemIndex: 0 }), [SERVICES[0]])
})
