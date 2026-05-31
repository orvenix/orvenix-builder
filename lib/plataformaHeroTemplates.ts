import type { Metadata } from "next";

export type PlataformaHeroTemplateId =
  | "hero-moderno"
  | "servicios-hero"
  | "restaurante-hero"
  | "inmobiliaria-hero";

export interface PlataformaHeroTemplate {
  id: PlataformaHeroTemplateId;
  metadata: Metadata;
  badge?: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  accentClassName: string;
  backgroundClassName: string;
  tags: string[];
}

export const PLATAFORMA_HERO_TEMPLATES: Record<
  PlataformaHeroTemplateId,
  PlataformaHeroTemplate
> = {
  "hero-moderno": {
    id: "hero-moderno",
    metadata: {
      title: "Hero Moderno - Plantilla Orvenix",
      description: "Sección de entrada con título impactante y llamada a la acción",
      openGraph: {
        title: "Hero Moderno - Plantilla Orvenix",
        description: "Sección de entrada con título impactante y llamada a la acción",
        images: ["/img/logo.png"],
      },
    },
    title: "Crea tu presencia digital hoy",
    subtitle:
      "Diseñamos y desarrollamos sitios web que convierten visitantes en clientes. Rápido, moderno y sin complicaciones.",
    ctaLabel: "Empieza gratis",
    ctaHref: "/contacto",
    secondaryLabel: "Ver plantillas",
    secondaryHref: "/templates",
    accentClassName: "from-cyan-400 via-blue-400 to-indigo-400",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.2),transparent_32%),linear-gradient(180deg,#07111f_0%,#0b1220_100%)]",
    tags: ["Hero", "CTA", "Landing", "Moderno"],
  },
  "servicios-hero": {
    id: "servicios-hero",
    metadata: {
      title: "Servicios Hero - Plantilla Orvenix",
      description: "Hero para empresa de servicios profesionales",
      openGraph: {
        title: "Servicios Hero - Plantilla Orvenix",
        description: "Hero para empresa de servicios profesionales",
        images: ["/img/logo.png"],
      },
    },
    badge: "✦ Servicio profesional",
    title: "Expertos en hacer crecer tu negocio",
    subtitle:
      "Más de 10 años de experiencia ayudando a empresas a alcanzar sus objetivos. Consulta gratuita sin compromiso.",
    ctaLabel: "Consulta gratuita",
    ctaHref: "/contacto",
    secondaryLabel: "Ver servicios",
    secondaryHref: "/servicios",
    accentClassName: "from-violet-400 via-fuchsia-400 to-cyan-300",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.22),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.15),transparent_25%),linear-gradient(180deg,#0a0b1f_0%,#11172a_100%)]",
    tags: ["Servicios", "Profesional", "Conversión", "B2B"],
  },
  "restaurante-hero": {
    id: "restaurante-hero",
    metadata: {
      title: "Restaurante Hero - Plantilla Orvenix",
      description: "Hero cálido para restaurante o bar",
      openGraph: {
        title: "Restaurante Hero - Plantilla Orvenix",
        description: "Hero cálido para restaurante o bar",
        images: ["/img/logo.png"],
      },
    },
    badge: "🍽️ Cocina de autor · Desde 1998",
    title: "Una experiencia que va más allá del sabor",
    subtitle:
      "Ingredientes frescos, recetas de temporada y un ambiente único en el corazón de la ciudad.",
    ctaLabel: "Reservar mesa",
    ctaHref: "/contacto",
    secondaryLabel: "Explorar más demos",
    secondaryHref: "/webs",
    accentClassName: "from-amber-300 via-orange-400 to-red-400",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.2),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(251,146,60,0.12),transparent_26%),linear-gradient(180deg,#1a0d08_0%,#25110b_100%)]",
    tags: ["Restaurante", "Reservas", "Hospitality", "Warm"],
  },
  "inmobiliaria-hero": {
    id: "inmobiliaria-hero",
    metadata: {
      title: "Inmobiliaria Hero - Plantilla Orvenix",
      description: "Hero limpio para agencia inmobiliaria",
      openGraph: {
        title: "Inmobiliaria Hero - Plantilla Orvenix",
        description: "Hero limpio para agencia inmobiliaria",
        images: ["/img/logo.png"],
      },
    },
    title: "Encuentra tu hogar ideal",
    subtitle:
      "Más de 1,200 propiedades en las mejores zonas. Te acompañamos en cada paso del proceso.",
    ctaLabel: "Ver propiedades",
    ctaHref: "/contacto",
    secondaryLabel: "Ver portafolio",
    secondaryHref: "/portafolio",
    accentClassName: "from-sky-400 via-blue-500 to-cyan-300",
    backgroundClassName:
      "bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(34,211,238,0.12),transparent_22%),linear-gradient(180deg,#ecf7ff_0%,#f8fbff_100%)]",
    tags: ["Inmobiliaria", "Clean", "Propiedades", "Lead Gen"],
  },
};

export function getPlataformaHeroTemplate(id: PlataformaHeroTemplateId) {
  return PLATAFORMA_HERO_TEMPLATES[id];
}
