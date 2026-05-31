import { BrainCircuit, ArrowRight } from "lucide-react"
import { aiInsights } from "../data/insights"
import { colorStyles } from "@/app/webs/_shared/lib/colors"

const priorityStyles: Record<string, string> = {
  Crítica: "bg-red-500/20 text-red-400",
  Alta:    "bg-emerald-500/20 text-emerald-400",
  Info:    "bg-violet-500/20 text-violet-400",
}

export function AIInsights() {
  return (
    <div className="p-5 rounded-2xl bg-white/3 border border-white/7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <BrainCircuit className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Insights</h3>
            <p className="text-xs text-white/35">
              {aiInsights.length} insights detectados hoy
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-500/20 text-violet-300">
          GPT-4o
        </span>
      </div>

      <div className="space-y-3">
        {aiInsights.map((insight) => {
          const Icon = insight.icon
          const c = colorStyles[insight.colorKey]
          return (
            <div
              key={insight.id}
              className="p-4 rounded-xl border border-white/6 bg-white/2 hover:border-white/15 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${c.text}`} />
                  <span className="text-xs font-semibold text-white/80">{insight.title}</span>
                </div>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full shrink-0 ${priorityStyles[insight.priority]}`}>
                  {insight.priority}
                </span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                {insight.description}
              </p>
              <button
                type="button"
                className={`flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all ${c.text}`}
              >
                {insight.action}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
