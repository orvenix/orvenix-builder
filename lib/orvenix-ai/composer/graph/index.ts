import type { ComposedSection, SectionCompositionContext } from "../types"
import { buildGraphGroundingV1, compileGraphSectionV1 } from "./compiler"
import type { GraphContinuityV1, GraphDiagnosticV1, GraphSectionV1 } from "./contract"
import { validateGraphSectionV1, type GraphSectionPositionV1 } from "./validator"

export * from "./contract"
export { canonicalGraphJsonV1, graphFingerprintV1 } from "./fingerprint"
export { packGraphRowsV1, validateGraphPageV1, validateGraphSectionV1, type GraphSectionPositionV1, type GraphSectionValidationV1 } from "./validator"
export { buildGraphGroundingV1, compileGraphSectionV1, resolveGraphCardTreatmentV1, surfaceRelationForContinuityV1 } from "./compiler"
export { graphPresetForMerchandisingV1, type GraphPresetInputV1 } from "./presets"

/**
 * CF-2: the ONE entry point for composing a section from a graph. Validates
 * against Orvenix grounding (and the section's page position), then
 * compiles. Never throws and never partially interprets: an invalid graph
 * returns `ok: false` with structured diagnostics, and the CALLER composes
 * THAT section through the V1 path (recording the reason).
 */
export type GraphComposeResultV1 =
  | { ok: true; section: ComposedSection; graph: GraphSectionV1; fingerprint: string }
  | { ok: false; reason: GraphDiagnosticV1["code"]; diagnostics: GraphDiagnosticV1[] }

export function composeSectionFromGraphV1(params: {
  graph: unknown
  context: SectionCompositionContext
  position?: GraphSectionPositionV1
  previousContinuity?: GraphContinuityV1
  detailHrefByProductIndex?: ReadonlyMap<number, string>
  preset?: string
  /** The plan section's role: a graph may only compile a section of its own role. */
  expectedRole?: string
}): GraphComposeResultV1 {
  const validation = validateGraphSectionV1(params.graph, buildGraphGroundingV1(params.context), params.position)
  if (validation.ok === false) return { ok: false, reason: validation.diagnostics[0]?.code ?? "not_object", diagnostics: validation.diagnostics }
  if (params.expectedRole !== undefined && validation.graph.role !== params.expectedRole) {
    return { ok: false, reason: "role_not_allowed", diagnostics: [{ path: "$.role", code: "role_not_allowed", message: `graph role ${validation.graph.role} does not match section role ${params.expectedRole}` }] }
  }
  const section = compileGraphSectionV1({
    graph: validation.graph,
    fingerprint: validation.fingerprint,
    context: params.context,
    ...(params.previousContinuity ? { previousContinuity: params.previousContinuity } : {}),
    ...(params.detailHrefByProductIndex ? { detailHrefByProductIndex: params.detailHrefByProductIndex } : {}),
    ...(params.preset ? { preset: params.preset } : {}),
  })
  return { ok: true, section, graph: validation.graph, fingerprint: validation.fingerprint }
}
