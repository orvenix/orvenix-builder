"use client"

import type { ReactNode } from "react"

import { ClientExperience } from "./ClientExperience"
import { StudioExperience } from "./StudioExperience"
import { useEditorExperience } from "./ExperienceContext"

interface ExperienceBoundaryProps {
  children: ReactNode
}

export function ExperienceBoundary({
  children,
}: ExperienceBoundaryProps) {
  const { isStudio } = useEditorExperience()

  if (isStudio) {
    return <StudioExperience>{children}</StudioExperience>
  }

  return <ClientExperience>{children}</ClientExperience>
}
