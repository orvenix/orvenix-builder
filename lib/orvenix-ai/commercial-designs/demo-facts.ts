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
  // CSC-1C: fictional sample business. Text facts are all samples; the images are
  // metadata-free derivatives of owner-authorized project photos (demo-only prefix,
  // rejected for customer facts). One progress sequence documents the SAME project;
  // it is deliberately NOT declared chronological and never presented as before/after.
  construction: {
    businessName: "Constructora Ejemplo Norte",
    tagline: "Sitio de ejemplo · construcción y remodelación",
    description: "Constructora de ejemplo para mostrar el diseño Construcción Premium. Todos los datos de texto son de muestra.",
    contact: { whatsapp: "5500000000", email: "contacto@example.com" },
    hours: "Lunes a viernes, 9:00 a 18:00 (horario de ejemplo)",
    serviceArea: ["Zona Metropolitana (ejemplo)", "Zona Residencial (ejemplo)"],
    services: [
      { name: "Construcción residencial", description: "Servicio de ejemplo: obra residencial por etapas, con registro fotográfico del avance." },
      { name: "Remodelación integral", description: "Servicio de ejemplo: actualización de espacios interiores y exteriores." },
      { name: "Albercas y exteriores", description: "Servicio de ejemplo: albercas, áreas exteriores y acabados." },
      { name: "Estructura y losas", description: "Servicio de ejemplo: cimentación, armado y losas." },
    ],
    faq: [
      { question: "¿Los proyectos mostrados son de un cliente real?", answer: "Es un sitio de ejemplo. Tu sitio mostrará únicamente tus datos, tus proyectos y tus fotografías." },
      { question: "¿Puedo cambiar servicios, proyectos y fotografías?", answer: "Sí. Servicios, proyectos, contacto e imágenes salen de los datos que proporciones y se editan en el editor." },
    ],
    projects: [
      {
        id: "residencia-ejemplo",
        title: "Residencia contemporánea (ejemplo)",
        summary: "Proyecto de muestra: vivienda de un nivel con fachada metálica, aleros amplios y base de piedra.",
        description: "Texto de ejemplo. Aquí cada negocio describe su proyecto con sus propias palabras: alcance, materiales y lo que el cliente necesitaba. Este diseño solo muestra la información que el negocio proporciona.",
        category: "Construcción residencial",
        status: "in-progress",
        assets: [
          { src: "/commercial-demo/construction/construction-demo-featured-lg.webp", alt: "Fachada de la residencia de ejemplo con alero y revestimiento metálico" },
          { src: "/commercial-demo/construction/construction-demo-hero-lg.webp", alt: "Vista exterior de la residencia de ejemplo" },
        ],
        progressAssets: [
          { src: "/commercial-demo/construction/construction-demo-progress-01-md.webp", alt: "Registro de obra: estructura del alero y muros" },
          { src: "/commercial-demo/construction/construction-demo-progress-02-md.webp", alt: "Registro de obra: revestimiento de fachada" },
          { src: "/commercial-demo/construction/construction-demo-progress-03-md.webp", alt: "Registro de obra: fachada lateral" },
          { src: "/commercial-demo/construction/construction-demo-progress-04-md.webp", alt: "Registro de obra: andamiaje en fachada" },
        ],
      },
      {
        id: "alberca-ejemplo",
        title: "Alberca y jardín (ejemplo)",
        summary: "Proyecto de muestra: alberca, andadores y áreas verdes.",
        category: "Albercas y exteriores",
        status: "completed",
        assets: [{ src: "/commercial-demo/construction/construction-demo-specialty-md.webp", alt: "Alberca y jardín de ejemplo" }],
      },
    ],
    assets: {
      heroProject: { src: "/commercial-demo/construction/construction-demo-hero-lg.webp", alt: "Residencia de ejemplo en obra", sameProjectId: "residencia-ejemplo" },
      specialtyService: { src: "/commercial-demo/construction/construction-demo-specialty-md.webp", alt: "Alberca y áreas exteriores de ejemplo" },
      companyProof: [
        { src: "/commercial-demo/construction/construction-demo-proof-01-md.webp", alt: "Losa aligerada con armado, lista para colado" },
        { src: "/commercial-demo/construction/construction-demo-proof-02-md.webp", alt: "Armado de acero para cimentación" },
      ],
    },
  },
  clinica: {
    businessName: "Clinica Ejemplo Integral",
    tagline: "Sitio de ejemplo · atencion medica y bienestar",
    description: "Clinica de ejemplo para mostrar el diseño Clinica & Salud. Todos los datos son de muestra.",
    contact: { whatsapp: "5500000000", phone: "5500000000", email: "contacto@example.com" },
    address: "Av. Ejemplo 100, Ciudad de Mexico (direccion de ejemplo)",
    hours: "Lunes a viernes, 8:00 a 19:00 (horario de ejemplo)",
    serviceArea: ["Zona Centro (ejemplo)", "Zona Norte (ejemplo)", "Teleconsulta (ejemplo)"],
    services: [
      { name: "Consulta general", description: "Servicio de ejemplo: valoracion inicial y seguimiento del paciente." },
      { name: "Odontologia preventiva", description: "Servicio de ejemplo: revision, limpieza y orientacion de higiene." },
      { name: "Fisioterapia", description: "Servicio de ejemplo: evaluacion funcional y plan de rehabilitacion." },
      { name: "Psicologia", description: "Servicio de ejemplo: acompanamiento profesional y seguimiento." },
    ],
    people: [
      { name: "Dra. Ejemplo Alvarez", role: "Medicina general" },
      { name: "Dr. Ejemplo Rios", role: "Odontologia preventiva" },
      { name: "Lic. Ejemplo Torres", role: "Fisioterapia" },
    ],
    testimonials: [
      { quote: "La informacion de este testimonio es de ejemplo; tu sitio mostrara solo opiniones que proporciones.", author: "Paciente de ejemplo", role: "Atencion general" },
      { quote: "El flujo de cita y contacto se adapta a los datos reales de cada clinica.", author: "Paciente de ejemplo", role: "Seguimiento" },
    ],
    faq: [
      { question: "¿Esta informacion medica es real?", answer: "No. Es un sitio de ejemplo; tu clinica usara unicamente la informacion que proporciones." },
      { question: "¿Puedo cambiar especialidades, doctores y horarios?", answer: "Si. Servicios, equipo, contacto y horarios salen de tus datos y se editan en Orvenix." },
    ],
    assets: {
      logo: { src: "/uploads/demo-clinica-logo.webp", alt: "Logo de ejemplo" },
      hero: { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=900&fit=crop&q=80", alt: "Consultorio medico de ejemplo" },
      serviceImages: [{ src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&h=700&fit=crop&q=80", alt: "Atencion clinica de ejemplo" }],
    },
  },
  contabilidad: {
    businessName: "Despacho Ejemplo Fiscal",
    tagline: "Sitio de ejemplo · contabilidad y asesoria fiscal",
    description: "Despacho contable de ejemplo para mostrar el diseño Despacho Contable. Todos los datos son de muestra.",
    contact: { whatsapp: "5500000000", phone: "5500000000", email: "contacto@example.com" },
    address: "Calle Fiscal 100, Ciudad de Mexico (direccion de ejemplo)",
    hours: "Lunes a viernes, 9:00 a 18:00 (horario de ejemplo)",
    serviceArea: ["PyMEs (ejemplo)", "Emprendedores (ejemplo)", "Servicios profesionales (ejemplo)"],
    services: [
      { name: "Contabilidad mensual", description: "Servicio de ejemplo: registros, conciliaciones y reportes.", priceLabel: "Desde $0000 (ejemplo)" },
      { name: "Declaraciones fiscales", description: "Servicio de ejemplo: preparacion y presentacion de obligaciones.", priceLabel: "Desde $0000 (ejemplo)" },
      { name: "Nomina e IMSS", description: "Servicio de ejemplo: calculo de nomina, movimientos y reportes." },
      { name: "Diagnostico fiscal", description: "Servicio de ejemplo: revision inicial de obligaciones y riesgos." },
    ],
    people: [
      { name: "C.P. Ejemplo Morales", role: "Socio fiscal" },
      { name: "C.P. Ejemplo Herrera", role: "Nomina e IMSS" },
    ],
    faq: [
      { question: "¿Esta informacion fiscal es real?", answer: "No. Es un sitio de ejemplo; tu despacho usara solo la informacion que proporciones." },
      { question: "¿Puedo cambiar servicios, planes y contacto?", answer: "Si. Servicios, precios, equipo y datos de contacto salen de tus datos y se editan en Orvenix." },
    ],
    assets: {
      logo: { src: "/uploads/demo-contabilidad-logo.webp", alt: "Logo de ejemplo" },
      hero: { src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop&q=80", alt: "Despacho contable de ejemplo" },
      serviceImages: [{ src: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=900&h=700&fit=crop&q=80", alt: "Asesoria fiscal de ejemplo" }],
    },
  },
}

export function getDemoFactsV1(designId: string): BusinessFactsV1 | null {
  const input = DEMO_FACTS_INPUT_BY_DESIGN_V1[designId]
  if (!input) return null
  const result = normalizeBusinessFactsV1(input, "demo")
  return result.ok ? result.facts : null
}
