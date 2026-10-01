import type { ComposedSection, SectionCompositionContext } from "../types"
import { buildGraphGroundingV1, compileGraphSectionV1 } from "./compiler"
import type { GraphContinuityV1, GraphDiagnosticV1, GraphSectionV1 } from "./contract"
import { graphFingerprintV1 } from "./fingerprint"
import { normalizeGraphForPositionV1, validateGraphSectionV1, type GraphNormalizationCodeV1, type GraphSectionPositionV1 } from "./validator"

export * from "./contract"
export { canonicalGraphJsonV1, graphFingerprintV1 } from "./fingerprint"
export { normalizeGraphForPositionV1, packGraphRowsV1, validateGraphPageV1, validateGraphSectionV1, type GraphNormalizationCodeV1, type GraphSectionPositionV1, type GraphSectionValidationV1 } from "./validator"
export { buildGraphGroundingV1, compileGraphSectionV1, resolveGraphCardTreatmentV1, surfaceRelationForContinuityV1 } from "./compiler"
export { graphPresetForMerchandisingV1, type GraphPresetInputV1 } from "./presets"

/**
 * CF-2: the ONE entry point for composing a section from a graph. Validates
 * against Orvenix grounding (and the section's page position), then
 * compiles. Never throws and never partially interprets: an invalid graph
 * returns `ok: false` with structured diagnostics, and the CALLER composes
 * THAT section through the V1 path (recording the reason).
 */
/**
 * CF-3D: `fingerprint` is ALWAYS the effective graph Orvenix built (for an
 * unnormalized graph that is exactly the provider's graph, as before).
 * When a normalization applied, `providerFingerprint` keeps the authored
 * intent so later stages can distinguish intent from what was built.
 */
export type GraphComposeResultV1 =
  | { ok: true; section: ComposedSection; graph: GraphSectionV1; fingerprint: string; providerFingerprint?: string; normalizations: GraphNormalizationCodeV1[] }
  | { ok: false; reason: GraphDiagnosticV1["code"]; diagnostics: GraphDiagnosticV1[]; normalizations: GraphNormalizationCodeV1[] }

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
  const { graph: effective, normalizations } = normalizeGraphForPositionV1(params.graph, params.position)
  const validation = validateGraphSectionV1(effective, buildGraphGroundingV1(params.context), params.position)
  if (validation.ok === false) return { ok: false, reason: validation.diagnostics[0]?.code ?? "not_object", diagnostics: validation.diagnostics, normalizations }
  if (params.expectedRole !== undefined && validation.graph.role !== params.expectedRole) {
    return { ok: false, reason: "role_not_allowed", diagnostics: [{ path: "$.role", code: "role_not_allowed", message: `graph role ${validation.graph.role} does not match section role ${params.expectedRole}` }], normalizations }
  }
  // The authored graph differs from the effective one only by the dropped no-effect field, so it fingerprints cleanly.
  const providerFingerprint = normalizations.length ? graphFingerprintV1(params.graph as GraphSectionV1) : undefined
  const section = compileGraphSectionV1({
    graph: validation.graph,
    fingerprint: validation.fingerprint,
    ...(providerFingerprint ? { providerFingerprint, normalizations } : {}),
    context: params.context,
    ...(params.previousContinuity ? { previousContinuity: params.previousContinuity } : {}),
    ...(params.detailHrefByProductIndex ? { detailHrefByProductIndex: params.detailHrefByProductIndex } : {}),
    ...(params.preset ? { preset: params.preset } : {}),
  })
  return { ok: true, section, graph: validation.graph, fingerprint: validation.fingerprint, ...(providerFingerprint ? { providerFingerprint } : {}), normalizations }
}
