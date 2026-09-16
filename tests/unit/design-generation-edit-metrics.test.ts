import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import type { EditorTree, GlobalTheme } from "../../types/editor"
import { createHash } from "node:crypto"
import type { SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

const baseTheme: GlobalTheme = {
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
  shadow: { soft: "none", strong: "0 20px 60px rgba(0,0,0,.15)" },
  motion: { duration: "200ms", easing: "ease" },
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function stableObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableObject)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableObject(entry)]),
    )
  }
  return value
}

function calculateTreeHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableObject(value))).digest("hex")
}

function buildHref(slug: string) {
  return `page:${slug}`
}

function tree(text = "Hola", theme = baseTheme): EditorTree {
  return {
    rootId: "root",
    theme: clone(theme),
    globalTheme: clone(theme),
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: { backgroundColor: "#ffffff" },
        children: ["headline", "cta"],
        version: 1,
      },
      headline: {
        id: "headline",
        type: "heading",
        props: { text, color: "#0A3E57" },
        children: [],
        parentId: "root",
        version: 1,
      },
      cta: {
        id: "cta",
        type: "ctaButton",
        props: { label: "Comprar", href: "#contacto" },
        children: [],
        parentId: "root",
        version: 1,
      },
    },
  }
}

function treeWithExtraNodes(extraNodes: number, text = "Hola") {
  const pageTree = tree(text)

  for (let index = 0; index < extraNodes; index += 1) {
    const id = `extra-${index}`
    pageTree.nodes[id] = {
      id,
      type: "text",
      props: { content: `Extra ${index}` },
      children: [],
      parentId: "root",
      version: 1,
    }
    pageTree.nodes.root.children.push(id)
  }

  return pageTree
}

function page(slug: string, pageTree = tree()) {
  return {
    slug,
    name: slug === "home" ? "Inicio" : slug,
    isHome: slug === "home",
    seo: { title: slug, description: slug },
    tree: pageTree,
    treeHash: calculateTreeHash(pageTree),
  }
}

function plan(pages = [page("home")], theme = baseTheme): SiteCreationPlanV2 {
  return {
    version: 2,
    identity: { name: "Demo" },
    theme: clone(theme),
    navigation: pages.map((entry) => ({ label: entry.name, slug: entry.slug, href: buildHref(entry.slug) })),
    pages,
    quality: { score: 90, warnings: [], summary: "Demo" },
  }
}

async function measure(
  initialPlan: SiteCreationPlanV2,
  pages = initialPlan.pages.map((entry) => ({ slug: entry.slug, tree: clone(entry.tree) })),
  theme: unknown = initialPlan.theme,
) {
  const { measureDesignGenerationDrift } = await import("../../lib/orvenix-ai/design-memory/edit-metrics")
  return measureDesignGenerationDrift(initialPlan, { pages, theme: theme as GlobalTheme })
}

test("sitio identico produce editDistance 0", async () => {
  const metrics = await measure(plan())

  assert.equal(metrics.editDistance, 0)
  assert.equal(metrics.pagesChanged, 0)
  assert.equal(metrics.pagesRenamed, 0)
  assert.equal(metrics.themeChanged, false)
})

test("solo copy cuenta como cambio de copy y distancia baja", async () => {
  const initial = plan()
  const changed = tree("Nuevo texto")
  const metrics = await measure(initial, [{ slug: "home", tree: changed }])

  assert.equal(metrics.copyChangedNodes, 1)
  assert.equal(metrics.visualChangedNodes, 0)
  assert.equal(metrics.structuralChangedNodes, 0)
  assert.ok(metrics.editDistance > 0)
  assert.ok(metrics.editDistance < 0.15)
})

test("cambio visual cuenta como visual", async () => {
  const initial = plan()
  const changed = tree()
  changed.nodes.headline.props.color = "#1BB3FA"
  const metrics = await measure(initial, [{ slug: "home", tree: changed }])

  assert.equal(metrics.visualChangedNodes, 1)
  assert.equal(metrics.copyChangedNodes, 0)
})

test("cambio estructural cuenta como structural", async () => {
  const initial = plan()
  const changed = tree()
  changed.nodes.root.children = ["cta", "headline"]
  const metrics = await measure(initial, [{ slug: "home", tree: changed }])

  assert.equal(metrics.structuralChangedNodes, 1)
})

test("nodo agregado se contabiliza", async () => {
  const initial = plan()
  const changed = tree()
  changed.nodes.badge = { id: "badge", type: "text", props: { content: "Nuevo" }, children: [], parentId: "root", version: 1 }
  changed.nodes.root.children.push("badge")
  const metrics = await measure(initial, [{ slug: "home", tree: changed }])

  assert.equal(metrics.nodesAdded, 1)
})

test("nodo eliminado se contabiliza", async () => {
  const initial = plan()
  const changed = tree()
  delete changed.nodes.cta
  changed.nodes.root.children = ["headline"]
  const metrics = await measure(initial, [{ slug: "home", tree: changed }])

  assert.equal(metrics.nodesRemoved, 1)
})

test("pagina agregada se contabiliza junto con sus nodos", async () => {
  const initial = plan()
  const addedTree = tree("Servicios")
  const metrics = await measure(initial, [
    { slug: "home", tree: tree() },
    { slug: "servicios", tree: addedTree },
  ])

  assert.equal(metrics.pagesAdded, 1)
  assert.equal(metrics.nodesAdded, Object.keys(addedTree.nodes).length)
  assert.equal(metrics.pageCountCurrent, 2)
})

test("pagina eliminada se contabiliza junto con sus nodos", async () => {
  const removedTree = tree("Servicios")
  const initial = plan([page("home"), page("servicios", removedTree)])
  const metrics = await measure(initial, [{ slug: "home", tree: tree() }])

  assert.equal(metrics.pagesRemoved, 1)
  assert.equal(metrics.nodesRemoved, Object.keys(removedTree.nodes).length)
  assert.equal(metrics.pageCountInitial, 2)
})

test("pagina agregada grande produce mas distancia que pagina pequena", async () => {
  const initial = plan()
  const small = await measure(initial, [
    { slug: "home", tree: tree() },
    { slug: "servicios", tree: tree("Servicios") },
  ])
  const large = await measure(initial, [
    { slug: "home", tree: tree() },
    { slug: "servicios", tree: treeWithExtraNodes(8, "Servicios") },
  ])

  assert.ok(large.nodesAdded > small.nodesAdded)
  assert.ok(large.editDistance > small.editDistance)
})

test("multiples cambios producen distancia mayor que cambio pequeño", async () => {
  const initial = plan()
  const copyOnly = await measure(initial, [{ slug: "home", tree: tree("Nuevo texto") }])
  const changed = tree("Nuevo texto")
  delete changed.nodes.cta
  changed.nodes.root.children = ["headline"]
  const many = await measure(initial, [
    { slug: "home", tree: changed },
    { slug: "contacto", tree: tree("Contacto") },
  ], { ...baseTheme, fontHeading: "Montserrat" })

  assert.ok(many.editDistance > copyOnly.editDistance)
})

test("cambio solo theme no produce cambios artificiales de nodos", async () => {
  const initial = plan()
  const changedTheme = { ...baseTheme, fontHeading: "Montserrat" }
  const currentTree = clone(initial.pages[0]!.tree)
  currentTree.theme = clone(changedTheme)
  currentTree.globalTheme = clone(changedTheme)
  const metrics = await measure(initial, [{ slug: "home", tree: currentTree }], changedTheme)

  assert.equal(metrics.themeChanged, true)
  assert.equal(metrics.themeChangedKeys, 1)
  assert.equal(metrics.pagesChanged, 0)
  assert.equal(metrics.nodesChanged, 0)
  assert.equal(metrics.visualChangedNodes, 0)
})

test("visual local y theme global se cuentan por separado", async () => {
  const initial = plan()
  const changedTheme = { ...baseTheme, fontHeading: "Montserrat" }
  const currentTree = clone(initial.pages[0]!.tree)
  currentTree.theme = clone(changedTheme)
  currentTree.globalTheme = clone(changedTheme)
  currentTree.nodes.headline.props.color = "#1BB3FA"
  const metrics = await measure(initial, [{ slug: "home", tree: currentTree }], changedTheme)

  assert.equal(metrics.themeChanged, true)
  assert.equal(metrics.themeChangedKeys, 1)
  assert.equal(metrics.visualChangedNodes, 1)
  assert.equal(metrics.nodesChanged, 1)
})

test("rename puro de slug no se convierte en add y remove si es inequivoco", async () => {
  const aboutTree = tree("Nosotros")
  const initial = plan([page("home"), page("about", aboutTree)])
  const metrics = await measure(initial, [
    { slug: "home", tree: tree() },
    { slug: "nosotros", tree: clone(aboutTree) },
  ])

  assert.equal(metrics.pagesRenamed, 1)
  assert.equal(metrics.pagesAdded, 0)
  assert.equal(metrics.pagesRemoved, 0)
  assert.equal(metrics.nodesAdded, 0)
  assert.equal(metrics.nodesRemoved, 0)
})

test("rename ambiguo conserva add y remove", async () => {
  const duplicatedTree = tree("Duplicado")
  const initial = plan([
    page("home"),
    page("about", duplicatedTree),
    page("services", clone(duplicatedTree)),
  ])
  const metrics = await measure(initial, [
    { slug: "home", tree: tree() },
    { slug: "nosotros", tree: clone(duplicatedTree) },
    { slug: "servicios", tree: clone(duplicatedTree) },
  ])

  assert.equal(metrics.pagesRenamed, 0)
  assert.equal(metrics.pagesAdded, 2)
  assert.equal(metrics.pagesRemoved, 2)
})

test("arrays iguales en theme no marcan cambios", async () => {
  const themeWithArrays = {
    ...baseTheme,
    breakpoints: ["640px", "1024px"],
    nested: { values: [1, 2, 3] },
  }
  const metrics = await measure(plan(undefined, themeWithArrays as GlobalTheme), undefined, clone(themeWithArrays))

  assert.equal(metrics.themeChanged, false)
  assert.equal(metrics.themeChangedKeys, 0)
})

test("cambio dentro de array en theme marca un cambio", async () => {
  const themeWithArrays = {
    ...baseTheme,
    breakpoints: ["640px", "1024px"],
  }
  const currentTheme = {
    ...themeWithArrays,
    breakpoints: ["640px", "1280px"],
  }
  const metrics = await measure(plan(undefined, themeWithArrays as GlobalTheme), undefined, currentTheme)

  assert.equal(metrics.themeChanged, true)
  assert.equal(metrics.themeChangedKeys, 1)
})

test("nested arrays en theme se comparan sin falsos positivos", async () => {
  const themeWithNestedArrays = {
    ...baseTheme,
    nested: { values: [{ size: "sm" }, { size: "lg" }] },
  }
  const currentTheme = {
    ...themeWithNestedArrays,
    nested: { values: [{ size: "sm" }, { size: "xl" }] },
  }
  const unchanged = await measure(plan(undefined, themeWithNestedArrays as GlobalTheme), undefined, clone(themeWithNestedArrays))
  const changed = await measure(plan(undefined, themeWithNestedArrays as GlobalTheme), undefined, currentTheme)

  assert.equal(unchanged.themeChanged, false)
  assert.equal(changed.themeChanged, true)
  assert.equal(changed.themeChangedKeys, 1)
})

test("metricas no guardan valores del theme ni copy", async () => {
  const secretText = "Texto privado unico"
  const secretColor = "#ABC123"
  const initial = plan()
  const changed = tree(secretText)
  const metrics = await measure(initial, [{ slug: "home", tree: changed }], {
    ...baseTheme,
    colors: { ...baseTheme.colors, primary: secretColor },
  })
  const serialized = JSON.stringify(metrics)

  assert.equal(serialized.includes(secretText), false)
  assert.equal(serialized.includes(secretColor), false)
  assert.equal(serialized.includes("primary"), false)
})

test("editDistance siempre queda entre 0 y 1", async () => {
  const initialPages = Array.from({ length: 4 }, (_, index) => page(index === 0 ? "home" : `pagina-${index}`, treeWithExtraNodes(5, `Inicial ${index}`)))
  const metrics = await measure(plan(initialPages), [])

  assert.ok(metrics.editDistance >= 0)
  assert.ok(metrics.editDistance <= 1)
})

test("theme sin cambios no marca cambios de theme", async () => {
  const metrics = await measure(plan())

  assert.equal(metrics.themeChanged, false)
  assert.equal(metrics.themeChangedKeys, 0)
})

test("theme modificado marca solo conteos agregados", async () => {
  const metrics = await measure(plan(), undefined, {
    ...baseTheme,
    colors: { ...baseTheme.colors, primary: "#000000" },
  })

  assert.equal(metrics.themeChanged, true)
  assert.equal(metrics.themeChangedKeys, 1)
})
