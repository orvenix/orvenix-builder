import { HOME_PAGE_SLUG, listSitePages } from "@/lib/builder-core/tree/sitePages"
import { getFunnelStepPublicPath } from "@/lib/commerce/funnel-runtime"
import { getExperiment, getExperimentVariantTarget, type ExperimentVariant } from "@/lib/commerce/experiments"

export async function getExperimentTargetPath(siteId: string, experimentId: string, variant: ExperimentVariant = "A") {
  const experiment = await getExperiment(siteId, experimentId)
  if (!experiment) return null
  const target = getExperimentVariantTarget(experiment, variant)

  if (experiment.targetType === "page" && target.pageId) {
    const pages = await listSitePages(siteId)
    const page = pages.find((entry) => entry.id === target.pageId)
    if (!page) return null
    return page.slug === HOME_PAGE_SLUG
      ? `/p/${encodeURIComponent(siteId)}`
      : `/p/${encodeURIComponent(siteId)}/${encodeURIComponent(page.slug)}`
  }

  if (experiment.targetType === "funnel" && target.funnelId) {
    return (await getFunnelStepPublicPath(siteId, target.funnelId, "landing"))
      ?? `/p/${encodeURIComponent(siteId)}/funnel/${encodeURIComponent(target.funnelId)}/landing`
  }

  return `/p/${encodeURIComponent(siteId)}`
}
