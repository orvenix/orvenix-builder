/**
 * CF-3A: conservative claim guard for provider-authored creative copy.
 *
 * Creative LANGUAGE is allowed ("Encuentra tu próxima pieza favorita.").
 * Factual CLAIMS are not, unless grounded: Orvenix has no authoritative
 * facts about shipping, delivery times, discounts, guarantees, ratings,
 * reviews, scarcity, rankings, certifications or customer counts, so any
 * slot that asserts one is rejected and falls back to Orvenix's own safe
 * copy for THAT slot only. Numbers are allowed only when the exact token
 * appears in authoritative facts (product names, variant labels, category
 * labels). This is deliberately a small closed rule set, not NLP: when in
 * doubt it rejects.
 */

export const CREATIVE_COPY_SLOTS_V1 = ["eyebrow", "headline", "intro"] as const
export type CreativeCopySlotV1 = (typeof CREATIVE_COPY_SLOTS_V1)[number]
export type CreativeCopyV1 = Partial<Record<CreativeCopySlotV1, string>>

export const CREATIVE_COPY_LIMITS_V1: Record<CreativeCopySlotV1, { min: number; max: number }> = {
  eyebrow: { min: 2, max: 40 },
  headline: { min: 3, max: 90 },
  intro: { min: 8, max: 220 },
}

export type CopyGuardCodeV1 =
  | "not_text"
  | "empty"
  | "too_long"
  | "markup"
  | "link"
  | "unsupported_number"
  | "price"
  | "percentage"
  | "discount"
  | "shipping"
  | "delivery_time"
  | "guarantee"
  | "rating"
  | "testimonial"
  | "scarcity"
  | "superlative"
  | "certification"
  | "statistic"

export type CopyGuardResultV1 = { ok: true; text: string } | { ok: false; code: CopyGuardCodeV1 }

const LETTERS = /\p{L}/u

/** Ordered: the first matching rule names the rejection. Accent-insensitive (input is folded). */
const CLAIM_RULES: ReadonlyArray<readonly [CopyGuardCodeV1, RegExp]> = [
  ["markup", /[<>{}`]|\bclass\s*=|\bstyle\s*=|javascript:/],
  ["link", /https?:\/\/|www\.|\.com\b|\.mx\b|@[a-z0-9-]+\./],
  ["price", /\$|\bmxn\b|\bpesos?\b|\busd\b|\bprecios? (bajos?|desde|especial|unico)/],
  ["percentage", /%|\bpor ?ciento\b|\bpercent\b/],
  ["discount", /\bdescuentos?\b|\brebajas?\b|\bofertas?\b|\bpromo(cion(es)?)?\b|\bliquidacion\b|\b\d+ ?x ?\d+\b|\bsale\b|\boff\b|\bgratis\b|\bfree\b|\bcupon(es)?\b|\bahorra\b/],
  ["shipping", /\benvios?\b|\bshipping\b|\bdelivery\b|\ba domicilio\b|\bdespacho\b|\bpaqueteria\b/],
  ["delivery_time", /\bentregas?\b|\b\d+ ?(h|hrs?|horas?|dias?|days?)\b|\bmismo dia\b|\bhoy mismo\b|\bexpress\b|\bal dia siguiente\b/],
  ["guarantee", /\bgarantia(s|do|da)?\b|\bgarantizad[oa]s?\b|\bguarantee\b|\bwarranty\b|\bdevoluci(on|ones)\b|\breembolso\b|\bsatisfaccion total\b/],
  ["rating", /\bestrellas?\b|\bstars?\b|\bresenas?\b|\breviews?\b|\bcalificaci(on|ones)\b|\brating\b|\bopiniones\b|\bvaloraci(on|ones)\b|★/],
  ["testimonial", /["“”«»]|\bdicen nuestros\b|\bnuestros clientes (dicen|opinan|aman)\b|\btestimonio/],
  ["scarcity", /\bultimas? (unidades|piezas)\b|\bpocas unidades\b|\bagotad[oa]s?\b|\bstock\b|\bexistencias\b|\bsolo hoy\b|\bpor tiempo limitado\b|\bedicion limitada\b|\bquedan\b|\bse acaba\b/],
  ["superlative", /\b(el|la|los|las) mejor(es)?\b|\bnumero 1\b|\bno\.? ?1\b|#1\b|\blider(es)?\b|\bel mas vendid|\bla mas vendid|\bmas vendid|\bbest ?sell|\bbest\b|\btop ?\d*\b|\bpremiad[oa]s?\b|\bpremio\b|\baward\b|\bunic[oa]s? en (mexico|el mundo)\b|\binigualable\b/],
  ["certification", /\bcertificad[oa]s?\b|\bcertified\b|\biso ?\d+|\boficial(es)?\b|\bautorizad[oa]s?\b|\baprobad[oa]s? por\b|\bavalad[oa]s?\b|\bdistribuidor autorizado\b/],
  ["statistic", /\b(miles|millones|cientos) de\b|\b(clientes|compradores|usuarios|pedidos) (satisfechos|felices)\b|\bmas de\b/],
]

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

/** Number tokens (12, 20 000, 7-en-1 -> "7", "1") as they appear. */
function numberTokens(text: string): string[] {
  return (text.match(/\d+(?:[ .,]\d{3})*(?:[.,]\d+)?/g) ?? []).map((token) => token.replace(/[ .,]/g, ""))
}

export type CopyGuardFactsV1 = {
  /** Authoritative strings numbers may be matched against (names, variant labels, categories). */
  groundedTexts: readonly string[]
}

export function groundedNumberSetV1(facts: CopyGuardFactsV1): ReadonlySet<string> {
  return new Set(facts.groundedTexts.flatMap(numberTokens))
}

export function guardCreativeCopySlotV1(slot: CreativeCopySlotV1, value: unknown, groundedNumbers: ReadonlySet<string>): CopyGuardResultV1 {
  if (typeof value !== "string") return { ok: false, code: "not_text" }
  const text = value.replace(/\s+/g, " ").trim()
  if (!text || !LETTERS.test(text) || text.replace(/[^\p{L}]/gu, "").length < CREATIVE_COPY_LIMITS_V1[slot].min) return { ok: false, code: "empty" }
  if (text.length > CREATIVE_COPY_LIMITS_V1[slot].max) return { ok: false, code: "too_long" }
  const folded = fold(text)
  for (const [code, pattern] of CLAIM_RULES) if (pattern.test(folded)) return { ok: false, code }
  // Remaining numbers must be grounded (eg. "Tablet Nova 10", "20 000 mAh").
  if (numberTokens(text).some((token) => !groundedNumbers.has(token))) return { ok: false, code: "unsupported_number" }
  return { ok: true, text }
}

export type CopyGuardReportV1 = {
  copy: CreativeCopyV1
  rejected: Array<{ slot: CreativeCopySlotV1; code: CopyGuardCodeV1 }>
}

/** Guards every slot independently: an unsafe slot falls back alone. */
export function guardCreativeCopyV1(copy: CreativeCopyV1 | undefined, facts: CopyGuardFactsV1): CopyGuardReportV1 {
  const groundedNumbers = groundedNumberSetV1(facts)
  const out: CreativeCopyV1 = {}
  const rejected: CopyGuardReportV1["rejected"] = []
  for (const slot of CREATIVE_COPY_SLOTS_V1) {
    if (copy?.[slot] === undefined) continue
    const result = guardCreativeCopySlotV1(slot, copy[slot], groundedNumbers)
    if (result.ok === true) out[slot] = result.text
    else rejected.push({ slot, code: result.code })
  }
  return { copy: out, rejected }
}
