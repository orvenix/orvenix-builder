"use client"

import { employees, departmentHeadcount } from "../data/employees"
import type { EmployeeStatus } from "../data/employees"

const statusConfig: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active:     { label: "Activo",       color: "#10b981", bg: "#10b98118" },
  remote:     { label: "Remoto",       color: "#06b6d4", bg: "#06b6d418" },
  leave:      { label: "Baja temporal",color: "#f59e0b", bg: "#f59e0b18" },
  onboarding: { label: "Onboarding",   color: "#8b5cf6", bg: "#8b5cf618" },
}

export function EmployeeTable() {
  const total = departmentHeadcount.reduce((s, d) => s + d.count, 0)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Department breakdown */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
        <div className="text-sm font-semibold text-white mb-1">Por Departamento</div>
        <div className="text-xs text-white/30 mb-4">{total} empleados totales</div>
        <div className="space-y-3">
          {departmentHeadcount.map((d) => (
            <div key={d.dept}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">{d.dept}</span>
                <span className="text-xs text-white/40 font-medium">{d.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(d.count / total) * 100}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee list */}
      <div className="xl:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Empleados Recientes</div>
          <button type="button" className="text-xs text-amber-400 hover:text-amber-300 font-medium">Ver todos →</button>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {employees.map((e) => {
            const st = statusConfig[e.status]
            return (
              <div key={e.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: e.color + "30", color: e.color }}>
                  {e.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 font-medium">{e.name}</div>
                  <div className="text-xs text-white/30">{e.role} · {e.department}</div>
                </div>
                <div className="hidden xl:block text-xs text-white/30">{e.location}</div>
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <div className="hidden xl:flex items-center gap-1.5 w-20">
                  <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500/70" style={{ width: `${e.performance}%` }} />
                  </div>
                  <span className="text-xs text-white/30">{e.performance}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
