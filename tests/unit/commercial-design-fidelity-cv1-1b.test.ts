import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  COMMERCIAL_DEMO_ASSET_PREFIX_V1,
  COMMERCIAL_DESIGN_REGISTRY_V1,
  COMMERCIAL_EMPTY_PAGE_PROP_V1,
  COMMERCIAL_EMPTY_SECTION_PROP_V1,
  COMMERCIAL_EMPTY_TEXT_V1,
  DEMO_FACTS_INPUT_BY_DESIGN_V1,
  commercialComposedStructureV1,
  compileCommercialDesignV1,
  getCommercialDesignV1,
  getDemoFactsV1,
  isCommercialEmptyNodeV1,
  isHiddenCommercialPageV1,
  resolveCommercialDesignV1,
  stripCommercialEmptyStatesV1,
  validateCommercialDesignV1,
  type BusinessFactsInputV1,
  type CommercialCompileResultV1,
  type CommercialDesignV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { CONSTRUCTION_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/construction"
import { SERVICIOS_LOCALES_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/servicios-locales"
import { SERVICIOS_LOCALES_V2 } from "../../lib/orvenix-ai/commercial-designs/designs/servicios-locales-v2"
import { validateSiteCreationPlanV2, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { inferVisualFamily } from "../../lib/orvenix-ai/theme/visual-direction"
import { REAL_TEMPLATES } from "../../lib/realTemplates"
import { getCommercialTemplateStart } from "../../lib/commercial/template-start"
import { validateTree } from "../../types/validateTree"
import type { EditorTree } from "../../types/editor"

type ModuleWithLoad = { _load: (...args: unknown[]) => unknown }

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Every registered design that promises demo-shape fidelity -- the gate covers ALL of them. */
const FIDELITY_DESIGNS: CommercialDesignV1[] = Object.values(COMMERCIAL_DESIGN_REGISTRY_V1).filter((design) => design.composition?.fidelity === "demo-shape")

const DANGEROUS_WORDS = ["diseño", "cocina", "clínica", "hotel", "tienda"]

/** Customer cases: the structure must equal the demo's for every one of them. */
function customerCases(): Array<[string, BusinessFactsInputV1]> {
  return [
    ["minimal (name + phone)", { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } }],
    ["start form", { businessName: "Plomería Hernández", contact: { whatsapp: "8112345678" }, services: [{ name: "Fugas" }, { name: "Boilers" }], location: "Monterrey", serviceArea: ["San Pedro"] }],
    ...DANGEROUS_WORDS.map((word, index): [string, BusinessFactsInputV1] => [`dangerous "${word}"`, {
      businessName: `Negocio ${word}`,
      tagline: `Expertos en ${word}`,
      description: `Somos especialistas en ${word}; ${word} de calidad para tu ${word}.`,
      contact: { whatsapp: `811234567${index}`, email: "hola@negocio.example" },
      hours: "Lunes a viernes 9 a 18",
      serviceArea: ["Centro", "Norte"],
      services: [
        { name: `${word} básico`, description: `Servicio de ${word}.`, priceLabel: "Desde $500" },
        { name: `${word} premium`, description: `Más ${word}.` },
        { name: "Mantenimiento", description: "Revisión." },
        { name: "Asesoría", description: "Orientación." },
      ],
      faq: [{ question: `¿Hacen ${word}?`, answer: "Sí." }],
    }]),
    ["six services", { businessName: "Seis", contact: { whatsapp: "8112345678" }, services: Array.from({ length: 6 }, (_, index) => ({ name: `Servicio ${index + 1}`, description: "Detalle." })) }],
    ["more services than the demo (capped)", { businessName: "Muchos", contact: { whatsapp: "8112345678" }, services: Array.from({ length: 9 }, (_, index) => ({ name: `Servicio ${index + 1}` })) }],
  ]
}

const compiled = new Map<string, Promise<CommercialCompileResultV1>>()
function compile(designId: string, version: number, facts?: BusinessFactsInputV1): Promise<CommercialCompileResultV1> {
  const key = `${designId}@${version}:${facts ? JSON.stringify(facts) : "demo"}`
  if (!compiled.has(key)) {
    compiled.set(key, facts
      ? compileCommercialDesignV1({ mode: "customer", designId, version, facts })
      : compileCommercialDesignV1({ mode: "demo", designId, version }))
  }
  return compiled.get(key)!
}

function demoStrings(designId: string): string[] {
  const values: string[] = []
  const visit = (value: unknown) => {
    if (typeof value === "string" && value.trim().length >= 6) values.push(value.trim())
    else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === "object") Object.values(value).forEach(visit)
  }
  visit(DEMO_FACTS_INPUT_BY_DESIGN_V1[designId])
  return values
}

/* ------------------------------ contract ------------------------------ */

test("CV1-1b contract: fidelity designs validate with declared composition; legacy @1 designs are unchanged", () => {
  assert.ok(FIDELITY_DESIGNS.length >= 2)
  assert.deepEqual(FIDELITY_DESIGNS.map((design) => `${design.id}@${design.version}`).sort(), ["clinica@1", "construction@2", "contabilidad@1", "hotel@1", "servicios-locales@2"])
  for (const design of FIDELITY_DESIGNS) {
    assert.equal(validateCommercialDesignV1(design).ok, true, design.id)
    assert.equal(Object.isFrozen(design), true)
    assert.equal(design.pages.some((page) => page.pinFallbacks), false, `${design.id}: no pin swaps on missing facts`)
  }
  for (const design of [SERVICIOS_LOCALES_V1, CONSTRUCTION_V1]) {
    assert.equal(design.composition, undefined, `${design.id}@1 keeps its original semantics`)
    assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1[`${design.id}@1`], design)
  }
  // The only recipe difference of servicios-locales@2: no testimonials the approved demo never showed.
  assert.deepEqual(SERVICIOS_LOCALES_V2.pages[0].sections.map((section) => section.role), SERVICIOS_LOCALES_V1.pages[0].sections.map((section) => section.role).filter((role) => role !== "testimonials"))
})

test("CV1-1b contract: the strict validator rejects bad composition and fidelity with pin fallbacks", () => {
  const withComposition = (composition: unknown, extra: Record<string, unknown> = {}) => ({ ...clone(SERVICIOS_LOCALES_V2), composition, ...extra })
  const codes = (value: unknown) => {
    const result = validateCommercialDesignV1(value)
    return "diagnostics" in result ? result.diagnostics.map((entry) => `${entry.path}:${entry.code}`) : []
  }
  assert.ok(codes(withComposition({ visualFamily: "neon", fidelity: "demo-shape" })).includes("$.composition.visualFamily:enum_invalid"))
  assert.ok(codes(withComposition({ visualFamily: "creative", fidelity: "demo-shape", css: "x" })).includes("$.composition.css:unknown_key"))
  const fallback = clone(SERVICIOS_LOCALES_V2)
  ;(fallback.pages[0] as { pinFallbacks?: unknown }).pinFallbacks = [{ whenMissing: "asset:hero", pins: { heroVariant: "centered" } }]
  assert.ok(codes(fallback).includes("$.pages:fidelity_forbids_pin_fallbacks"))
})

test("CV1-1b catalog: every commercial catalog entry sells a demo-shape design; legacy entries start nothing", () => {
  for (const template of REAL_TEMPLATES) {
    const start = getCommercialTemplateStart(template)
    if (!start) continue
    const design = getCommercialDesignV1(start.designId, start.version)
    assert.ok(design, template.id)
    assert.equal(design.composition?.fidelity, "demo-shape", `${template.id} must not promise an editable copy without fidelity`)
    assert.ok(getDemoFactsV1(design.id), `${template.id}: demo-shape needs its DemoFactsPack`)
  }
  assert.equal(getCommercialTemplateStart(REAL_TEMPLATES.find((template) => template.id === "arquitectura")), null)
})

/* ------------------------------- parity ------------------------------- */

test("CV1-1b gate: each fidelity demo shows its whole recipe (no section omitted by missing demo facts)", () => {
  for (const design of FIDELITY_DESIGNS) {
    const resolved = resolveCommercialDesignV1(design, getDemoFactsV1(design.id)!)
    assert.deepEqual(resolved.omissions, [], design.id)
  }
})

test("CV1-1b gate: compile(demoFacts).structure === compile(customerFacts).structure for every page, every case, every fidelity design", async () => {
  for (const design of FIDELITY_DESIGNS) {
    const demo = await compile(design.id, design.version)
    for (const [label, facts] of customerCases()) {
      const customer = await compile(design.id, design.version, facts)
      assert.equal(customer.facts.kind, "customer")
      assert.deepEqual(customer.plan.pages.map((page) => page.slug), demo.plan.pages.map((page) => page.slug), `${design.id} ${label}: pages`)
      for (const page of demo.plan.pages) {
        const customerPage = customer.plan.pages.find((entry) => entry.slug === page.slug)!
        assert.deepEqual(commercialComposedStructureV1(customerPage.tree), commercialComposedStructureV1(page.tree), `${design.id} ${label}: ${page.slug} structure`)
      }
      assert.equal(customer.composedFingerprint, demo.composedFingerprint, `${design.id} ${label}: composed fingerprint`)
    }
  }
})

test("CV1-1b: dangerous words would change the inferred family, but never the declared composition", async () => {
  assert.notEqual(inferVisualFamily({ industry: "Servicios Locales", description: "Clínica dental" }), inferVisualFamily({ industry: "Servicios Locales", description: "Hotel boutique" }))
  for (const design of FIDELITY_DESIGNS) {
    for (const [, facts] of customerCases()) {
      const customer = await compile(design.id, design.version, facts)
      assert.deepEqual(customer.resolved.composition, design.composition)
    }
  }
})

test("CV1-1b: the composed fingerprint detects a real composition change (it is not blind)", async () => {
  // servicios-locales@1 lets a missing hero photo swap the hero variant -- the strengthened fingerprint sees it.
  const demo = await compile("servicios-locales", 1)
  const degraded = await compile("servicios-locales", 1, { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } })
  assert.notEqual(degraded.composedFingerprint, demo.composedFingerprint)
  const swapped = clone(demo.plan.pages[0].tree)
  const section = swapped.nodes[swapped.rootId].children[1]
  swapped.nodes[section].props = { ...swapped.nodes[section].props, background: "#123456" }
  assert.notDeepEqual(commercialComposedStructureV1(swapped), commercialComposedStructureV1(demo.plan.pages[0].tree))
  // ...while pure content edits are invisible to it.
  const content = clone(demo.plan.pages[0].tree)
  for (const node of Object.values(content.nodes)) if (typeof node.props.text === "string") node.props.text = "Otro texto"
  assert.deepEqual(commercialComposedStructureV1(content), commercialComposedStructureV1(demo.plan.pages[0].tree))
})

/* ---------------------------- demo != customer ---------------------------- */

test("CV1-1b: demo facts never reach a customer site -- empty states instead", async () => {
  for (const design of FIDELITY_DESIGNS) {
    for (const [label, facts] of customerCases().slice(0, 2)) {
      const customer = await compile(design.id, design.version, facts)
      const serialized = JSON.stringify(customer.plan)
      assert.equal(serialized.includes(COMMERCIAL_DEMO_ASSET_PREFIX_V1), false, `${design.id} ${label}: demo imagery`)
      assert.doesNotMatch(serialized, /\(ejemplo\)|de ejemplo|example\.com/i)
      for (const value of demoStrings(design.id)) assert.equal(serialized.includes(value), false, `${design.id} ${label}: demo value leaked: ${value}`)
      for (const page of customer.plan.pages) {
        const seo = JSON.stringify(page.seo)
        assert.equal(Object.values(COMMERCIAL_EMPTY_TEXT_V1).some((text) => seo.includes(text)), false, `${design.id} ${label}: placeholder in SEO of ${page.slug}`)
      }
    }
  }
})

test("CV1-1b: minimal facts keep the architecture as explicit, marked empty states", async () => {
  const customer = await compile("servicios-locales", 2, { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } })
  const home = customer.plan.pages.find((page) => page.isHome)!.tree
  const servicios = customer.plan.pages.find((page) => page.slug === "servicios")!.tree
  assert.equal(home.nodes[home.rootId].props.commercialDesignFidelity, "demo-shape")
  assert.equal(servicios.nodes[servicios.rootId].props[COMMERCIAL_EMPTY_PAGE_PROP_V1], true, "servicios exists only as an empty state without services")
  const homeTexts = JSON.stringify(home)
  for (const text of [COMMERCIAL_EMPTY_TEXT_V1.serviceName, COMMERCIAL_EMPTY_TEXT_V1.price, COMMERCIAL_EMPTY_TEXT_V1.hours]) assert.ok(homeTexts.includes(text), text)
  const markedRoles = home.nodes[home.rootId].children
    .filter((id) => home.nodes[id].props[COMMERCIAL_EMPTY_SECTION_PROP_V1] === true)
    .map((id) => String(home.nodes[id].props.compositionToken).split("|")[0])
  assert.deepEqual(markedRoles.sort(), ["pricing", "services"])
  // The demo itself never carries empty states.
  const demo = await compile("servicios-locales", 2)
  for (const page of demo.plan.pages) assert.equal(Object.values(page.tree.nodes).some((node) => isCommercialEmptyNodeV1(node)), false, page.slug)
})

/* ------------------------------ public ------------------------------ */

function assertNoEmptyStates(tree: EditorTree, label: string) {
  for (const node of Object.values(tree.nodes)) {
    assert.equal(isCommercialEmptyNodeV1(node), false, `${label}: ${node.type} ${JSON.stringify(node.props).slice(0, 80)}`)
  }
  const reachable = new Set<string>()
  const walk = (id: string) => {
    reachable.add(id)
    tree.nodes[id].children.forEach((child) => {
      assert.ok(tree.nodes[child], `${label}: dangling child ${child}`)
      walk(child)
    })
  }
  walk(tree.rootId)
  assert.equal(reachable.size, Object.keys(tree.nodes).length, `${label}: no orphan nodes`)
}

test("CV1-1b public: stripping publishes no placeholder, removes emptied containers and links to hidden pages", async () => {
  for (const design of FIDELITY_DESIGNS) {
    const customer = await compile(design.id, design.version, { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } })
    const hidden = new Set(customer.plan.pages.filter((page) => isHiddenCommercialPageV1(page.tree)).map((page) => page.slug))
    for (const page of customer.plan.pages) {
      if (hidden.has(page.slug)) continue
      const tree = stripCommercialEmptyStatesV1(validateTree(clone(page.tree)), { hiddenPageSlugs: hidden })
      assertNoEmptyStates(tree, `${design.id}/${page.slug}`)
      for (const node of Object.values(tree.nodes)) {
        if (node.type === "ctaButton") assert.equal([...hidden].some((slug) => node.props.href === `page:${slug}`), false, `${design.id}/${page.slug}: button to a hidden page`)
      }
      const root = tree.nodes[tree.rootId]
      assert.equal(root.children.some((id) => tree.nodes[id].props[COMMERCIAL_EMPTY_SECTION_PROP_V1] === true), false, `${design.id}/${page.slug}: unfilled section published`)
    }
  }
  // Untouched trees are returned by reference (legacy sites pay nothing).
  const demo = await compile("servicios-locales", 2)
  assert.equal(stripCommercialEmptyStatesV1(demo.plan.pages[0].tree), demo.plan.pages[0].tree)
})

test("CV1-1b public: filling an empty state publishes it; partially filled sections stay hidden", async () => {
  const customer = await compile("servicios-locales", 2, { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } })
  const home = validateTree(clone(customer.plan.pages[0].tree))
  const pricingId = home.nodes[home.rootId].children.find((id) => String(home.nodes[id].props.compositionToken).startsWith("pricing|"))!
  const pricingNodes: string[] = []
  const collect = (id: string) => { pricingNodes.push(id); home.nodes[id].children.forEach(collect) }
  collect(pricingId)
  const placeholders = pricingNodes.filter((id) => isCommercialEmptyNodeV1(home.nodes[id]))
  assert.ok(placeholders.length >= 2)
  // Fill one placeholder: the section is still not published.
  const partly = clone(home)
  const first = partly.nodes[placeholders[0]]
  for (const key of ["text", "content", "label"]) if (typeof first.props[key] === "string") first.props[key] = "Desde $800"
  assert.equal(stripCommercialEmptyStatesV1(partly).nodes[pricingId], undefined)
  // Fill all of them: the section is published with the customer's content.
  const filled = clone(home)
  for (const id of placeholders) for (const key of ["text", "content", "label"]) if (typeof filled.nodes[id].props[key] === "string") filled.nodes[id].props[key] = "Desde $800"
  const published = stripCommercialEmptyStatesV1(filled)
  assert.ok(published.nodes[pricingId])
  assert.ok(published.nodes[published.rootId].children.includes(pricingId))
})

test("CV1-1b public runtime: hidden pages 404 and leave the navigation; the editor path never strips", async () => {
  const customer = await compile("servicios-locales", 2, { businessName: "Negocio Mínimo", contact: { phone: "5512345678" } })
  const trees = new Map(customer.plan.pages.map((page) => [page.slug, page.tree]))
  const pages = customer.plan.pages.map((page) => ({ id: page.slug, siteId: "site_x", name: page.name, slug: page.slug, isHome: page.isHome, published: false, source: "site-page" as const }))
  const originalLoad = (Module as unknown as ModuleWithLoad)._load
  ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        HOME_PAGE_SLUG: "home",
        HOME_PAGE_NAME: "Inicio",
        listSitePages: async () => pages,
        getResolvedSiteTheme: async () => ({ siteId: "site_x", tokens: customer.plan.theme, source: "site-theme" }),
        getResolvedSitePage: async (_siteId: string, slug = "home") => {
          const page = pages.find((entry) => entry.slug === slug)
          return page ? { ...page, tree: clone(trees.get(slug)), updatedAt: new Date(0) } : null
        },
      }
    }
    return originalLoad.call(this, request, parent, isMain)
  }
  const modulePath = path.join(process.cwd(), ".tmp/unit/lib/builder-core/tree/siteRuntimeContext.js")
  try {
    delete require.cache[modulePath]
    const runtime = await import("../../lib/builder-core/tree/siteRuntimeContext")
    assert.equal(await runtime.getResolvedSiteRuntimeContext("site_x", "servicios"), null, "an unfilled empty-state page is not public")
    const home = await runtime.getResolvedSiteRuntimeContext("site_x", "home")
    assert.ok(home)
    assert.deepEqual(home.pages.map((page) => page.slug), ["home", "contacto"])
    assertNoEmptyStates(home.tree, "runtime home")
    const listed = await runtime.listResolvedSiteRuntimePages("site_x")
    assert.deepEqual(listed.map((page) => page.activePageSlug), ["home", "contacto"])
  } finally {
    ;(Module as unknown as ModuleWithLoad)._load = originalLoad
    delete require.cache[modulePath]
  }
  // Editor load path (getEditorTreeFromDb) keeps the stored tree: no empty-state stripping there.
  assert.doesNotMatch(read("lib/editorPersistence.ts"), /empty-states|stripCommercialEmptyStates/)
  assert.doesNotMatch(read("lib/builder-core/tree/sitePages.ts"), /empty-states|stripCommercialEmptyStates/)
})

/* --------------------------- full chain --------------------------- */

test("CV1-1b chain: compile -> preview hash -> persisted plan -> editor load keeps the demo composition", async () => {
  for (const design of FIDELITY_DESIGNS) {
    const demo = await compile(design.id, design.version)
    const customer = await compile(design.id, design.version, { businessName: "Plomería Hernández", contact: { whatsapp: "8112345678" }, services: [{ name: "Fugas" }] })
    // execute re-validates the persisted plan and requires the SAME hash the preview showed.
    const persisted = validateSiteCreationPlanV2(clone(customer.plan), SITE_CREATION_PLAN_V2_DEFAULT_LIMITS)
    assert.ok(persisted.ok, design.id)
    if (!persisted.ok) continue
    assert.equal(persisted.planHash, customer.planHash, `${design.id}: preview hash == execute hash`)
    for (const page of persisted.plan.pages) {
      // DB JSON round trip + the editor's validateTree on load.
      const loaded = validateTree(clone(page.tree))
      const demoPage = demo.plan.pages.find((entry) => entry.slug === page.slug)!
      assert.deepEqual(commercialComposedStructureV1(loaded), commercialComposedStructureV1(demoPage.tree), `${design.id}/${page.slug}: first editor open == selected demo`)
      assert.deepEqual(loaded.nodes, page.tree.nodes, `${design.id}/${page.slug}: lossless load`)
    }
  }
})

/* --------------------------- simple mode --------------------------- */

test("CV1-1b Simple Mode: same tree + same renderer, fewer controls -- never a simplified site", () => {
  const editorPage = read("app/editor/[id]/page.impl.tsx")
  assert.match(editorPage, /getEditorTreeFromDb\(id, pageSlug\)/)
  assert.match(editorPage, /initialTree=\{tree\}/)
  const clientRenderer = read("components/editor/client-app/ClientPageRenderer.tsx")
  assert.match(clientRenderer, /DynamicRenderer/)
  assert.doesNotMatch(clientRenderer, /strip|simplif|filter\(/i)
  const capabilities = read("components/editor/experience/experience-config.ts")
  assert.doesNotMatch(capabilities, /hideSections|simplifiedTree|stripNodes/)
  // Empty-state stripping exists in exactly one place: the public runtime.
  for (const file of ["components/editor/DynamicRenderer.tsx", "components/PublicRenderer.tsx", "components/editor/client-shell/ClientShell.tsx"]) {
    assert.doesNotMatch(read(file), /stripCommercialEmptyStates/, file)
  }
  assert.match(read("lib/builder-core/tree/siteRuntimeContext.ts"), /stripCommercialEmptyStatesV1/)
})
