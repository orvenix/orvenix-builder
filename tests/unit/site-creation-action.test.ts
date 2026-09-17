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
  plan: Record<string, unknown>
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
  onRunMultiPageBuilder?: (input: Record<string, unknown>) => void
  multiPageBuilderResult?: Record<string, unknown>
  completedPreviewForAttempt?: Record<string, unknown> | null
  onResolveSiteCreationThemeAssistance?: (input: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
  onCreateDraftSite?: () => void
  createDraftSiteResult?: { siteId: string; nextRoute: string; verified: boolean; rollbackApplied?: boolean }
  onRecordDesignGeneration?: (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>
  onAcceptDesignGeneration?: (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>
  onGetDesignPatternRanking?: (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>
  onSelectDesignPattern?: (input: Record<string, unknown>) => Record<string, unknown>
  onCreateDesignPlannerPrior?: (input: Record<string, unknown>) => Record<string, unknown> | null
  onAssessSiteGenerationQuality?: (plan: unknown, options: Record<string, unknown>) => Record<string, unknown>
  onFailSiteCreationPreviewAttempt?: (input: Record<string, unknown>) => void
  onCompleteSiteCreationPreviewAttempt?: (input: Record<string, unknown>) => void
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
    if (request === "@/lib/orvenix-ai/site-creation/assistance" && options.onResolveSiteCreationThemeAssistance) {
      return {
        resolveSiteCreationDesignMemoryDecisionV1: async () => ({
          kind: "abstain",
          designMemoryPrior: null,
          context: { industryBucket: "health", objectiveBucket: "lead_generation", styleBucket: "professional", siteType: "health" },
          reasonCode: "insufficient_evidence",
          reason: [],
        }),
        resolveSiteCreationThemeAssistanceAdvisoryV1: async (input: Record<string, unknown>) => options.onResolveSiteCreationThemeAssistance?.(input),
      }
    }
    if (request === "@/lib/orvenix-ai/evaluation") {
      return {
        assessSiteGenerationQualityV1: (plan: unknown, gateOptions: Record<string, unknown>) => {
          if (options.onAssessSiteGenerationQuality) return options.onAssessSiteGenerationQuality(plan, gateOptions)
          return {
            version: 1,
            decision: "pass",
            decisionCode: "gate_pass_threshold_met",
            hardFailure: false,
            score: 100,
            thresholds: { passScore: 80 },
            reasons: [],
            evaluation: { score: 100, findings: [], hardFailures: [] },
          }
        },
      }
    }
    if (request === "@/lib/orvenix-ai/autonomous/site-builder") {
      return {
        runAutonomousMultiPageSiteBuilder: async (input: Record<string, unknown>) => {
          options.onRunMultiPageBuilder?.(input)
          if (!options.multiPageBuilderResult) {
            throw new Error("Falta multiPageBuilderResult en el test")
          }
          return options.multiPageBuilderResult
        },
      }
    }
    if (request === "@/lib/orvenix-ai/design-memory") {
      return {
        recordDesignGeneration: async (input: Record<string, unknown>) => {
          if (options.onRecordDesignGeneration) {
            return options.onRecordDesignGeneration(input)
          }

          return { ok: true, generationId: "design_generation_1" }
        },
        acceptDesignGeneration: async (input: Record<string, unknown>) => {
          if (options.onAcceptDesignGeneration) {
            return options.onAcceptDesignGeneration(input)
          }

          return { ok: true, generationId: "design_generation_1", status: "accepted" }
        },
        createDesignPatternSelectionTargetV1: (input: Record<string, unknown>) => ({
          version: 1,
          context: input.context,
          l1Key: { version: 1, context: input.context },
          l1KeyHash: "1".repeat(64),
        }),
        getDesignPatternRankingV1: async (input: Record<string, unknown>) => {
          if (options.onGetDesignPatternRanking) return options.onGetDesignPatternRanking(input)
          return { ok: true, rankings: [] }
        },
        selectDesignPatternV1: (input: Record<string, unknown>) => {
          if (options.onSelectDesignPattern) return options.onSelectDesignPattern(input)
          return { version: 1, decision: "abstain", reasonCode: "insufficient_evidence", reason: [] }
        },
        createDesignPlannerPriorV1: (input: Record<string, unknown>) => {
          if (options.onCreateDesignPlannerPrior) return options.onCreateDesignPlannerPrior(input)
          return null
        },
      }
    }
    if (request === "@/lib/orvenix-ai/site-creation/preview-store") {
      return {
        completeSiteCreationPreviewAttempt: async (record: Record<string, unknown>) => {
          options.onCompleteSiteCreationPreviewAttempt?.(record)
          const preview = { ...record, id: String(record.previewId), type: "ai_site_creation_preview", status: "completed" } as PreviewRecord
          previews.push(preview)
          return preview
        },
        createDraftSiteFromPersistedPreview: async () => {
          options.onCreateDraftSite?.()
          return options.createDraftSiteResult ?? { siteId: "site_1", nextRoute: "/editor/site_1", verified: true, rollbackApplied: false }
        },
        failSiteCreationPreviewAttempt: async (input: Record<string, unknown>) => {
          options.onFailSiteCreationPreviewAttempt?.(input)
          return true
        },
        getCompletedSiteCreationPreviewForAttempt: async () => options.completedPreviewForAttempt ?? null,
        getSiteCreationPreviewFailureMessage: (error: unknown) => error instanceof Error ? error.message : "No se pudo crear el sitio.",
        getSiteCreationPreviewForExecute: async () => options.previewForExecute ?? null,
        reserveSiteCreationPreviewAttempt: async ({ clientAttemptKey }: { clientAttemptKey: string }) => ({
          id: `preview_${clientAttemptKey.replace(/[^a-z0-9]/gi, "_")}`,
          userId: "user_1",
          reservedSiteId: "site_reserved_1",
          clientAttemptKeyHash: "h".repeat(64),
          createdAt: new Date(0).toISOString(),
          status: "planning",
        }),
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
    const compiledAssistancePath = path.join(process.cwd(), ".tmp/unit/lib/orvenix-ai/site-creation/assistance.js")
    const compiledEvaluationPath = path.join(process.cwd(), ".tmp/unit/lib/orvenix-ai/evaluation/index.js")
    delete require.cache[compiledActionPath]
    delete require.cache[compiledAssistancePath]
    delete require.cache[compiledEvaluationPath]
    const action = await import("../../app/actions/ai")
    return await callback(action, previews)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
  }
}

test("site_creation action genera V2 multipagina, persiste el plan completo y devuelve previewPages seguro", async () => {
  const homeTree = createTree()
  const servicesTree = createTree()
  const planHash = "b".repeat(64)

  const plan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [
      { label: "Inicio", slug: "home", href: "page:home" },
      { label: "Servicios", slug: "servicios", href: "page:servicios" },
    ],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Atencion profesional" },
        tree: homeTree,
        treeHash: "1".repeat(64),
      },
      {
        slug: "servicios",
        name: "Servicios",
        isHome: false,
        seo: { title: "Servicios", description: "Nuestros servicios" },
        tree: servicesTree,
        treeHash: "2".repeat(64),
      },
    ],
    quality: { score: 92, warnings: [], summary: "Plan multipagina valido" },
  }

  let builderInput: Record<string, unknown> | null = null
  let designMemoryInput: Record<string, unknown> | null = null

  await withActionMocks({
    onRunMultiPageBuilder: (input) => { builderInput = input },
    onRecordDesignGeneration: (input) => {
      designMemoryInput = input
      return { ok: true, generationId: "design_generation_1" }
    },
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash,
      byteLength: 1234,
      pageQuality: [
        { slug: "home", score: 94 },
        { slug: "servicios", score: 90 },
      ],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: {},
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clínica Aurora. Industria: salud. Objetivo: conseguir citas.",
      business: {
        name: "Clinica Aurora",
        industry: "salud",
        objective: "conseguir citas",
        preferredStyle: "moderno y limpio",
      },
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.result.scope, "site_creation")
    assert.equal(result.result.action, "preview")
    assert.deepEqual(result.result.tree, homeTree)
    assert.equal(result.result.plan, undefined)
    assert.deepEqual(result.previewPages?.map((page) => page.slug), ["home", "servicios"])
    assert.deepEqual(result.previewPages?.map((page) => page.title), ["Inicio", "Servicios"])
    assert.deepEqual(result.previewPages?.map((page) => page.isHome), [true, false])
    assert.deepEqual(result.previewPages?.[0]?.tree, homeTree)
    assert.deepEqual(result.previewPages?.[1]?.tree, servicesTree)
    assert.equal(result.qualityGate?.decision, "pass")
    assert.equal(result.qualityGate?.score, 100)
    assert.deepEqual(result.qualityGate?.reasonCodes, [])
    assert.equal(JSON.stringify(result).includes("providerKey"), false)
    assert.equal(JSON.stringify(result).includes("modelKey"), false)
    assert.equal(JSON.stringify(result).includes("Design Memory"), false)
    assert.equal(JSON.stringify(result).includes("assistance"), false)

    assert.equal(result.previewHash, planHash)
    assert.equal(previews.length, 1)
    assert.equal(previews[0]?.previewHash, planHash)
    assert.equal(previews[0]?.type, "ai_site_creation_preview")
    assert.equal(previews[0]?.status, "completed")
    assert.deepEqual(previews[0]?.plan, plan)

    assert.match(
      String(builderInput?.request),
      /^Crea un sitio desde cero\. Negocio: Clínica Aurora/,
    )
    assert.equal(builderInput?.preferredStyle, "moderno y limpio")
    assert.equal(builderInput?.forceFreshComposition, true)
    assert.equal(builderInput?.minimumQuality, 55)
    assert.equal(builderInput?.designMemoryPrior, null)
    assert.equal(designMemoryInput?.userId, "user_1")
    assert.equal(designMemoryInput?.initialPlanHash, planHash)
    assert.equal(designMemoryInput?.siteCreationAttemptId, result.previewId)
    assert.deepEqual(designMemoryInput?.initialPlan, plan)
    assert.equal(designMemoryInput?.industry, "salud")
    assert.equal(designMemoryInput?.siteType, undefined)
    assert.equal(designMemoryInput?.objective, "conseguir citas")
    assert.equal(designMemoryInput?.requestedStyle, "moderno y limpio")
  })
})

test("site_creation action conserva preview valido si Design Memory falla", async () => {
  const homeTree = createTree()
  const planHash = "e".repeat(64)
  const plan = {
    version: 2,
    identity: { name: "Clinica Aurora", industry: "salud" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Inicio" },
        tree: homeTree,
        treeHash: "1".repeat(64),
      },
    ],
    quality: { score: 88, warnings: [], summary: "Plan listo" },
  }

  await withActionMocks({
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash,
      byteLength: 1234,
      pageQuality: [{ slug: "home", score: 88 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "landing" },
      selectedTemplate: null,
    },
    onRecordDesignGeneration: () => ({ ok: false, error: "fallo simulado" }),
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clínica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud" },
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(previews.length, 1)
    assert.equal(result.previewHash, planHash)
    assert.deepEqual(result.result.tree, homeTree)
  })
})

test("site_creation action falla y no guarda preview si el builder multipagina falla", async () => {
  await withActionMocks({
    multiPageBuilderResult: {
      ok: false,
      plan: { version: 2, pages: [] },
      planHash: "c".repeat(64),
      warnings: ["fallo controlado"],
      trace: [],
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clínica Aurora.",
    })

    assert.equal(result.success, false)
    if (result.success) return

    assert.match(result.message, /Preview multipagina valido/i)
    assert.equal(previews.length, 0)
  })
})

test("site_creation action falla y no guarda preview si V2 no contiene home", async () => {
  await withActionMocks({
    multiPageBuilderResult: {
      ok: true,
      planHash: "d".repeat(64),
      plan: {
        version: 2,
        pages: [
          {
            slug: "servicios",
            name: "Servicios",
            isHome: false,
            tree: createTree(),
          },
        ],
      },
      warnings: [],
      trace: [],
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clínica Aurora.",
    })

    assert.equal(result.success, false)
    if (result.success) return

    assert.match(result.message, /pagina principal valida/i)
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

test("site_creation execute V2 crea desde preview persistido sin volver a runOrvenixAgent", async () => {
  const persistedPlan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Inicio" },
        tree: createTree(),
        treeHash: "1".repeat(64),
      },
    ],
    quality: {
      score: 90,
      warnings: [],
      summary: "Plan V2",
    },
  }

  let runAgentCalled = false
  let createDraftCalled = false

  await withActionMocks({
    previewForExecute: {
      status: "completed",
      reservedSiteId: "reserved_site_v2",
      request: "Crea un sitio multipagina para Clinica Aurora.",
      business: { name: "Clinica Aurora" },
      plan: persistedPlan,
    },
    onRunAgent: () => {
      runAgentCalled = true
    },
    onCreateDraftSite: () => {
      createDraftCalled = true
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_v2",
      expectedPreviewHash: "b".repeat(64),
    })

    assert.equal(result.success, true)
    assert.equal(runAgentCalled, false)
    assert.equal(createDraftCalled, true)

    if (!result.success) return

    assert.equal(result.result.scope, "site_creation")
    assert.equal(result.result.action, "executed")
    assert.equal(result.result.createdSite?.siteId, "site_1")
  })
})

test("site_creation execute V2 acepta Design Memory con request, hash y siteId creado", async () => {
  const persistedPlan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Inicio" },
        tree: createTree(),
        treeHash: "1".repeat(64),
      },
    ],
    quality: { score: 90, warnings: [], summary: "Plan V2" },
  }
  const acceptedInputs: Record<string, unknown>[] = []

  await withActionMocks({
    previewForExecute: {
      status: "completed",
      reservedSiteId: "reserved_site_v2",
      request: "Crea un sitio desde cero. Negocio persistido.",
      business: { name: "Clinica Aurora" },
      plan: persistedPlan,
    },
    createDraftSiteResult: {
      siteId: "site_created_v2",
      nextRoute: "/editor/site_created_v2",
      verified: true,
      rollbackApplied: false,
    },
    onAcceptDesignGeneration: (input) => {
      acceptedInputs.push(input)
      return { ok: true, generationId: "design_generation_1", status: "accepted" }
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_v2",
      expectedPreviewHash: "f".repeat(64),
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.siteId, "site_created_v2")
    assert.equal(result.nextRoute, "/editor/site_created_v2")
    assert.deepEqual(acceptedInputs, [
      {
        userId: "user_1",
        request: "Crea un sitio desde cero. Negocio persistido.",
        initialPlanHash: "f".repeat(64),
        siteId: "site_created_v2",
      },
    ])
  })
})

test("site_creation execute consumed vuelve a aceptar Design Memory y recupera el mismo sitio sin crear otro", async () => {
  const persistedPlan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Inicio" },
        tree: createTree(),
        treeHash: "1".repeat(64),
      },
    ],
    quality: { score: 90, warnings: [], summary: "Plan V2" },
  }
  const acceptedInputs: Record<string, unknown>[] = []
  let createDraftCalled = false

  await withActionMocks({
    previewForExecute: {
      status: "consumed",
      request: "Crea un sitio desde cero. Negocio persistido.",
      plan: persistedPlan,
      output: {
        siteId: "site_existing",
        nextRoute: "/editor/site_existing",
      },
    },
    onCreateDraftSite: () => {
      createDraftCalled = true
    },
    onAcceptDesignGeneration: (input) => {
      acceptedInputs.push(input)
      return { ok: true, generationId: "design_generation_1", status: "accepted" }
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_consumed",
      expectedPreviewHash: "a".repeat(64),
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.siteId, "site_existing")
    assert.equal(result.nextRoute, "/editor/site_existing")
    assert.equal(createDraftCalled, false)
    assert.deepEqual(acceptedInputs, [
      {
        userId: "user_1",
        request: "Crea un sitio desde cero. Negocio persistido.",
        initialPlanHash: "a".repeat(64),
        siteId: "site_existing",
      },
    ])
  })
})

test("site_creation execute V2 sigue exitoso si acceptDesignGeneration falla", async () => {
  const persistedPlan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [],
    pages: [
      {
        slug: "home",
        name: "Inicio",
        isHome: true,
        seo: { title: "Clinica Aurora", description: "Inicio" },
        tree: createTree(),
        treeHash: "1".repeat(64),
      },
    ],
    quality: { score: 90, warnings: [], summary: "Plan V2" },
  }

  await withActionMocks({
    previewForExecute: {
      status: "completed",
      reservedSiteId: "reserved_site_v2",
      request: "Crea un sitio desde cero. Negocio persistido.",
      business: { name: "Clinica Aurora" },
      plan: persistedPlan,
    },
    createDraftSiteResult: {
      siteId: "site_created_v2",
      nextRoute: "/editor/site_created_v2",
      verified: true,
      rollbackApplied: false,
    },
    onAcceptDesignGeneration: () => ({ ok: false, error: "fallo simulado" }),
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_v2",
      expectedPreviewHash: "b".repeat(64),
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.siteId, "site_created_v2")
    assert.equal(result.nextRoute, "/editor/site_created_v2")
  })
})

test("site_creation execute legacy no depende de Design Memory accepted", async () => {
  const persistedPlan = { after: createTree(), snapshot: { id: "snapshot_persisted", tree: createTree() } }
  let acceptedCalls = 0

  await withActionMocks({
    previewForExecute: {
      status: "completed",
      reservedSiteId: "reserved_site_legacy",
      request: "Crea un sitio desde cero. Legacy.",
      business: { name: "Legacy" },
      plan: persistedPlan,
    },
    agentResponse: {
      ok: true,
      action: "executed",
      scope: "site_creation",
      message: "Sitio creado",
      createdSite: { siteId: "reserved_site_legacy", nextRoute: "/editor/reserved_site_legacy", verified: true },
      warnings: [],
    } as AgentResponse,
    onAcceptDesignGeneration: () => {
      acceptedCalls += 1
      return { ok: true }
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_legacy",
      expectedPreviewHash: "c".repeat(64),
    })

    assert.equal(result.success, true)
    assert.equal(acceptedCalls, 0)
  })
})

test("site_creation preview continua si Ranking Reader falla", async () => {
  const planHash = "9".repeat(64)
  const homeTree = createTree()
  let builderInput: Record<string, unknown> | null = null

  await withActionMocks({
    onRunMultiPageBuilder: (input) => { builderInput = input },
    onGetDesignPatternRanking: () => ({ ok: false, rankings: [], error: "db down" }),
    multiPageBuilderResult: {
      ok: true,
      plan: {
        version: 2,
        identity: { name: "Clinica Aurora" },
        theme: {},
        navigation: [],
        pages: [{ slug: "home", name: "Inicio", isHome: true, seo: {}, tree: homeTree, treeHash: "1".repeat(64) }],
        quality: { score: 90, warnings: [], summary: "Plan" },
      },
      planHash,
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud" },
    })

    assert.equal(result.success, true)
    assert.equal(builderInput?.designMemoryPrior, null)
  })
})

test("site_creation preview pasa prior advisory al builder sin heredar outcome historico", async () => {
  const planHash = "8".repeat(64)
  const homeTree = createTree()
  const prior = {
    version: 1,
    source: "design_memory",
    mode: "advisory",
    rankingVersion: 1,
    patternVersion: 1,
    level: "L2",
    patternKeyHash: "a".repeat(64),
    evidence: {
      rankingScore: 0.82,
      confidence: "high",
      qualifiedSampleSize: 30,
      fallbackUsed: false,
    },
    recommendation: {
      context: { industryBucket: "health", siteType: "health", objectiveBucket: "lead_generation", styleBucket: "professional" },
      theme: { mode: "dark", accentHue: "purple" },
    },
    reason: [],
  }
  let builderInput: Record<string, unknown> | null = null
  let designMemoryInput: Record<string, unknown> | null = null

  await withActionMocks({
    onRunMultiPageBuilder: (input) => { builderInput = input },
    onGetDesignPatternRanking: () => ({ ok: true, rankings: [{ marker: "ranking" }] }),
    onSelectDesignPattern: () => ({ version: 1, decision: "recommend", level: "L2" }),
    onCreateDesignPlannerPrior: () => prior,
    onRecordDesignGeneration: (input) => {
      designMemoryInput = input
      return { ok: true, generationId: "generation_1" }
    },
    multiPageBuilderResult: {
      ok: true,
      plan: {
        version: 2,
        identity: { name: "Clinica Aurora" },
        theme: {},
        navigation: [],
        pages: [{ slug: "home", name: "Inicio", isHome: true, seo: {}, tree: homeTree, treeHash: "1".repeat(64) }],
        quality: { score: 90, warnings: [], summary: "Plan" },
      },
      planHash,
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-test",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.deepEqual(builderInput?.designMemoryPrior, prior)
    assert.equal(designMemoryInput?.outcomeScore, undefined)
    assert.equal(designMemoryInput?.rankingScore, undefined)
    assert.equal(designMemoryInput?.editDistance, undefined)
    assert.equal(designMemoryInput?.status, undefined)
  })
})

test("site_creation preview pasa external theme advisory aplicado al builder", async () => {
  const homeTree = createTree()
  const planHash = "7".repeat(64)
  let builderInput: Record<string, unknown> | null = null
  let assistanceInput: Record<string, unknown> | null = null

  await withActionMocks({
    onResolveSiteCreationThemeAssistance: (input) => {
      assistanceInput = input
      return {
        ok: true,
        status: "applied",
        assistanceId: "da_" + "1".repeat(64),
        request: {},
        assistance: { ok: true, status: "applied" },
        advisory: {
          version: 1,
          source: "third_party_assistance",
          assistanceId: "da_" + "1".repeat(64),
          providerKey: "deterministic_provider",
          modelKey: "deterministic_model",
          theme: { accentHue: "cyan", radiusBucket: "pill", motionBucket: "subtle" },
        },
      }
    },
    onRunMultiPageBuilder: (input) => { builderInput = input },
    multiPageBuilderResult: {
      ok: true,
      plan: {
        version: 2,
        identity: { name: "Clinica Aurora" },
        theme: {},
        navigation: [],
        pages: [{ slug: "home", name: "Inicio", isHome: true, seo: {}, tree: homeTree, treeHash: "1".repeat(64) }],
        quality: { score: 90, warnings: [], summary: "Plan" },
      },
      planHash,
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-assisted",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.equal(assistanceInput?.siteCreationAttemptId, result.success ? result.previewId : undefined)
    assert.equal((builderInput?.externalThemeAdvisory as Record<string, unknown> | undefined)?.source, "third_party_assistance")
    assert.equal((builderInput?.externalThemeAdvisory as Record<string, unknown> | undefined)?.providerKey, "deterministic_provider")
    assert.equal(builderInput?.designMemoryPrior, null)
  })
})

test("site_creation preview Retry B recupera preview completed sin assistance ni builder", async () => {
  const homeTree = createTree()
  let builderCalls = 0
  let assistanceCalls = 0
  const completedPlan = {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [],
    pages: [{ slug: "home", name: "Inicio", isHome: true, seo: {}, tree: homeTree, treeHash: "1".repeat(64) }],
    quality: { score: 91, warnings: [], summary: "Plan completed" },
  }

  await withActionMocks({
    completedPreviewForAttempt: {
      id: "preview_client_attempt_completed",
      status: "completed",
      previewHash: "6".repeat(64),
      plan: completedPlan,
    },
    onResolveSiteCreationThemeAssistance: () => {
      assistanceCalls += 1
      return { ok: true, status: "skipped", reason: "disabled" }
    },
    onRunMultiPageBuilder: () => { builderCalls += 1 },
    multiPageBuilderResult: {
      ok: true,
      plan: completedPlan,
      planHash: "6".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 91 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:attempt-completed",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora" },
    })

    assert.equal(result.success, true)
    if (!result.success) return

    assert.equal(result.previewId, "preview_client_attempt_completed")
    assert.equal(result.previewHash, "6".repeat(64))
    assert.deepEqual(result.result.tree, homeTree)
    assert.equal(assistanceCalls, 0)
    assert.equal(builderCalls, 0)
  })
})

function createQualityGatePlan(homeTree = createTree()) {
  return {
    version: 2,
    identity: { name: "Clinica Aurora" },
    theme: {},
    navigation: [{ label: "Inicio", slug: "home", href: "page:home" }],
    pages: [{ slug: "home", name: "Inicio", isHome: true, seo: {}, tree: homeTree, treeHash: "1".repeat(64) }],
    quality: { score: 90, warnings: [], summary: "Plan" },
  }
}

function qualityGate(decision: "pass" | "review" | "reject", params: { score?: number; hardFailure?: boolean; reasonCode?: string } = {}) {
  const score = params.score ?? (decision === "pass" ? 95 : decision === "review" ? 62 : 10)
  const hardFailure = params.hardFailure ?? decision === "reject"
  const decisionCode = decision === "pass"
    ? "gate_pass_threshold_met"
    : decision === "review"
      ? "gate_review_below_threshold"
      : "gate_reject_hard_failure"

  return {
    version: 1,
    decision,
    decisionCode,
    hardFailure,
    score,
    thresholds: { passScore: 80 },
    reasons: params.reasonCode
      ? [{ code: params.reasonCode, category: hardFailure ? "structuralSafety" : "objectiveQuality", severity: hardFailure ? "error" : "warning", dimension: "structure" }]
      : [],
    evaluation: { score, findings: [], hardFailures: hardFailure ? [params.reasonCode ?? "hard_failure"] : [] },
  }
}

test("site_creation Quality Gate PASS completa preview despues del builder y antes de persistir", async () => {
  const plan = createQualityGatePlan()
  const events: string[] = []

  await withActionMocks({
    onRunMultiPageBuilder: () => { events.push("builder") },
    onAssessSiteGenerationQuality: (inputPlan) => {
      events.push("quality_gate")
      assert.deepEqual(inputPlan, plan)
      return qualityGate("pass", { reasonCode: "pass_info" })
    },
    onCompleteSiteCreationPreviewAttempt: () => { events.push("complete") },
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash: "8".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-pass",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.deepEqual(events, ["builder", "quality_gate", "complete"])
    assert.equal(previews.length, 1)
    assert.deepEqual(previews[0]?.plan, plan)
    assert.equal(JSON.stringify(previews[0]?.plan).includes("quality_gate"), false)
    assert.ok(result.success && result.result.warnings.some((warning) => warning.startsWith("quality_gate:pass:")))
    assert.equal(result.success && result.qualityGate?.decision, "pass")
    assert.equal(result.success && result.qualityGate?.score, 95)
    assert.deepEqual(result.success && result.qualityGate?.reasonCodes, ["pass_info"])
  })
})

test("site_creation Quality Gate REVIEW completa preview y no dispara segunda generacion", async () => {
  const plan = createQualityGatePlan()
  let builderCalls = 0
  let gateCalls = 0

  await withActionMocks({
    onRunMultiPageBuilder: () => { builderCalls += 1 },
    onAssessSiteGenerationQuality: () => {
      gateCalls += 1
      return qualityGate("review", { score: 40, reasonCode: "duplicate_placeholder_content" })
    },
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash: "9".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 40 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-review",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.equal(builderCalls, 1)
    assert.equal(gateCalls, 1)
    assert.equal(previews.length, 1)
    assert.ok(result.success && result.result.warnings.includes("quality_gate_reason:duplicate_placeholder_content"))
    assert.equal(result.success && result.qualityGate?.decision, "review")
    assert.equal(result.success && result.qualityGate?.score, 40)
    assert.deepEqual(result.success && result.qualityGate?.reasonCodes, ["duplicate_placeholder_content"])
    assert.equal(JSON.stringify(previews[0]?.plan).includes("quality_gate"), false)
  })
})

test("site_creation Quality Gate REJECT no persiste preview completed y marca attempt failed", async () => {
  const plan = createQualityGatePlan()
  const failures: Record<string, unknown>[] = []

  await withActionMocks({
    onAssessSiteGenerationQuality: () => qualityGate("reject", { hardFailure: true, reasonCode: "structure_plan_invalid" }),
    onFailSiteCreationPreviewAttempt: (input) => { failures.push(input) },
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash: "a".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 10 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-reject",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, false)
    assert.equal(previews.length, 0)
    assert.equal(failures.length, 1)
    assert.equal(failures[0]?.error, "gate_reject_hard_failure")
    assert.equal(String(result.message).includes("structure_plan_invalid"), false)
  })
})

test("site_creation Quality Gate score bajo sin hard failure es REVIEW, no REJECT", async () => {
  const plan = createQualityGatePlan()

  await withActionMocks({
    onAssessSiteGenerationQuality: () => qualityGate("review", { score: 1, hardFailure: false, reasonCode: "low_conversion_readiness" }),
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash: "c".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 1 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-low-score",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, true)
    assert.equal(previews.length, 1)
  })
})

test("site_creation Retry B y execute no vuelven a ejecutar Quality Gate", async () => {
  const homeTree = createTree()
  const completedPlan = createQualityGatePlan(homeTree)
  let gateCalls = 0
  let builderCalls = 0
  let createDraftCalls = 0

  await withActionMocks({
    completedPreviewForAttempt: {
      id: "preview_completed_quality",
      status: "completed",
      previewHash: "d".repeat(64),
      plan: completedPlan,
    },
    previewForExecute: {
      id: "preview_completed_quality",
      status: "completed",
      previewHash: "d".repeat(64),
      plan: completedPlan,
      reservedSiteId: "site_reserved_1",
      request: "Crea un sitio desde cero. Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora" },
    },
    onRunMultiPageBuilder: () => { builderCalls += 1 },
    onAssessSiteGenerationQuality: () => {
      gateCalls += 1
      return qualityGate("pass")
    },
    onCreateDraftSite: () => { createDraftCalls += 1 },
    multiPageBuilderResult: {
      ok: true,
      plan: completedPlan,
      planHash: "d".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action) => {
    const retry = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-completed",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora" },
    })
    assert.equal(retry.success, true)
    assert.deepEqual(retry.success && retry.previewPages?.map((page) => page.slug), ["home"])
    assert.deepEqual(retry.success && retry.result.tree, homeTree)

    const execute = await action.runOrvenixSiteCreationAction({
      mode: "execute",
      confirmed: true,
      previewId: "preview_completed_quality",
      expectedPreviewHash: "d".repeat(64),
    })
    assert.equal(execute.success, true)
    assert.equal(execute.success && execute.previewPages, undefined)
    assert.equal(builderCalls, 0)
    assert.equal(gateCalls, 0)
    assert.equal(createDraftCalls, 1)
  })
})

test("site_creation fallo tecnico del Quality Gate falla cerrado sin persistir preview", async () => {
  const plan = createQualityGatePlan()
  const failures: Record<string, unknown>[] = []

  await withActionMocks({
    onAssessSiteGenerationQuality: () => { throw new Error("gate down with private details") },
    onFailSiteCreationPreviewAttempt: (input) => { failures.push(input) },
    multiPageBuilderResult: {
      ok: true,
      plan,
      planHash: "e".repeat(64),
      byteLength: 100,
      pageQuality: [{ slug: "home", score: 90 }],
      warnings: [],
      trace: [],
      repaired: false,
      architecture: { siteType: "health" },
      selectedTemplate: null,
    },
  }, async (action, previews) => {
    const result = await action.runOrvenixSiteCreationAction({
      mode: "preview",
      clientAttemptKey: "client:quality-throw",
      message: "Negocio: Clinica Aurora.",
      business: { name: "Clinica Aurora", industry: "salud", objective: "conseguir citas" },
    })

    assert.equal(result.success, false)
    assert.equal(previews.length, 0)
    assert.equal(failures[0]?.error, "SITE_CREATION_QUALITY_GATE_FAILED")
    assert.equal(String(result.message).includes("private details"), false)
  })
})
