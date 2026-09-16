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

test("runAutonomousMultiPageSiteBuilder genera un plan V2 multipagina valido en memoria", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const { validateSiteCreationPlanV2 } = await import("../../lib/orvenix-ai/site-creation/plan-v2")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
      whatsapp: "528112345678",
      services: [
        { name: "Limpieza dental", description: "Prevencion y salud bucal." },
        { name: "Diseno de sonrisa", description: "Tratamientos esteticos." },
      ],
    },
  })

  assert.equal(result.ok, true)
  assert.equal(result.selectedTemplate, null)
  assert.equal(result.architecture.siteType, "health")
  assert.ok(result.plan.pages.length >= 3)
  assert.equal(result.plan.pages[0]?.slug, "home")
  assert.equal(result.plan.pages.filter((page) => page.isHome).length, 1)
  assert.deepEqual(
    result.plan.navigation.map((item) => item.href),
    result.plan.pages.map((page) => `page:${page.slug}`),
  )

  for (const page of result.plan.pages) {
    assert.ok(page.tree.rootId)
    assert.ok(page.tree.nodes[page.tree.rootId])
    assert.deepEqual(page.tree.theme, result.plan.theme)
    assert.deepEqual(page.tree.globalTheme, result.plan.theme)
    assert.notEqual(page.tree.theme, page.tree.globalTheme)
    assert.match(page.treeHash, /^[a-f0-9]{64}$/)
  }

  const validation = validateSiteCreationPlanV2(result.plan, {
    maxPages: result.plan.pages.length,
    maxBytes: result.byteLength,
  })

  assert.equal(validation.ok, true, "errors" in validation ? validation.errors.join("\n") : "")
  assert.equal(result.planHash, validation.ok ? validation.planHash : "")
  assert.equal(result.byteLength, validation.ok ? validation.byteLength : 0)
  assert.equal(result.pageQuality.length, result.plan.pages.length)
  assert.ok(result.trace.some((entry) => entry.includes("multipagina")))
})

test("runAutonomousSiteBuilder conserva su contrato observable de home unica", async () => {
  const { runAutonomousSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental en Monterrey",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      location: "Monterrey",
      description: "Atencion dental preventiva y estetica para familias.",
      objective: "Conseguir citas por WhatsApp",
    },
  })

  assert.equal(result.ok, true)
  assert.ok(result.tree.rootId)
  assert.ok(result.tree.nodes[result.tree.rootId])
  assert.equal("plan" in result, false)
  assert.equal(result.architecture.pages.length >= 2, true)
})

test("Design Memory prior null conserva el theme base del planner V2", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const input = {
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
  }

  const withoutPrior = await runAutonomousMultiPageSiteBuilder(input)
  const withNullPrior = await runAutonomousMultiPageSiteBuilder({ ...input, designMemoryPrior: null })

  assert.deepEqual(withNullPrior.plan.theme, withoutPrior.plan.theme)
})

test("Design Memory L2 prior puede orientar el theme cuando no hay constraint explicita", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const result = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L2",
      patternKeyHash: "a".repeat(64),
      evidence: {
        rankingScore: 0.84,
        confidence: "high",
        qualifiedSampleSize: 42,
        fallbackUsed: false,
      },
      recommendation: {
        context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
        theme: {
          mode: "dark",
          accentHue: "purple",
          contrastBucket: "high",
          radiusBucket: "pill",
          typographyBucket: "serif",
          motionBucket: "expressive",
        },
      },
      reason: [],
    },
  })

  assert.equal(result.plan.theme.colors?.primary, "#7c3aed")
  assert.equal(result.plan.theme.colors?.background, "#06131f")
  assert.equal(result.plan.theme.radius?.card, "24px")
  assert.equal(result.plan.theme.fontHeading, "Playfair Display")
  assert.equal(result.plan.theme.motion?.duration, "320ms")

  for (const page of result.plan.pages) {
    assert.deepEqual(page.tree.theme, result.plan.theme)
    assert.deepEqual(page.tree.globalTheme, result.plan.theme)
  }
})

test("Design Memory L1 prior no inventa theme", async () => {
  const { runAutonomousMultiPageSiteBuilder } = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const input = {
    request: "Crea un sitio profesional para una clinica dental",
    forceFreshComposition: true,
    business: {
      name: "Clinica Aurora",
      industry: "salud dental",
      description: "Atencion dental preventiva.",
      location: "Monterrey",
      objective: "Conseguir citas",
    },
  }

  const withoutPrior = await runAutonomousMultiPageSiteBuilder(input)
  const withL1Prior = await runAutonomousMultiPageSiteBuilder({
    ...input,
    designMemoryPrior: {
      version: 1,
      source: "design_memory",
      mode: "advisory",
      rankingVersion: 1,
      patternVersion: 1,
      level: "L1",
      patternKeyHash: "b".repeat(64),
      evidence: {
        rankingScore: 0.7,
        confidence: "medium",
        qualifiedSampleSize: 20,
        fallbackUsed: true,
      },
      recommendation: {
        context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
      },
      reason: [],
    },
  })

  assert.deepEqual(withL1Prior.plan.theme, withoutPrior.plan.theme)
})
