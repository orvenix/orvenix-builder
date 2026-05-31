"use client"

import { useState } from "react"
import { MoreHorizontal, Circle, CheckCircle2, Clock, Zap, ChevronUp, Minus, ChevronDown } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { issues } from "../data/issues"
import type { IssueStatus, Priority } from "../types"

const statusConfig: Record<IssueStatus, { label: string; icon: typeof Circle; colorClass: string }> = {
  todo:        { label: "Pendiente",   icon: Circle,       colorClass: "text-slate-400"   },
  in_progress: { label: "En progreso", icon: Clock,        colorClass: "text-amber-400"   },
  in_review:   { label: "En revisión", icon: Zap,          colorClass: "text-indigo-400"  },
  done:        { label: "Completado",  icon: CheckCircle2, colorClass: "text-emerald-400" },
}

const priorityConfig: Record<Priority, { icon: typeof Circle; colorClass: string }> = {
  urgent: { icon: ChevronUp,   colorClass: "text-red-400"   },
  high:   { icon: ChevronUp,   colorClass: "text-amber-400" },
  medium: { icon: Minus,       colorClass: "text-slate-400" },
  low:    { icon: ChevronDown, colorClass: "text-slate-500" },
}

const STATUS_ORDER: IssueStatus[] = ["in_progress", "in_review", "todo", "done"]

export function IssueList() {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))

  return (
    <div className="space-y-4">
      {STATUS_ORDER.map((status) => {
        const group = issues.filter((i) => i.status === status)
        if (group.length === 0) return null
        const cfg = statusConfig[status]
        const Icon = cfg.icon

        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2 px-2">
              <Icon className={`w-3.5 h-3.5 ${cfg.colorClass}`} />
              <span className={`text-xs font-semibold ${cfg.colorClass}`}>{cfg.label}</span>
              <span className="text-xs text-white/20">{group.length}</span>
            </div>

            <div className="space-y-px">
              {group.map((issue) => {
                const PriorityIcon = priorityConfig[issue.priority].icon
                const StatusIcon   = statusConfig[issue.status].icon
                const ac = colorStyles[issue.assigneeColorKey]
                const lc = colorStyles[issue.labelColorKey]
                const isSelected = selected.includes(issue.id)

                return (
                  <div
                    key={issue.id}
                    onClick={() => toggle(issue.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group ${
                      isSelected
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-white/4 border border-transparent"
                    }`}
                  >
                    <PriorityIcon className={`w-3.5 h-3.5 shrink-0 ${priorityConfig[issue.priority].colorClass}`} />
                    <StatusIcon   className={`w-3.5 h-3.5 shrink-0 ${statusConfig[issue.status].colorClass}`} />

                    <span className="text-xs text-white/20 font-mono shrink-0 w-14">{issue.id}</span>

                    <span className={`flex-1 text-sm truncate ${issue.status === "done" ? "text-white/30 line-through" : "text-white/75"}`}>
                      {issue.title}
                    </span>

                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-md shrink-0 hidden sm:block ${lc.bg} ${lc.text}`}>
                      {issue.labelText}
                    </span>

                    <span className="text-xs text-white/25 shrink-0 hidden md:block">{issue.estimate}d</span>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${ac.bgSolid}`}>
                      {issue.assigneeInitials}
                    </div>

                    <button
                      type="button"
                      title="Más opciones"
                      aria-label="Más opciones"
                      className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
