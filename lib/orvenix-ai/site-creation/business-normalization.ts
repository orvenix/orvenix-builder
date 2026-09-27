import { normalizeCommercePresentationProductsV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import { inferServicesFromText } from "./service-inference"
import {
  normalizeSiteCreationBusinessEvidence,
  type NormalizedSiteCreationBusinessEvidenceV1,
  type SiteCreationBusinessEvidenceInputV1,
} from "./evidence-normalization"

/**
 * The ONE authoritative boundary where a Site Creation request's raw
 * input (structured form fields + freeform message) becomes the
 * normalized business context consumed by the rest of the pipeline
 * (buildSiteArchitecture, runAutonomousMultiPageSiteBuilder, Design
 * Memory bucketing, etc). Everything downstream of this function must
 * keep consuming structured data only -- prose parsing belongs here and
 * nowhere else.
 */

export type SiteCreationOfferingInputV1 = { name?: string; description?: string }

/**
 * COMMERCE-2A: bounded, customer-suppliable product facts. Price/stock are
 * integer MXN cents / units used only to DISPLAY and to seed a new store
 * after confirmation. There is deliberately no id/binding/provisioning
 * field: normalizeCommercePresentationProductsV1 drops anything else.
 */
export type SiteCreationProductInputV1 = SiteCreationOfferingInputV1 & {
  category?: string
  variants?: Array<{
    label?: string
    priceMxn?: number
    comparePriceMxn?: number
    initialStock?: number
    sku?: string
  }>
}

export type SiteCreationBusinessInputV1 = {
  name?: string
  industry?: string
  location?: string
  objective?: string
  description?: string
  preferredStyle?: string
  services?: SiteCreationOfferingInputV1[]
  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. Same precedence rules. COMMERCE-2A: may carry bounded commerce facts. */
  products?: SiteCreationProductInputV1[]
  businessEvidence?: SiteCreationBusinessEvidenceInputV1
}

export type NormalizedSiteCreationBusinessV1 = {
  name: string
  industry: string
  location: string | undefined
  objective: string
  description: string
  services: Array<{ name: string; description: string }> | undefined
  products: Array<{ name: string; description: string } & Pick<CommerceProductFactV1, "category" | "variants">> | undefined
  businessEvidence: NormalizedSiteCreationBusinessEvidenceV1 | undefined
}

function normalizeExplicitOfferings(
  offerings: SiteCreationOfferingInputV1[] | undefined,
): Array<{ name: string; description: string }> | undefined {
  return Array.isArray(offerings)
    ? offerings
        .map((offering) => ({
          name: String(offering?.name ?? "")
            .trim()
            .slice(0, 90),
          description: String(offering?.description ?? "")
            .trim()
            .slice(0, 180),
        }))
        .filter((offering) => offering.name)
        .slice(0, 8)
    : undefined
}

export function normalizeSiteCreationBusiness(
  input: SiteCreationBusinessInputV1 | undefined,
  message: string,
): NormalizedSiteCreationBusinessV1 {
  const explicitServices = normalizeExplicitOfferings(input?.services)
  const explicitProducts = normalizeExplicitOfferings(input?.products)?.map((product, index) => {
    // COMMERCE-2A: attach ONLY bounded presentation commerce facts (never ids) to explicit products.
    const raw = input?.products?.filter((candidate) => String(candidate?.name ?? "").trim())[index]
    const [facts] = normalizeCommercePresentationProductsV1(raw ? [{ ...raw, name: product.name }] : []) ?? []
    return {
      ...product,
      ...(facts?.category ? { category: facts.category } : {}),
      ...(facts?.variants?.length ? { variants: facts.variants } : {}),
    }
  })

  const location = input?.location?.trim().slice(0, 120)
  const description = input?.description?.trim().slice(0, 600) || message

  /*
   * Explicit structured offerings (eg. the Site Creation form's
   * dedicated "Servicios principales" rows) are always authoritative,
   * per collection independently. Inference only runs to fill a genuine
   * gap -- when the caller supplied NEITHER services nor products
   * explicitly -- and only from the same freeform text the
   * "description" field itself already falls back to. The single
   * inference pass is then split by the `kind` each item's own matched
   * lead-in phrase signaled (see service-inference.ts) -- never by
   * siteType/industry, which this function doesn't even compute.
   */
  let inferredServices: Array<{ name: string; description: string }> | undefined
  let inferredProducts: Array<{ name: string; description: string }> | undefined

  if (!explicitServices?.length && !explicitProducts?.length) {
    const inferred = inferServicesFromText(description, { location })
    const services = inferred.filter((item) => item.kind === "service")
    const products = inferred.filter((item) => item.kind === "product")

    inferredServices = services.length
      ? services.map((item) => ({ name: item.name, description: item.description ?? "" }))
      : undefined
    inferredProducts = products.length
      ? products.map((item) => ({ name: item.name, description: item.description ?? "" }))
      : undefined
  }

  const normalizedServices = explicitServices?.length ? explicitServices : inferredServices
  const normalizedProducts = explicitProducts?.length ? explicitProducts : inferredProducts

  return {
    name: input?.name?.trim().slice(0, 120) || "Sitio creado con Orvenix AI",
    industry: input?.industry?.trim().slice(0, 90) || "negocio profesional",
    location,
    objective:
      input?.objective?.trim().slice(0, 180) ||
      "Generar prospectos y contactos",
    description,
    services: normalizedServices?.length ? normalizedServices : undefined,
    products: normalizedProducts?.length ? normalizedProducts : undefined,
    businessEvidence: normalizeSiteCreationBusinessEvidence(input?.businessEvidence),
  }
}
