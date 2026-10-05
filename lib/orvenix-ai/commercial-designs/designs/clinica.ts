import type { CommercialDesignV1 } from "../contract"

/**
 * CV1-4: Clinica V1 (clinica@1) -- native commercial design for healthcare,
 * compiled through CommercialDesignV1 -> SiteCreationPlanV2 -> EditorTree.
 *
 * This is intentionally declarative: no JSX, no HTML, no CSS classes and no
 * runtime dependency on the legacy /webs/clinica reference.
 */
export const CLINICA_V1: CommercialDesignV1 = {
  contract: 1,
  id: "clinica",
  version: 1,
  family: "professional",
  siteType: "health",
  catalog: {
    name: "Clinica & Salud",
    summary: "Sitio profesional para clinicas, consultorios y especialistas: agenda de citas, especialidades, equipo medico, confianza y contacto claro.",
    businessFit: ["Clinica dental", "Consultorio medico", "Fisioterapia", "Psicologia", "Especialistas", "Wellness"],
    styleLabels: ["Salud premium", "Citas online", "Equipo medico", "Confianza"],
  },
  theme: {
    mode: "light",
    colors: { primary: "#0F766E", secondary: "#155E75", background: "#F4FBFA", text: "#0F172A", accent: "#14B8A6" },
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
  conversion: { primary: ["booking", "whatsapp", "contact"] },
  motif: "none",
  seo: { titlePattern: "page-business" },
  composition: { visualFamily: "health", fidelity: "demo-shape" },
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
        { role: "trust", requiresFacts: ["people"] },
        { role: "cta" },
        { role: "footer" },
      ],
    },
    {
      slug: "especialidades",
      name: "Especialidades",
      archetype: "catalog",
      requiresFacts: ["services"],
      pins: { heroVariant: "centered", processTreatment: "numbered", sectionToneStrategy: "soft-rhythm" },
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
      slug: "equipo",
      name: "Equipo",
      archetype: "overview",
      requiresFacts: ["people"],
      pins: { heroVariant: "centered", heroTreatment: "standard", sectionToneStrategy: "soft-rhythm" },
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
      slug: "citas",
      name: "Citas",
      archetype: "conversion",
      pins: { heroVariant: "centered", processTreatment: "numbered" },
      sections: [
        { role: "navigation" },
        { role: "hero" },
        { role: "process" },
        { role: "contact" },
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
  internalReference: "Referencia visual interna: app/webs/clinica",
}
