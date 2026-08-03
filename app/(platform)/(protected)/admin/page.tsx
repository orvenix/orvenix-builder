import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Admin · Orvenix" }

export default async function AdminDashboardPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const totalUsers = await editorPrisma.user.count()
  const totalSites = await editorPrisma.editorWebsite.count()
  const publishedSites = await editorPrisma.editorWebsite.count({ where: { published: true } })
  const activeSubscriptions = await editorPrisma.subscription.count({ where: { status: "active" } })

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
            Orvenix BackOffice
          </p>
          <h1 className="text-4xl font-black mt-2">Dashboard Ejecutivo</h1>
          <p className="text-slate-400 mt-2">
            Vista general del negocio y módulos administrativos.
          </p>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <Metric title="Clientes" value={totalUsers} />
          <Metric title="Suscripciones activas" value={activeSubscriptions} />
          <Metric title="Sitios totales" value={totalSites} />
          <Metric title="Sitios publicados" value={publishedSites} />
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <AdminCard title="Clientes" href="/admin/clientes" />
          <AdminCard title="Suscripciones" href="/admin/suscripciones" />
          <AdminCard title="Contabilidad" href="/admin/contabilidad" />
        </section>
      </div>
    </main>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  )
}

function AdminCard({ title, href }: { title: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition"
    >
      <h2 className="text-xl font-black">{title}</h2>
      <p className="text-cyan-300 mt-4 text-sm font-bold">Abrir módulo →</p>
    </Link>
  )
}
