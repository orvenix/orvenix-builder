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

  const siteId = "site_1a9dba45c3ad"
  const pageSlug = "home"

  const before =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const beforeHash =
    hashEditorTree(before)

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — LOCAL EXECUTE / ROLLBACK",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "BEFORE HASH:",
    beforeHash,
  )

  const result =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        'Cambia el título del hero a "Tu sonrisa merece atención profesional"',

      mode:
        "execute",
    })

  console.log("")
  console.log("=== EXECUTE ===")

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
      "El Agent no pudo ejecutar el cambio local.",
    )
  }

  if (!result.snapshot) {
    throw new Error(
      "La ejecución local no devolvió snapshot.",
    )
  }

  const after =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const afterHash =
    hashEditorTree(after)

  console.log("")
  console.log(
    "AFTER HASH:",
    afterHash,
  )

  console.log(
    "TREE CHANGED:",
    beforeHash !== afterHash,
  )

  console.log("")
  console.log("=== ROLLBACK ===")

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
    hashEditorTree(restored)

  console.log("")
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
      "El rollback local no restauró exactamente el árbol original.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA LOCAL COMPLETA EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "LOCAL AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})
