import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { createHash } from "node:crypto"
import type { EditorTree } from "../../types/editor"

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

type AgentResponse = {
  ok: boolean
  action: string
  scope: string
  message: string
  plan?: { after?: EditorTree; snapshot?: unknown }
  warnings: string[]
}

type PreviewRecord = {
  id: string
  userId: string
  previewHash: string
  request: string
  type: string
  status: string
  plan: { after: EditorTree; snapshot?: unknown }
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

function hashEditorTreeForTest(tree: EditorTree) {
  return createHash("sha256").update(JSON.stringify(stableObject(tree))).digest("hex")
}

function createTree(): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["hero", "services"], version: 1 },
      hero: { id: "hero", type: "section", props: {}, children: [], parentId: "root", version: 1 },
      services: { id: "services", type: "section", props: {}, children: [], parentId: "root", version: 1 },
    },
  }
}

async function withActionMocks<T>(options: {
  agentResponse?: AgentResponse
  previewForExecute?: Record<string, unknown> | null
  onRunAgent?: (input: Record<string, unknown>) => void
  onCreateDraftSite?: () => void
}, callback: (action: typeof import("../../app/actions/ai"), previews: PreviewRecord[]) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const previews: PreviewRecord[] = []
  const after = options.agentResponse?.plan?.after ?? createTree()
  const defaultResponse: AgentResponse = {
    ok: true,
    action: "preview",
    scope: "site_creation",
    message: "Preview listo",
    plan: { after, snapshot: { id: "snapshot_1", tree: createTree() } },
    warnings: [],
  }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@anthropic-ai/sdk") return class Anthropic {}
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => ({ user: { id: "user_1", role: "CLIENT" } }) }
    if (request === "@/lib/plan-guard") return { requireAIPlan: async () => undefined, requireCanCreateWebsite: async () => undefined }
    if (request === "@/lib/ai/generationSchema") return { extractFirstJsonObject: () => null, normalizeGeneratedTreeCandidate: () => null }
    if (request === "@/lib/ai/jobs") return { runAIGenerationJob: async (_name: string, fn: () => unknown) => fn() }
    if (request === "@/lib/audit/fixPlan") return { buildAuditFixPlan: () => ({ fixes: [] }) }
    if (request === "@/lib/orvenix-ai/section/artisan-section-references") {
      return { buildArtisanInspiredFallbackTree: () => createTree(), buildArtisanSectionReferenceContext: () => "" }
    }
    if (request === "@/lib/orvenix-ai/guidelines/site-generation-guidelines") return { buildSiteGenerationGuideContext: () => "" }
    if (request === "@/lib/auth") return { canManageSite: async () => true }
    if (request === "@/lib/site-publication") return { createSitePublicationCapability: () => undefined }
    if (request === "@/lib/editorPersistence") return { getEditorTreeFromDb: async () => createTree() }
    if (request === "@/lib/orvenix-ai/mutation/undo-service") {
      return { registerAIUndoForExecutedResult: async () => ({}), rollbackOrvenixAIChange: async () => ({ ok: false, message: "noop" }) }
    }
    if (request === "@/lib/orvenix-ai") {
      return {
        hashEditorTree: hashEditorTreeForTest,
        runOrvenixAgent: async (input: Record<string, unknown>) => {
          options.onRunAgent?.(input)
          return options.agentResponse ?? defaultResponse
        },
      }
    }
    if (request === "@/lib/orvenix-ai/site-creation/preview-store") {
      return {
        createDraftSiteFromPersistedPreview: async () => {
          options.onCreateDraftSite?.()
          return { siteId: "site_1", nextRoute: "/editor/site_1", verified: true, rollbackApplied: false }
        },
        getSiteCreationPreviewFailureMessage: (error: unknown) => error instanceof Error ? error.message : "No se pudo crear el sitio.",
        getSiteCreationPreviewForExecute: async () => options.previewForExecute ?? null,
        rememberSiteCreationPreview: async (record: Omit<PreviewRecord, "id" | "type" | "status">) => {
          const preview = { ...record, id: `preview_${previews.length + 1}`, type: "ai_site_creation_preview", status: "completed" }
          previews.push(preview)
          return preview
        },
      }
    }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    const compiledActionPath = path.join(process.cwd(), ".tmp/unit/app/actions/ai.js")
    delete require.cache[compiledActionPath]
    const action = await import("../../app/actions/ai")
    return await callback(action, previews)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
  }
}

test("site_creation action convierte mensaje de formulario sin verbo en solicitud explicita y persiste un preview", async () => {
  let agentInput: Record<string, unknown> | null = null
  await withActionMocks({ onRunAgent: (input) => { agentInput = input } }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      message: "Negocio: Clínica Aurora. Industria: salud. Objetivo: conseguir citas.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.equal(result.result.scope, "site_creation")
    assert.equal(result.result.action, "preview")
    assert.equal(previews.length, 1)
    assert.equal(previews[0]?.type, "ai_site_creation_preview")
    assert.equal(previews[0]?.status, "completed")
    assert.match(String(agentInput?.message), /^Crea un sitio desde cero\. Negocio: Clínica Aurora/)
    assert.equal(previews[0]?.request, agentInput?.message)
  })
})

test("site_creation action falla y no guarda preview si el agente responde otro scope", async () => {
  await withActionMocks({
    agentResponse: { ok: true, action: "preview", scope: "section_edit", message: "Otro scope", plan: { after: createTree() }, warnings: [] },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      message: "Negocio: Clínica Aurora. Industria: salud. Objetivo: conseguir citas.",
    })

    assert.equal(result.success, false)
    assert.match(result.message, /Preview de sitio completo/i)
    assert.equal(previews.length, 0)
  })
})

test("site_creation action falla y no guarda preview si el agente no devuelve plan.after", async () => {
  await withActionMocks({
    agentResponse: { ok: true, action: "preview", scope: "site_creation", message: "Sin plan", warnings: [] },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      message: "Negocio: Clínica Aurora. Industria: salud. Objetivo: conseguir citas.",
    })

    assert.equal(result.success, false)
    assert.match(result.message, /Preview de sitio completo/i)
    assert.equal(previews.length, 0)
  })
})


test("site_creation execute usa request y plan persistidos", async () => {
  const persistedPlan = { after: createTree(), snapshot: { id: "snapshot_persisted", tree: createTree() } }
  const persistedRequest = "Crea un sitio desde cero. Negocio persistido desde preview."
  let agentInput: Record<string, unknown> | null = null
  await withActionMocks({
    previewForExecute: {
      status: "completed",
      reservedSiteId: "reserved_site_1",
      request: persistedRequest,
      business: { name: "Negocio persistido" },
      plan: persistedPlan,
    },
    agentResponse: {
      ok: true,
      action: "executed",
      scope: "site_creation",
      message: "Sitio creado",
      createdSite: { siteId: "reserved_site_1", nextRoute: "/editor/reserved_site_1", verified: true },
      warnings: [],
    } as AgentResponse,
    onRunAgent: (input) => { agentInput = input },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_1",
      expectedPreviewHash: "a".repeat(64),
      message: "Mensaje nuevo del navegador que no debe usarse",
      business: { name: "Nombre nuevo del navegador" },
    })

    assert.equal(result.success, true)
    assert.equal(agentInput?.message, persistedRequest)
    assert.equal(agentInput?.siteCreationPlan, persistedPlan)
    assert.deepEqual(agentInput?.business, { name: "Negocio persistido" })
  })
})
