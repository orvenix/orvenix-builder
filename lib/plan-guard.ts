import { editorPrisma } from "@/lib/editor-db"
import { listSitePages } from "@/lib/builder-core/tree/sitePages"
import {
  canCreatePage as canCreatePageForPlan,
  canCreateWebsite as canCreateWebsiteForPlan,
  canExportCode,
  canUseAI,
  canUseEcommerce,
  getPlanEntitlements,
  type PlanEntitlements,
} from "@/lib/billing/plan-entitlements"
import {
  getFeatureLimitMessage,
  getWebsiteLimitMessage,
} from "@/lib/plan-guard-messages"

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
  entitlements: PlanEntitlements | null
  websitesUsed: number
  canCreateWebsite: boolean
}

export class PageLimitReachedError extends Error {
  readonly code = "PAGE_LIMIT_REACHED"

  constructor(message: string) {
    super(message)
    this.name = "PageLimitReachedError"
  }
}

export {
  getFeatureLimitMessage,
  getWebsiteLimitMessage,
} from "@/lib/plan-guard-messages"

/**
 * Retorna el acceso real al plan del usuario.
 *
 * La suscripción y su estado proceden de la base de datos.
 * Los permisos técnicos proceden del catálogo central de entitlements.
 */
export async function getUserPlanAccess(
  userId: string,
): Promise<PlanAccess> {
  const subscription = await editorPrisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  })

  const isActive =
    subscription?.status === "active" ||
    subscription?.status === "authorized"

  const websitesUsed = await editorPrisma.editorWebsite.count({
    where: { userId },
  })

  if (!isActive || !subscription) {
    return {
      isActive: false,
      plan: null,
      entitlements: null,
      websitesUsed,
      canCreateWebsite: false,
    }
  }

  const { plan } = subscription
  const entitlements = getPlanEntitlements(plan.id)

  return {
    isActive: true,
    plan: {
      id: plan.id,
      name: plan.name,
      maxWebsites: plan.maxWebsites,
      maxVisits: plan.maxVisits,
      hasEcommerce: plan.hasEcommerce,
      hasAI: plan.hasAI,
      hasExport: plan.hasExport,
    },
    entitlements,
    websitesUsed,
    canCreateWebsite: canCreateWebsiteForPlan(
      plan.id,
      websitesUsed,
    ),
  }
}

/**
 * Guard para API routes.
 *
 * Retorna null cuando el usuario no tiene una suscripción activa.
 */
export async function requireActivePlan(
  userId: string,
): Promise<PlanAccess | null> {
  const access = await getUserPlanAccess(userId)

  if (!access.isActive) {
    return null
  }

  return access
}

/**
 * Guard para cualquier flujo que cree un sitio nuevo.
 */
export async function requireCanCreateWebsite(
  userId: string,
): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)

  if (!access.canCreateWebsite) {
    throw new Error(getWebsiteLimitMessage(access))
  }

  return access
}

/**
 * Requiere que el propietario del sitio pueda crear otra página.
 *
 * El límite se aplica por sitio y procede del catálogo central
 * de entitlements.
 */
export async function requireCanCreatePage(
  siteId: string,
): Promise<PlanAccess> {
  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id: siteId },
    select: { userId: true },
  })

  if (!site) {
    throw new Error(`Sitio "${siteId}" no encontrado.`)
  }

  const [access, pages] = await Promise.all([
    getUserPlanAccess(site.userId),
    listSitePages(siteId),
  ])

  const allowed =
    access.isActive &&
    access.plan &&
    canCreatePageForPlan(access.plan.id, pages.length)

  if (!allowed) {
    const pageLimit =
      access.entitlements?.limits.pagesPerWebsite

    const message =
      typeof pageLimit === "number"
        ? `Tu plan permite hasta ${pageLimit} páginas por sitio. Actualiza tu plan para crear más páginas.`
        : "Necesitas un plan activo que permita crear páginas."

    throw new PageLimitReachedError(message)
  }

  return access
}

/**
 * Requiere un plan con e-commerce habilitado.
 */
export async function requireEcommercePlan(
  userId: string,
): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)

  if (
    !access.isActive ||
    !access.plan ||
    !canUseEcommerce(access.plan.id)
  ) {
    throw new Error(getFeatureLimitMessage("ecommerce"))
  }

  return access
}

/**
 * Requiere un plan con exportación de código habilitada.
 */
export async function requireExportPlan(
  userId: string,
): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)

  if (
    !access.isActive ||
    !access.plan ||
    !canExportCode(access.plan.id)
  ) {
    throw new Error(getFeatureLimitMessage("export"))
  }

  return access
}

/**
 * Requiere un plan con Orvenix AI habilitada.
 */
export async function requireAIPlan(
  userId: string,
): Promise<PlanAccess> {
  const access = await getUserPlanAccess(userId)

  if (
    !access.isActive ||
    !access.plan ||
    !canUseAI(access.plan.id)
  ) {
    throw new Error(getFeatureLimitMessage("ai"))
  }

  return access
}
