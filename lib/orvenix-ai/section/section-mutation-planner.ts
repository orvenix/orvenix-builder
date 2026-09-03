import {
  randomUUID,
} from "crypto"

import type {
  EditorNode,
  EditorTree,
} from "@/types/editor"

import {
  discoverRootSection,
  removeRootSection,
  canPreviewDestructiveSectionOperation,
  moveRootSection,
  duplicateRootSection,
  reorderRootSections,
} from "./tree-operations"

import {
  composeSection,
} from "@/lib/orvenix-ai/composer"

import {
  getBlockCapability,
} from "@/lib/orvenix-ai/capabilities"

import {
  parseSectionIntent,
} from "./section-intent"

import type {
  SectionMutationResult,
} from "./types"

function cloneTree(
  tree: EditorTree,
): EditorTree {
  return structuredClone(tree)
}

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

function findSection(
  tree: EditorTree,
  keyword?: string,
): EditorNode | null {
  if (!keyword) return null

  const root =
    tree.nodes[tree.rootId]

  if (!root) return null

  const search =
    normalize(keyword)

  for (
    const id
    of root.children ?? []
  ) {
    const node =
      tree.nodes[id]

    if (!node) continue

    const haystack =
      normalize(
        `${node.id} ${node.displayName ?? ""} ${node.type}`,
      )

    if (
      haystack.includes(search)
    ) {
      return node
    }
  }

  return null
}

function copyComposedSection(params: {
  source:
    NonNullable<
      ReturnType<typeof composeSection>
    >

  tree: EditorTree
}) {
  const {
    source,
    tree,
  } = params

  const idMap =
    new Map<string, string>()

  for (
  const tempId
  of Object.keys(source.nodes)
) {
  const isRoot =
    tempId ===
    source.rootId

  idMap.set(
    tempId,

    isRoot
      ? `ai-section-${source.role}-${randomUUID()}`
      : `ai-section-node-${randomUUID()}`,
  )
}

  for (
    const composed
    of Object.values(source.nodes)
  ) {
    const id =
      idMap.get(
        composed.tempId,
      )

    if (!id) {
      throw new Error(
        "No se pudo resolver un nodo compuesto.",
      )
    }

    const capability =
      getBlockCapability(
        composed.type,
      )

    if (!capability) {
      throw new Error(
        `Bloque no registrado: ${composed.type}`,
      )
    }

    tree.nodes[id] = {
      id,
      type:
        composed.type,

      displayName:
        composed.displayName,

      props:
        structuredClone(
          composed.props,
        ),

      children:
        composed.children.map(
          (childId) => {
            const mapped =
              idMap.get(childId)

            if (!mapped) {
              throw new Error(
                `No se pudo resolver hijo ${childId}`,
              )
            }

            return mapped
          },
        ),

      version:
        capability.version ?? 1,
    }
  }

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

      if (
        child &&
        idMap.has(
          [...idMap.entries()]
            .find(
              ([, value]) =>
                value === childId,
            )?.[0] ?? "",
        )
      ) {
        child.parentId =
          node.id
      }
    }
  }

  return {
    rootId:
      idMap.get(
        source.rootId,
      )!,

    addedIds:
      [...idMap.values()],
  }
}

export function planSectionMutation(params: {
  tree: EditorTree
  request: string
  targetSectionId?: string
}): SectionMutationResult {
  const next =
    cloneTree(params.tree)

  const parsed =
    parseSectionIntent(
      params.request,
    )

  if (
  parsed.operation ===
  "unknown"
) {
  return {
    ok: false,
    tree: next,

    addedNodeIds: [],
    removedNodeIds: [],
    changedNodeIds: [],

    warnings: [
      "No se pudo interpretar con seguridad la operación de sección.",
    ],
  }
}

const requiresRole =
  parsed.operation === "add" ||
  parsed.operation === "remove" ||
  parsed.operation === "replace"

if (
  requiresRole &&
  !parsed.role &&
  !params.targetSectionId
) {
  return {
    ok: false,
    tree: next,

    addedNodeIds: [],
    removedNodeIds: [],
    changedNodeIds: [],

    warnings: [
      "No se pudo identificar la sección objetivo.",
    ],
  }
}

  const root =
    next.nodes[next.rootId]

  if (!root) {
    return {
      ok: false,
      tree: next,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "El árbol no contiene root válido.",
      ],
    }
  }

  function resolveRequestedSection() {
  if (
    params.targetSectionId &&
    next.nodes[
      params.targetSectionId
    ]
  ) {
    const id =
      params.targetSectionId

    if (
      !root.children.includes(id)
    ) {
      return null
    }

    return next.nodes[id]
  }

  if (parsed.role) {
    return (
      discoverRootSection(
        next,
        parsed.role,
      ).node
    )
  }

  return null
}

  /*
   * ADD
   */
  if (
    parsed.operation === "add"
  ) {
    const composition =
      composeSection(
        parsed.role,
      )

    if (!composition) {
      return {
        ok: false,
        tree: next,
        role:
          parsed.role,

        addedNodeIds: [],
        removedNodeIds: [],
        changedNodeIds: [],

        warnings: [
          `Todavía no existe una composición segura para "${parsed.role}".`,
        ],
      }
    }

    const copied =
      copyComposedSection({
        source:
          composition,

        tree:
          next,
      })

    const section =
      next.nodes[
        copied.rootId
      ]

    if (section) {
      section.parentId =
        root.id
    }

    let insertIndex =
      root.children.length

    if (
      parsed.placement?.after
    ) {
      const after =
        findSection(
          next,
          parsed.placement.after,
        )

      if (after) {
        const index =
          root.children.indexOf(
            after.id,
          )

        if (index >= 0) {
          insertIndex =
            index + 1
        }
      }
    }

    if (
      parsed.placement?.before
    ) {
      const before =
        findSection(
          next,
          parsed.placement.before,
        )

      if (before) {
        const index =
          root.children.indexOf(
            before.id,
          )

        if (index >= 0) {
          insertIndex =
            index
        }
      }
    }

    root.children.splice(
      insertIndex,
      0,
      copied.rootId,
    )

    return {
      ok: true,
      tree: next,
      role:
        parsed.role,

      rootSectionId:
        copied.rootId,

      addedNodeIds:
        copied.addedIds,

      removedNodeIds: [],

      changedNodeIds: [
        root.id,
      ],

      warnings: [],
    }
  }

  /*
 * DUPLICATE
 */
if (
  parsed.operation ===
  "duplicate"
) {
  const source =
    resolveRequestedSection()

  if (!source) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "No se pudo identificar con seguridad la sección que debe duplicarse.",
      ],
    }
  }

  const duplicated =
    duplicateRootSection({
      tree: next,
      sectionId:
        source.id,
    })

  return {
    ok: true,
    tree: next,
    role:
      parsed.role,

    rootSectionId:
      duplicated.rootSectionId,

    addedNodeIds:
      duplicated.addedIds,

    removedNodeIds: [],

    changedNodeIds:
      duplicated.changedIds,

    warnings: [],
  }
}

/*
 * MOVE
 */
if (
  parsed.operation ===
  "move"
) {
  const source =
    resolveRequestedSection()

  if (!source) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "No se pudo identificar la sección que debe moverse.",
      ],
    }
  }

  let beforeSectionId:
    string | undefined

  let afterSectionId:
    string | undefined

  if (
    parsed.placement?.before
  ) {
    const destination =
      discoverRootSection(
        next,
        parsed.placement.before,
      )

    if (
      !destination.node ||
      destination.confidence ===
        "none"
    ) {
      return {
        ok: false,
        tree: next,
        role: parsed.role,

        addedNodeIds: [],
        removedNodeIds: [],
        changedNodeIds: [],

        warnings: [
          `No pude identificar la sección destino "${parsed.placement.before}".`,
        ],
      }
    }

    beforeSectionId =
      destination.node.id
  }

  if (
    parsed.placement?.after
  ) {
    const destination =
      discoverRootSection(
        next,
        parsed.placement.after,
      )

    if (
      !destination.node ||
      destination.confidence ===
        "none"
    ) {
      return {
        ok: false,
        tree: next,
        role: parsed.role,

        addedNodeIds: [],
        removedNodeIds: [],
        changedNodeIds: [],

        warnings: [
          `No pude identificar la sección destino "${parsed.placement.after}".`,
        ],
      }
    }

    afterSectionId =
      destination.node.id
  }

  if (
    !beforeSectionId &&
    !afterSectionId
  ) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      rootSectionId:
        source.id,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "MOVE necesita indicar dónde colocar la sección.",
      ],
    }
  }

  const moved =
    moveRootSection({
      tree: next,

      sectionId:
        source.id,

      beforeSectionId,
      afterSectionId,
    })

  return {
    ok: true,
    tree: next,
    role:
      parsed.role,

    rootSectionId:
      source.id,

    addedNodeIds: [],
    removedNodeIds: [],

    changedNodeIds:
      moved.changedIds,

    warnings: [],
  }
}

/*
 * REORDER
 */
if (
  parsed.operation ===
  "reorder"
) {
  const source =
    resolveRequestedSection()

  if (!source) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "No se pudo identificar la sección que debe reordenarse.",
      ],
    }
  }

  if (!parsed.direction) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      rootSectionId:
        source.id,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "No se pudo identificar la nueva posición de la sección.",
      ],
    }
  }

  const currentOrder =
    [...root.children]

  const currentIndex =
    currentOrder.indexOf(
      source.id,
    )

  if (currentIndex < 0) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "La sección no pertenece directamente al root.",
      ],
    }
  }

  let nextIndex =
    currentIndex

  switch (
    parsed.direction
  ) {
    case "first":
      nextIndex = 0
      break

    case "last":
      nextIndex =
        currentOrder.length - 1
      break

    case "up":
      nextIndex =
        Math.max(
          0,
          currentIndex - 1,
        )
      break

    case "down":
      nextIndex =
        Math.min(
          currentOrder.length - 1,
          currentIndex + 1,
        )
      break
  }

  /*
   * Ya está donde se solicitó.
   */
  if (
    nextIndex ===
    currentIndex
  ) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      rootSectionId:
        source.id,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "La sección ya se encuentra en esa posición.",
      ],
    }
  }

  currentOrder.splice(
    currentIndex,
    1,
  )

  currentOrder.splice(
    nextIndex,
    0,
    source.id,
  )

  const reordered =
    reorderRootSections(
      next,
      currentOrder,
    )

  return {
    ok: true,
    tree: next,
    role: parsed.role,

    rootSectionId:
      source.id,

    addedNodeIds: [],
    removedNodeIds: [],

    changedNodeIds:
      reordered.changedIds,

    warnings: [],
  }
}

  /*
 * REMOVE
 */
if (
  parsed.operation === "remove"
) {
  const discovery =
    discoverRootSection(
      next,
      parsed.role,
    )

  if (!discovery.node) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        `No se encontró una sección "${parsed.role}" suficientemente identificable.`,
      ],
    }
  }

  if (
    !canPreviewDestructiveSectionOperation(
      discovery,
    )
  ) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      rootSectionId:
        discovery.node.id,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        `La sección candidata tiene confianza "${discovery.confidence}" y no es segura para eliminar.`,
      ],
    }
  }

  const removed =
    removeRootSection(
      next,
      discovery.node.id,
    )

  return {
    ok: true,
    tree: next,
    role: parsed.role,

    rootSectionId:
      discovery.node.id,

    addedNodeIds: [],

    removedNodeIds:
      removed.removedIds,

    changedNodeIds:
      removed.changedIds,

    warnings:
      discovery.confidence === "medium"
        ? [
            `La sección fue identificada con confianza media (${discovery.score}). Solo debería previsualizarse, no ejecutarse automáticamente.`,
          ]
        : [],
  }
}

/*
 * REPLACE
 */
if (
  parsed.operation === "replace"
) {
  const discovery =
    discoverRootSection(
      next,
      parsed.role,
    )

  if (!discovery.node) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        `No se encontró una sección "${parsed.role}" suficientemente identificable.`,
      ],
    }
  }

  if (
    discovery.confidence !== "high"
  ) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      rootSectionId:
        discovery.node.id,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        `La sección candidata tiene confianza "${discovery.confidence}". REPLACE requiere confianza alta.`,
      ],
    }
  }

  /*
   * Guardamos la posición original.
   */
  const root =
    next.nodes[next.rootId]

  if (!root) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "El árbol no contiene un root válido.",
      ],
    }
  }

  const originalIndex =
    root.children.indexOf(
      discovery.node.id,
    )

  if (originalIndex < 0) {
    return {
      ok: false,
      tree: next,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "La sección encontrada no pertenece directamente al root.",
      ],
    }
  }

  /*
   * Eliminamos la sección anterior.
   */
  const removed =
    removeRootSection(
      next,
      discovery.node.id,
    )

  /*
   * Componemos la nueva.
   */
  const composition =
    composeSection(
      parsed.role,
    )

  if (!composition) {
    return {
      ok: false,
      tree: params.tree,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        `No existe una composición segura para reconstruir "${parsed.role}".`,
      ],
    }
  }

  const copied =
    copyComposedSection({
      source:
        composition,

      tree:
        next,
    })

  const newSection =
    next.nodes[
      copied.rootId
    ]

  if (!newSection) {
    return {
      ok: false,
      tree: params.tree,
      role: parsed.role,

      addedNodeIds: [],
      removedNodeIds: [],
      changedNodeIds: [],

      warnings: [
        "La nueva sección no pudo materializarse.",
      ],
    }
  }

  newSection.parentId =
    root.id

  /*
   * La nueva sección entra exactamente
   * en la posición de la anterior.
   */
  root.children.splice(
    originalIndex,
    0,
    copied.rootId,
  )

  return {
    ok: true,
    tree: next,
    role:
      parsed.role,

    rootSectionId:
      copied.rootId,

    addedNodeIds:
      copied.addedIds,

    removedNodeIds:
      removed.removedIds,

    changedNodeIds:
      [root.id],

    warnings: [],
  }
}

  return {
    ok: false,
    tree: next,
    role:
      parsed.role,

    addedNodeIds: [],
    removedNodeIds: [],
    changedNodeIds: [],

    warnings: [
      `La operación "${parsed.operation}" se implementará después de validar ADD.`,
    ],
  }
}
