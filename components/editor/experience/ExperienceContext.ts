"use client"

import { createContext, useContext } from "react"

import type { EditorExperienceValue } from "./types"

export const EditorExperienceContext =
  createContext<EditorExperienceValue | null>(null)

export function useEditorExperience(): EditorExperienceValue {
  const context = useContext(EditorExperienceContext)

  if (!context) {
    throw new Error(
      "useEditorExperience debe utilizarse dentro de ExperienceProvider",
    )
  }

  return context
}
