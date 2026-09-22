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

// ---------------------------------------------------------------------------
// V2-2 closeout: minimum compliant Pexels attribution. Tests the PURE
// logic in lib/orvenix-ai/assets/attribution.ts only -- the same
// test-runtime boundary already established for V1/V2-1 (business logic
// gets node --test coverage; actual JSX/rendering was verified manually
// against the real Next dev server, matching how this project has drawn
// this line throughout, since components/*.tsx pulling in next/link is
// not safe to compile through the plain-Node test graph -- the same class
// of risk that forced the font-catalog/font-registry split in V2-1).
// ---------------------------------------------------------------------------

function fakeTree(nodeDefs: Array<{ type?: string; props: Record<string, unknown> }>) {
  const rootId = "root"
  const nodes: Record<string, unknown> = {
    [rootId]: { id: rootId, type: "genericWrapper", props: {}, children: nodeDefs.map((_, i) => `n${i}`), version: 1 },
  }
  nodeDefs.forEach((def, i) => {
    nodes[`n${i}`] = { id: `n${i}`, type: def.type ?? "image", props: def.props, children: [], version: 1 }
  })
  return { rootId, nodes } as never
}

test("V2-2 closeout A) asset de Pexels presente -> atribucion requerida presente", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const tree = fakeTree([{ props: { src: "https://images.pexels.com/photos/1/x.jpg", asset: { provider: "pexels", providerAssetId: "1" } } }])

  const attributions = resolveTreeAttributions(tree)
  assert.equal(attributions.length, 1)
  assert.equal(attributions[0].provider, "pexels")
  assert.ok(attributions[0].href.includes("pexels.com"))
  assert.ok(attributions[0].label.length > 0)
})

test("V2-2 closeout B) multiples assets de Pexels -> una sola atribucion a nivel de sitio, sin duplicados", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const tree = fakeTree([
    { props: { src: "https://images.pexels.com/photos/1/x.jpg", asset: { provider: "pexels", providerAssetId: "1" } } },
    { props: { src: "https://images.pexels.com/photos/2/x.jpg", asset: { provider: "pexels", providerAssetId: "2" } } },
    { props: { src: "https://images.pexels.com/photos/3/x.jpg", asset: { provider: "pexels", providerAssetId: "3" } } },
  ])

  const attributions = resolveTreeAttributions(tree)
  assert.equal(attributions.length, 1, "3 assets del mismo provider -> 1 sola entrada de atribucion, no 3")
})

test("V2-2 closeout C) sin assets de Pexels (placeholders vacios) -> sin atribucion", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const tree = fakeTree([
    { props: { src: "", alt: "Imagen principal del negocio" } },
    { props: { src: "", alt: "Imagen del negocio 1" } },
  ])

  assert.deepEqual(resolveTreeAttributions(tree), [])
})

test("V2-2 closeout D) provider fallido (resolveTreeImageAssets no disponible) -> arbol resultante sin atribucion", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")

  const unavailableProvider = { name: "mock", isAvailable: () => false, search: async () => [] }
  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree([{ props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } }]),
    },
  ]

  const result = await resolveTreeImageAssets(pages as never, { provider: unavailableProvider, visualFamily: "health" })
  assert.deepEqual(resolveTreeAttributions(result[0].tree), [], "sin resolucion exitosa, no hay providerAssetId real -> no se genera atribucion falsa")
})

test("V2-2 closeout E) la atribucion lee directamente la provenance ya persistida (asset.provider), sin re-consultar nada", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")

  const provider = {
    name: "mock",
    isAvailable: () => true,
    search: async () => [{
      provider: "pexels",
      providerAssetId: "42",
      src: "https://images.pexels.com/photos/42/x.jpg",
      width: 1200,
      height: 800,
      photographer: "Jane Doe",
      photographerUrl: "https://www.pexels.com/@jane",
      attributionUrl: "https://www.pexels.com/photo/42/",
      dominantColor: "#123456",
    }],
  }

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree([{ props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } }]),
    },
  ]

  const result = await resolveTreeImageAssets(pages as never, { provider, visualFamily: "health" })
  const attributions = resolveTreeAttributions(result[0].tree)
  assert.equal(attributions.length, 1)
  assert.equal(attributions[0].provider, "pexels")
})

test("V2-2 closeout F) fidelidad Preview -> Confirm: el mismo arbol persistido produce siempre la misma atribucion (sin red, deterministico)", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const previewTree = fakeTree([{ props: { src: "https://images.pexels.com/photos/1/x.jpg", asset: { provider: "pexels", providerAssetId: "1" } } }])

  // Confirm persists the exact same tree verbatim (see V2-2.1's structural
  // test proving preview-service.ts never imports the asset-resolution
  // module) -- so calling resolveTreeAttributions on that same tree data
  // again, as Confirm's render path would, must yield an identical result.
  const confirmedTree = JSON.parse(JSON.stringify(previewTree))

  assert.deepEqual(resolveTreeAttributions(previewTree), resolveTreeAttributions(confirmedTree))
})

test("V2-2 closeout G) semantica existente del footer se preserva en el codigo fuente (no se reescribio, solo se agrego una linea condicional)", async () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/SiteCopyrightBar.tsx"), "utf-8")

  assert.ok(source.includes("Todos los derechos reservados"))
  assert.ok(source.includes("Sitio profesional por"))
  assert.ok(source.includes("Potenciado por"))
  assert.ok(source.includes("if (!attributions?.length) return null"), "sin atribuciones, el componente no agrega nada al footer existente")
})

test("V2-2 closeout H) sitios sin assets externos (V1) quedan sin cambios: arbol sin 'asset' en ningun nodo -> []", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const v1Tree = fakeTree([
    { type: "heading", props: { text: "Bienvenido" } },
    { type: "image", props: { src: "https://example.com/manual-upload.jpg", alt: "Foto subida por el usuario" } },
  ])

  assert.deepEqual(resolveTreeAttributions(v1Tree), [])
})

test("V2-2 closeout I) ningun secreto ni dato crudo del provider se expone: la salida solo contiene provider/label/href", async () => {
  const { resolveTreeAttributions } = await import("../../lib/orvenix-ai/assets/attribution")
  const tree = fakeTree([{
    props: {
      src: "https://images.pexels.com/photos/1/x.jpg",
      asset: {
        provider: "pexels",
        providerAssetId: "1",
        photographer: "Jane Doe",
        photographerUrl: "https://www.pexels.com/@jane",
        attributionUrl: "https://www.pexels.com/photo/1/",
        width: 1200,
        height: 800,
        dominantColor: "#123456",
      },
    },
  }])

  const attributions = resolveTreeAttributions(tree)
  const allowedKeys = new Set(["provider", "label", "href"])
  for (const attribution of attributions) {
    for (const key of Object.keys(attribution)) assert.ok(allowedKeys.has(key), `clave inesperada '${key}' en la atribucion`)
  }

  const attributionModuleSource = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/assets/attribution.ts"), "utf-8")
  assert.ok(!attributionModuleSource.includes("process.env"), "el modulo de atribucion nunca debe leer variables de entorno/secretos")
})
