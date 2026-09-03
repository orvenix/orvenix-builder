"use client"

import { Eye, EyeOff, GripVertical, Trash2 } from "lucide-react"

import type { SimplePageSection } from "./section-model"
import { getSectionDefinition } from "./section-library"

interface SimpleSectionPreviewProps {
  section: SimplePageSection
  selected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}

export function SimpleSectionPreview({
  section,
  selected,
  onSelect,
  onToggleVisibility,
  onDelete,
}: SimpleSectionPreviewProps) {
  const definition = getSectionDefinition(section.type)
  const Icon = definition?.icon

  return (
    <article
      className={[
        "group relative rounded-[26px] border bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.08)] transition duration-300",
        selected
          ? "border-sky-400 ring-2 ring-sky-400/20 shadow-[0_20px_55px_rgba(14,116,144,0.14)]"
          : "border-slate-200/90 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_20px_55px_rgba(15,23,42,0.11)]",
        section.visible ? "" : "opacity-50",
      ].join(" ")}
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Mover ${section.name}`}
          className="cursor-grab text-slate-300 hover:text-slate-500"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">{section.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {definition?.description ?? "Sección de tu página."}
          </p>
        </div>

        <div className={["flex items-center gap-1 rounded-full bg-slate-50/80 p-1 shadow-sm transition", selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"].join(" ")}>
          <button
            type="button"
            aria-label={section.visible ? "Ocultar sección" : "Mostrar sección"}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={(event) => {
              event.stopPropagation()
              onToggleVisibility()
            }}
          >
            {section.visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            aria-label="Eliminar sección"
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
