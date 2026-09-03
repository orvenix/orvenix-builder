import type { SimplePageSection } from "./section-model"

const STORAGE_KEY = "orvenix.simple-editor.preview"
const STORAGE_VERSION = 1

interface StoredEditorState {
  version: number
  sections: SimplePageSection[]
  selectedSectionId: string | null
  updatedAt: string
}

function isValidSection(value: unknown): value is SimplePageSection {
  if (!value || typeof value !== "object") return false

  const section = value as Partial<SimplePageSection>

  return (
    typeof section.id === "string" &&
    typeof section.type === "string" &&
    typeof section.name === "string" &&
    typeof section.visible === "boolean" &&
    Boolean(section.content) &&
    typeof section.content?.title === "string" &&
    typeof section.content?.description === "string"
  )
}

export function loadSimpleEditorState(): StoredEditorState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredEditorState>

    if (
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.sections) ||
      !parsed.sections.every(isValidSection)
    ) {
      return null
    }

    return {
      version: STORAGE_VERSION,
      sections: parsed.sections,
      selectedSectionId:
        typeof parsed.selectedSectionId === "string"
          ? parsed.selectedSectionId
          : null,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveSimpleEditorState(
  sections: SimplePageSection[],
  selectedSectionId: string | null,
) {
  const state: StoredEditorState = {
    version: STORAGE_VERSION,
    sections,
    selectedSectionId,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearSimpleEditorState() {
  window.localStorage.removeItem(STORAGE_KEY)
}
