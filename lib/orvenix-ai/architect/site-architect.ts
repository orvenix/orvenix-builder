import type { OrvenixAIContext } from "../types"
import {
  selectBlocksForRoles,
  type SectionRole,
} from "./block-selector"
import type { PageArchetype } from "./page-archetype"

export interface OrvenixSiteSectionPlan {
  role: SectionRole
  blockType: string | null
  purpose: string
}

export interface OrvenixSitePagePlan {
  name: string
  slug: string
  purpose: string
  archetype: PageArchetype
  sections: OrvenixSiteSectionPlan[]
}

export interface OrvenixSiteArchitecture {
  siteType: string
  industry: string
  objective: string
  pages: OrvenixSitePagePlan[]
  businessName?: string
  services?: Array<{ name: string; description?: string }>
  location?: string
  /**
   * The real, caller-supplied business objective (eg. "Conseguir citas de
   * valoración"), kept separate from `objective` above -- which is an
   * internal, siteType-driven page-intent string used for page.purpose /
   * trace text and must not change. Composition-time copy generation
   * should prefer this field when it wants the business's actual stated
   * intent.
   */
  businessObjective?: string
}

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

/**
 * True when `keyword` starts a word inside `text` (eg. "dent" matches
 * "dental"/"dentista"). Plain String.includes() would ALSO match "dent"
 * inside "identidad", "residente", "presidente", "accidente" -- ordinary
 * words with no relation to dentistry -- silently misrouting an unrelated
 * business into the wrong architecture branch. Requiring a word-start
 * boundary keeps every intended prefix match (the keywords below are all
 * meant to catch a word BEGINNING with them, eg. plural/derived forms)
 * while rejecting the keyword appearing mid-word.
 */
function startsWordIn(text: string, keyword: string): boolean {
  return new RegExp(`\\b${keyword}`).test(text)
}

function inferSiteType(context: OrvenixAIContext) {
  const text = normalize(
    [
      context.business?.industry,
      context.business?.description,
      context.request,
    ].join(" "),
  )

  const has = (keyword: string) => startsWordIn(text, keyword)

  if (
    has("clinica") ||
    has("dent") ||
    has("salud") ||
    has("doctor")
  ) {
    return "health"
  }

  if (
    has("restaurante") ||
    has("cafeteria") ||
    has("comida")
  ) {
    return "restaurant"
  }

  if (
    has("agencia") ||
    has("marketing")
  ) {
    return "agency"
  }

  if (
    has("tienda") ||
    has("ecommerce") ||
    has("producto")
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
  archetype: PageArchetype,
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
    archetype,
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
      businessName: context.business?.name,
      services: context.business?.services,
      location: context.business?.location,
      businessObjective: context.business?.objective,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la clínica y conseguir citas.",
          "overview",
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
          "catalog",
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
          "conversion",
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
      businessName: context.business?.name,
      services: context.business?.services,
      location: context.business?.location,
      businessObjective: context.business?.objective,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar el restaurante.",
          "overview",
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
          "catalog",
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
          "conversion",
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
      businessName: context.business?.name,
      services: context.business?.services,
      location: context.business?.location,
      businessObjective: context.business?.objective,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar posicionamiento y servicios.",
          "overview",
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
          "catalog",
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
          "conversion",
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
      businessName: context.business?.name,
      services: context.business?.services,
      location: context.business?.location,
      businessObjective: context.business?.objective,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la marca y llevar al catálogo.",
          "overview",
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
          "catalog",
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
    businessName: context.business?.name,
    services: context.business?.services,
    location: context.business?.location,
    businessObjective: context.business?.objective,
    pages: [
      makePage(siteType,
        "Inicio",
        "home",
        "Presentar el negocio.",
        "overview",
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
        "catalog",
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
        "conversion",
        [
          "navigation",
          "contact",
          "footer",
        ],
      ),
    ],
  }
}
