import test from "node:test"
import assert from "node:assert/strict"

import {
  canonicalDesignPatternJson,
  createDesignPatternLevelKey,
  extractDesignPatternV1,
} from "../../lib/orvenix-ai/design-memory/design-pattern"
import { createHash } from "node:crypto"
import type { SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { EditorTree, GlobalTheme } from "../../types/editor"

const theme: GlobalTheme = {
  colors: {
    primary: "#1794CC",
    secondary: "#1379A8",
    background: "#ffffff",
    text: "#0A3E57",
    accent: "#1BB3FA",
  },
  fontHeading: "Inter",
  fontBody: "Inter",
  spacing: { sectionX: "1rem", sectionY: "2rem", stack: "1rem" },
  radius: { card: "16px", button: "999px" },
  shadow: { soft: "none", strong: "none" },
  motion: { duration: "200ms", easing: "ease" },
}

function tree(params: {
  heroText?: string
  ctaLabel?: string
  includePrivate?: boolean
  includeGallery?: boolean
} = {}): EditorTree {
  const nodes: EditorTree["nodes"] = {
    root: {
      id: "root",
      type: "section",
      displayName: "Página",
      props: {},
      children: ["hero", "services", "contact", "cta", "footer"],
      version: 1,
    },
    hero: {
      id: "hero",
      type: "section",
      displayName: "Hero autonomo variante 1",
      props: {},
      children: ["hero-title", "hero-cta"],
      parentId: "root",
      version: 1,
    },
    "hero-title": {
      id: "hero-title",
      type: "heading",
      displayName: "Titulo hero",
      props: { text: params.heroText ?? "Atención premium para tu negocio" },
      children: [],
      parentId: "hero",
      version: 1,
    },
    "hero-cta": {
      id: "hero-cta",
      type: "ctaButton",
      displayName: "CTA principal",
      props: { label: params.ctaLabel ?? "Agendar ahora", href: params.includePrivate ? "mailto:persona@example.com" : "#" },
      children: [],
      parentId: "hero",
      version: 1,
    },
    services: {
      id: "services",
      type: "section",
      displayName: "Servicios",
      props: {},
      children: ["service-card"],
      parentId: "root",
      version: 1,
    },
    "service-card": {
      id: "service-card",
      type: "genericWrapper",
      displayName: "Servicio privado",
      props: {},
      children: [],
      parentId: "services",
      version: 1,
    },
    contact: {
      id: "contact",
      type: "section",
      displayName: "Contacto",
      props: {},
      children: [],
      parentId: "root",
      version: 1,
    },
    cta: {
      id: "cta",
      type: "section",
      displayName: "CTA final",
      props: {},
      children: ["final-cta"],
      parentId: "root",
      version: 1,
    },
    "final-cta": {
      id: "final-cta",
      type: "ctaButton",
      displayName: "CTA final",
      props: { label: "Comprar", href: "#" },
      children: [],
      parentId: "cta",
      version: 1,
    },
    footer: {
      id: "footer",
      type: "section",
      displayName: "Footer",
      props: {},
      children: [],
      parentId: "root",
      version: 1,
    },
  }

  if (params.includeGallery) {
    nodes.root.children.splice(2, 0, "gallery")
    nodes.gallery = {
      id: "gallery",
      type: "section",
      displayName: "Galería",
      props: {},
      children: ["image-1"],
      parentId: "root",
      version: 1,
    }
    nodes["image-1"] = {
      id: "image-1",
      type: "image",
      displayName: "Imagen galería",
      props: { src: "https://example.com/private.jpg", alt: "Privado" },
      children: [],
      parentId: "gallery",
      version: 1,
    }
  }

  return {
    rootId: "root",
    theme: structuredClone(theme),
    globalTheme: structuredClone(theme),
    nodes,
  }
}

function page(slug: string, isHome: boolean, pageTree = tree()) {
  return {
    slug,
    name: slug,
    isHome,
    seo: { title: slug, description: slug },
    tree: pageTree,
    treeHash: createHash("sha256").update(JSON.stringify(pageTree)).digest("hex"),
  }
}

function plan(overrides: Partial<SiteCreationPlanV2> = {}): SiteCreationPlanV2 {
  const pages = overrides.pages ?? [
    page("home", true),
    page("servicios", false),
    page("mi-cliente-secreto", false),
  ]

  return {
    version: 2,
    identity: {
      name: "Nombre privado",
      industry: "dental clinic",
      description: "Teléfono 555-1234",
    },
    theme: structuredClone(theme),
    navigation: pages.map((entry) => ({
      label: entry.name,
      slug: entry.slug,
      href: `page:${entry.slug}`,
    })),
    pages,
    quality: { score: 90, warnings: [], summary: "Plan" },
    ...overrides,
  }
}

test("misma entrada produce mismo pattern y hash", () => {
  const first = extractDesignPatternV1({
    initialPlan: plan(),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium claro",
  })
  const second = extractDesignPatternV1({
    initialPlan: plan(),
    industry: "dentist",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium claro",
  })

  assert.deepEqual(first.pattern, second.pattern)
  assert.equal(first.patternHash, second.patternHash)
})

test("copy, nombre de negocio, email y teléfono no cambian el pattern", () => {
  const first = extractDesignPatternV1({
    initialPlan: plan({
      identity: { name: "Clínica Aurora", industry: "dental", description: "contacto@privado.test 5551234" },
      pages: [page("home", true, tree({ heroText: "Copy A", includePrivate: true }))],
      navigation: [{ label: "Inicio privado", slug: "home", href: "page:home" }],
    }),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
  })
  const second = extractDesignPatternV1({
    initialPlan: plan({
      identity: { name: "Dental Norte", industry: "dental", description: "otro@privado.test 9999999" },
      pages: [page("home", true, tree({ heroText: "Copy B", ctaLabel: "Otro CTA" }))],
      navigation: [{ label: "Inicio diferente", slug: "home", href: "page:home" }],
    }),
    industry: "dental clinic",
    siteType: "health",
    objective: "agendar citas",
    requestedStyle: "lujo",
  })

  assert.deepEqual(first.pattern, second.pattern)
  assert.equal(canonicalDesignPatternJson(first.pattern).includes("Aurora"), false)
  assert.equal(canonicalDesignPatternJson(first.pattern).includes("@"), false)
})

test("slugs conocidos se normalizan y slugs privados quedan como other", () => {
  const extracted = extractDesignPatternV1({
    initialPlan: plan(),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
  })

  assert.deepEqual(extracted.pattern.architecture.pageTypes, ["home", "other", "services"])
  assert.deepEqual(extracted.pattern.architecture.navigationOrder, ["home", "services", "other"])
})

test("pageTypes es set-like, unico y ordenado; navigationOrder conserva orden", () => {
  const planA = plan({
    pages: [page("home", true), page("servicios", false), page("contacto", false)],
    navigation: [
      { label: "Inicio", slug: "home", href: "page:home" },
      { label: "Servicios", slug: "servicios", href: "page:servicios" },
      { label: "Contacto", slug: "contacto", href: "page:contacto" },
    ],
  })
  const planB = plan({
    pages: [page("contacto", false), page("home", true), page("servicios", false)],
    navigation: [
      { label: "Contacto", slug: "contacto", href: "page:contacto" },
      { label: "Inicio", slug: "home", href: "page:home" },
      { label: "Servicios", slug: "servicios", href: "page:servicios" },
    ],
  })

  const first = extractDesignPatternV1({ initialPlan: planA, industry: "dental" })
  const second = extractDesignPatternV1({ initialPlan: planB, industry: "dental" })

  assert.deepEqual(first.pattern.architecture.pageTypes, ["contact", "home", "services"])
  assert.deepEqual(second.pattern.architecture.pageTypes, ["contact", "home", "services"])
  assert.notDeepEqual(first.pattern.architecture.navigationOrder, second.pattern.architecture.navigationOrder)
})

test("pageTypes elimina duplicados y conserva other sin slug privado", () => {
  const extracted = extractDesignPatternV1({
    initialPlan: plan({
      pages: [page("home", true), page("servicios", false), page("services", false), page("cliente-privado", false)],
    }),
    industry: "dental",
  })

  assert.deepEqual(extracted.pattern.architecture.pageTypes, ["home", "other", "services"])
})

test("color exacto diferente dentro de misma familia conserva bucket", () => {
  const blueTheme = structuredClone(theme)
  blueTheme.colors!.accent = "#1E88E5"
  const otherBlueTheme = structuredClone(theme)
  otherBlueTheme.colors!.accent = "#1565C0"

  const first = extractDesignPatternV1({ initialPlan: plan({ theme: blueTheme }), industry: "dental" })
  const second = extractDesignPatternV1({ initialPlan: plan({ theme: otherBlueTheme }), industry: "dental" })

  assert.equal(first.pattern.theme.accentHue, "blue")
  assert.equal(second.pattern.theme.accentHue, "blue")
})

test("L1 y L2 son estables ante cambios de arquitectura; L3/L4 cambian con arquitectura real", () => {
  const base = extractDesignPatternV1({
    initialPlan: plan(),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
  }).pattern
  const expanded = extractDesignPatternV1({
    initialPlan: plan({ pages: [page("home", true, tree({ includeGallery: true })), page("contacto", false)] }),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
  }).pattern

  assert.equal(createDesignPatternLevelKey(base, "L1"), createDesignPatternLevelKey(expanded, "L1"))
  assert.equal(createDesignPatternLevelKey(base, "L2"), createDesignPatternLevelKey(expanded, "L2"))
  assert.notEqual(createDesignPatternLevelKey(base, "L3"), createDesignPatternLevelKey(expanded, "L3"))
  assert.notEqual(createDesignPatternLevelKey(base, "L4"), createDesignPatternLevelKey(expanded, "L4"))
})

test("pattern serializable no contiene datos privados ni árbol completo", () => {
  const extracted = extractDesignPatternV1({
    initialPlan: plan(),
    industry: "dental",
    siteType: "health",
    objective: "conseguir citas",
    requestedStyle: "premium",
  })
  const json = canonicalDesignPatternJson(extracted.pattern)

  assert.equal(json.includes("Nombre privado"), false)
  assert.equal(json.includes("mi-cliente-secreto"), false)
  assert.equal(json.includes("nodes"), false)
  assert.equal(json.includes("rootId"), false)
  assert.match(extracted.patternHash, /^[a-f0-9]{64}$/)
})
