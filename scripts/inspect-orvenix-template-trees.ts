import {
  getEditorTreeForWeb,
} from "@/lib/editorWebs"

const ids = [
  "clinica",
  "restaurante",
  "agencia",
  "tienda",
] as const

function compactProps(
  props: Record<string, unknown>,
) {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      const printable =
        typeof value === "string" &&
        value.length > 140
          ? `${value.slice(0, 137)}...`
          : value

      result[key] = printable
    }

    if (Array.isArray(value)) {
      result[key] =
        `[ARRAY:${value.length}]`
    }
  }

  return result
}

for (const id of ids) {
  const tree = getEditorTreeForWeb(id)
  const root = tree.nodes[tree.rootId]

  console.log("")
  console.log(
    "========================================"
  )
  console.log(`TEMPLATE: ${id}`)
  console.log(
    "========================================"
  )

  console.log("ROOT:", tree.rootId)
  console.log(
    "NODOS:",
    Object.keys(tree.nodes).length,
  )
  console.log(
    "HIJOS ROOT:",
    root?.children?.length ?? 0,
  )

  console.log("")
  console.log("=== SECCIONES PRINCIPALES ===")

  for (const childId of root?.children ?? []) {
    const node = tree.nodes[childId]

    if (!node) continue

    console.log("")
    console.log({
      id: node.id,
      type: node.type,
      displayName: node.displayName,
      children: node.children.length,
      props: compactProps(node.props),
    })
  }

  console.log("")
  console.log("=== TIPOS UTILIZADOS ===")

  const counts = new Map<string, number>()

  for (const node of Object.values(tree.nodes)) {
    counts.set(
      node.type,
      (counts.get(node.type) ?? 0) + 1,
    )
  }

  console.log(
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}:${count}`)
      .join(" | ")
  )
}
