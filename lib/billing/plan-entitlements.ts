import {
  normalizeOfficialPlanId,
  type OfficialPlanId,
} from "@/lib/orvenix-official-2026"

export type AiLevel = "none" | "standard" | "advanced" | "custom"
export type EcommerceLevel =
  | "none"
  | "standard"
  | "multicurrency"
  | "enterprise"
export type CrmLevel = "basic" | "complete" | "automated" | "enterprise"
export type SeoLevel = "basic" | "advanced" | "custom"

export interface PlanEntitlements {
  id: OfficialPlanId
  billingId: string

  limits: {
    websites: number | null
    pagesPerWebsite: number | null
    funnels: number | null
    monthlyVisits: number | null
  }

  features: {
    ai: AiLevel
    ecommerce: EcommerceLevel
    crm: CrmLevel
    seo: SeoLevel
    exportCode: boolean
    automations: boolean
    multiDomain: boolean
  }
}

/**
 * `null` representa capacidad ilimitada o sujeta
 * a un acuerdo comercial particular.
 */
export const PLAN_ENTITLEMENTS: Record<
  OfficialPlanId,
  PlanEntitlements
> = {
  starter: {
    id: "starter",
    billingId: "starter",

    limits: {
      websites: 1,
      pagesPerWebsite: 5,
      funnels: 0,
      monthlyVisits: 15_000,
    },

    features: {
      ai: "none",
      ecommerce: "none",
      crm: "basic",
      seo: "basic",
      exportCode: false,
      automations: false,
      multiDomain: false,
    },
  },

  pro: {
    id: "pro",
    billingId: "pro",

    limits: {
      websites: 10,
      pagesPerWebsite: null,
      funnels: 5,
      monthlyVisits: 75_000,
    },

    features: {
      ai: "standard",
      ecommerce: "standard",
      crm: "complete",
      seo: "advanced",
      exportCode: true,
      automations: true,
      multiDomain: true,
    },
  },

  business: {
    id: "business",
    billingId: "commerce",

    limits: {
      websites: null,
      pagesPerWebsite: null,
      funnels: null,
      monthlyVisits: 500_000,
    },

    features: {
      ai: "advanced",
      ecommerce: "multicurrency",
      crm: "automated",
      seo: "advanced",
      exportCode: true,
      automations: true,
      multiDomain: true,
    },
  },

  enterprise: {
    id: "enterprise",
    billingId: "enterprise",

    limits: {
      websites: null,
      pagesPerWebsite: null,
      funnels: null,
      monthlyVisits: null,
    },

    features: {
      ai: "custom",
      ecommerce: "enterprise",
      crm: "enterprise",
      seo: "custom",
      exportCode: true,
      automations: true,
      multiDomain: true,
    },
  },
}

export function getPlanEntitlements(
  planId: string | null | undefined,
): PlanEntitlements | null {
  if (!planId) return null

  const normalizedPlanId = normalizeOfficialPlanId(planId)

  if (!normalizedPlanId) return null

  return PLAN_ENTITLEMENTS[normalizedPlanId]
}

export function isBelowLimit(
  currentUsage: number,
  limit: number | null,
): boolean {
  if (!Number.isInteger(currentUsage) || currentUsage < 0) {
    return false
  }

  return limit === null || currentUsage < limit
}

export function canCreateWebsite(
  planId: string | null | undefined,
  websitesUsed: number,
): boolean {
  const entitlements = getPlanEntitlements(planId)

  return entitlements
    ? isBelowLimit(websitesUsed, entitlements.limits.websites)
    : false
}

export function canCreatePage(
  planId: string | null | undefined,
  pagesUsed: number,
): boolean {
  const entitlements = getPlanEntitlements(planId)

  return entitlements
    ? isBelowLimit(pagesUsed, entitlements.limits.pagesPerWebsite)
    : false
}

export function canCreateFunnel(
  planId: string | null | undefined,
  funnelsUsed: number,
): boolean {
  const entitlements = getPlanEntitlements(planId)

  return entitlements
    ? isBelowLimit(funnelsUsed, entitlements.limits.funnels)
    : false
}

export function canUseAI(
  planId: string | null | undefined,
): boolean {
  const level = getPlanEntitlements(planId)?.features.ai

  return Boolean(level && level !== "none")
}

export function canUseEcommerce(
  planId: string | null | undefined,
): boolean {
  const level = getPlanEntitlements(planId)?.features.ecommerce

  return Boolean(level && level !== "none")
}

export function canExportCode(
  planId: string | null | undefined,
): boolean {
  return getPlanEntitlements(planId)?.features.exportCode === true
}

export function canUseAutomations(
  planId: string | null | undefined,
): boolean {
  return getPlanEntitlements(planId)?.features.automations === true
}

export function canUseMultipleDomains(
  planId: string | null | undefined,
): boolean {
  return getPlanEntitlements(planId)?.features.multiDomain === true
}
