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
// V2-2: Asset Intelligence V1 (Pexels stock photography). All tests use
// injected/mocked provider adapters -- zero real network calls. Covers the
// vendor-neutral contract (types.ts), deterministic search-intent
// (search-intent.ts), selection/fallback policy (asset-plan.ts), the tree
// post-processing pass (resolve-tree-assets.ts), and the failure-first
// matrix (V2-2 Section 13) plus success matrix (Section 14).
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
  impl?: (query: string, options?: { perPage?: number }) => Promise<CandidateFixture[]> | CandidateFixture[]
}) {
  const calls: string[] = []
  return {
    provider: {
      name: "mock",
      isAvailable: () => opts.available ?? true,
      async search(query: string, options?: { perPage?: number }) {
        calls.push(query)
        const result = opts.impl ? await opts.impl(query, options) : []
        return result
      },
    },
    calls,
  }
}

// ---------------------------------------------------------------------------
// search-intent.ts
// ---------------------------------------------------------------------------

test("V2-2 A) search-intent: industria de fisioterapia produce intent especifico de salud", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({ visualFamily: "health", industry: "fisioterapia", role: "hero" })
  assert.equal(hierarchy[0], "physical therapy clinic")
})

test("V2-2 B) search-intent: restaurante produce intent de hospitalidad", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({ visualFamily: "hospitality", industry: "restaurante", role: "hero" })
  assert.equal(hierarchy[0], "restaurant dining")
})

test("V2-2 C) search-intent: diseno grafico produce intent creativo", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({ visualFamily: "creative", industry: "diseno grafico", role: "hero" })
  assert.equal(hierarchy[0], "graphic design studio")
})

test("V2-2 D) search-intent: negocio sin industria reconocible cae a intent de familia visual, luego generico de rol", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({ visualFamily: "professional", industry: "consultoria general", role: "hero" })
  assert.deepEqual(hierarchy, ["modern office business", "professional team business"])
})

test("V2-2 E) search-intent: servicios estructurados tambien alimentan el intent especifico (no solo industry)", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hierarchy = buildSearchIntentHierarchy({
    visualFamily: "health",
    industry: "salud",
    services: [{ name: "Rehabilitacion fisica" }],
    role: "hero",
  })
  assert.ok(hierarchy.includes("rehabilitation clinic"))
})

test("V2-2 F) search-intent: intent difiere entre hero y gallery en el fallback generico final", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const hero = buildSearchIntentHierarchy({ visualFamily: "professional", role: "hero" })
  const gallery = buildSearchIntentHierarchy({ visualFamily: "professional", role: "gallery" })
  assert.notDeepEqual(hero, gallery)
})

test("V2-2 G) search-intent: longitud acotada y determinismo (misma entrada -> misma salida)", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  const input = { visualFamily: "health", industry: "fisioterapia", role: "hero" as const }
  const a = buildSearchIntentHierarchy(input)
  const b = buildSearchIntentHierarchy(input)
  assert.deepEqual(a, b)
  for (const intent of a) assert.ok(intent.length <= 60)
})

test("V2-2 H) search-intent: nunca recibe prompt libre, nombre de negocio, ubicacion, email/telefono (no existen esos campos en el contexto)", async () => {
  const { buildSearchIntentHierarchy } = await import("../../lib/orvenix-ai/assets/search-intent")
  // AssetSearchContext (see types.ts) has no businessName/location/email/phone/description
  // fields at all -- passing them has no effect, which is itself the guarantee.
  const withExtra = buildSearchIntentHierarchy({
    visualFamily: "creative",
    industry: "diseno grafico",
    role: "hero",
    businessName: "Estudio Norte",
    location: "Guadalajara",
  } as never)
  const withoutExtra = buildSearchIntentHierarchy({ visualFamily: "creative", industry: "diseno grafico", role: "hero" })
  assert.deepEqual(withExtra, withoutExtra)
})

// ---------------------------------------------------------------------------
// asset-plan.ts -- selection policy + failure-first matrix (Section 13)
// ---------------------------------------------------------------------------

test("V2-2 I) resolveAssetPlan: sin provider disponible (sin API key) devuelve [] sin llamar search", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider, calls } = mockProvider({ available: false })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.deepEqual(result, [])
  assert.equal(calls.length, 0)
})

test("V2-2 J) resolveAssetPlan: provider.search lanza excepcion (timeout/outage) -> [] sin propagar el error", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({ impl: () => { throw new Error("network timeout") } })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.deepEqual(result, [])
})

test("V2-2 K) resolveAssetPlan: respuesta vacia (0 fotos, ej. 429 cuota agotada) -> []", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({ impl: () => [] })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.deepEqual(result, [])
})

test("V2-2 L) resolveAssetPlan: candidatos sin provenance (photographer/attributionUrl faltantes) se descartan", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({
    impl: () => [candidate("1", { photographer: undefined }), candidate("2", { attributionUrl: undefined })],
  })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  assert.deepEqual(result, [])
})

test("V2-2 M) resolveAssetPlan: candidatos con provenance completa se seleccionan; primer tier con resultados utiles gana", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider, calls } = mockProvider({ impl: (query) => (query === "physical therapy clinic" ? [candidate("1")] : []) })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health", industry: "fisioterapia" }, count: 1 })
  assert.equal(result.length, 1)
  assert.equal(result[0].providerAssetId, "1")
  assert.equal(result[0].searchIntent, "physical therapy clinic")
  assert.equal(calls.length, 1, "un solo tier con resultados utiles -> una sola llamada, no una por imagen")
})

test("V2-2 N) resolveAssetPlan: primer tier vacio hace fallback al siguiente tier de la jerarquia", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider, calls } = mockProvider({
    impl: (query) => (query === "healthcare clinic professional" ? [candidate("1")] : []),
  })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health", industry: "fisioterapia" }, count: 1 })
  assert.equal(result.length, 1)
  assert.equal(calls.length, 2, "tier especifico vacio, tier de familia visual tiene resultados -> 2 llamadas")
})

test("V2-2 O) resolveAssetPlan: URL no-HTTPS o host inesperado ya no llega aqui (responsabilidad del provider adapter), pero un candidato malformado igual se ignora limpiamente", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({ impl: () => [candidate("1", { src: "" as unknown as string })] })
  const result = await resolveAssetPlan({ provider, role: "hero", context: { visualFamily: "health" }, count: 1 })
  // asset-plan.ts trusts the provider boundary to have already validated URLs (see pexels-provider.ts);
  // it does not re-validate src here, so this documents that boundary rather than re-testing it.
  assert.equal(result.length, 1)
})

test("V2-2 P) resolveAssetPlan: count=0 devuelve [] sin llamar al provider", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider, calls } = mockProvider({ impl: () => [candidate("1")] })
  const result = await resolveAssetPlan({ provider, role: "gallery", context: { visualFamily: "health" }, count: 0 })
  assert.deepEqual(result, [])
  assert.equal(calls.length, 0)
})

test("V2-2 Q) resolveAssetPlan (galeria): candidatos duplicados en la respuesta del provider se deduplican por providerAssetId", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider } = mockProvider({ impl: () => [candidate("1"), candidate("1"), candidate("2")] })
  const result = await resolveAssetPlan({ provider, role: "gallery", context: { visualFamily: "hospitality" }, count: 3 })
  const ids = result.map((item) => item.providerAssetId)
  assert.deepEqual(ids, ["1", "2"], "solo 2 candidatos distintos disponibles, no se duplica el 1 para llegar a 3")
})

test("V2-2 R) resolveAssetPlan (galeria): un solo query cubre todo el lote, nunca uno por imagen", async () => {
  const { resolveAssetPlan } = await import("../../lib/orvenix-ai/assets/asset-plan")
  const { provider, calls } = mockProvider({
    impl: () => [candidate("1"), candidate("2"), candidate("3"), candidate("4")],
  })
  const result = await resolveAssetPlan({ provider, role: "gallery", context: { visualFamily: "hospitality" }, count: 4 })
  assert.equal(result.length, 4)
  assert.equal(calls.length, 1)
})

// ---------------------------------------------------------------------------
// resolve-tree-assets.ts -- tree post-processing pass
// ---------------------------------------------------------------------------

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

test("V2-2 S) resolveTreeImageAssets: rellena hero y galeria cuando el provider esta disponible", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  // Hero and gallery for the same family+industry can legitimately share a
  // search-intent tier string (only the final generic fallback differs by
  // role) -- so the mock distinguishes calls by order (hero resolves
  // first, then gallery), not by query content.
  let callIndex = 0
  const { provider } = mockProvider({
    impl: () => {
      callIndex += 1
      return callIndex === 1 ? [candidate("hero-1")] : [candidate("g-1"), candidate("g-2")]
    },
  })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({
        heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } },
        g1: { type: "image", props: { src: "", alt: "Imagen del negocio 1" } },
        g2: { type: "image", props: { src: "", alt: "Imagen del negocio 2" } },
      }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "professional", businessName: "Acme" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>

  assert.equal(home.heroImg.props.src, "https://images.pexels.com/photos/hero-1/photo.jpg")
  assert.notEqual(home.heroImg.props.alt, "")
  assert.equal(home.g1.props.src, "https://images.pexels.com/photos/g-1/photo.jpg")
  assert.equal(home.g2.props.src, "https://images.pexels.com/photos/g-2/photo.jpg")
})

test("V2-2 T) resolveTreeImageAssets: provider no disponible preserva el placeholder actual (src vacio) sin lanzar", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({ available: false })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  assert.equal(home.heroImg.props.src, "")
})

test("V2-2 U) resolveTreeImageAssets: nodos ya poblados (src no vacio) nunca se sobrescriben", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider, calls } = mockProvider({ impl: () => [candidate("1")] })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({
        heroImg: { type: "image", props: { src: "https://example.com/already-set.jpg", alt: "Imagen principal del negocio" } },
      }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  assert.equal(home.heroImg.props.src, "https://example.com/already-set.jpg")
  assert.equal(calls.length, 0, "no placeholder found -> resolver never calls the provider")
})

test("V2-2 V) resolveTreeImageAssets: nodos no-imagen y otros props nunca se tocan", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({ impl: () => [candidate("1")] })

  const pages = [
    {
      name: "Home",
      slug: "home",
      tree: fakeTree({
        heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover", width: 800 } },
        heading: { type: "heading", props: { text: "Bienvenido" } },
      }),
    },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "health" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  assert.equal(home.heading.props.text, "Bienvenido")
  assert.equal(home.heroImg.props.objectFit, "cover")
  assert.equal(home.heroImg.props.width, 800)
})

test("V2-2 W) resolveTreeImageAssets: unicidad de galeria es por pagina (se reinicia entre paginas)", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")
  const { provider } = mockProvider({ impl: () => [candidate("shared-1")] })

  const pages = [
    { name: "Home", slug: "home", tree: fakeTree({ g1: { type: "image", props: { src: "", alt: "Imagen del negocio 1" } } }) },
    { name: "Servicios", slug: "servicios", tree: fakeTree({ g1: { type: "image", props: { src: "", alt: "Imagen del negocio 1" } } }) },
  ]

  const result = await resolveTreeImageAssets(pages, { provider, visualFamily: "hospitality" })
  const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
  const servicios = result[1].tree.nodes as Record<string, { props: Record<string, unknown> }>
  assert.equal(home.g1.props.src, "https://images.pexels.com/photos/shared-1/photo.jpg")
  assert.equal(servicios.g1.props.src, "https://images.pexels.com/photos/shared-1/photo.jpg")
})

// ---------------------------------------------------------------------------
// Success matrix (Section 14) + Local evidence with the 3 benchmark
// fixtures (Section 17), all via injected mocks -- no network calls.
// ---------------------------------------------------------------------------

const BENCHMARK_FIXTURES = {
  FISIOTERAPIA: { visualFamily: "health", industry: "fisioterapia", businessName: "Centro de Fisioterapia Monterrey" },
  SABORES_DEL_VALLE: { visualFamily: "hospitality", industry: "restaurante", businessName: "Sabores del Valle" },
  ESTUDIO_NORTE: { visualFamily: "creative", industry: "diseno grafico", businessName: "Estudio Norte" },
}

test("V2-2 X) evidencia local (mock): Fisioterapia/Sabores del Valle/Estudio Norte producen hero src distinto y provenance", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")

  const results: Record<string, { src: unknown; intent: string }> = {}

  for (const [key, fixture] of Object.entries(BENCHMARK_FIXTURES)) {
    const { provider, calls } = mockProvider({ impl: () => [candidate(`${key}-1`)] })
    const pages = [
      {
        name: "Home",
        slug: "home",
        tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
      },
    ]

    const result = await resolveTreeImageAssets(pages, { provider, visualFamily: fixture.visualFamily, industry: fixture.industry, businessName: fixture.businessName })
    const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
    results[key] = { src: home.heroImg.props.src, intent: calls[0] }
  }

  assert.equal(results.FISIOTERAPIA.intent, "physical therapy clinic")
  assert.equal(results.SABORES_DEL_VALLE.intent, "restaurant dining")
  assert.equal(results.ESTUDIO_NORTE.intent, "graphic design studio")

  const srcs = new Set(Object.values(results).map((r) => r.src))
  assert.equal(srcs.size, 3, "las 3 fixtures deben resolver assets distintos")
})

test("V2-2 Y) evidencia local: con provider no disponible, las 3 fixtures conservan el placeholder (generacion nunca falla)", async () => {
  const { resolveTreeImageAssets } = await import("../../lib/orvenix-ai/assets/resolve-tree-assets")

  for (const fixture of Object.values(BENCHMARK_FIXTURES)) {
    const { provider } = mockProvider({ available: false })
    const pages = [
      {
        name: "Home",
        slug: "home",
        tree: fakeTree({ heroImg: { type: "image", props: { src: "", alt: "Imagen principal del negocio", objectFit: "cover" } } }),
      },
    ]

    const result = await resolveTreeImageAssets(pages, { provider, visualFamily: fixture.visualFamily, industry: fixture.industry, businessName: fixture.businessName })
    const home = result[0].tree.nodes as Record<string, { props: Record<string, unknown> }>
    assert.equal(home.heroImg.props.src, "")
  }
})

test("V2-2 Z) regresion de pipeline completo: runAutonomousMultiPageSiteBuilder sigue generando exitosamente para las 3 fixtures sin PEXELS_API_KEY (entorno real de test)", async () => {
  assert.equal(process.env.PEXELS_API_KEY, undefined, "este test asume el entorno de test sin PEXELS_API_KEY, igual que produccion/E2E hoy")

  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  for (const fixture of [
    { name: "Centro de Fisioterapia Monterrey", industry: "fisioterapia", location: "Monterrey" },
    { name: "Sabores del Valle", industry: "restaurante", location: "Puebla" },
    { name: "Estudio Norte", industry: "diseno grafico", location: "Guadalajara" },
  ]) {
    const result = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: fixture })
    assert.equal(result.ok, true)
    const home = result.plan.pages.find((p) => p.isHome)!
    const heroImages = Object.values(home.tree.nodes).filter((n) => n.type === "image" && n.props?.alt === "Imagen principal del negocio")
    for (const image of heroImages) assert.equal(image.props.src, "", "sin API key, el placeholder existente se preserva exactamente")
  }
})

// ---------------------------------------------------------------------------
// pexels-provider.ts -- the one module allowed to call fetch. Every test
// here monkey-patches globalThis.fetch to a local stub (no real network
// call ever leaves the process) to exercise the provider boundary itself:
// auth header, timeout, retry, response-shape validation, and URL/host
// safety (V2-2 Section 4 + Section 13 items C/D/E/F/H/I).
// ---------------------------------------------------------------------------

function withMockFetch<T>(impl: (url: string, init?: RequestInit) => Promise<Response> | Response, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch
  globalThis.fetch = (async (url: string, init?: RequestInit) => impl(url, init)) as typeof fetch
  return run().finally(() => {
    globalThis.fetch = original
  })
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}

test("V2-2 AB) pexels-provider: sin PEXELS_API_KEY, isAvailable() es false y search() nunca llama fetch", async () => {
  const original = process.env.PEXELS_API_KEY
  delete process.env.PEXELS_API_KEY
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const provider = createPexelsProvider()
    assert.equal(provider.isAvailable(), false)

    let fetchCalled = false
    await withMockFetch(
      () => { fetchCalled = true; return jsonResponse({ photos: [] }) },
      async () => provider.search("test query"),
    )
    assert.equal(fetchCalled, false)
  } finally {
    if (original) process.env.PEXELS_API_KEY = original
  }
})

test("V2-2 AC) pexels-provider: envia la API key en el header Authorization, nunca en la URL", async () => {
  process.env.PEXELS_API_KEY = "secret-test-key"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const provider = createPexelsProvider()

    let seenUrl = ""
    let seenAuthHeader: string | null = null
    await withMockFetch(
      (url, init) => {
        seenUrl = url
        const headers = init?.headers as Record<string, string> | Headers | undefined
        seenAuthHeader = headers instanceof Headers ? headers.get("Authorization") : (headers as Record<string, string>)?.Authorization ?? null
        return jsonResponse({ photos: [] })
      },
      async () => provider.search("physical therapy clinic"),
    )

    assert.ok(!seenUrl.includes("secret-test-key"), "API key must never appear in the request URL")
    assert.equal(seenAuthHeader, "secret-test-key")
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AD) pexels-provider: HTTP 401/403 -> [] sin reintentar (no transitorio)", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    let callCount = 0
    const result = await withMockFetch(
      () => { callCount += 1; return jsonResponse({ error: "Unauthorized" }, 401) },
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
    assert.equal(callCount, 1)
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AE) pexels-provider: HTTP 429 (cuota) -> [] sin reintentar", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    let callCount = 0
    const result = await withMockFetch(
      () => { callCount += 1; return jsonResponse({ error: "Too Many Requests" }, 429) },
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
    assert.equal(callCount, 1)
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AF) pexels-provider: HTTP 5xx (outage) reintenta como maximo una vez, luego [] sin lanzar", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    let callCount = 0
    const result = await withMockFetch(
      () => { callCount += 1; return jsonResponse({ error: "Internal Server Error" }, 503) },
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
    assert.equal(callCount, 2, "1 intento inicial + 1 reintento, nunca una tormenta de reintentos")
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AG) pexels-provider: JSON malformado/forma inesperada -> [] sin lanzar", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => new Response("not json", { status: 200 }),
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])

    const result2 = await withMockFetch(
      () => jsonResponse({ unexpected: "shape" }),
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result2, [])
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AH) pexels-provider: array de fotos vacio -> []", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => jsonResponse({ photos: [] }),
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AI) pexels-provider: URL no-HTTPS se rechaza (candidato ignorado, no crash)", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => jsonResponse({
        photos: [{
          id: 1, width: 1200, height: 800, url: "https://www.pexels.com/photo/1/",
          photographer: "A", photographer_url: "https://www.pexels.com/@a",
          src: { large2x: "http://images.pexels.com/photos/1/photo.jpg", large: "http://images.pexels.com/photos/1/photo.jpg" },
        }],
      }),
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AJ) pexels-provider: host inesperado (no *.pexels.com) se rechaza", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => jsonResponse({
        photos: [{
          id: 1, width: 1200, height: 800, url: "https://www.pexels.com/photo/1/",
          photographer: "A", photographer_url: "https://www.pexels.com/@a",
          src: { large2x: "https://evil-mirror.example.com/photos/1/photo.jpg", large: "https://evil-mirror.example.com/photos/1/photo.jpg" },
        }],
      }),
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AK) pexels-provider: fetch que lanza (network error/abort) -> [] sin propagar", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => { throw new Error("ECONNRESET") },
      async () => createPexelsProvider().search("q"),
    )
    assert.deepEqual(result, [])
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AL) pexels-provider: respuesta valida se normaliza a ProviderCandidate (host CDN correcto)", async () => {
  process.env.PEXELS_API_KEY = "k"
  try {
    const { createPexelsProvider } = await import("../../lib/orvenix-ai/assets/pexels-provider")
    const result = await withMockFetch(
      () => jsonResponse({
        photos: [{
          id: 42, width: 1200, height: 800, avg_color: "#0d47a1",
          url: "https://www.pexels.com/photo/42/",
          photographer: "Jane Doe", photographer_url: "https://www.pexels.com/@jane",
          src: { large2x: "https://images.pexels.com/photos/42/photo.jpeg", large: "https://images.pexels.com/photos/42/photo-large.jpeg" },
        }],
      }),
      async () => createPexelsProvider().search("q"),
    )
    assert.equal(result.length, 1)
    assert.equal(result[0].provider, "pexels")
    assert.equal(result[0].providerAssetId, "42")
    assert.equal(result[0].src, "https://images.pexels.com/photos/42/photo.jpeg")
    assert.equal(result[0].photographer, "Jane Doe")
    assert.equal(result[0].dominantColor, "#0d47a1")
  } finally {
    delete process.env.PEXELS_API_KEY
  }
})

test("V2-2 AA) Confirm nunca vuelve a consultar al provider: el AssetPlan resuelto ya esta embebido en el Plan V2 persistido antes de Confirm", async () => {
  // Structural guarantee, not a network assertion: resolveTreeImageAssets
  // runs inside runAutonomousMultiPageSiteBuilder BEFORE createMultiPagePlan
  // builds the persisted plan (see autonomous/site-builder.ts). Confirm
  // (createDraftSiteFromPersistedPreview) reads that persisted plan.pages[].tree
  // verbatim and never calls the asset-resolution module at all.
  const siteBuilderSource = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/autonomous/site-builder.ts"),
    "utf-8",
  )
  const previewServiceSource = fs.readFileSync(
    path.join(process.cwd(), "lib/orvenix-ai/site-creation/preview-service.ts"),
    "utf-8",
  )

  const resolveCallIndex = siteBuilderSource.indexOf("resolveTreeImageAssets(rawPages")
  const planCallIndex = siteBuilderSource.indexOf("createMultiPagePlan({")
  assert.ok(resolveCallIndex > -1 && planCallIndex > -1 && resolveCallIndex < planCallIndex, "asset resolution must run before the plan is built")

  assert.ok(!previewServiceSource.includes("resolve-tree-assets"), "Confirm-path module must never import the asset-resolution module")
  assert.ok(!previewServiceSource.includes("pexels"), "Confirm-path module must never import the Pexels adapter")
})
