import { editorPrisma } from "@/lib/editor-db"
import { getFeatureLimitMessage, getWebsiteLimitMessage } from "@/lib/plan-guard-messages"

export interface PlanAccess {
  isActive: boolean
  plan: {
    id: string
    name: string
    maxWebsites: number
    maxVisits: number
    hasEcommerce: boolean
    hasAI: boolean
    hasExport: boolean
  } | null
  websitesUsed: number
  canCreateWebsite: boolean
}
export { getFeatureLimitMessage, getWebsiteLimitMessage } from "@/lib/plan-guard-messages"

/** Retorna el acceso al plan del usuario. Usar en Server Components y API routes. */
export async function getUserPlanAccess(userId: string): Promise<PlanAccess> {
  const subscription = await editorPrisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })

  const isActive =
    subscription?.status === "active" || subscription?.status === "authorized"

  const websitesUsed = await editorPrisma.editorWebsite.count({
    where: { userId },
  })

  if (!isActive || !subscription) {
    return { isActive: false, plan: null, websitesUsed, canCreateWebsite: false }
  }

  const { plan } = subscription

  return {
    isActive,
    plan: {
      id: plan.id,
      name: plan.name,
      maxWebsites: plan.maxWebsites,
      maxVisits: plan.maxVisits,
      hasEcommerce: plan.hasEcommerce,
      hasAI: plan.hasAI,
      hasExport: plan.hasExport,
    },
    websitesUsed,
    canCreateWebsite: websitesUsed < plan.maxWebsites,
  }
}

/** Guard para API routes — retorna 403 si el usuario no tiene plan activo */
export async function requireActivePlan(userId: string): Promise<PlanAccess | null> {
  const access = await getUserPlanAccess(userId)
  if (!access.isActive) return null
  return access
}

/** Guard para cualquier flujo que cree un sitio nuevo. */
export async function requireCanCreateWebsite(userId: string): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)
  if (!access.canCreateWebsite) {
    throw new Error(getWebsiteLimitMessage(access))
  }

  return access
}

export async function requireEcommercePlan(userId: string): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)
  if (!access.plan?.hasEcommerce) {
    throw new Error(getFeatureLimitMessage("ecommerce"))
  }

  return access
}

export async function requireExportPlan(userId: string): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)
  if (!access.plan?.hasExport) {
    throw new Error(getFeatureLimitMessage("export"))
  }

  return access
}

export async function requireAIPlan(userId: string): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)
  if (!access.plan?.hasAI) {
    throw new Error(getFeatureLimitMessage("ai"))
  }

  return access
}
