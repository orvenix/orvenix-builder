export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runOrvenixAgent,
  } = await import("@/lib/orvenix-ai")

  const siteId =
    "site_1a9dba45c3ad"

  const tests = [
    {
      message:
        "Analiza mi sitio y dime qué mejorarías",

      mode:
        "analyze" as const,
    },

    {
  message:
    'Cambia el título del hero a "Tu sonrisa merece atención profesional"',

  mode:
    "preview" as const,
},

{
  message:
    "Agrega un FAQ después de servicios",

  mode:
    "preview" as const,
},

    {
      message:
        "Transforma todo el sitio en una clínica dental profesional",

      mode:
        "preview" as const,

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
    },
  ]

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — AGENT",
  )

  console.log(
    "========================================",
  )

  for (const test of tests) {
    console.log("")
    console.log(
      "----------------------------------------",
    )

    console.log(
      test.message,
    )

    const result =
      await runOrvenixAgent({
        siteId,

        message:
          test.message,

        mode:
          test.mode,

        business:
          test.business,
      })

    console.log(
      "SCOPE:",
      result.scope,
    )

    console.log(
      "ACTION:",
      result.action,
    )

    console.log(
      "OK:",
      result.ok,
    )

    console.log(
      "MESSAGE:",
      result.message,
    )

    if (result.plan) {
      console.log(
        "CHANGES:",
        {
          added:
            result.plan.addedNodes,

          removed:
            result.plan.removedNodes,

          changed:
            result.plan.changedNodes,
        },
      )
    }

    if (result.warnings.length) {
      console.log(
        "WARNINGS:",
      )

      for (
        const warning
        of result.warnings
      ) {
        console.log(
          `  - ${warning}`,
        )
      }
    }
  }
}

main().catch((error) => {
  console.error("")
  console.error(
    "ORVENIX AI AGENT TEST ERROR:",
    error,
  )

  process.exit(1)
})

