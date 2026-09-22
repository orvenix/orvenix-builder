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
// V2-2.1: asset quality + provenance correction, driven by the real-provider
// E2E findings -- (1) provenance was computed but never persisted onto the
// node, (2) a strongly-portrait source could be selected for a landscape
// hero, (3) the "creative" family's fallback search intent returned a weak
// result. All tests use injected/mocked provider adapters -- zero real
// network calls.
// ---------------------------------------------------------------------------

type CandidateFixture = {
  provider: string
  providerAssetId: string
  src: string
  width: number
  height: number
  photographer?: string
  photographerUrl?: string
  attributionUrl?: string
  dominantColor?: string
}

function candidate(id: string, overrides: Partial<CandidateFixture> = {}): CandidateFixture {
  return {
    provider: "pexels",
    providerAssetId: id,
    src: `https://images.pexels.com/photos/${id}/photo.jpg`,
    width: 1200,
    height: 800,
    photographer: `Photographer ${id}`,
    photographerUrl: `https://www.pexels.com/@photographer-${id}`,
    attributionUrl: `https://www.pexels.com/photo/${id}/`,
    dominantColor: "#334155",
    ...overrides,
  }
}

function mockProvider(opts: {
  available?: boolean
  impl?: (query: string, options?: { perPage?: number; orientation?: string }) => Promise<CandidateFixture[]> | CandidateFixture[]
}) {
  const calls: Array<{ query: string; options?: { perPage?: number; orientation?: string } }> = []
  return {
    provider: {
      name: "mock",
      isAvailable: () => opts.available ?? true,
      async search(query: string, options?: { perPage?: number; orientation?: string }) {
        calls.push({ query, options })
        return opts.impl ? await opts.impl(query, options) : []
      },
    },
    calls,
  }
}

function fakeTree(nodes: Record<string, { type: string; props: Record<string, unknown> }>): EditorTree {
  const rootId = "root"
  const fullNodes: Record<string, { id: string; type: string; props: Record<string, unknown>; children: string[]; version: number }> = {
    [rootId]: { id: rootId, type: "genericWrapper", props: {}, children: Object.keys(nodes), version: 1 },
  }
  for (const [id, node] of Object.entries(nodes)) {
    fullNodes[id] = { id, type: node.type, props: node.props, children: [], version: 1 }
  }
  return { rootId, nodes: fullNodes } as unknown as EditorTree
}

// ---------------------------------------------------------------------------
// A/B/C/D: provenance persistence
// ---------------------------------------------------------------------------

test("V2-2.1 A) provenance sobrevive del resolver hacia los NodeProps de la imagen", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({ impl: () => [candidate("1", { photographer: "Jane Doe", dominantColor: "#0d47a1" })] })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  const asset = home.heroImg.props.asset as Record<string, unknown>

  assert.equal(asset.provider, "pexels")
  assert.equal(asset.providerAssetId, "1")
  assert.equal(asset.photographer, "Jane Doe")
  assert.equal(asset.photographerUrl, "https://www.pexels.com/@photographer-1")
  assert.equal(asset.attributionUrl, "https://www.pexels.com/photo/1/")
  assert.equal(asset.width, 1200)
  assert.equal(asset.height, 800)
  assert.equal(asset.dominantColor, "#0d47a1")
})

test("V2-2.1 B) provenance sobrevive la serializacion de Plan V2 (JSON.stringify/parse no la pierde)", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({ impl: () => [candidate("1")] })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const roundTripped = JSON.parse(JSON.stringify(result))
  const asset = roundTripped[0].tree.nodes.heroImg.props.asset

  assert.equal(asset.providerAssetId, "1")
  assert.equal(asset.provider, "pexels")
})

test("V2-2.1 C) Confirm (sin re-consultar al provider) sigue sin tocar el modulo de assets -- la provenance persistida no depende de una nueva consulta", async () => {
  const previewServiceSource = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/site-creation/preview-service.ts"),
    "utf-8",
  )
  assert.ok(!previewServiceSource.includes("resolve-tree-assets"))
  assert.ok(!previewServiceSource.includes("pexels"))
  assert.ok(!previewServiceSource.includes("asset-plan"))
})

test("V2-2.1 D) ningun secreto ni respuesta cruda del provider se persiste en el nodo -- solo los campos de provenance declarados", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({
    impl: () => [candidate("1", { photographer: "Jane Doe" })],
  })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  const asset = home.heroImg.props.asset as Record<string, unknown>

  const allowedKeys = new Set(["provider", "providerAssetId", "photographer", "photographerUrl", "attributionUrl", "width", "height", "dominantColor"])
  for (const key of Object.keys(asset)) assert.ok(allowedKeys.has(key), `unexpected key '${key}' persisted in asset provenance`)

  const serialized = JSON.stringify(home.heroImg.props)
  assert.ok(!serialized.toLowerCase().includes("apikey"))
  assert.ok(!serialized.toLowerCase().includes("api_key"))
})

// ---------------------------------------------------------------------------
// E/F/G/H/I/J: geometry/orientation selection policy
// ---------------------------------------------------------------------------

test("V2-2.1 E) hero prefiere el candidato paisaje sobre uno retrato, aunque el retrato aparezca primero en la respuesta del provider", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({
    impl: () => [
      candidate("portrait", { width: 4016, height: 6016 }),
      candidate("landscape", { width: 1200, height: 800 }),
    ],
  })

  const [selected] = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "creative" }, count: 1 })
  assert.equal(selected.providerAssetId, "landscape")
})

test("V2-2.1 F) si TODOS los candidatos son retrato, hero aun asi selecciona el menos malo en vez de quedarse sin imagen", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({
    impl: () => [candidate("p1", { width: 4016, height: 6016 }), candidate("p2", { width: 3000, height: 5000 })],
  })

  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "creative" }, count: 1 })
  assert.equal(result.length, 1, "degrada de forma segura: sigue eligiendo un candidato, nunca deja el hero vacio solo por ser retrato")
})

test("V2-2.1 G) galeria tolera geometria mas amplia que hero (cuadrado/retrato moderado no se penalizan)", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({
    impl: () => [candidate("square", { width: 1000, height: 1000 }), candidate("portrait-mod", { width: 800, height: 1000 })],
  })

  const result = await resolveAssetPlan({ provider, role: "gallery", context: { visualFamily: "hospitality" }, count: 2 })
  const ids = result.map((item) => item.providerAssetId).sort()
  assert.deepEqual(ids, ["portrait-mod", "square"], "ambos se mantienen -- geometria moderada no se descarta para galeria")
})

test("V2-2.1 H) dimensiones invalidas (0 o ausentes) se manejan de forma segura, no rompen la seleccion", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({
    impl: () => [candidate("zero-height", { height: 0 }), candidate("valid", { width: 1200, height: 800 })],
  })

  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.equal(result.length, 1)
  assert.equal(result[0].providerAssetId, "valid", "el candidato con geometria invalida queda en el peor rango, no crashea ni se prioriza")
})

test("V2-2.1 I) la solicitud al provider para hero pide orientation=landscape; galeria no restringe orientacion", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")

  const hero = mockProvider({ impl: () => [candidate("1")] })
  await resolveAssetPlan({ provider: hero.provider, role: "hero", context: { visualFamily: "creative" }, count: 1 })
  assert.equal(hero.calls[0]?.options?.orientation, "landscape")

  const gallery = mockProvider({ impl: () => [candidate("1")] })
  await resolveAssetPlan({ provider: gallery.provider, role: "gallery", context: { visualFamily: "hospitality" }, count: 1 })
  assert.equal(gallery.calls[0]?.options?.orientation, undefined)
})

test("V2-2.1 J) la seleccion sigue siendo deterministica para un conjunto de candidatos fijo (sin Math.random)", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const fixedCandidates = [candidate("a", { width: 4016, height: 6016 }), candidate("b", { width: 1200, height: 800 }), candidate("c", { width: 1000, height: 1000 })]

  const results = []
  for (let i = 0; i < 5; i += 1) {
    const { provider } = mockProvider({ impl: () => fixedCandidates })
    const [selected] = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "creative" }, count: 1 })
    results.push(selected.providerAssetId)
  }
  assert.ok(results.every((id) => id === results[0]))
})

// ---------------------------------------------------------------------------
// K/L: regression safety
// ---------------------------------------------------------------------------

test("V2-2.1 K) el fallback existente por fallo del provider sigue funcionando igual tras los cambios de geometria/orientacion", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({ impl: () => { throw new Error("network timeout") } })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.deepEqual(result, [])
})

test("V2-2.1 L) inferSiteType y VisualFamily (V2-1/V2-1.1) permanecen intactos tras V2-2.1", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseno",
    business: {
      name: "Estudio Norte",
      industry: "diseno grafico",
      location: "Guadalajara",
      description: "Disenamos logotipos, identidad visual y sitios web para negocios en Guadalajara.",
      objective: "Conseguir solicitudes de cotizacion",
    },
  })
  assert.equal(architecture.siteType, "business")
  assert.equal(inferVisualFamily({ industry: "diseno grafico" }), "creative")
})
