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

export type SiteCreationBusinessInputV1 = {
  name?: string
  industry?: string
  location?: string
  objective?: string
  description?: string
  preferredStyle?: string
  services?: Array<{ name?: string; description?: string }>
}

export type NormalizedSiteCreationBusinessV1 = {
  name: string
  industry: string
  location: string | undefined
  objective: string
  description: string
  services: Array<{ name: string; description: string }> | undefined
}

export function normalizeSiteCreationBusiness(
  input: SiteCreationBusinessInputV1 | undefined,
  message: string,
): NormalizedSiteCreationBusinessV1 {
  const explicitServices = Array.isArray(input?.services)
    ? input.services
        .map((service) => ({
          name: String(service?.name ?? "")
            .trim()
            .slice(0, 90),
          description: String(service?.description ?? "")
            .trim()
            .slice(0, 180),
        }))
        .filter((service) => service.name)
        .slice(0, 8)
    : undefined

  const location = input?.location?.trim().slice(0, 120)
  const description = input?.description?.trim().slice(0, 600) || message

  /*
   * Explicit structured services (eg. the Site Creation form's dedicated
   * "Servicios principales" rows) are always authoritative. Inference
   * only runs to fill a genuine gap -- when the caller supplied no
   * services at all -- and only from the same freeform text the
   * "description" field itself already falls back to.
   */
  const normalizedServices =
    explicitServices && explicitServices.length > 0
      ? explicitServices
      : inferServicesFromText(description, { location }).map((service) => ({
          name: service.name,
          description: service.description ?? "",
        }))

  return {
    name: input?.name?.trim().slice(0, 120) || "Sitio creado con Orvenix AI",
    industry: input?.industry?.trim().slice(0, 90) || "negocio profesional",
    location,
    objective:
      input?.objective?.trim().slice(0, 180) ||
      "Generar prospectos y contactos",
    description,
    services: normalizedServices.length > 0 ? normalizedServices : undefined,
  }
}
