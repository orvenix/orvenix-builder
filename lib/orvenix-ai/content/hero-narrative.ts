import { classifyCtaIntent, offeringNames, type CtaIntent, type Offering } from "./copy-helpers"

/**
 * V2-S3: family-grounded Hero fallback.
 *
 * getPageAwareHeroCopy (content-engine.ts) has real, crafted copy for
 * exactly 4 industry categories (dental/restaurant/agencia/tienda-store,
 * via business-language.ts's categorySingular checks) -- those stay
 * completely untouched, byte-for-byte; this module is never consulted for
 * them. Every OTHER real industry (confirmed by the V2-S3 audit:
 * physiotherapy, creative studios, professional/consulting services, and
 * by extension fitness/beauty/legal/education/etc.) previously fell to a
 * SINGLE universal sentence -- "${name}: una forma más clara de presentar
 * lo que haces" -- identical for any unmatched industry, differing only by
 * name substitution.
 *
 * This tier replaces that single sentence with copy grounded in real facts
 * already available on the SAME context object (a real offering,
 * businessObjective, location), and reuses VisualFamily -- already
 * resolved elsewhere in the pipeline (V2-1.1), never re-derived here -- as
 * a broad NARRATIVE MODE selector. This is deliberately NOT a new
 * industry-keyword dictionary: no new keyword classification is
 * introduced by this module at all.
 *
 * Deterministic, pure: no network, no DB, no randomness, no JSX. Facts
 * always outrank template variety (see resolveTailPhrase's precedence).
 */

const FAMILY_TAIL_PHRASES: Record<string, readonly [string, string]> = {
  health: ["un espacio para cuidar tu bienestar", "atención pensada para ti"],
  hospitality: ["una experiencia que se disfruta", "sabores pensados para compartir"],
  creative: ["ideas con propósito", "diseño con intención"],
  commerce: ["productos pensados para ti", "todo lo que buscas, en un solo lugar"],
  professional: ["soluciones claras para tu proyecto", "un aliado para tus próximos pasos"],
}

const DEFAULT_TAIL_PHRASES: readonly [string, string] = FAMILY_TAIL_PHRASES.professional

/**
 * Only "appointment" and "quote" get a distinct tail phrase -- "contact"
 * (the classifier's own safe, generic fallback intent) falls through to
 * the family/sparse pool below instead of a third hardcoded phrase, since
 * it has no more specific framing to offer than the family mode already
 * does.
 */
const INTENT_TAIL_PHRASE: Partial<Record<CtaIntent, string>> = {
  appointment: "conoce cómo agendar tu cita",
  quote: "hagamos realidad tu próximo proyecto",
}

/**
 * Same small, pure hash already used by composer/variant-selector.ts
 * (V2-3) for deterministic-but-varied selection. Duplicated locally
 * (4 lines) rather than imported: content/ must not depend on composer/
 * (the existing dependency direction is composer -> content, established
 * by section-composer.ts's own import of getPageAwareHeroCopy), and this
 * is a generic string-hash utility, not business logic, so the small
 * duplication carries no real drift risk.
 */
function stableHash(source: string): number {
  let hash = 0
  for (let index = 0; index < source.length; index++) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }
  return hash
}

export interface HeroFamilyNarrativeInput {
  name: string
  /** Pre-built by the caller via the SAME buildLocationPhrase content-engine.ts already uses for its other branches -- not recomputed here. */
  locationPhrase: string
  visualFamily?: string
  services?: Offering[]
  products?: Offering[]
  objective?: string
}

export interface HeroFamilyNarrative {
  title: string
  description: string
}

/**
 * Resolves the Hero tail phrase ("${name}: ${tail}") with an explicit,
 * deterministic precedence:
 *
 * 1. A real offering name -- bounded to exactly ONE, never the full list
 *    (that's the services/products role's own job; dumping every offering
 *    into the H1 would duplicate that section and violate the no-full-list
 *    rule).
 * 2. The business's own explicit objective, via the shared, S2.1-proven
 *    intent classifier -- reused unchanged, not reimplemented.
 * 3. A small, family-flavored, deterministically-selected pair of safe
 *    generic phrases, only when neither fact above exists.
 *
 * Real facts always outrank template variety.
 */
function resolveTailPhrase(input: HeroFamilyNarrativeInput): string {
  const primaryOffering = offeringNames(input.services)[0] ?? offeringNames(input.products)[0]
  if (primaryOffering) {
    return `${primaryOffering.toLowerCase()} y más`
  }

  const objective = input.objective?.trim()
  if (objective) {
    const intentPhrase = INTENT_TAIL_PHRASE[classifyCtaIntent(objective)]
    if (intentPhrase) return intentPhrase
  }

  const pool = FAMILY_TAIL_PHRASES[input.visualFamily ?? ""] ?? DEFAULT_TAIL_PHRASES
  const index = stableHash(input.name) % pool.length
  return pool[index]
}

/**
 * Resolves the Hero description. Explicit objective always wins, reusing
 * the exact "para {objective}" idiom already shipped and tested in this
 * same file's conversion-archetype sibling (conversionPageHeroCopy);
 * otherwise a safe sentence that always names the real business -- unlike
 * the old universal fallback's description, which never mentioned the
 * business name at all.
 */
function resolveDescription(input: HeroFamilyNarrativeInput): string {
  const objective = input.objective?.trim()
  if (objective) {
    return `${input.name}${input.locationPhrase} está aquí para ayudarte a ${objective.toLowerCase()}.`
  }
  return `Conoce más sobre ${input.name}${input.locationPhrase} y descubre cómo podemos ayudarte.`
}

export function resolveFamilyGroundedHeroCopy(input: HeroFamilyNarrativeInput): HeroFamilyNarrative {
  return {
    title: `${input.name}: ${resolveTailPhrase(input)}`,
    description: resolveDescription(input),
  }
}
