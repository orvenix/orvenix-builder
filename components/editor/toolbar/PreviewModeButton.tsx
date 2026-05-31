"use client";

import { Eye, Pencil } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { cn } from "@/lib/utils";

export function PreviewModeButton() {
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const isResponsivePreviewMode = useEditorStore((s) => s.isResponsivePreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const setResponsivePreviewMode = useEditorStore((s) => s.setResponsivePreviewMode);
  const Icon = isPreviewMode ? Pencil : Eye;

  return (
    <div className="inline-flex h-7 overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setPreviewMode(!isPreviewMode)}
        className={cn(
          "inline-flex h-full items-center gap-1.5 px-2.5 text-xs font-medium transition-all",
          isPreviewMode && !isResponsivePreviewMode
            ? "bg-[rgba(0,181,246,0.12)] text-[color:var(--accent)]"
            : "text-[color:var(--text-secondary)] hover:bg-white/[0.06] hover:text-[color:var(--text)]"
        )}
        title={isPreviewMode ? "Volver a editar" : "Ver preview real"}
      >
        <Icon size={12} />
        <span className="hidden sm:inline">{isPreviewMode ? "Editar" : "Preview"}</span>
      </button>
      <span className="h-full w-px bg-white/[0.07]" />
      <button
        type="button"
        onClick={() => setResponsivePreviewMode(!isResponsivePreviewMode)}
        className={cn(
          "inline-flex h-full items-center px-2 text-[11px] font-semibold transition-all",
          isResponsivePreviewMode
            ? "bg-[rgba(0,131,179,0.14)] text-[color:var(--accent-3)]"
            : "text-[color:var(--text-muted)] hover:bg-white/[0.06] hover:text-[color:var(--text-secondary)]"
        )}
        title="Comparar desktop, tablet y movil"
      >
        3x
      </button>
    </div>
  );
}
