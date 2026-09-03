export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    createRealSiteDryRun,
    evaluateMutationPolicy,
  } = await import(
    "@/lib/orvenix-ai"
  )

  const plan =
    await createRealSiteDryRun({
      siteId:
        "site_1a9dba45c3ad",

      pageSlug:
        "home",

      request:
        "Rediseña esta página completamente",

      business: {
        name:
          "Clínica Dental Monterrey",

        industry:
          "clínica dental",

        objective:
          "Conseguir citas",
      },
    })

  const atLimit =
    evaluateMutationPolicy({
      request:
        "Rediseña esta página completamente",

      scopeOverride:
        "page_redesign",

      plan: {
        ...plan,

        addedNodes:
          1000,

        removedNodes:
          1000,

        changedNodes:
          1000,
      },
    })

  const overLimit =
    evaluateMutationPolicy({
      request:
        "Rediseña esta página completamente",

      scopeOverride:
        "page_redesign",

      plan: {
        ...plan,

        addedNodes:
          1001,

        removedNodes:
          1001,

        changedNodes:
          1001,
      },
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — PAGE REDESIGN BOUNDARY",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "AT LIMIT ALLOWED:",
    atLimit.allowed,
  )
  console.log(
    "AT LIMIT CONFIRMATION:",
    atLimit.limits
      .requireConfirmation,
  )

  console.log("")
  console.log(
    "OVER LIMIT ALLOWED:",
    overLimit.allowed,
  )
  console.log(
    "OVER LIMIT VIOLATIONS:",
    overLimit.violations,
  )

  if (
    !atLimit.allowed ||
    !atLimit.limits
      .requireConfirmation
  ) {
    throw new Error(
      "Policy bloqueó incorrectamente el límite permitido.",
    )
  }

  if (
    overLimit.allowed ||
    overLimit.violations.length <
      3
  ) {
    throw new Error(
      "Policy no bloqueó correctamente 1001 nodos.",
    )
  }

  console.log("")
  console.log(
    "PAGE REDESIGN BOUNDARY VALIDADO.",
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("")
    console.error(
      "PAGE REDESIGN BOUNDARY TEST ERROR:",
      error,
    )

    process.exit(1)
  })
