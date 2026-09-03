export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const tree =
    await getEditorTreeFromDb(
      "site_1a9dba45c3ad",
      "home",
    )

  const root =
    tree.nodes[tree.rootId]

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — REPLACED SECTION INSPECTION",
  )

  console.log(
    "========================================",
  )

  console.log(
    "NODES:",
    Object.keys(tree.nodes).length,
  )

  console.log(
    "ROOT:",
    tree.rootId,
  )

  console.log(
    "ROOT CHILDREN:",
    root?.children?.length ?? 0,
  )

  console.log("")
  console.log(
    "=== INDICES 14-18 ===",
  )

  for (
    let index = 14;
    index <= 18;
    index++
  ) {
    const id =
      root?.children?.[index]

    const node =
      id
        ? tree.nodes[id]
        : undefined

    console.log({
      index,
      id,
      type:
        node?.type,
      displayName:
        node?.displayName,
      children:
        node?.children?.length ?? 0,
    })
  }

  console.log("")
  console.log(
    "=== INDEX 16 DEEP ===",
  )

  const sectionId =
    root?.children?.[16]

  const section =
    sectionId
      ? tree.nodes[sectionId]
      : undefined

  console.dir(
    section,
    {
      depth: 5,
    },
  )

  if (section) {
    console.log("")
    console.log(
      "=== CHILDREN INDEX 16 ===",
    )

    for (
      const childId
      of section.children ?? []
    ) {
      const child =
        tree.nodes[childId]

      console.log({
        id:
          childId,
        type:
          child?.type,
        displayName:
          child?.displayName,
        props:
          child?.props,
      })
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
