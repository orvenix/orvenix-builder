import type { NodeProps } from "@/types/editor"
import type {
  BusinessContentContext,
  ContentAdaptation,
} from "./types"
import { getBusinessLanguage } from "./business-language"

function businessName(context: BusinessContentContext) {
  return context.name?.trim() || "Tu negocio"
}

function locationText(context: BusinessContentContext) {
  return context.location?.trim()
    ? ` en ${context.location.trim()}`
    : ""
}

function industryText(context: BusinessContentContext) {
  return context.industry?.trim() || "servicios profesionales"
}

function heroCopy(context: BusinessContentContext) {
  const language = getBusinessLanguage(context)
  const name = businessName(context)
  const location = context.location?.trim()
  const slug = context.page?.slug ?? "home"

  const locationPhrase =
    location ? ` en ${location}` : ""

  /*
   * PAGE: SERVICIOS
   */
  if (slug === "servicios") {
    return {
      eyebrow: "Servicios",
      title:
        `Conoce nuestros ${language.servicePlural}`,
      description:
        `Encuentra información clara sobre las opciones disponibles y elige la que mejor se adapte a lo que necesitas.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: "Volver al inicio",
    }
  }

  /*
   * PAGE: CONTACTO
   */
  if (slug === "contacto") {
    return {
      eyebrow: "Contacto",
      title:
        "Estamos aquí para ayudarte a dar el siguiente paso",
      description:
        `Comunícate con ${name}${locationPhrase} para resolver dudas, solicitar información o comenzar.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: "Ver servicios",
    }
  }

  /*
   * HOME — DENTAL / SALUD
   */
  if (language.categorySingular === "clínica dental") {
    return {
      eyebrow: "Atención dental profesional",
      title:
        "Cuida tu sonrisa con atención clara y personalizada",
      description:
        `Tratamientos y servicios dentales${locationPhrase} con una experiencia pensada para que cada paso sea claro y sencillo.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: language.secondaryAction,
    }
  }

  /*
   * HOME — RESTAURANTE
   */
  if (language.categorySingular === "restaurante") {
    return {
      eyebrow: "Una experiencia para disfrutar",
      title:
        "Sabores que convierten una comida en un buen recuerdo",
      description:
        `${name}${locationPhrase} combina una propuesta cuidada, atención cercana y una experiencia pensada para compartir.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: language.secondaryAction,
    }
  }

  /*
   * HOME — AGENCIA
   */
  if (language.categorySingular === "agencia") {
    return {
      eyebrow: "Estrategia y ejecución",
      title:
        "Haz crecer tu negocio con una presencia que comunica y convierte",
      description:
        `${name} transforma ideas en soluciones claras, profesionales y orientadas a resultados.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: language.secondaryAction,
    }
  }

  /*
   * HOME — ECOMMERCE
   */
  if (language.categorySingular === "tienda") {
    return {
      eyebrow: "Compra fácil y clara",
      title:
        "Encuentra productos pensados para ti",
      description:
        `${name} ofrece una experiencia de compra visual, sencilla y fácil de recorrer.`,
      primaryCtaLabel: language.primaryAction,
      secondaryCtaLabel: language.secondaryAction,
    }
  }

  return {
    eyebrow: language.categorySingular,
    title:
      `${name}: una forma más clara de presentar lo que haces`,
    description:
      context.description?.trim() ||
      `Conoce nuestros ${language.servicePlural} y encuentra una solución pensada para tus necesidades.`,
    primaryCtaLabel: language.primaryAction,
    secondaryCtaLabel: language.secondaryAction,
  }
}

function adaptHero(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  const copy = heroCopy(context)

  return {
    props: {
      ...props,

      /*
       * Cubrimos variantes de nombres usadas por distintos
       * bloques sin exigir que todos compartan exactamente
       * el mismo schema.
       */
      eyebrow: copy.eyebrow,
      kicker: copy.eyebrow,

      title: copy.title,
      heading: copy.title,

      description: copy.description,
      copy: copy.description,
      subtitle: copy.description,

      ctaLabel: copy.primaryCtaLabel,
      primaryCtaLabel: copy.primaryCtaLabel,
      primaryLabel: copy.primaryCtaLabel,

      secondaryCtaLabel: copy.secondaryCtaLabel,
      secondaryLabel: copy.secondaryCtaLabel,
    },
    notes: [
      "Hero adaptado al tipo de negocio.",
      "No se inventaron estadísticas ni credenciales.",
    ],
  }
}

function adaptNavigation(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  return {
    props: {
      ...props,
      title: businessName(context),
      subtitle:
        context.description?.trim() ||
        industryText(context),
    },
    notes: [
      "Marca de navegación adaptada al negocio.",
    ],
  }
}

function adaptContact(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  const language = getBusinessLanguage(context)

  return {
    props: {
      ...props,
      title: "Hablemos",
      heading: "Da el siguiente paso",
      description:
        `Cuéntanos qué necesitas. Podemos ayudarte con información, dudas o el siguiente paso para ${language.primaryAction.toLowerCase()}.`,
      phone: context.phone,
      whatsapp: context.whatsapp,
      email: context.email,
      address: context.address,
    },
    notes: [
      "Datos de contacto aplicados solo cuando existen.",
    ],
  }
}

function adaptCTA(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  const copy = heroCopy(context)

  return {
    props: {
      ...props,
      label: copy.primaryCtaLabel,
      text: copy.primaryCtaLabel,
      href:
        context.whatsapp
          ? `https://wa.me/${context.whatsapp}`
          : "#contacto",
    },
    notes: [
      "CTA adaptado al objetivo principal.",
    ],
  }
}

function adaptFooter(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  return {
    props: {
      ...props,
      title: businessName(context),
      businessName: businessName(context),
      description:
        context.description?.trim() ||
        industryText(context),
      phone: context.phone,
      email: context.email,
      address: context.address,
    },
    notes: [
      "Footer adaptado a la información disponible.",
    ],
  }
}

function adaptServices(
  props: NodeProps,
  context: BusinessContentContext,
): ContentAdaptation {
  const language = getBusinessLanguage(context)

  return {
    props: {
      ...props,
      eyebrow: "Servicios",
      title:
        `Conoce nuestros ${language.servicePlural}`,
      heading:
        `Conoce nuestros ${language.servicePlural}`,
      description:
        "Explora las principales opciones disponibles y encuentra la que mejor se adapte a tus necesidades.",
    },
    notes: [
      "Encabezado de servicios contextualizado.",
    ],
  }
}

function adaptTestimonials(
  props: NodeProps,
): ContentAdaptation {
  /*
   * No generamos testimonios falsos.
   */
  return {
    props: {
      ...props,
      title: "Experiencias de clientes",
      heading: "Lo que nuestros clientes pueden compartir",
      description:
        "Agrega aquí opiniones reales de clientes cuando estén disponibles.",
    },
    notes: [
      "No se inventaron testimonios.",
      "El bloque queda preparado para contenido real.",
    ],
  }
}

function adaptProcess(
  props: NodeProps,
): ContentAdaptation {
  return {
    props: {
      ...props,
      eyebrow: "Cómo funciona",
      title: "Un proceso claro de principio a fin",
      heading: "Un proceso claro de principio a fin",
    },
    notes: [
      "Proceso contextualizado sin inventar pasos específicos.",
    ],
  }
}

export function adaptBlockContent(params: {
  blockType: string
  props: NodeProps
  business: BusinessContentContext
}): ContentAdaptation {
  const {
    blockType,
    props,
    business,
  } = params

  if (
    blockType.includes("hero")
  ) {
    return adaptHero(props, business)
  }

  if (blockType === "siteNav") {
    return adaptNavigation(props, business)
  }

  if (
    blockType.includes("contact")
  ) {
    return adaptContact(props, business)
  }

  if (
    blockType === "ctaButton" ||
    blockType.includes("cta")
  ) {
    return adaptCTA(props, business)
  }

  if (
    blockType.includes("footer")
  ) {
    return adaptFooter(props, business)
  }

  if (
    blockType.includes("services") ||
    blockType.includes("capabilities")
  ) {
    return adaptServices(props, business)
  }

  if (
    blockType.includes("testimonial")
  ) {
    return adaptTestimonials(props)
  }

  if (
    blockType.includes("process")
  ) {
    return adaptProcess(props)
  }

  return {
    props: {
      ...props,
    },
    notes: [],
  }
}
