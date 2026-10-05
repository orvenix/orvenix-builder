import { REAL_TEMPLATES, type RealTemplate } from "@/lib/realTemplates"
import { getCommercialTemplateStart } from "@/lib/commercial/template-start"

/**
 * SALES-1: the commercial vocabulary shared by the marketing funnel
 * (landing, catalog, pricing, dashboard).
 *
 * Express / Profesional / Signature are DESIGN COLLECTIONS -- catalog
 * metadata on RealTemplate.commercialCollection. They are deliberately not
 * coupled to billing plans: nothing here reads plans or entitlements.
 */

export type CommercialCollectionId = NonNullable<RealTemplate["commercialCollection"]>

export interface CommercialCollectionInfo {
  id: CommercialCollectionId
  tagline: string
  description: string
}

export const COMMERCIAL_COLLECTIONS: readonly CommercialCollectionInfo[] = [
  {
    id: "Express",
    tagline: "Sal a vender rápido",
    description: "Sitios claros y directos para negocios que necesitan presencia y contacto inmediato, con pocas páginas y foco en WhatsApp.",
  },
  {
    id: "Profesional",
    tagline: "Confianza para servicios profesionales",
    description: "Sitios de varias páginas para despachos, clínicas y servicios que necesitan explicar lo que hacen y transmitir credibilidad.",
  },
  {
    id: "Signature",
    tagline: "Presencia visual de mayor impacto",
    description: "Diseños con composición más editorial y protagonismo de fotografía, para marcas que quieren destacar.",
  },
]

export interface CommercialCatalogEntry {
  id: string
  name: string
  category: string
  description: string
  collection: CommercialCollectionId | null
  demoHref: string
  startHref: string
  preview: string
  accent: string
}

/** The sellable Orvenix designs: catalog entries backed by a CommercialDesign. */
export function listCommercialCatalog(templates: readonly RealTemplate[] = REAL_TEMPLATES): CommercialCatalogEntry[] {
  return templates.flatMap((template) => {
    const start = getCommercialTemplateStart(template)
    if (!start) return []
    return [{
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      collection: template.commercialCollection ?? null,
      demoHref: template.livePath,
      startHref: start.href,
      preview: template.preview,
      accent: template.accent,
    }]
  })
}

const START_HREF_RE = /^\/templates\/([a-z0-9-]{1,64})\/comenzar$/

/**
 * A "continue with this design" target is only ever the start page of a
 * sellable Orvenix design -- never an arbitrary URL (no open redirect).
 */
export function parseDesignStartTarget(value: unknown, templates: readonly RealTemplate[] = REAL_TEMPLATES): { templateId: string; name: string; href: string } | null {
  if (typeof value !== "string") return null
  const match = START_HREF_RE.exec(value.trim())
  if (!match) return null
  const entry = listCommercialCatalog(templates).find((item) => item.id === match[1])
  return entry ? { templateId: entry.id, name: entry.name, href: entry.startHref } : null
}

/**
 * SALES-2: the chosen design also travels as `?design=<id>` through pricing,
 * sign-up and the checkout return, so the dashboard can resume it server-side
 * without relying on browser storage. Only a sellable design id is accepted.
 */
export const DESIGN_INTENT_PARAM = "design"

export function parseDesignIntentId(value: unknown, templates: readonly RealTemplate[] = REAL_TEMPLATES): { templateId: string; name: string; href: string } | null {
  if (typeof value !== "string" || !/^[a-z0-9-]{1,64}$/.test(value)) return null
  return parseDesignStartTarget(`/templates/${value}/comenzar`, templates)
}

/** The design intent of a request: `?design=<id>` or a design start page as `callbackUrl`. */
export function readDesignIntent(params: { design?: unknown; callbackUrl?: unknown }, templates: readonly RealTemplate[] = REAL_TEMPLATES) {
  return parseDesignIntentId(params.design, templates) ?? parseDesignStartTarget(params.callbackUrl, templates)
}

/** Appends a validated design intent to an internal path (unchanged when there is none). */
export function withDesignIntent(path: string, designId: string | null | undefined): string {
  if (!designId || !parseDesignIntentId(designId)) return path
  return `${path}${path.includes("?") ? "&" : "?"}${DESIGN_INTENT_PARAM}=${encodeURIComponent(designId)}`
}

/** Browser-only memory of the design a visitor chose before buying a plan (UI convenience, not data). */
export const PENDING_DESIGN_STORAGE_KEY = "orvenix:pending-design"
const PENDING_DESIGN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

export function serializePendingDesign(target: { templateId: string; href: string }, now = Date.now()): string {
  return JSON.stringify({ templateId: target.templateId, href: target.href, savedAt: now })
}

export function parsePendingDesign(raw: string | null, now = Date.now(), templates: readonly RealTemplate[] = REAL_TEMPLATES): { templateId: string; name: string; href: string } | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { href?: unknown; savedAt?: unknown }
    if (typeof parsed.savedAt !== "number" || now - parsed.savedAt > PENDING_DESIGN_MAX_AGE_MS || parsed.savedAt > now + 60_000) return null
    return parseDesignStartTarget(parsed.href, templates)
  } catch {
    return null
  }
}

/** Plan feature labels that promise Orvenix IA, which is not part of Commercial V1 yet. */
export function isOrvenixAiFeatureLabel(label: string): boolean {
  return /\b(IA|AI)\b|inteligencia artificial/i.test(label)
}

export const ORVENIX_AI_COMING_SOON_LABEL = "Orvenix IA — Próximamente"
