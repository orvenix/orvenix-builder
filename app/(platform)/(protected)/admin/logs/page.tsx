import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Logs · Orvenix Admin" }

export default async function AdminLogsPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/logs")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const logs = await editorPrisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const total = await editorPrisma.auditLog.count()
  const errors = await editorPrisma.auditLog.count({ where: { level: "error" } })
  const warnings = await editorPrisma.auditLog.count({ where: { level: "warning" } })
  const security = await editorPrisma.auditLog.count({ where: { level: "security" } })

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
              Orvenix BackOffice
            </p>
            <h1 className="text-4xl font-black mt-2">Logs y Auditoría</h1>
            <p className="text-slate-400 mt-2">
              Últimos eventos importantes registrados por la plataforma.
            </p>
          </div>

          <Link
            href="/admin/estado"
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
          >
            Estado
          </Link>
        </header>

        <section className="grid md:grid-cols-4 gap-4">
          <Metric title="Eventos totales" value={total} />
          <Metric title="Errores" value={errors} />
          <Metric title="Advertencias" value={warnings} />
          <Metric title="Seguridad" value={security} />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Últimos 100 eventos</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-3">Fecha</th>
                  <th className="text-left py-3">Nivel</th>
                  <th className="text-left py-3">Módulo</th>
                  <th className="text-left py-3">Acción</th>
                  <th className="text-left py-3">Mensaje</th>
                  <th className="text-left py-3">Usuario</th>
                  <th className="text-left py-3">Sitio</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10 align-top">
                    <td className="py-3 whitespace-nowrap text-slate-400">
                      {log.createdAt.toLocaleString("es-MX")}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getLevelClass(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3">{log.module}</td>
                    <td className="py-3">{log.action}</td>
                    <td className="py-3 max-w-[360px] text-slate-300">
                      {log.message}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.userId ?? "—"}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.siteId ?? "—"}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Todavía no hay eventos registrados.
                    </td>
                  </tr>
                )}
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

function getLevelClass(level: string) {
  if (level === "error") return "bg-red-400/10 text-red-300"
  if (level === "warning") return "bg-amber-400/10 text-amber-300"
  if (level === "security") return "bg-purple-400/10 text-purple-300"
  return "bg-emerald-400/10 text-emerald-300"
}
