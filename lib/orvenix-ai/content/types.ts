import type { NodeProps } from "@/types/editor"

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
  }
}

export interface ContentAdaptation {
  props: NodeProps
  notes: string[]
}
