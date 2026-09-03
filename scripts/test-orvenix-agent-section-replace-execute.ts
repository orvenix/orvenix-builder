export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    rollbackMutation,
    hashEditorTree,
  } = await import("@/lib/orvenix-ai")

  const {
    getEditorTreeFromDb,
  } = await import("@/lib/editorPersistence")

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  const before =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const beforeHash =
    hashEditorTree(before)

  const beforeNodes =
    Object.keys(
      before.nodes,
    ).length

  const rootBefore =
    before.nodes[
      before.rootId
    ]

  const oldIndex =
    rootBefore?.children.indexOf(
      "testimonials-section",
    ) ?? -1

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION REPLACE EXECUTE",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "BEFORE NODES:",
    beforeNodes,
  )

  console.log(
    "BEFORE HASH:",
    beforeHash,
  )

  console.log(
    "OLD INDEX:",
    oldIndex,
  )

  const result =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        "Rehaz testimonios",

      mode:
        "execute",
    })

  console.log("")
  console.log(
    "=== EXECUTE ===",
  )

  console.log(
    "SCOPE:",
    result.scope,
  )

  console.log(
    "ACTION:",
    result.action,
  )

  console.log(
    "OK:",
    result.ok,
  )

  console.log(
    "MESSAGE:",
    result.message,
  )

  if (result.plan) {
    console.log(
      "CHANGES:",
      {
        added:
          result.plan.addedNodes,

        removed:
          result.plan.removedNodes,

        changed:
          result.plan.changedNodes,
      },
    )
  }

  if (
    !result.ok ||
    result.action !== "executed"
  ) {
    throw new Error(
      "REPLACE no pudo ejecutarse.",
    )
  }

  if (!result.snapshot) {
    throw new Error(
      "REPLACE no devolvió snapshot.",
    )
  }

  const after =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const afterHash =
    hashEditorTree(after)

  const afterNodes =
    Object.keys(
      after.nodes,
    ).length

  console.log("")
  console.log(
    "=== AFTER REPLACE ===",
  )

  console.log(
    "NODES:",
    afterNodes,
  )

  console.log(
    "HASH:",
    afterHash,
  )

  console.log(
    "TREE CHANGED:",
    afterHash !== beforeHash,
  )

  /*
   * La sección anterior ya no debe existir.
   */
  console.log(
    "OLD SECTION EXISTS:",
    Boolean(
      after.nodes[
        "testimonials-section"
      ],
    ),
  )

  if (
    after.nodes[
      "testimonials-section"
    ]
  ) {
    throw new Error(
      "La sección anterior sigue presente.",
    )
  }

  /*
   * Encontramos la nueva sección
   * por displayName.
   */
  const newSection =
    Object.values(
      after.nodes,
    ).find(
      (node) =>
        node.type === "section" &&
        node.displayName ===
          "Testimonios",
    )

  if (!newSection) {
    throw new Error(
      "No se encontró la nueva sección de testimonios.",
    )
  }

  const rootAfter =
    after.nodes[
      after.rootId
    ]

  const newIndex =
    rootAfter?.children.indexOf(
      newSection.id,
    ) ?? -1

  console.log(
    "NEW SECTION:",
    newSection.id,
  )

  console.log(
    "NEW INDEX:",
    newIndex,
  )

  console.log(
    "POSITION PRESERVED:",
    newIndex === oldIndex,
  )

  if (
    newIndex !== oldIndex
  ) {
    throw new Error(
      "REPLACE cambió la posición de la sección.",
    )
  }

  /*
   * ROLLBACK
   */
  console.log("")
  console.log(
    "=== ROLLBACK ===",
  )

  const rollback =
    await rollbackMutation({
      snapshot:
        result.snapshot,

      pageSlug,
    })

  console.log(
    "VERIFIED:",
    rollback.verified,
  )

  const restored =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const restoredHash =
    hashEditorTree(
      restored,
    )

  console.log("")
  console.log(
    "=== FINAL ===",
  )

  console.log(
    "RESTORED NODES:",
    Object.keys(
      restored.nodes,
    ).length,
  )

  console.log(
    "RESTORED HASH:",
    restoredHash,
  )

  console.log(
    "EXACT RESTORE:",
    restoredHash === beforeHash,
  )

  if (
    restoredHash !== beforeHash
  ) {
    throw new Error(
      "Rollback de REPLACE no restauró exactamente el sitio.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA REPLACE COMPLETA EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "REPLACE AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})
