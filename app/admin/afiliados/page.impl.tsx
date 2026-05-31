import { getAllAffiliates } from "@/lib/affiliates"
import { getAuthSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { AffiliateTable } from "./AffiliateTable"
import { Share2, Users, TrendingUp, DollarSign } from "lucide-react"

export default async function AdminAfiliadosPage() {
  const session = await getAuthSession()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const affiliates = await getAllAffiliates()

  const totalReferrals = affiliates.reduce((s, a) => s + a.totalReferrals, 0)
  const activeReferrals = affiliates.reduce((s, a) => s + a.activeReferrals, 0)
  const pendingMXN = (affiliates.reduce((s, a) => s + a.pendingCents, 0) / 100).toFixed(0)
  const paidMXN = (affiliates.reduce((s, a) => s + a.paidCents, 0) / 100).toFixed(0)

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,181,246,0.30)] to-transparent" />
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
          <Share2 size={13} />
          Programa de afiliados
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[color:var(--text)]">Gestión de afiliados</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Visualiza y administra todos los afiliados del programa. Activa, suspende y monitorea comisiones.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Afiliados activos",   value: affiliates.filter(a => a.status === "active").length, icon: Share2,     color: "text-[color:var(--accent)]", glow: "via-[rgba(0,181,246,0.20)]" },
          { label: "Total referidos",      value: totalReferrals,  icon: Users,      color: "text-[color:var(--accent-3)]",    glow: "via-[rgba(0,156,212,0.20)]" },
          { label: "Referidos activos",    value: activeReferrals, icon: TrendingUp, color: "text-[color:var(--accent-2)]",  glow: "via-[rgba(0,131,179,0.20)]" },
          { label: "Comisiones pendientes",value: `$${pendingMXN}`, icon: DollarSign,color: "text-amber-400",   glow: "via-amber-400/20" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${stat.glow} to-transparent`} />
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs text-[color:var(--text-muted)]">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Tabla */}
      <AffiliateTable initialAffiliates={affiliates} />

      {/* Nota de pagos */}
      {Number(paidMXN) > 0 && (
        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-[color:var(--text-secondary)]">
          Total pagado a afiliados hasta la fecha: <strong className="text-[color:var(--text)]">${paidMXN} MXN</strong>
        </div>
      )}
    </div>
  )
}
