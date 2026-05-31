"use client"

import { servers, statusConfig, roleLabels } from "../data/servers"

function UsageBar({ value, warn = 75, crit = 90 }: { value: number; warn?: number; crit?: number }) {
  const color = value >= crit ? "#ef4444" : value >= warn ? "#f59e0b" : "#10b981"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-white/40 w-7 text-right tabular-nums">{value}%</span>
    </div>
  )
}

export function ServerGrid() {
  const summary = {
    healthy: servers.filter((s) => s.status === "healthy").length,
    warning: servers.filter((s) => s.status === "warning").length,
    critical: servers.filter((s) => s.status === "critical").length,
    offline: servers.filter((s) => s.status === "offline").length,
  }
  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Saludables", count: summary.healthy,  color: "#10b981" },
          { label: "Advertencia", count: summary.warning,  color: "#f59e0b" },
          { label: "Críticos",    count: summary.critical, color: "#ef4444" },
          { label: "Offline",     count: summary.offline,  color: "#64748b" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs text-white/30 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Server cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {servers.map((sv) => {
          const st = statusConfig[sv.status]
          return (
            <div key={sv.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:border-white/15 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-white/80">{sv.name}</div>
                  <div className="text-xs text-white/30 mt-0.5">{roleLabels[sv.role]} · {sv.region}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                </div>
              </div>
              {sv.status !== "offline" ? (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-white/30">CPU</span>
                    </div>
                    <UsageBar value={sv.cpu} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-white/30">RAM</span>
                    </div>
                    <UsageBar value={sv.ram} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[10px] text-white/30">Disk</span>
                    </div>
                    <UsageBar value={sv.disk} warn={80} crit={90} />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/20 italic mt-2">Sin datos disponibles</div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                <span className="text-[10px] text-white/25 font-mono">{sv.ip}</span>
                <span className="text-[10px] font-medium" style={{ color: st.color }}>{sv.uptime}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
