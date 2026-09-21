import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph, collectInternalLinks } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

/** Caps how many broken-link findings a single plan can produce. */
const MAX_BROKEN_LINK_FINDINGS = 20

/**
 * Navigation checks what SiteCreationPlanV2's validator cannot: internal
 * `page:<slug>` links embedded inside arbitrary node props (buttons,
 * ctas, etc.), which the contract never inspects. The top-level
 * `navigation` array is already guaranteed internally consistent by
 * `validateSiteCreationPlanV2`, so it is only used here as a reachability
 * source, not re-validated. No external URLs are checked (no network).
 */
export function evaluateNavigation(plan: SiteCreationPlanV2): EvaluationFindingV1[] {
  const findings: EvaluationFindingV1[] = []
  const pageSlugs = new Set(plan.pages.map((page) => page.slug))
  const reachableSlugs = new Set<string>(["home", ...plan.navigation.map((item) => item.slug)])

  let brokenLinkFindings = 0

  for (const page of plan.pages) {
    const { reachableNodes } = analyzeTreeGraph(page.tree)
    const internalLinks = collectInternalLinks(reachableNodes)

    for (const link of internalLinks) {
      if (pageSlugs.has(link.targetSlug)) {
        reachableSlugs.add(link.targetSlug)
        continue
      }

      if (brokenLinkFindings >= MAX_BROKEN_LINK_FINDINGS) continue
      brokenLinkFindings += 1

      findings.push(
        createFinding({
          code: FINDING_CODES.NAVIGATION_BROKEN_INTERNAL_LINK,
          severity: "error",
          dimension: "navigation",
          message: `La pagina "${page.slug}" tiene un enlace interno a una pagina inexistente.`,
          pageSlug: page.slug,
          nodeId: link.nodeId,
        }),
      )
    }
  }

  for (const page of plan.pages) {
    if (page.isHome) continue
    if (reachableSlugs.has(page.slug)) continue

    findings.push(
      createFinding({
        code: FINDING_CODES.NAVIGATION_PAGE_ORPHANED,
        severity: "error",
        dimension: "navigation",
        message: `La pagina "${page.slug}" no es alcanzable desde la navegacion ni desde enlaces internos.`,
        pageSlug: page.slug,
      }),
    )
  }

  return findings
}
