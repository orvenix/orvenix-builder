import type { EditorTree } from "@/types/editor"
import type {
  BusinessContentContext,
} from "@/lib/orvenix-ai/content"

export interface TemplateServiceInput {
  name: string
  description?: string
}

export interface TemplateProofInput {
  title: string
  description: string
}

export interface TemplateProcessInput {
  title: string
  description: string
}

export interface TemplatePricingInput {
  name: string
  price: string
  description?: string
}

export interface TemplateTestimonialInput {
  quote: string
  author: string
}

export interface TemplateAdaptationInput {
  tree: EditorTree
  business: BusinessContentContext

  services?: TemplateServiceInput[]
  proof?: TemplateProofInput[]
  process?: TemplateProcessInput[]
  pricing?: TemplatePricingInput[]
  testimonials?: TemplateTestimonialInput[]

  preserveVisualStyle?: boolean
}

export interface TemplateAdaptationReport {
  originalTemplateNodes: number
  finalNodes: number

  adaptedNodes: number
  sanitizedNodes: number
  preservedNodes: number

  removedSections: string[]
  pendingSections: string[]

  warnings: string[]
}

export interface TemplateAdaptationResult {
  tree: EditorTree
  report: TemplateAdaptationReport
}
