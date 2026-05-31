"use client";

import { useEditorStore, selectSaveStatus } from "@/store/useEditorStore";
import { Cloud, CloudOff, CheckCheck } from "lucide-react";

export function SaveStatus() {
  const status = useEditorStore(selectSaveStatus);

  if (status === "idle") return null;

  const configs = {
    dirty: {
      dot: "bg-amber-400 editor-status-dot-live",
      icon: <Cloud size={11} />,
      label: "Cambios pendientes",
      ring: "text-[color:var(--text-muted)] border-white/[0.06] bg-transparent",
    },
    saving: {
      dot: "bg-[color:var(--accent)] editor-status-dot-live",
      icon: (
        <svg width="11" height="11" viewBox="0 0 11 11" className="editor-spin-slow">
          <circle cx="5.5" cy="5.5" r="4" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeDasharray="18 6" />
        </svg>
      ),
      label: "Guardando...",
      ring: "text-[color:var(--accent)] border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)]",
    },
    saved: {
      dot: "bg-[color:var(--accent)]",
      icon: <CheckCheck size={11} />,
      label: "Cambios guardados",
      ring: "text-[color:var(--accent)] border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.08)]",
    },
    error: {
      dot: "bg-red-400 editor-status-dot-live",
      icon: <CloudOff size={11} />,
      label: "Error al guardar",
      ring: "text-red-400 border-red-500/20 bg-red-500/10",
    },
  } as const;

  const cfg = configs[status as keyof typeof configs];
  if (!cfg) return null;

  return (
    <div className={`hidden items-center gap-1.5 h-6 rounded-full border px-2 text-[11px] font-medium sm:flex transition-all duration-300 editor-anim-fade-in ${cfg.ring}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="flex items-center gap-1">
        {cfg.icon}
        <span className="hidden xl:inline">{cfg.label}</span>
      </span>
    </div>
  );
}
