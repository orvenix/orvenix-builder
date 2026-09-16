import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph, collectInternalLinks } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationContextV1, EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

export type ConversionObjectiveBucket = "leads" | "informational" | "unknown"

const LEADS_KEYWORDS = [
  "lead",
  "leads",
  "cita",
  "citas",
  "agendar",
  "appointment",
  "appointments",
  "contacto",
  "consulta",
  "cotizacion",
  "cotización",
  "reservar",
  "reserva",
  "booking",
  "whatsapp",
]

const INFORMATIONAL_KEYWORDS = [
  "informar",
  "información",
  "informacion",
  "informational",
  "awareness",
  "blog",
  "difundir",
  "divulgar",
  "educar",
]

/**
 * Deterministic keyword classification, not NLP/ML. Only the two buckets
 * the product has explicitly specified (leads/appointments and
 * informational) drive rules; anything else abstains rather than
 * inventing untested behavior (e.g. commerce/checkout requirements).
 */
export function classifyConversionObjective(objective: string): ConversionObjectiveBucket {
  const normalized = objective.toLowerCase()

  if (LEADS_KEYWORDS.some((keyword) => normalized.includes(keyword))) return "leads"
  if (INFORMATIONAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) return "informational"
  return "unknown"
}

function hasMeaningfulCta(plan: SiteCreationPlanV2): { hasCta: boolean; hasOnlyPlaceholderCta: boolean } {
  let hasCta = false
  let hasOnlyPlaceholderCta = true

  for (const page of plan.pages) {
    const { reachableNodes } = analyzeTreeGraph(page.tree)

    for (const node of reachableNodes) {
      if (!node.type.toLowerCase().includes("cta")) continue

      hasCta = true
      const href = node.props?.href
      const hasPlainHref = typeof href === "string" && href.trim().length > 0 && href.trim() !== "#"
      const hasInternalLink = collectInternalLinks([node]).length > 0

      if (hasPlainHref || hasInternalLink) {
        hasOnlyPlaceholderCta = false
      }
    }
  }

  return { hasCta, hasOnlyPlaceholderCta: hasCta && hasOnlyPlaceholderCta }
}

/**
 * Conversion readiness only fires when the caller supplies `context.objective`
 * (SiteCreationPlanV2 itself carries no objective/siteType). Without it,
 * the dimension abstains entirely rather than guessing.
 */
export function evaluateConversionReadiness(
  plan: SiteCreationPlanV2,
  context: EvaluationContextV1 | undefined,
): { applicable: boolean; findings: EvaluationFindingV1[] } {
  const objective = context?.objective?.trim()

  if (!objective) {
    return {
      applicable: false,
      findings: [
        createFinding({
          code: FINDING_CODES.CONVERSION_CONTEXT_MISSING,
          severity: "info",
          dimension: "conversionReadiness",
          message: "No se proporciono 'objective' en el contexto; dimension omitida.",
        }),
      ],
    }
  }

  const bucket = classifyConversionObjective(objective)
  const findings: EvaluationFindingV1[] = []

  if (bucket === "unknown") {
    findings.push(
      createFinding({
        code: FINDING_CODES.CONVERSION_OBJECTIVE_UNRECOGNIZED,
        severity: "info",
        dimension: "conversionReadiness",
        message: "El objective proporcionado no coincide con ninguna regla V1 conocida; no se aplican reglas.",
      }),
    )
    return { applicable: true, findings }
  }

  if (bucket === "informational") {
    return { applicable: true, findings }
  }

  const { hasCta, hasOnlyPlaceholderCta } = hasMeaningfulCta(plan)

  if (!hasCta) {
    findings.push(
      createFinding({
        code: FINDING_CODES.CONVERSION_MISSING_CTA,
        severity: "error",
        dimension: "conversionReadiness",
        message: "El objetivo requiere leads/citas pero el plan no tiene ningun CTA.",
      }),
    )
  } else if (hasOnlyPlaceholderCta) {
    findings.push(
      createFinding({
        code: FINDING_CODES.CONVERSION_CTA_PLACEHOLDER_TARGET,
        severity: "warning",
        dimension: "conversionReadiness",
        message: "El plan tiene CTA(s) pero ninguno apunta a un destino real.",
      }),
    )
  }

  return { applicable: true, findings }
}
