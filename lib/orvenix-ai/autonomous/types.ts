import type { EditorTree } from "@/types/editor"
import type {
  OrvenixSiteArchitecture,
} from "@/lib/orvenix-ai/architect"

import type {
  RankedTemplate,
} from "@/lib/orvenix-ai/templates"

import type {
  OrvenixAIQualityReport,
} from "@/lib/orvenix-ai/types"

export interface AutonomousBusinessInput {
  name?: string
  industry?: string
  description?: string
  location?: string
  audience?: string
  objective?: string

  phone?: string
  whatsapp?: string
  email?: string
  address?: string

  services?: Array<{
    name: string
    description?: string
  }>

  pricing?: Array<{
    name: string
    price: string
    description?: string
  }>

  testimonials?: Array<{
    quote: string
    author: string
  }>
}

export interface AutonomousSiteBuilderInput {
  request: string
  business: AutonomousBusinessInput

  preferredStyle?: string

  forceFreshComposition?: boolean

  minimumQuality?: number
}

export interface AutonomousSiteBuilderResult {
  ok: boolean

  architecture: OrvenixSiteArchitecture

  selectedTemplate: RankedTemplate | null

  tree: EditorTree

  quality: OrvenixAIQualityReport

  repaired: boolean

  warnings: string[]

  trace: string[]
}
