"use client"

import {
  ClientShell,
  ClientTopbar,
} from "@/components/editor/client-shell"
import { EditorShell } from "@/components/editor/shell/EditorShell"
import { StudioTopBar } from "@/components/editor/studio"

import { useEditorExperience } from "./ExperienceContext"

export function EditorExperienceShell() {
  const { isClient } = useEditorExperience()

  if (isClient) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <ClientTopbar />
        <ClientShell />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <StudioTopBar />
      <EditorShell />
    </div>
  )
}
