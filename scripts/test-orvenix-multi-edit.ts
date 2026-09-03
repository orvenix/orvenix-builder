export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    detectMutationScope,
    planMultiMutation,
    createDryRunMutationPlan,
    evaluateMutationPolicy,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  const request =
  "Pon todos los botones en tamaño grande"

  const scope =
    detectMutationScope(
      request,
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — MULTI EDIT",
  )

  console.log(
    "========================================",
  )

  console.log(
    "SCOPE:",
    scope,
  )

  if (
    scope !==
    "multi_edit"
  ) {
    throw new Error(
      `Scope incorrecto: ${scope}`,
    )
  }

  const before =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const multi =
    planMultiMutation({
      tree:
        before,

      request,
    })

  console.log(
    "OK:",
    multi.ok,
  )

  console.log(
    "MATCHED:",
    multi.matchedNodeIds.length,
  )

  console.log(
    "CHANGED:",
    multi.changes.length,
  )

  console.log(
    "WARNINGS:",
    multi.warnings,
  )

  if (!multi.ok) {
    throw new Error(
      "Multi Mutation Planner falló.",
    )
  }

  const plan =
    createDryRunMutationPlan({
      siteId,
      before,
      after:
        multi.tree,
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

  const policy =
    evaluateMutationPolicy({
      request,
      scopeOverride:
        "multi_edit",
      plan,
    })

  console.log("")
  console.log(
    "POLICY:",
    policy.allowed,
  )

  console.log(
    "VIOLATIONS:",
    policy.violations,
  )

  if (
    plan.addedNodes !== 0 ||
    plan.removedNodes !== 0
  ) {
    throw new Error(
      "MULTI EDIT alteró la estructura.",
    )
  }

  if (
    plan.changedNodes < 1
  ) {
    throw new Error(
      "MULTI EDIT no modificó nodos.",
    )
  }

  if (
    plan.changedNodes !==
    multi.changes.length
  ) {
    throw new Error(
      "El delta no coincide con los cambios del planner.",
    )
  }

  if (!policy.allowed) {
    throw new Error(
      "Policy rechazó MULTI EDIT.",
    )
  }

  console.log("")
  console.log(
    "MULTI EDIT VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "MULTI EDIT TEST ERROR:",
    error,
  )

  process.exit(1)
})
