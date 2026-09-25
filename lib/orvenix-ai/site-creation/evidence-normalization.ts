/**
 * V2-5F Structured Business Evidence MVP.
 *
 * BUSINESS EVIDENCE IS REAL CALLER/USER-SUPPLIED CONTENT.
 * IT MUST NEVER BE POPULATED BY CREATIVE DIRECTOR OR AI INFERENCE.
 *
 * Provenance is implicit in this MVP because this module is the single
 * controlled intake boundary for evidence that may later appear in the
 * generated site.
 */

export type SiteCreationBusinessEvidenceInputV1 = {
  contact?: {
    whatsapp?: string
    phone?: string
    email?: string
  }
  people?: Array<{
    name?: string
    role?: string
  }>
  testimonials?: Array<{
    quote?: string
    author?: string
    role?: string
  }>
}

export type NormalizedSiteCreationBusinessEvidenceV1 = {
  contact?: {
    whatsapp?: string
    phone?: string
    email?: string
  }
  people?: Array<{
    name: string
    role?: string
  }>
  testimonials?: Array<{
    quote: string
    author: string
    role?: string
  }>
}

export type BusinessEvidenceSummaryV1 = {
  hasPeople: boolean
  peopleCount: number
  hasTestimonials: boolean
  testimonialCount: number
  hasWhatsapp: boolean
  hasContactDetails: boolean
}

const PHONE_ALLOWED_PATTERN = /^[0-9+\s().-]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function hasProtocolOrUrlSyntax(value: string) {
  return /:\/\/|www\.|wa\.me|[/?#]/i.test(value)
}

function normalizePhoneDigits(value: unknown) {
  const raw = cleanString(value, 80)
  if (!raw) return undefined
  if (/[a-z]/i.test(raw) || hasProtocolOrUrlSyntax(raw)) return undefined
  if (!PHONE_ALLOWED_PATTERN.test(raw)) return undefined

  const digits = raw.replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 15) return undefined
  return digits
}

function normalizeEmail(value: unknown) {
  const email = cleanString(value, 160).toLowerCase()
  if (!email || email.length > 160 || !EMAIL_PATTERN.test(email)) return undefined
  return email
}

function normalizePeople(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const seen = new Set<string>()
  const people: Array<{ name: string; role?: string }> = []

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    const name = cleanString(record.name, 60)
    if (!name || seen.has(name)) continue
    seen.add(name)

    const role = cleanString(record.role, 60)
    people.push({
      name,
      ...(role ? { role } : {}),
    })

    if (people.length >= 3) break
  }

  return people.length ? people : undefined
}

function normalizeTestimonials(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const seen = new Set<string>()
  const testimonials: Array<{ quote: string; author: string; role?: string }> = []

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    const quote = cleanString(record.quote, 280)
    const author = cleanString(record.author, 60)
    if (!quote || !author || seen.has(quote)) continue
    seen.add(quote)

    const role = cleanString(record.role, 60)
    testimonials.push({
      quote,
      author,
      ...(role ? { role } : {}),
    })

    if (testimonials.length >= 3) break
  }

  return testimonials.length ? testimonials : undefined
}

export function normalizeSiteCreationBusinessEvidence(
  input: SiteCreationBusinessEvidenceInputV1 | undefined,
): NormalizedSiteCreationBusinessEvidenceV1 | undefined {
  if (!input || typeof input !== "object") return undefined

  const whatsapp = normalizePhoneDigits(input.contact?.whatsapp)
  const phone = normalizePhoneDigits(input.contact?.phone)
  const email = normalizeEmail(input.contact?.email)
  const contact = whatsapp || phone || email
    ? {
        ...(whatsapp ? { whatsapp } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
      }
    : undefined

  const people = normalizePeople(input.people)
  const testimonials = normalizeTestimonials(input.testimonials)

  if (!contact && !people && !testimonials) return undefined

  return {
    ...(contact ? { contact } : {}),
    ...(people ? { people } : {}),
    ...(testimonials ? { testimonials } : {}),
  }
}

export function summarizeBusinessEvidence(
  evidence: NormalizedSiteCreationBusinessEvidenceV1 | undefined,
): BusinessEvidenceSummaryV1 | undefined {
  if (!evidence) return undefined

  const peopleCount = evidence.people?.length ?? 0
  const testimonialCount = evidence.testimonials?.length ?? 0
  const hasWhatsapp = Boolean(evidence.contact?.whatsapp)
  const hasContactDetails = Boolean(
    evidence.contact?.whatsapp ||
      evidence.contact?.phone ||
      evidence.contact?.email,
  )

  return {
    hasPeople: peopleCount > 0,
    peopleCount,
    hasTestimonials: testimonialCount > 0,
    testimonialCount,
    hasWhatsapp,
    hasContactDetails,
  }
}
