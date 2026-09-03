import type { EditorTree } from "@/types/editor"

export function collectSubtreeIds(
  tree: EditorTree,
  rootId: string,
): string[] {
  const result: string[] = []

  function walk(id: string) {
    const node = tree.nodes[id]

    if (!node) return

    result.push(id)

    for (const childId of node.children ?? []) {
      walk(childId)
    }
  }

  walk(rootId)

  return result
}

export function removeTreeSection(
  tree: EditorTree,
  sectionId: string,
) {
  const root = tree.nodes[tree.rootId]

  if (!root) {
    throw new Error(
      "No existe el nodo raíz del EditorTree.",
    )
  }

  root.children =
    root.children.filter(
      (id) => id !== sectionId,
    )

  const ids =
    collectSubtreeIds(tree, sectionId)

  for (const id of ids) {
    delete tree.nodes[id]
  }
}
