import type { CommercialDesignV1 } from "../contract"

/**
 * CV1-1b: Servicios Locales V2 (servicios-locales@2) -- the design-fidelity
 * version of the approved servicios-locales@1 demo.
 *
 * Same recipe, pins, theme and chrome as @1, plus a declared composition
 * (visual family pinned to the one the approved demo was composed with) and
 * "demo-shape" fidelity: every customer gets the demo's exact composition,
 * with explicit empty states where their facts are still missing. Sections
 * the approved demo never showed (home testimonials) are not part of @2, and
 * no pin falls back when a photo is missing.
 *
 * IMMUTABLE: a change is servicios-locales@3. @1 stays registered unchanged.
 */
export const SERVICIOS_LOCALES_V2: CommercialDesignV1 = {
  contract: 1,
  id: "servicios-locales",
  version: 2,
  family: "local-services",
  siteType: "business",
  catalog: {
    name: "Servicios Locales",
    summary: "Sitio claro y enfocado en conseguir clientes para negocios de servicio a domicilio o en sitio: servicios, proceso de trabajo, zona de servicio y contacto directo.",
    businessFit: ["Plomería", "Electricidad", "Aire acondicionado", "Limpieza", "Mantenimiento", "Jardinería"],
    styleLabels: ["Claro", "Enfocado en WhatsApp", "Listo para celular"],
  },
  theme: {
    mode: "light",
    colors: { primary: "#0E7490", secondary: "#0F172A", background: "#F6F8FB", text: "#0F172A", accent: "#0E7490" },
    fontHeading: "Inter",
    fontBody: "Inter",
    radius: "soft",
    shadow: "soft",
  },
  chrome: {
    density: "standard",
    navigationSurfaceStyle: "solid",
    navigationContainment: "integrated",
    navigationLinkStyle: "minimal",
    navigationCtaEmphasis: "prominent",
    pricingTreatment: "standard",
    footerPreset: "rich",
    showLogo: true,
  },
  conversion: { primary: ["whatsapp", "quote", "contact"] },
  motif: "none",
  seo: { titlePattern: "page-business" },
  composition: { visualFamily: "creative", fidelity: "demo-shape" },
  pages: [
    {
      slug: "home",
      name: "Inicio",
      archetype: "overview",
      pins: { heroVariant: "split-left", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" },
      sections: [
        { role: "navigation" },
        { role: "hero", assetRoles: ["hero"] },
        { role: "services", requiresFacts: ["services"] },
        { role: "features" },
        { role: "process" },
        { role: "pricing", requiresFacts: ["servicePrices"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "servicios",
      name: "Servicios",
      archetype: "catalog",
      requiresFacts: ["services"],
      pins: { heroVariant: "centered", processTreatment: "numbered" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "services" },
        { role: "gallery", requiresAssets: ["serviceImage"], assetRoles: ["serviceImage"] },
        { role: "process" },
        { role: "faq", requiresFacts: ["faq"] },
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
  internalReference: "Referencia visual interna: app/webs/servicios-locales",
}
