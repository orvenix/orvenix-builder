"use client"

import {
  Blocks,
  FolderOpen,
  MoreHorizontal,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export type SimpleEditorSection =
  | "sections"
  | "design"
  | "assets"
  | "ai"
  | "more"

interface SidebarItem {
  id: SimpleEditorSection
  label: string
  description: string
  icon: LucideIcon
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "sections",
    label: "Secciones",
    description: "Agrega y organiza contenido",
    icon: Blocks,
  },
  {
    id: "design",
    label: "Diseño",
    description: "Colores y estilo visual",
    icon: Palette,
  },
  {
    id: "assets",
    label: "Recursos",
    description: "Imágenes y archivos",
    icon: FolderOpen,
  },
  {
    id: "ai",
    label: "Mentor",
    description: "Aprende y mejora tu página",
    icon: Sparkles,
  },
  {
    id: "more",
    label: "Más",
    description: "Herramientas adicionales",
    icon: MoreHorizontal,
  },
]

interface SimpleEditorSidebarProps {
  activeSection: SimpleEditorSection
  onSectionChange: (section: SimpleEditorSection) => void
}

export function SimpleEditorSidebar({
  activeSection,
  onSectionChange,
}: SimpleEditorSidebarProps) {
  return (
    <aside
      aria-label="Herramientas del editor"
      className="flex h-full w-[104px] shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 px-2 py-4"
    >
      <nav className="flex flex-col gap-2">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.id === activeSection

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              title={`${item.label}: ${item.description}`}
              onClick={() => onSectionChange(item.id)}
              className={[
                "group relative flex min-h-[66px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-2",
                "text-center transition duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                active
                  ? "bg-sky-500/12 text-sky-300"
                  : "text-slate-500 hover:bg-slate-900 hover:text-slate-200",
              ].join(" ")}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-cyan-400"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={[
                  "h-5 w-5 transition",
                  active
                    ? "text-cyan-300"
                    : "group-hover:text-sky-300",
                ].join(" ")}
                aria-hidden="true"
              />

              <span className="text-[11px] font-bold leading-none">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto px-1 pb-1">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-2 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
            Editor
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-cyan-400">
            Foundation
          </p>
        </div>
      </div>
    </aside>
  )
}
