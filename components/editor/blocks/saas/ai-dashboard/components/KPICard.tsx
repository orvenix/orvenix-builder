import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { Sparkline } from "@/app/webs/_shared/components/ui/Sparkline"
import { colorStyles, type ColorKey } from "@/app/webs/_shared/lib/colors"

interface KPICardProps {
  label: string
  value: string
  change: string
  positive: boolean
  icon: LucideIcon
  colorKey: ColorKey
  sparkline?: number[]
}

export function KPICard({ label, value, change, positive, icon: Icon, colorKey, sparkline }: KPICardProps) {
  const c = colorStyles[colorKey]

  return (
    <div className="motion-card motion-glass relative p-5 rounded-2xl bg-white/3 border border-white/7 hover:bg-white/5 hover:border-white/15 group overflow-hidden">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${c.bgSolid}`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
          {sparkline && <Sparkline data={sparkline} colorKey={colorKey} />}
        </div>

        <div className="text-2xl font-bold text-white tracking-tight mb-1">{value}</div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">{label}</span>
          <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        </div>
      </div>
    </div>
  )
}
