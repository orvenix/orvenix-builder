"use client"

import { portfolioSlices, monthlyPnL } from "../data/portfolio"

function PnLBar({ month, value, max }: { month: string; value: number; max: number }) {
  const pct = (value / max) * 100
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="text-xs text-white/50 font-medium">${(value / 1000).toFixed(0)}k</div>
      <div className="w-8 bg-white/5 rounded-t flex flex-col justify-end" style={{ height: 80 }}>
        <div className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-400/80 transition-colors" style={{ height: `${pct}%` }} />
      </div>
      <div className="text-xs text-white/30">{month}</div>
    </div>
  )
}

export function PortfolioBreakdown() {
  const maxPnL = Math.max(...monthlyPnL.map((m) => m.value))
  const total = portfolioSlices.reduce((s, p) => s + p.value, 0)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Allocation */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="text-sm font-semibold text-white mb-1">Distribución de Activos</div>
        <div className="text-xs text-white/30 mb-5">Total: ${(total / 1_000_000).toFixed(2)}M</div>
        <div className="space-y-3">
          {portfolioSlices.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-white/60">{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${s.positive ? "text-emerald-400" : "text-red-400"}`}>{s.change}</span>
                  <span className="text-xs text-white/40 w-8 text-right">{s.pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* P&L chart */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="text-sm font-semibold text-white mb-1">P&L Mensual</div>
        <div className="text-xs text-white/30 mb-5">Últimos 6 meses</div>
        <div className="flex items-end justify-around h-24 gap-2">
          {monthlyPnL.map((m) => (
            <PnLBar key={m.month} month={m.month} value={m.value} max={maxPnL} />
          ))}
        </div>
      </div>
    </div>
  )
}
