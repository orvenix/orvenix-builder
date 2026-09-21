import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph, countContentBearingNodes } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

/** Below this many content-bearing nodes, a non-empty page is "thin". */
const THIN_CONTENT_NODE_THRESHOLD = 2

/**
 * Completeness looks for objectively empty or very thin pages. It does
 * not assume any universal page inventory (no "every site needs a FAQ")
 * and does not repeat the home-empty hard failure already raised by the
 * structure dimension.
 */
export function evaluateCompleteness(plan: SiteCreationPlanV2): EvaluationFindingV1[] {
  const findings: EvaluationFindingV1[] = []

  for (const page of plan.pages) {
    const { reachableNodes } = analyzeTreeGraph(page.tree)
    const contentNodeCount = countContentBearingNodes(reachableNodes)

    if (page.isHome) {
      if (contentNodeCount > 0 && contentNodeCount < THIN_CONTENT_NODE_THRESHOLD) {
        findings.push(
          createFinding({
            code: FINDING_CODES.COMPLETENESS_HOME_THIN,
            severity: "warning",
            dimension: "completeness",
            message: "La pagina home tiene muy poco contenido real.",
            pageSlug: page.slug,
          }),
        )
      }
      continue
    }

    if (contentNodeCount === 0) {
      findings.push(
        createFinding({
          code: FINDING_CODES.COMPLETENESS_PAGE_EMPTY,
          severity: "error",
          dimension: "completeness",
          message: `La pagina "${page.slug}" no tiene ningun contenido real.`,
          pageSlug: page.slug,
        }),
      )
    } else if (contentNodeCount < THIN_CONTENT_NODE_THRESHOLD) {
      findings.push(
        createFinding({
          code: FINDING_CODES.COMPLETENESS_PAGE_THIN,
          severity: "warning",
          dimension: "completeness",
          message: `La pagina "${page.slug}" tiene muy poco contenido real.`,
          pageSlug: page.slug,
        }),
      )
    }
  }

  return findings
}
