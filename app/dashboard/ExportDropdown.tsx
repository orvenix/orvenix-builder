"use client";

import { useRef, useState } from "react";
import { Download, FileCode2, Globe, X } from "lucide-react";

interface Props {
  siteId: string;
}

export function ExportDropdown({ siteId }: Props) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<"static" | "nextjs" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const download = async (format: "static" | "nextjs") => {
    setDownloading(format);
    setOpen(false);
    setExportError(null);
    try {
      const res = await fetch(`/api/editor/${siteId}/export?format=${format}`)
      if (!res.ok) {
        setExportError("No se pudo generar el export en este momento.")
        return
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${siteId}-${format}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Exportar código"
        onClick={() => setOpen((v) => !v)}
        disabled={!!downloading}
        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-[color:var(--text-muted)] transition-all hover:border-[color:var(--glass-border-hover)] hover:bg-[rgba(0,181,246,0.08)] hover:text-[color:var(--accent)] disabled:opacity-40"
      >
        {downloading ? (
          <span className="h-3 w-3 rounded-full border-2 border-[color:var(--accent)] border-t-transparent animate-spin" />
        ) : (
          <Download size={12} />
        )}
      </button>

      {exportError && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200 shadow-xl shadow-black/20">
          {exportError}
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú de exportación"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[color:var(--bg-2)]/95 py-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.05] mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">Exportar código</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]">
                <X size={10} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => download("static")}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <Globe size={14} className="shrink-0 mt-0.5 text-[color:var(--accent)]" />
              <div>
                <p className="text-xs font-semibold text-[color:var(--text)]">HTML estático</p>
                <p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">index.html + styles.css. Sube a cualquier hosting.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => download("nextjs")}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <FileCode2 size={14} className="shrink-0 mt-0.5 text-[color:var(--accent)]" />
              <div>
                <p className="text-xs font-semibold text-[color:var(--text)]">Next.js 15</p>
                <p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">App Router + Tailwind. Deploy a Vercel en 1 clic.</p>
              </div>
            </button>

            <div className="px-3 py-2 border-t border-white/[0.05] mt-1">
              <p className="text-[9px] leading-relaxed text-[color:var(--text-muted)]">
                Código limpio sin dependencias de Orvenix. Zero vendor lock-in.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
