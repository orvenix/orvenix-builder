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
  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. */
  products?: Array<{ name: string; description?: string }>
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

/**
 * Shared, normalized classification text -- the same real, structured
 * signals inferSiteType has always used (industry/description/request/
 * real service+product names), extracted so a second classifier
 * (hasPricingSignal, V2-5G) can reuse it without re-deriving or
 * diverging from what inferSiteType itself sees.
 */
function classificationText(context: OrvenixAIContext): string {
  return normalize(
    [
      context.business?.industry,
      context.business?.description,
      context.request,
      /*
       * Site-type follow-up (fisioterapia_not_health): explicit, structured
       * service/product NAMES are already on this same context object --
       * no new plumbing, no architectural change -- and are just as
       * legitimate a factual signal as industry/description/request. A
       * business whose only mention of what it does lives in a real
       * service name (not the free-text industry/description fields) was
       * previously invisible to this classifier.
       */
      ...(context.business?.services ?? []).map((service) => service.name),
      ...(context.business?.products ?? []).map((product) => product.name),
    ].join(" "),
  )
}

/**
 * True when `word` appears as a COMPLETE word in `text` -- unlike
 * startsWordIn (a deliberate PREFIX match used for stemming, eg. "dent"
 * catching "dentista"), this requires both boundaries. Pricing-signal
 * tokens need this stricter form: a prefix match on "precio" would also
 * catch "precioso"/"preciosa" ("precious"), and on "plan" would catch
 * "planta"/"planificacion"/"planear" -- ordinary words with nothing to do
 * with a pricing plan. Whole-word matching on the more specific plural
 * "planes" avoids that collision entirely.
 */
function hasWholeWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(text)
}

/**
 * V2-5G: PRICING MUST REQUIRE A POSITIVE SEMANTIC SIGNAL. Being classified
 * "agency" (or any other siteType) is never sufficient by itself -- an
 * ordinary creative/marketing agency or consultancy with no pricing/plan/
 * package/subscription mention must not receive a pricing section merely
 * for existing. Bounded, deterministic, resolved BEFORE any composition
 * step (never depends on Creative Director output). Deliberately excludes
 * the bare stem "plan" (see hasWholeWord's doc comment) and any other
 * single ambiguous word -- every token here is specific enough that its
 * ordinary Spanish/English meaning IS a pricing/plan/package/subscription
 * concept.
 */
function hasPricingSignal(context: OrvenixAIContext): boolean {
  const text = classificationText(context)
  const tokens = [
    "precio",
    "precios",
    "planes",
    "paquete",
    "paquetes",
    "suscripcion",
    "suscripciones",
    "subscription",
    "subscriptions",
    "membresia",
    "membresias",
    "membership",
    "memberships",
    "tarifa",
    "tarifas",
  ]
  return tokens.some((token) => hasWholeWord(text, token))
}

function inferSiteType(context: OrvenixAIContext) {
  const text = classificationText(context)

  const has = (keyword: string) => startsWordIn(text, keyword)

  if (
    has("clinica") ||
    has("dent") ||
    has("salud") ||
    has("doctor") ||
    /*
     * "fisioterap" is a single shared prefix for "fisioterapia",
     * "fisioterapeuta"/"fisioterapeutas", and "fisioterapéutico"/
     * "fisioterapéutica" (normalized "fisioterapeutico"/-a) -- the same
     * startsWordIn word-START mechanism already used for "dent" above, so
     * "identidad" (which merely CONTAINS "dent" mid-word) stays excluded
     * and, symmetrically, any word merely containing "fisioterap" or
     * "terapia" mid-word would too. Deliberately NOT adding the broader,
     * ambiguous "terapia"/"rehabilitacion" alone: both appear in real
     * non-medical contexts (eg. "terapia de pareja", generic "risoterapia"/
     * "musicoterapia" wellness branding) -- see the adversarial regression
     * tests for both directions.
     */
    has("fisioterap")
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
  const pricingSignal = hasPricingSignal(context)

  if (siteType === "health") {
    return {
      siteType,
      industry: context.business?.industry ?? "salud",
      objective: "Conseguir citas y generar confianza",
      businessName: context.business?.name,
      services: context.business?.services,
      products: context.business?.products,
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
      products: context.business?.products,
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
            /*
             * V2-S1: "products" (not "content") so real, business-supplied
             * dish/menu items (business.products) render as the page's
             * actual offering surface instead of generic editorial filler
             * cards. Scoped to the restaurant siteType branch itself --
             * an architecture/siteType rule, not a slug/business-name
             * check -- so every restaurant gets this, not just one fixture.
             */
            "navigation",
            "hero",
            "products",
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
      products: context.business?.products,
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
            /*
             * V2-5G: PRICING MUST REQUIRE A POSITIVE SEMANTIC SIGNAL.
             * Being an "agency" is never sufficient by itself -- an
             * ordinary creative/marketing agency with no pricing/plan/
             * package/subscription mention (hasPricingSignal, above)
             * must not receive a pricing section just because the role
             * exists on this recipe. Health/restaurant/ecommerce recipes
             * are deliberately untouched regardless of any signal --
             * pricing must not appear on a clinic or menu page.
             */
            "navigation",
            "hero",
            "services",
            "process",
            ...(pricingSignal ? (["pricing"] as const) : []),
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
      products: context.business?.products,
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
            "cta",
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
    products: context.business?.products,
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
          /*
           * V2-5G: same positive-signal gate as the agency recipe above --
           * covers a generic "business" classification (eg. a SaaS/
           * subscription/package request that doesn't contain any
           * agency/health/restaurant/ecommerce keyword) that has a real
           * pricing/plan/package/subscription mention.
           */
          "navigation",
          "hero",
          "services",
          "process",
          ...(pricingSignal ? (["pricing"] as const) : []),
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
