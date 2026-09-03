export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getResolvedSiteTheme,
  } = await import(
    "@/lib/builder-core/tree/sitePages"
  )

  const {
    planThemeMutation,
    createThemeSnapshot,
    applyThemeMutation,
    rollbackThemeMutation,
  } = await import(
    "@/lib/orvenix-ai/theme"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const request =
    "Cambia el color principal a #315c57"

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
    "ORVENIX AI — THEME EXECUTE",
  )
  console.log(
    "========================================",
  )

  console.log(
    "SOURCE:",
    before.source,
  )

  /*
   * SNAPSHOT
   */
  const snapshot =
    await createThemeSnapshot(
      siteId,
    )

  /*
   * PLAN
   */
  const plan =
    planThemeMutation({
      theme:
        before.tokens,
      request,
    })

  console.log("")
  console.log(
    "=== PLAN ===",
  )
  console.log(
    "OK:",
    plan.ok,
  )
  console.log(
    "CHANGED:",
    plan.changedTokens,
  )
  console.log(
    "WARNINGS:",
    plan.warnings,
  )

  if (!plan.ok) {
    throw new Error(
      "Theme planner falló.",
    )
  }

  /*
   * EXECUTE
   */
  const applied =
    await applyThemeMutation({
      siteId,
      theme:
        plan.afterTheme,
    })

  console.log("")
  console.log(
    "=== EXECUTE ===",
  )

  console.log(
    "VERIFIED:",
    applied.verified,
  )

  console.log(
    "SOURCE:",
    applied.source,
  )

  const after =
    await getResolvedSiteTheme(
      siteId,
    )

  const afterJson =
    JSON.stringify(
      after.tokens,
    )

  console.log(
    "THEME CHANGED:",
    afterJson !==
      beforeJson,
  )

  if (
    !applied.verified ||
    afterJson ===
      beforeJson
  ) {
    throw new Error(
      "Theme execute falló.",
    )
  }

  /*
   * ROLLBACK
   */
  const rollback =
    await rollbackThemeMutation(
      snapshot,
    )

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
      "Theme rollback falló.",
    )
  }

  console.log("")
  console.log(
    "THEME EXECUTE VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "THEME EXECUTE TEST ERROR:",
    error,
  )

  process.exit(1)
})
