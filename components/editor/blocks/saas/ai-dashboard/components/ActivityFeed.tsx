import { activities } from "../data/activities"
import { colorStyles } from "@/app/webs/_shared/lib/colors"

export function ActivityFeed() {
  return (
    <div className="p-5 rounded-2xl bg-white/3 border border-white/7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Actividad Reciente</h3>
          <p className="text-xs text-white/35 mt-0.5">Eventos en tiempo real</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      <div className="space-y-1">
        {activities.map((activity) => {
          const Icon = activity.icon
          const c = colorStyles[activity.colorKey]
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors cursor-default"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">{activity.message}</div>
                <div className="text-[11px] text-white/35 mt-0.5 truncate">{activity.detail}</div>
              </div>
              <span className="text-[10px] text-white/25 shrink-0 mt-0.5">{activity.time}</span>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="w-full mt-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors border-t border-white/6 pt-3"
      >
        Ver todos los eventos →
      </button>
    </div>
  )
}
