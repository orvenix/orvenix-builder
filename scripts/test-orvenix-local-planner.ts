export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    planLocalMutation,
    createDryRunMutationPlan,
    evaluateMutationPolicy,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const tree =
    await getEditorTreeFromDb(
      siteId,
      "home",
    )

  const request =
    'Cambia el título del hero a "Tu sonrisa merece atención profesional"'

  const local =
    planLocalMutation({
      tree,
      request,
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — LOCAL MUTATION PLANNER",
  )

  console.log(
    "========================================",
  )

  console.log(
    "LOCAL OK:",
    local.ok,
  )

  console.log(
    "TARGET:",
    local.target,
  )

  console.log(
    "CHANGES:",
    local.changes,
  )

  console.log(
    "WARNINGS:",
    local.warnings,
  )

  if (!local.ok) {
    return
  }

  const plan =
    createDryRunMutationPlan({
      siteId,
      before:
        tree,
      after:
        local.tree,
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

      targetNodeId:
        local.target?.nodeId,
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
