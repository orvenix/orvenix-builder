import type { CommercialDesignV1 } from "../contract"

/**
 * CSC-1C: Construction V1 (construction@1).
 *
 * Technical-editorial design for project-led businesses (construction,
 * remodeling, residential architecture, pools/exteriors): photo-led hero,
 * services, documented project evidence, same-project progress, company
 * work on site and a clear quote path. Visual reference only (principles,
 * never markup): an owner-authorized construction site kept read-only
 * outside the product.
 *
 * Degradation is declarative: no project evidence -> no Projects page and
 * no project module on Home (services/process/contact carry the page); no
 * hero project photo -> centered typographic hero; no narrative+images for
 * one project -> no project-detail page; no services -> no Services page.
 * The recipe never carries years, certifications, warranties, ratings,
 * statistics, before/after claims or any business fact.
 *
 * IMMUTABLE: never change the semantics of version 1. A design change is a
 * new version (construction@2) registered alongside this one.
 */
export const CONSTRUCTION_V1: CommercialDesignV1 = {
  contract: 1,
  id: "construction",
  version: 1,
  family: "construction",
  siteType: "business",
  catalog: {
    name: "Construcción",
    summary: "Sitio editorial para constructoras y servicios de obra: proyectos con fotografías propias, avance de obra, servicios especializados y contacto directo para cotizar.",
    businessFit: ["Construcción", "Remodelación", "Albercas y exteriores", "Acabados", "Arquitectura residencial", "Paisajismo"],
    styleLabels: ["Editorial técnico", "Evidencia fotográfica", "Multi-página", "Cotización directa"],
  },
  theme: {
    mode: "light",
    colors: { primary: "#1C1917", secondary: "#9A3412", background: "#F5F3EF", text: "#1C1917", accent: "#C2410C" },
    fontHeading: "Oswald",
    fontBody: "Inter",
    radius: "sharp",
    shadow: "soft",
  },
  chrome: {
    density: "spacious",
    navigationSurfaceStyle: "solid",
    navigationContainment: "integrated",
    navigationLinkStyle: "minimal",
    navigationCtaEmphasis: "prominent",
    pricingTreatment: "standard",
    footerPreset: "rich",
    showLogo: true,
  },
  conversion: { primary: ["quote", "whatsapp", "contact"] },
  motif: "none",
  seo: { titlePattern: "page-business" },
  pages: [
    {
      slug: "home",
      name: "Inicio",
      archetype: "overview",
      pins: { heroVariant: "immersive", heroTreatment: "standard", processTreatment: "numbered", sectionToneStrategy: "contrast-led" },
      pinFallbacks: [{ whenMissing: "asset:heroProject", pins: { heroVariant: "centered" } }],
      sections: [
        { role: "navigation" },
        { role: "hero", assetRoles: ["heroProject"] },
        { role: "services", requiresFacts: ["services"] },
        { role: "gallery", requiresFacts: ["projectEvidence"], assetRoles: ["featuredProject", "projectProgress", "projectGallery"] },
        { role: "features" },
        { role: "process" },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "servicios",
      name: "Servicios",
      archetype: "catalog",
      requiresFacts: ["services"],
      pins: { heroVariant: "centered", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "services" },
        { role: "gallery", requiresAssets: ["specialtyService"], assetRoles: ["specialtyService"] },
        { role: "process" },
        { role: "faq", requiresFacts: ["faq"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "proyectos",
      name: "Proyectos",
      archetype: "catalog",
      requiresFacts: ["projectEvidence"],
      pins: { heroVariant: "centered", heroTreatment: "standard", sectionToneStrategy: "contrast-led" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "gallery", assetRoles: ["featuredProject", "projectProgress", "projectGallery"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "proyecto-destacado",
      name: "Proyecto destacado",
      archetype: "catalog",
      requiresFacts: ["projectDetail"],
      pins: { heroVariant: "immersive", heroTreatment: "standard", sectionToneStrategy: "contrast-led" },
      sections: [
        { role: "navigation" },
        { role: "hero", assetRoles: ["featuredProject", "projectProgress"] },
        { role: "gallery", assetRoles: ["featuredProject", "projectProgress", "projectGallery"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "nosotros",
      name: "Nosotros",
      archetype: "overview",
      pins: { heroVariant: "centered", heroTreatment: "standard", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "features" },
        { role: "gallery", requiresAssets: ["companyProof"], assetRoles: ["companyProof"] },
        { role: "process" },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "contacto",
      name: "Contacto",
      archetype: "conversion",
      sections: [
        { role: "navigation" },
        { role: "contact" },
        { role: "footer" },
      ],
    },
  ],
  internalReference: "Referencia visual interna: sitio de construcción autorizado por el propietario (solo lectura)",
}
