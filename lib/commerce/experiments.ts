import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"

export type ExperimentStatus = "draft" | "active" | "archived"
export type ExperimentTargetType = "page" | "funnel"
export type ExperimentVariant = "A" | "B"

export interface ExperimentVariantTarget {
  pageId: string | null
  funnelId: string | null
}

export interface ExperimentTrafficSplit {
  a: number
  b: number
  variants?: {
    B?: ExperimentVariantTarget
  }
}

export interface ExperimentRecord {
  id: string
  siteId: string
  pageId: string | null
  funnelId: string | null
  name: string
  status: ExperimentStatus
  targetType: ExperimentTargetType
  trafficSplit: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

type DynamicExperimentDelegate = {
  findMany: (args: {
    where?: Record<string, unknown>
    orderBy?: Record<string, "asc" | "desc">
  }) => Promise<ExperimentRecord[]>
  create: (args: {
    data: Record<string, unknown>
  }) => Promise<ExperimentRecord>
  update: (args: {
    where: { id: string }
    data: Record<string, unknown>
  }) => Promise<ExperimentRecord>
  delete: (args: { where: { id: string } }) => Promise<ExperimentRecord>
  findFirst: (args: {
    where?: Record<string, unknown>
  }) => Promise<ExperimentRecord | null>
}

function getExperimentDelegate(): DynamicExperimentDelegate | null {
  const candidate = (editorPrisma as unknown as { experiment?: DynamicExperimentDelegate }).experiment
  return candidate ?? null
}

function clampSplitValue(value: unknown, fallback: number) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(1, Math.min(99, Math.trunc(numeric)))
}

function normalizeVariantTarget(value: unknown): ExperimentVariantTarget | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const pageId = typeof raw.pageId === "string" && raw.pageId.trim() ? raw.pageId.trim() : null
  const funnelId = typeof raw.funnelId === "string" && raw.funnelId.trim() ? raw.funnelId.trim() : null
  if (!pageId && !funnelId) return null
  return { pageId, funnelId }
}

export function normalizeExperimentTrafficSplit(value: unknown): ExperimentTrafficSplit {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const a = clampSplitValue(raw.a, 50)
  const b = clampSplitValue(raw.b, 100 - a)
  const variantsRaw = raw.variants && typeof raw.variants === "object" ? raw.variants as Record<string, unknown> : {}
  const variantB = normalizeVariantTarget(variantsRaw.B)

  return variantB
    ? { a, b, variants: { B: variantB } }
    : { a, b }
}

export function getExperimentVariantTarget(
  experiment: Pick<ExperimentRecord, "pageId" | "funnelId" | "trafficSplit">,
  variant: ExperimentVariant
): ExperimentVariantTarget {
  const split = normalizeExperimentTrafficSplit(experiment.trafficSplit)
  if (variant === "B" && split.variants?.B) {
    return split.variants.B
  }

  return {
    pageId: experiment.pageId,
    funnelId: experiment.funnelId,
  }
}

export function isExperimentsReady() {
  return Boolean(getExperimentDelegate())
}

export async function listExperiments(siteId: string) {
  const delegate = getExperimentDelegate()
  if (!delegate) return []

  return delegate.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getExperiment(siteId: string, experimentId: string) {
  const delegate = getExperimentDelegate()
  if (!delegate) return null

  return delegate.findFirst({
    where: { id: experimentId, siteId },
  })
}

export async function createExperiment(siteId: string, input: {
  pageId?: string | null
  funnelId?: string | null
  name: string
  status?: ExperimentStatus
  targetType: ExperimentTargetType
  trafficSplit?: Record<string, unknown>
}) {
  const delegate = getExperimentDelegate()
  if (!delegate) {
    throw new Error("EXPERIMENTS_NOT_READY")
  }

  return delegate.create({
    data: {
      siteId,
      pageId: input.pageId ?? null,
      funnelId: input.funnelId ?? null,
      name: input.name,
      status: input.status ?? "draft",
      targetType: input.targetType,
      trafficSplit: normalizeExperimentTrafficSplit(input.trafficSplit ?? { a: 50, b: 50 }) as Prisma.InputJsonValue,
    },
  })
}

export async function updateExperiment(
  siteId: string,
  experimentId: string,
  input: {
    pageId?: string | null
    funnelId?: string | null
    name?: string
    status?: ExperimentStatus
    targetType?: ExperimentTargetType
    trafficSplit?: Record<string, unknown>
  }
) {
  const delegate = getExperimentDelegate()
  if (!delegate) {
    throw new Error("EXPERIMENTS_NOT_READY")
  }

  const existing = await getExperiment(siteId, experimentId)
  if (!existing) {
    throw new Error("EXPERIMENT_NOT_FOUND")
  }

  return delegate.update({
    where: { id: experimentId },
    data: {
      ...(input.pageId !== undefined ? { pageId: input.pageId } : {}),
      ...(input.funnelId !== undefined ? { funnelId: input.funnelId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.targetType !== undefined ? { targetType: input.targetType } : {}),
      ...(input.trafficSplit !== undefined
        ? { trafficSplit: normalizeExperimentTrafficSplit(input.trafficSplit) as Prisma.InputJsonValue }
        : {}),
    },
  })
}

export async function deleteExperiment(siteId: string, experimentId: string) {
  const delegate = getExperimentDelegate()
  if (!delegate) {
    throw new Error("EXPERIMENTS_NOT_READY")
  }

  const existing = await getExperiment(siteId, experimentId)
  if (!existing) {
    throw new Error("EXPERIMENT_NOT_FOUND")
  }

  await delegate.delete({ where: { id: experimentId } })
}
