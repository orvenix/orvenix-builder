import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import type { EditorTree } from "@/types/editor"

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

// ---------------------------------------------------------------------------
// V2-S1.1: gallery presentation correction, found during real semantic E2E
// human review. (1) mixed-aspect-ratio Pexels sources produced an
// irregular grid because gallery cells had no fixed frame; (2) the gallery
// subtitle and two other composer copy strings addressed the person
// BUILDING the site ("que puedes reemplazar", "listo para personalizar,
// publicar", "estructura ... editable") instead of the site's own visitor.
// Both are general fixes in section-composer.ts -- no fixture/business-
// specific branching anywhere.
// ---------------------------------------------------------------------------

type Node = { type: string; props?: Record<string, unknown>; children?: string[] }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

// ---------------------------------------------------------------------------
// 1/2/3: gallery frame geometry
// ---------------------------------------------------------------------------

test("V2-S1.1 A) galeria: cada celda tiene un frame de geometria fija (aspect-square), independiente del origen de la imagen", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const gallery = composeSection("gallery", {})
  assert.ok(gallery)
  const nodes = nodesOf(gallery)

  const cellWrappers = Object.values(nodes).filter(
    (n) => n.type === "genericWrapper" && typeof n.props?.className === "string" && n.props.className.includes("aspect-square"),
  )
  assert.equal(cellWrappers.length, 6, "las 6 celdas de la galeria deben declarar un frame de aspect ratio fijo")
})

test("V2-S1.1 B) galeria: la imagen usa comportamiento cover (nunca distorsion) dentro del frame fijo, sin importar orientacion retrato/paisaje del origen", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const gallery = composeSection("gallery", {})
  assert.ok(gallery)
  const nodes = nodesOf(gallery)

  const images = Object.values(nodes).filter((n) => n.type === "image")
  assert.equal(images.length, 6)
  for (const image of images) {
    // objectFit:"cover" + positionMode:"free" (fills the fixed-aspect
    // parent with cover/crop behavior, same primitive the immersive hero
    // variant already uses) -- this combination is orientation-agnostic:
    // nothing here depends on whether the eventually-resolved source
    // photo is portrait or landscape, so both behave identically.
    assert.equal(image.props?.objectFit, "cover")
    assert.equal(image.props?.positionMode, "free")
  }
})

test("V2-S1.1 C) galeria: el frame fijo no depende de negocio/fixture -- identico para cualquier contexto", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const contexts = [{}, { visualFamily: "hospitality", industry: "restaurante" }, { visualFamily: "health", industry: "fisioterapia" }, { visualFamily: "creative", industry: "diseno grafico" }]

  const signatures = new Set<string>()
  for (const context of contexts) {
    const gallery = composeSection("gallery", context)
    const nodes = nodesOf(gallery)
    const cellClassName = Object.values(nodes).find((n) => n.type === "genericWrapper" && typeof n.props?.className === "string" && n.props.className.includes("aspect-square"))?.props?.className
    signatures.add(String(cellClassName))
  }
  assert.equal(signatures.size, 1, "el frame de la celda de galeria debe ser identico sin importar el negocio/familia visual -- ninguna regla especifica de fixture")
})

// ---------------------------------------------------------------------------
// 3/4: provenance and attribution untouched by the presentation fix
// ---------------------------------------------------------------------------

test("V2-S1.1 D) las dimensiones originales de provenance (asset.width/height) permanecen intactas -- el fix es solo de presentacion CSS", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")

  const provider = {
    name: "mock",
    isAvailable: () => true,
    search: async () => [{
      provider: "pexels",
      providerAssetId: "1",
      src: "https://images.pexels.com/photos/1/x.jpg",
      width: 4016,
      height: 6016, // portrait source, on purpose
      photographer: "Jane Doe",
      photographerUrl: "https://www.pexels.com/@jane",
      attributionUrl: "https://www.pexels.com/photo/1/",
    }],
  }

  const nodeId = "n0"
  const rootId = "root"
  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: {
        rootId,
        nodes: {
          [rootId]: { id: rootId, type: "genericWrapper", props: {}, children: [nodeId], version: 1 },
          [nodeId]: { id: nodeId, type: "image", props: { src: "", alt: "Imagen del negocio 1", objectFit: "cover", positionMode: "free" }, children: [], version: 1 },
        },
      } as unknown as EditorTree,
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "hospitality" })
  const node = (result[0].tree.nodes as Record<string, Node>)[nodeId]
  const asset = node.props?.asset as Record<string, unknown>

  assert.equal(asset.width, 4016)
  assert.equal(asset.height, 6016)
})

test("V2-S1.1 E) atribucion de Pexels sigue siendo detectable tras el fix de presentacion", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const tree = {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "genericWrapper", props: {}, children: ["img1"], version: 1 },
      img1: {
        id: "img1",
        type: "image",
        props: { src: "https://images.pexels.com/photos/1/x.jpg", asset: { provider: "pexels", providerAssetId: "1" } },
        children: [],
        version: 1,
      },
    },
  } as never
  const attributions = resolveTreeAttributions(tree)
  assert.equal(attributions.length, 1)
  assert.equal(attributions[0].provider, "pexels")
})

// ---------------------------------------------------------------------------
// 5: builder-facing copy leaks
// ---------------------------------------------------------------------------

const BUILDER_FACING_PATTERNS = [/puedes reemplazar/i, /puedes cambiar/i, /personaliza/i, /listo para personalizar/i, /estructura.*editable/i, /\bedita\b/i, /\bconfigura\b/i]

test("V2-S1.1 F) copia de galeria generada no contiene instrucciones de reemplazo/edicion dirigidas al constructor del sitio", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const gallery = composeSection("gallery", {})
  const nodes = nodesOf(gallery)
  const galleryTexts = Object.values(nodes)
    .filter((n) => n.type === "text")
    .map((n) => String(n.props?.content))

  assert.ok(galleryTexts.length > 0, "la seccion de galeria debe tener al menos un nodo de texto (la intro)")
  for (const text of galleryTexts) {
    for (const pattern of BUILDER_FACING_PATTERNS) {
      assert.ok(!pattern.test(text), `'${text}' coincide con el patron dirigido al constructor: ${pattern}`)
    }
  }
})

test("V2-S1.1 G) footer y content: las 2 fugas adicionales encontradas en la misma auditoria ya no contienen lenguaje dirigido al constructor", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  const footer = composeSection("footer", { businessName: "Negocio X" })
  const footerTexts = Object.values(nodesOf(footer))
    .filter((n) => n.type === "text")
    .map((n) => String(n.props?.content))
  for (const text of footerTexts) {
    for (const pattern of BUILDER_FACING_PATTERNS) {
      assert.ok(!pattern.test(text), `footer: '${text}' coincide con patron dirigido al constructor ${pattern}`)
    }
  }

  const content = composeSection("content", {})
  const contentTexts = Object.values(nodesOf(content))
    .filter((n) => n.type === "text")
    .map((n) => String(n.props?.content))
  for (const text of contentTexts) {
    for (const pattern of BUILDER_FACING_PATTERNS) {
      assert.ok(!pattern.test(text), `content: '${text}' coincide con patron dirigido al constructor ${pattern}`)
    }
  }
})

// ---------------------------------------------------------------------------
// 6/7: V2-S1 semantic behavior + no fixture-specific rules
// ---------------------------------------------------------------------------

test("V2-S1.1 H) comportamiento semantico de V2-S1 (productos/servicios reales, sin fabricacion) permanece sin cambios", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const withDishes = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Cocina Tradicional Puebla", industry: "restaurante de cocina mexicana tradicional", products: [{ name: "Mole poblano" }, { name: "Chiles en nogada" }, { name: "Enchiladas" }] },
  })
  const menu = withDishes.plan.pages.find((p) => p.slug === "menu")!
  const productTitles = Object.values(menu.tree.nodes)
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  assert.ok(productTitles.includes("Mole poblano"))
  assert.ok(productTitles.includes("Chiles en nogada"))
  assert.ok(productTitles.includes("Enchiladas"))

  const withoutDishes = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: { name: "Sabores del Valle", industry: "restaurante", location: "Puebla" },
  })
  const menu2 = withoutDishes.plan.pages.find((p) => p.slug === "menu")!
  const productTitles2 = Object.values(menu2.tree.nodes)
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  for (const dish of ["Mole poblano", "Chiles en nogada", "Enchiladas"]) {
    assert.ok(!productTitles2.includes(dish), `no debio fabricar '${dish}' sin datos supliidos`)
  }
})

test("V2-S1.1 I) sin reglas especificas de fixture en la fuente del composer para el fix de galeria/copia", async () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/composer/section-composer.ts"), "utf-8")
  const forbidden = ["Sabores del Valle", "Cocina Tradicional", "Estudio Norte", "Fisioterapia Monterrey"]
  for (const term of forbidden) {
    assert.ok(!source.includes(term), `section-composer.ts no debe referenciar '${term}'`)
  }
})
