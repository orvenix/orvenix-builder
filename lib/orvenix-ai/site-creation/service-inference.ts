/**
 * Deterministic, best-effort extraction of a business's offered services
 * from freeform Spanish prose (eg. the "Descripcion del negocio" textarea
 * in the Site Creation dialog). This is intentionally NOT a general NLP
 * parser -- it recognizes one common Spanish pattern (a lead-in verb like
 * "ofrecemos"/"disenamos"/"brindamos" followed by a comma-and-"y" list)
 * and never invents services that aren't textually present. When no such
 * pattern is found, it returns an empty list rather than guessing.
 *
 * This is the ONLY place in the codebase that infers structured services
 * from prose. Callers that already have explicit structured services
 * (eg. the Site Creation form's dedicated "Servicios principales" rows)
 * must not call this at all -- explicit input is always authoritative.
 */

export type InferredService = {
  name: string
  description?: string
}

const MAX_INFERRED_SERVICES = 8

/*
 * Common Spanish verbs/phrases that introduce a list of offerings. Not
 * exhaustive by design (this is a heuristic, not a parser), but broad
 * enough to not depend on any single exact phrase.
 */
const SERVICE_LEAD_INS = [
  "ofrecemos",
  "ofrece",
  "brindamos",
  "brinda",
  "proporcionamos",
  "proporciona",
  "realizamos",
  "realiza",
  "hacemos",
  "hace",
  "disenamos",
  "diseñamos",
  "disena",
  "diseña",
  "desarrollamos",
  "desarrolla",
  "fabricamos",
  "fabrica",
  "vendemos",
  "vende",
  "manejamos",
  "maneja",
  "trabajamos con",
  "trabaja con",
  "nos especializamos en",
  "se especializa en",
  "contamos con",
  "cuenta con",
  "incluye",
  "incluyen",
  "servicios de",
  "nuestros servicios incluyen",
  "nuestros servicios son",
]

/* Sorted longest-first so multi-word lead-ins are matched before a
 * shorter prefix of themselves (eg. "trabajamos con" before "trabajamos"
 * would matter if both existed; kept as a general safety net). */
const SORTED_LEAD_INS = [...SERVICE_LEAD_INS].sort((a, b) => b.length - a.length)

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

function normalizeForCompare(value: string): string {
  return stripDiacritics(value).toLowerCase().trim()
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

/*
 * Trims trailing modifier clauses that a naive comma/"y" split leaves
 * attached to the LAST enumerated item (eg. "...y terapia manual en
 * Monterrey" -> "terapia manual"; "...y sitios web para pequenas
 * empresas" -> "sitios web"). Two narrow, well-motivated rules:
 *   1. a trailing "en <location>" where <location> is the business's own
 *      already-known structured location (safe: we're not guessing what
 *      counts as a location, we already know it).
 *   2. a trailing "para ..." clause, which in this kind of sentence is
 *      overwhelmingly an audience/purpose modifier for the WHOLE
 *      enumeration, not part of the last item's name.
 * "en"/"de"/"con" are deliberately NOT trimmed generically beyond rule 1
 * -- they commonly appear INSIDE legitimate short service names (eg.
 * "servicio de limpieza", "atencion en sitio").
 */
function trimTrailingModifier(item: string, location?: string): string {
  let result = item.trim()

  if (location) {
    const normalizedLocation = normalizeForCompare(location)
    const normalizedResult = normalizeForCompare(result)
    const suffix = ` en ${normalizedLocation}`

    if (normalizedLocation && normalizedResult.endsWith(suffix)) {
      result = result.slice(0, result.length - suffix.length).trim()
    }
  }

  const paraMatch = result.match(/^(.*?)\s+para\s+.+$/i)
  if (paraMatch && paraMatch[1].trim()) {
    result = paraMatch[1].trim()
  }

  return result
}

function splitEnumeration(remainder: string): string[] {
  const cleaned = remainder.replace(/[.!?]+$/g, "").trim()
  if (!cleaned) return []

  /* Last standalone " y "/" e " (not immediately followed by another
   * comma-separated segment) is treated as the final conjunction joining
   * the last two items. */
  const conjunctionMatch = cleaned.match(/^(.*),?\s+(?:y|e)\s+([^,]+)$/i)

  let rawItems: string[]

  if (conjunctionMatch) {
    const head = conjunctionMatch[1]
    const last = conjunctionMatch[2]
    const headItems = head
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    rawItems = [...headItems, last.trim()]
  } else {
    rawItems = cleaned
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return rawItems.filter(Boolean)
}

/**
 * Extracts a structured, deduplicated, order-preserving list of services
 * from freeform text. Returns an empty array when no offering-like
 * enumeration is found -- callers must not treat that as an error, just
 * as "nothing to infer".
 */
export function inferServicesFromText(
  text: string | undefined | null,
  options: { location?: string } = {},
): InferredService[] {
  if (!text || !text.trim()) return []

  const results: InferredService[] = []
  const seen = new Set<string>()

  for (const sentence of splitSentences(text)) {
    const normalizedSentence = normalizeForCompare(sentence)

    const leadIn = SORTED_LEAD_INS.find((phrase) =>
      normalizedSentence.startsWith(`${phrase} `),
    )

    if (!leadIn) continue

    const remainder = sentence.slice(leadIn.length).trim()
    if (!remainder) continue

    const rawItems = splitEnumeration(remainder)

    rawItems.forEach((rawItem, index) => {
      const isLast = index === rawItems.length - 1
      const trimmed = isLast
        ? trimTrailingModifier(rawItem, options.location)
        : rawItem.trim()

      const name = trimmed.replace(/\s+/g, " ").trim()
      if (!name) return

      const key = normalizeForCompare(name)
      if (seen.has(key)) return
      seen.add(key)

      results.push({ name })
    })

    if (results.length >= MAX_INFERRED_SERVICES) break
  }

  return results.slice(0, MAX_INFERRED_SERVICES)
}
