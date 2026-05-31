import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { Sparkline } from "./Sparkline"
import { colorStyles, type ColorKey } from "@/app/webs/_shared/lib/colors"
import { cn } from "@/app/webs/_shared/lib/cn"

interface StatCardProps {
  label: string
  value: string
  change: string
  positive: boolean
  icon: LucideIcon
  colorKey: ColorKey
  sparkline?: number[]
  mode?: "dark" | "light"
  className?: string
}

export function StatCard({
  label,
  value,
  change,
  positive,
  icon: Icon,
  colorKey,
  sparkline,
  mode = "dark",
  className,
}: StatCardProps) {
  const isDark = mode === "dark"
  const c = colorStyles[colorKey]

  return (
    <div
      className={cn(
        "motion-card motion-glass relative p-5 rounded-2xl border overflow-hidden group",
        isDark
          ? "bg-white/3 border-white/7 hover:bg-white/5 hover:border-white/15"
          : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md",
        className
      )}
    >
      {isDark && (
        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${c.bgSolid}`} />
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("w-4 h-4", c.text)} />
          </div>
          {sparkline && <Sparkline data={sparkline} colorKey={colorKey} />}
        </div>

        <div className={cn("text-2xl font-bold tracking-tight mb-1", isDark ? "text-white" : "text-slate-800")}>
          {value}
        </div>

        <div className="flex items-center justify-between">
          <span className={cn("text-xs", isDark ? "text-white/40" : "text-slate-400")}>{label}</span>
          <div className={cn("flex items-center gap-1 text-xs font-semibold", positive ? "text-emerald-400" : "text-red-400")}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        </div>
      </div>
    </div>
  )
}
