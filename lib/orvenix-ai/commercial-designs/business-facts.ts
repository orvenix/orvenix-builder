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

export type BusinessFactsAssetInputV1 = { src?: unknown; alt?: unknown; sameProjectId?: unknown }
export type BusinessFactsProjectInputV1 = {
  id?: unknown
  title?: unknown
  summary?: unknown
  category?: unknown
  location?: unknown
  status?: unknown
  year?: unknown
  description?: unknown
  assets?: unknown
  progressAssets?: unknown
  progressSequence?: unknown
}

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
  projects?: unknown
  assets?: {
    logo?: BusinessFactsAssetInputV1
    hero?: BusinessFactsAssetInputV1
    serviceImages?: unknown
    heroProject?: BusinessFactsAssetInputV1
    featuredProject?: unknown
    projectProgress?: unknown
    specialtyService?: BusinessFactsAssetInputV1
    companyProof?: unknown
    projectGallery?: unknown
  }
}

/**
 * CSC-1C: `sameProjectId` groups assets that document the SAME project
 * (progress sequences, project galleries). It only ever comes from curated
 * intake data -- never derived from filenames, folders, EXIF/GPS or dates.
 */
export type BusinessFactAssetV1 = { src: string; alt: string; sameProjectId?: string }
export type SocialNetworkV1 = "facebook" | "instagram" | "tiktok" | "youtube" | "linkedin"
export const BUSINESS_PROJECT_STATUSES_V1 = ["planned", "in-progress", "completed", "documented"] as const
export type BusinessProjectStatusV1 = (typeof BUSINESS_PROJECT_STATUSES_V1)[number]

/**
 * CSC-1C: a generic, intake-only project-evidence fact (construction,
 * remodeling, architecture, landscaping, pools...). Every field except
 * id/title is optional and is rendered ONLY when supplied. Nothing here is
 * ever inferred from image metadata, filenames or folder names.
 *
 * `progressAssets` are documented stages of the SAME project -- never a
 * before/after pair. They are presented as chronological stages only when
 * the intake explicitly declares `progressSequence: "chronological"`.
 */
export interface BusinessProjectFactV1 {
  id: string
  title: string
  summary?: string
  category?: string
  location?: string
  status?: BusinessProjectStatusV1
  /** Four-digit year, only when supplied. */
  year?: string
  description?: string
  assets: BusinessFactAssetV1[]
  progressAssets: BusinessFactAssetV1[]
  progressSequence?: "chronological"
}

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
  projects: BusinessProjectFactV1[]
  assets: {
    logo?: BusinessFactAssetV1
    hero?: BusinessFactAssetV1
    serviceImages: BusinessFactAssetV1[]
    heroProject?: BusinessFactAssetV1
    featuredProject: BusinessFactAssetV1[]
    projectProgress: BusinessFactAssetV1[]
    specialtyService?: BusinessFactAssetV1
    companyProof: BusinessFactAssetV1[]
    projectGallery: BusinessFactAssetV1[]
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

/** Lowercase slug id (a-z0-9-), or undefined. */
function cleanSlugId(value: unknown): string | undefined {
  const text = cleanText(value, 64)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
  return text || undefined
}

/**
 * CSC-1C: Orvenix-owned, metadata-stripped demo derivatives live under this
 * static prefix. ONLY a demo facts pack may reference it -- a customer's
 * facts never can, so a customer compile can never pick up demo imagery.
 */
export const COMMERCIAL_DEMO_ASSET_PREFIX_V1 = "/commercial-demo/"
const DEMO_ASSET_RE = /^\/commercial-demo\/[a-z0-9-]+\/[a-z0-9-]+\.webp$/

/** Only an https URL or an Orvenix upload path is a usable asset/link (never javascript:/data:). */
export function safeFactUrlV1(value: unknown, options: { allowUploads: boolean; allowDemoAssets?: boolean }): string | undefined {
  if (typeof value !== "string") return undefined
  const url = value.trim()
  if (!url || url.length > 2048) return undefined
  if (options.allowUploads && /^\/uploads\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|gif|avif)$/i.test(url)) return url
  if (options.allowDemoAssets && DEMO_ASSET_RE.test(url)) return url
  if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url
  return undefined
}

function normalizeAsset(value: unknown, fallbackAlt: string, kind: BusinessFactsKindV1, defaultProjectId?: string): BusinessFactAssetV1 | undefined {
  if (!value || typeof value !== "object") return undefined
  const input = value as BusinessFactsAssetInputV1
  const src = safeFactUrlV1(input.src, { allowUploads: true, allowDemoAssets: kind === "demo" })
  if (!src) return undefined
  const sameProjectId = cleanSlugId(input.sameProjectId) ?? defaultProjectId
  return { src, alt: cleanText(input.alt, 140) ?? fallbackAlt, ...(sameProjectId ? { sameProjectId } : {}) }
}

function normalizeAssetList(value: unknown, fallbackAlt: string, kind: BusinessFactsKindV1, maxItems: number, defaultProjectId?: string): BusinessFactAssetV1[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry, index) => normalizeAsset(entry, `${fallbackAlt} ${index + 1}`, kind, defaultProjectId))
    .filter((entry): entry is BusinessFactAssetV1 => Boolean(entry))
    .slice(0, maxItems)
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

  const projects: BusinessProjectFactV1[] = []
  const projectIds = new Set<string>()
  for (const [index, entry] of (Array.isArray(source.projects) ? source.projects : []).entries()) {
    if (projects.length >= 8) break
    if (!entry || typeof entry !== "object") continue
    const record = entry as BusinessFactsProjectInputV1
    const title = cleanText(record.title, 120)
    if (!title) continue
    let id = cleanSlugId(record.id) ?? `proyecto-${index + 1}`
    if (projectIds.has(id)) id = `${id}-${index + 1}`
    projectIds.add(id)
    const status = cleanText(record.status, 40)
    const summary = cleanText(record.summary, 260)
    const category = cleanText(record.category, 80)
    const location = cleanText(record.location, 80)
    const year = typeof record.year === "number" ? String(record.year) : cleanText(record.year, 4)
    const description = cleanText(record.description, 600)
    const progressAssets = normalizeAssetList(record.progressAssets, `${title} — avance de obra`, kind, 8, id)
    projects.push({
      id,
      title,
      ...(summary ? { summary } : {}),
      ...(category ? { category } : {}),
      ...(location ? { location } : {}),
      ...(status && (BUSINESS_PROJECT_STATUSES_V1 as readonly string[]).includes(status) ? { status: status as BusinessProjectStatusV1 } : {}),
      ...(year && /^(?:19|20)\d{2}$/.test(year) ? { year } : {}),
      ...(description ? { description } : {}),
      assets: normalizeAssetList(record.assets, title, kind, 8, id),
      progressAssets,
      ...(record.progressSequence === "chronological" && progressAssets.length > 1 ? { progressSequence: "chronological" as const } : {}),
    })
  }

  const assetsSource = source.assets && typeof source.assets === "object" ? source.assets : {}
  const serviceImages = (Array.isArray(assetsSource.serviceImages) ? assetsSource.serviceImages : [])
    .map((entry, index) => normalizeAsset(entry, `${businessName} — trabajo ${index + 1}`, kind))
    .filter((entry): entry is BusinessFactAssetV1 => Boolean(entry))
    .slice(0, 6)
  const logo = normalizeAsset(assetsSource.logo, businessName!, kind)
  const hero = normalizeAsset(assetsSource.hero, businessName!, kind)
  // CSC-1C: generic project-evidence asset roles (see contract.ts COMMERCIAL_ASSET_ROLES_V1).
  const heroProject = normalizeAsset(assetsSource.heroProject, `${businessName} — proyecto`, kind)
  const featuredProject = normalizeAssetList(assetsSource.featuredProject, `${businessName} — proyecto destacado`, kind, 6)
  const projectProgress = normalizeAssetList(assetsSource.projectProgress, `${businessName} — avance de obra`, kind, 8)
  const specialtyService = normalizeAsset(assetsSource.specialtyService, `${businessName} — servicio especializado`, kind)
  const companyProof = normalizeAssetList(assetsSource.companyProof, `${businessName} — trabajo en obra`, kind, 6)
  const projectGallery = normalizeAssetList(assetsSource.projectGallery, `${businessName} — galería`, kind, 10)

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
      projects,
      assets: {
        ...(logo ? { logo } : {}),
        ...(hero ? { hero } : {}),
        serviceImages,
        ...(heroProject ? { heroProject } : {}),
        featuredProject,
        projectProgress,
        ...(specialtyService ? { specialtyService } : {}),
        companyProof,
        projectGallery,
      },
    },
  }
}
