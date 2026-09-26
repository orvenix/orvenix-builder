import type { SectionRole } from "./block-selector"

/**
 * V2-6 Adaptive Architecture MVP: bounded, provider-neutral architecture
 * grammar.
 *
 * This module is ONLY vocabulary + shapes -- no context-dependent logic, no
 * hashing, no business-signal reading. `architecture-selector.ts` is where
 * an `ArchitectureStrategy` actually gets resolved from real inputs.
 *
 * Every dimension here is a small closed enum, sourced from the V2-6A/V2-6
 * legacy-corpus audits (32+51 candidate site audit) -- never invented ad
 * hoc, never a place for a new page template. `SectionRole` (the existing
 * block-selector.ts vocabulary) remains the ONLY unit these dimensions
 * ultimately compose into; this file adds no new section roles.
 */

export const OPENING_STRATEGIES = [
  "standard",
  "split",
  "immersive",
  "carousel",
  "editorial",
  "minimal",
] as const
export type OpeningStrategy = (typeof OPENING_STRATEGIES)[number]

export const NARRATIVE_STRATEGIES = [
  "authority-led",
  "service-led",
  "product-led",
  "portfolio-led",
  "donation-led",
  "event-led",
  "editorial-led",
] as const
export type NarrativeStrategy = (typeof NARRATIVE_STRATEGIES)[number]

export const BODY_TOPOLOGIES = [
  "linear",
  "alternating",
  "catalog",
  "showcase",
  "clustered",
] as const
export type BodyTopology = (typeof BODY_TOPOLOGIES)[number]

export const CLOSING_STRATEGIES = [
  "contact",
  "booking",
  "catalog",
  "pricing",
  "donation",
  "download",
] as const
export type ClosingStrategy = (typeof CLOSING_STRATEGIES)[number]

/**
 * Positional, not a rendered treatment: WHERE (or whether) the existing
 * "trust" SectionRole appears relative to the page's core offering role.
 * "omitted" is a real, legacy-evidenced pattern (eg. a pure catalog-cascade
 * ecommerce home with no about/trust section at all) -- never a bug.
 */
export const TRUST_PLACEMENTS = ["early", "embedded", "late", "omitted"] as const
export type TrustPlacement = (typeof TRUST_PLACEMENTS)[number]

/**
 * Bounded, PII-free evidence flags -- structurally identical to (and meant
 * to be trivially constructed from) BusinessEvidenceSummaryV1 in
 * site-creation/evidence-normalization.ts. Defined locally, the same
 * decoupling pattern already used by creative-director/contract.ts's
 * CreativeDirectorBusinessEvidenceSummaryV1, so the architect module never
 * depends on the site-creation module. Never raw testimonials/names.
 */
export interface ArchitectureEvidenceSignals {
  hasPeople: boolean
  hasTestimonials: boolean
  hasContactDetails: boolean
}

/**
 * The bounded, non-fabricating facts a candidate/constraint check is
 * allowed to ground on. Everything here is a count/boolean/enum derived
 * from real structured input -- never raw free text, never a name/slug.
 */
export interface ArchitectureGroundingSignals {
  siteType: string
  hasServices: boolean
  hasProducts: boolean
  pricingSignal: boolean
  evidence?: ArchitectureEvidenceSignals
}

/**
 * Why a dimension landed on its resolved value. Every `detail` is a fixed,
 * developer-authored phrase describing which SIGNAL fired -- never raw
 * prompt text, never literal business/customer data. This is what makes an
 * ArchitectureStrategy diagnostically explainable rather than "hash bucket
 * 3 selected catalog."
 */
export type ArchitectureReasonKind =
  | "semantic-signal"
  | "reference-contribution"
  | "fallback-default"
  | "stable-tie-break"

export interface ArchitectureDimensionReason {
  kind: ArchitectureReasonKind
  detail: string
}

export type ArchitectureDimension = "opening" | "narrative" | "bodyTopology" | "closing" | "trustPlacement"

/**
 * A bounded contribution a single retrieved DesignReference can make to
 * ONE dimension. `signal` is a fixed extraction-signal label (eg. the
 * reference's own ExtractionSignal vocabulary), never literal copy.
 */
export interface ArchitectureReferenceSignal {
  referenceId: string
  dimension: ArchitectureDimension
  value: OpeningStrategy | NarrativeStrategy | BodyTopology | ClosingStrategy | TrustPlacement
  signal: string
}

/** Recorded provenance for a dimension that a reference actually won. */
export interface ArchitectureReferenceContribution {
  dimension: ArchitectureDimension
  referenceId: string
  signal: string
}

export interface ArchitectureStrategy {
  version: 1
  opening: OpeningStrategy
  narrative: NarrativeStrategy
  bodyTopology: BodyTopology
  closing: ClosingStrategy
  trustPlacement: TrustPlacement
  reasons: Record<ArchitectureDimension, ArchitectureDimensionReason>
  /** At most 2 dimensions per referenceId -- enforced by the selector, not just documented here. */
  referenceContributions: ArchitectureReferenceContribution[]
}

/**
 * Bounded role-constraint model. Pure shape -- `architecture-selector.ts`
 * builds one of these per resolved strategy+grounding, and
 * `site-architect.ts` is the only place that actually assembles a
 * SectionRole[] against it. Nothing here fabricates content: a role that
 * would otherwise be "required" by a strategy but fails its grounding gate
 * is simply not required (see `requiredRoles` -- already grounding-filtered
 * by the time a constraints object exists).
 */
export interface ArchitectureRoleConstraints {
  requiredRoles: SectionRole[]
  optionalRoles: SectionRole[]
  forbiddenRoles: SectionRole[]
  /** Each pair means the first role, if present, must come before the second. */
  ordering: Array<[SectionRole, SectionRole]>
  maxOccurrences: Partial<Record<SectionRole, number>>
}

export const DEFAULT_MAX_OCCURRENCES: Partial<Record<SectionRole, number>> = {
  hero: 1,
  pricing: 1,
  contact: 1,
  navigation: 1,
  footer: 1,
}

export const BASE_ORDERING: Array<[SectionRole, SectionRole]> = [
  ["navigation", "footer"],
]
