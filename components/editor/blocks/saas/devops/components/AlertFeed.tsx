"use client"

import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react"
import { alerts, severityConfig } from "../data/alerts"
import type { AlertSeverity } from "../data/alerts"

const SeverityIcon: Record<AlertSeverity, typeof AlertTriangle> = {
  critical: AlertCircle,
  warning:  AlertTriangle,
  info:     Info,
}

export function AlertFeed() {
  const active = alerts.filter((a) => !a.resolved)
  const resolved = alerts.filter((a) => a.resolved)
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Alertas Activas</div>
          <div className="text-xs text-white/30 mt-0.5">{active.length} activas · {resolved.length} resueltas</div>
        </div>
        <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Ver historial →</button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {alerts.map((alert) => {
          const cfg = severityConfig[alert.severity]
          const Icon = SeverityIcon[alert.severity]
          return (
            <div key={alert.id} className={`px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors ${alert.resolved ? "opacity-40" : ""}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
                {alert.resolved
                  ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                  : <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-white/80 font-medium leading-tight">{alert.title}</div>
                  <span className="text-[10px] text-white/25 shrink-0">{alert.time}</span>
                </div>
                <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{alert.description}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                  <span className="text-[10px] text-white/20 font-mono">{alert.service}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
