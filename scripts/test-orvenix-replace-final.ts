export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    rollbackMutation,
    hashEditorTree,
    discoverRootSection,
  } = await import("@/lib/orvenix-ai")

  const {
    getEditorTreeFromDb,
  } = await import("@/lib/editorPersistence")

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  const before =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const beforeHash =
    hashEditorTree(before)

  const beforeNodes =
    Object.keys(
      before.nodes,
    ).length

  const discovery =
    discoverRootSection(
      before,
      "faq",
    )

  if (
    !discovery.node ||
    discovery.confidence !== "high"
  ) {
    throw new Error(
      `FAQ no tiene discovery seguro: ${discovery.confidence}`,
    )
  }

  const oldSectionId =
    discovery.node.id

  const rootBefore =
    before.nodes[
      before.rootId
    ]

  const oldIndex =
    rootBefore.children.indexOf(
      oldSectionId,
    )

  if (oldIndex < 0) {
    throw new Error(
      "FAQ no pertenece directamente al root.",
    )
  }

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — FINAL REPLACE TEST",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "BEFORE NODES:",
    beforeNodes,
  )

  console.log(
    "BEFORE HASH:",
    beforeHash,
  )

  console.log(
    "OLD SECTION:",
    oldSectionId,
  )

  console.log(
    "OLD INDEX:",
    oldIndex,
  )

  let snapshot:
    | Awaited<
        ReturnType<
          typeof runOrvenixAgent
        >
      >["snapshot"]
    | undefined

  let testError:
    unknown = null

  try {
    const result =
      await runOrvenixAgent({
        siteId,
        pageSlug,

        message:
          "Rehaz FAQ",

        mode:
          "execute",
      })

    console.log("")
    console.log(
      "=== EXECUTE ===",
    )

    console.log(
      "SCOPE:",
      result.scope,
    )

    console.log(
      "ACTION:",
      result.action,
    )

    console.log(
      "OK:",
      result.ok,
    )

    console.log(
      "MESSAGE:",
      result.message,
    )

    if (result.plan) {
      console.log(
        "CHANGES:",
        {
          added:
            result.plan.addedNodes,

          removed:
            result.plan.removedNodes,

          changed:
            result.plan.changedNodes,
        },
      )
    }

    if (
      !result.ok ||
      result.action !== "executed"
    ) {
      throw new Error(
        "REPLACE no pudo ejecutarse.",
      )
    }

    if (!result.snapshot) {
      throw new Error(
        "REPLACE no devolvió snapshot.",
      )
    }

    snapshot =
      result.snapshot

    const after =
      await getEditorTreeFromDb(
        siteId,
        pageSlug,
      )

    const afterHash =
      hashEditorTree(after)

    const rootAfter =
      after.nodes[
        after.rootId
      ]

    const newSectionId =
      rootAfter.children[
        oldIndex
      ]

    const newSection =
      newSectionId
        ? after.nodes[
            newSectionId
          ]
        : undefined

    console.log("")
    console.log(
      "=== AFTER REPLACE ===",
    )

    console.log(
      "NODES:",
      Object.keys(
        after.nodes,
      ).length,
    )

    console.log(
      "HASH:",
      afterHash,
    )

    console.log(
      "TREE CHANGED:",
      afterHash !== beforeHash,
    )

    console.log(
      "OLD SECTION EXISTS:",
      Boolean(
        after.nodes[
          oldSectionId
        ],
      ),
    )

    console.log(
      "NEW SECTION:",
      newSectionId,
    )

    console.log(
      "NEW TYPE:",
      newSection?.type,
    )

    console.log(
      "POSITION PRESERVED:",
      Boolean(
        newSection &&
        newSectionId !==
          oldSectionId,
      ),
    )

    if (
      after.nodes[
        oldSectionId
      ]
    ) {
      throw new Error(
        "La sección antigua sigue presente.",
      )
    }

    if (!newSection) {
      throw new Error(
        "No existe sección nueva en el índice original.",
      )
    }

    if (
      newSectionId ===
      oldSectionId
    ) {
      throw new Error(
        "La sección no fue realmente reemplazada.",
      )
    }

    if (
      newSection.type !==
      "section"
    ) {
      throw new Error(
        "El reemplazo no produjo una sección válida.",
      )
    }

    console.log("")
    console.log(
      "REPLACE VERIFIED: true",
    )
  } catch (error) {
    testError = error
  } finally {
    /*
     * El rollback siempre se intenta,
     * aunque falle una aserción.
     */
    if (snapshot) {
      console.log("")
      console.log(
        "=== ROLLBACK ===",
      )

      const rollback =
        await rollbackMutation({
          snapshot,
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
        "RESTORED NODES:",
        Object.keys(
          restored.nodes,
        ).length,
      )

      console.log(
        "RESTORED HASH:",
        restoredHash,
      )

      console.log(
        "EXACT RESTORE:",
        restoredHash ===
          beforeHash,
      )

      if (
        restoredHash !==
        beforeHash
      ) {
        throw new Error(
          "Rollback final no restauró exactamente el árbol.",
        )
      }
    }
  }

  if (testError) {
    throw testError
  }

  console.log("")
  console.log(
    "PRUEBA REPLACE FINAL EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "FINAL REPLACE TEST ERROR:",
    error,
  )

  process.exit(1)
})
