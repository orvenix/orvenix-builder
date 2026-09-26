import type { SectionRole } from "./block-selector"
import {
  BASE_ORDERING,
  DEFAULT_MAX_OCCURRENCES,
  type ArchitectureDimension,
  type ArchitectureDimensionReason,
  type ArchitectureEvidenceSignals,
  type ArchitectureGroundingSignals,
  type ArchitectureReasonKind,
  type ArchitectureReferenceContribution,
  type ArchitectureReferenceSignal,
  type ArchitectureRoleConstraints,
  type ArchitectureStrategy,
  type BodyTopology,
  type ClosingStrategy,
  type NarrativeStrategy,
  type OpeningStrategy,
  type TrustPlacement,
} from "./architecture-grammar"

/**
 * V2-6 Adaptive Architecture MVP: semantic, deterministic architecture
 * selection.
 *
 * NON-NEGOTIABLE PIPELINE (see also architecture-grammar-v2-6.test.ts):
 *
 *   business facts + objective + real offerings + evidence + page purpose
 *   + visual family + retrieved design-reference grammar
 *     -> derive SEMANTICALLY VALID candidates (candidateFns below --
 *        a candidate only exists in the list at all when its grounding
 *        gate is satisfied; there is no "everything is a candidate, hash
 *        picks one" step anywhere in this file)
 *     -> apply semantic/reference weights
 *     -> filter incompatible cross-dimension candidates
 *     -> stable deterministic tie-break (pickWeighted, below -- the SAME
 *        expand-pool-by-weight + stableHash-modulo approach already used
 *        by composer/variant-selector.ts, reimplemented locally so this
 *        module has zero dependency on composer/*)
 *     -> ArchitectureStrategy
 *
 * stableHash here NEVER decides an otherwise-invalid or otherwise-ungrounded
 * value into existence -- it only breaks ties among candidates that already
 * passed semantic validity. Business name and slug are never read anywhere
 * in this file.
 */

function stableHash(source: string): number {
  let hash = 0
  for (let index = 0; index < source.length; index++) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }
  return hash
}

function normalize(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

function hasWholeWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(text)
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => hasWholeWord(text, keyword))
}

const DONATION_KEYWORDS = ["donacion", "donaciones", "donativo", "donativos", "ong", "causa", "voluntariado", "voluntarios", "nonprofit", "fundacion"]
const EVENT_KEYWORDS = ["clases", "clase", "evento", "eventos", "taller", "talleres", "actividad", "actividades", "horario", "agenda", "calendario", "curso", "cursos"]
const EDITORIAL_KEYWORDS = ["blog", "revista", "noticias", "magazine", "editorial", "publicacion", "articulos"]
const APP_KEYWORDS = ["app", "aplicacion", "descarga", "descargar", "download", "software"]

/**
 * Bounded selection input. Deliberately excludes business name/slug, raw
 * PII, raw testimonials/customer identities -- only counts/booleans/
 * bounded-vocab tokens and the SAME normalized text fields
 * (industry/description/objective) that site-architect.ts's own
 * classificationText already treats as legitimate factual signal.
 */
export interface ArchitectureSelectionContext {
  siteType: string
  industry?: string
  description?: string
  objective?: string
  audience?: string
  visualFamily?: string
  services?: Array<{ name: string }>
  products?: Array<{ name: string }>
  pricingSignal: boolean
  evidence?: ArchitectureEvidenceSignals
  pagePurpose?: string
  references?: ArchitectureReferenceSignal[]
}

interface Candidate<V> {
  value: V
  weight: number
  reasonKind: Extract<ArchitectureReasonKind, "semantic-signal" | "stable-tie-break">
  reasonDetail: string
  /** set only after a reference boost is applied */
  boostedBy?: { referenceId: string; signal: string }
}

function classificationText(context: ArchitectureSelectionContext): string {
  return normalize([context.industry, context.description, context.objective].filter(Boolean).join(" "))
}

function narrativeCandidates(context: ArchitectureSelectionContext): Candidate<NarrativeStrategy>[] {
  const text = classificationText(context)
  const hasServices = Boolean(context.services?.length)
  const hasProducts = Boolean(context.products?.length)

  const candidates: Candidate<NarrativeStrategy>[] = [
    { value: "authority-led", weight: 2, reasonKind: "stable-tie-break", reasonDetail: "generic authority-led default" },
    { value: "service-led", weight: hasServices ? 4 : 1, reasonKind: hasServices ? "semantic-signal" : "stable-tie-break", reasonDetail: hasServices ? "real services present" : "generic service-led default" },
  ]

  if (hasProducts || context.siteType === "ecommerce" || context.siteType === "restaurant") {
    candidates.push({
      value: "product-led",
      weight: context.siteType === "ecommerce" || context.siteType === "restaurant" ? 6 : 3,
      reasonKind: "semantic-signal",
      reasonDetail: hasProducts ? "real products present" : "site type inherently offering-led",
    })
  }

  if (context.visualFamily === "creative") {
    candidates.push({ value: "portfolio-led", weight: 5, reasonKind: "semantic-signal", reasonDetail: "creative visual family" })
  }

  if (matchesAny(text, DONATION_KEYWORDS)) {
    candidates.push({ value: "donation-led", weight: 20, reasonKind: "semantic-signal", reasonDetail: "donation/nonprofit language in business facts" })
  }

  if (matchesAny(text, EVENT_KEYWORDS)) {
    candidates.push({ value: "event-led", weight: 16, reasonKind: "semantic-signal", reasonDetail: "class/event/schedule language in business facts" })
  }

  if (matchesAny(text, EDITORIAL_KEYWORDS)) {
    candidates.push({ value: "editorial-led", weight: 16, reasonKind: "semantic-signal", reasonDetail: "publisher/content language in business facts" })
  }

  return candidates
}

function bodyTopologyCandidates(context: ArchitectureSelectionContext, narrative: NarrativeStrategy): Candidate<BodyTopology>[] {
  const hasServices = Boolean(context.services?.length)
  const hasProducts = Boolean(context.products?.length)
  const factCount = (context.services?.length ?? 0) + (context.products?.length ?? 0)

  const candidates: Candidate<BodyTopology>[] = [
    { value: "linear", weight: 2, reasonKind: "stable-tie-break", reasonDetail: "generic linear default" },
  ]

  if (hasServices) candidates.push({ value: "alternating", weight: 3, reasonKind: "semantic-signal", reasonDetail: "real services support an alternating rhythm" })

  if (hasProducts || context.siteType === "ecommerce" || context.siteType === "restaurant") {
    candidates.push({
      value: "catalog",
      weight: context.siteType === "ecommerce" ? 8 : context.siteType === "restaurant" ? 6 : 3,
      reasonKind: "semantic-signal",
      reasonDetail: "real products/menu items support a catalog topology",
    })
  }

  if (context.visualFamily === "creative" || context.visualFamily === "hospitality") {
    candidates.push({ value: "showcase", weight: 5, reasonKind: "semantic-signal", reasonDetail: "creative/hospitality visual family favors a showcase topology" })
  }

  if (factCount >= 3) candidates.push({ value: "clustered", weight: 2, reasonKind: "semantic-signal", reasonDetail: "enough real offering facts to cluster" })

  /* filter incompatible candidates: a portfolio narrative is never a product catalog */
  return narrative === "portfolio-led" ? candidates.filter((candidate) => candidate.value !== "catalog") : candidates
}

function openingCandidates(context: ArchitectureSelectionContext, narrative: NarrativeStrategy): Candidate<OpeningStrategy>[] {
  const candidates: Candidate<OpeningStrategy>[] = [
    { value: "standard", weight: 2, reasonKind: "stable-tie-break", reasonDetail: "generic standard opening default" },
    { value: "split", weight: context.visualFamily === "professional" || context.visualFamily === "creative" ? 3 : 1, reasonKind: "stable-tie-break", reasonDetail: "generic split opening option" },
    { value: "immersive", weight: context.visualFamily === "hospitality" ? 5 : 2, reasonKind: context.visualFamily === "hospitality" ? "semantic-signal" : "stable-tie-break", reasonDetail: context.visualFamily === "hospitality" ? "hospitality visual family favors immersive imagery" : "generic immersive opening option" },
    { value: "minimal", weight: context.siteType === "ecommerce" ? 4 : 1, reasonKind: context.siteType === "ecommerce" ? "semantic-signal" : "stable-tie-break", reasonDetail: context.siteType === "ecommerce" ? "product-forward ecommerce opening" : "generic minimal opening option" },
    { value: "carousel", weight: context.visualFamily === "commerce" || context.visualFamily === "hospitality" ? 4 : 1, reasonKind: context.visualFamily === "commerce" || context.visualFamily === "hospitality" ? "semantic-signal" : "stable-tie-break", reasonDetail: "corpus-evidenced carousel opening for this visual family" },
  ]

  /* editorial opening is only semantically valid alongside an editorial-led narrative */
  if (narrative === "editorial-led") {
    candidates.push({ value: "editorial", weight: 20, reasonKind: "semantic-signal", reasonDetail: "editorial-led narrative" })
  }

  return candidates
}

function closingCandidates(context: ArchitectureSelectionContext, narrative: NarrativeStrategy): Candidate<ClosingStrategy>[] {
  const text = classificationText(context)
  const candidates: Candidate<ClosingStrategy>[] = [
    { value: "contact", weight: 2, reasonKind: "stable-tie-break", reasonDetail: "generic contact close default" },
  ]

  if (context.visualFamily === "health" || context.visualFamily === "hospitality" || context.siteType === "health" || context.siteType === "restaurant") {
    candidates.push({ value: "booking", weight: 5, reasonKind: "semantic-signal", reasonDetail: "appointment/reservation-oriented business" })
  }

  if (context.products?.length || context.siteType === "ecommerce") {
    candidates.push({ value: "catalog", weight: context.siteType === "ecommerce" ? 8 : 3, reasonKind: "semantic-signal", reasonDetail: "real products support closing back to the catalog" })
  }

  /*
   * GROUNDING GATE: pricing is only ever a candidate when a real pricing
   * signal exists AND the site is not health/restaurant/ecommerce -- the
   * same "being this siteType is never sufficient by itself" invariant
   * hasPricingSignal's own callers already enforce in site-architect.ts
   * (a clinic or menu page must never get a pricing section, even with an
   * incidental "planes"/"paquetes" mention in the business text).
   */
  if (context.pricingSignal && context.siteType !== "health" && context.siteType !== "restaurant" && context.siteType !== "ecommerce") {
    candidates.push({ value: "pricing", weight: 6, reasonKind: "semantic-signal", reasonDetail: "pricing signal present" })
  }

  if (narrative === "donation-led") {
    candidates.push({ value: "donation", weight: 20, reasonKind: "semantic-signal", reasonDetail: "donation-led narrative" })
  }

  if (narrative === "product-led" && matchesAny(text, APP_KEYWORDS)) {
    candidates.push({ value: "download", weight: 10, reasonKind: "semantic-signal", reasonDetail: "product-led narrative with app/software language" })
  }

  return candidates
}

function trustPlacementCandidates(
  context: ArchitectureSelectionContext,
  narrative: NarrativeStrategy,
  bodyTopology: BodyTopology,
): Candidate<TrustPlacement>[] {
  const hasEvidence = Boolean(context.evidence?.hasTestimonials || context.evidence?.hasPeople)
  const candidates: Candidate<TrustPlacement>[] = [
    { value: "embedded", weight: 3, reasonKind: "stable-tie-break", reasonDetail: "generic embedded trust default" },
  ]

  if (hasEvidence || context.siteType === "health" || context.visualFamily === "health") {
    candidates.push({ value: "early", weight: 5, reasonKind: "semantic-signal", reasonDetail: hasEvidence ? "real trust evidence present" : "credibility-first business type" })
  }

  if (narrative === "portfolio-led" || narrative === "product-led") {
    candidates.push({ value: "late", weight: 4, reasonKind: "semantic-signal", reasonDetail: "let the work/offering speak before trust" })
  }

  if (bodyTopology === "catalog" && !hasEvidence && context.siteType === "ecommerce") {
    candidates.push({ value: "omitted", weight: 6, reasonKind: "semantic-signal", reasonDetail: "pure catalog topology with no grounded trust evidence" })
  }

  return candidates
}

function pickWeighted<V>(candidates: Candidate<V>[], hashSource: string): Candidate<V> {
  const pool: Candidate<V>[] = []
  for (const candidate of candidates) {
    const weight = Math.max(1, Math.round(candidate.weight))
    for (let i = 0; i < weight; i += 1) pool.push(candidate)
  }
  const hash = stableHash(hashSource)
  return pool[hash % pool.length]
}

function dimensionHashSource(dimension: ArchitectureDimension, context: ArchitectureSelectionContext): string {
  /*
   * Deliberately excludes business name/slug/description/raw evidence/
   * literal service+product names -- the same "semantic facts only, never
   * identity" philosophy as composer/variant-selector.ts's own
   * hashSource. Two businesses that differ ONLY by name/slug always hash
   * identically here; two that differ in real facts (which candidates
   * even exist, via the *Candidates() functions above) can diverge even
   * with an identical hash number, because the POOL differs.
   */
  return [dimension, context.siteType, context.industry, context.objective, context.audience, context.visualFamily, context.pagePurpose]
    .filter(Boolean)
    .join("|")
}

function applyReferenceBoosts<V extends string>(
  dimension: ArchitectureDimension,
  candidates: Candidate<V>[],
  references: ArchitectureReferenceSignal[] | undefined,
  referenceUsage: Map<string, number>,
): Candidate<V>[] {
  if (!references?.length) return candidates
  const relevant = references.filter((reference) => reference.dimension === dimension)
  if (!relevant.length) return candidates

  return candidates.map((candidate) => {
    const proposal = relevant.find(
      (reference) => reference.value === candidate.value && (referenceUsage.get(reference.referenceId) ?? 0) < 2,
    )
    if (!proposal) return candidate
    return {
      ...candidate,
      weight: candidate.weight + 15,
      boostedBy: { referenceId: proposal.referenceId, signal: proposal.signal },
    }
  })
}

export function resolveArchitectureStrategy(context: ArchitectureSelectionContext): ArchitectureStrategy {
  const referenceUsage = new Map<string, number>()
  const contributions: ArchitectureReferenceContribution[] = []
  const reasons = {} as Record<ArchitectureDimension, ArchitectureDimensionReason>

  function resolve<V extends string>(dimension: ArchitectureDimension, rawCandidates: Candidate<V>[]): V {
    const boosted = applyReferenceBoosts(dimension, rawCandidates, context.references, referenceUsage)
    const winner = pickWeighted(boosted, dimensionHashSource(dimension, context))

    if (winner.boostedBy) {
      contributions.push({ dimension, referenceId: winner.boostedBy.referenceId, signal: winner.boostedBy.signal })
      referenceUsage.set(winner.boostedBy.referenceId, (referenceUsage.get(winner.boostedBy.referenceId) ?? 0) + 1)
      reasons[dimension] = { kind: "reference-contribution", detail: `reference contributed via signal "${winner.boostedBy.signal}"` }
    } else if (rawCandidates.length === 1) {
      reasons[dimension] = { kind: "fallback-default", detail: winner.reasonDetail }
    } else {
      reasons[dimension] = { kind: winner.reasonKind, detail: winner.reasonDetail }
    }

    return winner.value
  }

  const narrative = resolve("narrative", narrativeCandidates(context))
  const bodyTopology = resolve("bodyTopology", bodyTopologyCandidates(context, narrative))
  const opening = resolve("opening", openingCandidates(context, narrative))
  const closing = resolve("closing", closingCandidates(context, narrative))
  const trustPlacement = resolve("trustPlacement", trustPlacementCandidates(context, narrative, bodyTopology))

  return {
    version: 1,
    opening,
    narrative,
    bodyTopology,
    closing,
    trustPlacement,
    reasons,
    referenceContributions: contributions,
  }
}

/**
 * Grounding-aware role constraints for a resolved strategy. Pure/context-
 * free beyond `grounding` -- never fabricates: a role that would otherwise
 * be preferred by the strategy but fails its grounding gate is simply
 * absent from `requiredRoles`/`optionalRoles` (or explicitly forbidden),
 * never force-added anyway.
 */
export function buildRoleConstraints(
  strategy: ArchitectureStrategy,
  grounding: ArchitectureGroundingSignals,
): ArchitectureRoleConstraints {
  const required: SectionRole[] = ["navigation", "footer", "cta"]
  const optional: SectionRole[] = ["features", "gallery", "process", "faq", "content"]
  const forbidden: SectionRole[] = []
  const ordering: Array<[SectionRole, SectionRole]> = [...BASE_ORDERING, ["navigation", "cta"]]

  if (strategy.opening === "editorial") forbidden.push("hero")
  else required.push("hero")

  switch (strategy.narrative) {
    case "product-led":
      required.push(grounding.hasProducts || grounding.siteType === "restaurant" || grounding.siteType === "ecommerce" ? "products" : "services")
      break
    case "portfolio-led":
      required.push("gallery")
      optional.push("services")
      break
    case "editorial-led":
      required.push("content")
      optional.push("services")
      break
    default:
      /*
       * Matches the pre-V2-6 baseline exactly: every non-product/
       * portfolio/editorial narrative's Home page is fundamentally
       * services-led REGARDLESS of whether a `services` array happens to
       * be populated -- composeSection("services", ...) already renders
       * safe, non-fabricated generic content when there is none, the
       * same way it always has. Gating role PRESENCE on array emptiness
       * here would silently drop the whole offering section for any
       * business that described itself only in free text.
       */
      required.push("services")
  }

  const pricingEligible =
    grounding.pricingSignal && grounding.siteType !== "health" && grounding.siteType !== "restaurant" && grounding.siteType !== "ecommerce"
  if (pricingEligible) optional.push("pricing")
  else forbidden.push("pricing")

  if (grounding.evidence && !grounding.evidence.hasTestimonials) forbidden.push("testimonials")
  else optional.push("testimonials")

  if (strategy.trustPlacement === "omitted") forbidden.push("trust")
  else optional.push("trust")

  if (strategy.closing === "pricing" && pricingEligible) required.push("pricing")
  if (strategy.closing === "catalog" && (grounding.hasProducts || grounding.siteType === "ecommerce")) required.push("products")
  if (["contact", "booking", "donation"].includes(strategy.closing)) required.push("contact")

  const dedupedOptional = Array.from(new Set(optional)).filter((role) => !forbidden.includes(role) && !required.includes(role))

  return {
    requiredRoles: Array.from(new Set(required)),
    optionalRoles: dedupedOptional,
    forbiddenRoles: Array.from(new Set(forbidden)),
    ordering,
    maxOccurrences: DEFAULT_MAX_OCCURRENCES,
  }
}

/**
 * Verifies an assembled role sequence actually respects its own
 * constraints (required present, forbidden absent, ordering pairs
 * respected, occurrence caps respected). site-architect.ts calls this
 * before returning a strategy-derived sequence and falls back to a safe
 * baseline if it ever fails -- the concrete, testable answer to "invalid
 * strategy combination -> normalized/fallback safe result".
 */
export function validateRoleSequence(roles: SectionRole[], constraints: ArchitectureRoleConstraints): boolean {
  for (const required of constraints.requiredRoles) if (!roles.includes(required)) return false
  for (const forbidden of constraints.forbiddenRoles) if (roles.includes(forbidden)) return false
  for (const [before, after] of constraints.ordering) {
    const beforeIndex = roles.indexOf(before)
    const afterIndex = roles.indexOf(after)
    if (beforeIndex !== -1 && afterIndex !== -1 && beforeIndex > afterIndex) return false
  }
  const counts = new Map<SectionRole, number>()
  for (const role of roles) counts.set(role, (counts.get(role) ?? 0) + 1)
  for (const [role, max] of Object.entries(constraints.maxOccurrences) as Array<[SectionRole, number]>) {
    if ((counts.get(role) ?? 0) > max) return false
  }
  return true
}
