import {
  getBlockCapabilities,
  type OrvenixBlockCapability,
} from "@/lib/orvenix-ai/capabilities"

export type SectionRole =
  | "navigation"
  | "hero"
  | "trust"
  | "services"
  | "features"
  | "gallery"
  | "products"
  | "pricing"
  | "testimonials"
  | "process"
  | "faq"
  | "contact"
  | "cta"
  | "footer"
  | "content"

export interface BlockSelectionContext {
  siteType?: string
  industry?: string
  objective?: string
}

export interface BlockSelection {
  role: SectionRole
  blockType: string
  score: number
  reason: string
}

type RoleProfile = {
  keywords: string[]
  preferredTypes?: string[]
  preferredCategories?: string[]
  forbiddenKeywords?: string[]
  forbiddenCategories?: string[]
  minimumScore?: number
}

const PRIMITIVE_TYPES = new Set([
  "section",
  "heading",
  "text",
  "image",
  "ctaButton",
  "genericWrapper",
])

const COMPOSITE_ROLES = new Set<SectionRole>([
  "hero",
  "trust",
  "services",
  "features",
  "gallery",
  "products",
  "pricing",
  "testimonials",
  "process",
  "faq",
  "contact",
  "footer",
])

const ROLE_PROFILES: Record<SectionRole, RoleProfile> = {
  navigation: {
    keywords: ["nav", "navigation", "menu"],
    preferredTypes: ["siteNav"],
    preferredCategories: ["layout"],
    minimumScore: 40,
  },

  hero: {
    keywords: ["hero", "portada"],
    preferredTypes: [
      "landing-hero",
      "agency-hero",
      "modular-hero",
    ],
    forbiddenKeywords: [
      "stats",
      "pricing",
      "testimonial",
      "footer",
    ],
    minimumScore: 45,
  },

  trust: {
    keywords: [
      "trust",
      "credibility",
      "logos",
      "social proof",
      "confidence",
    ],
    preferredTypes: [
      "modular-trust-bar",
    ],
    forbiddenKeywords: [
      "pricing",
      "product",
      "pipeline",
      "kanban",
      "transaction",
    ],
    forbiddenCategories: [
      "finance",
      "crm",
      "productivity",
      "devops",
      "hr",
    ],
    minimumScore: 55,
  },

  services: {
    keywords: [
      "services",
      "service",
      "servicio",
      "capabilities",
    ],
    preferredTypes: [
      "agency-services",
      "modular-capabilities",
    ],
    forbiddenKeywords: [
      "stats",
      "testimonial",
      "pricing",
    ],
    minimumScore: 50,
  },

  features: {
    keywords: [
      "features",
      "feature",
      "benefits",
      "capabilities",
    ],
    preferredTypes: [
      "landing-features",
      "modular-capabilities",
    ],
    forbiddenKeywords: [
      "stats",
      "footer",
      "testimonial",
    ],
    minimumScore: 50,
  },

  gallery: {
    keywords: [
      "gallery",
      "portfolio",
      "showcase",
      "projects",
      "images",
      "media",
    ],
    preferredCategories: [
      "media",
      "portfolio",
    ],
    forbiddenKeywords: [
      "stats",
      "metric",
      "finance",
      "transaction",
      "pricing",
      "pipeline",
      "kanban",
    ],
    forbiddenCategories: [
      "finance",
      "analytics",
      "crm",
      "productivity",
      "devops",
      "hr",
    ],
    minimumScore: 65,
  },

  products: {
    keywords: [
      "product",
      "products",
      "catalog",
      "store",
      "ecommerce",
    ],
    preferredTypes: [
      "ec-product-grid",
      "store-product-grid",
      "store-product-card",
    ],
    preferredCategories: ["ecommerce"],
    forbiddenKeywords: [
      "stats",
      "cart-button",
      "cart-drawer",
    ],
    minimumScore: 55,
  },

  pricing: {
    keywords: [
      "pricing",
      "price",
      "plans",
    ],
    preferredTypes: [
      "landing-pricing",
      "saas-pricing",
    ],
    forbiddenKeywords: [
      "stats",
      "transaction",
    ],
    minimumScore: 50,
  },

  testimonials: {
    keywords: [
      "testimonial",
      "testimonials",
      "review",
      "reviews",
    ],
    preferredTypes: [
      "landing-testimonials",
      "agency-testimonials",
    ],
    forbiddenCategories: [
      "finance",
      "crm",
      "productivity",
    ],
    minimumScore: 50,
  },

  process: {
    keywords: [
      "process",
      "workflow",
      "steps",
      "proceso",
    ],
    preferredTypes: [
      "modular-process",
    ],
    forbiddenKeywords: [
      "pipeline",
      "kanban",
      "transaction",
    ],
    forbiddenCategories: [
      "crm",
      "productivity",
      "finance",
    ],
    minimumScore: 50,
  },

  faq: {
    keywords: [
      "faq",
      "questions",
      "accordion",
      "preguntas",
    ],
    forbiddenKeywords: [
      "stats",
      "finance",
      "product",
    ],
    minimumScore: 65,
  },

  contact: {
    keywords: [
      "contact",
      "form",
      "contacto",
      "lead",
    ],
    preferredTypes: [
      "modular-contact-form",
    ],
    forbiddenKeywords: [
      "stats",
      "pricing",
    ],
    minimumScore: 50,
  },

  cta: {
    keywords: [
      "cta",
      "action",
      "button",
    ],
    preferredTypes: [
      "agency-cta",
      "ctaButton",
    ],
    preferredCategories: ["action"],
    minimumScore: 35,
  },

  footer: {
    keywords: ["footer"],
    preferredTypes: [
      "landing-footer",
      "modular-footer",
    ],
    minimumScore: 50,
  },

  content: {
    keywords: [
      "section",
      "content",
      "heading",
      "text",
    ],
    preferredTypes: [
      "section",
      "genericWrapper",
      "heading",
      "text",
    ],
    preferredCategories: [
      "layout",
      "content",
    ],
    minimumScore: 20,
  },
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

function haystack(block: OrvenixBlockCapability) {
  return normalize(
    [
      block.type,
      block.label,
      block.description,
      block.category,
    ].join(" "),
  )
}

function contextualBonus(
  block: OrvenixBlockCapability,
  role: SectionRole,
  context?: BlockSelectionContext,
) {
  const siteType = normalize(context?.siteType ?? "")

  let score = 0

  /*
   * HERO contextual.
   */
  if (role === "hero") {
    if (siteType === "agency") {
      if (block.type === "agency-hero") score += 100
      if (block.type === "landing-hero") score += 20
    }

    if (
      siteType === "health" ||
      siteType === "restaurant" ||
      siteType === "beauty" ||
      siteType === "fitness"
    ) {
      if (block.type === "landing-hero") score += 100
      if (block.type === "modular-hero") score += 35
      if (block.type === "agency-hero") score -= 40
    }

    if (siteType === "ecommerce") {
      if (block.type === "landing-hero") score += 90
      if (block.type === "agency-hero") score -= 50
    }

    if (siteType === "saas") {
      if (block.type === "modular-hero") score += 100
      if (block.type === "landing-hero") score += 60
    }
  }

  /*
   * SERVICES contextual.
   */
  if (role === "services") {
    if (siteType === "agency") {
      if (block.type === "agency-services") score += 80
    } else {
      if (block.type === "modular-capabilities") score += 50
      if (block.type === "agency-services") score -= 15
    }
  }

  /*
   * TESTIMONIALS contextual.
   */
  if (role === "testimonials") {
    if (
      siteType === "agency" &&
      block.type === "agency-testimonials"
    ) {
      score += 70
    }

    if (
      siteType !== "agency" &&
      block.type === "landing-testimonials"
    ) {
      score += 50
    }
  }

  /*
   * PRODUCTOS.
   */
  if (
    role === "products" &&
    siteType === "ecommerce"
  ) {
    if (block.type === "ec-product-grid") {
      score += 100
    }
  }

  return score
}

function scoreBlock(
  block: OrvenixBlockCapability,
  role: SectionRole,
  context?: BlockSelectionContext,
) {
  const profile = ROLE_PROFILES[role]
  const text = haystack(block)

  let score = 0

  for (const keyword of profile.keywords) {
    if (text.includes(normalize(keyword))) {
      score += 18
    }
  }

  const preferredIndex =
    profile.preferredTypes?.indexOf(block.type) ?? -1

  if (preferredIndex >= 0) {
    score += Math.max(
      70 - preferredIndex * 10,
      30,
    )
  }

  if (
    profile.preferredCategories?.includes(
      block.category,
    )
  ) {
    score += 25
  }

  for (
    const forbidden of
    profile.forbiddenKeywords ?? []
  ) {
    if (text.includes(normalize(forbidden))) {
      score -= 90
    }
  }

  if (
    profile.forbiddenCategories?.includes(
      block.category,
    )
  ) {
    score -= 120
  }

  /*
   * Un primitive simple no debe fingir ser
   * una sección compleja.
   */
  if (
    COMPOSITE_ROLES.has(role) &&
    PRIMITIVE_TYPES.has(block.type)
  ) {
    score -= 100
  }

  if (
    role === "products" &&
    block.type.includes("grid")
  ) {
    score += 35
  }

  if (
    role === "products" &&
    block.type.includes("card")
  ) {
    score -= 15
  }

  if (
    role === "gallery" &&
    (
      block.type.includes("stats") ||
      block.type.includes("metric")
    )
  ) {
    score -= 200
  }

  score += contextualBonus(
    block,
    role,
    context,
  )

  return score
}

export function rankBlocksForRole(
  role: SectionRole,
  availableTypes?: string[],
  context?: BlockSelectionContext,
) {
  return getBlockCapabilities()
    .filter((block) =>
      availableTypes
        ? availableTypes.includes(block.type)
        : true,
    )
    .map((block) => ({
      block,
      score: scoreBlock(
        block,
        role,
        context,
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function selectBestBlockForRole(
  role: SectionRole,
  availableTypes?: string[],
  context?: BlockSelectionContext,
): BlockSelection | null {
  const profile = ROLE_PROFILES[role]

  const ranked = rankBlocksForRole(
    role,
    availableTypes,
    context,
  )

  const winner = ranked[0]

  if (!winner) return null

  if (
    winner.score <
    (profile.minimumScore ?? 1)
  ) {
    return null
  }

  return {
    role,
    blockType: winner.block.type,
    score: winner.score,
    reason:
      `"${winner.block.label}" obtuvo ${winner.score} puntos ` +
      `para "${role}" considerando función, categoría y tipo de sitio.`,
  }
}

export function selectBlocksForRoles(
  roles: SectionRole[],
  availableTypes?: string[],
  context?: BlockSelectionContext,
): BlockSelection[] {
  return roles
    .map((role) =>
      selectBestBlockForRole(
        role,
        availableTypes,
        context,
      ),
    )
    .filter(
      (entry): entry is BlockSelection =>
        Boolean(entry),
    )
}
