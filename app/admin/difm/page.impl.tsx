import { getEditRequestsForRole } from "@/lib/editRequests"
import { getAuthSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { TicketList } from "./TicketList"
import { Wrench, CheckCircle2, CircleDot, Clock } from "lucide-react"

export default async function AdminDifmPage() {
  const session = await getAuthSession()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")

  const tickets = await getEditRequestsForRole(session.user.id, "ADMIN")

  const open        = tickets.filter(t => t.status === "open").length
  const inProgress  = tickets.filter(t => t.status === "in_progress").length
  const done        = tickets.filter(t => t.status === "done").length
  const highPrio    = tickets.filter(t => t.priority === "high" && (t.status === "open" || t.status === "in_progress")).length

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
          <Wrench size={13} />
          DIFM — Do It For Me
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Gestión de tickets</h1>
        <p className="mt-2 text-sm text-white/40">
          Solicitudes de ajustes manuales de los clientes. Cambia el estado para notificarles automáticamente por email.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Abiertos",      value: open,       icon: CircleDot,    color: "text-blue-400",    glow: "via-blue-400/20" },
          { label: "En progreso",   value: inProgress,  icon: Wrench,       color: "text-amber-400",   glow: "via-amber-400/20" },
          { label: "Completados",   value: done,        icon: CheckCircle2, color: "text-emerald-400", glow: "via-emerald-400/20" },
          { label: "Alta prioridad",value: highPrio,    icon: Clock,        color: "text-red-400",     glow: "via-red-400/20" },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl shadow-black/15">
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${stat.glow} to-transparent`} />
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs text-white/30">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Lista interactiva */}
      <TicketList initialTickets={tickets} />
    </div>
  )
}
