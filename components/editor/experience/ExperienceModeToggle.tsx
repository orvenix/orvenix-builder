"use client"

import { PanelsTopLeft, Sparkles } from "lucide-react"

import { useEditorExperience } from "./ExperienceContext"

/** CV1-2: the visible Simple/Pro switch. Changing mode never touches the site. */
export function ExperienceModeToggle() {
  const {
    profile,
    canSwitchMode,
    setMode,
  } = useEditorExperience()

  if (!canSwitchMode) {
    return null
  }

  const isSimple = profile === "simple"

  return (
    <div role="group" aria-label="Modo del editor" className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.035] p-1">
      <button
        type="button"
        title="Edita los datos de tu negocio sin tocar el diseño"
        aria-pressed={isSimple}
        onClick={() => setMode("client")}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
          isSimple
            ? "bg-emerald-400/10 text-emerald-300"
            : "text-slate-500 hover:text-slate-300",
        ].join(" ")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Modo Simple
      </button>

      <button
        type="button"
        title="Abrir todas las herramientas del editor"
        aria-pressed={!isSimple}
        onClick={() => setMode("studio")}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition",
          !isSimple
            ? "bg-cyan-400/10 text-cyan-300"
            : "text-slate-500 hover:text-slate-300",
        ].join(" ")}
      >
        <PanelsTopLeft className="h-3.5 w-3.5" />
        Modo Profesional
      </button>
    </div>
  )
}
