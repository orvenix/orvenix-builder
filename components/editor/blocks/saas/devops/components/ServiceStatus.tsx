"use client"

import { services, serviceStatusConfig } from "../data/services"

export function ServiceStatus() {
  const upCount = services.filter((s) => s.status === "up").length
  const allCount = services.length
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Estado de Servicios</div>
          <div className="text-xs text-white/30 mt-0.5">{upCount}/{allCount} operativos</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {Math.round((upCount / allCount) * 100)}% uptime global
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {services.map((svc) => {
          const st = serviceStatusConfig[svc.status]
          const latencyColor = svc.latency === 0 ? "#ef4444" : svc.latency > 100 ? "#f59e0b" : "#10b981"
          return (
            <div key={svc.name} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/75 font-medium">{svc.name}</div>
                <div className="text-xs text-white/25 font-mono mt-0.5">{svc.endpoint}</div>
              </div>
              <div className="text-right hidden xl:block">
                <div className="text-xs text-white/40">{svc.requests}</div>
                <div className="text-[10px] text-white/20 mt-0.5">req/día</div>
              </div>
              <div className="text-right w-16">
                <div className="text-sm font-semibold tabular-nums" style={{ color: latencyColor }}>
                  {svc.latency === 0 ? "—" : `${svc.latency}ms`}
                </div>
                <div className="text-[10px] text-white/25 mt-0.5">latencia</div>
              </div>
              <div className="w-20 text-right">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: st.color, backgroundColor: st.color + "18" }}>
                  {st.label}
                </span>
              </div>
              <div className="text-xs text-white/30 w-14 text-right hidden xl:block">{svc.uptime}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
