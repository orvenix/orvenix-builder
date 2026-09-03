"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { SimplePageSection } from "./section-model"
import {
  clearSimpleEditorState,
  loadSimpleEditorState,
  saveSimpleEditorState,
} from "./simple-editor-storage"
import { SimpleCanvas } from "./SimpleCanvas"
import {
  SimpleEditorSidebar,
  type SimpleEditorSection,
} from "./SimpleEditorSidebar"
import { SimpleInspector } from "./SimpleInspector"
import {
  SimpleTopBar,
  type SimpleEditorSaveStatus,
} from "./SimpleTopBar"

interface InitialEditorState {
  sections: SimplePageSection[]
  selectedSectionId: string | null
}

function getInitialEditorState(): InitialEditorState {
  if (typeof window === "undefined") {
    return {
      sections: [],
      selectedSectionId: null,
    }
  }

  const storedState = loadSimpleEditorState()

  if (!storedState) {
    return {
      sections: [],
      selectedSectionId: null,
    }
  }

  const selectedStillExists = storedState.sections.some(
    (section) => section.id === storedState.selectedSectionId,
  )

  return {
    sections: storedState.sections,
    selectedSectionId: selectedStillExists
      ? storedState.selectedSectionId
      : null,
  }
}

export function SimpleEditorLayout() {
  const [initialState] = useState(getInitialEditorState)

  const [activeSection, setActiveSection] =
    useState<SimpleEditorSection>("sections")

  const [sections, setSections] = useState<SimplePageSection[]>(
    initialState.sections,
  )

  const [selectedSectionId, setSelectedSectionId] =
    useState<string | null>(initialState.selectedSectionId)

  const [saveStatus, setSaveStatus] =
    useState<SimpleEditorSaveStatus>("saved")

  const skipNextSave = useRef(true)

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    setSaveStatus("unsaved")

    const timeout = window.setTimeout(() => {
      setSaveStatus("saving")

      try {
        saveSimpleEditorState(sections, selectedSectionId)
        setSaveStatus("saved")
      } catch {
        setSaveStatus("unsaved")
      }
    }, 600)

    return () => window.clearTimeout(timeout)
  }, [sections, selectedSectionId])

  const selectedSection = useMemo(
    () =>
      sections.find(
        (section) => section.id === selectedSectionId,
      ) ?? null,
    [sections, selectedSectionId],
  )

  function updateSelectedContent(
    content: SimplePageSection["content"],
  ) {
    if (!selectedSectionId) return

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === selectedSectionId
          ? { ...section, content }
          : section,
      ),
    )
  }

  function resetEditor() {
    const confirmed = window.confirm(
      "¿Restablecer esta vista previa? Se eliminarán los bloques y cambios guardados en este navegador.",
    )

    if (!confirmed) return

    clearSimpleEditorState()
    skipNextSave.current = true
    setSections([])
    setSelectedSectionId(null)
    setSaveStatus("saved")
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <SimpleTopBar
        projectName="Mi sitio web"
        saveStatus={saveStatus}
        canReset={sections.length > 0}
        onReset={resetEditor}
      />

      <div className="flex min-h-0 flex-1">
        <SimpleEditorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <SimpleCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionsChange={setSections}
          onSectionSelect={setSelectedSectionId}
        />

        <SimpleInspector
          section={selectedSection}
          onContentChange={updateSelectedContent}
        />
      </div>
    </div>
)
}
