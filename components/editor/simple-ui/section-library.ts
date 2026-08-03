import {
  BriefcaseBusiness,
  Building2,
  GalleryHorizontal,
  Home,
  Mail,
  MessageSquareQuote,
  Package,
  PanelBottom,
  Sparkles,
} from "lucide-react"

import type {
  SimpleEditorSectionDefinition,
  SimplePageSection,
} from "./section-model"

export const SIMPLE_SECTION_LIBRARY: SimpleEditorSectionDefinition[] = [
  {
    id: "hero",
    type: "hero",
    name: "Portada",
    description: "Presenta tu negocio de forma profesional.",
    category: "essential",
    icon: Home,
  },
  {
    id: "services",
    type: "services",
    name: "Servicios",
    description: "Explica qué haces y cómo ayudas.",
    category: "business",
    icon: BriefcaseBusiness,
  },
  {
    id: "products",
    type: "products",
    name: "Productos",
    description: "Muestra tus productos y aumenta ventas.",
    category: "store",
    icon: Package,
  },
  {
    id: "about",
    type: "about",
    name: "Nosotros",
    description: "Cuenta la historia de tu negocio.",
    category: "business",
    icon: Building2,
  },
  {
    id: "gallery",
    type: "gallery",
    name: "Galería",
    description: "Muestra tus trabajos con imágenes.",
    category: "content",
    icon: GalleryHorizontal,
  },
  {
    id: "testimonials",
    type: "testimonials",
    name: "Opiniones",
    description: "Genera confianza con testimonios.",
    category: "content",
    icon: MessageSquareQuote,
  },
  {
    id: "contact",
    type: "contact",
    name: "Contacto",
    description: "Facilita que tus clientes te encuentren.",
    category: "contact",
    icon: Mail,
  },
  {
    id: "footer",
    type: "footer",
    name: "Pie de página",
    description: "Añade enlaces y datos importantes.",
    category: "essential",
    icon: PanelBottom,
  },
]

function presetSection(
  type: SimplePageSection["type"],
  name: string,
  content: SimplePageSection["content"],
): SimplePageSection {
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    name,
    visible: true,
    content,
  }
}

export function createBusinessPreset(): SimplePageSection[] {
  return [
    presetSection("hero", "Portada", {
      eyebrow: "Tu negocio, más lejos",
      title: "Creamos soluciones para hacer crecer tu empresa",
      description:
        "Presenta tu propuesta de valor de forma clara, moderna y profesional.",
      buttonLabel: "Conocer servicios",
    }),
    presetSection("services", "Servicios", {
      eyebrow: "Lo que hacemos",
      title: "Servicios para impulsar tu negocio",
      description:
        "Explica claramente cómo puedes ayudar a tus clientes.",
    }),
    presetSection("about", "Nosotros", {
      title: "Conoce nuestra historia",
      description:
        "Comparte quién eres, qué haces y por qué tus clientes pueden confiar en ti.",
    }),
    presetSection("benefits", "Beneficios", {
      title: "Por qué elegirnos",
      description:
        "Destaca las principales ventajas de trabajar con tu negocio.",
    }),
    presetSection("testimonials", "Opiniones", {
      title: "Lo que dicen nuestros clientes",
      description:
        "Genera confianza mostrando experiencias reales.",
    }),
    presetSection("contact", "Contacto", {
      title: "Hablemos de tu proyecto",
      description:
        "Facilita que tus clientes se comuniquen contigo.",
    }),
    presetSection("footer", "Pie de página", {
      title: "Tu negocio",
      description:
        "Información, enlaces importantes y formas de contacto.",
    }),
  ]
}

export function getSectionDefinition(
  type: SimplePageSection["type"],
): SimpleEditorSectionDefinition | undefined {
  return SIMPLE_SECTION_LIBRARY.find((section) => section.type === type)
}

export const EMPTY_SECTION_ICON = Sparkles
