import type { Metadata } from "next";

export type PlataformaWellnessTemplateId =
  | "clinica-salud"
  | "gimnasio"
  | "spa-bienestar";

export interface WellnessMetric {
  value: string;
  label: string;
}

export interface WellnessCard {
  title: string;
  description: string;
  accent?: string;
}

export interface PlataformaWellnessTemplate {
  id: PlataformaWellnessTemplateId;
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
  cardTitle: string;
  cardSummary: string;
  metrics: WellnessMetric[];
  sectionTitle: string;
  sectionDescription: string;
  cards: WellnessCard[];
  ctaTitle: string;
  ctaDescription: string;
}

export const PLATAFORMA_WELLNESS_TEMPLATES: Record<
  PlataformaWellnessTemplateId,
  PlataformaWellnessTemplate
> = {
  "clinica-salud": {
    id: "clinica-salud",
    metadata: {
      title: "Nova Salud Clínica | Medicina de excelencia",
      description:
        "Clínica médica privada con especialidades, tecnología de vanguardia y enfoque en confianza y atención integral.",
    },
    badge: "18 años de medicina de excelencia",
    title: "Tu salud,",
    highlight: "nuestra prioridad absoluta",
    description:
      "Una plantilla pensada para clínicas, centros médicos y grupos de especialistas que necesitan proyectar confianza, capacidad y atención profesional desde la primera visita.",
    primaryLabel: "Agendar cita",
    primaryHref: "/contacto",
    secondaryLabel: "Ver servicios",
    secondaryHref: "/servicios",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_65%_50%,rgba(20,184,166,0.12),transparent_38%),linear-gradient(180deg,#060c0c_0%,#0a1212_100%)]",
    cardTitle: "Agenda y operación clínica",
    cardSummary:
      "Bloque visual listo para representar citas, especialidades, tecnología y disponibilidad por área.",
    metrics: [
      { value: "22", label: "especialidades" },
      { value: "45", label: "médicos" },
      { value: "24/7", label: "atención digital" },
      { value: "4.9", label: "satisfacción" },
    ],
    sectionTitle: "Áreas listas para adaptar a tu clínica",
    sectionDescription:
      "La estructura está pensada para especialidades, médicos, instalaciones, testimonios y contacto.",
    cards: [
      {
        title: "Especialidades médicas",
        description:
          "Card base para mostrar servicios, líneas de atención o procedimientos prioritarios.",
      },
      {
        title: "Equipo médico",
        description:
          "Espacio para credenciales, perfiles, experiencia y señales de confianza clínica.",
      },
      {
        title: "Instalaciones y tecnología",
        description:
          "Ideal para explicar equipamiento, protocolos y diferenciadores operativos.",
      },
    ],
    ctaTitle: "¿Quieres convertir esta base en la web de tu clínica?",
    ctaDescription:
      "Podemos personalizarla con tus especialidades, médicos, agenda y flujo de captación.",
  },
  gimnasio: {
    id: "gimnasio",
    metadata: {
      title: "Titan Gym — Entrena sin límites",
      description:
        "Gimnasio y centro de fitness con entrenamientos personalizados, clases grupales y membresías flexibles.",
    },
    badge: "Monterrey · Abierto 24/7",
    title: "Entrena",
    highlight: "sin límites",
    description:
      "Una base comercial para gimnasios, boxes o studios fitness que necesitan mostrar intensidad, clases, membresías y comunidad.",
    primaryLabel: "Empezar ahora",
    primaryHref: "/contacto",
    secondaryLabel: "Ver plantillas",
    secondaryHref: "/templates",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_5%_50%,rgba(249,115,22,0.16),transparent_34%),radial-gradient(ellipse_at_95%_30%,rgba(239,68,68,0.1),transparent_28%),linear-gradient(180deg,#05050a_0%,#0c0c14_100%)]",
    cardTitle: "Dashboard del club",
    cardSummary:
      "Módulo visual para aforo, clases, miembros activos y flujo de reservas o check-ins.",
    metrics: [
      { value: "1,240", label: "miembros" },
      { value: "32", label: "clases/semana" },
      { value: "24/7", label: "acceso" },
      { value: "247", label: "entrenando ahora" },
    ],
    sectionTitle: "Bloques para vender energía, resultados y membresías",
    sectionDescription:
      "Sirve para páginas de alto impacto con oferta comercial clara y orientación a conversión.",
    cards: [
      {
        title: "Clases y horarios",
        description:
          "Base para horarios, cupos, intensidad y programación por disciplina.",
      },
      {
        title: "Membresías",
        description:
          "Listo para planes mensuales, beneficios, promociones y comparativas rápidas.",
      },
      {
        title: "Comunidad y prueba social",
        description:
          "Espacio para testimonios, transformación y cultura de entrenamiento.",
      },
    ],
    ctaTitle: "¿Quieres llevar esta plantilla a un gym real?",
    ctaDescription:
      "Podemos adaptarla a tu marca, clases, membresías y sistema de captación.",
  },
  "spa-bienestar": {
    id: "spa-bienestar",
    metadata: {
      title: "Aura Spa & Wellness — Centro de Bienestar",
      description:
        "Centro de spa y bienestar con tratamientos faciales, corporales, masajes y experiencias de relajación.",
    },
    badge: "Centro de bienestar integral",
    title: "Tu momento de",
    highlight: "paz y renovación",
    description:
      "Una plantilla ideal para spas, wellness centers y marcas de cuidado personal que venden experiencia, calma y atención premium.",
    primaryLabel: "Reservar cita",
    primaryHref: "/contacto",
    secondaryLabel: "Explorar demos",
    secondaryHref: "/webs",
    backgroundClassName:
      "bg-[radial-gradient(ellipse_at_15%_40%,rgba(16,185,129,0.14),transparent_34%),radial-gradient(ellipse_at_85%_60%,rgba(251,113,133,0.1),transparent_26%),linear-gradient(180deg,#030d09_0%,#071611_100%)]",
    cardTitle: "Reservas del día",
    cardSummary:
      "Bloque visual para citas, cabinas, tratamientos y horarios disponibles en una experiencia premium.",
    metrics: [
      { value: "4.9", label: "reseñas" },
      { value: "18", label: "rituales" },
      { value: "7", label: "cabinas" },
      { value: "100%", label: "productos orgánicos" },
    ],
    sectionTitle: "Estructura lista para una marca de bienestar",
    sectionDescription:
      "Pensada para vender tratamientos, experiencias, membresías y reservas con tono premium.",
    cards: [
      {
        title: "Tratamientos",
        description:
          "Base para faciales, masajes, terapias corporales o paquetes personalizados.",
      },
      {
        title: "Experiencias",
        description:
          "Perfecta para rituales, day passes, experiencias en pareja o membresías wellness.",
      },
      {
        title: "Reservas y confianza",
        description:
          "Espacio para horarios, testimonios, disponibilidad y diferenciadores de servicio.",
      },
    ],
    ctaTitle: "¿Quieres convertir esta experiencia en un sitio real?",
    ctaDescription:
      "La podemos adaptar a tu spa, cabinas, tratamientos y flujo de reservas.",
  },
};

export function getPlataformaWellnessTemplate(id: PlataformaWellnessTemplateId) {
  return PLATAFORMA_WELLNESS_TEMPLATES[id];
}
