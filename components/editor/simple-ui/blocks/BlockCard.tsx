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
        "group relative overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-300",
        selected
          ? "border-sky-400 ring-2 ring-sky-400/20 shadow-[0_22px_60px_rgba(14,116,144,0.16)]"
          : "border-slate-200/90 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]",
        visible ? "" : "opacity-50",
      ].join(" ")}
      onClick={onSelect}
    >
      <div>{children}</div>

      <div className={["absolute left-4 top-4 flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/90 p-1.5 text-xs font-bold text-white shadow-xl backdrop-blur transition", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" ")}>
  <DragHandle label={name} />
  <span className="px-2">{name}</span>
</div>

      <div className={["absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur transition", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" ")}>
        <button
          type="button"
          aria-label="Mejorar con IA"
          title="Mejorar con IA"
          className="rounded-full p-2 text-cyan-300 hover:bg-white/10"
          onClick={(event) => event.stopPropagation()}
        >
          <Sparkles className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Duplicar bloque"
          title="Duplicar"
          className="rounded-full p-2 text-slate-200 hover:bg-white/10"
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
          className="rounded-full p-2 text-slate-200 hover:bg-white/10"
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
          className="rounded-full p-2 text-slate-200 hover:bg-white/10"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Eliminar bloque"
          title="Eliminar"
          className="rounded-full p-2 text-red-300 hover:bg-red-500/20"
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
