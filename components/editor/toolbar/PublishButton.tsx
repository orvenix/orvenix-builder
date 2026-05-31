"use client";

import { useMemo, useState } from "react";
import { Globe, Loader2, CheckCircle2, ExternalLink, Zap, AlertCircle, Search } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { runSeoAudit, calcSeoScore, type AuditIssue } from "@/lib/audit/seoAudit";
import { runWcagAudit, calcWcagScore } from "@/lib/audit/wcagAudit";
import { runPerformanceAudit, calcPerformanceScore } from "@/lib/audit/performanceAudit";
import { AuditGateDialog } from "./AuditGateDialog";

type State = "idle" | "loading" | "audit" | "published" | "error";

export function PublishButton() {
  const websiteId  = useEditorStore((s) => s.websiteId);
  const tree       = useEditorStore((s) => s.tree);
  const setSeoOpen = useEditorStore((s) => s.setSeoOpen);
  const onOpenSeo  = () => setSeoOpen(true);
  const [state, setState]     = useState<State>("idle");
  const [url, setUrl]         = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reactive audit scores — shown as a mini badge next to the button
  const { seoScore, wcagScore, performanceScore, errors, warnings } = useMemo(() => {
    const seoIssues  = runSeoAudit(tree);
    const wcagIssues = runWcagAudit(tree);
    const performanceIssues = runPerformanceAudit(tree);
    return {
      seoScore:  calcSeoScore(seoIssues),
      wcagScore: calcWcagScore(wcagIssues),
      performanceScore: calcPerformanceScore(performanceIssues),
      errors:    [...seoIssues, ...wcagIssues, ...performanceIssues].filter((i): i is AuditIssue => i.severity === "error"),
      warnings:  [...seoIssues, ...wcagIssues, ...performanceIssues].filter((i): i is AuditIssue => i.severity === "warning"),
    };
  }, [tree]);

  const doPublish = async () => {
    if (!websiteId || state === "loading") return;
    setState("loading");
    setErrorMsg(null);

    try {
      const res  = await fetch(`/api/editor/${websiteId}/publish`, { method: "POST" });
      const data = await res.json() as { ok?: boolean; url?: string; error?: string };

      if (data.ok && data.url) {
        setUrl(data.url);
        setState("published");
        setTimeout(() => setState("idle"), 8000);
      } else {
        setErrorMsg(data.error ?? "No se pudo publicar.");
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      }
    } catch {
      setErrorMsg("Error de red.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const handlePublish = () => {
    if (!websiteId || state === "loading") return;
    // Run audit gate if there are any issues
    if (errors.length > 0 || warnings.length > 0) {
      setState("audit");
    } else {
      void doPublish();
    }
  };

  if (!websiteId || websiteId.startsWith("draft:")) return null;

  /* ── Audit gate dialog ── */
  if (state === "audit") {
    return (
      <AuditGateDialog
        seoScore={seoScore}
        wcagScore={wcagScore}
        performanceScore={performanceScore}
        errors={errors}
        warnings={warnings}
        onPublishAnyway={() => { setState("idle"); void doPublish(); }}
        onCancel={() => setState("idle")}
        onOpenSeo={() => { setState("idle"); onOpenSeo?.(); }}
      />
    );
  }

  /* ── Published state ── */
  if (state === "published" && url) {
    return (
      <div className="flex items-center gap-1.5 editor-anim-scale-in">
        <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] px-2 py-0.5">
          <CheckCircle2 size={11} className="shrink-0 text-[color:var(--accent)]" />
          <span className="hidden text-[11px] font-semibold text-[color:var(--accent)] sm:inline">Publicado</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white hover:border-white/15"
        >
          <ExternalLink size={11} />
          <span className="hidden sm:inline">Ver sitio</span>
        </a>
      </div>
    );
  }

  /* ── Error state ── */
  if (state === "error") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg border border-red-500/30 bg-red-500/10 editor-anim-scale-in">
        <AlertCircle size={11} className="text-red-400 shrink-0" />
        <span className="text-[11px] font-medium text-red-400 hidden sm:inline truncate max-w-[120px]">
          {errorMsg}
        </span>
      </div>
    );
  }

  /* ── Loading state ── */
  if (state === "loading") {
    return (
      <div className="relative flex h-7 items-center gap-1.5 overflow-hidden rounded-lg px-3 text-xs font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, #00b5f6 0%, #0083b3 100%)",
          boxShadow: "0 2px 12px rgba(0,131,179,0.35), 0 0 0 1px rgba(0,181,246,0.25)",
        }}>
        <span className="absolute inset-0 editor-publish-shimmer" />
        <Loader2 size={12} className="animate-spin relative z-10" />
        <span className="relative z-10 hidden sm:inline">Publicando…</span>
      </div>
    );
  }

  /* ── Idle state ── */
  const hasIssues = errors.length > 0 || warnings.length > 0;

  return (
    <div className="flex items-center gap-1">
      {/* Mini SEO score badge */}
      {hasIssues && (
        <button
          type="button"
          title={`SEO: ${seoScore} · WCAG: ${wcagScore} · PERF: ${performanceScore} · ${errors.length} errores`}
          onClick={() => onOpenSeo?.()}
          className={`flex items-center gap-1 h-6 px-1.5 rounded-md text-[10px] font-semibold transition-colors ${
            errors.length > 0
              ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
              : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
          }`}
        >
          <Search size={9} />
          {errors.length > 0 ? `${errors.length} error${errors.length > 1 ? "es" : ""}` : `${seoScore}`}
        </button>
      )}

      <button
        type="button"
        onClick={handlePublish}
        className="relative flex h-7 shrink-0 items-center gap-1.5 overflow-hidden rounded-lg px-2.5 text-xs font-semibold text-white transition-all duration-200 sm:px-3 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          boxShadow: "0 2px 10px rgba(0,131,179,0.30), 0 0 0 1px rgba(0,181,246,0.20)",
        }}
      >
        <span className="absolute inset-0 opacity-0 hover:opacity-100 editor-publish-shimmer transition-opacity" />
        <Globe size={12} className="relative z-10 shrink-0" />
        <span className="relative z-10 hidden sm:inline">Publicar</span>
        <Zap size={9} className="relative z-10 hidden xl:inline text-cyan-100" />
      </button>
    </div>
  );
}
