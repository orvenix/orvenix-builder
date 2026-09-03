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

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION REMOVE EXECUTE",
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

  const result =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        "Quita testimonios",

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
      "El Agent no pudo ejecutar REMOVE.",
    )
  }

  if (!result.snapshot) {
    throw new Error(
      "La operación no devolvió snapshot.",
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
    "=== AFTER REMOVE ===",
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
    "NODE DELTA:",
    afterNodes - beforeNodes,
  )

  console.log(
    "TREE CHANGED:",
    afterHash !== beforeHash,
  )

  if (
    afterNodes !==
    beforeNodes - 15
  ) {
    throw new Error(
      `Se esperaban ${beforeNodes - 15} nodos y llegaron ${afterNodes}.`,
    )
  }

  /*
   * Confirmar que testimonials-section
   * ya no existe.
   */
  console.log(
    "TESTIMONIAL SECTION EXISTS:",
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
      "La sección de testimonios sigue presente.",
    )
  }

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

  const restoredNodes =
    Object.keys(
      restored.nodes,
    ).length

  console.log("")
  console.log(
    "=== FINAL ===",
  )

  console.log(
    "RESTORED NODES:",
    restoredNodes,
  )

  console.log(
    "RESTORED HASH:",
    restoredHash,
  )

  console.log(
    "EXACT RESTORE:",
    restoredHash === beforeHash,
  )

  console.log(
    "TESTIMONIAL RESTORED:",
    Boolean(
      restored.nodes[
        "testimonials-section"
      ],
    ),
  )

  if (
    restoredHash !== beforeHash
  ) {
    throw new Error(
      "Rollback de REMOVE no restauró exactamente el árbol.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA REMOVE COMPLETA EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "REMOVE AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})
