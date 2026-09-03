"use client"

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useEditorStore } from "@/store/useEditorStore"

import { EditorExperienceContext } from "./ExperienceContext"
import { getExperienceCapabilities } from "./experience-config"
import type {
  EditorExperienceMode,
  EditorExperienceValue,
} from "./types"

interface ExperienceProviderProps {
  children: ReactNode
}

export function ExperienceProvider({
  children,
}: ExperienceProviderProps) {
  const userRole = useEditorStore((state) => state.userRole)

  const [adminMode, setAdminMode] =
    useState<EditorExperienceMode>("studio")

  const canSwitchMode = userRole === "admin"

  const mode: EditorExperienceMode = canSwitchMode
    ? adminMode
    : "client"

  const setMode = useCallback(
    (nextMode: EditorExperienceMode) => {
      if (!canSwitchMode) return
      setAdminMode(nextMode)
    },
    [canSwitchMode],
  )

  const value = useMemo<EditorExperienceValue>(
    () => ({
      mode,
      isClient: mode === "client",
      isStudio: mode === "studio",
      canSwitchMode,
      setMode,
      capabilities: getExperienceCapabilities(mode),
    }),
    [canSwitchMode, mode, setMode],
  )

  return (
    <EditorExperienceContext.Provider value={value}>
      {children}
    </EditorExperienceContext.Provider>
  )
}
