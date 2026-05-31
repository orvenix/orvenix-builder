import { Plus } from "lucide-react"
import { colorStyles } from "@/app/webs/_shared/lib/colors"
import { kanbanColumns } from "../data/kanban"

export function KanbanBoard() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-w-max">
      {kanbanColumns.map((col) => {
        const cc = colorStyles[col.colorKey]
        return (
          <div key={col.id} className="w-60 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cc.bgSolid}`} />
                <span className="text-xs font-semibold text-white/60">{col.label}</span>
                <span className="text-xs text-white/25">{col.cards.length}</span>
              </div>
              <button
                type="button"
                title={`Agregar tarea en ${col.label}`}
                aria-label={`Agregar tarea en ${col.label}`}
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {col.cards.map((card) => {
                const tc = colorStyles[card.tagColorKey]
                const ac = colorStyles[card.assigneeColorKey]
                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-xl bg-white/4 border border-white/7 hover:bg-white/7 hover:border-white/15 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-white/20">{card.id}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-md ${tc.bg} ${tc.text}`}>
                        {card.tag}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 font-medium leading-relaxed mb-3">{card.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/25">{card.points}pt</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${ac.bgSolid}`}>
                        {card.assigneeInitials}
                      </div>
                    </div>
                  </div>
                )
              })}

              <button
                type="button"
                className="w-full p-2.5 rounded-xl border border-dashed border-white/10 text-xs text-white/20 hover:text-white/40 hover:border-white/20 transition-all text-center"
              >
                + Agregar tarea
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
