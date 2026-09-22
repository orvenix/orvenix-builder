/**
 * Deterministic, best-effort extraction of a business's offered
 * services/products from freeform Spanish prose (eg. the "Descripcion
 * del negocio" textarea in the Site Creation dialog). This is
 * intentionally NOT a general NLP parser -- it recognizes a bounded set
 * of common Spanish patterns (a lead-in verb like "ofrecemos"/
 * "disenamos"/"brindamos" followed by a comma-and-"y" list, or a short
 * label header like "Servicios:"/"Platillos:") and never invents
 * offerings that aren't textually present. When no such pattern is
 * found, it returns an empty list rather than guessing.
 *
 * This is the ONLY place in the codebase that infers structured
 * offerings from prose. Callers that already have explicit structured
 * services/products (eg. the Site Creation form's dedicated "Servicios
 * principales" rows) must not call this at all -- explicit input is
 * always authoritative.
 *
 * V2-S1: each result carries a `kind` ("service" | "product"),
 * determined ONLY by which lead-in phrase the business's OWN text used
 * -- never by siteType/industry/business-name guessing. A business that
 * writes "Platillos: ..." is self-evidently describing menu items
 * regardless of what industry it's classified as; a business that
 * writes "Ofrecemos ..." is self-evidently describing services. When a
 * lead-in doesn't clearly signal either, it defaults to "service" -- the
 * pre-existing, safest category (see V2-S1 Section 5's "preserve the
 * safest existing category" requirement).
 */

export type OfferingKind = "service" | "product"

export type InferredService = {
  name: string
  description?: string
  kind: OfferingKind
}

const MAX_INFERRED_SERVICES = 8

/*
 * Common Spanish verbs/phrases that introduce a list of offerings. Not
 * exhaustive by design (this is a heuristic, not a parser), but broad
 * enough to not depend on any single exact phrase. Each entry declares
 * the OfferingKind its own wording signals.
 */
const SERVICE_LEAD_INS: Array<{ phrase: string; kind: OfferingKind }> = [
  { phrase: "ofrecemos", kind: "service" },
  { phrase: "ofrece", kind: "service" },
  { phrase: "brindamos", kind: "service" },
  { phrase: "brinda", kind: "service" },
  { phrase: "proporcionamos", kind: "service" },
  { phrase: "proporciona", kind: "service" },
  { phrase: "realizamos", kind: "service" },
  { phrase: "realiza", kind: "service" },
  { phrase: "hacemos", kind: "service" },
  { phrase: "hace", kind: "service" },
  { phrase: "disenamos", kind: "service" },
  { phrase: "diseñamos", kind: "service" },
  { phrase: "disena", kind: "service" },
  { phrase: "diseña", kind: "service" },
  { phrase: "desarrollamos", kind: "service" },
  { phrase: "desarrolla", kind: "service" },
  { phrase: "fabricamos", kind: "service" },
  { phrase: "fabrica", kind: "service" },
  { phrase: "vendemos", kind: "service" },
  { phrase: "vende", kind: "service" },
  { phrase: "manejamos", kind: "service" },
  { phrase: "maneja", kind: "service" },
  { phrase: "trabajamos con", kind: "service" },
  { phrase: "trabaja con", kind: "service" },
  { phrase: "nos especializamos en", kind: "service" },
  { phrase: "se especializa en", kind: "service" },
  { phrase: "contamos con", kind: "service" },
  { phrase: "cuenta con", kind: "service" },
  { phrase: "incluye", kind: "service" },
  { phrase: "incluyen", kind: "service" },
  { phrase: "servicios de", kind: "service" },
  { phrase: "nuestros servicios incluyen", kind: "service" },
  { phrase: "nuestros servicios son", kind: "service" },
]

/*
 * Short label headers (eg. "Servicios: A, B y C", "Platillos: A, B y C")
 * -- a DIFFERENT structural pattern from a verb-led sentence: the label
 * must be the ENTIRE text before the colon (exact match after
 * normalization, not a substring/prefix check), which keeps this at
 * least as safe as the verb-lead-in pattern while covering a very common
 * real-world phrasing the verb list alone missed.
 */
const LABEL_LEAD_INS: Array<{ label: string; kind: OfferingKind }> = [
  { label: "servicios", kind: "service" },
  { label: "nuestros servicios", kind: "service" },
  { label: "especialidades", kind: "service" },
  { label: "productos", kind: "product" },
  { label: "nuestros productos", kind: "product" },
  { label: "menu", kind: "product" },
  { label: "nuestro menu", kind: "product" },
  { label: "platillos", kind: "product" },
]

/* Sorted longest-first so multi-word lead-ins are matched before a
 * shorter prefix of themselves (eg. "trabajamos con" before "trabajamos"
 * would matter if both existed; kept as a general safety net). */
const SORTED_LEAD_INS = [...SERVICE_LEAD_INS].sort((a, b) => b.phrase.length - a.phrase.length)

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

type LeadInMatch = { kind: OfferingKind; remainder: string }

/**
 * Label-header pattern: "Servicios: A, B y C" / "Platillos: A, B y C".
 * The pre-colon segment must EXACTLY equal a known label (after
 * normalization) -- not a prefix/substring check -- which keeps this
 * pattern precise even though the labels themselves are short.
 */
function matchLabelLeadIn(sentence: string): LeadInMatch | null {
  const colonIndex = sentence.indexOf(":")
  if (colonIndex === -1) return null

  const label = normalizeForCompare(sentence.slice(0, colonIndex))
  const match = LABEL_LEAD_INS.find((entry) => entry.label === label)
  if (!match) return null

  const remainder = sentence.slice(colonIndex + 1).trim()
  if (!remainder) return null

  return { kind: match.kind, remainder }
}

/**
 * Verb-led pattern: "Ofrecemos A, B y C." The lead-in must START the
 * sentence and be followed by a word boundary (a space), same word-
 * boundary discipline established for inferSiteType -- never a raw
 * substring match.
 */
function matchVerbLeadIn(sentence: string): LeadInMatch | null {
  const normalizedSentence = normalizeForCompare(sentence)

  const leadIn = SORTED_LEAD_INS.find((entry) =>
    normalizedSentence.startsWith(`${entry.phrase} `),
  )
  if (!leadIn) return null

  const remainder = sentence.slice(leadIn.phrase.length).trim()
  if (!remainder) return null

  return { kind: leadIn.kind, remainder }
}

/**
 * Extracts a structured, deduplicated, order-preserving list of
 * services/products from freeform text. Returns an empty array when no
 * offering-like enumeration is found -- callers must not treat that as
 * an error, just as "nothing to infer".
 */
export function inferServicesFromText(
  text: string | undefined | null,
  options: { location?: string } = {},
): InferredService[] {
  if (!text || !text.trim()) return []

  const results: InferredService[] = []
  const seen = new Set<string>()

  for (const sentence of splitSentences(text)) {
    const match = matchLabelLeadIn(sentence) ?? matchVerbLeadIn(sentence)
    if (!match) continue

    const rawItems = splitEnumeration(match.remainder)

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

      results.push({ name, kind: match.kind })
    })

    if (results.length >= MAX_INFERRED_SERVICES) break
  }

  return results.slice(0, MAX_INFERRED_SERVICES)
}
