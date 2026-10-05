import type { CommercialDesignV1 } from "../contract"

/**
 * CV1-5: Contabilidad V1 (contabilidad@1) -- native commercial design for
 * accounting/fiscal advisory firms. It compiles through the same commercial
 * pipeline and keeps pricing/diagnostic conversion declarative.
 */
export const CONTABILIDAD_V1: CommercialDesignV1 = {
  contract: 1,
  id: "contabilidad",
  version: 1,
  family: "professional",
  siteType: "business",
  catalog: {
    name: "Despacho Contable",
    summary: "Sitio profesional para despachos contables y fiscales: servicios SAT/IMSS, planes, proceso de onboarding, equipo y diagnostico inicial.",
    businessFit: ["Despacho contable", "Asesoria fiscal", "Nomina", "Auditoria", "PyMEs", "Consultoria financiera"],
    styleLabels: ["Profesional", "Planes claros", "Diagnostico", "B2B"],
  },
  theme: {
    mode: "light",
    colors: { primary: "#0F766E", secondary: "#0E7490", background: "#F6FBFA", text: "#0F172A", accent: "#06B6D4" },
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
    trustTreatment: "standard",
    pricingTreatment: "standard",
    footerPreset: "rich",
    showLogo: true,
  },
  conversion: { primary: ["quote", "whatsapp", "contact"] },
  motif: "none",
  seo: { titlePattern: "page-business" },
  composition: { visualFamily: "professional", fidelity: "demo-shape" },
  pages: [
    {
      slug: "home",
      name: "Inicio",
      archetype: "overview",
      pins: { heroVariant: "split-left", heroTreatment: "standard", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" },
      sections: [
        { role: "navigation" },
        { role: "hero", assetRoles: ["hero"] },
        { role: "services", requiresFacts: ["services"] },
        { role: "features" },
        { role: "pricing", requiresFacts: ["servicePrices"] },
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
      pins: { heroVariant: "centered", processTreatment: "numbered" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "services" },
        { role: "features" },
        { role: "faq", requiresFacts: ["faq"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "planes",
      name: "Planes",
      archetype: "conversion",
      requiresFacts: ["servicePrices"],
      pins: { heroVariant: "centered", processTreatment: "numbered" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "pricing" },
        { role: "process" },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "equipo",
      name: "Equipo",
      archetype: "overview",
      requiresFacts: ["people"],
      pins: { heroVariant: "centered", sectionToneStrategy: "soft-rhythm" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "trust" },
        { role: "features" },
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
  internalReference: "Referencia visual interna: app/webs/contabilidad",
}
