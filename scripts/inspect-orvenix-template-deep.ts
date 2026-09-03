import {
  getEditorTreeForWeb,
} from "@/lib/editorWebs"

const tree = getEditorTreeForWeb("clinica")

function compact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 220
      ? `${value.slice(0, 217)}...`
      : value
  }

  if (Array.isArray(value)) {
    return value.map(compact)
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>,
      ).map(([key, val]) => [
        key,
        compact(val),
      ]),
    )
  }

  return value
}

function walk(
  id: string,
  depth = 0,
) {
  const node = tree.nodes[id]

  if (!node) return

  const indent = "  ".repeat(depth)

  console.log("")
  console.log(
    `${indent}[${node.type}] ${node.displayName ?? ""}`,
  )

  console.log(
    `${indent}ID: ${node.id}`,
  )

  console.log(
    `${indent}PROPS:`,
    JSON.stringify(
      compact(node.props),
      null,
      2,
    )
      .split("\n")
      .map((line) => indent + line)
      .join("\n"),
  )

  for (const childId of node.children ?? []) {
    walk(childId, depth + 1)
  }
}

console.log(
  "========================================",
)
console.log(
  "ORVENIX AI — DEEP TEMPLATE INSPECTION",
)
console.log(
  "========================================",
)

walk(tree.rootId)
