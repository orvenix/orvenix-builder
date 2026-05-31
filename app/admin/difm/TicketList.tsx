"use client"

import { useState, useTransition } from "react"
import {
  ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle,
  Loader2, AlertCircle, CircleDot, Wrench, User, Calendar,
  FileText, Link as LinkIcon,
} from "lucide-react"
import type { EditRequest, EditRequestStatus } from "@/lib/editRequests"

const STATUS_CONFIG: Record<EditRequestStatus, { label: string; color: string; bg: string; border: string; icon: typeof CircleDot }> = {
  open:        { label: "Abierto",      color: "text-blue-400",    bg: "bg-blue-950/30",    border: "border-blue-700/30",    icon: CircleDot },
  in_progress: { label: "En progreso",  color: "text-amber-400",   bg: "bg-amber-950/30",   border: "border-amber-700/30",   icon: Wrench },
  done:        { label: "Completado",   color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-700/30", icon: CheckCircle2 },
  cancelled:   { label: "Cancelado",    color: "text-red-400/70",  bg: "bg-red-950/20",     border: "border-red-800/25",     icon: XCircle },
}

const PRIORITY_CONFIG = {
  high:   { label: "Alta",   color: "text-red-400",    bg: "bg-red-950/20",    border: "border-red-800/25" },
  normal: { label: "Normal", color: "text-white/40",   bg: "bg-white/[0.03]",  border: "border-white/[0.06]" },
  low:    { label: "Baja",   color: "text-white/25",   bg: "bg-white/[0.02]",  border: "border-white/[0.04]" },
}

type FilterTab = "all" | EditRequestStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",         label: "Todos" },
  { key: "open",        label: "Abiertos" },
  { key: "in_progress", label: "En progreso" },
  { key: "done",        label: "Completados" },
  { key: "cancelled",   label: "Cancelados" },
]

interface TicketListProps {
  initialTickets: EditRequest[]
}

export function TicketList({ initialTickets }: TicketListProps) {
  const [tickets, setTickets] = useState<EditRequest[]>(initialTickets)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const visible = filter === "all" ? tickets : tickets.filter(t => t.status === filter)

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    done:        tickets.filter(t => t.status === "done").length,
    cancelled:   tickets.filter(t => t.status === "cancelled").length,
  }

  async function changeStatus(ticketId: string, newStatus: EditRequestStatus) {
    setUpdating(ticketId)
    try {
      const res = await fetch("/api/admin/difm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      })
      if (res.ok) {
        startTransition(() => {
          setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
        })
      }
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 shrink-0 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              filter === tab.key
                ? "bg-indigo-600 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              filter === tab.key ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/30"
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-white/25">
          <FileText size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Sin tickets en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(ticket => {
            const st = STATUS_CONFIG[ticket.status]
            const pr = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.normal
            const isExpanded = expanded === ticket.id
            const isUpdating = updating === ticket.id
            const shortId = ticket.id.slice(-8).toUpperCase()

            return (
              <div key={ticket.id} className={`rounded-2xl border ${st.border} ${st.bg} overflow-hidden transition-all`}>
                {/* Row principal */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : ticket.id)}
                >
                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    ticket.priority === "high" ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" :
                    ticket.priority === "low" ? "bg-white/20" : "bg-white/40"
                  }`} />

                  {/* ID + Status */}
                  <div className="w-24 shrink-0">
                    <p className="text-[11px] font-mono text-white/30">#{shortId}</p>
                    <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.color} ${st.border} bg-black/20`}>
                      <st.icon size={9} />
                      {st.label}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {ticket.siteName ?? ticket.templateName ?? "Sin nombre"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-white/30">
                      <span className="flex items-center gap-1"><User size={10} /> {ticket.userEmail}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ticket.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      {ticket.priority === "high" && (
                        <span className={`flex items-center gap-1 ${pr.color}`}><AlertCircle size={10} /> Alta prioridad</span>
                      )}
                    </div>
                  </div>

                  {/* Timeline badge */}
                  {ticket.timeline && (
                    <span className="hidden md:flex items-center gap-1 text-[11px] text-white/30 border border-white/[0.06] rounded-full px-2.5 py-1 shrink-0">
                      <Clock size={10} /> {ticket.timeline}
                    </span>
                  )}

                  {/* Expand arrow */}
                  <div className="text-white/20 shrink-0">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                    {/* Mensaje */}
                    <div>
                      <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">Descripción del cliente</p>
                      <p className="text-sm text-white/60 leading-relaxed bg-black/20 rounded-xl p-4 border border-white/[0.05]">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Assets */}
                    {ticket.assets && (
                      <div>
                        <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider mb-2">Recursos / Links</p>
                        <p className="text-sm text-white/50 flex items-start gap-2">
                          <LinkIcon size={13} className="shrink-0 mt-0.5 text-indigo-400/60" />
                          {ticket.assets}
                        </p>
                      </div>
                    )}

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "ID completo", value: ticket.id },
                        { label: "Usuario ID", value: ticket.userId },
                        { label: "Asignado a", value: ticket.assignedTo },
                        { label: "Tipo", value: ticket.type },
                      ].map(m => (
                        <div key={m.label} className="bg-black/20 rounded-xl p-3 border border-white/[0.04]">
                          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{m.label}</p>
                          <p className="text-xs text-white/50 font-mono break-all">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ticket.status === "open" && (
                        <ActionButton
                          label="Tomar ticket"
                          icon={Wrench}
                          color="amber"
                          loading={isUpdating}
                          onClick={() => changeStatus(ticket.id, "in_progress")}
                        />
                      )}
                      {(ticket.status === "open" || ticket.status === "in_progress") && (
                        <ActionButton
                          label="Marcar completado"
                          icon={CheckCircle2}
                          color="emerald"
                          loading={isUpdating}
                          onClick={() => changeStatus(ticket.id, "done")}
                        />
                      )}
                      {ticket.status !== "cancelled" && ticket.status !== "done" && (
                        <ActionButton
                          label="Cancelar"
                          icon={XCircle}
                          color="red"
                          loading={isUpdating}
                          onClick={() => changeStatus(ticket.id, "cancelled")}
                        />
                      )}
                      {(ticket.status === "done" || ticket.status === "cancelled") && (
                        <ActionButton
                          label="Reabrir"
                          icon={CircleDot}
                          color="blue"
                          loading={isUpdating}
                          onClick={() => changeStatus(ticket.id, "open")}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Spinner global mientras isPending */}
      {isPending && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl">
          <Loader2 size={14} className="animate-spin" /> Actualizando...
        </div>
      )}
    </div>
  )
}

// ── Sub-componente botón de acción ────────────────────────────────────────────

function ActionButton({
  label, icon: Icon, color, loading, onClick,
}: {
  label: string
  icon: typeof CircleDot
  color: "amber" | "emerald" | "red" | "blue"
  loading: boolean
  onClick: () => void
}) {
  const variants = {
    amber:   "border-amber-700/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40",
    emerald: "border-emerald-700/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40",
    red:     "border-red-800/25 bg-red-950/20 text-red-400/80 hover:bg-red-900/30",
    blue:    "border-blue-700/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40",
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 ${variants[color]}`}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {label}
    </button>
  )
}
