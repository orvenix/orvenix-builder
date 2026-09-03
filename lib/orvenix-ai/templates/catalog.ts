import type { EditorTree } from "@/types/editor"
import type { EditorWebId } from "@/lib/editorWebs"

export type TemplateKind =
  | "site"
  | "section"
  | "starter"

export interface OrvenixTemplateCatalogEntry {
  id: string
  name: string
  category: string
  description: string

  kind: TemplateKind
  source: string

  tags: string[]
  siteTypes: string[]

  editorWebId?: EditorWebId
  tree?: EditorTree

  metadata?: Record<string, unknown>
}

export interface TemplateCatalogSource {
  source: string
  entries: OrvenixTemplateCatalogEntry[]
}

export function mergeTemplateSources(
  sources: TemplateCatalogSource[],
): OrvenixTemplateCatalogEntry[] {
  const map =
    new Map<string, OrvenixTemplateCatalogEntry>()

  for (const source of sources) {
    for (const entry of source.entries) {
      const key =
        `${entry.source}:${entry.id}`

      if (!map.has(key)) {
        map.set(key, entry)
      }
    }
  }

  return Array.from(map.values())
}
