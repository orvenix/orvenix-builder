import React from 'react';
import { Users2, Target, FileText, Handshake, CheckCircle2, BrainCircuit, MoreHorizontal } from "lucide-react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";

interface CrmPipelineProps {
  stages?: number;
  enableAiScoring?: boolean;
}

const STAGE_METADATA = [
  { label: "Prospectos", icon: Users2, color: "#3b82f6", bg: "bg-blue-50" },
  { label: "Calificados", icon: Target, color: "#6366f1", bg: "bg-indigo-50" },
  { label: "Propuesta", icon: FileText, color: "#f59e0b", bg: "bg-amber-50" },
  { label: "Negociación", icon: Handshake, color: "#a855f7", bg: "bg-purple-50" },
  { label: "Ganados", icon: CheckCircle2, color: "#10b981", bg: "bg-emerald-50" },
  { label: "Seguimiento", icon: Users2, color: "#64748b", bg: "bg-slate-50" },
  { label: "Análisis", icon: Target, color: "#f43f5e", bg: "bg-rose-50" },
];

export function CrmPipeline({ stages = 5, enableAiScoring = true }: CrmPipelineProps) {
  const theme = useEditorStore((s) => s.tree.theme);
  const primary = theme?.colors?.primary ?? "#4f46e5";
  const background = theme?.colors?.background ?? "#ffffff";
  const text = theme?.colors?.text ?? "#0f172a";
  const accent = theme?.colors?.accent ?? primary;
  const cardRadius = theme?.radius?.card ?? "1.5rem";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const motionDuration = theme?.motion?.duration ?? "240ms";
  const activeStages = STAGE_METADATA.slice(0, Math.min(stages, STAGE_METADATA.length));

  return (
    <div
      className="w-full min-w-0 space-y-5 p-4 sm:p-6"
      style={{
        borderRadius: `calc(${cardRadius} * 1.2)`,
        border: `1px solid ${primary}18`,
        background: `${background}f2`,
        boxShadow: softShadow,
      }}
    >
      <div className="flex min-w-0 flex-col justify-between gap-4 px-0 sm:px-2 md:flex-row md:items-center">
        <div className="min-w-0 space-y-1">
          <h3 className="flex min-w-0 items-center gap-3 text-lg font-bold" style={{ color: text }}>
            Pipeline Comercial
          </h3>
          {enableAiScoring && (
            <span
              className="inline-flex max-w-full items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold text-white"
              style={{
                borderRadius: theme?.radius?.button ?? "999px",
                background: `linear-gradient(135deg, ${primary}, ${accent})`,
                boxShadow: softShadow,
              }}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="truncate">AI ENGINE ACTIVE</span>
            </span>
          )}
        </div>
        <div
          className="flex min-w-0 items-center gap-4 px-4 py-2"
          style={{
            borderRadius: cardRadius,
            border: `1px solid ${primary}18`,
            background,
            boxShadow: softShadow,
          }}
        >
          <div className="min-w-0 text-left md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${text}88` }}>Valor Total</p>
            <p className="text-sm font-black" style={{ color: text }}>$128,430.00</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-3">
        {activeStages.map((stage, idx) => {
          return (
            <div key={idx} className="flex min-w-0 flex-col gap-3">
              <div className="flex min-w-0 items-center justify-between gap-2 px-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: stage.color }} />
                  <span className="truncate text-xs font-bold uppercase tracking-tight" style={{ color: `${text}cc` }}>{stage.label}</span>
                  <span className="text-[10px] font-medium px-1.5 rounded" style={{ color: `${text}88`, background: `${primary}10` }}>4</span>
                </div>
                <MoreHorizontal className="w-4 h-4 cursor-pointer" style={{ color: `${text}55` }} />
              </div>
              
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="group min-w-0 cursor-grab p-4 transition-all active:scale-95"
                    style={{
                      borderRadius: cardRadius,
                      border: `1px solid ${primary}16`,
                      background,
                      boxShadow: softShadow,
                      transitionDuration: motionDuration,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full border-2 text-[8px] flex items-center justify-center font-bold uppercase" style={{ background: `${primary}14`, borderColor: background, color: primary }}>JD</div>
                      </div>
                      <span className="shrink-0 text-xs font-bold" style={{ color: text }}>$4,200</span>
                    </div>
                    <p className="mb-1 truncate text-xs font-bold transition-colors" style={{ color: `${text}cc` }}>Tech Solution Corp</p>
                    <div className="mb-3 flex min-w-0 items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${text}33` }} />
                      <span className="truncate text-[10px] font-medium" style={{ color: `${text}88` }}>Actualizado hace 2h</span>
                    </div>

                    {enableAiScoring && (
                      <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: `1px solid ${primary}10` }}>
                        <span className="text-[10px] font-bold" style={{ color: `${text}88` }}>SCORE</span>
                        <div className="flex items-center gap-1 font-black text-[10px]" style={{ color: accent }}>
                          <span className="px-1.5 py-0.5 rounded tracking-tighter" style={{ background: `${accent}14` }}>98.2%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

CrmPipeline.defaults = {
  stages: 5,
  enableAiScoring: true,
};
