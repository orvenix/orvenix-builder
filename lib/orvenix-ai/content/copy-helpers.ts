/**
 * V2-S3: small, pure, dependency-free copy helpers shared between
 * composer/semantic-copy.ts (V2-S2/V2-S2.1) and content/hero-narrative.ts
 * (V2-S3). Extracted here rather than imported cross-layer in either
 * direction: composer already depends on content (section-composer.ts
 * imports getPageAwareHeroCopy from content-engine.ts), so both the
 * composer's semantic-copy layer and content's hero-narrative layer import
 * from this shared, framework-agnostic home instead of one importing from
 * the other's module.
 *
 * No JSX, no EditorTree, no network, no DB, no randomness -- same
 * constraints as every other pure module in lib/orvenix-ai.
 */

export type Offering = { name: string; description?: string }

export function cleanText(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function offeringNames(offerings?: Offering[]): string[] {
  return (offerings ?? [])
    .map((offering) => offering.name?.trim())
    .filter((name): name is string => Boolean(name))
}

export type CtaIntent = "appointment" | "quote" | "contact"

/**
 * V2-S2.1: a real business writes "cita"/"cotización"/etc as its own
 * complete word ("Conseguir citas de valoración"), never buried inside an
 * unrelated word -- but Spanish has real words that contain these as a
 * raw substring (eg. "explícita" contains "cita"; "solicitud" does not,
 * but the historical inferSiteType bug ["identidad" contains "dent"] is
 * exactly this class of mistake). `\bword\b` requires a real word
 * boundary on both sides, so "explícita" (normalized "explicita") is
 * never mistaken for "cita".
 */
function containsWord(normalizedText: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(normalizedText)
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

const APPOINTMENT_INTENT_WORDS = [
  "cita",
  "citas",
  "consulta",
  "consultas",
  "valoracion",
  "valoraciones",
  "reservacion",
  "reservaciones",
  "reserva",
  "reservas",
  "agendar",
]

const QUOTE_INTENT_WORDS = [
  "cotizacion",
  "cotizaciones",
  "cotizar",
  "presupuesto",
  "presupuestos",
  "propuesta",
  "propuestas",
]

/**
 * V2-S2.1: bounded, deterministic, word-boundary-safe classification of
 * the business's OWN explicit objective text into one of 3 intents.
 * Deliberately small: this is not a general intent classifier, it only
 * recognizes the two intents whose real-world visitor action differs from
 * a generic "contact us" (appointment vs. quote) -- anything that doesn't
 * clearly match one of those falls to "contact", the safest, most generic
 * action, never a guess at an unsupported capability. Originally CTA-only
 * (V2-S2.1); V2-S3 reuses it unchanged for Hero narrative framing too,
 * which is why it lives here instead of composer/semantic-copy.ts.
 */
export function classifyCtaIntent(objective: string): CtaIntent {
  const normalized = normalizeForMatch(objective)
  if (APPOINTMENT_INTENT_WORDS.some((word) => containsWord(normalized, word))) return "appointment"
  if (QUOTE_INTENT_WORDS.some((word) => containsWord(normalized, word))) return "quote"
  return "contact"
}
