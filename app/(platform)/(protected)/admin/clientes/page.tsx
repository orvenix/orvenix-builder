import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Clientes · Orvenix Admin" }

export default async function AdminClientesPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/clientes")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await editorPrisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      subscription: {
        include: { plan: true },
      },
      _count: {
        select: { sites: true },
      },
    },
  })

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
              Orvenix Admin
            </p>
            <h1 className="text-4xl font-black mt-2">Clientes</h1>
            <p className="text-slate-400 mt-2">
              Control general de usuarios, planes, suscripciones y sitios creados.
            </p>
          </div>

          <Link
            href="/admin/contabilidad"
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
          >
            Ver contabilidad
          </Link>
        </div>

        <section className="grid md:grid-cols-4 gap-4">
          <Metric title="Clientes totales" value={users.length} />
          <Metric
            title="Activos"
            value={users.filter((u) => u.subscription?.status === "active").length}
          />
          <Metric
            title="Pendientes"
            value={users.filter((u) => u.subscription?.status === "pending").length}
          />
          <Metric
            title="Sin plan"
            value={users.filter((u) => !u.subscription).length}
          />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Lista de clientes</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-3">Cliente</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Rol</th>
                  <th className="text-left py-3">Plan</th>
                  <th className="text-left py-3">Estado</th>
                  <th className="text-left py-3">Sitios</th>
                  <th className="text-left py-3">Registro</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const sub = user.subscription
                  return (
                    <tr key={user.id} className="border-t border-white/10">
                      <td className="py-3 font-semibold">
                        {user.name ?? "Sin nombre"}
                      </td>
                      <td className="py-3 text-slate-300">{user.email}</td>
                      <td className="py-3">{user.role}</td>
                      <td className="py-3">
                        {sub?.plan?.name ?? "Sin plan"}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(sub?.status)}`}>
                          {sub?.status ?? "sin_plan"}
                        </span>
                      </td>
                      <td className="py-3">{user._count.sites}</td>
                      <td className="py-3">
                        {user.createdAt.toLocaleDateString("es-MX")}
                      </td>
                    </tr>
                  )
                })}
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

function getStatusClass(status?: string | null) {
  if (status === "active") return "bg-emerald-400/10 text-emerald-300"
  if (status === "pending") return "bg-amber-400/10 text-amber-300"
  if (status === "canceled") return "bg-red-400/10 text-red-300"
  return "bg-slate-400/10 text-slate-300"
}
