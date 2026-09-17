import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import type { SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import type { DesignPatternV1 } from "../../lib/orvenix-ai/design-memory/design-pattern"
import type { DesignAssistanceLifecycleRowV1 } from "../../lib/orvenix-ai/assistance/lifecycle"

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

type Site = {
  id: string
  name: string
  description: string
  tree: unknown
  userId: string
  published: boolean
  activeDesignGenerationId: string | null
}

type Page = {
  id: string
  siteId: string
  name: string
  slug: string
  tree: unknown
  seo?: unknown | null
  isHome: boolean
  published: boolean
}

type Theme = { siteId: string; tokens: unknown }

type DesignGenerationRow = {
  id: string
  userId: string
  request: string
  industry?: string
  siteType?: string
  objective?: string
  requestedStyle?: string
  initialPlan: unknown
  initialPlanHash: string
  siteCreationAttemptId?: string
  siteId: string | null
  status: string
  patternVersion: number | null
  patternHash: string | null
  patternKey: unknown | null
  outcomeVersion: number | null
  outcomeScore: number | null
  outcomeQualifiedAt: Date | null
  editDistance: number | null
  createdAt: Date
  updatedAt: Date
}

type RankingSeed = Pick<DesignGenerationRow,
  "patternVersion" |
  "patternKey" |
  "outcomeVersion" |
  "outcomeScore" |
  "status" |
  "editDistance" |
  "createdAt" |
  "outcomeQualifiedAt"
>

const USER_ID = "user_dental_mty"
const REQUEST = "Crea un sitio web profesional para una clínica dental en Monterrey que consiga citas."
const BUSINESS = {
  name: "Clínica Dental Monterrey",
  industry: "clínica dental",
  location: "Monterrey",
  objective: "Conseguir citas",
  services: [
    { name: "Odontología general" },
    { name: "Limpieza dental" },
    { name: "Valoración dental" },
  ],
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function cloneMap<T>(map: Map<string, T>) {
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, clone(value)]))
}

function normalizeSelect<T extends Record<string, unknown>>(row: T | null, select?: Record<string, boolean>) {
  if (!row || !select) return row
  return Object.fromEntries(Object.keys(select).map((key) => [key, row[key]]))
}

function pageKey(siteId: string, slug: string) {
  return `${siteId}:${slug}`
}

function basePattern(theme: Partial<DesignPatternV1["theme"]> = {}): DesignPatternV1 {
  return {
    version: 1,
    context: {
      industryBucket: "health",
      siteType: "health",
      objectiveBucket: "lead_generation",
      styleBucket: "professional",
    },
    architecture: {
      pageCountBucket: "3-5",
      pageTypes: ["home", "services", "contact"],
      navigationOrder: ["home", "servicios", "contacto"],
      homeSectionOrder: ["navigation", "hero", "services", "faq", "contact", "footer"],
      requiredSections: ["navigation", "hero", "services", "contact", "footer"],
    },
    conversion: {
      heroHasCta: true,
      finalCta: true,
      ctaCountBucket: "2-3",
      contactPresence: true,
    },
    theme: {
      mode: "light",
      accentHue: "blue",
      contrastBucket: "high",
      radiusBucket: "soft",
      typographyBucket: "sans",
      motionBucket: "subtle",
      ...theme,
    },
    layout: {
      densityBucket: "medium",
      mediaPresenceBucket: "low",
      sectionCountBucket: "7-9",
    },
  }
}

function rankingRows(count: number, pattern: DesignPatternV1, outcomeScore = 1): RankingSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    patternVersion: 1,
    patternKey: pattern,
    outcomeVersion: 1,
    outcomeScore,
    status: "published",
    editDistance: 0.08,
    createdAt: new Date(`2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
    outcomeQualifiedAt: new Date(`2026-09-${String(index + 1).padStart(2, "0")}T00:10:00.000Z`),
  }))
}

function createHarness(seedRows: RankingSeed[] = []) {
  const jobs = new Map<string, Job>()
  const websites = new Map<string, Site>()
  const pages = new Map<string, Page>()
  const themes = new Map<string, Theme>()
  const designGenerations = new Map<string, DesignGenerationRow>()
  const designAssistances = new Map<string, DesignAssistanceLifecycleRowV1>()
  let providerCalls = 0
  let rankingReads = 0

  seedRows.forEach((row, index) => {
    designGenerations.set(`seed_${index}`, {
      id: `seed_${index}`,
      userId: "seed_user",
      request: "seed",
      initialPlan: null,
      initialPlanHash: `${index}`.padStart(64, "0"),
      siteId: `seed_site_${index}`,
      siteCreationAttemptId: undefined,
      status: row.status,
      patternVersion: row.patternVersion,
      patternHash: null,
      patternKey: clone(row.patternKey),
      outcomeVersion: row.outcomeVersion,
      outcomeScore: row.outcomeScore,
      outcomeQualifiedAt: row.outcomeQualifiedAt,
      editDistance: row.editDistance,
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    })
  })

  function tx() {
    return {
      $queryRaw: async () => [],
      subscription: {
        findUnique: async () => ({
          status: "active",
          plan: {
            id: "pro",
            name: "Pro",
            maxWebsites: 10,
            maxVisits: 10000,
            hasEcommerce: true,
            hasAI: true,
            hasExport: true,
          },
        }),
      },
      editorWebsite: {
        count: async ({ where }: { where: { userId: string } }) => Array.from(websites.values()).filter((site) => site.userId === where.userId).length,
        create: async ({ data }: { data: Partial<Site> & { id: string; name: string; description: string; tree: unknown; userId: string } }) => {
          const site: Site = {
            id: data.id,
            name: data.name,
            description: data.description,
            tree: clone(data.tree),
            userId: data.userId,
            published: data.published ?? false,
            activeDesignGenerationId: data.activeDesignGenerationId ?? null,
          }
          websites.set(site.id, site)
          return clone(site)
        },
        findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => normalizeSelect(clone(websites.get(where.id) ?? null), select),
        updateMany: async ({ where, data }: { where: { id: string }; data: Partial<Site> }) => {
          const site = websites.get(where.id)
          if (!site) return { count: 0 }
          websites.set(where.id, { ...site, ...clone(data) })
          return { count: 1 }
        },
      },
      sitePage: {
        create: async ({ data }: { data: Omit<Page, "id"> & { id?: string } }) => {
          const page: Page = { ...clone(data), id: data.id ?? `page_${pages.size + 1}` }
          pages.set(pageKey(page.siteId, page.slug), page)
          return clone(page)
        },
        update: async ({ where, data }: { where: { siteId_slug: { siteId: string; slug: string } }; data: Partial<Page> }) => {
          const key = pageKey(where.siteId_slug.siteId, where.siteId_slug.slug)
          const current = pages.get(key)
          if (!current) throw new Error(`Page not found: ${key}`)
          const updated = { ...current, ...clone(data) }
          pages.set(key, updated)
          return clone(updated)
        },
        findFirst: async ({ where }: { where: { siteId: string; slug: string; isHome: boolean } }) => {
          const page = pages.get(pageKey(where.siteId, where.slug))
          return page && page.isHome === where.isHome ? clone(page) : null
        },
        findMany: async ({ where }: { where: { siteId: string } }) => Array.from(pages.values()).filter((page) => page.siteId === where.siteId).sort((a, b) => a.slug.localeCompare(b.slug)).map(clone),
      },
      siteTheme: {
        upsert: async ({ where, create, update }: { where: { siteId: string }; create: Theme; update: { tokens: unknown } }) => {
          const theme = themes.has(where.siteId) ? { siteId: where.siteId, tokens: clone(update.tokens) } : clone(create)
          themes.set(where.siteId, theme)
          return clone(theme)
        },
        findUnique: async ({ where }: { where: { siteId: string } }) => clone(themes.get(where.siteId) ?? null),
      },
      aiGenerationJob: {
        findUnique: async ({ where }: { where: { id: string } }) => clone(jobs.get(where.id) ?? null),
        deleteMany: async () => ({ count: 0 }),
        upsert: async ({ where, create, update }: { where: { id: string }; create: Omit<Job, "createdAt" | "updatedAt">; update: Partial<Job> }) => {
          const existing = jobs.get(where.id)
          if (existing) {
            const next = { ...existing, ...clone(update), updatedAt: new Date() }
            jobs.set(where.id, next)
            return clone(next)
          }
          const job: Job = { ...clone(create), createdAt: new Date(), updatedAt: new Date() }
          jobs.set(job.id, job)
          return clone(job)
        },
        updateMany: async ({ where, data }: { where: { id: string; type: string; status: string }; data: Partial<Job> }) => {
          const job = jobs.get(where.id)
          if (!job || job.type !== where.type || job.status !== where.status) return { count: 0 }
          jobs.set(where.id, { ...job, ...clone(data), updatedAt: new Date() })
          return { count: 1 }
        },
      },
      designGeneration: {
        findMany: async () => {
          rankingReads += 1
          return Array.from(designGenerations.values()).map((row) => ({
            patternVersion: row.patternVersion,
            patternKey: clone(row.patternKey),
            outcomeVersion: row.outcomeVersion,
            outcomeScore: row.outcomeScore,
            status: row.status,
            editDistance: row.editDistance,
            createdAt: row.createdAt,
            outcomeQualifiedAt: row.outcomeQualifiedAt,
          }))
        },
        upsert: async ({ where, create, update }: { where: { id: string }; create: Partial<DesignGenerationRow> & { id: string; userId: string; request: string; initialPlan: unknown; initialPlanHash: string; status: string }; update: Partial<DesignGenerationRow> }) => {
          const existing = designGenerations.get(where.id)
          if (existing) {
            const next = { ...existing, ...clone(update), updatedAt: new Date() }
            designGenerations.set(where.id, next)
            return { id: next.id }
          }
          const row: DesignGenerationRow = {
            id: create.id,
            userId: create.userId,
            request: create.request,
            industry: create.industry,
            siteType: create.siteType,
            objective: create.objective,
            requestedStyle: create.requestedStyle,
            initialPlan: clone(create.initialPlan),
            initialPlanHash: create.initialPlanHash,
            siteCreationAttemptId: create.siteCreationAttemptId,
            siteId: null,
            status: create.status,
            patternVersion: create.patternVersion ?? null,
            patternHash: create.patternHash ?? null,
            patternKey: create.patternKey ? clone(create.patternKey) : null,
            outcomeVersion: null,
            outcomeScore: null,
            outcomeQualifiedAt: null,
            editDistance: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          designGenerations.set(row.id, row)
          return { id: row.id }
        },
        findUnique: async ({ where }: { where: { id: string } }) => clone(designGenerations.get(where.id) ?? null),
        updateMany: async ({ where, data }: { where: { id: string; userId?: string; initialPlanHash?: string; status?: { in: string[] }; patternVersion?: null }; data: Partial<DesignGenerationRow> }) => {
          const row = designGenerations.get(where.id)
          if (!row) return { count: 0 }
          if (where.userId && row.userId !== where.userId) return { count: 0 }
          if (where.initialPlanHash && row.initialPlanHash !== where.initialPlanHash) return { count: 0 }
          if (where.status && !where.status.in.includes(row.status)) return { count: 0 }
          if (where.patternVersion === null && row.patternVersion !== null) return { count: 0 }
          designGenerations.set(where.id, { ...row, ...clone(data), updatedAt: new Date() })
          return { count: 1 }
        },
      },
      designAssistance: {
        upsert: async ({ where, create }: { where: { id: string }; create: Omit<DesignAssistanceLifecycleRowV1, "requestedAt"> }) => {
          const existing = designAssistances.get(where.id)
          if (existing) return clone(existing)
          const row: DesignAssistanceLifecycleRowV1 = { ...clone(create), requestedAt: new Date() }
          designAssistances.set(row.id, row)
          return clone(row)
        },
        findUnique: async ({ where }: { where: { id: string } }) => clone(designAssistances.get(where.id) ?? null),
        updateMany: async ({ where, data }: { where: { id: string; status: "requested" }; data: Partial<DesignAssistanceLifecycleRowV1> }) => {
          const row = designAssistances.get(where.id)
          if (!row || row.status !== where.status) return { count: 0 }
          designAssistances.set(row.id, { ...row, ...clone(data) })
          return { count: 1 }
        },
      },
    }
  }

  const prisma = {
    ...tx(),
    $transaction: async <T>(callback: (client: ReturnType<typeof tx>) => Promise<T>) => {
      const jobBackup = cloneMap(jobs)
      const siteBackup = cloneMap(websites)
      const pageBackup = cloneMap(pages)
      const themeBackup = cloneMap(themes)
      const generationBackup = cloneMap(designGenerations)
      const assistanceBackup = cloneMap(designAssistances)
      try {
        return await callback(tx())
      } catch (error) {
        jobs.clear(); jobBackup.forEach((value, key) => jobs.set(key, value))
        websites.clear(); siteBackup.forEach((value, key) => websites.set(key, value))
        pages.clear(); pageBackup.forEach((value, key) => pages.set(key, value))
        themes.clear(); themeBackup.forEach((value, key) => themes.set(key, value))
        designGenerations.clear(); generationBackup.forEach((value, key) => designGenerations.set(key, value))
        designAssistances.clear(); assistanceBackup.forEach((value, key) => designAssistances.set(key, value))
        throw error
      }
    },
  }

  return {
    prisma,
    jobs,
    websites,
    pages,
    themes,
    designGenerations,
    designAssistances,
    get providerCalls() { return providerCalls },
    incrementProviderCalls: () => { providerCalls += 1 },
    get rankingReads() { return rankingReads },
  }
}

async function installHarness(harness: ReturnType<typeof createHarness>) {
  const editorDb = await import("../../lib/editor-db")
  const prisma = editorDb.editorPrisma as unknown as Record<string, unknown>
  Object.assign(prisma, harness.prisma)
}

function assertPlanIsMultipage(plan: SiteCreationPlanV2) {
  assert.equal(plan.version, 2)
  assert.ok(plan.pages.length >= 2)
  assert.equal(plan.pages.filter((page) => page.isHome).length, 1)
  assert.ok(plan.pages.some((page) => page.slug === "home"))

  const slugs = new Set(plan.pages.map((page) => page.slug))
  for (const navItem of plan.navigation) {
    assert.equal(slugs.has(navItem.slug), true)
    assert.equal(navItem.href, `page:${navItem.slug}`)
  }
}

test("Orvenix Site Creation E2E V1: preview, assistance, execute y Design Memory aceptada", async () => {
  const harness = createHarness(rankingRows(5, basePattern({ accentHue: "blue" })))
  await installHarness(harness)

  const previewService = await import("../../lib/orvenix-ai/site-creation/preview-store")
  const assistance = await import("../../lib/orvenix-ai/site-creation/assistance")
  const builder = await import("../../lib/orvenix-ai/autonomous/site-builder")
  const designMemory = await import("../../lib/orvenix-ai/design-memory")
  const { createDeterministicDesignAssistanceProviderV1 } = await import("../../lib/orvenix-ai/assistance/testing/deterministic-provider")

  const attempt = await previewService.reserveSiteCreationPreviewAttempt({
    userId: USER_ID,
    clientAttemptKey: "client:dental-mty-e2e",
  })
  assert.equal(attempt.userId, USER_ID)
  assert.equal(attempt.status, "planning")
  assert.equal(harness.jobs.get(attempt.id)?.status, "planning")

  const designMemoryDecision = await assistance.resolveSiteCreationDesignMemoryDecisionV1({
    request: REQUEST,
    business: BUSINESS,
    preferredStyle: "sitio profesional editable",
    preferredStyleExplicit: false,
  })
  assert.equal(harness.rankingReads, 2)
  assert.equal(designMemoryDecision.kind, "L2")

  const skippedByL2 = await assistance.resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: USER_ID,
    siteCreationAttemptId: attempt.id,
    designMemoryDecision,
    preferredStyleExplicit: false,
    enabled: true,
    provider: createDeterministicDesignAssistanceProviderV1(),
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    lifecycleClient: harness.prisma,
  })
  assert.equal(skippedByL2.status, "skipped")
  assert.equal(skippedByL2.status === "skipped" ? skippedByL2.reason : null, "qualified_design_memory_l2")
  assert.equal(harness.providerCalls, 0)

  const assistanceEligibleDecision = {
    kind: "abstain" as const,
    designMemoryPrior: null,
    context: designMemoryDecision.context,
    reasonCode: "insufficient_evidence",
    reason: [] as string[],
  }
  const provider = createDeterministicDesignAssistanceProviderV1()
  const wrappedProvider = {
    request: async (request: Parameters<typeof provider.request>[0]) => {
      harness.incrementProviderCalls()
      const serialized = JSON.stringify(request)
      assert.equal(serialized.includes("Clínica Dental Monterrey"), false)
      assert.equal(serialized.includes("Monterrey"), false)
      assert.equal(serialized.includes("Odontología"), false)
      return provider.request(request)
    },
  }
  const assistanceResult = await assistance.resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: USER_ID,
    siteCreationAttemptId: attempt.id,
    designMemoryDecision: assistanceEligibleDecision,
    preferredStyleExplicit: false,
    enabled: true,
    provider: wrappedProvider,
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    lifecycleClient: harness.prisma,
  })
  assert.equal(assistanceResult.status, "applied")
  assert.equal(harness.providerCalls, 1)
  assert.equal(harness.designAssistances.size, 1)
  assert.equal(assistanceResult.status === "applied" ? assistanceResult.advisory.source : null, "third_party_assistance")

  const generated = await builder.runAutonomousMultiPageSiteBuilder({
    request: REQUEST,
    business: BUSINESS,
    preferredStyle: "sitio profesional editable",
    designMemoryPrior: designMemoryDecision.designMemoryPrior,
    externalThemeAdvisory: assistanceResult.status === "applied" ? assistanceResult.advisory : null,
    forceFreshComposition: true,
    minimumQuality: 55,
  })
  assert.equal(generated.ok, true)
  if (!generated.ok) return
  assertPlanIsMultipage(generated.plan)
  assert.equal(JSON.stringify(generated.plan).includes("deterministic_provider"), false)
  assert.equal(JSON.stringify(generated.plan).includes("deterministic_model"), false)
  assert.equal(JSON.stringify(generated.plan).includes("third_party_assistance"), false)
  assert.ok(generated.trace.some((entry) => entry.includes("Design Memory L2")))

  const preview = await previewService.completeSiteCreationPreviewAttempt({
    userId: USER_ID,
    previewId: attempt.id,
    previewHash: generated.planHash,
    request: REQUEST,
    business: BUSINESS,
    plan: generated.plan,
  })
  assert.equal(preview.id, attempt.id)
  assert.equal(preview.status, "completed")
  assert.equal(preview.previewHash, generated.planHash)

  const retryPreview = await previewService.getCompletedSiteCreationPreviewForAttempt({
    userId: USER_ID,
    previewId: attempt.id,
  })
  assert.equal(retryPreview?.id, preview.id)
  assert.equal(harness.providerCalls, 1)

  const recorded = await designMemory.recordDesignGeneration({
    userId: USER_ID,
    request: REQUEST,
    industry: BUSINESS.industry,
    siteType: generated.architecture.siteType,
    objective: BUSINESS.objective,
    requestedStyle: "sitio profesional editable",
    initialPlan: generated.plan,
    initialPlanHash: generated.planHash,
    siteCreationAttemptId: preview.id,
  })
  assert.equal(recorded.ok, true)

  const created = await previewService.createDraftSiteFromPersistedPreview({
    userId: USER_ID,
    previewId: preview.id,
    expectedPreviewHash: generated.planHash,
  })
  assert.equal(created.verified, true)
  assert.equal(created.nextRoute, `/editor/${created.siteId}`)
  assert.equal(harness.providerCalls, 1)

  const accepted = await designMemory.acceptDesignGeneration({
    userId: USER_ID,
    request: REQUEST,
    initialPlanHash: generated.planHash,
    siteId: created.siteId,
  })
  assert.equal(accepted.ok, true)

  const site = harness.websites.get(created.siteId)
  assert.ok(site)
  assert.equal(site?.userId, USER_ID)
  assert.equal(site?.published, false)
  assert.equal(site?.activeDesignGenerationId, recorded.ok ? recorded.generationId : null)

  const persistedPages = Array.from(harness.pages.values()).filter((page) => page.siteId === created.siteId)
  assert.equal(persistedPages.length, generated.plan.pages.length)
  assert.equal(persistedPages.filter((page) => page.isHome).length, 1)
  assert.equal(persistedPages.every((page) => page.published === false), true)
  assert.ok(harness.themes.get(created.siteId)?.tokens)

  const generation = recorded.ok ? harness.designGenerations.get(recorded.generationId) : null
  assert.equal(generation?.siteId, created.siteId)
  assert.equal(generation?.status, "accepted")
  assert.equal(generation?.siteCreationAttemptId, preview.id)

  const consumedJob = harness.jobs.get(preview.id)
  assert.equal(consumedJob?.status, "consumed")
  assert.equal(consumedJob?.siteId, created.siteId)

  const retryExecute = await previewService.createDraftSiteFromPersistedPreview({
    userId: USER_ID,
    previewId: preview.id,
    expectedPreviewHash: generated.planHash,
  })
  assert.equal(retryExecute.siteId, created.siteId)
  assert.equal(harness.websites.size, 1)
  assert.equal(Array.from(harness.pages.values()).filter((page) => page.siteId === created.siteId).length, generated.plan.pages.length)
})

test("Orvenix Site Creation E2E V1: fallo de Design Memory/Assistance no bloquea builder ni preview", async () => {
  const harness = createHarness()
  await installHarness(harness)

  const previewService = await import("../../lib/orvenix-ai/site-creation/preview-store")
  const assistance = await import("../../lib/orvenix-ai/site-creation/assistance")
  const builder = await import("../../lib/orvenix-ai/autonomous/site-builder")

  const attempt = await previewService.reserveSiteCreationPreviewAttempt({
    userId: USER_ID,
    clientAttemptKey: "client:dental-mty-fallback",
  })

  const designMemoryDecision = await assistance.resolveSiteCreationDesignMemoryDecisionV1({
    request: REQUEST,
    business: BUSINESS,
    preferredStyle: "sitio profesional editable",
    preferredStyleExplicit: false,
  })
  assert.equal(designMemoryDecision.kind, "abstain")

  const assistanceFallback = await assistance.resolveSiteCreationThemeAssistanceAdvisoryV1({
    userId: USER_ID,
    siteCreationAttemptId: attempt.id,
    designMemoryDecision,
    preferredStyleExplicit: false,
    enabled: true,
    provider: { request: async () => null },
    providerKey: "deterministic_provider",
    modelKey: "deterministic_model",
    lifecycleClient: harness.prisma,
  })
  assert.equal(assistanceFallback.status, "fallback")

  const generated = await builder.runAutonomousMultiPageSiteBuilder({
    request: REQUEST,
    business: BUSINESS,
    preferredStyle: "sitio profesional editable",
    designMemoryPrior: designMemoryDecision.designMemoryPrior,
    externalThemeAdvisory: null,
    forceFreshComposition: true,
    minimumQuality: 55,
  })
  assert.equal(generated.ok, true)
  if (!generated.ok) return
  assertPlanIsMultipage(generated.plan)

  const preview = await previewService.completeSiteCreationPreviewAttempt({
    userId: USER_ID,
    previewId: attempt.id,
    previewHash: generated.planHash,
    request: REQUEST,
    business: BUSINESS,
    plan: generated.plan,
  })
  assert.equal(preview.status, "completed")
})
