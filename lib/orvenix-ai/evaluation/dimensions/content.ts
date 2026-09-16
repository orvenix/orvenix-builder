import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import { FINDING_CODES } from "@/lib/orvenix-ai/evaluation/codes"
import { createFinding } from "@/lib/orvenix-ai/evaluation/findings"
import { analyzeTreeGraph, collectContentEntries } from "@/lib/orvenix-ai/evaluation/tree-scan"
import type { EvaluationFindingV1 } from "@/lib/orvenix-ai/evaluation/types"

const LOREM_IPSUM_RE = /lorem\s+ipsum/i

const PLACEHOLDER_MARKER_RE =
  /\b(placeholder|todo|tbd|texto de ejemplo|contenido de ejemplo|sample text|your text here|coming soon|texto placeholder)\b/i

/** Minimum length for a string to be considered for duplicate-copy detection. */
const DUPLICATE_MIN_LENGTH = 20
/** Minimum number of occurrences across the plan to flag as excessive duplication. */
const DUPLICATE_MIN_OCCURRENCES = 3
const MAX_DUPLICATE_FINDINGS = 10

/**
 * Mechanical content checks only: empty strings, obvious placeholder or
 * lorem-ipsum markers, excessive verbatim duplication, and pages with no
 * heading-type node. Never judges persuasiveness or tone.
 */
export function evaluateContent(plan: SiteCreationPlanV2): EvaluationFindingV1[] {
  const findings: EvaluationFindingV1[] = []
  const normalizedCounts = new Map<string, number>()

  for (const page of plan.pages) {
    const { reachableNodes } = analyzeTreeGraph(page.tree)
    const entries = collectContentEntries(reachableNodes)

    const hasHeading = reachableNodes.some((node) => node.type.toLowerCase().includes("heading"))
    const hasAnyContent = entries.some((entry) => entry.value.trim().length > 0)

    if (hasAnyContent && !hasHeading) {
      findings.push(
        createFinding({
          code: FINDING_CODES.CONTENT_PAGE_NO_HEADING,
          severity: "info",
          dimension: "content",
          message: `La pagina "${page.slug}" no tiene ningun nodo de encabezado.`,
          pageSlug: page.slug,
        }),
      )
    }

    for (const entry of entries) {
      const trimmed = entry.value.trim()

      if (trimmed.length === 0) {
        findings.push(
          createFinding({
            code: FINDING_CODES.CONTENT_EMPTY_TEXT,
            severity: "warning",
            dimension: "content",
            message: `La pagina "${page.slug}" tiene un campo de texto vacio.`,
            pageSlug: page.slug,
            nodeId: entry.nodeId,
          }),
        )
        continue
      }

      if (LOREM_IPSUM_RE.test(trimmed)) {
        findings.push(
          createFinding({
            code: FINDING_CODES.CONTENT_LOREM_IPSUM,
            severity: "error",
            dimension: "content",
            message: `La pagina "${page.slug}" tiene texto lorem ipsum sin reemplazar.`,
            pageSlug: page.slug,
            nodeId: entry.nodeId,
          }),
        )
      } else if (PLACEHOLDER_MARKER_RE.test(trimmed)) {
        findings.push(
          createFinding({
            code: FINDING_CODES.CONTENT_PLACEHOLDER_MARKER,
            severity: "error",
            dimension: "content",
            message: `La pagina "${page.slug}" tiene un marcador de placeholder sin reemplazar.`,
            pageSlug: page.slug,
            nodeId: entry.nodeId,
          }),
        )
      }

      if (trimmed.length >= DUPLICATE_MIN_LENGTH) {
        const normalized = trimmed.toLowerCase().replace(/\s+/g, " ")
        normalizedCounts.set(normalized, (normalizedCounts.get(normalized) ?? 0) + 1)
      }
    }
  }

  let duplicateFindings = 0
  for (const count of normalizedCounts.values()) {
    if (count < DUPLICATE_MIN_OCCURRENCES) continue
    if (duplicateFindings >= MAX_DUPLICATE_FINDINGS) break
    duplicateFindings += 1

    findings.push(
      createFinding({
        code: FINDING_CODES.CONTENT_DUPLICATE_TEXT,
        severity: "warning",
        dimension: "content",
        message: `El plan repite el mismo texto ${count} veces en distintos nodos.`,
      }),
    )
  }

  return findings
}
