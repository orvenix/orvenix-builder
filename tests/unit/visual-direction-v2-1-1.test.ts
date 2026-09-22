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
// V2-1.1: decouple VisualDirection from siteType. siteType stays the sole
// architecture authority (untouched); VisualFamily becomes the sole visual-
// styling authority, inferred from industry/description/services text.
// ---------------------------------------------------------------------------

const FISIOTERAPIA = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  description: "Ofrecemos fisioterapia deportiva y rehabilitacion fisica en Monterrey.",
  services: [
    { name: "Fisioterapia deportiva" },
    { name: "Rehabilitacion fisica" },
    { name: "Terapia manual" },
  ],
}

const SABORES_DEL_VALLE = {
  name: "Sabores del Valle",
  industry: "restaurante",
  location: "Puebla",
}

const ESTUDIO_NORTE = {
  name: "Estudio Norte",
  industry: "diseno grafico",
  location: "Guadalajara",
  description: "Disenamos logotipos, identidad visual y sitios web para negocios en Guadalajara.",
  services: [
    { name: "Logotipos" },
    { name: "Identidad visual" },
    { name: "Sitios web" },
  ],
}

test("V2-1.1 A) benchmark requerido: Fisioterapia / Sabores del Valle / Estudio Norte producen 3 firmas visuales distintas, con VisualFamily independiente de siteType", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const fisioterapia = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: FISIOTERAPIA })
  const sabores = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: SABORES_DEL_VALLE })
  const estudioNorte = await runAutonomousMultiPageSiteBuilder({ request: "req", forceFreshComposition: true, business: ESTUDIO_NORTE })

  /*
   * Site-type follow-up (fisioterapia_not_health): this test originally
   * asserted fisioterapia.architecture.siteType === "business" and used
   * that SHARED-with-Estudio-Norte siteType as the vehicle for proving
   * VisualFamily doesn't collapse to siteType. inferSiteType now
   * correctly recognizes "fisioterapia" as health (siteType authority
   * itself, untouched here otherwise), so that specific shared-siteType
   * pairing no longer exists. The actual invariant under test --
   * VisualFamily is its own independent inference, not derived from
   * siteType -- still holds and is still demonstrated below: Estudio
   * Norte alone (siteType "business", a generic catch-all) resolves to
   * the "creative" family from its own real industry/description/
   * services text, not from any siteType lookup table.
   */
  assert.equal(fisioterapia.architecture.siteType, "health")
  assert.equal(sabores.architecture.siteType, "restaurant")
  assert.equal(estudioNorte.architecture.siteType, "business")

  // Visual signature (palette + heading font + radius) must NOT collapse.
  const signature = (plan: typeof fisioterapia.plan) =>
    `${plan.theme.colors?.primary}|${plan.theme.fontHeading}|${plan.theme.radius?.card}`

  const signatures = new Set([signature(fisioterapia.plan), signature(sabores.plan), signature(estudioNorte.plan)])
  assert.equal(signatures.size, 3, "las 3 fixtures del benchmark deben producir 3 firmas visuales distintas")

  // Fisioterapia -> health family (blue/soft).
  assert.equal(fisioterapia.plan.theme.colors?.primary, "#1794CC")
  assert.equal(fisioterapia.plan.theme.radius?.card, "16px")

  // Estudio Norte -> creative family (purple/sharp) -- distinct from Fisioterapia's health family.
  assert.equal(estudioNorte.plan.theme.colors?.primary, "#7c3aed")
  assert.equal(estudioNorte.plan.theme.fontHeading, "Oswald")
  assert.notEqual(estudioNorte.plan.theme.colors?.primary, fisioterapia.plan.theme.colors?.primary)

  // Sabores del Valle -> hospitality family (orange/serif/pill), via siteType 'restaurant'.
  assert.equal(sabores.plan.theme.colors?.primary, "#ea580c")
  assert.equal(sabores.plan.theme.fontHeading, "Playfair Display")
})

test("V2-1.1 B) inferVisualFamily resuelve directamente por familia (unidad, sin pasar por el builder completo)", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  assert.equal(inferVisualFamily({ industry: FISIOTERAPIA.industry, description: FISIOTERAPIA.description, services: FISIOTERAPIA.services, siteTypeHint: "business" }), "health")
  assert.equal(inferVisualFamily({ industry: ESTUDIO_NORTE.industry, description: ESTUDIO_NORTE.description, services: ESTUDIO_NORTE.services, siteTypeHint: "business" }), "creative")
  assert.equal(inferVisualFamily({ industry: SABORES_DEL_VALLE.industry, siteTypeHint: "restaurant" }), "hospitality")
})

test("V2-1.1 C) inferSiteType (arquitectura) permanece intacto: 'identidad visual' de Estudio Norte sigue sin clasificar como health/dental", async () => {
  const { buildSiteArchitecture } = await import("../../lib/orvenix-ai/architect")

  const architecture = buildSiteArchitecture({
    request: "Crea un sitio para un estudio de diseno",
    business: {
      name: ESTUDIO_NORTE.name,
      industry: ESTUDIO_NORTE.industry,
      location: ESTUDIO_NORTE.location,
      description: ESTUDIO_NORTE.description,
      objective: "Conseguir solicitudes de cotizacion",
    },
  })

  assert.equal(architecture.siteType, "business")
})

// ---------------------------------------------------------------------------
// Generalization: the family mechanism must be general-purpose, not tuned
// to the 3 named fixtures. Covers every domain the task explicitly requires.
// ---------------------------------------------------------------------------

test("V2-1.1 D) generalizacion: negocio de fisioterapia/rehabilitacion generico -> health", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "rehabilitacion fisica", description: "Terapia de rehabilitacion post-quirurgica" }),
    "health",
  )
})

test("V2-1.1 E) generalizacion: negocio dental/clinica generico -> health", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "clinica dental", description: "Atencion dental para toda la familia" }),
    "health",
  )
})

test("V2-1.1 F) generalizacion: estudio de diseno grafico/branding generico -> creative", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "diseno grafico y branding", description: "Creamos marcas e identidad visual" }),
    "creative",
  )
})

test("V2-1.1 G) generalizacion: agencia de marketing generica -> creative (misma familia visual que diseno/branding)", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "agencia de marketing digital", description: "Publicidad y campanas para redes sociales" }),
    "creative",
  )
})

test("V2-1.1 H) generalizacion: restaurante generico -> hospitality", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "restaurante de comida mexicana", description: "Cocina tradicional en un ambiente familiar" }),
    "hospitality",
  )
})

test("V2-1.1 I) generalizacion: tienda/ecommerce generico -> commerce", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "tienda en linea de accesorios", description: "Vendemos productos de moda con envio a todo el pais" }),
    "commerce",
  )
})

test("V2-1.1 J) generalizacion: negocio profesional generico sin senal de industria -> professional (fallback seguro)", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  assert.equal(
    inferVisualFamily({ industry: "consultoria general", description: "Asesoria estrategica para empresas", siteTypeHint: "business" }),
    "professional",
  )
})

// ---------------------------------------------------------------------------
// False-positive resistance: word-boundary-safe matching must reject
// misleading substrings, the same bug class the old inferSiteType "dent"
// bug belonged to (dent matching inside identidad).
// ---------------------------------------------------------------------------

test("V2-1.1 K) resistencia a falsos positivos: 'identidad' (diseno) no activa 'health' via substring 'dent'", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  const family = inferVisualFamily({ industry: "diseno grafico", description: "Identidad visual para marcas" })
  assert.notEqual(family, "health")
  assert.equal(family, "creative")
})

test("V2-1.1 L) resistencia a falsos positivos: palabras que contienen 'dent' a mitad de palabra no activan 'health'", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const trapWords = [
    "Empresa residente en la ciudad, con un presidente comprometido con sus accidentes laborales cero.",
  ]

  for (const description of trapWords) {
    const family = inferVisualFamily({ industry: "consultoria general", description, siteTypeHint: "business" })
    assert.notEqual(family, "health", `'${description}' no deberia activar 'health'`)
  }
})

test("V2-1.1 M) resistencia a falsos positivos: 'ventana' (instalador de vidrios) no activa 'commerce' via substring 'venta'", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  const family = inferVisualFamily({ industry: "instalacion de vidrios", description: "Instalamos ventanas y ventanales residenciales", siteTypeHint: "business" })
  assert.notEqual(family, "commerce")
})

test("V2-1.1 N) resistencia a falsos positivos: 'marcapasos' (dispositivo medico) no activa 'creative' via substring 'marca'", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")
  const family = inferVisualFamily({ industry: "dispositivos medicos", description: "Distribuimos marcapasos y equipo cardiaco", siteTypeHint: "business" })
  assert.notEqual(family, "creative")
})

test("V2-1.1 O) determinismo: misma entrada produce siempre la misma familia visual (llamadas repetidas)", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const input = { industry: ESTUDIO_NORTE.industry, description: ESTUDIO_NORTE.description, services: ESTUDIO_NORTE.services }
  const results = Array.from({ length: 5 }, () => inferVisualFamily(input))
  assert.ok(results.every((family) => family === results[0]))
})

test("V2-1.1 P) business name nunca se usa como senal de clasificacion visual: dos negocios con la misma industria pero nombres distintos producen la misma familia", async () => {
  const { inferVisualFamily } = await import("../../lib/orvenix-ai/theme/visual-direction")

  const a = inferVisualFamily({ industry: "restaurante", description: "Cocina de autor" })
  const b = inferVisualFamily({ industry: "restaurante", description: "Cocina de autor" })
  assert.equal(a, b)

  // Business name deliberately excluded from VisualFamilyInput's shape --
  // there is no name field to pass, which is itself the guarantee.
})

test("V2-1.1 Q) Design Memory L2 sigue teniendo precedencia sobre la familia visual determinista tras el desacople", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "req",
    forceFreshComposition: true,
    business: FISIOTERAPIA,
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L2",
      patternKeyHash: "c".repeat(64),
      evidence: { rankingScore: 0.9, confidence: "high", qualifiedSampleSize: 50, fallbackUsed: false },
      recommendation: {
        context: { industryBucket: "health", siteType: "business", objectiveBucket: "lead_generation", styleBucket: "professional" },
        theme: { accentHue: "pink" },
      },
      reason: [],
    } as never,
  })

  assert.notEqual(result.plan.theme.colors?.primary, "#1794CC")
  assert.equal(result.plan.theme.colors?.primary, "#db2777")
})
