import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { pipelineStages } from "../data/pipeline"

export function Pipeline() {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {pipelineStages.map((stage) => {
          const sc = colorStyles[stage.colorKey]
          return (
            <div key={stage.id} className="w-64 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sc.bgSolid}`} />
                  <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                  <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{stage.count}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">{stage.totalValue}</span>
              </div>

              <div className="space-y-2">
                {stage.deals.map((deal) => {
                  const c = colorStyles[deal.colorKey]
                  return (
                    <div
                      key={deal.name}
                      className="p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${c.bgSolid}`}>
                          {deal.initials}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{deal.value}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 mb-1">{deal.name}</div>
                      {deal.daysInStage > 0 ? (
                        <div className="text-[10px] text-slate-400">{deal.daysInStage}d en esta etapa</div>
                      ) : (
                        <div className="text-[10px] text-emerald-500 font-semibold">✓ Cerrado</div>
                      )}
                    </div>
                  )
                })}

                <button
                  type="button"
                  className="w-full p-2.5 rounded-xl border border-dashed border-slate-200 text-xs text-slate-300 hover:text-slate-400 hover:border-slate-300 transition-all text-center"
                >
                  + Agregar deal
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
