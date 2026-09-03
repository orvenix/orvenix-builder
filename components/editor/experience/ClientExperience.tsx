"use client"

import type { ReactNode } from "react"

interface ClientExperienceProps {
  children: ReactNode
}

export function ClientExperience({
  children,
}: ClientExperienceProps) {
  return <>{children}</>
}
