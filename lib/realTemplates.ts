import {
  Activity,
  Car,
  Compass,
  Dumbbell,
  FileText,
  GraduationCap,
  Home,
  Hotel,
  Layers,
  Megaphone,
  Scale,
  Scissors,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { EditorWebId } from "@/lib/editorWebs";

export interface RealTemplate {
  id: EditorWebId;
  name: string;
  category: string;
  description: string;
  livePath: string;
  accent: string;
  gradient: string;
  features: string[];
  purchasePriceMxn: number;
  rentalPriceMxn: number;
  Icon: LucideIcon;
  preview: string;
}

export const REAL_TEMPLATES: RealTemplate[] = [
  {
    id: "arquitectura",
    name: "Estudio de Arquitectura",
    category: "Servicios Profesionales",
    description:
      "Sitio premium para estudio de arquitectura y diseño de interiores: especialidades, portafolio de proyectos, equipo, proceso de trabajo, testimonios y formulario de consulta.",
    livePath: "/webs/arquitectura",
    accent: "#b45309",
    gradient: "from-amber-700 to-stone-900",
    features: ["Portafolio filtrable", "Especialidades", "Equipo certificado", "Multi-página", "Formulario", "Proceso visual"],
    purchasePriceMxn: 30000,
    rentalPriceMxn: 1699,
    Icon: Layers,
    preview: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "contabilidad",
    name: "Despacho Contable & Fiscal",
    category: "Servicios Profesionales",
    description:
      "Web profesional para despacho contable: servicios SAT/IMSS, planes, equipo certificado, proceso de onboarding, testimonios y diagnóstico fiscal gratuito.",
    livePath: "/webs/contabilidad",
    accent: "#0d9488",
    gradient: "from-teal-600 to-cyan-900",
    features: ["Planes con precios", "Servicios SAT/IMSS", "Equipo IMCP", "Multi-página", "Diagnóstico", "Testimonios"],
    purchasePriceMxn: 28000,
    rentalPriceMxn: 1499,
    Icon: TrendingUp,
    preview: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "viajes",
    name: "Agencia de Viajes Premium",
    category: "Servicios Profesionales",
    description:
      "Agencia de viajes certificada: paquetes, destinos destacados, asesores especializados, proceso de reservación, testimonios y cotizador personalizado.",
    livePath: "/webs/viajes",
    accent: "#ea580c",
    gradient: "from-orange-600 to-rose-900",
    features: ["Paquetes", "Destinos con precios", "IATA certificada", "Multi-página", "Cotizador", "Asesores"],
    purchasePriceMxn: 26000,
    rentalPriceMxn: 1399,
    Icon: Compass,
    preview: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "notaria",
    name: "Notaría Pública",
    category: "Servicios Profesionales",
    description:
      "Portal notarial completo: trámites, tarifas orientativas, equipo jurídico, proceso notarial, testimonios y formulario de cita.",
    livePath: "/webs/notaria",
    accent: "#a16207",
    gradient: "from-yellow-700 to-amber-950",
    features: ["Trámites notariales", "Tarifas", "Equipo jurídico", "Multi-página", "Citas", "Proceso claro"],
    purchasePriceMxn: 30000,
    rentalPriceMxn: 1699,
    Icon: FileText,
    preview: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "rrhh",
    name: "Consultora de RRHH",
    category: "Servicios Profesionales",
    description:
      "Consultoría de recursos humanos: servicios con KPIs, casos de éxito, metodología, equipo certificado y diagnóstico gratuito.",
    livePath: "/webs/rrhh",
    accent: "#7c3aed",
    gradient: "from-violet-600 to-purple-950",
    features: ["Servicios con KPIs", "Casos de éxito", "Certificados SHRM", "Multi-página", "Diagnóstico", "Metodología"],
    purchasePriceMxn: 28000,
    rentalPriceMxn: 1499,
    Icon: Users,
    preview: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "tienda",
    name: "Tienda Online Pro",
    category: "Storefront & Checkout",
    description:
      "Tienda pública lista para vender: hero comercial de alto impacto, catálogo con filtros por categoría, carrito visual con resumen de compra, sección de beneficios y flujo de checkout preparado para integrarse a cualquier pasarela de pago.",
    livePath: "/webs/tienda",
    accent: "#d97706",
    gradient: "from-amber-500 to-stone-900",
    features: ["Catálogo filtrable por categoría", "Carrito visual con resumen", "Checkout listo para pago", "Hero de conversión", "Sección de beneficios", "Diseño 100% responsive"],
    purchasePriceMxn: 38000,
    rentalPriceMxn: 2199,
    Icon: Store,
    preview: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "servicios-locales",
    name: "Servicios Locales Pro",
    category: "Negocios Locales",
    description:
      "Página real para negocios de servicios locales: hero de conversión con CTA directo, tarjetas de servicio con precios, mapa de cobertura por zonas, proceso de trabajo en 4 pasos, reseñas verificadas, FAQ y botón de contacto por WhatsApp.",
    livePath: "/webs/servicios-locales",
    accent: "#0e7490",
    gradient: "from-cyan-600 to-slate-900",
    features: ["CTA a WhatsApp directo", "Cobertura por zonas", "Servicios con precios", "Proceso 4 pasos", "Reseñas verificadas", "FAQ interactivo"],
    purchasePriceMxn: 22000,
    rentalPriceMxn: 1199,
    Icon: Wrench,
    preview: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "restaurante",
    name: "Restaurante Gourmet Pro",
    category: "Gastronomía & Hospitality",
    description:
      "Sitio premium para restaurante de alta cocina: hero con sistema de reservaciones inline, menú interactivo organizado por categorías con precios, historia del chef, galería de platos, reseñas de Google y footer completo con horarios y ubicación.",
    livePath: "/webs/restaurante",
    accent: "#d97706",
    gradient: "from-amber-700 to-orange-950",
    features: ["Reservaciones inline", "Menú interactivo con precios", "Historia del chef", "Galería de platos", "Reseñas Google", "Horarios y ubicación"],
    purchasePriceMxn: 26000,
    rentalPriceMxn: 1399,
    Icon: UtensilsCrossed,
    preview: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "clinica",
    name: "Clínica & Salud Digital",
    category: "Healthcare & Wellness",
    description:
      "Web médica premium con 8 especialidades presentadas en tarjetas detalladas, directorio de doctores con ratings y cédulas verificadas, proceso de atención en 4 pasos, formulario de cita online, seguros aceptados y FAQ médico expandible.",
    livePath: "/webs/clinica",
    accent: "#14b8a6",
    gradient: "from-teal-600 to-cyan-900",
    features: ["8 especialidades médicas", "Directorio de doctores", "Cita online", "Seguros aceptados", "FAQ médico", "Proceso de atención"],
    purchasePriceMxn: 30000,
    rentalPriceMxn: 1699,
    Icon: Activity,
    preview: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "inmobiliaria",
    name: "Inmobiliaria Premium",
    category: "Real Estate & Proptech",
    description:
      "Portal inmobiliario de lujo con buscador de propiedades, grid filtrable con precios y características, perfiles de agentes top con ratings, proceso de compra/venta en 5 etapas, reporte de mercado descargable y valoración gratuita online.",
    livePath: "/webs/inmobiliaria",
    accent: "#f59e0b",
    gradient: "from-amber-600 to-slate-900",
    features: ["Grid propiedades filtrable", "Agentes con ratings", "Proceso compra/venta", "Reporte de mercado", "Valoración gratuita", "Buscador avanzado"],
    purchasePriceMxn: 32000,
    rentalPriceMxn: 1799,
    Icon: Home,
    preview: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "agencia",
    name: "Agencia Digital 360",
    category: "Marketing & Growth Agency",
    description:
      "Web full-service para agencia digital: 6 servicios detallados con métricas de resultado, 6 casos de éxito con datos reales, proceso en 5 fases, directorio de equipo, planes de precios transparentes, logros de clientes y formulario comercial de alto impacto.",
    livePath: "/webs/agencia",
    accent: "#7c3aed",
    gradient: "from-violet-600 to-pink-900",
    features: ["6 servicios detallados", "Casos de éxito con métricas", "Proceso 5 fases", "Planes de precios", "Directorio de equipo", "Formulario comercial"],
    purchasePriceMxn: 28000,
    rentalPriceMxn: 1499,
    Icon: Megaphone,
    preview: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "academia",
    name: "Academia EdTech Pro",
    category: "Educación & eLearning",
    description:
      "Plataforma educativa completa con catálogo de 6 cursos, 8 categorías, 3 rutas de aprendizaje estructuradas, 4 instructores verificados con perfiles, precios freemium/pro/business, testimonios de egresados y CTA de conversión multicapa.",
    livePath: "/webs/academia",
    accent: "#6366f1",
    gradient: "from-indigo-600 to-violet-900",
    features: ["Catálogo 6 cursos", "8 categorías", "Rutas de aprendizaje", "Instructores verificados", "Pricing freemium/pro", "Testimonios egresados"],
    purchasePriceMxn: 30000,
    rentalPriceMxn: 1699,
    Icon: GraduationCap,
    preview: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "abogados",
    name: "Despacho Jurídico Premium",
    category: "Legal & Consultoría",
    description:
      "Sitio de alto perfil para despacho de abogados: 6 áreas de práctica con casos y tasas de éxito, directorio de equipo con cédulas verificadas ante la SEP, proceso jurídico en 5 pasos, testimonios de clientes, FAQ legal y formulario de consulta gratuita.",
    livePath: "/webs/abogados",
    accent: "#d97706",
    gradient: "from-amber-700 to-stone-900",
    features: ["6 áreas de práctica", "Equipo con cédulas SEP", "Proceso jurídico 5 pasos", "Testimonios verificados", "FAQ legal", "Consulta gratuita"],
    purchasePriceMxn: 28000,
    rentalPriceMxn: 1499,
    Icon: Scale,
    preview: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "gimnasio",
    name: "Gimnasio & Fitness Pro",
    category: "Salud & Fitness",
    description:
      "Web premium para gimnasio: 6 disciplinas con nivel y duración, horario semanal interactivo por día, 3 planes de membresía comparables, directorio de entrenadores certificados NSCA/ISSA, testimonios con resultados reales y formulario de prueba gratuita.",
    livePath: "/webs/gimnasio",
    accent: "#ea580c",
    gradient: "from-orange-600 to-red-900",
    features: ["Horario semanal interactivo", "3 planes de membresía", "6 disciplinas", "Entrenadores NSCA/ISSA", "Resultados reales", "Día de prueba gratis"],
    purchasePriceMxn: 24000,
    rentalPriceMxn: 1299,
    Icon: Dumbbell,
    preview: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "hotel",
    name: "Hotel Boutique Luxury",
    category: "Hospitalidad & Turismo",
    description:
      "Portal hotelero de lujo para hotel boutique: galería de habitaciones seleccionables con precio por noche, servicios y amenidades, galería fotográfica interactiva, reseñas TripAdvisor y Google, FAQ de estancia y formulario de reserva directa con fechas y tipo de habitación.",
    livePath: "/webs/hotel",
    accent: "#78716c",
    gradient: "from-stone-600 to-stone-900",
    features: ["Habitaciones con precios", "Reserva directa con fechas", "Galería interactiva", "Reseñas TripAdvisor", "Servicios y amenidades", "Mejor precio garantizado"],
    purchasePriceMxn: 32000,
    rentalPriceMxn: 1799,
    Icon: Hotel,
    preview: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "transporte",
    name: "Transporte Ejecutivo",
    category: "Transporte & Logística",
    description:
      "Sitio profesional para flota de transporte ejecutivo: flotilla filtrable por tipo de vehículo, paquetes corporativos y de eventos, mapa de zonas de cobertura y tarifas, cotizador en línea paso a paso, testimonios de empresas y proceso de reserva 24/7.",
    livePath: "/webs/transporte",
    accent: "#0284c7",
    gradient: "from-sky-600 to-slate-900",
    features: ["Flotilla filtrable", "Paquetes corporativos", "Cotizador en línea", "Zonas y tarifas", "Testimonios empresas", "Reserva 24/7"],
    purchasePriceMxn: 24000,
    rentalPriceMxn: 1299,
    Icon: Car,
    preview: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=500&fit=crop&q=80",
  },
  {
    id: "barberia",
    name: "Barbería & Grooming Pro",
    category: "Belleza & Estética",
    description:
      "Sitio premium para barbería: catálogo de servicios filtrable por categoría (corte, barba, tratamientos) con tiempos y precios, galería de trabajos reales, perfiles de barberos con especialidades, reseñas de clientes y sistema de reserva de cita por fecha, hora y barbero.",
    livePath: "/webs/barberia",
    accent: "#64748b",
    gradient: "from-slate-600 to-zinc-900",
    features: ["Catálogo filtrable", "Galería de trabajos", "Perfiles de barberos", "Precios y tiempos", "Reserva de cita", "Reseñas de clientes"],
    purchasePriceMxn: 20000,
    rentalPriceMxn: 1099,
    Icon: Scissors,
    preview: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=500&fit=crop&q=80",
  },
];

export function getRealTemplate(id: string): RealTemplate | null {
  return REAL_TEMPLATES.find((template) => template.id === id) ?? null;
}
