export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    rollbackMutation,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const {
    getResolvedSiteTheme,
  } = await import(
    "@/lib/builder-core/tree/sitePages"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  const request =
    "Haz que el sitio se vea más premium"

  const before =
    await getResolvedSiteTheme(
      siteId,
    )

  const beforeJson =
    JSON.stringify(
      before.tokens,
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — AGENT DESIGN EDIT",
  )

  console.log(
    "========================================",
  )

  /*
   * PREVIEW
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
    "POLICY:",
    preview.policy?.allowed,
  )

  console.log(
    "SNAPSHOT:",
    Boolean(
      preview.snapshot,
    ),
  )

  const afterPreview =
    await getResolvedSiteTheme(
      siteId,
    )

  console.log(
    "PREVIEW THEME UNCHANGED:",
    JSON.stringify(
      afterPreview.tokens,
    ) === beforeJson,
  )

  if (
    !preview.ok ||
    preview.scope !==
      "design_edit" ||
    preview.action !==
      "preview" ||
    !preview.policy?.allowed ||
    !preview.snapshot ||
    JSON.stringify(
      afterPreview.tokens,
    ) !== beforeJson
  ) {
    throw new Error(
      "DESIGN PREVIEW falló.",
    )
  }

  /*
   * EXECUTE
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
    "SNAPSHOT:",
    Boolean(
      execute.snapshot,
    ),
  )

  const afterExecute =
    await getResolvedSiteTheme(
      siteId,
    )

  const afterJson =
    JSON.stringify(
      afterExecute.tokens,
    )

  console.log(
    "THEME CHANGED:",
    afterJson !==
      beforeJson,
  )

  console.log(
    "SOURCE:",
    afterExecute.source,
  )

  if (
    !execute.ok ||
    execute.scope !==
      "design_edit" ||
    execute.action !==
      "executed" ||
    !execute.snapshot ||
    afterJson ===
      beforeJson
  ) {
    throw new Error(
      "DESIGN EXECUTE falló.",
    )
  }

  /*
   * ROLLBACK
   */
  const rollback =
    await rollbackMutation({
      snapshot:
        execute.snapshot,

      pageSlug,
    })

  console.log("")
  console.log(
    "=== ROLLBACK ===",
  )

  console.log(
    "VERIFIED:",
    rollback.verified,
  )

  const restored =
    await getResolvedSiteTheme(
      siteId,
    )

  const restoredJson =
    JSON.stringify(
      restored.tokens,
    )

  console.log(
    "EXACT RESTORE:",
    restoredJson ===
      beforeJson,
  )

  if (
    !rollback.verified ||
    restoredJson !==
      beforeJson
  ) {
    throw new Error(
      "DESIGN ROLLBACK falló.",
    )
  }

  console.log("")
  console.log(
    "AGENT DESIGN EDIT VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "AGENT DESIGN EDIT TEST ERROR:",
    error,
  )

  process.exit(1)
})
