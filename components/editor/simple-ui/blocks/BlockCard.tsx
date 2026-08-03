"use client"
import type { ReactNode } from "react"
import { DragHandle } from "../drag"
import {
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react"

interface BlockCardProps {
  name: string
  selected: boolean
  visible: boolean
  children: ReactNode
  onSelect: () => void
  onDuplicate: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}

export function BlockCard({
  name,
  selected,
  visible,
  children,
  onSelect,
  onDuplicate,
  onToggleVisibility,
  onDelete,
}: BlockCardProps) {
  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white transition",
        selected
          ? "border-sky-500 ring-2 ring-sky-500/20"
          : "border-slate-200 hover:border-sky-300",
        visible ? "" : "opacity-50",
      ].join(" ")}
      onClick={onSelect}
    >
      <div>{children}</div>

      <div className="absolute left-4 top-4 flex items-center gap-1 rounded-xl bg-slate-950/90 p-1.5 text-xs font-bold text-white opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
  <DragHandle label={name} />
  <span className="px-2">{name}</span>
</div>

      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-xl bg-slate-950/90 p-1.5 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
        <button
          type="button"
          aria-label="Mejorar con IA"
          title="Mejorar con IA"
          className="rounded-lg p-2 text-cyan-300 hover:bg-white/10"
          onClick={(event) => event.stopPropagation()}
        >
          <Sparkles className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Duplicar bloque"
          title="Duplicar"
          className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
          onClick={(event) => {
            event.stopPropagation()
            onDuplicate()
          }}
        >
          <Copy className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={visible ? "Ocultar bloque" : "Mostrar bloque"}
          title={visible ? "Ocultar" : "Mostrar"}
          className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
          onClick={(event) => {
            event.stopPropagation()
            onToggleVisibility()
          }}
        >
          {visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          aria-label="Más opciones"
          title="Más opciones"
          className="rounded-lg p-2 text-slate-200 hover:bg-white/10"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Eliminar bloque"
          title="Eliminar"
          className="rounded-lg p-2 text-red-300 hover:bg-red-500/20"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}
