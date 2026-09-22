import type { CreativeSiteDirectionV1, CreativeDirectorPageDirectionV1 } from "./contract"

/**
 * V2-4 section 6/8: the SEMANTIC safety layer, run only on a proposal that
 * has already passed contract.ts's SCHEMA validation. This layer can never
 * prove an arbitrary sentence is factually grounded -- it catches KNOWN
 * failure patterns (fabricated credentials/superlatives/numbers/unsupported
 * capability claims), reusing the exact FORBIDDEN_CLAIMS families already
 * built and tested across V2-S2/S2.1/S3. Mandatory human Preview/Confirm
 * remains the real backstop against subtler fabrication.
 *
 * "One bad field should not destroy valid independent guidance" (section
 * 8): sanitizeCreativeSiteDirectionV1 strips only the UNSAFE sub-fields
 * from each page direction, never drops an entire page direction or the
 * whole proposal for one bad field.
 */

const FORBIDDEN_CLAIM_PATTERNS: RegExp[] = [
  /somos (el|los) mejor(es)?\b/i,
  /\b(el mejor|los mejores|la mejor|las mejores)\s+(servicio|negocio|opci[oó]n|equipo|producto)/i,
  /\bl[ií]der(es)?\b/i,
  /a[ñn]os de experiencia/i,
  /\bcredencial/i,
  /certificaci|certificad/i,
  /garantiz/i,
  /resultados? garantizados?/i,
  /testimoni/i,
  /premiad/i,
  /\bpremio/i,
  /metodolog[ií]a propia/i,
  /\bprecio/i,
  /descuento/i,
  /env[ií]o gratis/i,
  /inventario/i,
  /disponibilidad/i,
  /en l[ií]nea ahora/i,
  /agenda en l[ií]nea/i,
  /reserva(r|ci[oó]n)? en l[ií]nea/i,
  /compra ahora/i,
  /especializad[oa]/i,
  /expert[oa]/i,
  /premium/i,
  /aut[eé]ntic[oa]/i,
  /n[uú]mero uno/i,
]

/** "10 años", "50 clientes", "3 premios", "50%", "$500" -- a number attached to a claim-shaped unit. */
const SUSPICIOUS_NUMBER_PATTERN = /\b\d+[+]?\s*(a[ñn]os?|client(es)?|proyectos?|premios?|estrellas?|%|usd|mxn)\b|\$\s?\d/i

const URL_OR_EMAIL_PATTERN = /https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

export function containsForbiddenClaim(text: string): boolean {
  return FORBIDDEN_CLAIM_PATTERNS.some((pattern) => pattern.test(text))
}

export function containsSuspiciousNumberClaim(text: string): boolean {
  return SUSPICIOUS_NUMBER_PATTERN.test(text)
}

export function containsUrlOrEmail(text: string): boolean {
  return URL_OR_EMAIL_PATTERN.test(text)
}

/** Free-text Hero copy safety sweep -- used for heroTitleSuggestion/heroDescriptionSuggestion. */
export function isSafeHeroCopyText(text: string): boolean {
  return !containsForbiddenClaim(text) && !containsSuspiciousNumberClaim(text) && !containsUrlOrEmail(text)
}

export function normalizeOfferingName(name: string): string {
  return normalizeForMatch(name).trim().replace(/\s+/g, " ")
}

export function isKnownOffering(name: string, realOfferingNames: readonly string[]): boolean {
  const normalized = normalizeOfferingName(name)
  return realOfferingNames.some((real) => normalizeOfferingName(real) === normalized)
}

export interface RealFactsV1 {
  offeringNames: readonly string[]
}

/**
 * Sanitizes ONE page direction against real facts + copy safety, returning
 * a new object with only the safe fields retained. Never throws, never
 * drops the whole page direction -- an unsafe heroTitleSuggestion doesn't
 * take highlightedOfferings or assetIntent down with it.
 */
export function sanitizeCreativeDirectorPageDirectionV1(
  direction: CreativeDirectorPageDirectionV1,
  facts: RealFactsV1,
): CreativeDirectorPageDirectionV1 {
  const sanitized: CreativeDirectorPageDirectionV1 = {
    slug: direction.slug,
    narrativeGoal: direction.narrativeGoal,
  }

  if (direction.heroDirection) {
    const preferredOfferingName = direction.heroDirection.preferredOfferingName
    const offeringOk = !preferredOfferingName || isKnownOffering(preferredOfferingName, facts.offeringNames)
    sanitized.heroDirection = offeringOk
      ? direction.heroDirection
      : { emphasis: direction.heroDirection.emphasis }
  }

  if (direction.heroTitleSuggestion && isSafeHeroCopyText(direction.heroTitleSuggestion)) {
    sanitized.heroTitleSuggestion = direction.heroTitleSuggestion
  }

  if (direction.heroDescriptionSuggestion && isSafeHeroCopyText(direction.heroDescriptionSuggestion)) {
    sanitized.heroDescriptionSuggestion = direction.heroDescriptionSuggestion
  }

  if (direction.preferredHeroVariant) {
    sanitized.preferredHeroVariant = direction.preferredHeroVariant
  }

  if (direction.highlightedOfferings) {
    const known = direction.highlightedOfferings.filter((name) => isKnownOffering(name, facts.offeringNames))
    if (known.length) sanitized.highlightedOfferings = known
  }

  if (direction.ctaIntent) {
    sanitized.ctaIntent = direction.ctaIntent
  }

  if (direction.assetIntent && !containsUrlOrEmail(direction.assetIntent.subject) && !containsUrlOrEmail(direction.assetIntent.mood ?? "")) {
    sanitized.assetIntent = direction.assetIntent
  }

  if (direction.preferredSectionOrder) {
    sanitized.preferredSectionOrder = direction.preferredSectionOrder
  }

  return sanitized
}

export function sanitizeCreativeSiteDirectionV1(
  proposal: CreativeSiteDirectionV1,
  factsByPageSlug: ReadonlyMap<string, RealFactsV1>,
): CreativeSiteDirectionV1 {
  return {
    ...proposal,
    pageDirections: proposal.pageDirections.map((direction) =>
      sanitizeCreativeDirectorPageDirectionV1(direction, factsByPageSlug.get(direction.slug) ?? { offeringNames: [] }),
    ),
  }
}
