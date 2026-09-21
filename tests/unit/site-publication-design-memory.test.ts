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

function tree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: [],
        version: 1,
      },
    },
  }
}

function clearPublicationCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes("/lib/site-publication.js")) {
      delete require.cache[key]
    }
  }
}

async function withPublicationMocks<T>(options: {
  allowed?: boolean
  runtimePages?: unknown[]
  writeThrows?: boolean
  updatedCount?: number
  markFails?: boolean
  measureFails?: boolean
  measureUnavailable?: boolean
  refreshFails?: boolean
}, callback: (publication: typeof import("../../lib/site-publication"), state: {
  events: string[]
  markCalls: Array<{ siteId: string }>
  measureCalls: Array<{ siteId: string }>
  refreshCalls: Array<{ siteId: string }>
  publishCalls: Array<{ siteId: string; userId: string }>
  writeCalls: Array<{ siteId: string; pages: unknown[] }>
  removeCalls: string[]
}) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const state = {
    events: [] as string[],
    markCalls: [] as Array<{ siteId: string }>,
    measureCalls: [] as Array<{ siteId: string }>,
    refreshCalls: [] as Array<{ siteId: string }>,
    publishCalls: [] as Array<{ siteId: string; userId: string }>,
    writeCalls: [] as Array<{ siteId: string; pages: unknown[] }>,
    removeCalls: [] as string[],
  }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/auth") {
      return {
        canManageSite: async () => options.allowed ?? true,
        publishSite: async (siteId: string, userId: string) => {
          state.events.push("publish")
          state.publishCalls.push({ siteId, userId })
          return { count: options.updatedCount ?? 1 }
        },
      }
    }

    if (request === "@/lib/builder-core/tree/siteRuntimeContext") {
      return {
        listResolvedSiteRuntimePages: async () => options.runtimePages ?? [
          {
            activePageSlug: "home",
            activePageName: "Inicio",
            isHome: true,
            tree: tree(),
            pages: [{ id: "home", siteId: "site_1", name: "Inicio", slug: "home", isHome: true, published: false, source: "site-page" }],
          },
        ],
      }
    }

    if (request === "@/lib/publishedSiteArtifacts") {
      return {
        canPublishAsStaticHtml: () => true,
        writePublishedSiteArtifacts: async (siteId: string, pages: unknown[]) => {
          state.events.push("write")
          state.writeCalls.push({ siteId, pages })
          if (options.writeThrows) throw new Error("artifact failed")
        },
        removePublishedSiteArtifact: async (siteId: string) => {
          state.events.push("remove")
          state.removeCalls.push(siteId)
        },
      }
    }

    if (request === "@/lib/orvenix-ai/design-memory") {
      return {
        markDesignGenerationPublished: async (input: { siteId: string }) => {
          state.events.push("mark")
          state.markCalls.push(input)
          return options.markFails
            ? { ok: false, error: "memory unavailable" }
            : { ok: true, siteId: input.siteId, status: "published" }
        },
        measureAndRecordDesignGenerationEditMetrics: async (input: { siteId: string }) => {
          state.events.push("measure")
          state.measureCalls.push(input)
          if (options.measureFails) throw new Error("metrics down")
          return options.measureUnavailable
            ? { ok: false, error: "missing generation" }
            : { ok: true, siteId: input.siteId, editDistance: 0.25 }
        },
        refreshDesignGenerationOutcome: async (input: { siteId: string }) => {
          state.events.push("refresh")
          state.refreshCalls.push(input)
          if (options.refreshFails) throw new Error("outcome down")
          return { ok: true, siteId: input.siteId, outcomeScore: 0.8 }
        },
      }
    }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearPublicationCache()
    const publication = await import("../../lib/site-publication")
    return await callback(publication, state)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearPublicationCache()
  }
}

test("publishSiteForActor marca Design Memory despues de publicar correctamente", async () => {
  await withPublicationMocks({}, async ({ publishSiteForActor }, state) => {
    const result = await publishSiteForActor({
      siteId: "site_1",
      actor: { userId: "user_1", role: "CLIENT" },
    })

    assert.equal(result.url, "/p/site_1")
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.measureCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.publishCalls, [{ siteId: "site_1", userId: "user_1" }])
    assert.deepEqual(state.events, ["write", "publish", "mark", "measure", "refresh"])
  })
})

test("publishSiteForActor sigue exitoso si Design Memory falla", async () => {
  await withPublicationMocks({ markFails: true }, async ({ publishSiteForActor }, state) => {
    const result = await publishSiteForActor({
      siteId: "site_1",
      actor: { userId: "user_1", role: "CLIENT" },
    })

    assert.equal(result.url, "/p/site_1")
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.events, ["write", "publish", "mark", "measure", "refresh"])
  })
})

test("publishSiteForActor no marca Design Memory si falla antes del update final", async () => {
  await withPublicationMocks({ writeThrows: true }, async ({ publishSiteForActor }, state) => {
    await assert.rejects(
      () => publishSiteForActor({
        siteId: "site_1",
        actor: { userId: "user_1", role: "CLIENT" },
      }),
      /artifact failed/,
    )

    assert.deepEqual(state.publishCalls, [])
    assert.deepEqual(state.markCalls, [])
    assert.deepEqual(state.measureCalls, [])
    assert.deepEqual(state.events, ["write"])
  })
})

test("publishSiteForActor no marca Design Memory cuando updatedCount es cero", async () => {
  await withPublicationMocks({ updatedCount: 0 }, async ({ publishSiteForActor }, state) => {
    await assert.rejects(
      () => publishSiteForActor({
        siteId: "site_1",
        actor: { userId: "user_1", role: "CLIENT" },
      }),
      /Sitio no encontrado o acceso revocado/,
    )

    assert.deepEqual(state.markCalls, [])
    assert.deepEqual(state.measureCalls, [])
    assert.deepEqual(state.events, ["write", "publish", "remove"])
  })
})

test("publishSiteForActor sigue exitoso si la medicion de metricas falla", async () => {
  await withPublicationMocks({ measureFails: true }, async ({ publishSiteForActor }, state) => {
    const result = await publishSiteForActor({
      siteId: "site_1",
      actor: { userId: "user_1", role: "CLIENT" },
    })

    assert.equal(result.url, "/p/site_1")
    assert.deepEqual(state.markCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.measureCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.events, ["write", "publish", "mark", "measure", "refresh"])
  })
})

test("publishSiteForActor sigue exitoso si no hay generacion o Plan V2 valido para medir", async () => {
  await withPublicationMocks({ measureUnavailable: true }, async ({ publishSiteForActor }, state) => {
    const result = await publishSiteForActor({
      siteId: "site_1",
      actor: { userId: "user_1", role: "CLIENT" },
    })

    assert.equal(result.url, "/p/site_1")
    assert.deepEqual(state.measureCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.events, ["write", "publish", "mark", "measure", "refresh"])
  })
})

test("publishSiteForActor sigue exitoso si Outcome V1 falla", async () => {
  await withPublicationMocks({ refreshFails: true }, async ({ publishSiteForActor }, state) => {
    const result = await publishSiteForActor({
      siteId: "site_1",
      actor: { userId: "user_1", role: "CLIENT" },
    })

    assert.equal(result.url, "/p/site_1")
    assert.deepEqual(state.refreshCalls, [{ siteId: "site_1" }])
    assert.deepEqual(state.events, ["write", "publish", "mark", "measure", "refresh"])
  })
})
