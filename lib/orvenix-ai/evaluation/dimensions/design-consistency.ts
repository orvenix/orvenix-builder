import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

const REQUIRED_COLOR_CHANNELS = ["primary", "secondary", "background", "text", "accent"] as const

function normalizeColor(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null
}

/**
 * Design consistency checks only objective, syntactic properties of the
 * shared theme and node props (SiteCreationPlanV2 already guarantees
 * theme/globalTheme sync across pages via its own validator). It never
 * judges aesthetics such as color harmony or spacing taste.
 */
export function evaluateDesignConsistency(plan: SiteCreationPlanV2): EvaluationFindingV1[] {
  const findings: EvaluationFindingV1[] = []
  const theme = plan.theme ?? {}
  const colors = theme.colors as Record<string, unknown> | undefined

  if (!colors && !theme.fontHeading && !theme.fontBody) {
    findings.push(
      createFinding({
        code: FINDING_CODES.DESIGN_THEME_EMPTY,
        severity: "warning",
        dimension: "designConsistency",
        message: "El Theme compartido no define colores ni tipografia.",
      }),
    )
  }

  if (colors) {
    const missingChannels = REQUIRED_COLOR_CHANNELS.filter((channel) => !normalizeColor(colors[channel]))
    if (missingChannels.length > 0) {
      findings.push(
        createFinding({
          code: FINDING_CODES.DESIGN_INCOMPLETE_COLOR_TOKENS,
          severity: "warning",
          dimension: "designConsistency",
          message: `El Theme tiene ${missingChannels.length} canal(es) de color faltante(s) o vacio(s).`,
        }),
      )
    }

    const text = normalizeColor(colors.text)
    const background = normalizeColor(colors.background)
    if (text && background && text === background) {
      findings.push(
        createFinding({
          code: FINDING_CODES.DESIGN_COLOR_COLLISION,
          severity: "error",
          dimension: "designConsistency",
          message: "El color de texto y el color de fondo del Theme son identicos (texto invisible).",
        }),
      )
    }
  }

  for (const page of plan.pages) {
    const { reachableNodes } = analyzeTreeGraph(page.tree)

    for (const node of reachableNodes) {
      const opacity = node.props?.styleOpacity
      if (typeof opacity === "number" && (opacity < 0 || opacity > 1)) {
        findings.push(
          createFinding({
            code: FINDING_CODES.DESIGN_INVALID_PROP_VALUE,
            severity: "warning",
            dimension: "designConsistency",
            message: `La pagina "${page.slug}" tiene un nodo con opacidad fuera de rango (0..1).`,
            pageSlug: page.slug,
            nodeId: node.id,
          }),
        )
      }

      for (const key of ["width", "height"] as const) {
        const value = node.props?.[key]
        if (typeof value === "number" && value < 0) {
          findings.push(
            createFinding({
              code: FINDING_CODES.DESIGN_INVALID_PROP_VALUE,
              severity: "warning",
              dimension: "designConsistency",
              message: `La pagina "${page.slug}" tiene un nodo con ${key} negativo.`,
              pageSlug: page.slug,
              nodeId: node.id,
            }),
          )
        }
      }
    }
  }

  return findings
}
