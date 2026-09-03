export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    rollbackMutation,
    hashEditorTree,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

 const request =
  "Pon todos los botones en tamaño grande"

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
    "ORVENIX AI — AGENT MULTI EDIT",
  )
  console.log(
    "========================================",
  )

  /*
   * 1. PREVIEW
   */
  const preview =
    await runOrvenixAgent({
      siteId,
      pageSlug,
      message:
        request,
      mode:
        "preview",
    })

  console.log("")
  console.log(
    "=== PREVIEW ===",
  )
  console.log(
    "SCOPE:",
    preview.scope,
  )
  console.log(
    "ACTION:",
    preview.action,
  )
  console.log(
    "OK:",
    preview.ok,
  )
  console.log(
    "CHANGES:",
    preview.plan
      ? {
          added:
            preview.plan.addedNodes,
          removed:
            preview.plan.removedNodes,
          changed:
            preview.plan.changedNodes,
        }
      : null,
  )
  console.log(
    "POLICY:",
    preview.policy?.allowed,
  )

  if (
    !preview.ok ||
    preview.scope !==
      "multi_edit" ||
    preview.action !==
      "preview" ||
    !preview.plan ||
    preview.plan.addedNodes !==
      0 ||
    preview.plan.removedNodes !==
      0 ||
    preview.plan.changedNodes <
      1 ||
    !preview.policy?.allowed
  ) {
    throw new Error(
      "PREVIEW multi-edit falló.",
    )
  }

  /*
   * Confirmar que preview NO escribió.
   */
  const afterPreview =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const afterPreviewHash =
    hashEditorTree(
      afterPreview,
    )

  console.log(
    "PREVIEW DB UNCHANGED:",
    afterPreviewHash ===
      beforeHash,
  )

  if (
    afterPreviewHash !==
    beforeHash
  ) {
    throw new Error(
      "PREVIEW modificó la base de datos.",
    )
  }

  /*
   * 2. EXECUTE
   */
  const execute =
    await runOrvenixAgent({
      siteId,
      pageSlug,
      message:
        request,
      mode:
        "execute",
    })

  console.log("")
  console.log(
    "=== EXECUTE ===",
  )
  console.log(
    "SCOPE:",
    execute.scope,
  )
  console.log(
    "ACTION:",
    execute.action,
  )
  console.log(
    "OK:",
    execute.ok,
  )
  console.log(
    "CHANGES:",
    execute.plan
      ? {
          added:
            execute.plan.addedNodes,
          removed:
            execute.plan.removedNodes,
          changed:
            execute.plan.changedNodes,
        }
      : null,
  )
  console.log(
    "SNAPSHOT:",
    Boolean(
      execute.snapshot,
    ),
  )

  if (
    !execute.ok ||
    execute.scope !==
      "multi_edit" ||
    execute.action !==
      "executed" ||
    !execute.plan ||
    !execute.snapshot
  ) {
    throw new Error(
      "EXECUTE multi-edit falló.",
    )
  }

  const afterExecute =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const afterExecuteHash =
    hashEditorTree(
      afterExecute,
    )

  console.log(
    "TREE CHANGED:",
    afterExecuteHash !==
      beforeHash,
  )

  if (
    afterExecuteHash ===
    beforeHash
  ) {
    throw new Error(
      "EXECUTE no modificó el árbol.",
    )
  }

  /*
   * 3. ROLLBACK
   */
  console.log("")
  console.log(
    "=== ROLLBACK ===",
  )

  const rollback =
    await rollbackMutation({
      snapshot:
        execute.snapshot,
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

  console.log(
    "EXACT RESTORE:",
    restoredHash ===
      beforeHash,
  )

  if (
    !rollback.verified ||
    restoredHash !==
      beforeHash
  ) {
    throw new Error(
      "ROLLBACK multi-edit falló.",
    )
  }

  console.log("")
  console.log(
    "AGENT MULTI EDIT VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "AGENT MULTI EDIT TEST ERROR:",
    error,
  )

  process.exit(1)
})
