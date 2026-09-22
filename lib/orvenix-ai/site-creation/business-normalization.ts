import { inferServicesFromText } from "./service-inference"

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

export type SiteCreationBusinessInputV1 = {
  name?: string
  industry?: string
  location?: string
  objective?: string
  description?: string
  preferredStyle?: string
  services?: SiteCreationOfferingInputV1[]
  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. Same shape, same precedence rules. */
  products?: SiteCreationOfferingInputV1[]
}

export type NormalizedSiteCreationBusinessV1 = {
  name: string
  industry: string
  location: string | undefined
  objective: string
  description: string
  services: Array<{ name: string; description: string }> | undefined
  products: Array<{ name: string; description: string }> | undefined
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
  const explicitProducts = normalizeExplicitOfferings(input?.products)

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
  }
}
