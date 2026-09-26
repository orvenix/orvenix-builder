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
  type SectionInstancePlan,
} from "../../lib/orvenix-ai/architect/composition-plan"
import { applySectionInstanceToContext } from "../../lib/orvenix-ai/compiler/section-instance-context"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { VISUAL_LAYOUT_KINDS, visualPrimitiveToLayout } from "../../lib/orvenix-ai/composer/visual-layout-plan"
import type { ComposedNode, ComposedSection, SectionCompositionContext } from "../../lib/orvenix-ai/composer/types"

const SERVICES = [
  { name: "Identidad visual", description: "Sistemas de marca completos." },
  { name: "Diseno web", description: "Sitios web editables y rapidos." },
  { name: "Direccion creativa", description: "Acompanamiento creativo integral." },
]

const SITE_PAGES = [
  { name: "Inicio", slug: "home", isHome: true },
  { name: "Servicios", slug: "servicios" },
  { name: "Contacto", slug: "contacto" },
]

function sectionTexts(section: ComposedSection): string {
  return Object.values(section.nodes)
    .map((n) => (typeof n.props?.text === "string" ? n.props.text : typeof n.props?.content === "string" ? n.props.content : ""))
    .filter(Boolean)
    .join(" | ")
}

function classNames(section: ComposedSection): string {
  return Object.values(section.nodes)
    .map((n) => n.props?.className)
    .filter((v): v is string => typeof v === "string")
    .join(" ")
}

function findByDisplayNameSuffix(section: ComposedSection, suffix: string): ComposedNode | undefined {
  return Object.values(section.nodes).find((n) => n.displayName.endsWith(suffix))
}

function childDisplayNames(section: ComposedSection, node: ComposedNode | undefined): string[] {
  if (!node) return []
  return node.children.map((childTempId) => section.nodes[childTempId]?.displayName ?? "?")
}

function instance(role: SectionInstancePlan["role"], id: string, composition: SectionInstancePlan["composition"] = {}, selection: SectionInstancePlan["selection"] = { mode: "all" }): SectionInstancePlan {
  return { id, role, selection, composition, provenance: "deterministic" }
}

function composeFromInstance(base: SectionCompositionContext, plan: SectionInstancePlan): ComposedSection {
  const ctx = applySectionInstanceToContext(base, plan)
  const section = composeSection(plan.role, ctx)
  assert.ok(section)
  return section
}

function navProps(layout: SectionInstancePlan["composition"]): Record<string, unknown> {
  const section = composeFromInstance({ sitePages: SITE_PAGES }, instance("navigation", "nav", layout))
  return section.nodes[section.rootId].props as Record<string, unknown>
}

function signature(section: ComposedSection): string {
  const root = section.nodes[section.rootId]
  return JSON.stringify({
    rootType: root.type,
    rootDisplayName: root.displayName,
    rootProps: root.props,
    nodeCount: Object.keys(section.nodes).length,
    displayNames: Object.values(section.nodes).map((node) => node.displayName),
    classes: classNames(section),
  })
}

test("VisualLayoutPlan V1 exposes a closed executable vocabulary", () => {
  assert.deepEqual([...VISUAL_LAYOUT_KINDS].sort(), [
    "card-grid",
    "dramatic-closing",
    "editorial-passage",
    "editorial-split",
    "full-bleed-media",
    "mirror-split",
    "navigation-centered-editorial",
    "navigation-classic",
    "navigation-overlay",
    "navigation-split",
    "oversized-typography",
    "standard",
  ])

  assert.ok(isValidSectionInstancePlan(instance("services", "svc", { layout: { kind: "editorial-split" } }, { mode: "single-item", itemIndex: 0 })))
  assert.equal(isValidSectionInstancePlan(instance("services", "bad", { layout: { kind: "freeform", className: "fixed inset-0" } as unknown as SectionInstancePlan["composition"]["layout"] })), false)
  assert.equal(isValidSectionInstancePlan(instance("navigation", "bad-nav", { layout: { kind: "full-bleed-media" } })), false)
})

test("legacy visualPrimitive maps into VisualLayoutPlan without changing the old entrypoint", () => {
  assert.deepEqual(visualPrimitiveToLayout("editorial-split", "right"), { kind: "editorial-split", mirror: true })
  const ctx = applySectionInstanceToContext(
    { services: SERVICES },
    instance("services", "legacy", { visualPrimitive: "editorial-split", alignment: "right" }, { mode: "single-item", itemIndex: 0 }),
  )
  assert.deepEqual(ctx.instanceVisualLayout, { kind: "editorial-split", mirror: true })
  assert.equal(ctx.instanceVisualPrimitive, "editorial-split")
})

test("conventional services layout stays a card/grid while editorial layout becomes an independent passage", () => {
  const conventional = composeFromInstance({ services: SERVICES }, instance("services", "all", { layout: { kind: "card-grid" } }))
  assert.match(classNames(conventional), /grid|rounded|border/)

  const editorial = composeFromInstance(
    { services: SERVICES },
    instance("services", "one", { layout: { kind: "editorial-split" } }, { mode: "single-item", itemIndex: 1 }),
  )
  const texts = sectionTexts(editorial)
  assert.match(texts, /Diseno web/)
  assert.doesNotMatch(texts, /Identidad visual/)
  assert.doesNotMatch(texts, /Direccion creativa/)
  assert.ok(findByDisplayNameSuffix(editorial, " split"))
})

test("mirror-split reverses the real child order of the editorial passage", () => {
  const left = composeFromInstance(
    { services: SERVICES },
    instance("services", "left", { layout: { kind: "editorial-split" } }, { mode: "single-item", itemIndex: 0 }),
  )
  const mirrored = composeFromInstance(
    { services: SERVICES },
    instance("services", "mirror", { layout: { kind: "mirror-split" } }, { mode: "single-item", itemIndex: 0 }),
  )
  const leftOrder = childDisplayNames(left, findByDisplayNameSuffix(left, " split"))
  const mirrorOrder = childDisplayNames(mirrored, findByDisplayNameSuffix(mirrored, " split"))
  assert.equal(leftOrder.length, 2)
  assert.equal(mirrorOrder.length, 2)
  assert.ok(leftOrder[0].endsWith("bloque texto"))
  assert.ok(mirrorOrder[1].endsWith("bloque texto"))
  assert.notDeepEqual(leftOrder, mirrorOrder)
})

test("typographic opening, full-bleed media, and dramatic closing execute through layout", () => {
  const hero = composeFromInstance(
    { businessName: "Estudio Orvenix" },
    instance("hero", "opening", { layout: { kind: "oversized-typography", rhythm: "spacious" }, emphasis: "opening" }),
  )
  assert.equal(Object.values(hero.nodes).filter((n) => n.type === "image").length, 0)
  assert.equal(Object.values(hero.nodes).filter((n) => n.type === "ctaButton").length, 0)
  assert.equal(Object.values(hero.nodes).find((n) => n.type === "heading")?.props.size, "7xl")

  const gallery = composeFromInstance(
    { resolvedGalleryAssets: [{ src: "/img/logo-main.png", alt: "Activo visual" }] },
    instance("gallery", "portfolio", { layout: { kind: "full-bleed-media" } }),
  )
  assert.equal(gallery.nodes[gallery.rootId].props.maxWidth, "full")
  assert.equal(Object.values(gallery.nodes).find((n) => n.type === "image")?.props.src, "/img/logo-main.png")

  const contact = composeFromInstance({}, instance("contact", "closing", { layout: { kind: "dramatic-closing" } }))
  assert.equal(contact.nodes[contact.rootId].props.background, "#0A3E57")
  assert.equal(contact.nodes[contact.rootId].props.maxWidth, "full")
})

test("navigation layouts produce materially different siteNav props without changing canonical routes", () => {
  const classic = navProps({ layout: { kind: "navigation-classic" } })
  const editorial = navProps({ layout: { kind: "navigation-centered-editorial" } })
  const split = navProps({ layout: { kind: "navigation-split" } })
  const overlay = navProps({ layout: { kind: "navigation-overlay" }, treatment: "standard" })

  assert.equal(classic.navLayout, "classic")
  assert.equal(editorial.navLayout, "centered-editorial")
  assert.equal(split.navLayout, "split")
  assert.equal(overlay.navLayout, "overlay")
  assert.equal(editorial.chrome, "integrated")
  assert.equal(split.justify, "end")
  assert.equal(overlay.surfaceStyle, "glass")
  assert.notDeepEqual(classic, editorial)
  assert.notDeepEqual(editorial, split)
  assert.deepEqual(classic.pages, editorial.pages)
  assert.deepEqual(classic.pages, split.pages)
  assert.deepEqual(classic.pages, overlay.pages)
})

test("SiteNav keeps one canonical desktop/mobile link source while adding layout shells", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/editor/primitives/SiteNav.tsx"), "utf8")
  assert.equal((source.match(/const linkDescriptors = navPages\.map/g) ?? []).length, 1)
  assert.equal((source.match(/linkDescriptors\.map\(/g) ?? []).length, 2)
  assert.match(source, /navLayout\?: "classic" \| "centered-editorial" \| "split" \| "overlay"/)
  assert.match(source, /orvenix-premium-site-nav--\$\{navLayout\}/)
})

test("same facts can generate conventional and editorial signatures with no fake content", () => {
  const base: SectionCompositionContext = { services: SERVICES, sitePages: SITE_PAGES, businessName: "Estudio Horizonte" }
  const designASections = [
    composeFromInstance(base, instance("navigation", "nav-a", { layout: { kind: "navigation-classic" } })),
    composeFromInstance(base, instance("services", "services-a", { layout: { kind: "card-grid" } })),
  ]
  const designBSections = [
    composeFromInstance(base, instance("navigation", "nav-b", { layout: { kind: "navigation-centered-editorial" } })),
    composeFromInstance(base, instance("services", "service-b1", { layout: { kind: "editorial-split" } }, { mode: "single-item", itemIndex: 0 })),
    composeFromInstance(base, instance("services", "service-b2", { layout: { kind: "mirror-split" } }, { mode: "single-item", itemIndex: 1 })),
    composeFromInstance(base, instance("services", "service-b3", { layout: { kind: "editorial-passage", rhythm: "compact" } }, { mode: "single-item", itemIndex: 2 })),
  ]

  const signatureA = designASections.map(signature).join("\n")
  const signatureB = designBSections.map(signature).join("\n")
  assert.notEqual(signatureA, signatureB)
  for (const service of SERVICES) assert.match(`${signatureA}\n${signatureB}`, new RegExp(service.name))
  assert.doesNotMatch(`${signatureA}\n${signatureB}`, /Lorem|fake|placeholder service/i)
})
