"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, XCircle, Loader2, Users, TrendingUp, DollarSign } from "lucide-react"
import type { Affiliate, AffiliateStatus } from "@/lib/affiliates"

interface AffiliateTableProps {
  initialAffiliates: Affiliate[]
}

const STATUS_CONFIG: Record<AffiliateStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "Activo",    color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-700/25" },
  pending:   { label: "Pendiente", color: "text-amber-400",   bg: "bg-amber-950/20",   border: "border-amber-700/25" },
  suspended: { label: "Suspendido",color: "text-red-400/70",  bg: "bg-red-950/15",     border: "border-red-800/20" },
}

export function AffiliateTable({ initialAffiliates }: AffiliateTableProps) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>(initialAffiliates)
  const [updating, setUpdating] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function toggleStatus(id: string, current: AffiliateStatus) {
    const next: AffiliateStatus = current === "active" ? "suspended" : "active"
    setUpdating(id)
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next }),
      })
      if (res.ok) {
        startTransition(() => {
          setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: next } : a))
        })
      }
    } finally {
      setUpdating(null)
    }
  }

  if (affiliates.length === 0) {
    return (
      <div className="text-center py-20 text-white/25">
        <Users size={40} className="mx-auto mb-4 opacity-30" />
        <p className="font-semibold">Aún no hay afiliados registrados</p>
        <p className="text-sm mt-1 text-white/20">Aparecerán aquí cuando alguien se una al programa</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[1fr_120px_80px_80px_80px_100px_80px] gap-4 px-4 py-2 text-[11px] text-white/25 uppercase tracking-wider">
        <span>Afiliado</span>
        <span>Código</span>
        <span>Referidos</span>
        <span>Activos</span>
        <span>Comis.</span>
        <span>Estado</span>
        <span>Acción</span>
      </div>

      {affiliates.map(aff => {
        const st = STATUS_CONFIG[aff.status]
        const isUpdating = updating === aff.id
        const pendingMXN = (aff.pendingCents / 100).toFixed(0)
        const totalMXN = (aff.totalEarnedCents / 100).toFixed(0)

        return (
          <div
            key={aff.id}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px_80px_80px_100px_80px] gap-4 items-center px-4 py-4">
              {/* Afiliado */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{aff.userName}</p>
                <p className="text-[11px] text-white/30 truncate">{aff.userEmail}</p>
                <p className="text-[10px] text-white/20 mt-0.5">
                  Desde {new Date(aff.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Código */}
              <code className="text-sm font-mono font-bold text-indigo-300 bg-indigo-950/20 border border-indigo-800/25 px-2.5 py-1 rounded-lg">
                {aff.code}
              </code>

              {/* Referidos total */}
              <div className="text-center">
                <p className="text-lg font-black text-white">{aff.totalReferrals}</p>
                <p className="text-[10px] text-white/25">total</p>
              </div>

              {/* Referidos activos */}
              <div className="text-center">
                <p className="text-lg font-black text-emerald-400">{aff.activeReferrals}</p>
                <p className="text-[10px] text-white/25">activos</p>
              </div>

              {/* Comisión % */}
              <div className="text-center">
                <p className="text-lg font-black text-indigo-400">{aff.commissionPct}%</p>
                <p className="text-[10px] text-white/25">por mes</p>
              </div>

              {/* Estado badge */}
              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.color} ${st.bg} ${st.border}`}>
                  {st.label}
                </span>
              </div>

              {/* Toggle acción */}
              <button
                onClick={() => toggleStatus(aff.id, aff.status)}
                disabled={isUpdating || aff.status === "pending"}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-semibold transition-all disabled:opacity-40 ${
                  aff.status === "active"
                    ? "border-red-800/25 bg-red-950/20 text-red-400/80 hover:bg-red-900/30"
                    : "border-emerald-700/25 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30"
                }`}
              >
                {isUpdating
                  ? <Loader2 size={11} className="animate-spin" />
                  : aff.status === "active" ? <XCircle size={11} /> : <CheckCircle2 size={11} />
                }
                {aff.status === "active" ? "Suspender" : "Activar"}
              </button>
            </div>

            {/* Earnings row */}
            {(aff.totalEarnedCents > 0 || aff.pendingCents > 0) && (
              <div className="border-t border-white/[0.05] px-4 py-3 flex gap-6 text-xs text-white/30">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-indigo-400/60" />
                  Total ganado: <strong className="text-white/50">${totalMXN} MXN</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign size={11} className="text-amber-400/60" />
                  Pendiente: <strong className="text-amber-300/60">${pendingMXN} MXN</strong>
                </span>
                {aff.paypalEmail && (
                  <span className="text-white/20">PayPal: {aff.paypalEmail}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
