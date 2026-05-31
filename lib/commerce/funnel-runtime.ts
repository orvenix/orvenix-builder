import { getFunnel, type FunnelStepKind } from "@/lib/commerce/funnels"
import { HOME_PAGE_SLUG, listSitePages } from "@/lib/builder-core/tree/sitePages"

export async function getFunnelStepPublicPath(
  siteId: string,
  funnelId: string,
  stepKind: FunnelStepKind
) {
  const funnel = await getFunnel(siteId, funnelId)
  if (!funnel?.steps?.length) return null

  const step = funnel.steps
    .slice()
    .sort((a, b) => a.position - b.position)
    .find((entry) => entry.kind === stepKind)

  if (!step?.pageId) return null

  const pages = await listSitePages(siteId)
  const page = pages.find((entry) => entry.id === step.pageId)
  if (!page) return null

  return page.slug === HOME_PAGE_SLUG
    ? `/p/${encodeURIComponent(siteId)}`
    : `/p/${encodeURIComponent(siteId)}/${encodeURIComponent(page.slug)}`
}

export async function buildFunnelStepRedirectPath(input: {
  siteId: string
  funnelId?: string
  targetStep: FunnelStepKind
  fallbackPath: string
  searchParams?: Record<string, string | undefined>
}) {
  const basePath = input.funnelId
    ? (await getFunnelStepPublicPath(input.siteId, input.funnelId, input.targetStep)) ?? input.fallbackPath
    : input.fallbackPath

  const url = new URL(basePath, "http://orvenix.local")
  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    if (value) url.searchParams.set(key, value)
  }

  return `${url.pathname}${url.search}`
}
