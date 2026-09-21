import type { NodeProps } from "@/types/editor"
import type { PageArchetype, SectionRole } from "@/lib/orvenix-ai/architect"

export interface ComposedNode {
  tempId: string
  type: string
  displayName: string
  props: NodeProps
  children: string[]
}

export interface ComposedSection {
  role: SectionRole
  rootId: string
  nodes: Record<string, ComposedNode>
  purpose: string
}

export interface SectionCompositionContext {
  siteType?: string
  industry?: string
  objective?: string
  audience?: string
  sitePages?: Array<{
    name: string
    slug: string
    isHome?: boolean
  }>
  pageName?: string
  pageSlug?: string
  pagePurpose?: string
  archetype?: PageArchetype
  preferredStyle?: string
  sectionIndex?: number
  totalSections?: number
  compositionSeed?: string
}
