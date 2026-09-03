export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    discoverRootSection,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const tree =
    await getEditorTreeFromDb(
      "site_1a9dba45c3ad",
      "home",
    )

  for (
    const role
    of [
      "testimonios",
      "servicios",
      "galeria",
      "faq",
    ]
  ) {
    const result =
      discoverRootSection(
        tree,
        role,
      )

    console.log("")
    console.log(
      role.toUpperCase(),
    )

    console.log({
      id:
        result.node?.id,
      score:
        result.score,
      confidence:
        result.confidence,
      evidence:
        result.evidence,
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
