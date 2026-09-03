import { randomBytes, randomUUID } from "crypto"

import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"
import { canCreateWebsite, canUseAI } from "@/lib/billing/plan-entitlements"
import { getFeatureLimitMessage, getWebsiteLimitMessage } from "@/lib/plan-guard-messages"
import type { PlanAccess } from "@/lib/plan-guard"
import { createSiteFromTree } from "@/lib/auth"
import { HOME_PAGE_SLUG } from "@/lib/builder-core/tree/sitePages"
import { hashEditorTree } from "@/lib/orvenix-ai/mutation/executor"
import type { OrvenixAIMutationPlan } from "@/lib/orvenix-ai/mutation"
import type { OrvenixAgentBusinessContext, OrvenixSiteCreationResult } from "@/lib/orvenix-ai/agent/types"
import { serverError, serverWarn } from "@/lib/server-log"
import type { EditorTree } from "@/types/editor"
import { validateTree } from "@/types/validateTree"

export const SITE_CREATION_PREVIEW_JOB_TYPE = "ai_site_creation_preview"
export const SITE_CREATION_PREVIEW_EXPIRES_MS = 24 * 60 * 60 * 1000
export const SITE_CREATION_PREVIEW_RETENTION_MS = 7 * 24 * 60 * 60 * 1000
export const SITE_CREATION_PREVIEW_MAX_BYTES = 1_500_000

export type SiteCreationPreviewStatus = "completed" | "processing" | "consumed" | "failed"

export interface SiteCreationPreviewRecord {
  id: string
  userId: string
  previewHash: string
  reservedSiteId: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: OrvenixAIMutationPlan
  createdAt: string
  expiresAt: string
  status: SiteCreationPreviewStatus
  error?: string | null
  output?: SiteCreationPreviewOutput | null
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

function normalizeRecord(job: AIGenerationJobRecord): SiteCreationPreviewRecord | null {
  if (!job || job.type !== SITE_CREATION_PREVIEW_JOB_TYPE || typeof job.input !== "object" || job.input === null) {
    return null
  }

  const input = job.input as Partial<SiteCreationPreviewRecord>

  if (
    typeof input.userId !== "string" ||
    typeof input.previewHash !== "string" ||
    typeof input.reservedSiteId !== "string" ||
    typeof input.request !== "string" ||
    typeof input.createdAt !== "string" ||
    typeof input.expiresAt !== "string" ||
    !input.business ||
    !input.plan
  ) {
    return null
  }

  return {
    id: job.id,
    userId: input.userId,
    previewHash: input.previewHash,
    reservedSiteId: input.reservedSiteId,
    request: input.request,
    business: input.business,
    plan: input.plan,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    status: job.status as SiteCreationPreviewStatus,
    error: job.error,
    output: normalizeOutput(job.output),
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

export async function rememberSiteCreationPreview(record: {
  userId: string
  previewHash: string
  request: string
  business: OrvenixAgentBusinessContext
  plan: OrvenixAIMutationPlan
}) {
  const id = randomUUID()
  const now = new Date()
  const reservedSiteId = generateSiteId()
  const expiresAt = new Date(now.getTime() + SITE_CREATION_PREVIEW_EXPIRES_MS)
  const plan = normalizeSiteCreationPlanForReservedSite(record.plan, reservedSiteId)

  if (!plan.after.theme && !plan.after.globalTheme) {
    throw new SiteCreationPreviewPublicError("El Preview generado no incluye un Theme valido. Intenta generar uno nuevo.")
  }

  const previewHash = hashEditorTree(plan.after)

  if (previewHash !== record.previewHash) {
    throw new SiteCreationPreviewPublicError("El Preview generado no pudo validarse. Intenta generar uno nuevo.")
  }

  const payload = {
    userId: record.userId,
    previewHash,
    reservedSiteId,
    request: record.request,
    business: record.business,
    plan,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies Omit<SiteCreationPreviewRecord, "id" | "status" | "error" | "output">

  const size = measureJsonBytes(payload)
  if (size > SITE_CREATION_PREVIEW_MAX_BYTES) {
    throw new SiteCreationPreviewPublicError(
      "El sitio generado es demasiado grande para guardarse como Preview. Prueba con una descripcion mas enfocada.",
    )
  }

  await pruneSiteCreationPreviewJobs(now)

  const job = await editorPrisma.aiGenerationJob.create({
    data: {
      id,
      siteId: null,
      pageId: null,
      type: SITE_CREATION_PREVIEW_JOB_TYPE,
      input: toJsonValue(payload),
      output: null,
      status: "completed",
      error: null,
    },
  })

  const preview = normalizeRecord(job)
  if (!preview) {
    throw new SiteCreationPreviewPublicError("No se pudo guardar el Preview. Intenta generarlo de nuevo.")
  }

  return preview
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

      const tree = preview.plan.after
      const name = preview.business.name?.trim() || "Sitio creado con Orvenix AI"
      const description = preview.business.description?.trim() || preview.request
      const persistedTreeHash = hashEditorTree(tree)

      if (persistedTreeHash !== preview.previewHash || preview.previewHash !== params.expectedPreviewHash) {
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
      }

      const verified = await verifyCreatedDraftSite(tx, preview.reservedSiteId, tree)
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
