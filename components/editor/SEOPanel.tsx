"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useEditorStore } from "./store/useEditorStore";
import {
  Search, Image as ImageIcon, X, Info,
  AlertCircle, AlertTriangle, CheckCircle2, Zap, ShieldCheck, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runSeoAudit, calcSeoScore, type AuditIssue } from "@/lib/audit/seoAudit";
import { runWcagAudit, calcWcagScore } from "@/lib/audit/wcagAudit";
import { runPerformanceAudit, calcPerformanceScore } from "@/lib/audit/performanceAudit";
import { applyAuditFixesAI } from "@/app/actions/ai";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 50 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                  "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border ${color}`}>
      <span className="text-xl font-extrabold leading-none">{score}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

function IssueRow({
  issue,
  onFix,
}: {
  issue: AuditIssue;
  onFix?: () => void;
}) {
  const Icon =
    issue.severity === "error"   ? AlertCircle :
    issue.severity === "warning" ? AlertTriangle :
                                   Info;
  const color =
    issue.severity === "error"   ? "text-red-400" :
    issue.severity === "warning" ? "text-amber-400" :
                                   "text-slate-500";

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-white/4 last:border-0">
      <Icon size={13} className={`${color} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-300 mb-0.5">{issue.title}</p>
        <p className="text-[10px] text-slate-600 leading-relaxed">{issue.message}</p>
        {issue.autoFixable && onFix && (
          <button
            type="button"
            onClick={onFix}
            className="mt-1.5 inline-flex items-center gap-1 h-5 px-2 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            <Wrench size={9} /> Auto-fix
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export const SEOPanel = ({ onClose }: { onClose: () => void }) => {
  const seo = useEditorStore((s) => s.tree.seo) || { title: "", description: "", keywords: "", ogImage: "" };
  const tree = useEditorStore((s) => s.tree);
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const updateSEO = useEditorStore((s) => s.updateSEO);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const openAssetPicker = useEditorStore((s) => s.openAssetPicker);
  const [isApplyingTraceFixes, startTraceFixes] = useTransition();
  const [traceFixMessage, setTraceFixMessage] = useState<string | null>(null);

  // Auditoría reactiva — recalcula cuando el árbol cambia
  const { seoIssues, wcagIssues, performanceIssues, seoScore, wcagScore, performanceScore } = useMemo(() => {
    const seoIssues  = runSeoAudit(tree);
    const wcagIssues = runWcagAudit(tree);
    const performanceIssues = runPerformanceAudit(tree);
    return {
      seoIssues,
      wcagIssues,
      performanceIssues,
      seoScore:  calcSeoScore(seoIssues),
      wcagScore: calcWcagScore(wcagIssues),
      performanceScore: calcPerformanceScore(performanceIssues),
    };
  }, [tree]);

  const allIssues = [...seoIssues, ...wcagIssues, ...performanceIssues];
  const errors   = allIssues.filter((i) => i.severity === "error");
  const warnings = allIssues.filter((i) => i.severity === "warning");
  const autoFixableIssues = allIssues.filter((issue) => issue.autoFixable && issue.fix);

  const applyFix = (issue: AuditIssue) => {
    if (!issue.fix) return;
    const patch = issue.fix();
    if (issue.nodeId) {
      updateNodeProps(issue.nodeId, patch);
      return;
    }
    updateSEO(patch);
  };

  const applyAllFixes = () => {
    autoFixableIssues.forEach((issue) => applyFix(issue));
  };

  const applyTracedFixes = () => {
    setTraceFixMessage(null);
    startTraceFixes(async () => {
      const result = await applyAuditFixesAI(tree, {
        siteId: websiteId,
        pageSlug: activePageSlug,
        source: "seo_panel_trace_fix",
      });

      if (!result.success) {
        setTraceFixMessage(result.message);
        return;
      }

      if (Object.keys(result.seoPatch).length > 0) {
        updateSEO(result.seoPatch);
      }

      result.nodePatches.forEach((entry) => {
        updateNodeProps(entry.nodeId, entry.patch);
      });

      setTraceFixMessage(result.message);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#09101a] border-l border-white/5 w-80 animate-in slide-in-from-right duration-300 shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Search size={18} className="text-indigo-400" />
          <span className="text-sm font-bold tracking-tight">SEO & Accesibilidad</span>
        </div>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Scores ── */}
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Puntuación</p>
          <div className="flex gap-2">
            <ScoreBadge score={seoScore} label="SEO" />
            <ScoreBadge score={wcagScore} label="WCAG AA" />
            <ScoreBadge score={performanceScore} label="PERF" />
            <div className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border flex-1",
              errors.length === 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
            )}>
              <span className="text-xl font-extrabold leading-none">{errors.length}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Errores</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-amber-400 bg-amber-500/10 border-amber-500/20">
              <span className="text-xl font-extrabold leading-none">{warnings.length}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">Avisos</span>
            </div>
          </div>
        </div>

        {/* ── Auditoría ── */}
        {allIssues.length > 0 && (
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {errors.length > 0 ? (
                  <span className="flex items-center gap-1.5 text-red-400"><AlertCircle size={11} /> {errors.length} {errors.length === 1 ? "error crítico" : "errores críticos"}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={11} /> Sin errores críticos</span>
                )}
              </p>
              {autoFixableIssues.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyAllFixes}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Wrench size={10} />
                    Arreglar {autoFixableIssues.length}
                  </button>
                  <button
                    type="button"
                    onClick={applyTracedFixes}
                    disabled={isApplyingTraceFixes}
                    className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors disabled:opacity-50"
                  >
                    <Zap size={10} />
                    {isApplyingTraceFixes ? "Aplicando..." : "Con trazabilidad"}
                  </button>
                </div>
              )}
            </div>
            {traceFixMessage && (
              <p className="mb-3 rounded-lg border border-sky-500/15 bg-sky-500/5 px-2.5 py-2 text-[10px] text-sky-200">
                {traceFixMessage}
              </p>
            )}

            {/* Errores primero */}
            {errors.length > 0 && (
              <div className="mb-3 rounded-xl bg-red-500/5 border border-red-500/10 px-3 py-1">
                {errors.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onFix={issue.autoFixable ? () => applyFix(issue) : undefined} />
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 px-3 py-1">
                {warnings.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onFix={issue.autoFixable ? () => applyFix(issue) : undefined} />
                ))}
              </div>
            )}

            {/* Info */}
            {allIssues.filter((i) => i.severity === "info").length > 0 && (
              <div className="mt-2 rounded-xl bg-white/2 border border-white/5 px-3 py-1">
                {allIssues.filter((i) => i.severity === "info").map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </div>
        )}

        {allIssues.length === 0 && (
          <div className="px-5 py-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 grid place-items-center shrink-0">
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400">Perfecto</p>
              <p className="text-[10px] text-slate-600">Sin problemas SEO ni de accesibilidad detectados.</p>
            </div>
          </div>
        )}

        {/* ── Google Preview ── */}
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Vista previa en Google</p>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="text-[#1a0dab] text-base font-medium truncate mb-1">
              {seo.title || "Título de tu página"}
            </div>
            <div className="text-[#006621] text-xs truncate mb-1 flex items-center gap-1">
              https://tu-sitio.orvenix.io <span className="text-[8px]">▼</span>
            </div>
            <div className="text-[#545454] text-xs line-clamp-2 leading-relaxed">
              {seo.description || "Agrega una descripción para que los usuarios encuentren tu sitio..."}
            </div>
          </div>
        </div>

        {/* ── Inputs SEO ── */}
        <div className="px-5 py-4 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400">Título de la Página</label>
              <span className={cn("text-[10px]", !seo.title ? "text-red-400" : seo.title.length > 60 ? "text-amber-400" : "text-emerald-400/60")}>
                {seo.title?.length ?? 0}/60
              </span>
            </div>
            <input
              type="text"
              value={seo.title}
              onChange={(e) => updateSEO({ title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all"
              placeholder="Ej: Studio Ramírez · Arquitectura Moderna"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400">Meta Descripción</label>
              <span className={cn("text-[10px]", seo.description?.length > 160 ? "text-red-400" : "text-slate-500")}>
                {seo.description?.length ?? 0}/160
              </span>
            </div>
            <textarea
              value={seo.description}
              onChange={(e) => updateSEO({ description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all resize-none"
              placeholder="Describe brevemente de qué trata tu sitio..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">Imagen Open Graph</label>
            <button
              type="button"
              onClick={() => openAssetPicker({ nodeId: "root", propKey: "seo_ogImage" })}
              onKeyDown={(e) => e.key === "Enter" && openAssetPicker({ nodeId: "root", propKey: "seo_ogImage" })}
              className="aspect-video relative rounded-xl border border-dashed border-white/10 bg-white/2 hover:bg-white/4 cursor-pointer flex flex-col items-center justify-center gap-2 group transition-all overflow-hidden"
            >
              {seo.ogImage ? (
                <Image src={seo.ogImage} alt="Vista previa OpenGraph" fill unoptimized sizes="320px" className="object-cover rounded-xl" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-[10px] text-slate-500 font-bold">Seleccionar imagen OG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-indigo-500/5 border-t border-white/5 flex gap-2.5 shrink-0">
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          <Zap size={12} className="text-indigo-400" />
          <ShieldCheck size={12} className="text-emerald-400" />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Auditoría automática de SEO y WCAG 2.1 AA. Los cambios se aplican en tiempo real.
        </p>
      </div>
    </div>
  );
};
