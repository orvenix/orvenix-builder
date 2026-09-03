import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Sitios · Orvenix Admin" }

export default async function AdminSitiosPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/sitios")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const sites = await editorPrisma.editorWebsite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true, role: true } },
    },
  })

  const totalSites = sites.length
  const publishedSites = sites.filter((site) => site.published).length
  const draftSites = totalSites - publishedSites

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
              Orvenix Admin
            </p>
            <h1 className="text-4xl font-black mt-2">Sitios Web</h1>
            <p className="text-slate-400 mt-2">
              Control de sitios creados, publicados y propietarios.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
          >
            Dashboard
          </Link>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <Metric title="Sitios totales" value={totalSites} />
          <Metric title="Publicados" value={publishedSites} />
          <Metric title="Borradores" value={draftSites} />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Listado de sitios</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-3">Sitio</th>
                  <th className="text-left py-3">Propietario</th>
                  <th className="text-left py-3">Email</th>
                  <th className="text-left py-3">Estado</th>
                  <th className="text-left py-3">Creado</th>
                  <th className="text-left py-3">Actualizado</th>
                  <th className="text-left py-3">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {sites.map((site) => (
                  <tr key={site.id} className="border-t border-white/10">
                    <td className="py-3">
                      <p className="font-bold">{site.name}</p>
                      <p className="text-xs text-slate-500">{site.id}</p>
                    </td>
                    <td className="py-3">{site.user?.name ?? "Sin nombre"}</td>
                    <td className="py-3 text-slate-300">{site.user?.email ?? "Sin email"}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          site.published
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {site.published ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="py-3">{site.createdAt.toLocaleDateString("es-MX")}</td>
                    <td className="py-3">{site.updatedAt.toLocaleDateString("es-MX")}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/editor/${site.id}`}
                          className="rounded-lg bg-cyan-400/10 text-cyan-300 px-3 py-1 text-xs font-bold hover:bg-cyan-400/20"
                        >
                          Editor
                        </Link>

                        {site.published && (
                          <Link
                            href={`/p/${site.id}`}
                            target="_blank"
                            className="rounded-lg bg-emerald-400/10 text-emerald-300 px-3 py-1 text-xs font-bold hover:bg-emerald-400/20"
                          >
                            Ver sitio
                          </Link>
                        )}
                      </div>
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

function Metric({ title, value }: { title: string | number; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  )
}
