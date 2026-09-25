import type { NodeProps } from "@/types/editor"
import type { PageArchetype } from "@/lib/orvenix-ai/architect"
import type { NormalizedSiteCreationBusinessEvidenceV1 } from "@/lib/orvenix-ai/site-creation/evidence-normalization"

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
  businessEvidence?: NormalizedSiteCreationBusinessEvidenceV1
  /** V2-S3: already resolved elsewhere in the pipeline (V2-1.1) -- never re-derived here, only consumed by getPageAwareHeroCopy's family-grounded fallback tier. */
  visualFamily?: string
  /** V2-S3: real, business-supplied offerings -- same shape as SectionCompositionContext's services/products. */
  services?: Array<{ name: string; description?: string }>
  products?: Array<{ name: string; description?: string }>

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
