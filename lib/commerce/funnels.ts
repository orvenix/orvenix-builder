import { editorPrisma } from "@/lib/editor-db"
import type { Prisma } from "@/generated/editor-prisma"

export type FunnelStatus = "draft" | "active" | "archived"
export type FunnelStepKind = "landing" | "checkout" | "upsell" | "downsell" | "thankyou"

export interface FunnelRecord {
  id: string
  siteId: string
  name: string
  slug: string
  status: FunnelStatus
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  steps?: FunnelStepRecord[]
}

export interface FunnelStepRecord {
  id: string
  funnelId: string
  pageId: string | null
  kind: FunnelStepKind
  position: number
  settings: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

type DynamicFunnelDelegate = {
  findMany: (args: {
    where?: Record<string, unknown>
    orderBy?: Record<string, "asc" | "desc">
    include?: Record<string, unknown>
  }) => Promise<FunnelRecord[]>
  create: (args: {
    data: Record<string, unknown>
    include?: Record<string, unknown>
  }) => Promise<FunnelRecord>
  update: (args: {
    where: { id: string }
    data: Record<string, unknown>
    include?: Record<string, unknown>
  }) => Promise<FunnelRecord>
  delete: (args: { where: { id: string } }) => Promise<FunnelRecord>
  findFirst: (args: {
    where?: Record<string, unknown>
    include?: Record<string, unknown>
  }) => Promise<FunnelRecord | null>
}

type DynamicFunnelStepDelegate = {
  deleteMany: (args: { where: Record<string, unknown> }) => Promise<unknown>
  createMany: (args: { data: Record<string, unknown>[] }) => Promise<unknown>
}

function getFunnelDelegate(): DynamicFunnelDelegate | null {
  const candidate = (editorPrisma as unknown as { funnel?: DynamicFunnelDelegate }).funnel
  return candidate ?? null
}

function getFunnelStepDelegate(): DynamicFunnelStepDelegate | null {
  const candidate = (editorPrisma as unknown as { funnelStep?: DynamicFunnelStepDelegate }).funnelStep
  return candidate ?? null
}

export function isFunnelsReady() {
  return Boolean(getFunnelDelegate() && getFunnelStepDelegate())
}

export async function listFunnels(siteId: string) {
  const delegate = getFunnelDelegate()
  if (!delegate) return []

  return delegate.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
    include: { steps: true },
  })
}

export async function getFunnel(siteId: string, funnelId: string) {
  const delegate = getFunnelDelegate()
  if (!delegate) return null

  return delegate.findFirst({
    where: { id: funnelId, siteId },
    include: { steps: true },
  })
}

export async function createFunnel(siteId: string, input: {
  name: string
  slug: string
  status?: FunnelStatus
  settings?: Record<string, unknown>
  steps?: Array<{
    pageId?: string | null
    kind: FunnelStepKind
    position: number
    settings?: Record<string, unknown>
  }>
}) {
  const delegate = getFunnelDelegate()
  if (!delegate) {
    throw new Error("FUNNELS_NOT_READY")
  }

  return delegate.create({
    data: {
      siteId,
      name: input.name,
      slug: input.slug,
      status: input.status ?? "draft",
      settings: (input.settings ?? {}) as Prisma.InputJsonValue,
      steps: input.steps?.length
        ? {
            create: input.steps.map((step) => ({
              pageId: step.pageId ?? null,
              kind: step.kind,
              position: step.position,
              settings: (step.settings ?? {}) as Prisma.InputJsonValue,
            })),
          }
        : undefined,
    },
    include: { steps: true },
  })
}

export async function updateFunnel(
  siteId: string,
  funnelId: string,
  input: {
    name?: string
    slug?: string
    status?: FunnelStatus
    settings?: Record<string, unknown>
    steps?: Array<{
      pageId?: string | null
      kind: FunnelStepKind
      position: number
      settings?: Record<string, unknown>
    }>
  }
) {
  const delegate = getFunnelDelegate()
  const stepDelegate = getFunnelStepDelegate()
  if (!delegate || !stepDelegate) {
    throw new Error("FUNNELS_NOT_READY")
  }

  const existing = await getFunnel(siteId, funnelId)
  if (!existing) {
    throw new Error("FUNNEL_NOT_FOUND")
  }

  if (input.steps) {
    await stepDelegate.deleteMany({ where: { funnelId } })
    if (input.steps.length > 0) {
      await stepDelegate.createMany({
        data: input.steps.map((step) => ({
          funnelId,
          pageId: step.pageId ?? null,
          kind: step.kind,
          position: step.position,
          settings: (step.settings ?? {}) as Prisma.InputJsonValue,
        })),
      })
    }
  }

  return delegate.update({
    where: { id: funnelId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.settings ? { settings: input.settings as Prisma.InputJsonValue } : {}),
    },
    include: { steps: true },
  })
}

export async function deleteFunnel(siteId: string, funnelId: string) {
  const delegate = getFunnelDelegate()
  if (!delegate) {
    throw new Error("FUNNELS_NOT_READY")
  }

  const existing = await getFunnel(siteId, funnelId)
  if (!existing) {
    throw new Error("FUNNEL_NOT_FOUND")
  }

  await delegate.delete({ where: { id: funnelId } })
}
