import { createHash, randomBytes, randomUUID } from "crypto"

import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"
import { canCreateWebsite, canUseAI } from "@/lib/billing/plan-entitlements"
import { getFeatureLimitMessage, getWebsiteLimitMessage } from "@/lib/plan-guard-messages"
import type { PlanAccess } from "@/lib/plan-guard"
import { createSiteFromTree } from "@/lib/auth"
import { HOME_PAGE_SLUG } from "@/lib/builder-core/tree/sitePages"
import { hashEditorTree } from "@/lib/orvenix-ai/mutation/executor"
import type { OrvenixAIMutationPlan } from "@/lib/orvenix-ai/mutation"
import { validateEditorTreeSafety } from "@/lib/orvenix-ai/safety"
import {
  calculateSiteCreationTreeHash,
  hasSiteCreationPlanV2Discriminator,
  SITE_CREATION_PLAN_V2_DEFAULT_LIMITS,
  validateSiteCreationPlanV2,
  type SiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { OrvenixAgentBusinessContext, OrvenixSiteCreationResult } from "@/lib/orvenix-ai/agent/types"
import { serverError, serverWarn } from "@/lib/server-log"
import type { EditorTree } from "@/types/editor"
import { validateTree } from "@/types/validateTree"

export const SITE_CREATION_PREVIEW_JOB_TYPE = "ai_site_creation_preview"
export const SITE_CREATION_PREVIEW_EXPIRES_MS = 24 * 60 * 60 * 1000
export const SITE_CREATION_PREVIEW_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
export const SITE_CREATION_PREVIEW_MAX_BYTES = 1_500_000

export type SiteCreationPreviewStatus = "planning" | "completed" | "processing" | "consumed" | "failed"

export type SiteCreationPreviewPlan =
  | OrvenixAIMutationPlan
  | SiteCreationPlanV2

export interface SiteCreationPreviewAttemptRecord {
  id: string
  userId: string
  reservedSiteId: string
  clientAttemptKeyHash: string
  createdAt: string
  status: SiteCreationPreviewStatus
  error?: string | null
  output?: SiteCreationPreviewOutput | null
}

export interface SiteCreationPreviewRecord extends SiteCreationPreviewAttemptRecord {
  previewHash: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: SiteCreationPreviewPlan
  expiresAt: string
}

export interface SiteCreationPreviewOutput {
  siteId: string
  nextRoute: string
  consumedAt: string
}

export class SiteCreationPreviewPublicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SiteCreationPreviewPublicError"
  }
}

export class SiteCreationPreviewForbiddenError extends SiteCreationPreviewPublicError {
  constructor() {
    super("No tienes permiso para usar este Preview.")
    this.name = "SiteCreationPreviewForbiddenError"
  }
}

type AIGenerationJobRecord = Awaited<ReturnType<typeof editorPrisma.aiGenerationJob.findUnique>>
type SiteCreationTx = Prisma.TransactionClient

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue
}

function measureJsonBytes(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value ?? null), "utf8")
}

function generateSiteId() {
  return `site_${randomBytes(6).toString("hex")}`
}

const CLIENT_ATTEMPT_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,96}$/

function normalizeClientAttemptKey(value: string) {
  const key = value.trim()
  if (!CLIENT_ATTEMPT_KEY_PATTERN.test(key)) {
    throw new SiteCreationPreviewPublicError("La identidad del intento de Preview no es valida. Intenta generar de nuevo.")
  }
  return key
}

function createAttemptDigest(userId: string, clientAttemptKey: string) {
  return createHash("sha256")
    .update(userId)
    .update("\0")
    .update(clientAttemptKey)
    .digest("hex")
}

function createAttemptId(userId: string, clientAttemptKey: string) {
  return `scp_${createAttemptDigest(userId, clientAttemptKey)}`
}

function normalizeErrorForStorage(error: unknown) {
  if (error instanceof SiteCreationPreviewPublicError) return error.message
  if (error instanceof Error && error.message.trim()) return error.message.trim().slice(0, 500)
  return "SITE_CREATION_ATTEMPT_FAILED"
}

function isExpired(expiresAt: string, now = new Date()) {
  const expires = Date.parse(expiresAt)
  return !Number.isFinite(expires) || expires <= now.getTime()
}

function replaceStringValues(value: unknown, from: string, to: string): unknown {
  if (typeof value === "string") return value === from ? to : value
  if (Array.isArray(value)) return value.map((item) => replaceStringValues(item, from, to))
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, replaceStringValues(entry, from, to)]),
  )
}

export function normalizeSiteCreationPlanForReservedSite(
  plan: OrvenixAIMutationPlan,
  reservedSiteId: string,
): OrvenixAIMutationPlan {
  const previousSiteId = plan.siteId
  const normalized = replaceStringValues(structuredClone(plan), previousSiteId, reservedSiteId) as OrvenixAIMutationPlan

  normalized.siteId = reservedSiteId
  normalized.snapshot = {
    ...normalized.snapshot,
    siteId: reservedSiteId,
  }

  return normalized
}

function normalizeOutput(value: unknown): SiteCreationPreviewOutput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const output = value as Partial<SiteCreationPreviewOutput>
  if (typeof output.siteId !== "string" || typeof output.nextRoute !== "string" || typeof output.consumedAt !== "string") {
    return null
  }
  return {
    siteId: output.siteId,
    nextRoute: output.nextRoute,
    consumedAt: output.consumedAt,
  }
}

function normalizeAttemptRecord(job: AIGenerationJobRecord): SiteCreationPreviewAttemptRecord | null {
  if (!job || job.type !== SITE_CREATION_PREVIEW_JOB_TYPE || typeof job.input !== "object" || job.input === null) {
    return null
  }

  const input = job.input as Partial<SiteCreationPreviewAttemptRecord>

  if (
    typeof input.userId !== "string" ||
    typeof input.reservedSiteId !== "string" ||
    typeof input.clientAttemptKeyHash !== "string" ||
    typeof input.createdAt !== "string"
  ) {
    return null
  }

  return {
    id: job.id,
    userId: input.userId,
    reservedSiteId: input.reservedSiteId,
    clientAttemptKeyHash: input.clientAttemptKeyHash,
    createdAt: input.createdAt,
    status: job.status as SiteCreationPreviewStatus,
    error: job.error,
    output: normalizeOutput(job.output),
  }
}

function normalizeRecord(job: AIGenerationJobRecord): SiteCreationPreviewRecord | null {
  const attempt = normalizeAttemptRecord(job)
  if (!attempt || typeof job?.input !== "object" || job.input === null) return null

  const input = job.input as Partial<SiteCreationPreviewRecord>

  if (
    typeof input.previewHash !== "string" ||
    typeof input.request !== "string" ||
    typeof input.expiresAt !== "string" ||
    !input.business ||
    !input.plan
  ) {
    return null
  }

  return {
    ...attempt,
    previewHash: input.previewHash,
    request: input.request,
    business: input.business,
    plan: input.plan,
    expiresAt: input.expiresAt,
  }
}

async function pruneSiteCreationPreviewJobs(now = new Date()) {
  const cutoff = new Date(now.getTime() - SITE_CREATION_PREVIEW_RETENTION_MS)

  try {
    await editorPrisma.aiGenerationJob.deleteMany({
      where: {
        type: SITE_CREATION_PREVIEW_JOB_TYPE,
        OR: [
          { status: "consumed", updatedAt: { lt: cutoff } },
          { status: "failed", updatedAt: { lt: cutoff } },
          { status: "completed", updatedAt: { lt: cutoff } },
        ],
      },
    })
  } catch (error) {
    serverWarn("[site_creation] No se pudieron depurar previews antiguos", { error })
  }
}

export async function reserveSiteCreationPreviewAttempt(params: {
  userId: string
  clientAttemptKey: string
}) {
  const clientAttemptKey = normalizeClientAttemptKey(params.clientAttemptKey)
  const id = createAttemptId(params.userId, clientAttemptKey)
  const clientAttemptKeyHash = createAttemptDigest(params.userId, clientAttemptKey)
  const now = new Date()

  await pruneSiteCreationPreviewJobs(now)

  const payload = {
    userId: params.userId,
    clientAttemptKeyHash,
    reservedSiteId: generateSiteId(),
    createdAt: now.toISOString(),
  } satisfies Omit<SiteCreationPreviewAttemptRecord, "id" | "status" | "error" | "output">

  const job = await editorPrisma.aiGenerationJob.upsert({
    where: { id },
    create: {
      id,
      siteId: null,
      pageId: null,
      type: SITE_CREATION_PREVIEW_JOB_TYPE,
      input: toJsonValue(payload),
      output: null,
      status: "planning",
      error: null,
    },
    update: {},
  })

  const attempt = normalizeAttemptRecord(job)
  if (!attempt || attempt.userId !== params.userId || attempt.clientAttemptKeyHash !== clientAttemptKeyHash) {
    throw new SiteCreationPreviewPublicError("No se pudo reservar el intento de Preview. Intenta generar uno nuevo.")
  }

  return attempt
}

function validatePreviewCompletion(record: {
  previewHash: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: SiteCreationPreviewPlan
  reservedSiteId: string
}) {
  let plan: SiteCreationPreviewPlan
  let previewHash: string

  if (hasSiteCreationPlanV2Discriminator(record.plan)) {
    const validation = validateSiteCreationPlanV2(
      record.plan,
      SITE_CREATION_PLAN_V2_DEFAULT_LIMITS,
    )

    if (validation.ok === false) {
      throw new SiteCreationPreviewPublicError(
        `El Preview multipagina no pudo validarse: ${validation.errors.join("; ")}`,
      )
    }

    plan = validation.plan
    previewHash = validation.planHash
  } else {
    plan = normalizeSiteCreationPlanForReservedSite(record.plan, record.reservedSiteId)

    if (!plan.after.theme && !plan.after.globalTheme) {
      throw new SiteCreationPreviewPublicError("El Preview generado no incluye un Theme valido. Intenta generar uno nuevo.")
    }

    previewHash = hashEditorTree(plan.after)
  }

  if (previewHash !== record.previewHash) {
    throw new SiteCreationPreviewPublicError("El Preview generado no pudo validarse. Intenta generar uno nuevo.")
  }

  return { plan, previewHash }
}

export async function getCompletedSiteCreationPreviewForAttempt(params: {
  userId: string
  previewId: string
}) {
  const job = await editorPrisma.aiGenerationJob.findUnique({ where: { id: params.previewId } })
  const preview = normalizeRecord(job)

  if (!preview) return null
  if (preview.userId !== params.userId) throw new SiteCreationPreviewForbiddenError()
  if (preview.status !== "completed") return null
  if (isExpired(preview.expiresAt)) {
    throw new SiteCreationPreviewPublicError("El Preview expiro. Genera uno nuevo antes de crear el sitio.")
  }

  return preview
}

export async function completeSiteCreationPreviewAttempt(record: {
  userId: string
  previewId: string
  previewHash: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: SiteCreationPreviewPlan
}) {
  const job = await editorPrisma.aiGenerationJob.findUnique({ where: { id: record.previewId } })
  const attempt = normalizeAttemptRecord(job)

  if (!attempt) {
    throw new SiteCreationPreviewPublicError("La identidad del Preview ya no es valida. Genera uno nuevo.")
  }
  if (attempt.userId !== record.userId) throw new SiteCreationPreviewForbiddenError()

  const { plan, previewHash } = validatePreviewCompletion({
    previewHash: record.previewHash,
    request: record.request,
    business: record.business,
    plan: record.plan,
    reservedSiteId: attempt.reservedSiteId,
  })

  if (attempt.status === "completed" || attempt.status === "processing" || attempt.status === "consumed") {
    const preview = normalizeRecord(job)
    if (preview && preview.previewHash === previewHash) return preview
    throw new SiteCreationPreviewPublicError("Este intento de Preview ya tiene un resultado diferente. Genera uno nuevo.")
  }

  if (attempt.status === "failed") {
    throw new SiteCreationPreviewPublicError("Este intento de Preview fallo. Genera uno nuevo.")
  }

  if (attempt.status !== "planning") {
    throw new SiteCreationPreviewPublicError("Este intento de Preview no puede completarse.")
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SITE_CREATION_PREVIEW_EXPIRES_MS)
  const payload = {
    userId: record.userId,
    clientAttemptKeyHash: attempt.clientAttemptKeyHash,
    previewHash,
    reservedSiteId: attempt.reservedSiteId,
    request: record.request,
    business: record.business,
    plan,
    createdAt: attempt.createdAt,
    expiresAt: expiresAt.toISOString(),
  } satisfies Omit<SiteCreationPreviewRecord, "id" | "status" | "error" | "output">

  const size = measureJsonBytes(payload)
  if (size > SITE_CREATION_PREVIEW_MAX_BYTES) {
    throw new SiteCreationPreviewPublicError(
      "El sitio generado es demasiado grande para guardarse como Preview. Prueba con una descripcion mas enfocada.",
    )
  }

  const completed = await editorPrisma.aiGenerationJob.updateMany({
    where: {
      id: record.previewId,
      type: SITE_CREATION_PREVIEW_JOB_TYPE,
      status: "planning",
    },
    data: {
      input: toJsonValue(payload),
      status: "completed",
      error: null,
    },
  })

  if (completed.count !== 1) {
    const latest = await editorPrisma.aiGenerationJob.findUnique({ where: { id: record.previewId } })
    const preview = normalizeRecord(latest)
    if (preview && preview.userId === record.userId && preview.previewHash === previewHash) return preview
    throw new SiteCreationPreviewPublicError("No se pudo completar el Preview. Intenta generar uno nuevo.")
  }

  const preview = normalizeRecord(await editorPrisma.aiGenerationJob.findUnique({ where: { id: record.previewId } }))
  if (!preview) {
    throw new SiteCreationPreviewPublicError("No se pudo guardar el Preview. Intenta generarlo de nuevo.")
  }

  return preview
}

export async function failSiteCreationPreviewAttempt(params: {
  userId: string
  previewId: string
  error: unknown
}) {
  const job = await editorPrisma.aiGenerationJob.findUnique({ where: { id: params.previewId } })
  const attempt = normalizeAttemptRecord(job)

  if (!attempt) return false
  if (attempt.userId !== params.userId) throw new SiteCreationPreviewForbiddenError()

  const failed = await editorPrisma.aiGenerationJob.updateMany({
    where: {
      id: params.previewId,
      type: SITE_CREATION_PREVIEW_JOB_TYPE,
      status: "planning",
    },
    data: {
      status: "failed",
      error: normalizeErrorForStorage(params.error),
    },
  })

  return failed.count === 1
}

export async function rememberSiteCreationPreview(record: {
  userId: string
  previewHash: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: SiteCreationPreviewPlan
}) {
  const attempt = await reserveSiteCreationPreviewAttempt({
    userId: record.userId,
    clientAttemptKey: `server:${randomUUID()}`,
  })

  try {
    return await completeSiteCreationPreviewAttempt({
      userId: record.userId,
      previewId: attempt.id,
      previewHash: record.previewHash,
      request: record.request,
      business: record.business,
      plan: record.plan,
    })
  } catch (error) {
    await failSiteCreationPreviewAttempt({
      userId: record.userId,
      previewId: attempt.id,
      error,
    }).catch(() => false)
    throw error
  }
}

export async function getSiteCreationPreviewForExecute(params: {
  userId: string
  previewId: string
  expectedPreviewHash: string
}) {
  const job = await editorPrisma.aiGenerationJob.findUnique({
    where: { id: params.previewId },
  })
  const preview = normalizeRecord(job)

  if (!preview) return null
  if (preview.userId !== params.userId) throw new SiteCreationPreviewForbiddenError()
  if (preview.previewHash !== params.expectedPreviewHash) {
    throw new SiteCreationPreviewPublicError("El Preview no coincide con el contenido autorizado. Genera uno nuevo.")
  }
  if (preview.status === "consumed") return preview
  if (isExpired(preview.expiresAt)) {
    throw new SiteCreationPreviewPublicError("El Preview expiro. Genera uno nuevo antes de crear el sitio.")
  }
  if (preview.status !== "completed") {
    throw new SiteCreationPreviewPublicError("Este Preview ya se esta procesando. Espera unos segundos e intenta de nuevo.")
  }

  return preview
}

type SubscriptionWithPlan = {
  status: string
  plan: {
    id: string
    name: string
    maxWebsites: number
    maxVisits: number
    hasEcommerce: boolean
    hasAI: boolean
    hasExport: boolean
  }
} | null

function buildPlanAccess(subscription: SubscriptionWithPlan, websitesUsed: number): PlanAccess {
  const isActive = subscription?.status === "active" || subscription?.status === "authorized"
  const plan = subscription?.plan ?? null
  const canCreate = Boolean(isActive && plan && canCreateWebsite(plan.id, websitesUsed))

  return {
    isActive,
    plan: plan
      ? {
          id: plan.id,
          name: plan.name,
          maxWebsites: plan.maxWebsites,
          maxVisits: plan.maxVisits,
          hasEcommerce: plan.hasEcommerce,
          hasAI: plan.hasAI,
          hasExport: plan.hasExport,
        }
      : null,
    entitlements: null,
    websitesUsed,
    canCreateWebsite: canCreate,
  }
}

async function requireCanCreateWebsiteInTx(tx: SiteCreationTx, userId: string) {
  const [subscription, websitesUsed] = await Promise.all([
    tx.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    tx.editorWebsite.count({ where: { userId } }),
  ])

  const access = buildPlanAccess(subscription, websitesUsed)
  if (!access.isActive || !access.plan || !canUseAI(access.plan.id)) {
    throw new SiteCreationPreviewPublicError(getFeatureLimitMessage("ai"))
  }

  if (!access.canCreateWebsite) {
    throw new SiteCreationPreviewPublicError(getWebsiteLimitMessage(access))
  }

  return access
}

async function lockUserAndSubscription(tx: SiteCreationTx, userId: string) {
  await tx.$queryRaw<{ id: string }[]>`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`
  await tx.$queryRaw<{ id: string }[]>`SELECT id FROM subscriptions WHERE userId = ${userId} FOR UPDATE`
}

function canonicalTreeWithTheme(tree: unknown, themeTokens: unknown): EditorTree {
  const validated = validateTree(tree)
  if (!themeTokens) return validated
  return {
    ...validated,
    theme: themeTokens as EditorTree["theme"],
    globalTheme: themeTokens as EditorTree["globalTheme"],
  }
}

function expectedPersistedTree(tree: EditorTree) {
  const validated = validateTree(tree)
  const theme = validated.theme ?? validated.globalTheme
  if (!theme) return validated
  return {
    ...validated,
    theme,
    globalTheme: theme,
  }
}

async function verifyCreatedDraftSite(tx: SiteCreationTx, siteId: string, tree: EditorTree) {
  const [site, homePage, siteTheme] = await Promise.all([
    tx.editorWebsite.findUnique({
      where: { id: siteId },
      select: { id: true, userId: true, published: true },
    }),
    tx.sitePage.findFirst({
      where: { siteId, isHome: true, slug: HOME_PAGE_SLUG },
      select: { id: true, tree: true, published: true },
    }),
    tx.siteTheme.findUnique({
      where: { siteId },
      select: { tokens: true },
    }),
  ])

  if (!site || !homePage) return false
  if (site.published || homePage.published) return false
  if (!siteTheme?.tokens) return false

  const savedTree = canonicalTreeWithTheme(homePage.tree, siteTheme.tokens)
  return hashEditorTree(savedTree) === hashEditorTree(expectedPersistedTree(tree))
}

async function verifyCreatedDraftSiteV2(
  tx: SiteCreationTx,
  siteId: string,
  plan: SiteCreationPlanV2,
) {
  const [site, pages, siteTheme] = await Promise.all([
    tx.editorWebsite.findUnique({
      where: { id: siteId },
      select: { id: true, published: true },
    }),
    tx.sitePage.findMany({
      where: { siteId },
      select: {
        name: true,
        slug: true,
        tree: true,
        seo: true,
        isHome: true,
        published: true,
      },
      orderBy: { slug: "asc" },
    }),
    tx.siteTheme.findUnique({
      where: { siteId },
      select: { tokens: true },
    }),
  ])

  if (!site || site.published || !siteTheme?.tokens) return false
  if (pages.length !== plan.pages.length) return false

  const persistedBySlug = new Map(pages.map((page) => [page.slug, page]))

  for (const expectedPage of plan.pages) {
    const savedPage = persistedBySlug.get(expectedPage.slug)
    if (!savedPage) return false

    if (
      savedPage.name !== expectedPage.name ||
      savedPage.isHome !== expectedPage.isHome ||
      savedPage.published
    ) {
      return false
    }

    if (
      calculateSiteCreationTreeHash(savedPage.tree as EditorTree) !==
      expectedPage.treeHash
    ) {
      return false
    }

    if (JSON.stringify(savedPage.seo ?? null) !== JSON.stringify(expectedPage.seo)) {
      return false
    }
  }

  return true
}

export async function createDraftSiteFromPersistedPreview(params: {
  userId: string
  previewId: string
  expectedPreviewHash: string
}): Promise<OrvenixSiteCreationResult> {
  try {
    return await editorPrisma.$transaction(async (tx) => {
      await lockUserAndSubscription(tx, params.userId)

      const job = await tx.aiGenerationJob.findUnique({ where: { id: params.previewId } })
      const preview = normalizeRecord(job)

      if (!preview) {
        throw new SiteCreationPreviewPublicError("La previsualizacion ya no es valida. Genera un Preview nuevo.")
      }
      if (preview.userId !== params.userId) throw new SiteCreationPreviewForbiddenError()

      const isV2 = hasSiteCreationPlanV2Discriminator(preview.plan)

      const v2Validation = isV2
        ? validateSiteCreationPlanV2(
            preview.plan,
            SITE_CREATION_PLAN_V2_DEFAULT_LIMITS,
          )
        : null

      if (v2Validation?.ok === false) {
        throw new SiteCreationPreviewPublicError(
          `El Preview multipagina persistido ya no es valido: ${v2Validation.errors.join("; ")}`,
        )
      }

      const v2Plan = v2Validation?.ok
        ? v2Validation.plan
        : null

      const legacyPlan: OrvenixAIMutationPlan | null =
        "after" in preview.plan
          ? preview.plan
          : null

      if (v2Plan) {
        for (const page of v2Plan.pages) {
          const safety = validateEditorTreeSafety(page.tree)

          if (!safety.safe) {
            const blockedIssues = safety.issues
              .filter((issue) => issue.level === "blocked")
              .map((issue) => issue.message)
              .join("; ")

            throw new SiteCreationPreviewPublicError(
              `Safety Validator rechazo la pagina "${page.slug}": ${blockedIssues || "arbol no seguro"}`,
            )
          }
        }
      }

      const tree = v2Plan
        ? v2Plan.pages.find((page) => page.isHome)?.tree
        : legacyPlan?.after

      if (!tree) {
        throw new SiteCreationPreviewPublicError("El Preview no contiene una pagina home valida.")
      }

      const name =
        v2Plan?.identity.name?.trim() ||
        preview.business.name?.trim() ||
        "Sitio creado con Orvenix AI"

      const description =
        v2Plan?.identity.description?.trim() ||
        preview.business.description?.trim() ||
        preview.request

      const persistedPreviewHash = v2Validation?.ok
        ? v2Validation.planHash
        : hashEditorTree(tree)

      if (
        persistedPreviewHash !== preview.previewHash ||
        preview.previewHash !== params.expectedPreviewHash
      ) {
        throw new SiteCreationPreviewPublicError("El Preview no coincide con el contenido autorizado. Genera uno nuevo.")
      }

      if (preview.status === "consumed" && preview.output) {
        return {
          siteId: preview.output.siteId,
          nextRoute: preview.output.nextRoute,
          verified: true,
          rollbackApplied: false,
        }
      }

      if (isExpired(preview.expiresAt)) {
        throw new SiteCreationPreviewPublicError("El Preview expiro. Genera uno nuevo antes de crear el sitio.")
      }

      if (preview.status !== "completed") {
        throw new SiteCreationPreviewPublicError("Este Preview ya se esta procesando. Espera unos segundos e intenta de nuevo.")
      }

      const claimed = await tx.aiGenerationJob.updateMany({
        where: {
          id: params.previewId,
          type: SITE_CREATION_PREVIEW_JOB_TYPE,
          status: "completed",
        },
        data: {
          status: "processing",
          error: null,
        },
      })

      if (claimed.count !== 1) {
        throw new SiteCreationPreviewPublicError("Este Preview ya se esta procesando. Espera unos segundos e intenta de nuevo.")
      }

      const access = await requireCanCreateWebsiteInTx(tx, params.userId)
      const existing = await tx.editorWebsite.findUnique({
        where: { id: preview.reservedSiteId },
        select: { id: true, userId: true, published: true },
      })

      if (existing && existing.userId !== params.userId) {
        throw new SiteCreationPreviewForbiddenError()
      }

      if (!existing) {
        await createSiteFromTree({
          id: preview.reservedSiteId,
          tx,
          access,
          name,
          description,
          userId: params.userId,
          tree,
          createHomePage: true,
          syncTheme: true,
          seedProfessionalPages: false,
        })

        if (v2Plan) {
          const homePage = v2Plan.pages.find((page) => page.isHome)

          if (!homePage) {
            throw new SiteCreationPreviewPublicError("El plan multipagina no contiene una pagina home valida.")
          }

          await tx.sitePage.update({
            where: {
              siteId_slug: {
                siteId: preview.reservedSiteId,
                slug: HOME_PAGE_SLUG,
              },
            },
            data: {
              name: homePage.name,
              tree: toJsonValue(homePage.tree),
              seo: toJsonValue(homePage.seo),
              isHome: true,
              published: false,
            },
          })

          for (const page of v2Plan.pages) {
            if (page.isHome) continue

            await tx.sitePage.create({
              data: {
                siteId: preview.reservedSiteId,
                name: page.name,
                slug: page.slug,
                tree: toJsonValue(page.tree),
                seo: toJsonValue(page.seo),
                isHome: false,
                published: false,
              },
            })
          }
        }
      }

      const verified = v2Plan
        ? await verifyCreatedDraftSiteV2(tx, preview.reservedSiteId, v2Plan)
        : await verifyCreatedDraftSite(tx, preview.reservedSiteId, tree)

      if (!verified) {
        throw new SiteCreationPreviewPublicError("El sitio borrador se creo pero no pudo verificarse.")
      }

      const output = {
        siteId: preview.reservedSiteId,
        nextRoute: `/editor/${preview.reservedSiteId}`,
        consumedAt: new Date().toISOString(),
      } satisfies SiteCreationPreviewOutput

      const consumed = await tx.aiGenerationJob.updateMany({
        where: {
          id: params.previewId,
          type: SITE_CREATION_PREVIEW_JOB_TYPE,
          status: "processing",
        },
        data: {
          siteId: preview.reservedSiteId,
          status: "consumed",
          output: toJsonValue(output),
          error: null,
        },
      })

      if (consumed.count !== 1) {
        throw new SiteCreationPreviewPublicError("No se pudo confirmar la creacion del sitio. Intenta de nuevo.")
      }

      return {
        siteId: output.siteId,
        nextRoute: output.nextRoute,
        verified: true,
        rollbackApplied: false,
      }
    })
  } catch (error) {
    if (error instanceof SiteCreationPreviewPublicError) throw error

    serverError("[site_creation] Fallo tecnico creando sitio desde Preview", {
      previewId: params.previewId,
      userId: params.userId,
      error,
    })

    throw new SiteCreationPreviewPublicError("No se pudo crear el sitio con Orvenix AI.")
  }
}

export function getSiteCreationPreviewFailureMessage(error: unknown) {
  if (error instanceof SiteCreationPreviewPublicError) return error.message
  return "No se pudo crear el sitio con Orvenix AI."
}
