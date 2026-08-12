interface FriendlyBlockLanguage {
  label: string
  description: string
}

const FRIENDLY_BLOCK_LANGUAGE: Record<string, FriendlyBlockLanguage> = {
  hero: {
    label: "Portada",
    description: "Presenta tu negocio y explica qué lo hace especial.",
  },
  heading: {
    label: "Título",
    description: "Destaca una idea importante de tu página.",
  },
  text: {
    label: "Texto",
    description: "Agrega información clara para tus visitantes.",
  },
  image: {
    label: "Imagen",
    description: "Muestra tu trabajo, producto o equipo.",
  },
  button: {
    label: "Botón",
    description: "Invita al visitante a realizar una acción.",
  },
  services: {
    label: "Servicios",
    description: "Explica lo que ofreces y cómo puedes ayudar.",
  },
  testimonials: {
    label: "Opiniones",
    description: "Genera confianza mostrando experiencias reales.",
  },
  gallery: {
    label: "Galería",
    description: "Muestra fotografías, productos o proyectos.",
  },
  contact: {
    label: "Contacto",
    description: "Facilita que las personas puedan comunicarse contigo.",
  },
  cta: {
    label: "Invitación",
    description: "Anima al visitante a dar el siguiente paso.",
  },
  pricing: {
    label: "Precios",
    description: "Presenta planes, paquetes o formas de contratarte.",
  },
  faq: {
    label: "Preguntas frecuentes",
    description: "Responde las dudas más comunes de tus clientes.",
  },
  navbar: {
    label: "Menú",
    description: "Ayuda a las personas a recorrer tu sitio.",
  },
  footer: {
    label: "Pie de página",
    description: "Agrega enlaces, contacto e información final.",
  },
}

export function getFriendlyBlockLanguage(
  type: string,
  fallbackLabel: string,
  fallbackDescription?: string,
): FriendlyBlockLanguage {
  const normalizedType = type.toLowerCase()

  const directMatch = FRIENDLY_BLOCK_LANGUAGE[normalizedType]

  if (directMatch) {
    return directMatch
  }

  const partialMatch = Object.entries(FRIENDLY_BLOCK_LANGUAGE).find(
    ([key]) => normalizedType.includes(key),
  )

  if (partialMatch) {
    return partialMatch[1]
  }

  return {
    label: fallbackLabel,
    description:
      fallbackDescription?.trim() ||
      "Agrega este contenido y personalízalo para tu proyecto.",
  }
}
