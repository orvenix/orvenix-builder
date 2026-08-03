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
        "group relative rounded-2xl border bg-white p-6 transition",
        selected
          ? "border-sky-500 ring-2 ring-sky-500/20"
          : "border-slate-200 hover:border-sky-300",
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

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">{section.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {definition?.description ?? "Sección de tu página."}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            aria-label={section.visible ? "Ocultar sección" : "Mostrar sección"}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
