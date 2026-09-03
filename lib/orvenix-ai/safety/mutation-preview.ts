import type {
  EditorNode,
  EditorTree,
} from "@/types/editor"

import {
  validateEditorTreeSafety,
} from "./tree-validator"

import type {
  TreeMutationPreview,
} from "./types"

function sameNode(
  a: EditorNode,
  b: EditorNode,
) {
  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  )
}

export function createMutationPreview(
  before: EditorTree,
  after: EditorTree,
): TreeMutationPreview {
  const beforeIds =
    new Set(
      Object.keys(before.nodes),
    )

  const afterIds =
    new Set(
      Object.keys(after.nodes),
    )

  let addedNodes = 0
  let removedNodes = 0
  let changedNodes = 0

  for (const id of afterIds) {
    if (!beforeIds.has(id)) {
      addedNodes++
      continue
    }

    const beforeNode =
      before.nodes[id]

    const afterNode =
      after.nodes[id]

    if (
      beforeNode &&
      afterNode &&
      !sameNode(
        beforeNode,
        afterNode,
      )
    ) {
      changedNodes++
    }
  }

  for (const id of beforeIds) {
    if (!afterIds.has(id)) {
      removedNodes++
    }
  }

  return {
    before,
    after,
    addedNodes,
    removedNodes,
    changedNodes,
    safety:
      validateEditorTreeSafety(
        after,
      ),
  }
}
