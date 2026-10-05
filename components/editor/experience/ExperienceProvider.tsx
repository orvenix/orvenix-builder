"use client"

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useEditorStore } from "@/store/useEditorStore"
import {
  editorExperienceForProfile,
  editorModeStorageKey,
  editorProfileForExperience,
  getEditorModeCapabilities,
  isEditorModeProfile,
  resolveInitialEditorModeProfile,
  type EditorModeProfile,
} from "@/lib/editor/editor-mode-profile"

import { EditorExperienceContext } from "./ExperienceContext"
import type {
  EditorExperienceMode,
  EditorExperienceValue,
} from "./types"

interface ExperienceProviderProps {
  children: ReactNode
}

function readStoredProfile(websiteId: string | null): EditorModeProfile | null {
  if (!websiteId) return null
  try {
    const stored = window.localStorage.getItem(editorModeStorageKey(websiteId))
    return isEditorModeProfile(stored) ? stored : null
  } catch {
    return null
  }
}

function writeStoredProfile(websiteId: string | null, profile: EditorModeProfile) {
  if (!websiteId) return
  try {
    window.localStorage.setItem(editorModeStorageKey(websiteId), profile)
  } catch {
    // UI preference only: the editor works the same without it.
  }
}

/**
 * CV1-2: Simple/Pro over the SAME tree, store and renderer. Switching only
 * changes the exposed capabilities -- it never touches the tree.
 */
export function ExperienceProvider({
  children,
}: ExperienceProviderProps) {
  const userRole = useEditorStore((state) => state.userRole)
  const websiteId = useEditorStore((state) => state.websiteId)
  /*
   * Decided once when the editor opens; later tree edits never flip the mode.
   * EditorProvider mounts this provider only after the store is initialized
   * on the client, so the tree and the saved preference are already readable.
   */
  const [profile, setProfile] = useState<EditorModeProfile>(() =>
    resolveInitialEditorModeProfile({
      tree: useEditorStore.getState().tree,
      userRole,
      storedPreference: readStoredProfile(useEditorStore.getState().websiteId),
    }),
  )

  // Everyone who can open the editor may choose the mode; permissions stay server-side.
  const canSwitchMode = true

  const setMode = useCallback(
    (nextMode: EditorExperienceMode) => {
      const nextProfile = editorProfileForExperience(nextMode)
      setProfile(nextProfile)
      writeStoredProfile(websiteId, nextProfile)
    },
    [websiteId],
  )

  const value = useMemo<EditorExperienceValue>(() => {
    const mode = editorExperienceForProfile(profile)
    return {
      mode,
      profile,
      isClient: mode === "client",
      isStudio: mode === "studio",
      canSwitchMode,
      setMode,
      capabilities: getEditorModeCapabilities(profile),
    }
  }, [canSwitchMode, profile, setMode])

  return (
    <EditorExperienceContext.Provider value={value}>
      {children}
    </EditorExperienceContext.Provider>
  )
}
