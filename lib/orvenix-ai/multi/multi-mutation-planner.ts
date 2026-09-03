import type {
  EditorNode,
  EditorTree,
  NodeProps,
} from "@/types/editor"

import {
  parseMultiEdit,
  type ParsedMultiEdit,
} from "./multi-intent"

import {
  getCapabilitySetting,
  isCapabilityValueAllowed,
} from "@/lib/orvenix-ai/capabilities/block-capabilities"

import type {
  MultiMutationResult,
} from "./types"

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
      JSON.stringify(
        before[key],
      ) !==
      JSON.stringify(
        after[key],
      ),
  )
}

function matchesTarget(
  node: EditorNode,
  target:
    ReturnType<
      typeof parseMultiEdit
    >["target"],
) {
  switch (target) {
    case "buttons":
      return (
        node.type ===
        "ctaButton"
      )

    case "headings":
      return (
        node.type ===
        "heading"
      )

    case "texts":
      return (
        node.type ===
        "text"
      )

    case "sections":
      return (
        node.type ===
        "section"
      )

    default:
      return false
  }
}

function applyColor(
  node: EditorNode,
  value: string,
) {
  if ("color" in node.props) {
    node.props = {
      ...node.props,
      color:
        value,
    }

    return true
  }

  if (
    "backgroundColor" in
    node.props
  ) {
    node.props = {
      ...node.props,
      backgroundColor:
        value,
    }

    return true
  }

  return false
}

function applyAlign(
  node: EditorNode,
  value: string,
) {
  if (
    !("align" in node.props)
  ) {
    return false
  }

  if (
    value !== "left" &&
    value !== "center" &&
    value !== "right"
  ) {
    return false
  }

  node.props = {
    ...node.props,
    align: value,
  }

  return true
}

function applySize(
  node: EditorNode,
  value: string,
) {
  const allowed = [
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
  ]

  if (
    !allowed.includes(value) ||
    !("size" in node.props)
  ) {
    return false
  }

  if (
    node.props.size === value
  ) {
    return false
  }

  node.props = {
    ...node.props,
    size: value,
  }

  return true
}

function applyWeight(
  node: EditorNode,
  value: string,
) {
  const allowed = [
    "normal",
    "medium",
    "semibold",
    "bold",
    "extrabold",
  ]

  if (
    !allowed.includes(value) ||
    !("weight" in node.props)
  ) {
    return false
  }

  if (
    node.props.weight === value
  ) {
    return false
  }

  node.props = {
    ...node.props,
    weight: value,
  }

  return true
}

function applyPaddingY(
  node: EditorNode,
  value: string,
) {
  if (
    node.type !== "section"
  ) {
    return false
  }

  const allowed = [
    "none",
    "sm",
    "md",
    "lg",
    "xl",
  ]

  if (
    !allowed.includes(value)
  ) {
    return false
  }

  if (
    node.props.paddingY === value
  ) {
    return false
  }

  node.props = {
    ...node.props,
    paddingY: value,
  }

  return true
}

export function planMultiMutation(
  params: {
    tree: EditorTree
    request: string
  },
): MultiMutationResult {
  const parsed =
    parseMultiEdit(
      params.request,
    )

  return applyParsedMultiMutation({
    tree:
      params.tree,

    parsed,
  })
}

function applyCapabilityProp(
  node: EditorNode,
  key: string,
  value: unknown,
): boolean {
  /*
   * La propiedad debe existir realmente
   * en el contrato del bloque.
   */
  const setting =
    getCapabilitySetting(
      node.type,
      key,
    )

  if (!setting) {
    return false
  }

  /*
   * El valor debe ser aceptado por el
   * Registry real del Builder.
   */
  if (
    !isCapabilityValueAllowed(
      node.type,
      key,
      value,
    )
  ) {
    return false
  }

  /*
   * No generamos mutaciones artificiales.
   */
  if (
    node.props[key] === value
  ) {
    return false
  }

  node.props = {
    ...node.props,
    [key]: value,
  }

  return true
}

export function applyParsedMultiMutation(
  params: {
    tree: EditorTree
    parsed: ParsedMultiEdit
  },
): MultiMutationResult {
  const next =
    structuredClone(
      params.tree,
    )

  const parsed =
    params.parsed

  if (
    parsed.target ===
    "unknown"
  ) {
    return {
      ok: false,
      tree: next,
      matchedNodeIds: [],
      changes: [],
      warnings: [
        "No se pudo identificar el conjunto de nodos que debe modificarse.",
      ],
    }
  }

  if (
    parsed.operation ===
      "unknown" ||
    !parsed.value
  ) {
    return {
      ok: false,
      tree: next,
      matchedNodeIds: [],
      changes: [],
      warnings: [
        "La intención multi-edit no contiene una modificación determinista.",
      ],
    }
  }

  const candidates =
    Object.values(
      next.nodes,
    ).filter(
      (node) =>
        node.id !==
          next.rootId &&
        matchesTarget(
          node,
          parsed.target,
        ),
    )

  if (
    candidates.length === 0
  ) {
    return {
      ok: false,
      tree: next,
      matchedNodeIds: [],
      changes: [],
      warnings: [
        "No existen nodos compatibles con el conjunto solicitado.",
      ],
    }
  }

  const changes:
    MultiMutationResult["changes"] =
      []

  for (
    const node of candidates
  ) {
    const before =
      structuredClone(
        node.props,
      )

    let applied =
      false

    switch (parsed.operation) {
      case "set_color":
        applied =
          applyCapabilityProp(
            node,
            "color",
            parsed.value,
          )
        break

      case "set_align":
        applied =
          applyCapabilityProp(
            node,
            "align",
            parsed.value,
          )
        break

      case "set_size":
        applied =
          applyCapabilityProp(
            node,
            "size",
            parsed.value,
          )
        break

      case "set_weight":
        applied =
          applyCapabilityProp(
            node,
            "weight",
            parsed.value,
          )
        break

      case "set_padding_y":
        applied =
          applyCapabilityProp(
            node,
            "paddingY",
            parsed.value,
          )
        break

      case "set_padding_x":
        applied =
          applyCapabilityProp(
            node,
            "paddingX",
            parsed.value,
          )
        break

      case "set_margin_y":
        applied =
          applyCapabilityProp(
            node,
            "marginY",
            parsed.value,
          )
        break

      case "set_shadow":
        applied =
          applyCapabilityProp(
            node,
            "shadow",
            parsed.value,
          )
        break

      case "set_border_radius":
        applied =
          applyCapabilityProp(
            node,
            "borderRadius",
            parsed.value,
          )
        break

      case "set_max_width":
        applied =
          applyCapabilityProp(
            node,
            "maxWidth",
            parsed.value,
          )
        break

      case "set_variant":
        applied =
          applyCapabilityProp(
            node,
            "variant",
            parsed.value,
          )
        break

      case "set_button_size":
        applied =
          applyCapabilityProp(
            node,
            "size",
            parsed.value,
          )
        break
    }

    if (!applied) {
      continue
    }

    const after =
      structuredClone(
        node.props,
      )

    const keys =
      changedKeys(
        before,
        after,
      )

    if (
      keys.length === 0
    ) {
      continue
    }

    changes.push({
      nodeId:
        node.id,

      nodeType:
        node.type,

      before,
      after,

      changedKeys:
        keys,
    })
  }

  if (
    changes.length === 0
  ) {
    return {
      ok: false,
      tree: next,

      matchedNodeIds:
        candidates.map(
          (node) =>
            node.id,
        ),

      changes: [],

      warnings: [
        "Los nodos encontrados no admiten la modificación solicitada o ya tienen ese valor.",
      ],
    }
  }

  return {
    ok: true,
    tree: next,

    matchedNodeIds:
      candidates.map(
        (node) =>
          node.id,
      ),

    changes,

    warnings: [],
  }
}