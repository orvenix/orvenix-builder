import { randomUUID } from "crypto"
import type { EditorTree } from "@/types/editor"
import type { OrvenixAISnapshot } from "./types"

export function createAISnapshot(params: {
  siteId: string
  tree: EditorTree
}): OrvenixAISnapshot {
  return {
    id: `ai-snapshot-${randomUUID()}`,
    siteId: params.siteId,
    createdAt: new Date().toISOString(),
    tree: structuredClone(params.tree),
  }
}
