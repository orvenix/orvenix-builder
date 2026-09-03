export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    rollbackMutation,
    clearConversationContext,
    getConversationContext,
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

  clearConversationContext(
    siteId,
    pageSlug,
  )

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
    "ORVENIX AI — SECTION CONVERSATION",
  )

  console.log(
    "========================================",
  )

  let addSnapshot:
    | Awaited<
        ReturnType<
          typeof runOrvenixAgent
        >
      >["snapshot"]
    | undefined

  try {
    /*
     * TURNO 1 — ADD
     */
    const add =
      await runOrvenixAgent({
        siteId,
        pageSlug,

        message:
          "Agrega un FAQ",

        mode:
          "execute",
      })

    console.log("")
    console.log(
      "=== TURNO 1 — ADD ===",
    )

    console.log(
      "SCOPE:",
      add.scope,
    )

    console.log(
      "ACTION:",
      add.action,
    )

    console.log(
      "OK:",
      add.ok,
    )

    console.log(
      "CHANGES:",
      add.plan
        ? {
            added:
              add.plan.addedNodes,

            removed:
              add.plan.removedNodes,

            changed:
              add.plan.changedNodes,
          }
        : null,
    )

    if (
      !add.ok ||
      add.action !==
        "executed" ||
      !add.snapshot
    ) {
      throw new Error(
        "ADD de sección no pudo ejecutarse.",
      )
    }

    addSnapshot =
      add.snapshot

    const context1 =
      getConversationContext(
        siteId,
        pageSlug,
      )

    const rememberedSection =
      context1
        .lastSuccessfulTarget
        ?.sectionId

    console.log(
      "REMEMBERED SECTION:",
      rememberedSection,
    )

    if (!rememberedSection) {
      throw new Error(
        "ADD no guardó la sección en contexto.",
      )
    }

    /*
     * TURNO 2 — MOVE CONTEXTUAL
     */
    const move =
      await runOrvenixAgent({
        siteId,
        pageSlug,

        message:
          "Ahora muévela antes de testimonios",

        mode:
          "preview",
      })

    console.log("")
    console.log(
      "=== TURNO 2 — MOVE ===",
    )

    console.log(
      "SCOPE:",
      move.scope,
    )

    console.log(
      "ACTION:",
      move.action,
    )

    console.log(
      "OK:",
      move.ok,
    )

    console.log(
      "CHANGES:",
      move.plan
        ? {
            added:
              move.plan.addedNodes,

            removed:
              move.plan.removedNodes,

            changed:
              move.plan.changedNodes,
          }
        : null,
    )

    if (
      !move.ok ||
      move.scope !==
        "section_edit" ||
      move.action !==
        "preview" ||
      move.plan?.addedNodes !==
        0 ||
      move.plan?.removedNodes !==
        0 ||
      move.plan?.changedNodes !==
        1
    ) {
      throw new Error(
        "MOVE contextual falló.",
      )
    }

    /*
     * TURNO 3 — DUPLICATE CONTEXTUAL
     */
    const duplicate =
      await runOrvenixAgent({
        siteId,
        pageSlug,

        message:
          "Ahora duplícala",

        mode:
          "preview",
      })

    console.log("")
    console.log(
      "=== TURNO 3 — DUPLICATE ===",
    )

    console.log(
      "SCOPE:",
      duplicate.scope,
    )

    console.log(
      "ACTION:",
      duplicate.action,
    )

    console.log(
      "OK:",
      duplicate.ok,
    )

    console.log(
      "CHANGES:",
      duplicate.plan
        ? {
            added:
              duplicate.plan.addedNodes,

            removed:
              duplicate.plan.removedNodes,

            changed:
              duplicate.plan.changedNodes,
          }
        : null,
    )

    if (
      !duplicate.ok ||
      duplicate.scope !==
        "section_edit" ||
      duplicate.action !==
        "preview" ||
      !duplicate.plan ||
      duplicate.plan.addedNodes <=
        0 ||
      duplicate.plan.removedNodes !==
        0
    ) {
      throw new Error(
        "DUPLICATE contextual falló.",
      )
    }

    /*
 * TURNO 4 — REORDER CONTEXTUAL
 */
const reorder =
  await runOrvenixAgent({
    siteId,
    pageSlug,

    message:
  "Ahora muévela al principio",

    mode:
      "preview",
  })

console.log("")
console.log(
  "=== TURNO 4 — REORDER ===",
)

console.log(
  "SCOPE:",
  reorder.scope,
)

console.log(
  "ACTION:",
  reorder.action,
)

console.log(
  "OK:",
  reorder.ok,
)

console.log(
  "MESSAGE:",
  reorder.message,
)

console.log(
  "WARNINGS:",
  reorder.warnings,
)

console.log(
  "POLICY:",
  reorder.policy,
)

console.log(
  "CHANGES:",
  reorder.plan
    ? {
        added:
          reorder.plan.addedNodes,

        removed:
          reorder.plan.removedNodes,

        changed:
          reorder.plan.changedNodes,
      }
    : null,
)

if (
  !reorder.ok ||
  reorder.scope !==
    "section_edit" ||
  reorder.action !==
    "preview" ||
  reorder.plan?.addedNodes !==
    0 ||
  reorder.plan?.removedNodes !==
    0 ||
  reorder.plan?.changedNodes !==
    1
) {
  throw new Error(
    "REORDER contextual falló.",
  )
}

    console.log("")
    console.log(
      "CONVERSACION DE SECCIONES VALIDADA.",
    )
  } finally {
    if (addSnapshot) {
      console.log("")
      console.log(
        "=== ROLLBACK ===",
      )

      const rollback =
        await rollbackMutation({
          snapshot:
            addSnapshot,

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

      clearConversationContext(
        siteId,
        pageSlug,
      )

      if (
        restoredHash !==
        beforeHash
      ) {
        throw new Error(
          "Rollback no restauró exactamente el sitio.",
        )
      }
    }
  }
}

main().catch((error) => {
  console.error("")
  console.error(
    "SECTION CONVERSATION TEST ERROR:",
    error,
  )

  process.exit(1)
})
