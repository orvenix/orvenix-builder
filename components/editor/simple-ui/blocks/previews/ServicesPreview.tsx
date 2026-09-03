"use client"

import {
  EditableHeading,
  EditableParagraph,
} from "../../editable"
import type { SimpleSectionContent } from "../../section-model"

const SERVICES = [
  "Diseño profesional",
  "Desarrollo web",
  "Estrategia digital",
]

interface ServicesPreviewProps {
  content: SimpleSectionContent
  onContentChange: (content: SimpleSectionContent) => void
}

export function ServicesPreview({
  content,
  onContentChange,
}: ServicesPreviewProps) {
  function updateContent(
    field: keyof SimpleSectionContent,
    value: string,
  ) {
    onContentChange({
      ...content,
      [field]: value,
    })
  }

  return (
    <section className="bg-white px-10 py-16">
      <div className="text-center">
        {content.eyebrow !== undefined && (
          <EditableParagraph
            value={content.eyebrow}
            onChange={(value) => updateContent("eyebrow", value)}
            className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600"
          />
        )}

        <div className="mt-3">
          <EditableHeading
            value={content.title}
            onChange={(value) => updateContent("title", value)}
            className="text-3xl font-black text-slate-950"
          />
        </div>

        <div className="mx-auto mt-3 max-w-xl">
          <EditableParagraph
            value={content.description}
            onChange={(value) =>
              updateContent("description", value)
            }
            className="text-sm leading-relaxed text-slate-500"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {SERVICES.map((service, index) => (
          <div
            key={service}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 font-black text-sky-700">
              {index + 1}
            </span>

            <h3 className="mt-5 font-bold text-slate-950">
              {service}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Una descripción breve enfocada en los beneficios.
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
