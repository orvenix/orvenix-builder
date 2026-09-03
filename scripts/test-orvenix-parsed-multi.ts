export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    applyParsedMultiMutation,
  } = await import(
    "@/lib/orvenix-ai/multi"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const tree =
    await getEditorTreeFromDb(
      siteId,
      "home",
    )

  const result =
    applyParsedMultiMutation({
      tree,

      parsed: {
        target:
          "sections",

        operation:
          "set_border_radius",

        value:
          "lg",
      },
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — PARSED MULTI",
  )

  console.log(
    "========================================",
  )

  console.log(
    "OK:",
    result.ok,
  )

  console.log(
    "MATCHED:",
    result.matchedNodeIds.length,
  )

  console.log(
    "CHANGED:",
    result.changes.length,
  )

  console.log(
    "WARNINGS:",
    result.warnings,
  )

  if (!result.ok) {
    throw new Error(
      "Parsed Multi Mutation falló.",
    )
  }

  console.log("")
  console.log(
    "PARSED MULTI VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "PARSED MULTI TEST ERROR:",
    error,
  )

  process.exit(1)
})
