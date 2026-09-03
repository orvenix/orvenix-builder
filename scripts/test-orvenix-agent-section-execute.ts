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

  /*
   * ESTADO ORIGINAL
   */
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
    "ORVENIX AI — SECTION EXECUTE / ROLLBACK",
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

  /*
   * EJECUTAR ORDEN REAL
   */
  const result =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        "Agrega un FAQ después de servicios",

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

  if (!result.ok) {
    throw new Error(
      "El Agent no pudo ejecutar la mutación de sección.",
    )
  }

  if (
    result.action !==
    "executed"
  ) {
    throw new Error(
      `Se esperaba action=executed y llegó ${result.action}.`,
    )
  }

  if (!result.snapshot) {
    throw new Error(
      "La ejecución no devolvió snapshot para rollback.",
    )
  }

  /*
   * LEER DESPUÉS DEL APPLY
   */
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
    "=== AFTER APPLY ===",
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

  console.log(
    "NODE DELTA:",
    afterNodes - beforeNodes,
  )

  if (
    afterHash === beforeHash
  ) {
    throw new Error(
      "El árbol no cambió después del execute.",
    )
  }

  if (
    afterNodes !==
    beforeNodes + 16
  ) {
    throw new Error(
      `Se esperaban ${beforeNodes + 16} nodos y llegaron ${afterNodes}.`,
    )
  }

  /*
   * CONFIRMAR QUE EXISTE FAQ
   */
  const faqNodes =
    Object.values(
      after.nodes,
    ).filter((node) => {
      const text =
        `${node.id} ${node.displayName ?? ""}`
          .toLowerCase()

      return (
        text.includes("faq") ||
        text.includes(
          "preguntas frecuentes",
        )
      )
    })

  console.log(
    "FAQ RELATED NODES:",
    faqNodes.length,
  )

  if (
    faqNodes.length === 0
  ) {
    throw new Error(
      "No se encontró evidencia de la sección FAQ aplicada.",
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

  /*
   * VERIFICACIÓN FINAL
   */
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

  if (
    restoredHash !== beforeHash
  ) {
    throw new Error(
      "El rollback de sección no restauró exactamente el árbol original.",
    )
  }

  if (
    restoredNodes !== beforeNodes
  ) {
    throw new Error(
      "El rollback no restauró el número original de nodos.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA DE SECCION COMPLETA EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "SECTION AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})
