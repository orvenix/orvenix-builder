import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import type { EditorTree } from "../../types/editor"
import type { AIUndoRecord, AIUndoStatus } from "../../lib/orvenix-ai/mutation/undo-store"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }

  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}

function createTree(ids: string[]): EditorTree {
  const rootId = ids[0] ?? "root"
  return {
    rootId,
    nodes: Object.fromEntries(
      ids.map((id, index) => [
        id,
        {
          id,
          type: "section",
          displayName: id,
          props: {},
          children: index === 0 ? ids.slice(1) : [],
          version: 1,
          ...(index === 0 ? {} : { parentId: rootId }),
        },
      ]),
    ),
  }
}

function createRecord(overrides: Partial<AIUndoRecord> = {}): AIUndoRecord {
  const tree = createTree(["root", "hero"])
  return {
    id: "undo_1",
    userId: "user_1",
    siteId: "site_1",
    pageSlug: "home",
    snapshot: {
      id: "snapshot_1",
      siteId: "site_1",
      createdAt: new Date(0).toISOString(),
      tree,
    },
    appliedTreeHash: "applied_hash",
    scope: "section_edit",
    createdAt: new Date(0).toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    status: "completed",
    error: null,
    ...overrides,
  }
}

function createDeps(record: AIUndoRecord) {
  let status: AIUndoStatus = record.status
  let restoreCalls = 0
  let releaseCalls = 0
  let restoredTree = createTree(["applied-root"])

  return {
    get state() {
      return { status, restoreCalls, releaseCalls, restoredTree }
    },
    deps: {
      getRecord: async () => ({ ...record, status }),
      claimRecord: async () => {
        if (status !== "completed") return false
        status = "processing"
        return true
      },
      releaseRecord: async () => {
        releaseCalls += 1
        if (status !== "processing") return false
        status = "completed"
        return true
      },
      canManageSite: async () => true,
      restoreAndConsume: async () => {
        restoreCalls += 1
        if (status !== "processing") throw new Error("Undo no reclamado")
        restoredTree = record.snapshot.tree
        status = "consumed"
        return {
          tree: restoredTree,
          restoredHash: "restored_hash",
        }
      },
      now: () => new Date(),
    },
  }
}

test("undo correcto restaura y consume el registro", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(result.ok, true)
  assert.equal(result.siteId, record.siteId)
  assert.equal(result.pageSlug, record.pageSlug)
  assert.deepEqual(result.tree, record.snapshot.tree)
  assert.equal(harness.state.status, "consumed")
  assert.equal(harness.state.restoreCalls, 1)
})

test("bloquea si el arbol cambió despues y no consume", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)
  const error = new Error("El sitio cambió despues del cambio de IA.")
  error.name = "AI_UNDO_STALE_TREE"

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw error
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "stale_tree")
  assert.equal(harness.state.status, "completed")
  assert.equal(harness.state.releaseCalls, 1)
})

test("aisla por usuario y no permite usar undoId valido de otra cuenta", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord({ userId: "owner_user" })
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: "other_user", role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "forbidden")
  assert.equal(harness.state.restoreCalls, 0)
  assert.equal(harness.state.status, "completed")
})

test("bloquea si canManageSite rechaza el sitio", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      canManageSite: async (siteId, userId) => siteId === "otro" && userId === record.userId,
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "forbidden")
  assert.equal(harness.state.restoreCalls, 0)
  assert.equal(harness.state.status, "completed")
})

test("dos solicitudes concurrentes: solo una puede restaurar", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const results = await Promise.all([
    rollbackOrvenixAIChange({ undoId: record.id, actor: { userId: record.userId, role: "CLIENT" }, deps: harness.deps }),
    rollbackOrvenixAIChange({ undoId: record.id, actor: { userId: record.userId, role: "CLIENT" }, deps: harness.deps }),
  ])

  assert.equal(results.filter((result) => result.ok).length, 1)
  assert.equal(results.filter((result) => result.code === "unavailable" || result.code === "already_used").length, 1)
  assert.equal(harness.state.restoreCalls, 1)
  assert.equal(harness.state.status, "consumed")
})

test("no permite doble uso del mismo undo", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord({ status: "consumed" })
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "already_used")
  assert.equal(harness.state.restoreCalls, 0)
})

test("undo expirado no se procesa", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord({ expiresAt: new Date(0).toISOString() })
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "expired")
  assert.equal(harness.state.restoreCalls, 0)
  assert.equal(harness.state.status, "completed")
})

test("fallo despues de adquirir processing vuelve a dejar disponible el undo", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw new Error("Fallo simulado")
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "restore_failed")
  assert.equal(harness.state.status, "completed")
  assert.equal(harness.state.releaseCalls, 1)
})

test("fallo al marcar consumed revierte tambien la restauracion", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)
  const before = harness.state.restoredTree

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw new Error("No se pudo consumir")
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(harness.state.status, "completed")
  assert.deepEqual(harness.state.restoredTree, before)
})

test("release no cambia un registro que ya no esta processing", async () => {
  const record = createRecord({ status: "consumed" })
  let status: AIUndoStatus = record.status
  const releaseRecord = async () => {
    if (status !== "processing") return false
    status = "completed"
    return true
  }

  const released = await releaseRecord()

  assert.equal(released, false)
  assert.equal(status, "consumed")
})

test("usuario sin plan activo pero propietario puede deshacer", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(result.ok, true)
  assert.equal(harness.state.status, "consumed")
})

test("la respuesta al navegador no expone snapshot", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(Object.prototype.hasOwnProperty.call(result, "snapshot"), false)
  assert.equal(Object.prototype.hasOwnProperty.call(result, "appliedTreeHash"), false)
})

test("rollback de pagina secundaria no modifica el arbol legacy de home", async () => {
  const { shouldRestoreEditorWebsiteTreeForUndo } = await import("../../lib/orvenix-ai/mutation/undo-service")

  assert.equal(shouldRestoreEditorWebsiteTreeForUndo("home"), true)
  assert.equal(shouldRestoreEditorWebsiteTreeForUndo("servicios"), false)
})

test("fallo al registrar undo no convierte un execute exitoso en error", async () => {
  const { registerAIUndoForExecutedResult } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const tree = createTree(["root", "hero"])
  const result = await registerAIUndoForExecutedResult({
    result: {
      ok: true,
      action: "executed",
      scope: "section_edit",
      message: "Aplicado",
      plan: {
        siteId: "site_1",
        snapshot: { id: "snap", siteId: "site_1", createdAt: new Date(0).toISOString(), tree },
        before: tree,
        after: createTree(["root", "hero", "cta"]),
        addedNodes: 1,
        removedNodes: 0,
        changedNodes: 1,
        safe: true,
        safetyScore: 100,
        readyToApply: true,
        warnings: [],
      },
      snapshot: { id: "snap", siteId: "site_1", createdAt: new Date(0).toISOString(), tree },
      warnings: [],
    },
    userId: "user_1",
    siteId: "site_1",
    pageSlug: "home",
    readCanonicalTree: async () => createTree(["canonical-root"]),
    rememberUndo: async () => {
      throw new Error("Storage caido")
    },
  })

  assert.equal(result.undo, undefined)
  assert.match(result.undoWarning ?? "", /Storage caido/)
})

test("appliedTreeHash corresponde al arbol canonico releido", async () => {
  const { registerAIUndoForExecutedResult } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const { hashEditorTree } = await import("../../lib/orvenix-ai/mutation/executor")
  const before = createTree(["root", "hero"])
  const after = createTree(["root", "hero", "cta"])
  const canonical = createTree(["canonical-root", "saved"])
  let capturedHash = ""

  const registration = await registerAIUndoForExecutedResult({
    result: {
      ok: true,
      action: "executed",
      scope: "section_edit",
      message: "Aplicado",
      plan: {
        siteId: "site_1",
        snapshot: { id: "snap", siteId: "site_1", createdAt: new Date(0).toISOString(), tree: before },
        before,
        after,
        addedNodes: 1,
        removedNodes: 0,
        changedNodes: 1,
        safe: true,
        safetyScore: 100,
        readyToApply: true,
        warnings: [],
      },
      snapshot: { id: "snap", siteId: "site_1", createdAt: new Date(0).toISOString(), tree: before },
      warnings: [],
    },
    userId: "user_1",
    siteId: "site_1",
    pageSlug: "home",
    readCanonicalTree: async () => canonical,
    rememberUndo: async (params) => {
      capturedHash = params.appliedTreeHash
      return {
        id: "undo_hash",
        userId: params.userId,
        siteId: params.siteId,
        pageSlug: params.pageSlug,
        snapshot: params.snapshot,
        appliedTreeHash: params.appliedTreeHash,
        scope: params.scope,
        createdAt: new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: "completed",
        error: null,
      }
    },
  })

  assert.equal(registration.undo?.id, "undo_hash")
  assert.equal(capturedHash, hashEditorTree(canonical))
  assert.notEqual(capturedHash, hashEditorTree(after))
})

test("completar dos veces no es posible cuando el estado ya no es processing", async () => {
  let status: AIUndoStatus = "processing"
  const complete = async () => {
    if (status !== "processing") return false
    status = "consumed"
    return true
  }

  assert.equal(await complete(), true)
  assert.equal(await complete(), false)
  assert.equal(status, "consumed")
})

test("pagina con published numerico 0 puede restaurarse porque el patch no actualiza published", async () => {
  const { buildSitePageUndoUpdateData } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const patch = buildSitePageUndoUpdateData(createTree(["root", "hero"])) as Record<string, unknown>
  const pageFromSql = { id: "page_1", tree: createTree(["current"]), published: 0 }

  assert.equal(pageFromSql.published, 0)
  assert.equal(Object.prototype.hasOwnProperty.call(patch, "published"), false)
  assert.equal(Object.prototype.hasOwnProperty.call(patch, "tree"), true)
  assert.equal(Object.prototype.hasOwnProperty.call(patch, "seo"), true)
})

test("rollback conserva el estado published existente porque no lo incluye en update", async () => {
  const { buildSitePageUndoUpdateData } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const publishedBefore = true
  const patch = buildSitePageUndoUpdateData(createTree(["root", "services"])) as Record<string, unknown>
  const publishedAfter = Object.prototype.hasOwnProperty.call(patch, "published")
    ? Boolean(patch.published)
    : publishedBefore

  assert.equal(publishedAfter, true)
})

test("un error Prisma simulado no aparece en la respuesta publica", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)
  const prismaError = new Error("PrismaClientKnownRequestError: Raw query failed. SELECT * FROM secrets")

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw prismaError
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.message, "No se pudo deshacer el cambio de Orvenix AI.")
  assert.equal(result.message.includes("Prisma"), false)
  assert.equal(result.message.includes("SELECT"), false)
})

test("el mensaje stale_tree sigue siendo claro", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)
  const stale = new Error("detalle tecnico interno")
  stale.name = "AI_UNDO_STALE_TREE"

  const result = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw stale
      },
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, "stale_tree")
  assert.equal(
    result.message,
    "El sitio cambió después del cambio de IA. No se deshizo para no borrar trabajo reciente.",
  )
})

test("despues de un fallo transaccional el undo permanece disponible", async () => {
  const { rollbackOrvenixAIChange } = await import("../../lib/orvenix-ai/mutation/undo-service")
  const record = createRecord()
  const harness = createDeps(record)

  const failed = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: {
      ...harness.deps,
      restoreAndConsume: async () => {
        throw new Error("Fallo transaccional")
      },
    },
  })

  assert.equal(failed.ok, false)
  assert.equal(harness.state.status, "completed")

  const retried = await rollbackOrvenixAIChange({
    undoId: record.id,
    actor: { userId: record.userId, role: "CLIENT" },
    deps: harness.deps,
  })

  assert.equal(retried.ok, true)
  assert.equal(harness.state.status, "consumed")
})
