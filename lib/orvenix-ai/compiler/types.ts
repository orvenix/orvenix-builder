import type { EditorTree } from "@/types/editor"
import type {
  OrvenixSiteArchitecture,
  OrvenixSitePagePlan,
} from "@/lib/orvenix-ai/architect"

export interface CompiledPageBlueprint {
  name: string
  slug: string
  tree: EditorTree
}

export interface CompiledSiteBlueprint {
  architecture: OrvenixSiteArchitecture
  pages: CompiledPageBlueprint[]
  warnings: string[]
}
