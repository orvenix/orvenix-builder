import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Suscripciones · Orvenix Admin" }

export default async function AdminSuscripcionesPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/suscripciones")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [subscriptions, plans] = await Promise.all([
    editorPrisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
        plan: true,
      },
    }),
    editorPrisma.plan.findMany({
      where: { isActive: true },
    }),
  ])

  const active = subscriptions.filter((s) => s.status === "active")
  const pending = subscriptions.filter((s) => s.status === "pending")
  const canceled = subscriptions.filter((s) => s.status === "canceled")

  const mrrMxn = active.reduce((total, sub) => {
    return total + (sub.plan?.priceMonthMxn ?? 0)
  }, 0)

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
              Orvenix Admin
            </p>
            <h1 className="text-4xl font-black mt-2">Suscripciones</h1>
            <p className="text-slate-400 mt-2">
              Control de planes activos, pendientes, cancelados y próximos vencimientos.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/clientes"
              className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
            >
              Clientes
            </Link>
            <Link
              href="/admin/contabilidad"
              className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
            >
              Contabilidad
            </Link>
          </div>
        </div>

        <section className="grid md:grid-cols-5 gap-4">
          <Metric title="Total" value={subscriptions.length} />
          <Metric title="Activas" value={active.length} />
          <Metric title="Pendientes" value={pending.length} />
          <Metric title="Canceladas" value={canceled.length} />
          <Metric title="MRR estimado" value={`$${mrrMxn.toLocaleString("es-MX")} MXN`} />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Resumen por plan</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const count = active.filter((s) => s.planId === plan.id).length
              const revenue = count * plan.priceMonthMxn

              return (
                <div key={plan.id} className="rounded-2xl bg-slate-900/80 border border-white/10 p-5">
                  <p className="text-sm text-slate-400">{plan.name}</p>
                  <p className="text-2xl font-black mt-2">{count}</p>
                  <p className="text-sm text-emerald-300 mt-1">
                    ${revenue.toLocaleString("es-MX")} MXN / mes
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Listado de suscripciones</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-3">Cliente</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Estado</th>
                  <th className="text-left py-3">Proveedor</th>
                  <th className="text-left py-3">Intervalo</th>
                  <th className="text-left py-3">Fin periodo</th>
                  <th className="text-left py-3">Stripe ID</th>
                </tr>
              </thead>

              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-white/10">
                    <td className="py-3 font-semibold">{sub.user.name ?? "Sin nombre"}</td>
                    <td className="py-3 text-slate-300">{sub.user.email}</td>
                    <td className="py-3">{sub.plan?.name ?? sub.planId}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3">{sub.provider}</td>
                    <td className="py-3">{sub.interval}</td>
                    <td className="py-3">
                      {sub.currentPeriodEnd
                        ? sub.currentPeriodEnd.toLocaleDateString("es-MX")
                        : "Sin fecha"}
                    </td>
                    <td className="py-3 max-w-[220px] truncate text-slate-400">
                      {sub.stripeSubscriptionId ?? "—"}
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

function getStatusClass(status: string) {
  if (status === "active") return "bg-emerald-400/10 text-emerald-300"
  if (status === "pending") return "bg-amber-400/10 text-amber-300"
  if (status === "canceled") return "bg-red-400/10 text-red-300"
  if (status === "past_due") return "bg-orange-400/10 text-orange-300"
  return "bg-slate-400/10 text-slate-300"
}
