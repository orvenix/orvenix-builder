export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    getResolvedSiteTheme,
  } = await import(
    "@/lib/builder-core/tree/sitePages"
  )

  const {
    planDesignMutation,
  } = await import(
    "@/lib/orvenix-ai/design"
  )

  const {
    createDryRunMutationPlan,
  } = await import(
    "@/lib/orvenix-ai/mutation"
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

  const resolvedTheme =
    await getResolvedSiteTheme(
      siteId,
    )

  const result =
    planDesignMutation({
      tree,

      theme:
        resolvedTheme.tokens,

      request:
        "Haz que el sitio se vea más premium",
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — DESIGN MUTATION",
  )

  console.log(
    "========================================",
  )

  console.log(
    "INTENT:",
    result.intent,
  )

  console.log(
    "OK:",
    result.ok,
  )

  console.log(
    "THEME TOKENS:",
    result.changedThemeTokens,
  )

  console.log(
    "MULTI CHANGES:",
    result.multiChanges,
  )

  console.log(
    "WARNINGS:",
    result.warnings,
  )

  if (!result.ok) {
    throw new Error(
      "Design Mutation Planner falló.",
    )
  }

  const plan =
    createDryRunMutationPlan({
      siteId,

      before:
        result.beforeTree,

      after:
        result.afterTree,
    })

  console.log("")
  console.log(
    "=== DRY RUN ===",
  )

  console.log(
    "CHANGES:",
    {
      added:
        plan.addedNodes,

      removed:
        plan.removedNodes,

      changed:
        plan.changedNodes,
    },
  )

  console.log(
    "SAFETY:",
    plan.safetyScore,
  )

  console.log(
    "READY:",
    plan.readyToApply,
  )

  if (
    !plan.safe ||
    !plan.readyToApply
  ) {
    throw new Error(
      "Design dry-run no es seguro.",
    )
  }

  console.log("")
  console.log(
    "DESIGN MUTATION VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "DESIGN MUTATION TEST ERROR:",
    error,
  )

  process.exit(1)
})
