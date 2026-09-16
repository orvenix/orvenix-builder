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
  persistedTree: EditorTree | null
  markCalls: Array<{ siteId: string }>
  upsertCalls: number
}) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const state = {
    persistedTree: options.initialTree ? structuredClone(options.initialTree) : null,
    markCalls: [] as Array<{ siteId: string }>,
    upsertCalls: 0,
  }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/editor-db") {
      return {
        editorPrisma: {
          editorWebsite: {
            findUnique: async () => ({ id: "site_1", tree: state.persistedTree ?? tree("legacy") }),
            upsert: async () => {
              state.upsertCalls += 1
              return { id: "site_1" }
            },
            create: async () => ({ id: "site_1" }),
          },
        },
      }
    }
    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        ensureHomePage: async () => ({ id: "page_1" }),
        getResolvedSitePage: async () => state.persistedTree
          ? { id: "page_1", siteId: "site_1", name: "Inicio", slug: "home", tree: state.persistedTree, isHome: true, published: false, source: "site-page" }
          : null,
        getResolvedSiteTheme: async () => ({ siteId: "site_1", tokens: {}, source: "runtime-defaults" }),
        saveResolvedPageTree: async (_siteId: string, _slug: string, nextTree: EditorTree) => {
          state.persistedTree = structuredClone(nextTree)
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
    assert.deepEqual(state.persistedTree, tree("despues"))
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
    assert.deepEqual(state.persistedTree, tree("despues"))
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
  })
})

test("saveEditorTreeToDb no marca edited durante creacion inicial sin arbol previo", async () => {
  await withPersistenceMocks({ initialTree: null }, async ({ saveEditorTreeToDb }, state) => {
    const saved = await saveEditorTreeToDb("site_1", tree("inicial"), "home")

    assert.deepEqual(saved, tree("inicial"))
    assert.deepEqual(state.persistedTree, tree("inicial"))
    assert.deepEqual(state.markCalls, [])
  })
})
