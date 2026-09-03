import type { EditorTree } from "@/types/editor"

export interface OrvenixTemplateDescriptor {
  id: string
  name: string
  category: string
  description?: string
  source: string
  tree?: EditorTree
  blockTypes: string[]
  sectionCount: number
  pageIntent?: string
}

export interface TemplateMatch {
  template: OrvenixTemplateDescriptor
  score: number
  reasons: string[]
}
