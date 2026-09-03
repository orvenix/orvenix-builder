export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    duplicateRootSection,
    moveRootSection,
    reorderRootSections,
    collectSectionSubtreeIds,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  const tree =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const working =
    structuredClone(tree)

  const root =
    working.nodes[
      working.rootId
    ]

  if (
    !root ||
    root.children.length < 3
  ) {
    throw new Error(
      "Se requieren al menos 3 secciones.",
    )
  }

  const originalNodeCount =
    Object.keys(
      working.nodes,
    ).length

  const originalOrder =
    [...root.children]

  const sourceId =
    originalOrder[1]

  const targetId =
    originalOrder[2]

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — STRUCTURAL OPERATIONS",
  )

  console.log(
    "========================================",
  )

  console.log(
    "\nORIGINAL NODES:",
    originalNodeCount,
  )

  console.log(
    "ORIGINAL SECTIONS:",
    originalOrder.length,
  )

  console.log(
    "SOURCE:",
    sourceId,
  )

  console.log(
    "TARGET:",
    targetId,
  )

  /*
   * MOVE
   */
  const beforeMoveCount =
    Object.keys(
      working.nodes,
    ).length

  const moved =
    moveRootSection({
      tree: working,

      sectionId:
        sourceId,

      afterSectionId:
        targetId,
    })

  const afterMoveCount =
    Object.keys(
      working.nodes,
    ).length

  console.log("")
  console.log(
    "=== MOVE ===",
  )

  console.log(
    "PREVIOUS INDEX:",
    moved.previousIndex,
  )

  console.log(
    "NEXT INDEX:",
    moved.nextIndex,
  )

  console.log(
    "NODE DELTA:",
    afterMoveCount -
      beforeMoveCount,
  )

  console.log(
    "SECTIONS:",
    root.children.length,
  )

  if (
    afterMoveCount !==
    beforeMoveCount
  ) {
    throw new Error(
      "MOVE alteró el número de nodos.",
    )
  }

  if (
    root.children.length !==
    originalOrder.length
  ) {
    throw new Error(
      "MOVE alteró el número de secciones.",
    )
  }

  /*
   * DUPLICATE
   */
  const sourceSize =
    collectSectionSubtreeIds(
      working,
      sourceId,
    ).length

  const beforeDuplicate =
    Object.keys(
      working.nodes,
    ).length

  const sectionsBeforeDuplicate =
    root.children.length

  const duplicated =
    duplicateRootSection({
      tree: working,

      sectionId:
        sourceId,
    })

  const afterDuplicate =
    Object.keys(
      working.nodes,
    ).length

  console.log("")
  console.log(
    "=== DUPLICATE ===",
  )

  console.log(
    "SOURCE SUBTREE:",
    sourceSize,
  )

  console.log(
    "ADDED:",
    duplicated.addedIds.length,
  )

  console.log(
    "NODE DELTA:",
    afterDuplicate -
      beforeDuplicate,
  )

  console.log(
    "NEW ROOT:",
    duplicated.rootSectionId,
  )

  console.log(
    "SECTION DELTA:",
    root.children.length -
      sectionsBeforeDuplicate,
  )

  if (
    sourceSize !==
    duplicated.addedIds.length
  ) {
    throw new Error(
      "DUPLICATE no copió exactamente el subtree.",
    )
  }

  if (
    afterDuplicate -
      beforeDuplicate !==
    sourceSize
  ) {
    throw new Error(
      "El delta de nodos de DUPLICATE es incorrecto.",
    )
  }

  if (
    root.children.length !==
    sectionsBeforeDuplicate + 1
  ) {
    throw new Error(
      "DUPLICATE no agregó exactamente una sección raíz.",
    )
  }

  if (
    !working.nodes[
      duplicated.rootSectionId
    ]
  ) {
    throw new Error(
      "El root duplicado no existe.",
    )
  }

  /*
   * REORDER
   */
  const beforeReorderCount =
    Object.keys(
      working.nodes,
    ).length

  const currentOrder =
    [...root.children]

  const reversed =
    [...currentOrder]
      .reverse()

  reorderRootSections(
    working,
    reversed,
  )

  const afterReorderCount =
    Object.keys(
      working.nodes,
    ).length

  console.log("")
  console.log(
    "=== REORDER ===",
  )

  console.log(
    "SECTIONS:",
    root.children.length,
  )

  console.log(
    "NODE DELTA:",
    afterReorderCount -
      beforeReorderCount,
  )

  console.log(
    "ORDER CHANGED:",
    JSON.stringify(
      currentOrder,
    ) !==
      JSON.stringify(
        root.children,
      ),
  )

  if (
    afterReorderCount !==
    beforeReorderCount
  ) {
    throw new Error(
      "REORDER modificó el número de nodos.",
    )
  }

  if (
    root.children.length !==
    currentOrder.length
  ) {
    throw new Error(
      "REORDER modificó el número de secciones.",
    )
  }

  /*
   * Confirmar que REORDER conserva
   * exactamente el mismo conjunto.
   */
  const beforeSet =
    [...currentOrder].sort()

  const afterSet =
    [...root.children].sort()

  if (
    JSON.stringify(beforeSet) !==
    JSON.stringify(afterSet)
  ) {
    throw new Error(
      "REORDER cambió el conjunto de secciones.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA ESTRUCTURAL EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "STRUCTURAL OPERATIONS TEST ERROR:",
    error,
  )

  process.exit(1)
})
