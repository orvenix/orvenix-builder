import { redirect, notFound } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { getSiteForRole, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"
import { getUserPlanAccess } from "@/lib/plan-guard"
import { isFunnelsReady, listFunnels } from "@/lib/commerce/funnels"
import { getFunnelAnalyticsSummary } from "@/lib/commerce/funnel-analytics"
import { isExperimentsReady, listExperiments } from "@/lib/commerce/experiments"
import { getExperimentAnalyticsSummary } from "@/lib/commerce/experiment-analytics"
import { isAutomationsReady, listAutomations, listAutomationRuns } from "@/lib/automation/runtime"
import { listSitePages } from "@/lib/builder-core/tree/sitePages"
import { AUTOMATION_TRIGGER_TYPES, type AutomationTriggerType } from "@/lib/automation/config"
import StoreImpl from "@/app/dashboard/store/[siteId]/page.impl"

interface Props {
  params: Promise<{ siteId: string }>
}

export const metadata = { title: "Tienda — Productos · Orvenix" }

function normalizeProductAttributes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, String(entryValue ?? "")])
  )
}

function isAutomationTriggerType(value: string): value is AutomationTriggerType {
  return AUTOMATION_TRIGGER_TYPES.includes(value as AutomationTriggerType)
}

export default async function StorePage({ params }: Props) {
  const { siteId } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const site = await getSiteForRole(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!site) notFound()

  const access = await getUserPlanAccess(session.user.id)
  if (!access.plan?.hasEcommerce) {
    redirect("/precios?upgrade=ecommerce")
  }

  const funnelsReady = isFunnelsReady()
  const experimentsReady = isExperimentsReady()
  const automationsReady = isAutomationsReady()

  const [products, orders, funnels, pages, funnelAnalytics, experiments, experimentAnalytics, automations, automationRuns] = await Promise.all([
    editorPrisma.product.findMany({
      where: { siteId },
      include: { variants: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    editorPrisma.order.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    listFunnels(siteId),
    listSitePages(siteId),
    getFunnelAnalyticsSummary(siteId),
    listExperiments(siteId),
    getExperimentAnalyticsSummary(siteId),
    listAutomations(siteId),
    listAutomationRuns(siteId, 60),
  ])

  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    type: product.type,
    status: product.status,
    media: product.media,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      priceMxn: variant.priceMxn,
      comparePriceMxn: variant.comparePriceMxn,
      stock: variant.stock,
      attributes: normalizeProductAttributes(variant.attributes),
    })),
  }))

  const normalizedAutomationRuns = automationRuns
    .filter((run) => isAutomationTriggerType(run.triggerType))
    .map((run) => ({
      ...run,
      triggerType: run.triggerType as AutomationTriggerType,
    }))

  return (
    <div className="min-h-screen dashboard-shell text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="dashboard-glow-1 absolute top-0 left-1/4 w-150 h-150 rounded-full blur-[140px]" />
        <div className="dashboard-glow-2 absolute bottom-1/4 right-1/4 w-100 h-100 rounded-full blur-[120px]" />
      </div>
      <div className="relative">
        <StoreImpl
          siteId={siteId}
          siteName={site.name}
          initialProducts={normalizedProducts}
          initialOrders={orders}
          initialFunnels={funnels}
          funnelsReady={funnelsReady}
          funnelAnalytics={funnelAnalytics}
          initialExperiments={experiments}
          experimentsReady={experimentsReady}
          experimentAnalytics={experimentAnalytics}
          initialAutomations={automations}
          automationsReady={automationsReady}
          initialAutomationRuns={normalizedAutomationRuns}
          availablePages={pages.map((page) => ({
            id: page.id ?? "",
            name: page.name,
            slug: page.slug,
          }))}
        />
      </div>
    </div>
  )
}
