"use client"

import { financeStats } from "../data/stats"

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 64
  const h = 24
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={positive ? "#10b981" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function FinanceStats() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {financeStats.map((s) => {
        const Icon = s.icon
        return (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-white/15 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accent + "20" }}>
                <Icon className="w-4 h-4" style={{ color: s.accent }} />
              </div>
              {s.sparkline && <MiniSparkline data={s.sparkline} positive={s.positive} />}
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{s.value}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            <div className={`text-xs mt-2 font-medium ${s.positive ? "text-emerald-400" : "text-red-400"}`}>{s.change}</div>
          </div>
        )
      })}
    </div>
  )
}
