export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    findRootSection,
    discoverRootSection,
    collectSectionSubtreeIds,
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

  const tree =
    await getEditorTreeFromDb(
      siteId,
      "home",
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — SECTION DISCOVERY",
  )

  console.log(
    "========================================",
  )

  const searches = [
    "servicios",
    "testimonios",
    "galeria",
    "faq",
    "contacto",
    "proceso",
  ]

  for (
    const keyword
    of searches
  ) {

    const discovery =
  discoverRootSection(
    tree,
    keyword,
  )

console.log("")
console.log(
  keyword.toUpperCase(),
)

console.log(
  "FOUND:",
  Boolean(discovery.node),
)

console.log(
  "SCORE:",
  discovery.score,
)

console.log(
  "CONFIDENCE:",
  discovery.confidence,
)

if (!discovery.node) {
  console.log(
    "EVIDENCE:",
    discovery.evidence,
  )

  continue
}

console.log(
  "ID:",
  discovery.node.id,
)

console.log(
  "TYPE:",
  discovery.node.type,
)

console.log(
  "NAME:",
  discovery.node.displayName,
)

console.log(
  "SUBTREE NODES:",
  collectSectionSubtreeIds(
    tree,
    discovery.node.id,
  ).length,
)

console.log(
  "EVIDENCE:",
  discovery.evidence.slice(0, 8),
)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
