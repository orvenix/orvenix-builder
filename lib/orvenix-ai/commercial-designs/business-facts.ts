import {
  normalizeSiteCreationBusinessEvidence,
  type NormalizedSiteCreationBusinessEvidenceV1,
} from "@/lib/orvenix-ai/site-creation/evidence-normalization"

/**
 * CSC-1B: BusinessFactsV1 -- the authoritative, intake-only facts a
 * commercial design compiles from. It EXTENDS the existing normalized
 * business evidence (contact/people/testimonials go through the SAME
 * normalizeSiteCreationBusinessEvidence boundary) with the few extra
 * facts commercial designs need. It is never populated by AI.
 *
 * `kind` separates real customer facts from the clearly-labelled demo
 * pack used only by showcases/dev review/tests; a customer compile
 * refuses demo facts and vice versa (see compile.ts).
 */

export type BusinessFactsKindV1 = "customer" | "demo"

export type BusinessFactsAssetInputV1 = { src?: unknown; alt?: unknown }

export type BusinessFactsInputV1 = {
  businessName?: unknown
  tagline?: unknown
  description?: unknown
  location?: unknown
  contact?: { whatsapp?: unknown; phone?: unknown; email?: unknown }
  address?: unknown
  hours?: unknown
  serviceArea?: unknown
  services?: unknown
  social?: unknown
  faq?: unknown
  testimonials?: unknown
  people?: unknown
  assets?: { logo?: BusinessFactsAssetInputV1; hero?: BusinessFactsAssetInputV1; serviceImages?: unknown }
}

export type BusinessFactAssetV1 = { src: string; alt: string }
export type SocialNetworkV1 = "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin"

export interface BusinessFactsV1 {
  kind: BusinessFactsKindV1
  businessName: string
  tagline?: string
  description?: string
  location?: string
  /** contact/people/testimonials -- the existing normalized evidence shape, unchanged. */
  evidence: NormalizedSiteCreationBusinessEvidenceV1
  address?: string
  hours?: string
  serviceArea: string[]
  services: Array<{ name: string; description?: string; priceLabel?: string }>
  social: Array<{ network: SocialNetworkV1; url: string }>
  faq: Array<{ question: string; answer: string }>
  assets: {
    logo?: BusinessFactAssetV1
    hero?: BusinessFactAssetV1
    serviceImages: BusinessFactAssetV1[]
  }
}

export type BusinessFactsNormalizationV1 =
  | { ok: true; facts: BusinessFactsV1 }
  | { ok: false; errors: Array<"missing_business_name" | "missing_contact_channel"> }

const SOCIAL_NETWORKS: SocialNetworkV1[] = ["facebook", "instagram", "tiktok", "youtube", "linkedin"]

function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  // Plain text only: markup characters are dropped, whitespace collapsed.
  const text = value.replace(/[<>{}`]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength)
  return text || undefined
}

/** Only an https URL or an Orvenix upload path is a usable asset/link (never javascript:/data:). */
export function safeFactUrlV1(value: unknown, options: { allowUploads: boolean }): string | undefined {
  if (typeof value !== "string") return undefined
  const url = value.trim()
  if (!url || url.length > 2048) return undefined
  if (options.allowUploads && /^\/uploads\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(url)) return url
  if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url
  return undefined
}

function normalizeAsset(value: unknown, fallbackAlt: string): BusinessFactAssetV1 | undefined {
  if (!value || typeof value !== "object") return undefined
  const input = value as BusinessFactsAssetInputV1
  const src = safeFactUrlV1(input.src, { allowUploads: true })
  if (!src) return undefined
  return { src, alt: cleanText(input.alt, 140) ?? fallbackAlt }
}

function textList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of value) {
    const text = cleanText(entry, maxLength)
    if (!text || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    out.push(text)
    if (out.length >= maxItems) break
  }
  return out
}

/** wa.me needs the country code: a bare 10-digit MX number gets "52" (Orvenix serves Mexico). */
function whatsappDigits(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.length === 10 ? `52${value}` : value
}

export function normalizeBusinessFactsV1(input: BusinessFactsInputV1 | null | undefined, kind: BusinessFactsKindV1 = "customer"): BusinessFactsNormalizationV1 {
  const source = input && typeof input === "object" ? input : {}
  const businessName = cleanText(source.businessName, 120)
  const evidence = normalizeSiteCreationBusinessEvidence({
    contact: source.contact as { whatsapp?: string; phone?: string; email?: string } | undefined,
    people: source.people as Array<{ name?: string; role?: string }> | undefined,
    testimonials: source.testimonials as Array<{ quote?: string; author?: string; role?: string }> | undefined,
  }) ?? {}
  const whatsapp = whatsappDigits(evidence.contact?.whatsapp)
  const contact = evidence.contact
    ? { ...evidence.contact, ...(whatsapp ? { whatsapp } : {}) }
    : undefined
  const normalizedEvidence: NormalizedSiteCreationBusinessEvidenceV1 = { ...evidence, ...(contact ? { contact } : {}) }

  const errors: Array<"missing_business_name" | "missing_contact_channel"> = []
  if (!businessName) errors.push("missing_business_name")
  if (!contact?.whatsapp && !contact?.phone && !contact?.email) errors.push("missing_contact_channel")
  if (errors.length) return { ok: false, errors }

  const services = (Array.isArray(source.services) ? source.services : [])
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const record = entry as Record<string, unknown>
      const name = cleanText(record.name, 80)
      if (!name) return null
      const description = cleanText(record.description, 280)
      const priceLabel = cleanText(record.priceLabel, 40)
      return { name, ...(description ? { description } : {}), ...(priceLabel ? { priceLabel } : {}) }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .slice(0, 12)

  const socialSource = source.social && typeof source.social === "object" && !Array.isArray(source.social) ? (source.social as Record<string, unknown>) : {}
  const social = SOCIAL_NETWORKS.flatMap((network) => {
    const url = safeFactUrlV1(socialSource[network], { allowUploads: false })
    return url ? [{ network, url }] : []
  })

  const faq = (Array.isArray(source.faq) ? source.faq : [])
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const record = entry as Record<string, unknown>
      const question = cleanText(record.question, 160)
      const answer = cleanText(record.answer, 600)
      return question && answer ? { question, answer } : null
    })
    .filter((entry): entry is { question: string; answer: string } => Boolean(entry))
    .slice(0, 8)

  const assetsSource = source.assets && typeof source.assets === "object" ? source.assets : {}
  const serviceImages = (Array.isArray(assetsSource.serviceImages) ? assetsSource.serviceImages : [])
    .map((entry, index) => normalizeAsset(entry, `${businessName} — trabajo ${index + 1}`))
    .filter((entry): entry is BusinessFactAssetV1 => Boolean(entry))
    .slice(0, 6)
  const logo = normalizeAsset(assetsSource.logo, businessName!)
  const hero = normalizeAsset(assetsSource.hero, businessName!)

  const tagline = cleanText(source.tagline, 90)
  const description = cleanText(source.description, 400)
  const location = cleanText(source.location, 80)
  const address = cleanText(source.address, 200)
  const hours = cleanText(source.hours, 120)

  return {
    ok: true,
    facts: {
      kind,
      businessName: businessName!,
      ...(tagline ? { tagline } : {}),
      ...(description ? { description } : {}),
      ...(location ? { location } : {}),
      evidence: normalizedEvidence,
      ...(address ? { address } : {}),
      ...(hours ? { hours } : {}),
      serviceArea: textList(source.serviceArea, 12, 60),
      services,
      social,
      faq,
      assets: { ...(logo ? { logo } : {}), ...(hero ? { hero } : {}), serviceImages },
    },
  }
}
