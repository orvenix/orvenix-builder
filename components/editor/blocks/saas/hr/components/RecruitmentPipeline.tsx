"use client"

import { candidates, stageOrder, stageLabels, stageColors } from "../data/recruitment"

export function RecruitmentPipeline() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Pipeline de Reclutamiento</div>
          <div className="text-xs text-white/30 mt-0.5">{candidates.length} candidatos activos</div>
        </div>
        <button type="button" className="text-xs text-amber-400 hover:text-amber-300 font-medium">+ Añadir candidato</button>
      </div>
      <div className="p-5 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {stageOrder.map((stage) => {
            const stageCandidates = candidates.filter((c) => c.stage === stage)
            const color = stageColors[stage]
            return (
              <div key={stage} className="w-48">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-white/60">{stageLabels[stage]}</span>
                  <span className="ml-auto text-xs text-white/30 font-medium">{stageCandidates.length}</span>
                </div>
                <div className="space-y-2">
                  {stageCandidates.map((c) => (
                    <div key={c.id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 hover:border-white/15 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: c.color + "30", color: c.color }}>
                          {c.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-white/80 font-medium truncate">{c.name}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-white/30 truncate mb-2">{c.role}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/25">{c.source}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c.score}%`, backgroundColor: color }} />
                          </div>
                          <span className="text-[10px] text-white/30">{c.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageCandidates.length === 0 && (
                    <div className="rounded-lg border border-dashed border-white/[0.06] p-3 text-center text-[10px] text-white/20">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
