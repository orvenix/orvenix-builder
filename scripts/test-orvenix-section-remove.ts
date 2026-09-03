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
    discoverRootSection,
    canExecuteDestructiveSectionOperation,
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
    "Quita testimonios"

  const discovery =
    discoverRootSection(
      before,
      "testimonials",
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION REMOVE",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "DISCOVERY:",
    {
      id:
        discovery.node?.id,
      score:
        discovery.score,
      confidence:
        discovery.confidence,
      executable:
        canExecuteDestructiveSectionOperation(
          discovery,
        ),
    },
  )

  const section =
    planSectionMutation({
      tree: before,
      request,
    })

  console.log("")
  console.log(
    "PLANNER OK:",
    section.ok,
  )

  console.log(
    "ROLE:",
    section.role,
  )

  console.log(
    "REMOVED IDS:",
    section.removedNodeIds.length,
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
