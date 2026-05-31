"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Rocket, Search, X } from "lucide-react";
import type { AuditIssue } from "@/lib/audit/seoAudit";

interface Props {
  seoScore: number;
  wcagScore: number;
  performanceScore: number;
  errors: AuditIssue[];
  warnings: AuditIssue[];
  onPublishAnyway: () => void;
  onCancel: () => void;
  onOpenSeo: () => void;
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const cls =
    score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 50 ? "text-amber-400  bg-amber-500/10  border-amber-500/20" :
                  "text-red-400    bg-red-500/10    border-red-500/20";
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-xl border px-4 py-2 ${cls}`}>
      <span className="text-2xl font-extrabold leading-none">{score}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

export function AuditGateDialog({
  seoScore, wcagScore, performanceScore, errors, warnings,
  onPublishAnyway, onCancel, onOpenSeo,
}: Props) {
  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar validación antes de publicar"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0b1020] shadow-2xl shadow-black/60 editor-anim-scale-in">
        {/* Top accent */}
        <div className={`h-1 w-full ${hasErrors ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-amber-500 to-yellow-400"}`} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${hasErrors ? "bg-red-500/15 border border-red-500/20" : "bg-amber-500/15 border border-amber-500/20"}`}>
              {hasErrors
                ? <AlertCircle size={18} className="text-red-400" />
                : <AlertTriangle size={18} className="text-amber-400" />
              }
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white leading-tight">
                {hasErrors ? "Errores antes de publicar" : "Avisos antes de publicar"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hasErrors
                  ? `${errors.length} error${errors.length > 1 ? "es" : ""} crítico${errors.length > 1 ? "s" : ""} encontrado${errors.length > 1 ? "s" : ""}`
                  : `${warnings.length} aviso${warnings.length > 1 ? "s" : ""} — puede publicar igual`
                }
              </p>
            </div>
          </div>
          <button type="button" onClick={onCancel}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Scores */}
        <div className="flex gap-2 px-6 pb-4">
          <ScorePill score={seoScore} label="SEO" />
          <ScorePill score={wcagScore} label="WCAG" />
          <ScorePill score={performanceScore} label="PERF" />
          <div className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl border px-4 py-2 ${hasErrors ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"}`}>
            <span className="text-2xl font-extrabold leading-none">{errors.length}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Errores</span>
          </div>
        </div>

        {/* Issues list */}
        <div className="max-h-52 overflow-y-auto px-6 pb-4 space-y-2">
          {errors.map((issue) => (
            <div key={issue.id} className="flex gap-2.5 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2">
              <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-300">{issue.title}</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">{issue.message}</p>
              </div>
            </div>
          ))}
          {warnings.slice(0, 3).map((issue) => (
            <div key={issue.id} className="flex gap-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-slate-300">{issue.title}</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">{issue.message}</p>
              </div>
            </div>
          ))}
          {warnings.length > 3 && (
            <p className="text-[10px] text-slate-600 text-center">+{warnings.length - 3} avisos más</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-6">
          <button type="button" onClick={onOpenSeo}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-white/[0.08] text-[11px] font-semibold text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors">
            <Search size={12} />
            Ver auditoría
          </button>

          {hasErrors ? (
            <button type="button" onClick={onPublishAnyway}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-red-500/30 bg-red-500/10 text-[11px] font-bold text-red-300 hover:bg-red-500/20 transition-colors">
              <Rocket size={12} />
              Publicar igual
            </button>
          ) : (
            <button type="button" onClick={onPublishAnyway}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
              <CheckCircle2 size={12} />
              Publicar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
