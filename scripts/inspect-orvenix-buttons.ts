export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    getBlockCapability,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const tree =
    await getEditorTreeFromDb(
      "site_1a9dba45c3ad",
      "home",
    )

  const buttons =
    Object.values(
      tree.nodes,
    ).filter(
      (node) =>
        node.type === "ctaButton",
    )

  console.log(
    "========================================",
  )
  console.log(
    "ORVENIX AI — BUTTON INSPECTION",
  )
  console.log(
    "========================================",
  )

  console.log(
    "BUTTONS:",
    buttons.length,
  )

  console.log("")
  console.log(
    "=== REAL BUTTONS ===",
  )

  for (
    const button
    of buttons.slice(0, 5)
  ) {
    console.dir(
      {
        id:
          button.id,
        type:
          button.type,
        props:
          button.props,
      },
      {
        depth: 10,
      },
    )
  }

  console.log("")
  console.log(
    "=== CTA CAPABILITY ===",
  )

  console.dir(
    getBlockCapability(
      "ctaButton",
    ),
    {
      depth: 10,
    },
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
