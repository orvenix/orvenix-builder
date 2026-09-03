"use client"

import { Eye, PanelsTopLeft } from "lucide-react"

import { useEditorExperience } from "./ExperienceContext"

export function ExperienceModeToggle() {
  const {
    isClient,
    canSwitchMode,
    setMode,
  } = useEditorExperience()

  if (!canSwitchMode) {
    return null
  }

  return (
    <div className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.035] p-1">
      <button
        type="button"
        title="Abrir herramientas profesionales"
        aria-pressed={!isClient}
        onClick={() => setMode("studio")}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
          !isClient
            ? "bg-cyan-400/10 text-cyan-300"
            : "text-slate-500 hover:text-slate-300",
        ].join(" ")}
      >
        <PanelsTopLeft className="h-3.5 w-3.5" />
        Studio
      </button>

      <button
        type="button"
        title="Ver la experiencia sencilla del cliente"
        aria-pressed={isClient}
        onClick={() => setMode("client")}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
          isClient
            ? "bg-emerald-400/10 text-emerald-300"
            : "text-slate-500 hover:text-slate-300",
        ].join(" ")}
      >
        <Eye className="h-3.5 w-3.5" />
        Vista cliente
      </button>
    </div>
  )
}
