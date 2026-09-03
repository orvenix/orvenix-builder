import type { LucideIcon } from "lucide-react"

export type SimpleSectionType =
  | "hero"
  | "services"
  | "about"
  | "benefits"
  | "gallery"
  | "products"
  | "testimonials"
  | "contact"
  | "footer"

export type SimpleSectionCategory =
  | "essential"
  | "business"
  | "store"
  | "content"
  | "contact"

export interface SimpleEditorSectionDefinition {
  id: string
  type: SimpleSectionType
  name: string
  description: string
  category: SimpleSectionCategory
  icon: LucideIcon
}

export interface SimpleSectionContent {
  eyebrow?: string
  title: string
  description: string
  buttonLabel?: string
}

export interface SimplePageSection {
  id: string
  type: SimpleSectionType
  name: string
  visible: boolean
  content: SimpleSectionContent
}

export function createPageSection(
  definition: SimpleEditorSectionDefinition,
): SimplePageSection {
  return {
    id: `${definition.type}-${crypto.randomUUID()}`,
    type: definition.type,
    name: definition.name,
    visible: true,
    content: {
      title: definition.name,
      description: definition.description,
    },
  }
}
