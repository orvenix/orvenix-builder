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

  const tree =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  /*
   * Usamos gallery-section porque ya
   * sabemos que existe en este árbol.
   */
  const targetSectionId =
    "gallery-section"

  console.log(
    "========================================",
  )
  console.log(
    "ORVENIX AI — MOVE / DUPLICATE PLANNER",
  )
  console.log(
    "========================================",
  )

  /*
   * MOVE
   */
  const moveRequest =
    "Muévela antes de FAQ"

  const move =
    planSectionMutation({
      tree,
      request:
        moveRequest,

      targetSectionId,
    })

  console.log("")
  console.log("=== MOVE ===")
  console.log("OK:", move.ok)
  console.log(
    "TARGET:",
    move.rootSectionId,
  )
  console.log(
    "WARNINGS:",
    move.warnings,
  )

  if (!move.ok) {
    throw new Error(
      "MOVE planner falló.",
    )
  }

  const movePlan =
    createDryRunMutationPlan({
      siteId,
      before: tree,
      after: move.tree,
    })

  const movePolicy =
    evaluateMutationPolicy({
      request:
        moveRequest,

      scopeOverride:
        "section_edit",

      plan:
        movePlan,

      targetSectionId:
        move.rootSectionId,
    })

  console.log(
    "CHANGES:",
    {
      added:
        movePlan.addedNodes,
      removed:
        movePlan.removedNodes,
      changed:
        movePlan.changedNodes,
    },
  )

  console.log(
    "SAFETY:",
    movePlan.safetyScore,
  )

  console.log(
    "POLICY:",
    movePolicy.allowed,
  )

  /*
   * DUPLICATE
   */
  const duplicateRequest =
    "Duplícala"

  const duplicate =
    planSectionMutation({
      tree,
      request:
        duplicateRequest,

      targetSectionId,
    })

  console.log("")
  console.log(
    "=== DUPLICATE ===",
  )

  console.log(
    "OK:",
    duplicate.ok,
  )

  console.log(
    "NEW SECTION:",
    duplicate.rootSectionId,
  )

  console.log(
    "WARNINGS:",
    duplicate.warnings,
  )

  if (!duplicate.ok) {
    throw new Error(
      "DUPLICATE planner falló.",
    )
  }

  const duplicatePlan =
    createDryRunMutationPlan({
      siteId,
      before:
        tree,
      after:
        duplicate.tree,
    })

  const duplicatePolicy =
    evaluateMutationPolicy({
      request:
        duplicateRequest,

      scopeOverride:
        "section_edit",

      plan:
        duplicatePlan,

      targetSectionId:
        targetSectionId,
    })

  console.log(
    "CHANGES:",
    {
      added:
        duplicatePlan.addedNodes,
      removed:
        duplicatePlan.removedNodes,
      changed:
        duplicatePlan.changedNodes,
    },
  )

  console.log(
    "SAFETY:",
    duplicatePlan.safetyScore,
  )

  console.log(
    "POLICY:",
    duplicatePolicy.allowed,
  )

  if (
    movePlan.addedNodes !== 0 ||
    movePlan.removedNodes !== 0
  ) {
    throw new Error(
      "MOVE creó o eliminó nodos.",
    )
  }

  if (
    duplicatePlan.addedNodes <= 0 ||
    duplicatePlan.removedNodes !== 0
  ) {
    throw new Error(
      "DUPLICATE produjo un delta incorrecto.",
    )
  }

  if (
    !movePolicy.allowed ||
    !duplicatePolicy.allowed
  ) {
    throw new Error(
      "Policy rechazó una operación estructural válida.",
    )
  }

  console.log("")
  console.log(
    "MOVE / DUPLICATE VALIDADOS.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "MOVE/DUPLICATE TEST ERROR:",
    error,
  )

  process.exit(1)
})
