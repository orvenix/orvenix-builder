import { TrendingUp, TrendingDown } from "lucide-react"
import { crmStats } from "../data/stats"

export function StatsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {crmStats.map((stat) => {
        return (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
          >
            <div className="text-xs text-slate-400 font-medium mb-2">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${stat.positive ? "text-emerald-500" : "text-red-500"}`}>
              {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {stat.change} este mes
            </div>
          </div>
        )
      })}
    </div>
  )
}
