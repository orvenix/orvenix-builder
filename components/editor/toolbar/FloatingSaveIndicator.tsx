"use client";

import { CheckCheck, Cloud, CloudOff } from "lucide-react";
import { selectSaveStatus, useEditorStore } from "@/store/useEditorStore";

export function FloatingSaveIndicator() {
  const status = useEditorStore(selectSaveStatus);

  if (status === "idle") return null;

  const config = {
    dirty: {
      icon: <Cloud size={13} />,
      label: "Cambios pendientes",
      className: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    },
    saving: {
      icon: (
        <svg width="13" height="13" viewBox="0 0 13 13" className="editor-spin-slow">
          <circle cx="6.5" cy="6.5" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="18 7" />
        </svg>
      ),
      label: "Guardando...",
      className: "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] text-[color:var(--text)]",
    },
    saved: {
      icon: <CheckCheck size={13} />,
      label: "Cambios guardados",
      className: "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] text-[color:var(--text)]",
    },
    error: {
      icon: <CloudOff size={13} />,
      label: "Error al guardar",
      className: "border-red-400/25 bg-red-400/10 text-red-100",
    },
  } as const;

  const item = config[status as keyof typeof config];
  if (!item) return null;

  return (
    <div
      className={`pointer-events-none fixed right-4 top-16 z-[80] flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-2xl shadow-black/35 backdrop-blur-xl editor-anim-fade-down ${item.className}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
}
