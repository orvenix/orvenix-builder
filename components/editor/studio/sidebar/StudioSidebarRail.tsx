"use client"

import { useState } from "react"
import {
  Blocks,
  FolderOpen,
  Layers3,
  MoreHorizontal,
  Sparkles,
  SwatchBook,
  type LucideIcon,
} from "lucide-react"

import type { StudioSidebarTab } from "./types"

interface RailItem {
  id: StudioSidebarTab
  label: string
  description: string
  icon: LucideIcon
}

const PRIMARY_ITEMS: RailItem[] = [
  {
    id: "add",
    label: "Crear",
    description: "Agrega secciones y elementos",
    icon: Blocks,
  },
  {
    id: "layers",
    label: "Pagina",
    description: "Organiza la estructura visible",
    icon: Layers3,
  },
  {
    id: "templates",
    label: "Diseños",
    description: "Cambia o combina estructuras completas",
    icon: SwatchBook,
  },
]

const SECONDARY_ITEMS: RailItem[] = [
  {
    id: "assets",
    label: "Recursos",
    description: "Imagenes y archivos",
    icon: FolderOpen,
  },
  {
    id: "mentor",
    label: "Mentor",
    description: "Recibe ayuda para mejorar tu sitio",
    icon: Sparkles,
  },
  {
    id: "more",
    label: "Avanzado",
    description: "Configuracion y herramientas adicionales",
    icon: MoreHorizontal,
  },
]

interface StudioSidebarRailProps {
  activeTab: StudioSidebarTab
  onTabChange: (tab: StudioSidebarTab) => void
}

function RailButton({
  item,
  active,
  onClick,
  compact = false,
}: {
  item: RailItem
  active: boolean
  onClick: () => void
  compact?: boolean
}) {
  const Icon = item.icon

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={item.label}
      title={`${item.label}: ${item.description}`}
      onClick={onClick}
      className={[
        "group relative flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 text-center",
        compact ? "min-h-[54px] py-1.5" : "min-h-[62px] py-2",
        "transition duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        active
          ? "bg-cyan-400/[0.10] text-cyan-200"
          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200",
      ].join(" ")}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-sky-400 to-cyan-300"
        />
      )}

      <Icon
        aria-hidden="true"
        className={[
          compact ? "h-4 w-4" : "h-[18px] w-[18px]",
          "transition",
          active
            ? "text-cyan-300"
            : "group-hover:text-sky-300",
        ].join(" ")}
      />

      <span className="text-[10px] font-bold leading-none">
        {item.label}
      </span>
    </button>
  )
}

export function StudioSidebarRail({
  activeTab,
  onTabChange,
}: StudioSidebarRailProps) {
  const [showMore, setShowMore] = useState(false)
  const secondaryActive = SECONDARY_ITEMS.some((item) => item.id === activeTab)

  return (
    <nav
      aria-label="Herramientas de Orvenix Studio"
      className="flex h-full w-[82px] shrink-0 flex-col border-r border-white/[0.06] bg-[#07101f] px-2 py-3"
    >
      <div className="flex flex-col gap-1.5">
        {PRIMARY_ITEMS.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </div>

      <div className="mt-auto border-t border-white/[0.06] pt-2">
        {showMore && (
          <div className="mb-2 space-y-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1.5 editor-anim-fade-up">
            {SECONDARY_ITEMS.map((item) => (
              <RailButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => onTabChange(item.id)}
                compact
              />
            ))}
          </div>
        )}

        <button
          type="button"
          aria-expanded={showMore}
          aria-label="Más opciones"
          title="Más opciones: muestra recursos, mentor y herramientas avanzadas"
          onClick={() => setShowMore((value) => !value)}
          className={[
            "group relative flex min-h-[62px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl px-1.5 py-2 text-center",
            "transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
            showMore || secondaryActive
              ? "bg-white/[0.06] text-cyan-200"
              : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200",
          ].join(" ")}
        >
          <MoreHorizontal
            aria-hidden="true"
            className="h-[18px] w-[18px] transition group-hover:text-sky-300"
          />
          <span className="text-[10px] font-bold leading-none">
            Más opciones
          </span>
        </button>
      </div>
    </nav>
  )
}
