import type { CommercialDesignV1 } from "../contract"

/**
 * CV1-1b: Construction V2 (construction@2) -- the design-fidelity version of
 * the approved construction@1 demo: same recipe, pins, theme and chrome,
 * plus a declared composition (visual family pinned to the one the approved
 * demo was composed with) and "demo-shape" fidelity, so a customer without
 * project photos yet still receives the demo's full composition with
 * explicit empty states instead of a reduced site. The immersive home hero
 * no longer falls back to "centered" when the project photo is missing.
 *
 * IMMUTABLE: a change is construction@3. @1 stays registered unchanged.
 */
export const CONSTRUCTION_V2: CommercialDesignV1 = {
  contract: 1,
  id: "construction",
  version: 2,
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
  composition: { visualFamily: "creative", fidelity: "demo-shape" },
  pages: [
    {
      slug: "home",
      name: "Inicio",
      archetype: "overview",
      pins: { heroVariant: "immersive", heroTreatment: "standard", processTreatment: "numbered", sectionToneStrategy: "contrast-led" },
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
