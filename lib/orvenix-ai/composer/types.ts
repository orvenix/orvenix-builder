import type { NodeProps } from "@/types/editor"
import type { SectionRole } from "@/lib/orvenix-ai/architect"

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
