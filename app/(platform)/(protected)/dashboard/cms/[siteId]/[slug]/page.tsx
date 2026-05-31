import { redirect, notFound } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { getSiteForRole, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"
import { parseCmsFields } from "@/lib/cms/schema"
import CmsRecordsImpl from "@/app/dashboard/cms/[siteId]/[slug]/page.impl"
import { isCmsWorkflowStatus, type CmsWorkflowStatus } from "@/lib/cms/workflow"

interface Props {
  params: Promise<{ siteId: string; slug: string }>
  searchParams?: Promise<{ status?: string; q?: string; sort?: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return { title: `${slug} — CMS · Orvenix` }
}

function parseInitialStatus(value: string | undefined): "all" | CmsWorkflowStatus {
  return isCmsWorkflowStatus(value) ? value : "all"
}

function parseInitialSort(value: string | undefined): Parameters<typeof CmsRecordsImpl>[0]["initialSort"] {
  switch (value) {
    case "createdAt_asc":
    case "updatedAt_desc":
    case "updatedAt_asc":
    case "status_asc":
    case "status_desc":
      return value
    case "createdAt_desc":
    default:
      return "createdAt_desc"
  }
}

export default async function CmsRecordsPage({ params, searchParams }: Props) {
  const { siteId, slug } = await params
  const rawSearchParams = await searchParams
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const site = await getSiteForRole(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!site) notFound()

  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
  })
  if (!collection) notFound()

  const records = await editorPrisma.record.findMany({
    where: { collectionId: collection.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const siteCollections = await editorPrisma.collection.findMany({
    where: { siteId },
    include: {
      records: {
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, data: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  const relationSources = siteCollections.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    fields: parseCmsFields(item.fields),
    records: item.records.map((record) => ({
      id: record.id,
      data: record.data as Record<string, unknown>,
    })),
  }))

  return (
    <div className="min-h-screen dashboard-shell text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="dashboard-glow-1 absolute top-0 left-1/4 w-150 h-150 rounded-full blur-[140px]" />
      </div>
      <div className="relative">
        <CmsRecordsImpl
          siteId={siteId}
          siteName={site.name}
          collection={collection}
          initialRecords={records as Parameters<typeof CmsRecordsImpl>[0]["initialRecords"]}
          relationSources={relationSources}
          initialQuery={(rawSearchParams?.q ?? "").trim()}
          initialStatusFilter={parseInitialStatus(rawSearchParams?.status)}
          initialSort={parseInitialSort(rawSearchParams?.sort)}
        />
      </div>
    </div>
  )
}
