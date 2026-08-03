"use client"

import { MousePointer2, Sparkles } from "lucide-react"

import type {
  SimplePageSection,
  SimpleSectionContent,
} from "./section-model"
import { EditorButton } from "./EditorButton"
import { EditorPanel } from "./EditorPanel"

interface SimpleInspectorProps {
  section: SimplePageSection | null
  onContentChange: (content: SimpleSectionContent) => void
}

export function SimpleInspector({
  section,
  onContentChange,
}: SimpleInspectorProps) {
  function updateField(
    field: keyof SimpleSectionContent,
    value: string,
  ) {
    if (!section) return

    onContentChange({
      ...section.content,
      [field]: value,
    })
  }

  if (!section) {
    return (
      <aside className="hidden h-full w-[310px] shrink-0 overflow-y-auto border-l border-slate-800 bg-[#07101f] p-4 xl:block">
        <EditorPanel
          title="Edita tu página"
          description="Selecciona cualquier bloque para personalizarlo."
        >
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
              <MousePointer2 className="h-5 w-5" />
            </div>

            <p className="text-sm font-semibold text-slate-200">
              Selecciona un bloque
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Después podrás cambiar sus textos y contenido desde aquí.
            </p>
          </div>
        </EditorPanel>
      </aside>
    )
  }

  return (
    <aside className="hidden h-full w-[310px] shrink-0 overflow-y-auto border-l border-slate-800 bg-[#07101f] p-4 xl:block">
      <EditorPanel
        title={section.name}
        description="Cambia únicamente lo importante. Los resultados aparecen al instante."
      >
        <div className="space-y-5">
          {section.content.eyebrow !== undefined && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">
                Texto pequeño
              </span>

              <input
                value={section.content.eyebrow}
                onChange={(event) =>
                  updateField("eyebrow", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-300">
              Título
            </span>

            <textarea
              value={section.content.title}
              rows={3}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-slate-300">
              Descripción
            </span>

            <textarea
              value={section.content.description}
              rows={4}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
            />
          </label>

          {section.content.buttonLabel !== undefined && (
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-300">
                Texto del botón
              </span>

              <input
                value={section.content.buttonLabel}
                onChange={(event) =>
                  updateField("buttonLabel", event.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-500"
              />
            </label>
          )}
        </div>
      </EditorPanel>

      <EditorPanel
        title="Ayuda inteligente"
        description="Deja que Orvenix mejore el contenido por ti."
        className="mt-4"
      >
        <EditorButton variant="ghost" fullWidth>
          <Sparkles className="h-4 w-4" />
          Mejorar con Orvenix IA
        </EditorButton>
      </EditorPanel>
    </aside>
  )
}
