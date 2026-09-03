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
    "Transforma todo el sitio en una clínica dental profesional"

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
    "ORVENIX AI — REDESIGN CONFIRMATION",
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
      "site_redesign" ||
    preview.action !==
      "preview" ||
    !preview.policy?.allowed ||
    !preview.policy.limits
      .requireConfirmation ||
    !preview.snapshot ||
    !previewUnchanged
  ) {
    throw new Error(
      "REDESIGN PREVIEW falló.",
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
      "site_redesign" ||
    unconfirmed.action !==
      "confirmation_required" ||
    !unconfirmed.policy?.limits
      .requireConfirmation ||
    !unconfirmed.snapshot ||
    !unconfirmedUnchanged
  ) {
    throw new Error(
      "La confirmación de rediseño falló.",
    )
  }

  console.log("")
  console.log(
    "REDESIGN CONFIRMATION VALIDADO.",
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("")
    console.error(
      "REDESIGN CONFIRMATION TEST ERROR:",
      error,
    )

    process.exit(1)
  })
