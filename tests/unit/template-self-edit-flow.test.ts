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

type SessionUser = { id: string; email: string; name?: string | null }
type RedirectError = Error & { url: string; digest: string }

function redirectError(url: string): RedirectError {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    url,
    digest: `NEXT_REDIRECT;replace;${url};303;`,
  })
}

function assertRedirect(error: unknown, url: string) {
  assert.equal(error instanceof Error, true)
  assert.equal((error as Partial<RedirectError>).url, url)
  assert.match((error as Partial<RedirectError>).digest ?? "", new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
}

function createExpectedTree(): EditorTree {
  return {
    rootId: "template-root",
    nodes: {
      "template-root": {
        id: "template-root",
        type: "section",
        displayName: "Template Root",
        props: { tone: "catalog" },
        children: ["hero"],
        version: 1,
      },
      hero: {
        id: "hero",
        type: "section",
        displayName: "Hero",
        props: { title: "Arquitectura premium" },
        parentId: "template-root",
        children: [],
        version: 1,
      },
    },
  }
}

function clearTemplateModuleCache() {
  for (const key of Object.keys(require.cache)) {
    if (
      key.includes("/app/templates/actions.js") ||
      key.includes("/lib/intelligentTemplates.js") ||
      key.includes("/lib/auth.js")
    ) {
      delete require.cache[key]
    }
  }
}

async function withActionMocks<T>(options: {
  session?: { user?: SessionUser | null } | null
  canCreateWebsite?: boolean
  onRunFlow?: (params: Record<string, unknown>) => void
}, callback: (actions: typeof import("../../app/templates/actions")) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const canCreateWebsite = options.canCreateWebsite ?? true

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "next/navigation") {
      return { redirect: (url: string) => { throw redirectError(url) } }
    }
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => options.session ?? null }
    if (request === "@/lib/plan-guard") {
      return {
        requireCanCreateWebsite: async () => {
          if (!canCreateWebsite) throw new Error("website limit reached")
          return { isActive: true, plan: { id: "pro" }, canCreateWebsite: true }
        },
      }
    }
    if (request === "@/lib/intelligentTemplates") {
      return {
        runIntelligentTemplateFlow: async (params: Record<string, unknown>) => {
          options.onRunFlow?.(params)
          return { intentId: "intent_1", site: { id: "site_action" }, nextRoute: "/editor/site_action" }
        },
      }
    }
    if (request === "@/lib/auth") return { createSiteFromTree: async () => ({ id: "unused" }) }
    if (request === "@/lib/editRequests") return { createEditRequest: async () => "ticket_1" }
    if (request === "@/lib/editorWebs") {
      return {
        isEditorWebId: (id: string) => id === "arquitectura",
        getEditorTreeForWeb: createExpectedTree,
        WEB_LABELS: { arquitectura: "Arquitectura" },
      }
    }
    if (request === "@/lib/realTemplates") return { getRealTemplate: () => ({ name: "Arquitectura", category: "Servicios" }) }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearTemplateModuleCache()
    const actions = await import("../../app/templates/actions")
    return await callback(actions)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearTemplateModuleCache()
  }
}

async function withIntelligentFlowMocks<T>(callback: (flow: typeof import("../../lib/intelligentTemplates"), state: {
  createdSites: Array<Record<string, unknown>>
  intents: Array<Record<string, unknown>>
  planChecks: string[]
}) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const state = {
    createdSites: [] as Array<Record<string, unknown>>,
    intents: [] as Array<Record<string, unknown>>,
    planChecks: [] as string[],
  }
  const expectedTree = createExpectedTree()

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/plan-guard") {
      return {
        requireCanCreateWebsite: async (userId: string) => {
          state.planChecks.push(userId)
          return { isActive: true, plan: { id: "pro" }, canCreateWebsite: true }
        },
      }
    }
    if (request === "@/lib/auth") {
      return {
        createSiteFromTree: async (params: Record<string, unknown>) => {
          state.createdSites.push(structuredClone(params))
          return { id: "site_created" }
        },
      }
    }
    if (request === "@/lib/storage-mode") return { isFileStorageMode: () => true }
    if (request === "@/lib/file-store") {
      return {
        fileStoreApi: {
          createTemplateIntent: async (intent: Record<string, unknown>) => {
            state.intents.push(structuredClone(intent))
          },
        },
      }
    }
    if (request === "@/lib/editor-db") return { editorPrisma: {} }
    if (request === "@/lib/editorWebs") {
      return {
        getEditorTreeForWeb: () => expectedTree,
        WEB_LABELS: { arquitectura: "Arquitectura" },
      }
    }
    if (request === "@/lib/realTemplates") {
      return {
        getRealTemplate: () => ({
          id: "arquitectura",
          name: "Arquitectura",
          category: "Servicios",
          livePath: "/webs/arquitectura",
          purchasePriceMxn: 15000,
          rentalPriceMxn: 1500,
        }),
      }
    }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearTemplateModuleCache()
    const flow = await import("../../lib/intelligentTemplates")
    return await callback(flow, state)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearTemplateModuleCache()
  }
}

async function withCreateSiteFromTreeMocks<T>(callback: (auth: typeof import("../../lib/auth"), state: { createdData: Record<string, unknown> | null }) => Promise<T>) {
  const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
  const state: { createdData: Record<string, unknown> | null } = { createdData: null }

  ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/editor-db") {
      return {
        editorPrisma: {
          editorWebsite: {
            count: async () => 0,
            create: async ({ data }: { data: Record<string, unknown> }) => {
              state.createdData = structuredClone(data)
              return { ...data, id: data.id ?? "site_created" }
            },
          },
        },
      }
    }
    if (request === "@/lib/plan-guard") {
      return {
        getUserPlanAccess: async () => ({
          isActive: true,
          plan: { id: "pro", name: "Pro", maxWebsites: 10, maxVisits: 75000, hasEcommerce: true, hasAI: true, hasExport: true },
        }),
      }
    }
    if (request === "@/lib/billing/plan-entitlements") return { canCreateWebsite: () => true }
    if (request === "@/lib/editorWebs") return { getDefaultStarterEditorTree: createExpectedTree, isArtisanEditableTree: () => false }
    if (request === "@/lib/pro-plan") return { isAdvancedBuilderPlan: () => false }
    if (request === "@/lib/professional-site-starter") return { seedProfessionalStarterPages: async () => undefined }
    if (request === "@/lib/builder-core/tree/sitePages") return { HOME_PAGE_NAME: "Inicio", HOME_PAGE_SLUG: "home" }

    return originalLoad.call(this, request, parent, isMain)
  }

  try {
    clearTemplateModuleCache()
    const auth = await import("../../lib/auth")
    return await callback(auth, state)
  } finally {
    ;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = originalLoad
    clearTemplateModuleCache()
  }
}

test("selfEditTemplateAction redirects visitors without creating a site", async () => {
  let runFlowCalled = false

  await withActionMocks({
    session: null,
    onRunFlow: () => { runFlowCalled = true },
  }, async ({ selfEditTemplateAction }) => {
    await assert.rejects(
      () => selfEditTemplateAction("arquitectura"),
      (error) => {
        assertRedirect(error, "/login")
        return true
      },
    )
  })

  assert.equal(runFlowCalled, false)
})

test("selfEditTemplateAction blocks users without website capacity before creating a site", async () => {
  let runFlowCalled = false

  await withActionMocks({
    session: { user: { id: "user_no_plan", email: "cliente@example.com" } },
    canCreateWebsite: false,
    onRunFlow: () => { runFlowCalled = true },
  }, async ({ selfEditTemplateAction }) => {
    await assert.rejects(
      () => selfEditTemplateAction("arquitectura"),
      (error) => {
        assertRedirect(error, "/precios?upgrade=websites&callbackUrl=%2Fwebs")
        return true
      },
    )
  })

  assert.equal(runFlowCalled, false)
})

test("selfEditTemplateAction uses the edit intent and redirects to the created site editor", async () => {
  let flowParams: Record<string, unknown> | null = null

  await withActionMocks({
    session: { user: { id: "user_1", email: "cliente@example.com" } },
    onRunFlow: (params) => { flowParams = params },
  }, async ({ selfEditTemplateAction }) => {
    await assert.rejects(
      () => selfEditTemplateAction("arquitectura"),
      (error) => {
        assertRedirect(error, "/editor/site_action")
        return true
      },
    )
  })

  assert.equal(flowParams?.templateId, "arquitectura")
  assert.equal(flowParams?.intent, "edit")
  assert.deepEqual(flowParams?.user, { id: "user_1", email: "cliente@example.com" })
})

test("runIntelligentTemplateFlow edit creates a user-owned copy from the expected template tree", async () => {
  await withIntelligentFlowMocks(async ({ runIntelligentTemplateFlow }, state) => {
    const result = await runIntelligentTemplateFlow({
      templateId: "arquitectura",
      intent: "edit",
      user: { id: "user_1", email: "cliente@example.com" },
    })

    assert.equal(state.planChecks.length, 1)
    assert.equal(state.planChecks[0], "user_1")
    assert.equal(state.createdSites.length, 1)
    assert.equal(state.createdSites[0].userId, "user_1")
    assert.equal(state.createdSites[0].name, "Arquitectura - Edición propia")
    assert.deepEqual(state.createdSites[0].tree, createExpectedTree())
    assert.equal(result.site.id, "site_created")
    assert.equal(result.nextRoute, "/editor/site_created")
    assert.equal(result.nextRoute.includes("/checkout"), false)
    assert.equal(result.nextRoute.includes("/checkout/start"), false)
    assert.equal(state.intents[0].intent, "edit")
    assert.equal(state.intents[0].status, "editable_created")
    assert.equal(state.intents[0].pricingModel, "self_service")
  })
})

test("createSiteFromTree persists catalog copies as drafts owned by the authenticated user", async () => {
  await withCreateSiteFromTreeMocks(async ({ createSiteFromTree }, state) => {
    const tree = createExpectedTree()
    const site = await createSiteFromTree({
      id: "site_new",
      name: "Sitio nuevo",
      description: "self_service",
      userId: "user_1",
      tree,
      seedProfessionalPages: false,
    })

    assert.equal(site.id, "site_new")
    assert.equal(state.createdData?.userId, "user_1")
    assert.equal(state.createdData?.published, false)
    assert.deepEqual(state.createdData?.tree, tree)
  })
})
