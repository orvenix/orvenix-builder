export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
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

  const request =
    "Publica mi sitio"

  const business = {
    name:
      "Clínica Dental Monterrey",

    industry:
      "clínica dental",

    location:
      "Monterrey",

    objective:
      "Conseguir citas",

    services: [
      {
        name:
          "Odontología general",
      },
      {
        name:
          "Limpieza dental",
      },
      {
        name:
          "Valoración dental",
      },
    ],
  }

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
    "ORVENIX AI — PUBLISH GUARD",
  )

  console.log(
    "========================================",
  )

  /*
   * PREVIEW
   */
  const preview =
    await runOrvenixAgent({
      siteId,
      pageSlug,
      message:
        request,
      mode:
        "preview",
      business,
    })

  const afterPreview =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const previewUnchanged =
    hashEditorTree(
      afterPreview,
    ) === beforeHash

  console.log("")
  console.log("=== PREVIEW ===")
  console.log(
    "SCOPE:",
    preview.scope,
  )
  console.log(
    "ACTION:",
    preview.action,
  )
  console.log(
    "OK:",
    preview.ok,
  )
  console.log(
    "CONFIRMATION:",
    preview.policy?.limits
      .requireConfirmation,
  )
  console.log(
    "SNAPSHOT:",
    Boolean(preview.snapshot),
  )
  console.log(
    "DB UNCHANGED:",
    previewUnchanged,
  )

  if (
    !preview.ok ||
    preview.scope !==
      "publish" ||
    preview.action !==
      "preview" ||
    !preview.policy?.allowed ||
    !preview.policy.limits
      .requireConfirmation ||
    !preview.snapshot ||
        !preview.plan ||
    preview.plan.addedNodes !==
      0 ||
    preview.plan.removedNodes !==
      0 ||
    preview.plan.changedNodes !==
      0 ||
    !previewUnchanged
  ) {
    throw new Error(
      "PUBLISH PREVIEW falló.",
    )
  }

  /*
   * EXECUTE SIN CONFIRMACIÓN
   */
  const unconfirmed =
    await runOrvenixAgent({
      siteId,
      pageSlug,
      message:
        request,
      mode:
        "execute",
      business,
    })

  const afterUnconfirmed =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const unconfirmedUnchanged =
    hashEditorTree(
      afterUnconfirmed,
    ) === beforeHash

  console.log("")
  console.log(
    "=== EXECUTE SIN CONFIRMACIÓN ===",
  )
  console.log(
    "SCOPE:",
    unconfirmed.scope,
  )
  console.log(
    "ACTION:",
    unconfirmed.action,
  )
  console.log(
    "OK:",
    unconfirmed.ok,
  )
  console.log(
    "SNAPSHOT:",
    Boolean(
      unconfirmed.snapshot,
    ),
  )
  console.log(
    "DB UNCHANGED:",
    unconfirmedUnchanged,
  )

  if (
    !unconfirmed.ok ||
    unconfirmed.scope !==
      "publish" ||
    unconfirmed.action !==
      "confirmation_required" ||
    !unconfirmed.policy?.limits
      .requireConfirmation ||
    !unconfirmed.snapshot ||
    !unconfirmedUnchanged
  ) {
    throw new Error(
      "El guard de publicación sin confirmación falló.",
    )
  }

    /*
   * EXECUTE CONFIRMADO SIN ACTOR AUTENTICADO
   */
  const confirmedWithoutActor =
    await runOrvenixAgent({
      siteId,
      pageSlug,
      message:
        request,
      mode:
        "execute",
      confirmed:
        true,
      business,
    })

  const afterConfirmed =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const confirmedUnchanged =
    hashEditorTree(
      afterConfirmed,
    ) === beforeHash

  console.log("")
  console.log(
    "=== EXECUTE CONFIRMADO SIN ACTOR ===",
  )
  console.log(
    "SCOPE:",
    confirmedWithoutActor.scope,
  )
  console.log(
    "ACTION:",
    confirmedWithoutActor.action,
  )
  console.log(
    "OK:",
    confirmedWithoutActor.ok,
  )
  console.log(
    "DB UNCHANGED:",
    confirmedUnchanged,
  )

  if (
    confirmedWithoutActor.ok ||
    confirmedWithoutActor.scope !==
      "publish" ||
    confirmedWithoutActor.action !==
      "blocked" ||
    !confirmedUnchanged
  ) {
    throw new Error(
      "Publish permitió ejecutar sin actor autenticado.",
    )
  }

    /*
   * EXECUTE CON CAPACIDAD AUTENTICADA SIMULADA
   *
   * No publica realmente. Comprueba que el agente
   * solo delega después de confirmed=true.
   */
  let capabilityCalls =
    0

  const simulatedExecution =
    await runOrvenixAgent(
      {
        siteId,
        pageSlug,
        message:
          request,
        mode:
          "execute",
        confirmed:
          true,
        business,
      },

      {
        publishSite:
          async (params) => {
            capabilityCalls +=
              1

            if (
              params.siteId !==
              siteId
            ) {
              throw new Error(
                "La capacidad recibió otro sitio.",
              )
            }

            return {
              url:
                `/p/${siteId}`,

              publicationMode:
                "static-artifact",

              pageCount:
                1,
            }
          },
      },
    )

  const afterSimulatedExecution =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const simulatedUnchanged =
    hashEditorTree(
      afterSimulatedExecution,
    ) === beforeHash

  console.log("")
  console.log(
    "=== EXECUTE CON CAPACIDAD SIMULADA ===",
  )
  console.log(
    "SCOPE:",
    simulatedExecution.scope,
  )
  console.log(
    "ACTION:",
    simulatedExecution.action,
  )
  console.log(
    "OK:",
    simulatedExecution.ok,
  )
  console.log(
    "CAPABILITY CALLS:",
    capabilityCalls,
  )
  console.log(
    "PUBLICATION:",
    simulatedExecution.publication,
  )
  console.log(
    "DB TREE UNCHANGED:",
    simulatedUnchanged,
  )

  if (
    !simulatedExecution.ok ||
    simulatedExecution.scope !==
      "publish" ||
    simulatedExecution.action !==
      "executed" ||
    capabilityCalls !==
      1 ||
    simulatedExecution.publication
      ?.url !==
      `/p/${siteId}` ||
    simulatedExecution.publication
      ?.publicationMode !==
      "static-artifact" ||
    simulatedExecution.publication
      ?.pageCount !==
      1 ||
    !simulatedUnchanged
  ) {
    throw new Error(
      "La capacidad autenticada simulada falló.",
    )
  }

  console.log("")
  console.log(
    "PUBLISH GUARD VALIDADO.",
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("")
    console.error(
      "PUBLISH GUARD TEST ERROR:",
      error,
    )

    process.exit(1)
  })
