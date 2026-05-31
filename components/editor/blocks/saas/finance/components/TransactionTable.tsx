"use client"

import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react"
import { transactions } from "../data/transactions"
import type { TxStatus, TxType } from "../data/transactions"

const typeConfig: Record<TxType, { icon: typeof ArrowUpRight; color: string; label: string }> = {
  income:   { icon: ArrowUpRight,    color: "#10b981", label: "Ingreso" },
  expense:  { icon: ArrowDownRight,  color: "#f87171", label: "Gasto" },
  transfer: { icon: ArrowLeftRight,  color: "#94a3b8", label: "Transferencia" },
}

const statusConfig: Record<TxStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "#10b981", label: "Completada" },
  pending:   { icon: Clock,        color: "#f59e0b", label: "Pendiente" },
  failed:    { icon: XCircle,      color: "#f87171", label: "Fallida" },
}

function fmt(amount: number): string {
  const abs = Math.abs(amount).toLocaleString("es-ES")
  return amount >= 0 ? `+$${abs}` : `-$${abs}`
}

export function TransactionTable() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <div className="text-sm font-semibold text-white">Transacciones Recientes</div>
          <div className="text-xs text-white/30 mt-0.5">{transactions.length} movimientos</div>
        </div>
        <button type="button" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Ver todas →</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {transactions.map((tx) => {
          const T = typeConfig[tx.type]
          const S = statusConfig[tx.status]
          const TIcon = T.icon
          const SIcon = S.icon
          return (
            <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: T.color + "18" }}>
                <TIcon className="w-4 h-4" style={{ color: T.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80 font-medium truncate">{tx.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/30">{tx.category}</span>
                  <span className="text-white/15">·</span>
                  <span className="text-xs text-white/25">{tx.account}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm font-semibold tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-white/60"}`}>
                  {fmt(tx.amount)}
                </div>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <SIcon className="w-3 h-3" style={{ color: S.color }} />
                  <span className="text-xs" style={{ color: S.color }}>{S.label}</span>
                </div>
              </div>
              <div className="text-xs text-white/20 shrink-0 hidden xl:block w-20 text-right">{tx.date.slice(5)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
