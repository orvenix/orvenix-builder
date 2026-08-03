"use client"

import {
  EditableButton,
  EditableHeading,
  EditableParagraph,
} from "../../editable"
import type { SimpleSectionContent } from "../../section-model"

interface HeroPreviewProps {
  content: SimpleSectionContent
  onContentChange: (content: SimpleSectionContent) => void
}

export function HeroPreview({
  content,
  onContentChange,
}: HeroPreviewProps) {
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
    <section className="bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-950 px-10 py-20 text-white">
      <div className="max-w-2xl">
        {content.eyebrow !== undefined && (
          <EditableParagraph
            value={content.eyebrow}
            onChange={(value) => updateContent("eyebrow", value)}
            className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300"
          />
        )}

        <div className="mt-4">
          <EditableHeading
            value={content.title}
            onChange={(value) => updateContent("title", value)}
            className="text-5xl font-black leading-tight"
          />
        </div>

        <div className="mt-5 max-w-xl">
          <EditableParagraph
            value={content.description}
            onChange={(value) =>
              updateContent("description", value)
            }
            className="text-lg leading-relaxed text-slate-300"
          />
        </div>

        {content.buttonLabel !== undefined && (
          <div className="mt-7">
            <EditableButton
              value={content.buttonLabel}
              onChange={(value) =>
                updateContent("buttonLabel", value)
              }
            />
          </div>
        )}
      </div>
    </section>
  )
}
