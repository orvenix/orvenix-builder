import type { BusinessAffinity, PagePurpose, SectionRole } from "./contract"

/**
 * V2-5A.2: the ONE small override/annotation table this module needs.
 *
 * Everything else in extract.ts is derived mechanically from source
 * text (Tailwind classes, imports, route structure). Which INDUSTRY a
 * directory name like "abogados" or "notaria" represents is not
 * something Tailwind classes encode -- it requires knowing what the
 * Spanish word means. This table is that one small, static,
 * deterministic classification: a taxonomy label per reference (like a
 * library catalog category), never literal business copy, never
 * per-reference visual/structural grammar. It is small (25 entries),
 * documented here, and does not replace mechanical extraction of any
 * other field.
 */
export const WEBS_BUSINESS_AFFINITY: Record<string, BusinessAffinity> = {
  abogados: "legal-professional",
  academia: "education",
  agencia: "creative-services",
  arquitectura: "creative-services",
  barberia: "fitness-beauty",
  carniceria: "retail-commerce",
  clinica: "health",
  contabilidad: "financial-professional",
  ferreteria: "retail-commerce",
  finanzas: "financial-professional",
  fotografia: "creative-services",
  gimnasio: "fitness-beauty",
  hotel: "travel-hospitality",
  inmobiliaria: "real-estate",
  jugueteria: "retail-commerce",
  launchpro: "saas",
  notaria: "legal-professional",
  restaurante: "food-hospitality",
  rrhh: "local-services",
  seguros: "financial-professional",
  "servicios-locales": "local-services",
  tienda: "retail-commerce",
  transporte: "local-services",
  viajes: "travel-hospitality",
  vistamoda: "retail-commerce",
}

/** Folder-name -> bounded page purpose. Structural route classification, not content. */
export const PAGE_PURPOSE_BY_FOLDER: Record<string, PagePurpose> = {
  servicios: "services",
  especialidades: "services",
  clases: "services",
  tramites: "services",
  nosotros: "about",
  contacto: "contact",
  blog: "blog",
  testimonios: "testimonials",
  casos: "testimonials",
  proyectos: "gallery",
  galeria: "gallery",
  portafolio: "gallery",
  equipo: "team",
  medicos: "team",
  entrenadores: "team",
  agentes: "team",
  planes: "pricing",
  precios: "pricing",
  tarifas: "pricing",
  catalogo: "catalog",
  habitaciones: "catalog",
  propiedades: "catalog",
  producto: "catalog",
  productos: "catalog",
  destinos: "catalog",
  paquetes: "catalog",
  tienda: "catalog",
  menu: "catalog",
  cortes: "catalog",
  carrito: "cart",
  pedidos: "cart",
}

/** Keyword -> bounded section role. Matched against BOTH id="..." anchors and JSX comment markers found in source, never against literal running copy. */
export const SECTION_ROLE_KEYWORDS: Array<{ role: SectionRole; keywords: string[] }> = [
  { role: "navigation", keywords: ["nav", "menu", "navigation"] },
  { role: "hero", keywords: ["hero"] },
  { role: "pricing", keywords: ["precio", "plan", "tarifa", "membresia", "membresía", "paquete", "pricing"] },
  { role: "process", keywords: ["proceso", "como-funciona", "como funciona", "pasos", "funciona", "process", "how-it-works"] },
  { role: "faq", keywords: ["faq", "pregunta"] },
  { role: "testimonials", keywords: ["testimonio", "resena", "reseña", "opinion", "opinión", "testimonial", "social proof", "social-proof"] },
  { role: "gallery", keywords: ["galeria", "galería", "portafolio", "mosaico", "gallery", "portfolio"] },
  { role: "trust", keywords: ["seguro", "certificacion", "certificación", "confia", "confía", "aseguradora", "insurance", "trust"] },
  { role: "contact", keywords: ["contacto", "cita", "reserva", "agenda", "whatsapp", "pedido", "contact", "booking"] },
  { role: "cta", keywords: ["cta", "siguiente-paso", "listo para", "empezar", "final"] },
  { role: "footer", keywords: ["footer", "pie"] },
  { role: "content", keywords: ["info bar", "historia", "about"] },
  { role: "services", keywords: ["servicio", "especialidad", "catalogo", "categoria", "categoría", "clases", "tratamiento", "services"] },
  { role: "products", keywords: ["producto", "cortes", "coleccion", "colección"] },
  { role: "features", keywords: ["beneficio", "ventaja", "features"] },
]
