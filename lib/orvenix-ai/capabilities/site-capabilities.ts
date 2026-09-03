import type { EditorTree } from "@/types/editor"
import {
  getBlockCapabilities,
  type OrvenixBlockCapability,
} from "./block-capabilities"

export interface OrvenixSiteCapabilities {
  blocks: OrvenixBlockCapability[]
  blockTypes: string[]
  categories: string[]
  supports: {
    theme: boolean
    brand: boolean
    seo: boolean
    responsive: boolean
    bindings: boolean
    hiddenNodes: boolean
    lockedNodes: boolean
  }
}

export function getSiteCapabilities(
  tree?: EditorTree,
): OrvenixSiteCapabilities {
  const blocks = getBlockCapabilities()

  return {
    blocks,
    blockTypes: blocks.map((block) => block.type),
    categories: Array.from(
      new Set(blocks.map((block) => block.category)),
    ).sort(),
    supports: {
      theme: true,
      brand: true,
      seo: true,
      responsive: true,
      bindings: true,
      hiddenNodes: true,
      lockedNodes: true,
    },
  }
}
