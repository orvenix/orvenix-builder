"use client"

import {
  FolderOpen,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import type { StudioSidebarTab } from "./types"

interface PanelDefinition {
  icon: LucideIcon
  eyebrow: string
  title: string
  description: string
  items: string[]
}

const DEFINITIONS: Record<
  Extract<StudioSidebarTab, "assets" | "mentor" | "more">,
  PanelDefinition
> = {
  assets: {
    icon: FolderOpen,
    eyebrow: "Recursos",
    title: "Tus imágenes y archivos",
    description:
      "Aquí podrás subir, organizar y reutilizar todos los recursos de tus proyectos.",
    items: [
      "Biblioteca de imágenes",
      "Archivos recientes",
      "Optimización automática",
    ],
  },
  mentor: {
    icon: Sparkles,
    eyebrow: "Mentor",
    title: "Construiremos tu sitio juntos",
    description:
      "El Mentor te ayudará a mejorar textos, diseño, SEO y accesibilidad sin quitarte el control.",
    items: [
      "Mejorar textos",
      "Explicar recomendaciones",
      "Revisar la página",
    ],
  },
  more: {
    icon: Settings,
    eyebrow: "Más opciones",
    title: "Herramientas adicionales",
    description:
      "Las configuraciones menos frecuentes estarán disponibles aquí para mantener el editor sencillo.",
    items: [
      "Configuración del sitio",
      "SEO",
      "Preferencias del editor",
    ],
  },
}

interface StudioSidebarEmptyPanelProps {
  tab: Extract<StudioSidebarTab, "assets" | "mentor" | "more">
}

export function StudioSidebarEmptyPanel({
  tab,
}: StudioSidebarEmptyPanelProps) {
  const definition = DEFINITIONS[tab]
  const Icon = definition.icon

  return (
    <section className="flex h-full flex-col bg-[#091321] text-slate-200">
      <header className="shrink-0 border-b border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
              {definition.eyebrow}
            </p>

            <h2 className="mt-1 text-sm font-black text-white">
              {definition.title}
            </h2>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm leading-6 text-slate-400">
          {definition.description}
        </p>

        <div className="mt-5 space-y-2">
          {definition.items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs font-semibold text-slate-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-white/[0.08] px-3 py-3 text-center text-[11px] font-semibold text-slate-600">
          Próximamente en Orvenix Studio
        </div>
      </div>
    </section>
  )
}
