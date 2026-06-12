import { getFunnel, type FunnelStepKind } from "@/lib/commerce/funnels"
import {
  resolveCurrentFunnelStep,
  resolveNextFunnelStep,
  isFunnelStepKind,
} from "@/lib/commerce/funnel-step-sequence"
import { HOME_PAGE_SLUG, listSitePages } from "@/lib/builder-core/tree/sitePages"

type FunnelStepLike = {
  id: string
  kind: FunnelStepKind
  position: number
  pageId: string | null
}

type ResolvedFunnelStepContext = {
  stepId: string
  stepKind: FunnelStepKind
  path: string | null
}

async function resolveStepPath(siteId: string, step: FunnelStepLike): Promise<string | null> {
  if (!step.pageId) return null

  const pages = await listSitePages(siteId)
  const page = pages.find((entry) => entry.id === step.pageId)
  if (!page) return null

  return page.slug === HOME_PAGE_SLUG
    ? `/p/${encodeURIComponent(siteId)}`
    : `/p/${encodeURIComponent(siteId)}/${encodeURIComponent(page.slug)}`
}

async function resolveFunnelStepContext(siteId: string, step: FunnelStepLike): Promise<ResolvedFunnelStepContext> {
  return {
    stepId: step.id,
    stepKind: step.kind,
    path: await resolveStepPath(siteId, step),
  }
}

export async function getFunnelStepContext(
  siteId: string,
  funnelId: string,
  stepKind: FunnelStepKind
) {
  const funnel = await getFunnel(siteId, funnelId)
  if (!funnel?.steps?.length) return null

  const steps = funnel.steps as FunnelStepLike[]
  const step = resolveCurrentFunnelStep(steps, { stepKind }) as FunnelStepLike | null

  if (!step) return null

  return resolveFunnelStepContext(siteId, step)
}

export async function getFunnelStepPublicPath(
  siteId: string,
  funnelId: string,
  stepKind: FunnelStepKind
) {
  const context = await getFunnelStepContext(siteId, funnelId, stepKind)
  return context?.path ?? null
}

export async function getNextFunnelStepContext(
  siteId: string,
  funnelId: string,
  input: { stepId?: string | null; stepKind?: FunnelStepKind | null }
) {
  const funnel = await getFunnel(siteId, funnelId)
  if (!funnel?.steps?.length) return null

  const steps = funnel.steps as FunnelStepLike[]
  const nextStep = resolveNextFunnelStep(steps, input) as FunnelStepLike | null
  if (!nextStep) return null

  return resolveFunnelStepContext(siteId, nextStep)
}

export async function buildFunnelStepRedirectPath(input: {
  siteId: string
  funnelId?: string
  targetStep?: FunnelStepKind
  targetStepId?: string
  fallbackPath: string
  searchParams?: Record<string, string | undefined>
}) {
  const stepContext = input.funnelId
    ? input.targetStepId
      ? await getExactFunnelStepContext(input.siteId, input.funnelId, input.targetStepId)
      : input.targetStep
        ? await getFunnelStepContext(input.siteId, input.funnelId, input.targetStep)
        : null
    : null
  const basePath = stepContext?.path ?? input.fallbackPath

  const url = new URL(basePath, "http://orvenix.local")
  if (stepContext?.stepId && !input.searchParams?.funnelStepId) {
    url.searchParams.set("funnelStepId", stepContext.stepId)
  }
  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    if (value) url.searchParams.set(key, value)
  }

  return `${url.pathname}${url.search}`
}

async function getExactFunnelStepContext(siteId: string, funnelId: string, stepId: string) {
  const funnel = await getFunnel(siteId, funnelId)
  if (!funnel?.steps?.length) return null

  const steps = funnel.steps as FunnelStepLike[]
  const step = resolveCurrentFunnelStep(steps, { stepId }) as FunnelStepLike | null
  if (!step) return null

  return resolveFunnelStepContext(siteId, step)
}

export { isFunnelStepKind }
