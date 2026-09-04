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
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import type { EditorTree, GlobalTheme } from "../../types/editor"
import { resolveRuntimeHref } from "../../lib/builder-core/tree/pageLinks"
import {
  buildSiteCreationHref,
  calculateSiteCreationPlanHash,
  calculateSiteCreationTreeHash,
  hasLegacySiteCreationPlanDiscriminator,
  hasSiteCreationPlanV2Discriminator,
  normalizeSiteCreationPlanV2,
  normalizeSiteCreationSlug,
  syncSiteCreationTreeTheme,
  validateSiteCreationPlanV2,
  type SiteCreationPlanV2,
} from "../../lib/orvenix-ai/site-creation/plan-v2"

const LIMITS = {
  maxPages: 6,
  maxBytes: 500_000,
}

const SIMPLE_TREE_SHA256 = "06e9678f7dbc5738b88391f2e1db0130a1a0d768963932407b99334e75139070"

function theme(overrides: Partial<GlobalTheme> = {}): GlobalTheme {
  return {
    colors: {
      primary: "#1BB3FA",
      secondary: "#1379A8",
      background: "#ffffff",
      text: "#082f49",
      accent: "#1794CC",
    },
    fontHeading: "Inter",
    fontBody: "Inter",
    spacing: { sectionX: "1rem", sectionY: "2rem", stack: "1rem" },
    radius: { card: "1rem", button: "999px" },
    shadow: { soft: "none", strong: "none" },
    motion: { duration: "200ms", easing: "ease" },
    ...overrides,
  }
}

function tree(slug: string, sharedTheme = theme(), text = slug): EditorTree {
  const rootId = `${slug}-root`
  const childId = `${slug}-section`

  return {
    rootId,
    theme: structuredClone(sharedTheme),
    globalTheme: structuredClone(sharedTheme),
    seo: {
      title: `SEO ${slug}`,
      description: `Descripcion ${slug}`,
    },
    nodes: {
      [rootId]: {
        id: rootId,
        type: "section",
        displayName: slug,
        props: {},
        children: [childId],
        version: 1,
      },
      [childId]: {
        id: childId,
        type: "text",
        displayName: text,
        props: { text },
        children: [],
        parentId: rootId,
        version: 1,
      },
    },
  }
}

function simpleTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: [],
        version: 1,
      },
    },
  }
}

function page(slug: string, name: string, isHome = false, sharedTheme = theme(), text = slug) {
  const pageTree = tree(slug, sharedTheme, text)

  return {
    slug,
    name,
    isHome,
    seo: {
      title: `${name} | Demo`,
      description: `Pagina ${name} del sitio Demo.`,
    },
    tree: pageTree,
    treeHash: calculateSiteCreationTreeHash(pageTree),
  }
}

function plan(overrides: Partial<SiteCreationPlanV2> = {}): SiteCreationPlanV2 {
  const sharedTheme = theme()
  const pages = [
    page("home", "Inicio", true, sharedTheme),
    page("servicios", "Servicios", false, sharedTheme),
    page("nosotros", "Nosotros", false, sharedTheme),
    page("contacto", "Contacto", false, sharedTheme),
  ]

  return {
    version: 2,
    identity: {
      name: "Clinica Aurora",
      industry: "salud",
      location: "Monterrey",
      description: "Clinica de atencion preventiva.",
    },
    theme: sharedTheme,
    navigation: pages.map((item) => ({
      label: item.name,
      slug: item.slug,
      href: buildSiteCreationHref(item.slug),
    })),
    pages,
    quality: {
      score: 92,
      warnings: [],
      summary: "Sitio completo orientado a citas.",
    },
    ...overrides,
  }
}

function expectInvalid(candidate: unknown, includes: string) {
  const result = validateSiteCreationPlanV2(candidate, LIMITS)
  assert.equal(result.ok, false)
  assert.ok("errors" in result)
  assert.ok(result.errors.some((error) => error.includes(includes)), result.errors.join("\n"))
}

function expectValid(candidate: unknown, limits = LIMITS) {
  const result = validateSiteCreationPlanV2(candidate, limits)
  assert.equal(result.ok, true, "errors" in result ? result.errors.join("\n") : "")
  return result
}

function clonePlan() {
  return structuredClone(plan())
}

test("SiteCreationPlanV2 acepta un plan valido con cuatro paginas", () => {
  const candidate = plan()
  const result = expectValid(candidate)

  assert.equal(hasSiteCreationPlanV2Discriminator(candidate), true)
  assert.equal(result.plan.pages.length, 4)
  assert.equal(result.plan.navigation[0]?.href, "page:home")
  assert.match(result.planHash, /^[a-f0-9]{64}$/)
  assert.equal(result.warnings.length, 0)
})

test("fixture SHA-256 independiente para un EditorTree JSON valido", () => {
  assert.equal(calculateSiteCreationTreeHash(simpleTree()), SIMPLE_TREE_SHA256)
})

test("hash V2 coincide con hashEditorTree para un EditorTree JSON plano valido", async () => {
  fs.mkdirSync(path.join(process.cwd(), ".tmp/unit/generated"), { recursive: true })
  fs.writeFileSync(
    path.join(process.cwd(), ".tmp/unit/generated/editor-prisma.js"),
    "class PrismaClient {}\nmodule.exports = { PrismaClient }\n",
  )
  const { hashEditorTree } = await import("../../lib/orvenix-ai/mutation/executor")
  const candidate = tree("hash")

  assert.equal(calculateSiteCreationTreeHash(candidate), hashEditorTree(candidate))
})

test("hash del plan es determinista con claves insertadas en distinto orden", () => {
  const first = plan()
  const second = {
    quality: first.quality,
    pages: first.pages.map((item) => ({
      treeHash: item.treeHash,
      tree: item.tree,
      seo: item.seo,
      isHome: item.isHome,
      name: item.name,
      slug: item.slug,
    })),
    navigation: first.navigation.map((item) => ({
      href: item.href,
      slug: item.slug,
      label: item.label,
    })),
    theme: first.theme,
    identity: {
      description: first.identity.description,
      location: first.identity.location,
      industry: first.identity.industry,
      name: first.identity.name,
    },
    version: 2 as const,
  }

  assert.equal(calculateSiteCreationPlanHash(first), calculateSiteCreationPlanHash(second))
})

test("hash del plan cambia con orden de arrays", () => {
  const first = plan()
  const second = {
    ...first,
    navigation: [...first.navigation].reverse(),
  }

  assert.notEqual(calculateSiteCreationPlanHash(first), calculateSiteCreationPlanHash(second))
})

test("hash del plan cambia con Theme", () => {
  const first = plan()
  const nextTheme = theme({ colors: { ...theme().colors!, primary: "#ff3366" } })
  const second = normalizeSiteCreationPlanV2({
    ...first,
    theme: nextTheme,
  })

  assert.notEqual(calculateSiteCreationPlanHash(first), calculateSiteCreationPlanHash(second))
})

test("hash del plan cambia con SEO", () => {
  const first = plan()
  const second = structuredClone(first)
  second.pages[1]!.seo.title = "Servicios especializados"

  assert.notEqual(calculateSiteCreationPlanHash(first), calculateSiteCreationPlanHash(second))
})

test("hash del plan cambia con contenido de una pagina", () => {
  const first = plan()
  const second = structuredClone(first)
  second.pages[2]!.tree.nodes["nosotros-section"]!.props.text = "Nuevo contenido"
  second.pages[2]!.treeHash = calculateSiteCreationTreeHash(second.pages[2]!.tree)

  assert.notEqual(calculateSiteCreationPlanHash(first), calculateSiteCreationPlanHash(second))
})

test("href interno usa page:home y resuelve runtime publicado", () => {
  assert.equal(buildSiteCreationHref("home"), "page:home")
  assert.equal(resolveRuntimeHref("site_1", buildSiteCreationHref("home"), "published"), "/p/site_1")
})

test("href interno usa page:slug y resuelve runtime publicado", () => {
  assert.equal(buildSiteCreationHref("Servicios Premium"), "page:servicios-premium")
  assert.equal(resolveRuntimeHref("site_1", buildSiteCreationHref("servicios"), "published"), "/p/site_1/servicios")
  assert.equal(resolveRuntimeHref("site_1", buildSiteCreationHref("servicios"), "export"), "/servicios/index.html")
})

test("rechaza formato /slug en navegacion", () => {
  const candidate = clonePlan()
  candidate.navigation[1]!.href = "/servicios"

  expectInvalid(candidate, "href interno incoherente")
})

test("rechaza navegacion a slug inexistente y normalizacion no la elimina", () => {
  const candidate = clonePlan()
  candidate.navigation[1] = {
    label: "Blog",
    slug: "blog",
    href: "page:blog",
  }

  expectInvalid(candidate, "pagina inexistente")
  assert.throws(() => normalizeSiteCreationPlanV2(candidate), /pagina inexistente/)
  assert.equal(candidate.navigation[1]?.slug, "blog")
})

test("rechaza slugs duplicados", () => {
  const candidate = clonePlan()
  candidate.pages[1]!.slug = "home"
  candidate.navigation[1]!.slug = "home"
  candidate.navigation[1]!.href = "page:home"

  expectInvalid(candidate, "duplicado")
})

test("rechaza colision de slugs despues de normalizacion", () => {
  const candidate = clonePlan()
  candidate.pages[1]!.slug = "Mis Servicios"
  candidate.pages[2]!.slug = "mis-servicios"

  expectInvalid(candidate, "colisiona")
  assert.throws(() => normalizeSiteCreationPlanV2(candidate), /colisiona/)
})

test("rechaza dos homes", () => {
  const candidate = clonePlan()
  candidate.pages[1]!.isHome = true
  candidate.pages[1]!.slug = "home"

  expectInvalid(candidate, "exactamente una pagina home")
})

test("rechaza ninguna home", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.isHome = false

  expectInvalid(candidate, "exactamente una pagina home")
})

test("rechaza treeHash incorrecto sin corregirlo durante validacion", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.treeHash = "0".repeat(64)

  expectInvalid(candidate, "treeHash")
  assert.equal(candidate.pages[0]!.treeHash, "0".repeat(64))
})

test("normalizacion server-side recalcula treeHash en una funcion separada", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.treeHash = "0".repeat(64)
  const normalized = normalizeSiteCreationPlanV2(candidate)

  assert.notEqual(normalized.pages[0]!.treeHash, "0".repeat(64))
  expectValid(normalized)
})

test("rechaza Theme inconsistente", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.tree.globalTheme = theme({ fontBody: "Roboto" })
  candidate.pages[0]!.treeHash = calculateSiteCreationTreeHash(candidate.pages[0]!.tree)

  expectInvalid(candidate, "theme y globalTheme")
})

test("rechaza rootId vacio y nodes array", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.tree.rootId = ""
  candidate.pages[0]!.tree.nodes = [] as never
  candidate.pages[0]!.treeHash = calculateSiteCreationTreeHash(candidate.pages[0]!.tree)

  expectInvalid(candidate, "EditorTree invalido")
})

test("rechaza rootId inexistente en nodes", () => {
  const candidate = clonePlan()
  candidate.pages[0]!.tree.rootId = "missing"
  candidate.pages[0]!.treeHash = calculateSiteCreationTreeHash(candidate.pages[0]!.tree)

  expectInvalid(candidate, "rootId")
})

test("rechaza por maximo de paginas", () => {
  const candidate = clonePlan()
  const result = validateSiteCreationPlanV2(candidate, { ...LIMITS, maxPages: 3 })

  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.includes("limite de paginas")))
})

test("limite de bytes es inclusivo y usa bytes UTF-8 canonicos", () => {
  const candidate = clonePlan()
  candidate.identity.name = "Clínica México 🚀"
  candidate.pages[0]!.seo.title = "Clínica México 🚀"
  candidate.pages[0]!.tree.nodes["home-section"]!.props.text = "Clínica México 🚀"
  candidate.pages[0]!.treeHash = calculateSiteCreationTreeHash(candidate.pages[0]!.tree)
  const valid = expectValid(candidate)

  assert.equal(validateSiteCreationPlanV2(candidate, { ...LIMITS, maxBytes: valid.byteLength }).ok, true)
  assert.equal(validateSiteCreationPlanV2(candidate, { ...LIMITS, maxBytes: valid.byteLength - 1 }).ok, false)
  assert.ok(valid.byteLength > JSON.stringify(candidate).length)
})

test("normalizacion no muta el input", () => {
  const candidate = clonePlan()
  const original = structuredClone(candidate)
  const normalized = normalizeSiteCreationPlanV2(candidate)

  assert.deepEqual(candidate, original)
  assert.notEqual(normalized, candidate)
  assert.equal(normalized.pages[1]!.slug, "servicios")
})

test("sincroniza theme y globalTheme en cada arbol sin compartir referencias", () => {
  const sharedTheme = theme()
  const pageTree = tree("demo", sharedTheme)
  delete pageTree.globalTheme

  const synced = syncSiteCreationTreeTheme(pageTree, sharedTheme)

  assert.deepEqual(synced.theme, sharedTheme)
  assert.deepEqual(synced.globalTheme, sharedTheme)
  assert.notEqual(synced.theme, synced.globalTheme)
  assert.equal(pageTree.globalTheme, undefined)
})

test("referencia compartida no ciclica se acepta y se clona como JSON independiente", () => {
  const candidate = clonePlan()
  const sharedTheme = theme({ fontBody: "Manrope" })
  candidate.theme = sharedTheme

  for (const item of candidate.pages) {
    item.tree.theme = sharedTheme
    item.tree.globalTheme = sharedTheme
    item.treeHash = calculateSiteCreationTreeHash(item.tree)
  }

  const result = expectValid(candidate)

  assert.deepEqual(result.plan.theme, sharedTheme)
  assert.notEqual(result.plan.theme, result.plan.pages[0]!.tree.theme)
  assert.notEqual(result.plan.pages[0]!.tree.theme, result.plan.pages[0]!.tree.globalTheme)
})

test("normaliza slugs e hrefs internos", () => {
  assert.equal(normalizeSiteCreationSlug(" Servicios Premium "), "servicios-premium")
  assert.equal(buildSiteCreationHref("home"), "page:home")
  assert.equal(buildSiteCreationHref("Servicios Premium"), "page:servicios-premium")
})

test("discriminadores V1 y V2 no validan ni convierten automaticamente", () => {
  const v2 = plan()
  const shallowV2 = { version: 2, identity: {}, theme: {}, navigation: [], pages: [], quality: {} }
  const v1 = {
    siteId: "site_1",
    snapshot: { id: "snapshot_1", siteId: "site_1", createdAt: new Date(0).toISOString(), tree: tree("before") },
    before: tree("before"),
    after: tree("after"),
    addedNodes: 1,
    removedNodes: 0,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }

  assert.equal(hasSiteCreationPlanV2Discriminator(v2), true)
  assert.equal(hasSiteCreationPlanV2Discriminator(shallowV2), true)
  expectInvalid(shallowV2, "al menos una pagina")
  assert.equal(hasLegacySiteCreationPlanDiscriminator(v2), false)
  assert.equal(hasSiteCreationPlanV2Discriminator(v1), false)
  assert.equal(hasLegacySiteCreationPlanDiscriminator(v1), true)
})

test("rechaza ciclos sin stack overflow", () => {
  const candidate = clonePlan() as SiteCreationPlanV2 & { self?: unknown }
  candidate.self = candidate

  expectInvalid(candidate, "referencia circular")
})

test("rechaza objeto con prototipo peligroso o instancia de clase", () => {
  class Demo {
    value = "demo"
  }
  const candidate = clonePlan()
  candidate.identity = new Demo() as never

  expectInvalid(candidate, "objeto no plano")
})

test("rechaza Date, Map, Set y RegExp", () => {
  const datePlan = clonePlan()
  datePlan.identity.description = new Date() as never
  expectInvalid(datePlan, "objeto no plano")

  const mapPlan = clonePlan()
  mapPlan.theme = new Map() as never
  expectInvalid(mapPlan, "objeto no plano")

  const setPlan = clonePlan()
  setPlan.theme = new Set() as never
  expectInvalid(setPlan, "objeto no plano")

  const regexpPlan = clonePlan()
  regexpPlan.identity.description = /demo/ as never
  expectInvalid(regexpPlan, "objeto no plano")
})

test("rechaza BigInt, NaN, Infinity, -Infinity y -0", () => {
  const bigintPlan = clonePlan()
  bigintPlan.quality.score = BigInt(1) as never
  expectInvalid(bigintPlan, "BigInt")

  const nanPlan = clonePlan()
  nanPlan.quality.score = Number.NaN
  expectInvalid(nanPlan, "numero no finito")

  const infinityPlan = clonePlan()
  infinityPlan.quality.score = Number.POSITIVE_INFINITY
  expectInvalid(infinityPlan, "numero no finito")

  const negativeInfinityPlan = clonePlan()
  negativeInfinityPlan.quality.score = Number.NEGATIVE_INFINITY
  expectInvalid(negativeInfinityPlan, "numero no finito")

  const negativeZeroPlan = clonePlan()
  negativeZeroPlan.quality.score = -0
  expectInvalid(negativeZeroPlan, "-0")
})

test("rechaza undefined, funcion y simbolo", () => {
  const undefinedPlan = clonePlan()
  undefinedPlan.identity.industry = undefined
  expectInvalid(undefinedPlan, "undefined")

  const functionPlan = clonePlan()
  functionPlan.pages[0]!.tree.nodes["home-section"]!.props.onClick = () => undefined
  expectInvalid(functionPlan, "funcion")

  const symbolPlan = clonePlan()
  symbolPlan.identity.description = Symbol("demo") as never
  expectInvalid(symbolPlan, "simbolo")
})

test("rechaza arrays con huecos", () => {
  const candidate = clonePlan()
  candidate.navigation = [candidate.navigation[0]!, , candidate.navigation[2]!] as never

  expectInvalid(candidate, "array con hueco")
})

test("rechaza propiedades no enumerables", () => {
  const candidate = clonePlan()
  Object.defineProperty(candidate.identity, "hidden", {
    value: "demo",
    enumerable: false,
  })

  expectInvalid(candidate, "propiedad no enumerable")
})

test("rechaza propiedades simbolo", () => {
  const candidate = clonePlan()
  Object.defineProperty(candidate.identity, Symbol("hidden"), {
    value: "demo",
    enumerable: true,
  })

  expectInvalid(candidate, "propiedades simbolo")
})

test("rechaza getters sin ejecutarlos", () => {
  const candidate = clonePlan()
  let executed = false
  Object.defineProperty(candidate.identity, "unsafe", {
    enumerable: true,
    get() {
      executed = true
      return "demo"
    },
  })

  expectInvalid(candidate, "accessors")
  assert.equal(executed, false)
})

test("rechaza claves reservadas", () => {
  for (const key of ["__proto__", "prototype", "constructor"]) {
    const candidate = clonePlan()
    Object.defineProperty(candidate.identity, key, {
      value: "demo",
      enumerable: true,
      configurable: true,
    })

    expectInvalid(candidate, "clave reservada")
  }
})
