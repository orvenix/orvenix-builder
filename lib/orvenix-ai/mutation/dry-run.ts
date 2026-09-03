import type { EditorTree } from "@/types/editor"

import {
  createMutationPreview,
  validateEditorTreeSafety,
} from "@/lib/orvenix-ai/safety"

import {
  createAISnapshot,
} from "./snapshot"

import type {
  OrvenixAIMutationPlan,
} from "./types"

export function createDryRunMutationPlan(params: {
  siteId: string
  before: EditorTree
  after: EditorTree
}): OrvenixAIMutationPlan {
  const snapshot =
    createAISnapshot({
      siteId: params.siteId,
      tree: params.before,
    })

  const preview =
    createMutationPreview(
      params.before,
      params.after,
    )

  const safety =
    validateEditorTreeSafety(
      params.after,
    )

  const warnings: string[] = []

  if (preview.removedNodes > 0) {
    warnings.push(
      `Se eliminarán ${preview.removedNodes} nodos.`,
    )
  }

  if (preview.changedNodes > 0) {
    warnings.push(
      `Se modificarán ${preview.changedNodes} nodos existentes.`,
    )
  }

  if (preview.addedNodes > 0) {
    warnings.push(
      `Se agregarán ${preview.addedNodes} nodos nuevos.`,
    )
  }

  if (!safety.safe) {
    warnings.push(
      "El árbol generado no superó la validación de seguridad.",
    )
  }

  return {
    siteId: params.siteId,

    snapshot,

    before: params.before,
    after: params.after,

    addedNodes:
      preview.addedNodes,

    removedNodes:
      preview.removedNodes,

    changedNodes:
      preview.changedNodes,

    safe:
      safety.safe,

    safetyScore:
      safety.score,

    readyToApply:
      safety.safe,

    warnings,
  }
}
