export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    planSectionMutation,
    createDryRunMutationPlan,
    evaluateMutationPolicy,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const before =
    await getEditorTreeFromDb(
      siteId,
      "home",
    )

  const request =
    "Agrega un FAQ después de servicios"

  const section =
    planSectionMutation({
      tree:
        before,

      request,
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION MUTATION PLANNER",
  )

  console.log(
    "========================================",
  )

  console.log(
    "OK:",
    section.ok,
  )

  console.log(
    "ROLE:",
    section.role,
  )

  console.log(
    "SECTION ROOT:",
    section.rootSectionId,
  )

  console.log(
    "ADDED IDS:",
    section.addedNodeIds.length,
  )

  console.log(
    "WARNINGS:",
    section.warnings,
  )

  if (!section.ok) {
    return
  }

  const plan =
    createDryRunMutationPlan({
      siteId,

      before,

      after:
        section.tree,
    })

  console.log("")
  console.log(
    "=== DRY RUN ===",
  )

  console.log(
    "ADDED:",
    plan.addedNodes,
  )

  console.log(
    "REMOVED:",
    plan.removedNodes,
  )

  console.log(
    "CHANGED:",
    plan.changedNodes,
  )

  console.log(
    "SAFETY:",
    plan.safetyScore,
  )

  const policy =
    evaluateMutationPolicy({
      request,

      plan,

      targetSectionId:
        section.rootSectionId,
    })

  console.log("")
  console.log(
    "=== POLICY ===",
  )

  console.log(
    "SCOPE:",
    policy.scope,
  )

  console.log(
    "ALLOWED:",
    policy.allowed,
  )

  console.log(
    "VIOLATIONS:",
    policy.violations,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
