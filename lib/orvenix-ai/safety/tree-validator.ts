import type {
  EditorTree,
} from "@/types/editor"

import {
  getBlockCapability,
} from "@/lib/orvenix-ai/capabilities"

import type {
  TreeSafetyIssue,
  TreeSafetyReport,
} from "./types"

function push(
  issues: TreeSafetyIssue[],
  issue: TreeSafetyIssue,
) {
  issues.push(issue)
}

export function validateEditorTreeSafety(
  tree: EditorTree,
): TreeSafetyReport {
  const issues: TreeSafetyIssue[] = []

  const root =
    tree.nodes[tree.rootId]

  if (!root) {
    push(issues, {
      level: "blocked",
      code: "missing_root",
      message:
        "El EditorTree no contiene su nodo raíz.",
    })
  }

  /*
   * Todos los tipos deben existir
   * realmente en Orvenix.
   */
  for (
    const node
    of Object.values(tree.nodes)
  ) {
    const capability =
      getBlockCapability(node.type)

    if (!capability) {
      push(issues, {
        level: "blocked",
        code: "unknown_block",
        nodeId: node.id,
        message:
          `El bloque "${node.type}" no existe en el registry de Orvenix.`,
      })
    }

    /*
     * Hijos inexistentes.
     */
    for (
      const childId
      of node.children ?? []
    ) {
      if (!tree.nodes[childId]) {
        push(issues, {
          level: "blocked",
          code: "missing_child",
          nodeId: node.id,
          message:
            `El nodo referencia un hijo inexistente: ${childId}`,
        })
      }
    }
  }

  /*
   * Parent/child consistency.
   */
  for (
    const node
    of Object.values(tree.nodes)
  ) {
    for (
      const childId
      of node.children ?? []
    ) {
      const child =
        tree.nodes[childId]

      if (!child) continue

      if (
        child.parentId &&
        child.parentId !== node.id
      ) {
        push(issues, {
          level: "warning",
          code: "parent_mismatch",
          nodeId: child.id,
          message:
            `parentId no coincide con el padre real ${node.id}.`,
        })
      }
    }
  }

  /*
   * Detectar nodos huérfanos.
   */
  const reachable =
    new Set<string>()

  function walk(id: string) {
    if (reachable.has(id)) return

    const node =
      tree.nodes[id]

    if (!node) return

    reachable.add(id)

    for (
      const childId
      of node.children ?? []
    ) {
      walk(childId)
    }
  }

  if (root) {
    walk(tree.rootId)
  }

  for (
    const node
    of Object.values(tree.nodes)
  ) {
    if (!reachable.has(node.id)) {
      push(issues, {
        level: "warning",
        code: "orphan_node",
        nodeId: node.id,
        message:
          "El nodo no es alcanzable desde el root.",
      })
    }
  }

  const blocked =
    issues.filter(
      (issue) =>
        issue.level === "blocked",
    ).length

  const warning =
    issues.filter(
      (issue) =>
        issue.level === "warning",
    ).length

  const score =
    Math.max(
      0,
      100 -
        blocked * 40 -
        warning * 5,
    )

  return {
    safe: blocked === 0,
    score,
    issues,
  }
}
