import type { Metadata } from "next";

export type PlataformaLifestyleTemplateId =
  | "boutique"
  | "estudio-foto"
  | "restaurante-completo";

export interface LifestyleMetric {
  value: string;
  label: string;
}

export interface LifestyleCard {
  title: string;
  description: string;
}

export interface PlataformaLifestyleTemplate {
  id: PlataformaLifestyleTemplateId;
  metadata: Metadata;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  backgroundClassName: string;
  showcaseTitle: string;
  showcaseDescription: string;
  metrics: LifestyleMetric[];
  sectionTitle: string;
  sectionDescription: string;
  cards: LifestyleCard[];
  ctaTitle: string;
  ctaDescription: string;
}

export const PLATAFORMA_LIFESTYLE_TEMPLATES: Record<
  PlataformaLifestyleTemplateId,
  PlataformaLifestyleTemplate
> = {
  boutique: {
    id: "boutique",
    metadata: {
      title: "Luna Boutique — Moda Contemporánea",
      description:
        "Boutique de moda con colecciones exclusivas, diseño contemporáneo y atención personalizada.",
    },
    badge: "Nueva colección Primavera 2025",
    title: "Moda que",
    highlight: "te define",
    description:
      "Una plantilla de ecommerce editorial para boutiques, marcas de moda o catálogos premium que necesitan vender con estética, confianza y narrativa visual.",
    primaryLabel: "Ver colecciones",
    primaryHref: "/templates",
    secondaryLabel: "Hablar con Orvenix",
    secondaryHref: "/contacto",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_80%_40%,rgba(212,168,83,0.12),transparent_30%),linear-gradient(180deg,#060606_0%,#0e0e0e_100%)]",
    showcaseTitle: "Showcase de colección",
    showcaseDescription:
      "Bloque visual para productos, líneas de temporada y promociones especiales con tono editorial.",
    metrics: [
      { value: "6+", label: "años en moda" },
      { value: "4", label: "colecciones" },
      { value: "3,800+", label: "clientas" },
      { value: "100%", label: "premium" },
    ],
    sectionTitle: "Base lista para vender con identidad",
    sectionDescription:
      "Ideal para colecciones, productos destacados, historia de marca y newsletter de comunidad.",
    cards: [
      {
        title: "Colecciones",
        description:
          "Espacio para temporadas, cápsulas y lanzamientos con fuerte tratamiento visual.",
      },
      {
        title: "Productos",
        description:
          "Bloques listos para catálogo, precios, badges y beneficios de compra.",
      },
      {
        title: "Historia de marca",
        description:
          "Una sección natural para origen, valores, materiales y diferenciación.",
      },
    ],
    ctaTitle: "¿Quieres usar esta base para una tienda de moda real?",
    ctaDescription:
      "La podemos convertir en catálogo activo, landing editorial o tienda conectada a tu operación.",
  },
  "estudio-foto": {
    id: "estudio-foto",
    metadata: {
      title: "Focal Studio — Fotografía Profesional",
      description:
        "Estudio fotográfico profesional para producto, retrato, eventos y sesiones corporativas.",
    },
    badge: "Monterrey · Estudio propio",
    title: "Imágenes que",
    highlight: "cuentan tu historia",
    description:
      "Una base premium para estudios creativos, fotógrafos, videógrafos o equipos visuales que necesitan mostrar portafolio y vender sesiones con claridad.",
    primaryLabel: "Reservar sesión",
    primaryHref: "/contacto",
    secondaryLabel: "Ver portafolio",
    secondaryHref: "/portafolio",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_80%_35%,rgba(245,158,11,0.12),transparent_28%),linear-gradient(180deg,#040404_0%,#0a0a0a_100%)]",
    showcaseTitle: "Portafolio reciente",
    showcaseDescription:
      "Módulo listo para previews de sesiones, categorías creativas y disponibilidad comercial.",
    metrics: [
      { value: "8+", label: "años" },
      { value: "480+", label: "sesiones" },
      { value: "72h", label: "entrega" },
      { value: "847", label: "fotos 2025" },
    ],
    sectionTitle: "Estructura para servicio creativo y captación",
    sectionDescription:
      "Perfecta para portafolio, servicios, paquetes y preguntas frecuentes de contratación.",
    cards: [
      {
        title: "Servicios visuales",
        description:
          "Base para fotografía de producto, retratos, corporativo, eventos o branding.",
      },
      {
        title: "Portafolio",
        description:
          "Lista para galerías modulares, categorías y proyectos destacados con foco visual.",
      },
      {
        title: "Paquetes y reservas",
        description:
          "Ideal para explicar entregables, tiempos, precios y disponibilidad.",
      },
    ],
    ctaTitle: "¿Quieres convertir esta plantilla en la web de tu estudio?",
    ctaDescription:
      "Podemos adaptarla a tu estilo visual, tus servicios y tu flujo de reservas.",
  },
  "restaurante-completo": {
    id: "restaurante-completo",
    metadata: {
      title: "Fogón & Co. | Cocina de autor en Monterrey",
      description:
        "Restaurante de cocina de autor con menú de temporada, experiencias y reservaciones en línea.",
    },
    badge: "Cocina de autor · Monterrey",
    title: "Tradición",
    highlight: "que sabe a futuro",
    description:
      "Una plantilla pensada para restaurantes, bistrós o conceptos gastronómicos que venden experiencia, chef, carta y reservaciones.",
    primaryLabel: "Reservar mesa",
    primaryHref: "/contacto",
    secondaryLabel: "Ver demos",
    secondaryHref: "/webs",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_60%_40%,rgba(217,119,6,0.12),transparent_30%),linear-gradient(180deg,#0a0806_0%,#100e0a_100%)]",
    showcaseTitle: "Plato insignia",
    showcaseDescription:
      "Hero listo para especialidad de la casa, experiencia del chef y señales de reputación.",
    metrics: [
      { value: "13", label: "años" },
      { value: "86", label: "platillos" },
      { value: "64", label: "vinos" },
      { value: "4.9", label: "reseña" },
    ],
    sectionTitle: "Base gastronómica con foco en experiencia",
    sectionDescription:
      "Ideal para carta, chef, galería, experiencias y reservaciones en un mismo flujo.",
    cards: [
      {
        title: "Carta y especialidades",
        description:
          "Bloques para platos destacados, categorías y estacionalidad del menú.",
      },
      {
        title: "Chef y narrativa",
        description:
          "Espacio para storytelling culinario, técnica y reconocimiento de marca.",
      },
      {
        title: "Reservaciones",
        description:
          "Sección natural para horarios, contacto y experiencia de reserva premium.",
      },
    ],
    ctaTitle: "¿Quieres esta base para un restaurante real?",
    ctaDescription:
      "La podemos adaptar a tu concepto, tu carta y tu flujo de reservaciones.",
  },
};

export function getPlataformaLifestyleTemplate(id: PlataformaLifestyleTemplateId) {
  return PLATAFORMA_LIFESTYLE_TEMPLATES[id];
}
