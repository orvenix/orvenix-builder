import { redirect, notFound } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { getSiteForRole, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"
import CmsCollectionsImpl from "@/app/dashboard/cms/[siteId]/page.impl"
import { summarizeCmsWorkflowRecords } from "@/lib/cms/collection-summary"

interface Props {
  params: Promise<{ siteId: string }>
}

export const dynamic = "force-dynamic"
export const metadata = { title: "CMS — Colecciones · Orvenix" }

export default async function CmsCollectionsPage({ params }: Props) {
  const { siteId } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const site = await getSiteForRole(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!site) notFound()

  const collections = await editorPrisma.collection.findMany({
    where: { siteId },
    include: {
      _count: { select: { records: true } },
      records: {
        select: {
          data: true,
          publishedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const collectionsWithSummary = collections.map(({ records, ...collection }) => ({
    ...collection,
    workflow: summarizeCmsWorkflowRecords(records),
  }))

  return (
    <div className="min-h-screen dashboard-shell text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="dashboard-glow-1 absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px]" />
        <div className="dashboard-glow-2 absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]" />
      </div>
      <div className="relative">
        <CmsCollectionsImpl
          siteId={siteId}
          siteName={site.name}
          initialCollections={collectionsWithSummary}
        />
      </div>
    </div>
  )
}
