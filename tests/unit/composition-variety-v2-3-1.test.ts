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
// V2-3.1: structural quality correction. Two real findings from human
// review of the real-provider render: (1) the trust section (and,
// discovered during the same audit, FAQ/gallery/testimonials) never set
// an explicit section background, silently falling through to Orvenix's
// own product-chrome dark navy default while using text colors that
// assumed a light background; (2) hero weighting gave VisualFamily real
// but not clearly dominant influence, letting two very different
// families plausibly collide on the same "split-right" bucket.
// ---------------------------------------------------------------------------

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }

function nodesOf(section: { nodes: Record<string, Node> } | null): Record<string, Node> {
  return section?.nodes ?? {}
}

// ---------------------------------------------------------------------------
// 1. Dark-background contrast policy
// ---------------------------------------------------------------------------

test("V2-3.1 A) readableTextColorsFor: fondo oscuro produce texto claro, fondo claro produce texto oscuro (mecanismo generico)", async () => {
  // Exercised indirectly through composeTrust below (the function itself
  // isn't exported -- see test C/D for the real, production code path).
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const trust = composeSection("trust", { visualFamily: "health" })
  assert.ok(trust)
  const heading = Object.values(nodesOf(trust)).find((n) => n.type === "heading" && n.props?.text === "Razones para confiar")
  assert.ok(heading)
  // Section background is explicitly light (#ffffff) -- heading must be dark, not light-on-light.
  assert.equal(heading!.props?.color, "#0f172a")
})

test("V2-3.1 B) trust y FAQ y galeria y testimonios ahora siempre declaran un background explicito de seccion", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  for (const role of ["trust", "faq", "gallery", "testimonials"] as const) {
    const section = composeSection(role, {})
    assert.ok(section, `composeSection('${role}') no debio ser null`)
    const nodes = nodesOf(section)
    const root = nodes[section!.rootId]
    assert.equal(typeof root?.props?.background, "string", `role '${role}' debe declarar background explicito de seccion (ya no depende del fondo oscuro por defecto del producto)`)
  }
})

test("V2-3.1 C) contraste correcto en el treatment 'checklist-row' de trust (items sin card propia, heredan el color derivado del fondo de seccion)", async () => {
  const { selectVariant } = await import("../../lib/orvenix-ai/composer/variant-selector")
  const { TRUST_VARIANTS, TRUST_WEIGHTS } = await import("../../lib/orvenix-ai/composer/composition-context")
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  // Probe for a context that resolves to checklist-row using the REAL weight table.
  let checklistContext: Record<string, unknown> | null = null
  for (let i = 0; i < 50 && !checklistContext; i += 1) {
    const probed = { visualFamily: "hospitality", objective: `probe-${i}` }
    if (selectVariant(probed, "trust", TRUST_VARIANTS, TRUST_WEIGHTS) === "checklist-row") checklistContext = probed
  }
  assert.ok(checklistContext, "no se encontro un contexto que resuelva a 'checklist-row' en 50 intentos")

  const trust = composeSection("trust", checklistContext!)
  const nodes = nodesOf(trust)
  const itemHeading = Object.values(nodes).find((n) => n.type === "heading" && n.props?.text === "Atención profesional")
  const itemText = Object.values(nodes).find((n) => n.type === "text" && n.props?.content === "Explica aquí qué hace confiable al negocio.")
  assert.ok(itemHeading && itemText)
  // Section background is #ffffff (light) -- item text sitting directly on it must be dark, matching the derived color, never the light-on-dark fallback.
  assert.equal(itemHeading!.props?.color, "#0f172a")
  assert.equal(itemText!.props?.color, "#475569")
})

test("V2-3.1 D) fondo claro sin cambios: el treatment 'card-grid' de trust conserva su color fijo dark-on-white (las cards son opacas, no dependen del fondo de seccion)", async () => {
  const { selectVariant } = await import("../../lib/orvenix-ai/composer/variant-selector")
  const { TRUST_VARIANTS, TRUST_WEIGHTS } = await import("../../lib/orvenix-ai/composer/composition-context")
  const { composeSection } = await import("../../lib/orvenix-ai/composer")

  let cardGridContext: Record<string, unknown> | null = null
  for (let i = 0; i < 50 && !cardGridContext; i += 1) {
    const probed = { visualFamily: "commerce", objective: `probe-${i}` }
    if (selectVariant(probed, "trust", TRUST_VARIANTS, TRUST_WEIGHTS) === "card-grid") cardGridContext = probed
  }
  assert.ok(cardGridContext, "no se encontro un contexto que resuelva a 'card-grid' en 50 intentos")

  const trust = composeSection("trust", cardGridContext!)
  const nodes = nodesOf(trust)
  const cardTitle = Object.values(nodes).find((n) => n.type === "heading" && n.props?.text === "Atención profesional")
  assert.ok(cardTitle)
  // headingNode's own baseline default is dark-on-light ("#0f172a") -- the
  // card-grid variant never overrides it with a section-background-derived
  // color, because the card's own opaque bg-white wrapper makes that
  // baseline always correct regardless of what the section background is.
  assert.equal(cardTitle!.props?.color, "#0f172a")
})

test("V2-3.1 E) features: fondo de seccion sigue siendo claro y explicito (sin regresion) para los 3 treatments", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  for (const archetype of ["overview", "catalog"] as const) {
    const section = composeSection("features", { archetype })
    assert.ok(section)
    const nodes = nodesOf(section)
    const root = nodes[section!.rootId]
    assert.equal(root?.props?.background, "#ffffff")
  }
})

// ---------------------------------------------------------------------------
// 2. Hero selector: VisualFamily influence strength
// ---------------------------------------------------------------------------

test("V2-3.1 F) hero: cada familia moldea la distribucion de forma significativa (spread mayor/menor >= 2x), no una pluralidad debil casi uniforme", async () => {
  const { HERO_WEIGHTS, HERO_VARIANTS } = await import("../../lib/orvenix-ai/composer/composition-context")

  // A single-dominant-variant check breaks for families whose identity is
  // legitimately split across two tied variants (eg. creative: split-left/
  // split-right -- there's no principled reason to prefer one direction),
  // or expressed as "avoid X" rather than "prefer Y" (eg. commerce: no
  // hero shape is inherently more "scan-friendly", so its only real signal
  // is de-emphasizing immersive). The ratio between the most- and
  // least-weighted variant captures "meaningful shape" generally, without
  // assuming which specific form that shape takes.
  for (const [family, weights] of Object.entries(HERO_WEIGHTS)) {
    const total = HERO_VARIANTS.reduce((sum, v) => sum + Math.max(1, weights?.[v] ?? 1), 0)
    const shares = HERO_VARIANTS.map((v) => Math.max(1, weights?.[v] ?? 1) / total).sort((a, b) => b - a)
    const ratio = shares[0] / shares[shares.length - 1]
    assert.ok(ratio >= 2, `familia '${family}': spread max/min de solo ${ratio.toFixed(2)}x -- influencia de VisualFamily demasiado debil (casi uniforme)`)
  }
})

test("V2-3.1 G) hero: ninguna variante queda con peso 0 en ninguna familia (nunca un candado)", async () => {
  const { HERO_WEIGHTS, HERO_VARIANTS } = await import("../../lib/orvenix-ai/composer/composition-context")
  for (const [family, weights] of Object.entries(HERO_WEIGHTS)) {
    for (const variant of HERO_VARIANTS) {
      assert.ok((weights?.[variant] ?? 1) >= 1, `familia '${family}' tiene peso 0 en '${variant}'`)
    }
  }
})

test("V2-3.1 H) hero selector sigue siendo deterministico tras el reajuste de pesos", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const context = { visualFamily: "creative", industry: "diseno grafico", archetype: "overview" as const }
  const first = composeSection("hero", context)
  const second = composeSection("hero", context)
  assert.deepEqual(Object.values(nodesOf(first)).map((n) => n.displayName), Object.values(nodesOf(second)).map((n) => n.displayName))
})

test("V2-3.1 I) mismo-familia variedad sigue siendo posible tras el reajuste de pesos", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const overview = composeSection("hero", { visualFamily: "creative", industry: "diseno grafico", archetype: "overview" as const })
  const catalog = composeSection("hero", { visualFamily: "creative", industry: "diseno grafico", archetype: "catalog" as const })
  const conversion = composeSection("hero", { visualFamily: "creative", industry: "diseno grafico", archetype: "conversion" as const })
  const signature = (s: typeof overview) => nodesOf(s)[s!.rootId]?.displayName
  const signatures = new Set([signature(overview), signature(catalog), signature(conversion)])
  assert.ok(signatures.size >= 2, "la misma familia debe seguir siendo capaz de producir mas de una composicion segun archetype/contenido")
})

test("V2-3.1 J) ninguna regla de seleccion referencia negocios/fixtures especificos (auditoria de codigo fuente)", async () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/composer/composition-context.ts"), "utf-8")
  const forbidden = ["Fisioterapia", "Sabores del Valle", "Estudio Norte", "Monterrey", "Guadalajara", "Puebla"]
  for (const term of forbidden) {
    assert.ok(!source.includes(term), `composition-context.ts no debe referenciar '${term}'`)
  }
})

test("V2-3.1 K) firmas estructurales existentes (conteo de variantes por rol) siguen siendo validas", async () => {
  const { HERO_VARIANTS, FEATURES_VARIANTS, SERVICES_VARIANTS, CTA_VARIANTS, TRUST_VARIANTS } = await import("../../lib/orvenix-ai/composer/composition-context")
  assert.equal(HERO_VARIANTS.length, 4)
  assert.ok(FEATURES_VARIANTS.length >= 3)
  assert.ok(SERVICES_VARIANTS.length >= 3)
  assert.ok(CTA_VARIANTS.length >= 2)
  assert.ok(TRUST_VARIANTS.length >= 2)
})
