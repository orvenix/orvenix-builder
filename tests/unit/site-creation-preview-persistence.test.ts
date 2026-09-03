import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { createHash } from "node:crypto"
import type { EditorTree } from "../../types/editor"
import type { OrvenixAIMutationPlan } from "../../lib/orvenix-ai/mutation/types"

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

function createTree(ids: string[], theme = true): EditorTree {
  const rootId = ids[0] ?? "root"
  return {
    rootId,
    ...(theme
      ? {
          theme: {
            colors: {
              primary: "#1BB3FA",
              secondary: "#1379A8",
              background: "#ffffff",
              text: "#082f49",
              accent: "#1794CC",
            },
            fontHeading: "Inter",
            fontBody: "Inter",
            spacing: { sectionX: "1rem", sectionY: "2rem", stack: "1rem" },
            radius: { card: "1rem", button: "999px" },
            shadow: { soft: "none", strong: "none" },
            motion: { duration: "200ms", easing: "ease" },
          },
          globalTheme: {
            colors: {
              primary: "#1BB3FA",
              secondary: "#1379A8",
              background: "#ffffff",
              text: "#082f49",
              accent: "#1794CC",
            },
            fontHeading: "Inter",
            fontBody: "Inter",
            spacing: { sectionX: "1rem", sectionY: "2rem", stack: "1rem" },
            radius: { card: "1rem", button: "999px" },
            shadow: { soft: "none", strong: "none" },
            motion: { duration: "200ms", easing: "ease" },
          },
        }
      : {}),
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

function createPlan(siteId: string, after = createTree(["root", "hero", "services", "faq", "contact", "footer"])): OrvenixAIMutationPlan {
  const before = createTree(["before-root"])
  return {
    siteId,
    snapshot: {
      id: "snapshot_1",
      siteId,
      createdAt: new Date(0).toISOString(),
      tree: before,
    },
    before,
    after,
    addedNodes: Object.keys(after.nodes).length,
    removedNodes: 1,
    changedNodes: 0,
    safe: true,
    safetyScore: 100,
    readyToApply: true,
    warnings: [],
  }
}

type Job = {
  id: string
  siteId: string | null
  pageId: string | null
  type: string
  input: unknown
  output: unknown | null
  status: string
  error: string | null
  createdAt: Date
  updatedAt: Date
}

type Site = { id: string; name: string; description: string; tree: unknown; userId: string; published: boolean }
type Page = { id: string; siteId: string; name: string; slug: string; tree: unknown; isHome: boolean; published: boolean }
type Theme = { siteId: string; tokens: unknown }

function cloneMap<T>(map: Map<string, T>) {
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, structuredClone(value)]))
}

function createHarness({ planId = "pro", themeFails = false, createFails = false, skipThemeWrite = false } = {}) {
  const jobs = new Map<string, Job>()
  const websites = new Map<string, Site>()
  const pages = new Map<string, Page>()
  const themes = new Map<string, Theme>()

  function tx() {
    return {
      $queryRaw: async () => [],
      subscription: {
        findUnique: async () => ({
          status: "active",
          plan: {
            id: planId,
            name: planId,
            maxWebsites: planId === "starter" ? 1 : 10,
            maxVisits: 10000,
            hasEcommerce: true,
            hasAI: true,
            hasExport: true,
          },
        }),
      },
      editorWebsite: {
        count: async ({ where }: { where: { userId: string } }) => Array.from(websites.values()).filter((site) => site.userId === where.userId).length,
        findUnique: async ({ where }: { where: { id: string } }) => websites.get(where.id) ?? null,
        create: async ({ data }: { data: Site }) => {
          if (createFails) throw new Error("Prisma SQL leaked tree secret")
          const site = structuredClone(data)
          websites.set(site.id, site)
          return site
        },
      },
      sitePage: {
        create: async ({ data }: { data: Page }) => {
          const page = { ...structuredClone(data), id: `page_${pages.size + 1}` }
          pages.set(`${page.siteId}:${page.slug}`, page)
          return page
        },
        findFirst: async ({ where }: { where: { siteId: string; slug: string; isHome: boolean } }) => {
          const page = pages.get(`${where.siteId}:${where.slug}`)
          return page && page.isHome === where.isHome ? page : null
        },
      },
      siteTheme: {
        upsert: async ({ where, create, update }: { where: { siteId: string }; create: Theme; update: { tokens: unknown } }) => {
          if (themeFails) throw new Error("theme persistence failed")
          const theme = themes.get(where.siteId) ? { siteId: where.siteId, tokens: update.tokens } : structuredClone(create)
          if (!skipThemeWrite) themes.set(where.siteId, theme)
          return theme
        },
        findUnique: async ({ where }: { where: { siteId: string } }) => themes.get(where.siteId) ?? null,
      },
      aiGenerationJob: {
        findUnique: async ({ where }: { where: { id: string } }) => jobs.get(where.id) ?? null,
        updateMany: async ({ where, data }: { where: { id: string; type: string; status: string }; data: Partial<Job> }) => {
          const job = jobs.get(where.id)
          if (!job || job.type !== where.type || job.status !== where.status) return { count: 0 }
          jobs.set(where.id, { ...job, ...structuredClone(data), updatedAt: new Date() })
          return { count: 1 }
        },
        deleteMany: async () => ({ count: 0 }),
        create: async ({ data }: { data: Job }) => {
          const job = { ...structuredClone(data), createdAt: new Date(), updatedAt: new Date() }
          jobs.set(job.id, job)
          return job
        },
      },
    }
  }

  const prisma = {
    aiGenerationJob: tx().aiGenerationJob,
    $transaction: async <T>(callback: (client: ReturnType<typeof tx>) => Promise<T>) => {
      const jobBackup = cloneMap(jobs)
      const siteBackup = cloneMap(websites)
      const pageBackup = cloneMap(pages)
      const themeBackup = cloneMap(themes)
      try {
        return await callback(tx())
      } catch (error) {
        jobs.clear(); jobBackup.forEach((value, key) => jobs.set(key, value))
        websites.clear(); siteBackup.forEach((value, key) => websites.set(key, value))
        pages.clear(); pageBackup.forEach((value, key) => pages.set(key, value))
        themes.clear(); themeBackup.forEach((value, key) => themes.set(key, value))
        throw error
      }
    },
  }

  return { prisma, jobs, websites, pages, themes }
}

async function installHarness(harness: ReturnType<typeof createHarness>) {
  const editorDb = await import("../../lib/editor-db")
  const prisma = editorDb.editorPrisma as unknown as Record<string, unknown>
  prisma.aiGenerationJob = harness.prisma.aiGenerationJob
  prisma.$transaction = harness.prisma.$transaction
}

function addPreviewJob(params: {
  jobs: Map<string, Job>
  id: string
  userId?: string
  reservedSiteId?: string
  status?: string
  output?: unknown | null
  expiresAt?: string
  plan?: OrvenixAIMutationPlan
}) {
  const reservedSiteId = params.reservedSiteId ?? `site_${params.id}`
  const plan = params.plan ?? createPlan(reservedSiteId)
  params.jobs.set(params.id, {
    id: params.id,
    siteId: null,
    pageId: null,
    type: "ai_site_creation_preview",
    input: {
      userId: params.userId ?? "user_1",
      previewHash: hashEditorTreeForTest(plan.after),
      reservedSiteId,
      request: "Crea un sitio para una clinica dental",
      business: { name: "Clinica Aurora", industry: "salud" },
      plan,
      createdAt: new Date(0).toISOString(),
      expiresAt: params.expiresAt ?? new Date(Date.now() + 60_000).toISOString(),
    },
    output: params.output ?? null,
    status: params.status ?? "completed",
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return plan
}

test("execute crea sitio, home y theme juntos como borrador y consume el preview", async () => {
  const harness = createHarness({ planId: "pro" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_1", reservedSiteId: "site_reserved_1" })
  const result = await service.createDraftSiteFromPersistedPreview({
    userId: "user_1",
    previewId: "preview_1",
    expectedPreviewHash: hashEditorTreeForTest(plan.after),
  })

  assert.equal(result.siteId, "site_reserved_1")
  assert.equal(result.nextRoute, "/editor/site_reserved_1")
  assert.equal(harness.websites.get("site_reserved_1")?.published, false)
  assert.equal(harness.pages.get("site_reserved_1:home")?.published, false)
  assert.equal(harness.themes.has("site_reserved_1"), true)
  assert.equal(harness.jobs.get("preview_1")?.status, "consumed")
})

test("dos previews distintos con un solo cupo solo permiten crear uno", async () => {
  const harness = createHarness({ planId: "pro" })
  for (let index = 0; index < 9; index += 1) {
    harness.websites.set(`existing_${index}`, {
      id: `existing_${index}`,
      name: `Existente ${index}`,
      description: "",
      tree: createTree([`existing_root_${index}`]),
      userId: "user_1",
      published: false,
    })
  }
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const firstPlan = addPreviewJob({ jobs: harness.jobs, id: "preview_a", reservedSiteId: "site_a" })
  const secondPlan = addPreviewJob({ jobs: harness.jobs, id: "preview_b", reservedSiteId: "site_b" })

  await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_a", expectedPreviewHash: hash(firstPlan.after) })
  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_b", expectedPreviewHash: hash(secondPlan.after) }),
    /límite|limite|plan|sitios/i,
  )

  assert.equal(harness.websites.size, 10)
  assert.equal(harness.jobs.get("preview_b")?.status, "completed")
})

test("repetir execute despues de consumed devuelve el mismo sitio", async () => {
  const harness = createHarness({ planId: "pro" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_done", reservedSiteId: "site_done" })

  const first = await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_done", expectedPreviewHash: hash(plan.after) })
  const second = await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_done", expectedPreviewHash: hash(plan.after) })

  assert.deepEqual(second, first)
  assert.equal(harness.websites.size, 1)
})

test("otro usuario no puede recuperar un preview consumed", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const plan = createPlan("site_done")
  addPreviewJob({
    jobs: harness.jobs,
    id: "preview_forbidden",
    userId: "user_1",
    reservedSiteId: "site_done",
    status: "consumed",
    output: { siteId: "site_done", nextRoute: "/editor/site_done", consumedAt: new Date().toISOString() },
    plan,
  })

  await assert.rejects(
    service.getSiteCreationPreviewForExecute({ userId: "user_2", previewId: "preview_forbidden", expectedPreviewHash: hash(plan.after) }),
    /permiso/i,
  )
})

test("fallo en SiteTheme revierte EditorWebsite, SitePage y mantiene preview completed", async () => {
  const harness = createHarness({ themeFails: true })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_theme", reservedSiteId: "site_theme" })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_theme", expectedPreviewHash: hash(plan.after) }),
    /No se pudo crear el sitio con Orvenix AI/,
  )

  assert.equal(harness.websites.size, 0)
  assert.equal(harness.pages.size, 0)
  assert.equal(harness.jobs.get("preview_theme")?.status, "completed")
})

test("normaliza la identidad interna del plan al reservedSiteId", async () => {
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = createPlan("draft:site-creation:user_1")
  const normalized = service.normalizeSiteCreationPlanForReservedSite(plan, "site_reserved")

  assert.equal(normalized.siteId, "site_reserved")
  assert.equal(normalized.snapshot.siteId, "site_reserved")
})

test("payload demasiado grande se rechaza antes de guardar", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hugeText = "x".repeat(service.SITE_CREATION_PREVIEW_MAX_BYTES)
  const plan = createPlan("draft:site-creation:user_1", createTree(["root", "hero"]))
  plan.after.nodes.hero.props = { hugeText }
  const hash = hashEditorTreeForTest(plan.after)

  await assert.rejects(
    service.rememberSiteCreationPreview({ userId: "user_1", previewHash: hash, request: "crear", business: { name: "Demo" }, plan }),
    /demasiado grande/i,
  )
  assert.equal(harness.jobs.size, 0)
})

test("errores Prisma no filtran SQL, arbol ni payload interno", async () => {
  const harness = createHarness({ createFails: true })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_prisma", reservedSiteId: "site_prisma" })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_prisma", expectedPreviewHash: hash(plan.after) }),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      assert.equal(error.message.includes("SQL"), false)
      assert.equal(error.message.includes("tree"), false)
      assert.equal(error.message.includes("secret"), false)
      assert.match(error.message, /No se pudo crear el sitio con Orvenix AI/)
      return true
    },
  )
  assert.equal(harness.jobs.get("preview_prisma")?.status, "completed")
})

test("preview expirado bloquea creacion pendiente pero consumed vencido recupera ruta", async () => {
  const harness = createHarness({ planId: "pro" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const hash = hashEditorTreeForTest
  const expiredAt = new Date(Date.now() - 60_000).toISOString()
  const pendingPlan = addPreviewJob({ jobs: harness.jobs, id: "preview_expired", reservedSiteId: "site_expired", expiresAt: expiredAt })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: "preview_expired", expectedPreviewHash: hash(pendingPlan.after) }),
    /expiro/i,
  )

  const consumedPlan = createPlan("site_consumed_expired")
  addPreviewJob({
    jobs: harness.jobs,
    id: "preview_consumed_expired",
    reservedSiteId: "site_consumed_expired",
    status: "consumed",
    expiresAt: expiredAt,
    output: { siteId: "site_consumed_expired", nextRoute: "/editor/site_consumed_expired", consumedAt: new Date().toISOString() },
    plan: consumedPlan,
  })

  const recovered = await service.createDraftSiteFromPersistedPreview({
    userId: "user_1",
    previewId: "preview_consumed_expired",
    expectedPreviewHash: hash(consumedPlan.after),
  })

  assert.equal(recovered.nextRoute, "/editor/site_consumed_expired")
  assert.equal(harness.websites.has("site_consumed_expired"), false)
})


test("servicio ignora name, description y tree alternativos enviados por un llamador", async () => {
  const harness = createHarness({ planId: "pro" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_alt", reservedSiteId: "site_alt" })
  const alternateTree = createTree(["alternate-root", "dangerous-block"])
  const callWithExtraFields = service.createDraftSiteFromPersistedPreview as unknown as (params: {
    userId: string
    previewId: string
    expectedPreviewHash: string
    name: string
    description: string
    tree: EditorTree
  }) => Promise<unknown>

  await callWithExtraFields({
    userId: "user_1",
    previewId: "preview_alt",
    expectedPreviewHash: hashEditorTreeForTest(plan.after),
    name: "Nombre inyectado",
    description: "Descripcion inyectada",
    tree: alternateTree,
  })

  assert.equal(harness.websites.get("site_alt")?.name, "Clinica Aurora")
  assert.equal(harness.websites.get("site_alt")?.description, "Crea un sitio para una clinica dental")
  assert.deepEqual(harness.pages.get("site_alt:home")?.tree, plan.after)
  assert.notDeepEqual(harness.pages.get("site_alt:home")?.tree, alternateTree)
})


test("preview generado bloquea execute si el usuario ya no tiene AI y no crea sitio", async () => {
  const harness = createHarness({ planId: "starter" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_no_ai", reservedSiteId: "site_no_ai" })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({
      userId: "user_1",
      previewId: "preview_no_ai",
      expectedPreviewHash: hashEditorTreeForTest(plan.after),
    }),
    /Orvenix AI|IA|plan/i,
  )

  assert.equal(harness.websites.size, 0)
  assert.equal(harness.pages.size, 0)
  assert.equal(harness.jobs.get("preview_no_ai")?.status, "completed")
})

test("preview consumed recupera el mismo sitio aunque el plan ya no tenga AI", async () => {
  const harness = createHarness({ planId: "starter" })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = createPlan("site_consumed_no_ai")
  addPreviewJob({
    jobs: harness.jobs,
    id: "preview_consumed_no_ai",
    reservedSiteId: "site_consumed_no_ai",
    status: "consumed",
    output: { siteId: "site_consumed_no_ai", nextRoute: "/editor/site_consumed_no_ai", consumedAt: new Date().toISOString() },
    plan,
  })

  const recovered = await service.createDraftSiteFromPersistedPreview({
    userId: "user_1",
    previewId: "preview_consumed_no_ai",
    expectedPreviewHash: hashEditorTreeForTest(plan.after),
  })

  assert.equal(recovered.siteId, "site_consumed_no_ai")
  assert.equal(recovered.nextRoute, "/editor/site_consumed_no_ai")
  assert.equal(harness.websites.size, 0)
})


test("preview persistido contiene theme y globalTheme", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = createPlan("site_with_both_theme")
  const previewHash = hashEditorTreeForTest(plan.after)

  const preview = await service.rememberSiteCreationPreview({
    userId: "user_1",
    previewHash,
    request: "Crea un sitio desde cero para una clinica dental",
    business: { name: "Clinica Aurora", industry: "salud" },
    plan,
  })

  assert.ok(preview.plan.after.theme)
  assert.ok(preview.plan.after.globalTheme)
  assert.deepEqual(preview.plan.after.theme, preview.plan.after.globalTheme)
})

test("preview nuevo sin theme ni globalTheme no se persiste", async () => {
  const harness = createHarness()
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = createPlan("site_without_theme", createTree(["root", "hero"], false))

  await assert.rejects(
    service.rememberSiteCreationPreview({
      userId: "user_1",
      previewHash: hashEditorTreeForTest(plan.after),
      request: "Crea un sitio desde cero para una clinica dental",
      business: { name: "Clinica Aurora", industry: "salud" },
      plan,
    }),
    /Theme valido/i,
  )

  assert.equal(harness.jobs.size, 0)
})

test("verificacion falla y revierte si SiteTheme no existe", async () => {
  const harness = createHarness({ skipThemeWrite: true })
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const plan = addPreviewJob({ jobs: harness.jobs, id: "preview_no_site_theme", reservedSiteId: "site_no_theme" })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({
      userId: "user_1",
      previewId: "preview_no_site_theme",
      expectedPreviewHash: hashEditorTreeForTest(plan.after),
    }),
    /no pudo verificarse/i,
  )

  assert.equal(harness.websites.has("site_no_theme"), false)
  assert.equal(harness.pages.has("site_no_theme:home"), false)
  assert.equal(harness.themes.has("site_no_theme"), false)
  assert.equal(harness.jobs.get("preview_no_site_theme")?.status, "completed")
})
