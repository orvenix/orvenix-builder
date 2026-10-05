import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"
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

import { compileCommercialDesignV1, getCommercialDesignV1 } from "../../lib/orvenix-ai/commercial-designs"
import { validateSiteCreationPlanV2, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { PLAN_ENTITLEMENTS } from "../../lib/billing/plan-entitlements"
import { REAL_TEMPLATES } from "../../lib/realTemplates"

/*
 * SALES-2 / decision 1: a customer who picks an Orvenix design receives the
 * whole design (every page of the recipe), on any plan -- Starter included.
 * pagesPerWebsite keeps protecting every page created AFTER that.
 */

type Site = { id: string; name: string; description?: string; tree: unknown; userId: string; published: boolean }
type Page = { id: string; siteId: string; name: string; slug: string; tree: unknown; seo?: unknown; isHome: boolean; published: boolean; createdAt: Date }
type Job = { id: string; siteId: string | null; pageId: string | null; type: string; input: unknown; output: unknown; status: string; error: string | null; createdAt: Date; updatedAt: Date }

function createStore(planId: string) {
  const websites = new Map<string, Site>()
  const pages = new Map<string, Page>()
  const themes = new Map<string, { siteId: string; tokens: unknown }>()
  const jobs = new Map<string, Job>()
  const subscription = {
    status: "active",
    plan: { id: planId, name: planId, maxWebsites: planId === "starter" ? 1 : 10, maxVisits: 15000, hasEcommerce: planId !== "starter", hasAI: planId !== "starter", hasExport: planId !== "starter" },
  }

  const matchesPage = (page: Page, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => (page as unknown as Record<string, unknown>)[key] === value)

  const client = {
    $queryRaw: async () => [],
    subscription: { findUnique: async () => structuredClone(subscription) },
    editorWebsite: {
      count: async ({ where }: { where: { userId: string } }) => Array.from(websites.values()).filter((site) => site.userId === where.userId).length,
      findUnique: async ({ where }: { where: { id: string } }) => (websites.has(where.id) ? structuredClone(websites.get(where.id)!) : null),
      create: async ({ data }: { data: Site }) => {
        websites.set(data.id, structuredClone({ published: false, ...data }))
        return structuredClone(websites.get(data.id)!)
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Site> }) => {
        const next = { ...websites.get(where.id)!, ...structuredClone(data) }
        websites.set(where.id, next)
        return next
      },
      upsert: async ({ where, update, create }: { where: { id: string }; update: Partial<Site>; create: Site }) => {
        const current = websites.get(where.id)
        websites.set(where.id, current ? { ...current, ...structuredClone(update) } : structuredClone(create))
        return structuredClone(websites.get(where.id)!)
      },
    },
    sitePage: {
      create: async ({ data }: { data: Omit<Page, "id" | "createdAt"> }) => {
        const page = { ...structuredClone(data), id: `page_${pages.size + 1}`, createdAt: new Date(Date.now() + pages.size) } as Page
        pages.set(`${page.siteId}:${page.slug}`, page)
        return structuredClone(page)
      },
      update: async ({ where, data }: { where: { id?: string; siteId_slug?: { siteId: string; slug: string } }; data: Partial<Page> }) => {
        const key = where.siteId_slug
          ? `${where.siteId_slug.siteId}:${where.siteId_slug.slug}`
          : Array.from(pages.entries()).find(([, page]) => page.id === where.id)?.[0] ?? `missing:${where.id}`
        const current = pages.get(key)
        if (!current) throw new Error(`SitePage no encontrada: ${key}`)
        pages.set(key, { ...current, ...structuredClone(data) })
        return structuredClone(pages.get(key)!)
      },
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        const page = Array.from(pages.values()).find((item) => matchesPage(item, where))
        return page ? structuredClone(page) : null
      },
      findMany: async ({ where }: { where: { siteId: string } }) =>
        Array.from(pages.values()).filter((page) => page.siteId === where.siteId).sort((a, b) => a.slug.localeCompare(b.slug)).map((page) => structuredClone(page)),
    },
    siteTheme: {
      upsert: async ({ where, create, update }: { where: { siteId: string }; create: { siteId: string; tokens: unknown }; update: { tokens: unknown } }) => {
        themes.set(where.siteId, themes.has(where.siteId) ? { siteId: where.siteId, tokens: update.tokens } : structuredClone(create))
        return themes.get(where.siteId)
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
    },
  }

  return { client, websites, pages, jobs }
}

async function install(store: ReturnType<typeof createStore>) {
  const editorDb = await import("../../lib/editor-db")
  const prisma = editorDb.editorPrisma as unknown as Record<string, unknown>
  for (const [key, value] of Object.entries(store.client)) prisma[key] = value
  prisma.$transaction = async <T>(callback: (tx: typeof store.client) => Promise<T>) => callback(store.client)
}

async function persistConstructionPreview(store: ReturnType<typeof createStore>, siteId: string) {
  const template = REAL_TEMPLATES.find((item) => item.id === "construction")!
  const compiled = await compileCommercialDesignV1({ mode: "demo", designId: "construction", version: template.commercialDesignVersion! })
  const plan = compiled.generated.plan
  const validation = validateSiteCreationPlanV2(plan, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS)
  assert.ok(validation.ok, "the construction plan is a valid multi-page plan")
  const planHash = (validation as { planHash: string }).planHash
  store.jobs.set("preview_construction", {
    id: "preview_construction",
    siteId: null,
    pageId: null,
    type: "ai_site_creation_preview",
    input: {
      userId: "user_starter",
      clientAttemptKeyHash: "h".repeat(64),
      previewHash: planHash,
      reservedSiteId: siteId,
      request: "Diseño Orvenix construction",
      business: { name: "Constructora Demo" },
      plan,
      createdAt: new Date(0).toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
    output: null,
    status: "completed",
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return { plan, planHash }
}

function anyTree(): EditorTree {
  return { rootId: "root", nodes: { root: { id: "root", type: "section", props: {}, children: [], version: 1 } } }
}

test("SALES-2: Construction ships more pages than Starter's page limit (the case this block covers)", () => {
  const template = REAL_TEMPLATES.find((item) => item.id === "construction")!
  const design = getCommercialDesignV1(template.commercialDesignId!, template.commercialDesignVersion!)!
  const starterLimit = PLAN_ENTITLEMENTS.starter.limits.pagesPerWebsite!
  assert.equal(starterLimit, 5, "official Starter limit is unchanged")
  assert.ok(design.pages.length > starterLimit, `construction has ${design.pages.length} pages`)
})

test("SALES-2: a Starter customer receives the complete Construction design as one unit", async () => {
  const store = createStore("starter")
  await install(store)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const { plan, planHash } = await persistConstructionPreview(store, "site_construction")

  const result = await service.createDraftSiteFromPersistedPreview({ userId: "user_starter", previewId: "preview_construction", expectedPreviewHash: planHash })

  assert.equal(result.verified, true)
  assert.equal(result.siteId, "site_construction")
  const created = Array.from(store.pages.values()).filter((page) => page.siteId === "site_construction")
  assert.deepEqual(created.map((page) => page.slug).sort(), plan.pages.map((page) => page.slug).sort())
  assert.ok(created.length > PLAN_ENTITLEMENTS.starter.limits.pagesPerWebsite!)
})

test("SALES-2: after creation, Starter cannot add another page (POST /pages guard)", async () => {
  const store = createStore("starter")
  await install(store)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const { planHash } = await persistConstructionPreview(store, "site_construction")
  await service.createDraftSiteFromPersistedPreview({ userId: "user_starter", previewId: "preview_construction", expectedPreviewHash: planHash })

  const guard = await import("../../lib/plan-guard")
  await assert.rejects(guard.requireCanCreatePage("site_construction"), (error: unknown) => {
    assert.ok(error instanceof guard.PageLimitReachedError)
    assert.match((error as Error).message, /hasta 5 páginas por sitio/)
    return true
  })
})

test("SALES-2: Pro keeps creating additional pages normally", async () => {
  const store = createStore("pro")
  await install(store)
  store.websites.set("site_pro", { id: "site_pro", name: "Pro", tree: anyTree(), userId: "user_pro", published: false })
  for (let index = 0; index < 6; index += 1) {
    await store.client.sitePage.create({ data: { siteId: "site_pro", name: `P${index}`, slug: index === 0 ? "home" : `p${index}`, tree: anyTree(), isHome: index === 0, published: false } })
  }
  const guard = await import("../../lib/plan-guard")
  const access = await guard.requireCanCreatePage("site_pro")
  assert.equal(access.plan?.id, "pro")
})

test("SALES-2: saving the editor to a page that does not exist runs the page-limit check before writing", async () => {
  const store = createStore("starter")
  await install(store)
  store.websites.set("site_s", { id: "site_s", name: "S", tree: anyTree(), userId: "user_starter", published: false })
  await store.client.sitePage.create({ data: { siteId: "site_s", name: "Inicio", slug: "home", tree: anyTree(), isHome: true, published: false } })
  await store.client.sitePage.create({ data: { siteId: "site_s", name: "Servicios", slug: "servicios", tree: anyTree(), isHome: false, published: false } })
  const persistence = await import("../../lib/editorPersistence")

  let checks = 0
  const beforeCreatePage = async () => {
    checks += 1
    throw new Error("PAGE_LIMIT")
  }

  // Existing pages (also through a non-normalized slug) and home never trigger the check.
  await persistence.saveEditorTreeToDb("site_s", anyTree(), "servicios", { beforeCreatePage })
  await persistence.saveEditorTreeToDb("site_s", anyTree(), "Servicios", { beforeCreatePage })
  await persistence.saveEditorTreeToDb("site_s", anyTree(), "home", { beforeCreatePage })
  assert.equal(checks, 0)

  const before = store.pages.size
  await assert.rejects(persistence.saveEditorTreeToDb("site_s", anyTree(), "pagina-nueva", { beforeCreatePage }), /PAGE_LIMIT/)
  assert.equal(checks, 1)
  assert.equal(store.pages.size, before, "nothing is created when the check fails")
})

test("SALES-2: the editor save route applies requireCanCreatePage to customers and answers 403 with the upgrade link", () => {
  const route = readFileSync(path.join(process.cwd(), "app/api/editor/[id]/route.ts"), "utf8")
  assert.match(route, /beforeCreatePage: user\.role === "ADMIN" \? undefined : \(\) => requireCanCreatePage\(id\)/)
  assert.match(route, /error instanceof PageLimitReachedError[\s\S]{0,200}upgradeUrl: "\/precios\?upgrade=pages"[\s\S]{0,80}status: 403/)
  // POST /pages keeps its own guard.
  assert.match(readFileSync(path.join(process.cwd(), "app/api/editor/[id]/pages/route.ts"), "utf8"), /await requireCanCreatePage\(id\)/)
})

test("SALES-2: only an Orvenix design skips the AI requirement at creation; other plans keep it", async () => {
  const source = readFileSync(path.join(process.cwd(), "lib/orvenix-ai/site-creation/preview-service.ts"), "utf8")
  assert.match(source, /requiresAI: v2Plan\?\.designSource\?\.kind !== "commercial"/)

  // A non-commercial multi-page plan on Starter is still refused for lack of AI.
  const store = createStore("starter")
  await install(store)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  const { plan } = await persistConstructionPreview(store, "site_ai")
  const { designSource: _designSource, ...aiPlan } = plan
  void _designSource
  const validation = validateSiteCreationPlanV2(aiPlan, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS)
  assert.ok(validation.ok)
  const job = store.jobs.get("preview_construction")!
  const input = job.input as Record<string, unknown>
  store.jobs.set("preview_construction", { ...job, input: { ...input, plan: aiPlan, previewHash: (validation as { planHash: string }).planHash } })

  await assert.rejects(
    service.createDraftSiteFromPersistedPreview({ userId: "user_starter", previewId: "preview_construction", expectedPreviewHash: (validation as { planHash: string }).planHash }),
    /IA|AI/,
  )
  assert.equal(store.pages.size, 0)
})
