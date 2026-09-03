import type { OrvenixAIContext } from "../types"
import {
  selectBlocksForRoles,
  type SectionRole,
} from "./block-selector"

export interface OrvenixSiteSectionPlan {
  role: SectionRole
  blockType: string | null
  purpose: string
}

export interface OrvenixSitePagePlan {
  name: string
  slug: string
  purpose: string
  sections: OrvenixSiteSectionPlan[]
}

export interface OrvenixSiteArchitecture {
  siteType: string
  industry: string
  objective: string
  pages: OrvenixSitePagePlan[]
}

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

function inferSiteType(context: OrvenixAIContext) {
  const text = normalize(
    [
      context.business?.industry,
      context.business?.description,
      context.request,
    ].join(" "),
  )

  if (
    text.includes("clinica") ||
    text.includes("dent") ||
    text.includes("salud") ||
    text.includes("doctor")
  ) {
    return "health"
  }

  if (
    text.includes("restaurante") ||
    text.includes("cafeteria") ||
    text.includes("comida")
  ) {
    return "restaurant"
  }

  if (
    text.includes("agencia") ||
    text.includes("marketing")
  ) {
    return "agency"
  }

  if (
    text.includes("tienda") ||
    text.includes("ecommerce") ||
    text.includes("producto")
  ) {
    return "ecommerce"
  }

  return "business"
}

function purposeForRole(role: SectionRole): string {
  const purposes: Record<SectionRole, string> = {
    navigation: "Permitir navegar el sitio.",
    hero: "Explicar la propuesta de valor y provocar la acción principal.",
    trust: "Aumentar confianza.",
    services: "Explicar la oferta principal.",
    features: "Mostrar beneficios y capacidades.",
    gallery: "Mostrar ejemplos visuales.",
    products: "Presentar productos.",
    pricing: "Explicar precios o planes.",
    testimonials: "Aportar prueba social.",
    process: "Explicar cómo funciona.",
    faq: "Resolver objeciones.",
    contact: "Facilitar contacto.",
    cta: "Cerrar con una acción clara.",
    footer: "Cerrar navegación y datos del sitio.",
    content: "Presentar información.",
  }

  return purposes[role]
}

function makePage(
  siteType: string,
  name: string,
  slug: string,
  purpose: string,
  roles: SectionRole[],
): OrvenixSitePagePlan {
  const selected = selectBlocksForRoles(
    roles,
    undefined,
    {
      siteType,
    },
  )

  return {
    name,
    slug,
    purpose,
    sections: roles.map((role) => {
      const match = selected.find(
        (item) => item.role === role,
      )

      return {
        role,
        blockType: match?.blockType ?? null,
        purpose: purposeForRole(role),
      }
    }),
  }
}

export function buildSiteArchitecture(
  context: OrvenixAIContext,
): OrvenixSiteArchitecture {
  const siteType = inferSiteType(context)

  if (siteType === "health") {
    return {
      siteType,
      industry: context.business?.industry ?? "salud",
      objective: "Conseguir citas y generar confianza",
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la clínica y conseguir citas.",
          [
            "navigation",
            "hero",
            "trust",
            "services",
            "process",
            "testimonials",
            "faq",
            "contact",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Servicios",
          "servicios",
          "Explicar tratamientos y servicios.",
          [
            "navigation",
            "hero",
            "services",
            "faq",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Contacto",
          "contacto",
          "Facilitar una cita.",
          [
            "navigation",
            "contact",
            "footer",
          ],
        ),
      ],
    }
  }

  if (siteType === "restaurant") {
    return {
      siteType,
      industry: context.business?.industry ?? "restaurante",
      objective: "Conseguir reservaciones y visitas",
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar el restaurante.",
          [
            "navigation",
            "hero",
            "trust",
            "features",
            "gallery",
            "testimonials",
            "contact",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Menú",
          "menu",
          "Presentar alimentos y bebidas.",
          [
            "navigation",
            "hero",
            "content",
            "gallery",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Contacto",
          "contacto",
          "Mostrar ubicación y reservaciones.",
          [
            "navigation",
            "contact",
            "footer",
          ],
        ),
      ],
    }
  }

  if (siteType === "agency") {
    return {
      siteType,
      industry: context.business?.industry ?? "agencia",
      objective: "Conseguir prospectos",
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar posicionamiento y servicios.",
          [
            "navigation",
            "hero",
            "trust",
            "services",
            "gallery",
            "process",
            "testimonials",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Servicios",
          "servicios",
          "Explicar capacidades.",
          [
            "navigation",
            "hero",
            "services",
            "process",
            "faq",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Contacto",
          "contacto",
          "Generar oportunidades.",
          [
            "navigation",
            "contact",
            "footer",
          ],
        ),
      ],
    }
  }

  if (siteType === "ecommerce") {
    return {
      siteType,
      industry: context.business?.industry ?? "ecommerce",
      objective: "Vender productos",
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la marca y llevar al catálogo.",
          [
            "navigation",
            "hero",
            "trust",
            "products",
            "features",
            "testimonials",
            "cta",
            "footer",
          ],
        ),
        makePage(siteType,
          "Productos",
          "productos",
          "Presentar el catálogo.",
          [
            "navigation",
            "products",
            "trust",
            "footer",
          ],
        ),
      ],
    }
  }

  return {
    siteType: "business",
    industry: context.business?.industry ?? "negocio",
    objective: "Presentar el negocio y generar contactos",
    pages: [
      makePage(siteType,
        "Inicio",
        "home",
        "Presentar el negocio.",
        [
          "navigation",
          "hero",
          "trust",
          "services",
          "features",
          "testimonials",
          "faq",
          "contact",
          "cta",
          "footer",
        ],
      ),
      makePage(siteType,
        "Servicios",
        "servicios",
        "Explicar la oferta.",
        [
          "navigation",
          "hero",
          "services",
          "process",
          "faq",
          "cta",
          "footer",
        ],
      ),
      makePage(siteType,
        "Contacto",
        "contacto",
        "Facilitar el contacto.",
        [
          "navigation",
          "contact",
          "footer",
        ],
      ),
    ],
  }
}
