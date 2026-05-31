import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import AffiliatesDashboard from "@/app/dashboard/afiliados/page.impl"

export const metadata = { title: "Afiliados — Orvenix" }

export default async function AffiliatesPage() {
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/afiliados")

  const appUrl = process.env.NEXTAUTH_URL ?? "https://orvenix.com.mx"

  return (
    <div className="min-h-screen bg-[#040408] text-white">
      {/* Background glows igual al dashboard */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#040408]" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
      </div>
      <div className="relative">
        <AffiliatesDashboard
          userName={session.user.name ?? session.user.email ?? "Usuario"}
          userEmail={session.user.email ?? ""}
          appUrl={appUrl}
        />
      </div>
    </div>
  )
}
