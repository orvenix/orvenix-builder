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

  const pageSlug =
    "home"

  const before =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const rootBefore =
    before.nodes[
      before.rootId
    ]

  const targetSectionId =
    "gallery-section"

  const previousIndex =
    rootBefore.children.indexOf(
      targetSectionId,
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION REORDER",
  )

  console.log(
    "========================================",
  )

  console.log(
    "PREVIOUS INDEX:",
    previousIndex,
  )

  const section =
    planSectionMutation({
      tree:
        before,

      request:
        "Muévela al final",

      targetSectionId,
    })

  console.log(
    "OK:",
    section.ok,
  )

  console.log(
    "WARNINGS:",
    section.warnings,
  )

  if (!section.ok) {
    throw new Error(
      "REORDER planner falló.",
    )
  }

  const rootAfter =
    section.tree.nodes[
      section.tree.rootId
    ]

  const nextIndex =
    rootAfter.children.indexOf(
      targetSectionId,
    )

  console.log(
    "NEXT INDEX:",
    nextIndex,
  )

  console.log(
    "LAST INDEX:",
    rootAfter.children.length - 1,
  )

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
      request:
        "Muévela al final",

      scopeOverride:
        "section_edit",

      plan,

      targetSectionId,
    })

  console.log("")
  console.log(
    "POLICY:",
    policy.allowed,
  )

  if (
    plan.addedNodes !== 0 ||
    plan.removedNodes !== 0 ||
    plan.changedNodes !== 1
  ) {
    throw new Error(
      "REORDER produjo un delta incorrecto.",
    )
  }

  if (
    nextIndex !==
    rootAfter.children.length - 1
  ) {
    throw new Error(
      "La sección no terminó al final.",
    )
  }

  if (!policy.allowed) {
    throw new Error(
      "Policy rechazó REORDER.",
    )
  }

  console.log("")
  console.log(
    "REORDER VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "REORDER TEST ERROR:",
    error,
  )

  process.exit(1)
})
