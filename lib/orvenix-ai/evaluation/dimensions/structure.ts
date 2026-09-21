import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph, countContentBearingNodes } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

/**
 * Structure evaluates properties SiteCreationPlanV2's own contract
 * validator (`validateSiteCreationPlanV2`) does not check: dangling
 * child references, graph cycles among nodes, unreachable nodes, and a
 * completely empty home page. Shape guarantees already enforced by the
 * validator (single home, unique slugs, theme sync, treeHash integrity,
 * nav targets existing) are intentionally not re-checked here.
 */
export function evaluateStructure(plan: SiteCreationPlanV2): EvaluationFindingV1[] {
  const findings: EvaluationFindingV1[] = []

  for (const page of plan.pages) {
    const analysis = analyzeTreeGraph(page.tree)

    for (const ref of analysis.danglingChildRefs) {
      findings.push(
        createFinding({
          code: FINDING_CODES.STRUCTURE_DANGLING_CHILD_REF,
          severity: "error",
          dimension: "structure",
          message: `La pagina "${page.slug}" tiene un nodo que referencia un hijo inexistente.`,
          pageSlug: page.slug,
          nodeId: ref.nodeId,
        }),
      )
    }

    for (const nodeId of analysis.cycleNodeIds) {
      findings.push(
        createFinding({
          code: FINDING_CODES.STRUCTURE_NODE_CYCLE,
          severity: "error",
          dimension: "structure",
          message: `La pagina "${page.slug}" tiene un ciclo en su arbol de nodos.`,
          pageSlug: page.slug,
          nodeId,
        }),
      )
    }

    if (analysis.unreachableNodeIds.length > 0) {
      findings.push(
        createFinding({
          code: FINDING_CODES.STRUCTURE_UNREACHABLE_NODE,
          severity: "warning",
          dimension: "structure",
          message: `La pagina "${page.slug}" tiene ${analysis.unreachableNodeIds.length} nodo(s) inalcanzables desde la raiz.`,
          pageSlug: page.slug,
        }),
      )
    }

    if (page.isHome && countContentBearingNodes(analysis.reachableNodes) === 0) {
      findings.push(
        createFinding({
          code: FINDING_CODES.STRUCTURE_HOME_EMPTY,
          severity: "error",
          dimension: "structure",
          message: "La pagina home no tiene ningun contenido real (falla estructural fundamental).",
          pageSlug: page.slug,
        }),
      )
    }
  }

  return findings
}
