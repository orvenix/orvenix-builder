export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
    clearConversationContext,
    getConversationContext,
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

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — CONVERSATIONAL AGENT",
  )

  console.log(
    "========================================",
  )

  /*
   * TURNO 1:
   * target explícito semánticamente.
   */
  const first =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        'Cambia el título del hero a "Tu negocio merece una presencia extraordinaria"',

      mode:
        "preview",
    })

  console.log("")
  console.log(
    "=== TURNO 1 ===",
  )

  console.log(
    "SCOPE:",
    first.scope,
  )

  console.log(
    "ACTION:",
    first.action,
  )

  console.log(
    "OK:",
    first.ok,
  )

  console.log(
    "CHANGES:",
    first.plan
      ? {
          added:
            first.plan.addedNodes,

          removed:
            first.plan.removedNodes,

          changed:
            first.plan.changedNodes,
        }
      : null,
  )

  console.log(
  "MESSAGE:",
  first.message,
)

console.log(
  "WARNINGS:",
  first.warnings,
)

console.log(
  "POLICY:",
  first.policy,
)

  const contextAfterFirst =
    getConversationContext(
      siteId,
      pageSlug,
    )

  console.log(
    "REMEMBERED NODE:",
    contextAfterFirst
      .lastTarget
      ?.nodeId,
  )

  /*
   * TURNO 2:
   *
   * No repetimos hero ni título.
   * "lo" debe resolver el target anterior.
   */
  const second =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        "Ahora ponlo en color #1D4ED8",

      mode:
        "preview",
    })

  console.log("")
  console.log(
    "=== TURNO 2 ===",
  )

  console.log(
    "SCOPE:",
    second.scope,
  )

  console.log(
    "ACTION:",
    second.action,
  )

  console.log(
    "OK:",
    second.ok,
  )

  console.log(
  "MESSAGE:",
  second.message,
)

console.log(
  "WARNINGS:",
  second.warnings,
)

console.log(
  "POLICY:",
  second.policy,
)

  console.log(
    "CHANGES:",
    second.plan
      ? {
          added:
            second.plan.addedNodes,

          removed:
            second.plan.removedNodes,

          changed:
            second.plan.changedNodes,
        }
      : null,
  )

  const contextAfterSecond =
    getConversationContext(
      siteId,
      pageSlug,
    )

  console.log(
    "TARGET AFTER TURN 2:",
    contextAfterSecond
      .lastTarget
      ?.nodeId,
  )

  console.log(
    "SAME TARGET:",
    contextAfterSecond
      .lastTarget
      ?.nodeId ===
      contextAfterFirst
        .lastTarget
        ?.nodeId,
  )

  /*
   * TURNO 3:
   *
   * Orden explícita diferente.
   * El contexto NO debe apropiársela.
   */
  const third =
    await runOrvenixAgent({
      siteId,
      pageSlug,

      message:
        "Analiza mi sitio",

      mode:
        "analyze",
    })

  console.log("")
  console.log(
    "=== TURNO 3 ===",
  )

  console.log(
    "SCOPE:",
    third.scope,
  )

  console.log(
    "ACTION:",
    third.action,
  )

  console.log(
    "OK:",
    third.ok,
  )

  if (
    first.action !== "preview" ||
    first.plan?.changedNodes !== 1
  ) {
    throw new Error(
      "El primer turno local falló.",
    )
  }

  if (
    second.scope !==
      "local_edit" ||
    second.action !==
      "preview" ||
    second.plan?.changedNodes !==
      1
  ) {
    throw new Error(
      "El follow-up contextual no se resolvió correctamente.",
    )
  }

  if (
    contextAfterSecond
      .lastTarget
      ?.nodeId !==
    contextAfterFirst
      .lastTarget
      ?.nodeId
  ) {
    throw new Error(
      "El target conversacional cambió inesperadamente.",
    )
  }

  if (
    third.scope !==
      "read_only"
  ) {
    throw new Error(
      "El contexto secuestró una orden explícita.",
    )
  }

  console.log("")
  console.log(
    "CONVERSACION VALIDADA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "CONVERSATION AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})
