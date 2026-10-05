import type {
  CommercialDesignSiteCreationActionInput,
  OrvenixSiteCreationActionResult,
  SiteCreationPreviewPageV1,
} from "@/app/actions/ai"
import {
  normalizeBusinessFactsV1,
  type BusinessFactsInputV1,
} from "@/lib/orvenix-ai/commercial-designs/business-facts"

/**
 * CV1-1: client-side glue for the commercial start form. It only shapes the
 * customer's own answers into the existing BusinessFactsInputV1 contract and
 * drives the existing createSiteFromCommercialDesignAction (preview, then a
 * confirmed execute). No second creation path, no demo facts, no AI.
 */

export interface CommercialStartFormValues {
  businessName: string
  whatsapp: string
  phone: string
  /** One service per line. */
  services: string
  location: string
  /** Comma or line separated. */
  serviceArea: string
}

export type CommercialStartField = keyof CommercialStartFormValues

export type CommercialStartFactsResult =
  | { ok: true; facts: BusinessFactsInputV1 }
  | { ok: false; errors: Partial<Record<CommercialStartField, string>> }

export const EMPTY_COMMERCIAL_START_FORM: CommercialStartFormValues = {
  businessName: "",
  whatsapp: "",
  phone: "",
  services: "",
  location: "",
  serviceArea: "",
}

// Demo-shape designs compose at most 6 main services (COMMERCIAL_FIDELITY_MAX_SERVICES_V1;
// not imported to keep the composer out of the client bundle -- a test pins the equality).
export const COMMERCIAL_START_MAX_SERVICES = 6
const MAX_SERVICE_AREAS = 12

function uniqueList(raw: string, separator: RegExp, maxItems: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of raw.split(separator)) {
    const text = entry.trim()
    if (!text || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    out.push(text)
    if (out.length >= maxItems) break
  }
  return out
}

/**
 * Builds the customer facts from the form answers ONLY: a key is present
 * only when the customer typed it. Validation reuses the server's own
 * normalizer, so the form and the compiler can never disagree.
 */
export function buildCommercialStartFacts(values: CommercialStartFormValues): CommercialStartFactsResult {
  const businessName = values.businessName.trim()
  const whatsapp = values.whatsapp.trim()
  const phone = values.phone.trim()
  const location = values.location.trim()
  const services = uniqueList(values.services, /\r?\n/, COMMERCIAL_START_MAX_SERVICES)
  const serviceArea = uniqueList(values.serviceArea, /[,\r\n]/, MAX_SERVICE_AREAS)

  const facts: BusinessFactsInputV1 = {
    businessName,
    contact: {
      ...(whatsapp ? { whatsapp } : {}),
      ...(phone ? { phone } : {}),
    },
    ...(services.length ? { services: services.map((name) => ({ name })) } : {}),
    ...(location ? { location } : {}),
    ...(serviceArea.length ? { serviceArea } : {}),
  }

  const normalized = normalizeBusinessFactsV1(facts, "customer")
  const contact = normalized.ok ? normalized.facts.evidence.contact : undefined
  const errors: Partial<Record<CommercialStartField, string>> = {}

  if ("errors" in normalized && normalized.errors.includes("missing_business_name")) {
    errors.businessName = "Escribe el nombre de tu negocio."
  }
  if (whatsapp && !contact?.whatsapp) {
    errors.whatsapp = "Revisa el número: usa de 10 a 15 dígitos."
  }
  if (phone && !contact?.phone) {
    errors.phone = "Revisa el número: usa de 10 a 15 dígitos."
  }
  if (!whatsapp && !phone) {
    errors.whatsapp = "Agrega un WhatsApp o un teléfono para que tus clientes te contacten."
  }

  if (Object.keys(errors).length || !normalized.ok) return { ok: false, errors }
  return { ok: true, facts }
}

export function createCommercialAttemptKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `commercial:${crypto.randomUUID()}`
  }
  return `commercial:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`
}

/** The only destination accepted after creation: the new site's editor. */
export function isSafeEditorRoute(route: unknown): route is string {
  return typeof route === "string" && /^\/editor\/[A-Za-z0-9_-]{1,64}$/.test(route)
}

const INTERNAL_TERMS = /orvenix ai|preview|hash|execute|job\b|\bv\d+\b|invalido/i

/** Server messages are shown only when they are already plain product language. */
export function toPublicCommercialMessage(message: string | undefined, fallback: string): string {
  return message && !INTERNAL_TERMS.test(message) ? message : fallback
}

export type CommercialSiteAction = (
  input: CommercialDesignSiteCreationActionInput,
) => Promise<OrvenixSiteCreationActionResult>

export interface CommercialPreview {
  previewId: string
  previewHash: string
  pages: SiteCreationPreviewPageV1[]
}

export async function requestCommercialPreview(
  action: CommercialSiteAction,
  params: { designId: string; version: number; facts: BusinessFactsInputV1; clientAttemptKey: string },
): Promise<{ ok: true; preview: CommercialPreview } | { ok: false; message: string }> {
  const fallback = "No pudimos preparar la vista previa de tu sitio. Intenta de nuevo."
  const result = await action({
    mode: "preview",
    designId: params.designId,
    version: params.version,
    clientAttemptKey: params.clientAttemptKey,
    facts: params.facts,
  })

  if ("message" in result) return { ok: false, message: toPublicCommercialMessage(result.message, fallback) }
  if (!result.previewId || !result.previewHash || !result.previewPages?.length) return { ok: false, message: fallback }

  return {
    ok: true,
    preview: { previewId: result.previewId, previewHash: result.previewHash, pages: result.previewPages },
  }
}

export async function confirmCommercialSite(
  action: CommercialSiteAction,
  params: { designId: string; version: number; preview: CommercialPreview },
): Promise<{ ok: true; nextRoute: string } | { ok: false; message: string }> {
  const fallback = "No pudimos crear tu sitio. Vuelve a generar la vista previa e intenta de nuevo."
  const result = await action({
    mode: "execute",
    designId: params.designId,
    version: params.version,
    confirmed: true,
    previewId: params.preview.previewId,
    expectedPreviewHash: params.preview.previewHash,
  })

  if ("message" in result) return { ok: false, message: toPublicCommercialMessage(result.message, fallback) }

  const nextRoute = result.nextRoute ?? result.result.createdSite?.nextRoute
  if (!isSafeEditorRoute(nextRoute)) {
    return { ok: false, message: "Tu sitio se creó, pero no pudimos abrir el editor. Encuéntralo en tu panel." }
  }
  return { ok: true, nextRoute }
}
