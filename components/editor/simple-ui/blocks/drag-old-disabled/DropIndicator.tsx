"use client"

import { Plus } from "lucide-react"

interface DropIndicatorProps {
  active?: boolean
  label?: string
  onClick?: () => void
}

export function DropIndicator({
  active = false,
  label = "Agregar aquí",
  onClick,
}: DropIndicatorProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 py-2 transition-opacity",
        active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
      ].join(" ")}
    >
      <span className="h-px flex-1 bg-sky-300/70" />

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100"
        onClick={onClick}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>

      <span className="h-px flex-1 bg-sky-300/70" />
    </div>
  )
}
