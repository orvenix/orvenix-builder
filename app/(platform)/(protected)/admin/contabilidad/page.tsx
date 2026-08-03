import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Contabilidad · Orvenix Admin" }

export default async function AdminContabilidadPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/contabilidad")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [
    totalUsers,
    totalSites,
    publishedSites,
    activeSubscriptions,
    subscriptionsByPlan,
    recentUsers,
    recentSubscriptions,
  ] = await Promise.all([
    editorPrisma.user.count(),
    editorPrisma.editorWebsite.count(),
    editorPrisma.editorWebsite.count({ where: { published: true } }),
    editorPrisma.subscription.count({ where: { status: "active" } }),
    editorPrisma.subscription.groupBy({
      by: ["planId"],
      where: { status: "active" },
      _count: { id: true },
    }),
    editorPrisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    editorPrisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { email: true, name: true } },
        plan: true,
      },
    }),
  ])

  const plans = await editorPrisma.plan.findMany({
    where: { isActive: true },
  })

  const monthlyRevenueMxn = subscriptionsByPlan.reduce((total, item) => {
    const plan = plans.find((p) => p.id === item.planId)
    return total + (plan?.priceMonthMxn ?? 0) * item._count.id
  }, 0)

  const annualRevenueMxn = monthlyRevenueMxn * 12

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
            Orvenix Admin
          </p>
          <h1 className="text-4xl font-black mt-2">Contabilidad y Clientes</h1>
          <p className="text-slate-400 mt-2">
            Resumen operativo para controlar clientes, planes, sitios e ingresos.
          </p>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <Metric title="Clientes" value={totalUsers} />
          <Metric title="Suscripciones activas" value={activeSubscriptions} />
          <Metric title="Sitios totales" value={totalSites} />
          <Metric title="Sitios publicados" value={publishedSites} />
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <Metric title="MRR estimado" value={`$${monthlyRevenueMxn.toLocaleString("es-MX")} MXN`} />
          <Metric title="ARR estimado" value={`$${annualRevenueMxn.toLocaleString("es-MX")} MXN`} />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Clientes recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-2">Nombre</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Rol</th>
                  <th className="text-left py-2">Registro</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-t border-white/10">
                    <td className="py-3">{user.name ?? "Sin nombre"}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.role}</td>
                    <td className="py-3">
                      {user.createdAt.toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Suscripciones recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Estado</th>
                  <th className="text-left py-2">Proveedor</th>
                  <th className="text-left py-2">Fin periodo</th>
                </tr>
              </thead>
              <tbody>
                {recentSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-white/10">
                    <td className="py-3">{sub.user.email}</td>
                    <td className="py-3">{sub.plan?.name ?? sub.planId}</td>
                    <td className="py-3">{sub.status}</td>
                    <td className="py-3">{sub.provider}</td>
                    <td className="py-3">
                      {sub.currentPeriodEnd
                        ? sub.currentPeriodEnd.toLocaleDateString("es-MX")
                        : "Sin fecha"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
