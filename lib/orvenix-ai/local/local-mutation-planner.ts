import type {
  EditorNode,
  EditorTree,
  NodeProps,
} from "@/types/editor"

import {
  resolveLocalTarget,
} from "./target-resolver"

import {
  parseLocalEdit,
} from "./local-intent"

import type {
  LocalMutationResult,
} from "./types"

function cloneTree(
  tree: EditorTree,
): EditorTree {
  return structuredClone(tree)
}

function changedKeys(
  before: NodeProps,
  after: NodeProps,
) {
  const keys =
    new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ])

  return [...keys].filter(
    (key) =>
      JSON.stringify(before[key]) !==
      JSON.stringify(after[key]),
  )
}

function applyText(
  node: EditorNode,
  value: string,
) {
  if (node.type === "heading") {
    node.props = {
      ...node.props,
      text: value,
    }

    return true
  }

  if (node.type === "text") {
    node.props = {
      ...node.props,
      content: value,
    }

    return true
  }

  return false
}

function applyButtonText(
  node: EditorNode,
  value: string,
) {
  if (node.type !== "ctaButton") {
    return false
  }

  node.props = {
    ...node.props,
    label: value,
  }

  return true
}

function applyColor(
  node: EditorNode,
  value: string,
) {
  /*
   * Usamos únicamente propiedades
   * que ya existan cuando sea posible.
   */
  if ("color" in node.props) {
    node.props = {
      ...node.props,
      color: value,
    }

    return true
  }

  if (
    "backgroundColor" in node.props
  ) {
    node.props = {
      ...node.props,
      backgroundColor: value,
    }

    return true
  }

  return false
}

export function planLocalMutation(params: {
  tree: EditorTree
  request: string
  targetNodeId?: string
}): LocalMutationResult {
  const next =
    cloneTree(params.tree)

  const target =
    resolveLocalTarget({
      tree: next,
      request:
        params.request,
      targetNodeId:
        params.targetNodeId,
    })

  if (!target) {
    return {
      ok: false,
      tree: next,
      changes: [],
      warnings: [
        "No se pudo identificar con seguridad el nodo que debe modificarse.",
      ],
    }
  }

  const parsed =
    parseLocalEdit(
      params.request,
    )

  if (
    parsed.operation ===
    "unknown"
  ) {
    return {
      ok: false,
      tree: next,

      target: {
        nodeId:
          target.id,
        nodeType:
          target.type,
        displayName:
          target.displayName,
      },

      changes: [],

      warnings: [
        "La intención local fue detectada, pero falta información suficiente para realizar un cambio determinista.",
      ],
    }
  }

  if (!parsed.value) {
    return {
      ok: false,
      tree: next,
      changes: [],
      warnings: [
        "La operación requiere un valor nuevo.",
      ],
    }
  }

  const before =
    structuredClone(
      target.props,
    )

  let applied = false

  switch (parsed.operation) {
    case "set_text":
      applied =
        applyText(
          target,
          parsed.value,
        )
      break

    case "set_button_text":
      applied =
        applyButtonText(
          target,
          parsed.value,
        )
      break

    case "set_color":
      applied =
        applyColor(
          target,
          parsed.value,
        )
      break
  }

  if (!applied) {
    return {
      ok: false,
      tree: next,

      target: {
        nodeId:
          target.id,
        nodeType:
          target.type,
        displayName:
          target.displayName,
      },

      changes: [],

      warnings: [
        `La operación "${parsed.operation}" no es compatible con el nodo "${target.type}".`,
      ],
    }
  }

  const after =
    structuredClone(
      target.props,
    )

  return {
    ok: true,
    tree: next,

    target: {
      nodeId:
        target.id,
      nodeType:
        target.type,
      displayName:
        target.displayName,
    },

    changes: [
      {
        nodeId:
          target.id,

        before,
        after,

        changedKeys:
          changedKeys(
            before,
            after,
          ),
      },
    ],

    warnings: [],
  }
}
