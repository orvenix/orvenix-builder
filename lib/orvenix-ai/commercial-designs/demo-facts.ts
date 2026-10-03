import { normalizeBusinessFactsV1, type BusinessFactsInputV1, type BusinessFactsV1 } from "./business-facts"

/**
 * CSC-1B: DEMO/SAMPLE ONLY. Clearly fictional sample businesses used
 * EXCLUSIVELY by the catalog showcase, the dev review route and tests.
 * Every value is marked as an example; contact data uses reserved/
 * non-routable values (example.com, all-zero subscriber numbers). No
 * reviews, ratings, stats, certifications, years or guarantees.
 *
 * The compile path refuses these facts for a real customer compile
 * (kind === "demo"), and tests assert no demo value can leak into one.
 */

export const DEMO_FACTS_INPUT_BY_DESIGN_V1: Readonly<Record<string, BusinessFactsInputV1>> = {
  "servicios-locales": {
    businessName: "Servicios Ejemplo Hogar",
    tagline: "Sitio de ejemplo · servicios a domicilio",
    description: "Negocio de ejemplo para mostrar el diseño Servicios Locales. Todos los datos son de muestra.",
    contact: { whatsapp: "5500000000", email: "contacto@example.com" },
    hours: "Lunes a sábado, 9:00 a 18:00 (horario de ejemplo)",
    serviceArea: ["Zona Centro (ejemplo)", "Zona Norte (ejemplo)", "Zona Poniente (ejemplo)"],
    services: [
      { name: "Instalación de equipos", description: "Servicio de ejemplo: visita, revisión del espacio e instalación.", priceLabel: "Desde $0000 (ejemplo)" },
      { name: "Mantenimiento preventivo", description: "Servicio de ejemplo: revisión programada para evitar fallas.", priceLabel: "Desde $0000 (ejemplo)" },
      { name: "Reparaciones", description: "Servicio de ejemplo: diagnóstico y reparación en sitio." },
      { name: "Limpieza de equipos", description: "Servicio de ejemplo: limpieza profunda y revisión general." },
    ],
    faq: [
      { question: "¿Esta información es real?", answer: "No. Es un negocio de ejemplo; tu sitio usará únicamente los datos que tú proporciones." },
      { question: "¿Puedo cambiar los servicios y la zona?", answer: "Sí. Servicios, zona, horario y contacto salen de los datos de tu negocio y se editan en el editor." },
    ],
    assets: {
      logo: { src: "/uploads/demo-servicios-locales-logo.webp", alt: "Logo de ejemplo" },
      hero: { src: "/uploads/demo-servicios-locales-hero.webp", alt: "Imagen hero de ejemplo" },
      serviceImages: [{ src: "/uploads/demo-servicios-locales-servicio.webp", alt: "Servicio de ejemplo" }],
    },
  },
}

export function getDemoFactsV1(designId: string): BusinessFactsV1 | null {
  const input = DEMO_FACTS_INPUT_BY_DESIGN_V1[designId]
  if (!input) return null
  const result = normalizeBusinessFactsV1(input, "demo")
  return result.ok ? result.facts : null
}
