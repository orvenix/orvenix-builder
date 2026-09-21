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
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

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

function tree(text = "Hola"): EditorTree {
  return {
    rootId: "root",
    theme: structuredClone(theme),
    globalTheme: structuredClone(theme),
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["text"], version: 1 },
      text: { id: "text", type: "text", props: { content: text }, children: [], parentId: "root", version: 1 },
    },
  }
}

function plan(initialTree = tree()): SiteCreationPlanV2 {
  return {
    version: 2,
    identity: { name: "Demo" },
    theme: structuredClone(theme),
    navigation: [{ label: "Inicio", slug: "home", href: buildHref("home") }],
    pages: [{
      slug: "home",
      name: "Inicio",
      isHome: true,
      seo: { title: "Inicio", description: "Inicio" },
      tree: initialTree,
      treeHash: calculateTreeHash(initialTree),
    }],
    quality: { score: 90, warnings: [], summary: "Demo" },
  }
}

function clearMemoryCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes("/lib/orvenix-ai/design-memory/")) {
      delete require.cache[key]
    }
  }
}

async function withMetricsMocks<T>(options: {
  initialPlan?: unknown
  currentTree?: EditorTree
  missingActive?: boolean
  missingGeneration?: boolean
  updateFails?: boolean
}, callback: (memory: typeof import("../../lib/orvenix-ai/design-memory"), state: { savedData: Record<string, unknown> | null; updatedIds: string[] }) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const state = { savedData: null as Record<string, unknown> | null, updatedIds: [] as string[] }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/editor-db") {
      return {
        editorPrisma: {
          editorWebsite: {
            findUnique: async () => options.missingActive ? { activeDesignGenerationId: null } : { activeDesignGenerationId: "generation_active" },
          },
          designGeneration: {
            findUnique: async ({ where }: { where: { id: string } }) => {
              if (options.missingGeneration) return null
              return {
                id: where.id,
                siteId: "site_1",
                initialPlan: options.initialPlan ?? plan(),
              }
            },
            updateMany: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
              if (options.updateFails) throw new Error("db down")
              state.updatedIds.push(where.id)
              state.savedData = data
              return { count: 1 }
            },
          },
        },
      }
    }

    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        listSitePages: async () => [{ id: "page_1", siteId: "site_1", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page" }],
        getResolvedSitePage: async () => ({ id: "page_1", siteId: "site_1", name: "Inicio", slug: "home", isHome: true, published: true, source: "site-page", tree: options.currentTree ?? tree("Texto cambiado") }),
        getResolvedSiteTheme: async () => ({ siteId: "site_1", tokens: theme, source: "site-theme" }),
      }
    }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearMemoryCache()
    const memory = await import("../../lib/orvenix-ai/design-memory")
    return await callback(memory, state)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearMemoryCache()
  }
}

test("measureAndRecordDesignGenerationEditMetrics guarda solo metricas agregadas en la generacion activa", async () => {
  await withMetricsMocks({}, async ({ measureAndRecordDesignGenerationEditMetrics }, state) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, true)
    assert.equal(result.generationId, "generation_active")
    assert.deepEqual(state.updatedIds, ["generation_active"])
    assert.ok(result.metrics)
    assert.equal(result.metrics?.copyChangedNodes, 1)
    assert.equal(typeof result.editDistance, "number")
    assert.ok(state.savedData)
    assert.equal(typeof state.savedData?.editDistance, "number")
    assert.ok(state.savedData?.measuredAt instanceof Date)
    assert.deepEqual(Object.keys(state.savedData?.editMetrics as Record<string, unknown>).sort(), [
      "copyChangedNodes",
      "editDistance",
      "nodesAdded",
      "nodesChanged",
      "nodesRemoved",
      "pageCountCurrent",
      "pageCountInitial",
      "pagesAdded",
      "pagesChanged",
      "pagesRemoved",
      "pagesRenamed",
      "structuralChangedNodes",
      "themeChanged",
      "themeChangedKeys",
      "visualChangedNodes",
    ])
    assert.equal(JSON.stringify(state.savedData).includes("Texto cambiado"), false)
  })
})

test("measureAndRecordDesignGenerationEditMetrics no usa generaciones historicas del mismo sitio", async () => {
  await withMetricsMocks({}, async ({ measureAndRecordDesignGenerationEditMetrics }, state) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, true)
    assert.deepEqual(state.updatedIds, ["generation_active"])
    assert.equal(state.updatedIds.includes("generation_historical"), false)
  })
})

test("measureAndRecordDesignGenerationEditMetrics falla controlado sin active generation, generacion o Plan V2", async () => {
  await withMetricsMocks({ missingActive: true }, async ({ measureAndRecordDesignGenerationEditMetrics }, state) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, false)
    assert.equal(state.savedData, null)
  })

  await withMetricsMocks({ missingGeneration: true }, async ({ measureAndRecordDesignGenerationEditMetrics }, state) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, false)
    assert.equal(result.generationId, "generation_active")
    assert.equal(state.savedData, null)
  })

  await withMetricsMocks({ initialPlan: { version: 1, after: tree() } }, async ({ measureAndRecordDesignGenerationEditMetrics }, state) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, false)
    assert.equal(state.savedData, null)
  })
})

test("measureAndRecordDesignGenerationEditMetrics devuelve fallo controlado ante error DB", async () => {
  await withMetricsMocks({ updateFails: true }, async ({ measureAndRecordDesignGenerationEditMetrics }) => {
    const result = await measureAndRecordDesignGenerationEditMetrics({ siteId: "site_1" })

    assert.equal(result.ok, false)
  })
})
