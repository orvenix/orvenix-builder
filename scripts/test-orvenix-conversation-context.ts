export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    getEditorTreeFromDb,
  } = await import(
    "@/lib/editorPersistence"
  )

  const {
    rememberConversationTurn,
    getConversationContext,
    clearConversationContext,
    resolveContextualTarget,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  clearConversationContext(
    siteId,
    pageSlug,
  )

  const tree =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  /*
   * Elegimos un heading real.
   * Esta prueba no modifica el árbol.
   */
  const heading =
    Object.values(
      tree.nodes,
    ).find(
      (node) =>
        node.type === "heading",
    )

  if (!heading) {
    throw new Error(
      "No existe un heading para la prueba.",
    )
  }

  rememberConversationTurn({
    siteId,
    pageSlug,

    turn: {
      message:
        'Cambia este título',

      scope:
        "local_edit",

      target: {
        kind: "node",
        nodeId:
          heading.id,
        nodeType:
          heading.type,
        pageSlug,
        confidence:
          "high",
      },

      action:
        "executed",

      createdAt:
        new Date().toISOString(),
    },

    successfulTarget: {
      kind: "node",
      nodeId:
        heading.id,
      nodeType:
        heading.type,
      pageSlug,
      confidence:
        "high",
    },
  })

  const context =
    getConversationContext(
      siteId,
      pageSlug,
    )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — CONVERSATION CONTEXT",
  )

  console.log(
    "========================================",
  )

  console.log(
    "TARGET:",
    heading.id,
  )

  console.log(
    "TURNS:",
    context.turns.length,
  )

  const contextual =
    resolveContextualTarget({
      message:
        "Hazlo más corto",

      tree,
      context,
    })

  console.log("")
  console.log(
    "=== CONTEXTUAL ===",
  )

  console.log(
    "RESOLVED:",
    contextual.resolved,
  )

  console.log(
    "SOURCE:",
    contextual.source,
  )

  console.log(
    "CONFIDENCE:",
    contextual.confidence,
  )

  console.log(
    "NODE:",
    contextual.target?.nodeId,
  )

  console.log(
    "SAME TARGET:",
    contextual.target?.nodeId ===
      heading.id,
  )

  const explicit =
    resolveContextualTarget({
      message:
        "Cambia el footer",

      tree,
      context,
    })

  console.log("")
  console.log(
    "=== NON CONTEXTUAL ===",
  )

  console.log(
    "RESOLVED:",
    explicit.resolved,
  )

  console.log(
    "SOURCE:",
    explicit.source,
  )

  if (
    !contextual.resolved ||
    contextual.target?.nodeId !==
      heading.id
  ) {
    throw new Error(
      "No se resolvió correctamente el target conversacional.",
    )
  }

  if (explicit.resolved) {
    throw new Error(
      "El resolver secuestró una solicitud explícita.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA DE CONTEXTO EXITOSA.",
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})