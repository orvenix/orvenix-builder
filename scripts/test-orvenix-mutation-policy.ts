export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    createRealSiteDryRun,
    evaluateMutationPolicy,
  } = await import("@/lib/orvenix-ai")

  const siteId =
    "site_1a9dba45c3ad"

  const plan =
    await createRealSiteDryRun({
      siteId,
      pageSlug: "home",

      request:
        "Transforma completamente este sitio en una clínica dental profesional en Monterrey",

      business: {
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
      },
    })

  const tests = [
    {
      request:
        "Analiza mi sitio",
    },

    {
      request:
        "Cambia el título del hero",
      targetNodeId:
        "fake-target-for-policy-test",
    },

    {
      request:
        "Rehaz esta sección de servicios",
      targetSectionId:
        "fake-section-for-policy-test",
    },

    {
      request:
        "Rediseña esta página completamente",
    },

    {
      request:
        "Transforma todo el sitio en una clínica dental",
    },
  ]

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — MUTATION POLICY",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "PLAN:",
    {
      added:
        plan.addedNodes,
      removed:
        plan.removedNodes,
      changed:
        plan.changedNodes,
    },
  )

  for (
    const test
    of tests
  ) {
    const decision =
      evaluateMutationPolicy({
        request:
          test.request,

        plan,

        targetNodeId:
          test.targetNodeId,

        targetSectionId:
          test.targetSectionId,
      })

    console.log("")
    console.log(
      "--------------------------------",
    )

    console.log(
      test.request,
    )

    console.log(
      "SCOPE:",
      decision.scope,
    )

    console.log(
      "ALLOWED:",
      decision.allowed,
    )

    console.log(
      "CONFIRMATION:",
      decision.limits
        .requireConfirmation,
    )

    if (
      decision.violations.length
    ) {
      console.log(
        "VIOLATIONS:",
      )

      for (
        const violation
        of decision.violations
      ) {
        console.log(
          `  - ${violation}`,
        )
      }
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
