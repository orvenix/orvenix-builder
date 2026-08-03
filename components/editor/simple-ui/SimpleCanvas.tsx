"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { SortableSection } from "./drag"
import { BlockRenderer } from "./blocks/BlockRenderer"
import { EditorButton } from "./EditorButton"
import { createBusinessPreset } from "./section-library"
import {
  createPageSection,
  type SimpleEditorSectionDefinition,
  type SimplePageSection,
} from "./section-model"
import { SimpleBlockLibrary } from "./SimpleBlockLibrary"

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"


import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

interface SimpleCanvasProps {
  sections: SimplePageSection[]
  selectedSectionId: string | null
  onSectionsChange: (sections: SimplePageSection[]) => void
  onSectionSelect: (sectionId: string | null) => void
}

export function SimpleCanvas({
  sections,
  selectedSectionId,
  onSectionsChange,
  onSectionSelect,
}: SimpleCanvasProps) {
  const [libraryOpen, setLibraryOpen] = useState(false)

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }),
)

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event

  if (!over) return

  const activeId = String(active.id)
  const overId = String(over.id)

  if (activeId === overId) return

  const oldIndex = sections.findIndex(
    (section) => section.id === activeId,
  )

  const newIndex = sections.findIndex(
    (section) => section.id === overId,
  )

  if (oldIndex === -1 || newIndex === -1) return

  const reorderedSections = [...sections]
  const [movedSection] = reorderedSections.splice(oldIndex, 1)

  if (!movedSection) return

  reorderedSections.splice(newIndex, 0, movedSection)

  onSectionsChange(reorderedSections)
  onSectionSelect(activeId)
}

  function createBusinessPage() {
    const nextSections = createBusinessPreset()

    onSectionsChange(nextSections)
    onSectionSelect(nextSections[0]?.id ?? null)
  }

  function insertSection(
    definition: SimpleEditorSectionDefinition,
  ) {
    const newSection = createPageSection(definition)

    if (definition.type === "hero") {
      newSection.content = {
        eyebrow: "Una nueva forma de crecer",
        title: "Presenta tu negocio con claridad",
        description:
          "Explica lo que haces y ayuda a tus clientes a entender tu propuesta.",
        buttonLabel: "Conocer más",
      }
    }

    const nextSections = [...sections, newSection]

    onSectionsChange(nextSections)
    onSectionSelect(newSection.id)
    setLibraryOpen(false)
  }

  function updateSectionContent(
    sectionId: string,
    content: SimplePageSection["content"],
  ) {
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, content }
          : section,
      ),
    )

    onSectionSelect(sectionId)
  }

  function duplicateSection(sectionId: string) {
    const index = sections.findIndex(
      (section) => section.id === sectionId,
    )

    if (index === -1) return

    const source = sections[index]

    const copy: SimplePageSection = {
      ...source,
      id: `${source.type}-${crypto.randomUUID()}`,
      name: `${source.name} copia`,
      content: { ...source.content },
    }

    const nextSections = [...sections]
    nextSections.splice(index + 1, 0, copy)

    onSectionsChange(nextSections)
    onSectionSelect(copy.id)
  }

  function toggleVisibility(sectionId: string) {
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section,
      ),
    )
  }

  function deleteSection(sectionId: string) {
    onSectionsChange(
      sections.filter((section) => section.id !== sectionId),
    )

    if (selectedSectionId === sectionId) {
      onSectionSelect(null)
    }
  }

  return (
    <>
      <main className="min-w-0 flex-1 overflow-auto bg-[#0b1220] p-5 md:p-7">
        <div className="mx-auto min-h-[900px] max-w-5xl overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#f8fafc] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          {sections.length === 0 ? (
            <section className="flex min-h-[720px] items-center justify-center">
              <div className="max-w-xl text-center">
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">
                  Constructor guiado
                </p>

                <h2 className="text-4xl font-black tracking-tight text-slate-950">
                  ¿Qué quieres crear hoy?
                </h2>

                <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
                  Orvenix puede preparar una estructura profesional
                  para que tú solo cambies textos, imágenes y colores.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-400 hover:shadow-lg"
                    onClick={createBusinessPage}
                  >
                    <span className="font-bold text-slate-950">
                      Página para negocio
                    </span>

                    <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                      Portada, servicios, nosotros, opiniones y contacto.
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-2xl border border-slate-200 bg-white p-5 text-left opacity-50"
                  >
                    <span className="font-bold text-slate-950">
                      Tienda en línea
                    </span>

                    <span className="mt-2 block text-sm text-slate-500">
                      Próximamente en esta vista previa.
                    </span>
                  </button>
                </div>

                <EditorButton
                  variant="ghost"
                  className="mt-6 text-slate-600"
                  onClick={() => setLibraryOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Empezar desde cero
                </EditorButton>
              </div>
            </section>
          ) : (
            <section>
              <header className="mb-7 flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-600">
                    Estructura de tu página
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950">
                    Tu sitio ya está tomando forma
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Haz doble clic sobre el título de la portada para editarlo.
                  </p>
                </div>

                <EditorButton
                  variant="primary"
                  onClick={() => setLibraryOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Agregar contenido
                </EditorButton>
              </header>

              <DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sections.map((section) => section.id)}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-4">
      {sections.map((section) => (
        <SortableSection
          key={section.id}
          id={section.id}
        >
          <BlockRenderer
            section={section}
            selected={section.id === selectedSectionId}
            onSelect={() => onSectionSelect(section.id)}
            onDuplicate={() => duplicateSection(section.id)}
            onToggleVisibility={() =>
              toggleVisibility(section.id)
            }
            onDelete={() => deleteSection(section.id)}
            onContentChange={(content) =>
              updateSectionContent(section.id, content)
            }
          />
        </SortableSection>
      ))}
    </div>
  </SortableContext>
</DndContext>

              <button
                type="button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-6 text-sm font-bold text-slate-500 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                onClick={() => setLibraryOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Agregar otra sección
              </button>
            </section>
          )}
        </div>
      </main>

      <SimpleBlockLibrary
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onInsert={insertSection}
      />
    </>
  )
}
