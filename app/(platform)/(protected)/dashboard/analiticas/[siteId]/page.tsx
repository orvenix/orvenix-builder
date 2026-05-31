import { redirect, notFound } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { getSiteForRole, type UserRole } from "@/lib/auth"
import AnaliticasImpl from "@/app/dashboard/analiticas/[siteId]/page.impl"

interface Props {
  params: Promise<{ siteId: string }>
}

export const metadata = { title: "Analíticas — Orvenix" }

export default async function AnaliticasPage({ params }: Props) {
  const { siteId } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const site = await getSiteForRole(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!site) notFound()

  return (
    <div className="min-h-screen bg-[#040408] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#040408]" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>
      <div className="relative">
        <AnaliticasImpl siteId={siteId} siteName={site.name} />
      </div>
    </div>
  )
}
