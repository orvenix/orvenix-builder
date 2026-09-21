import type { NodeProps } from "@/types/editor"
import type { PageArchetype } from "@/lib/orvenix-ai/architect"

export interface BusinessContentContext {
  name?: string
  industry?: string
  location?: string
  description?: string
  audience?: string
  objective?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string

  page?: {
    name?: string
    slug?: string
    purpose?: string
    archetype?: PageArchetype
  }
}

export interface ContentAdaptation {
  props: NodeProps
  notes: string[]
}
