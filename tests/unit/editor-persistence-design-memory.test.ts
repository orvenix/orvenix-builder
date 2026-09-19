import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"
import type { EditorTree } from "../../types/editor"

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

function tree(label: string): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: { label },
        children: [],
        version: 1,
      },
    },
  }
}

function clearEditorPersistenceCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes("/lib/editorPersistence.js")) {
      delete require.cache[key]
    }
  }
}

async function withPersistenceMocks<T>(options: {
  initialTree?: EditorTree | null
  markThrows?: boolean
}, callback: (persistence: typeof import("../../lib/editorPersistence"), state: {
  legacyTree: EditorTree | null
  pageTrees: Map<string, EditorTree>
  markCalls: Array<{ siteId: string }>
  upsertCalls: number
  updateCalls: number
}) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const initialTree = options.initialTree ? structuredClone(options.initialTree) : null
  const state = {
    legacyTree: initialTree ? structuredClone(initialTree) : null,
    pageTrees: new Map<string, EditorTree>(initialTree ? [["home", structuredClone(initialTree)]] : []),
    markCalls: [] as Array<{ siteId: string }>,
    upsertCalls: 0,
    updateCalls: 0,
  }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/editor-db") {
      return {
        editorPrisma: {
          editorWebsite: {
            findUnique: async () => state.legacyTree ? { id: "site_1", tree: state.legacyTree } : null,
            upsert: async (args: { create: { tree: EditorTree }, update: { tree: EditorTree } }) => {
              state.upsertCalls += 1
              state.legacyTree = structuredClone(state.legacyTree ? args.update.tree : args.create.tree)
              return { id: "site_1" }
            },
            update: async () => {
              state.updateCalls += 1
              return { id: "site_1" }
            },
            create: async (args: { data: { tree: EditorTree } }) => {
              state.legacyTree = structuredClone(args.data.tree)
              return { id: "site_1" }
            },
          },
        },
      }
    }
    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        HOME_PAGE_SLUG: "home",
        ensureHomePage: async () => {
          const homeTree = state.pageTrees.get("home") ?? state.legacyTree ?? tree("legacy")
          state.pageTrees.set("home", structuredClone(homeTree))
          return { id: "page_home", siteId: "site_1", name: "Inicio", slug: "home", tree: homeTree, isHome: true, published: false, source: "site-page" }
        },
        getResolvedSitePage: async (_siteId: string, slug = "home") => {
          const pageTree = state.pageTrees.get(slug)
          if (!pageTree) return null
          return {
            id: `page_${slug}`,
            siteId: "site_1",
            name: slug === "home" ? "Inicio" : "Servicios",
            slug,
            tree: pageTree,
            isHome: slug === "home",
            published: false,
            source: "site-page",
          }
        },
        getResolvedSiteTheme: async () => ({ siteId: "site_1", tokens: {}, source: "runtime-defaults" }),
        saveResolvedPageTree: async (_siteId: string, slug: string, nextTree: EditorTree) => {
          state.pageTrees.set(slug, structuredClone(nextTree))
        },
        saveResolvedSiteTheme: async () => undefined,
      }
    }
    if (request === "@/lib/orvenix-ai/design-memory") {
      return {
        markDesignGenerationEdited: async (input: { siteId: string }) => {
          state.markCalls.push(input)
          if (options.markThrows) throw new Error("design memory down")
          return { ok: true, siteId: input.siteId, status: "edited" }
        },
      }
    }
    if (request === "@/lib/editorWebs") {
      return {
        getEditorTreeForWeb: () => tree("demo"),
        isEditorWebId: () => false,
        WEB_LABELS: {},
      }
    }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearEditorPersistenceCache()
    const persistence = await import("../../lib/editorPersistence")
    return await callback(persistence, state)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearEditorPersistenceCache()
  }
}

test("saveEditorTreeToDb marca Design Memory edited cuando el arbol cambia realmente", async () => {
  await withPersistenceMocks({ initialTree: tree("antes") }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("despues"), "home")

    assert.deepEqual(saved, tree("despues"))
    assert.deepEqual(state.pageTrees.get("home"), tree("despues"))
    assert.equal(state.upsertCalls, 1)
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
  })
})

test("saveEditorTreeToDb no marca edited cuando el autosave repite el mismo arbol", async () => {
  await withPersistenceMocks({ initialTree: tree("igual") }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("igual"), "home")

    assert.deepEqual(saved, tree("igual"))
    assert.equal(state.upsertCalls, 1)
    assert.deepEqual(state.markCalls, [])
  })
})

test("saveEditorTreeToDb conserva el guardado aunque Design Memory falle", async () => {
  await withPersistenceMocks({ initialTree: tree("antes"), markThrows: true }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("despues"), "home")

    assert.deepEqual(saved, tree("despues"))
    assert.deepEqual(state.pageTrees.get("home"), tree("despues"))
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
  })
})

test("saveEditorTreeToDb no marca edited durante creacion inicial sin arbol previo", async () => {
  await withPersistenceMocks({ initialTree: null }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("inicial"), "home")

    assert.deepEqual(saved, tree("inicial"))
    assert.deepEqual(state.pageTrees.get("home"), tree("inicial"))
    assert.deepEqual(state.markCalls, [])
  })
})

test("saveEditorTreeToDb preserva EditorWebsite.tree cuando guarda una pagina secundaria", async () => {
  await withPersistenceMocks({ initialTree: tree("home-original") }, async ({ saveEditorTreeToDb }, state) => {
    state.pageTrees.set("servicios", tree("servicios-original"))

    const saved = await saveEditorTreeToDb("site_1", tree("servicios-editado"), "servicios")

    assert.deepEqual(saved, tree("servicios-editado"))
    assert.deepEqual(state.pageTrees.get("servicios"), tree("servicios-editado"))
    assert.deepEqual(state.legacyTree, tree("home-original"))
    assert.equal(state.upsertCalls, 0)
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
  })
})

test("saveEditorTreeToDb mantiene EditorWebsite.tree sincronizado al guardar home", async () => {
  await withPersistenceMocks({ initialTree: tree("home-original") }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("home-editado"), "home")

    assert.deepEqual(saved, tree("home-editado"))
    assert.deepEqual(state.pageTrees.get("home"), tree("home-editado"))
    assert.deepEqual(state.legacyTree, tree("home-editado"))
    assert.equal(state.upsertCalls, 1)
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
  })
})
