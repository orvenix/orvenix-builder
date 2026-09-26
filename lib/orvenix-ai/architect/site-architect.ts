import type { OrvenixAIContext } from "../types"
import { inferVisualFamily } from "../theme/visual-direction"
import {
  selectBlocksForRoles,
  type SectionRole,
} from "./block-selector"
import type { PageArchetype } from "./page-archetype"
import {
  buildRoleConstraints,
  resolveArchitectureStrategy,
  validateRoleSequence,
  type ArchitectureSelectionContext,
} from "./architecture-selector"
import type {
  ArchitectureEvidenceSignals,
  ArchitectureGroundingSignals,
  ArchitectureReferenceSignal,
  ArchitectureStrategy,
} from "./architecture-grammar"
import type { SectionInstancePlan } from "./composition-plan"

export interface OrvenixSiteSectionPlan {
  role: SectionRole
  blockType: string | null
  purpose: string
  /**
   * V2-6.1: optional Composition Plan instance directive for this exact
   * section (see composition-plan.ts). Absent -> the section behaves
   * exactly as every pre-V2-6.1 caller already gets (composeSection(role,
   * context) against the full, unsliced business context). When present,
   * `instance.role` MUST equal this section's own `role` -- the compiler
   * does not currently reconcile a mismatch, it simply prefers `role`
   * above and applies the instance's selection/composition on top of it.
   */
  instance?: SectionInstancePlan
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
  /**
   * V2-6: the resolved, explainable Adaptive Architecture decision behind
   * this site's Home page composition (see architecture-grammar.ts /
   * architecture-selector.ts). Optional and purely additive -- absence
   * changes nothing for any existing consumer; `sections`/`pages` above
   * remain the single ordered-role shape every downstream system already
   * consumes.
   */
  architectureStrategy?: ArchitectureStrategy
}

/**
 * V2-6: bounded, additive extras `buildSiteArchitecture` MAY receive on top
 * of the OrvenixAIContext it already takes. Every existing call site keeps
 * compiling and behaving byte-identically without ever passing this --
 * absence means "not evaluated" (preserve pre-V2-6 behavior), never "known
 * to be false". Deliberately excludes raw evidence/raw testimonials/PII:
 * `businessEvidenceSummary` is the same bounded count/boolean shape as
 * site-creation/evidence-normalization.ts's BusinessEvidenceSummaryV1
 * (decoupled locally, same pattern already used by
 * creative-director/contract.ts's CreativeDirectorBusinessEvidenceSummaryV1).
 */
export interface ArchitectureSelectionExtras {
  businessEvidenceSummary?: ArchitectureEvidenceSignals
  /** Bounded, per-dimension reference contributions -- see architecture-grammar.ts. */
  designReferences?: ArchitectureReferenceSignal[]
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

/**
 * V2-6 Adaptive Architecture MVP: resolves ArchitectureStrategy once per
 * site (never per page -- the strategy describes the SITE's Home
 * composition; secondary pages keep their own existing, page-purpose-
 * specific recipes untouched, see buildSiteArchitecture below) from the
 * same normalized business facts inferSiteType/hasPricingSignal already
 * use, plus VisualFamily (theme/visual-direction.ts's OWN industry-text
 * inference -- reused here as an ADDITIONAL architecture signal; that
 * module's role as the sole THEME authority is unchanged) and the caller's
 * optional evidence/reference extras. Deliberately never reads
 * context.business?.name -- see ArchitectureSelectionContext's own
 * "business name and slug must remain non-influential" invariant.
 */
function resolveHomeArchitecture(
  context: OrvenixAIContext,
  siteType: string,
  pricingSignal: boolean,
  extras: ArchitectureSelectionExtras | undefined,
) {
  const business = context.business
  const visualFamily = inferVisualFamily({
    industry: business?.industry,
    description: business?.description,
    services: business?.services,
    siteTypeHint: siteType,
  })

  const selectionContext: ArchitectureSelectionContext = {
    siteType,
    industry: business?.industry,
    description: business?.description,
    objective: business?.objective,
    audience: business?.audience,
    visualFamily,
    services: business?.services,
    products: business?.products,
    pricingSignal,
    evidence: extras?.businessEvidenceSummary,
    pagePurpose: "home",
    references: extras?.designReferences,
  }

  const strategy = resolveArchitectureStrategy(selectionContext)

  const grounding: ArchitectureGroundingSignals = {
    siteType,
    hasServices: Boolean(business?.services?.length),
    hasProducts: Boolean(business?.products?.length),
    pricingSignal,
    evidence: extras?.businessEvidenceSummary,
  }

  const constraints = buildRoleConstraints(strategy, grounding)

  return { strategy, constraints, grounding }
}

/**
 * Assembles the Home page's ordered SectionRole[] from a resolved
 * ArchitectureStrategy + its grounding-aware constraints. Every role added
 * here is gated on NOT being in `constraints.forbiddenRoles` -- the
 * constraint model is consulted, not decorative. Falls back to
 * `legacyRoles` (this siteType's pre-V2-6 literal recipe) whenever the
 * assembled sequence fails `validateRoleSequence`, so an unexpected
 * strategy combination degrades to a known-safe baseline instead of ever
 * producing a broken page.
 */
function assembleHomeRoles(
  strategy: ArchitectureStrategy,
  constraints: ReturnType<typeof buildRoleConstraints>,
  grounding: ArchitectureGroundingSignals,
  legacyRoles: SectionRole[],
): SectionRole[] {
  const forbidden = new Set(constraints.forbiddenRoles)
  const allowed = (role: SectionRole) => !forbidden.has(role)

  const roles: SectionRole[] = ["navigation"]

  if (allowed("hero")) roles.push("hero")

  if (strategy.trustPlacement === "early" && allowed("trust")) roles.push("trust")

  const coreRole = constraints.requiredRoles.find((role): role is SectionRole =>
    (["services", "products", "gallery", "content"] as SectionRole[]).includes(role),
  )
  if (coreRole && !roles.includes(coreRole)) roles.push(coreRole)

  if (strategy.trustPlacement === "embedded" && allowed("trust")) roles.push("trust")

  if (strategy.bodyTopology === "alternating" && allowed("features") && !roles.includes("features")) roles.push("features")
  if (strategy.bodyTopology === "showcase" && allowed("gallery") && !roles.includes("gallery")) roles.push("gallery")
  if (strategy.bodyTopology === "clustered" && allowed("features") && !roles.includes("features")) roles.push("features")
  if (strategy.bodyTopology === "catalog" && grounding.hasProducts && allowed("products") && !roles.includes("products")) {
    roles.push("products")
  }

  if (
    (strategy.narrative === "authority-led" || strategy.narrative === "service-led" || strategy.narrative === "event-led") &&
    allowed("process")
  ) {
    roles.push("process")
  }

  if (constraints.optionalRoles.includes("testimonials") && allowed("testimonials")) roles.push("testimonials")

  if (strategy.trustPlacement === "late" && allowed("trust") && !roles.includes("trust")) roles.push("trust")

  if ((strategy.narrative === "authority-led" || strategy.narrative === "service-led") && allowed("faq")) roles.push("faq")

  if (strategy.closing === "pricing" && grounding.pricingSignal && allowed("pricing")) roles.push("pricing")

  if ((strategy.closing === "contact" || strategy.closing === "booking" || strategy.closing === "donation") && allowed("contact")) {
    roles.push("contact")
  }

  roles.push("cta")
  roles.push("footer")

  return validateRoleSequence(roles, constraints) ? roles : legacyRoles
}

export function buildSiteArchitecture(
  context: OrvenixAIContext,
  extras?: ArchitectureSelectionExtras,
): OrvenixSiteArchitecture {
  const siteType = inferSiteType(context)
  const pricingSignal = hasPricingSignal(context)
  const { strategy, constraints, grounding } = resolveHomeArchitecture(context, siteType, pricingSignal, extras)
  const homeRoles = (legacyRoles: SectionRole[]) => assembleHomeRoles(strategy, constraints, grounding, legacyRoles)

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
      architectureStrategy: strategy,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la clínica y conseguir citas.",
          "overview",
          homeRoles([
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
          ]),
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
      architectureStrategy: strategy,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar el restaurante.",
          "overview",
          homeRoles([
            "navigation",
            "hero",
            "trust",
            "features",
            "gallery",
            "testimonials",
            "contact",
            "cta",
            "footer",
          ]),
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
      architectureStrategy: strategy,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar posicionamiento y servicios.",
          "overview",
          homeRoles([
            "navigation",
            "hero",
            "trust",
            "services",
            "gallery",
            "process",
            "testimonials",
            "cta",
            "footer",
          ]),
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
      architectureStrategy: strategy,
      pages: [
        makePage(siteType,
          "Inicio",
          "home",
          "Presentar la marca y llevar al catálogo.",
          "overview",
          homeRoles([
            "navigation",
            "hero",
            "trust",
            "products",
            "features",
            "testimonials",
            "cta",
            "footer",
          ]),
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
    architectureStrategy: strategy,
    pages: [
      makePage(siteType,
        "Inicio",
        "home",
        "Presentar el negocio.",
        "overview",
        homeRoles([
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
        ]),
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
