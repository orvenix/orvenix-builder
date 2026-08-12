import type { EditorNode, NodeProps } from "@/types/editor"

export interface HeroBusinessContent {
  eyebrow?: string
  title: string
  subtitle?: string
  primaryButton?: string
  secondaryButton?: string
  imageUrl?: string
}

export interface HeroBusinessAdapter {
  nodeTypes: readonly string[]

  read: (node: EditorNode) => HeroBusinessContent

  write: (
    currentProps: NodeProps,
    content: HeroBusinessContent,
  ) => NodeProps
}
