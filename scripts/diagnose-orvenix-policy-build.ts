export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    runAutonomousSiteBuilder,
  } = await import("@/lib/orvenix-ai")

  const result =
    await runAutonomousSiteBuilder({
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

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — BUILD DIAGNOSTIC",
  )

  console.log(
    "========================================",
  )

  console.log("OK:", result.ok)

  console.log(
    "TIPO:",
    result.architecture.siteType,
  )

  console.log(
    "TEMPLATE:",
    result.selectedTemplate
      ?.template.name ??
      "COMPOSICION AUTONOMA",
  )

  console.log(
    "CONFIDENCE:",
    result.selectedTemplate
      ?.confidence ??
      "N/A",
  )

  console.log(
    "NODOS:",
    Object.keys(result.tree.nodes).length,
  )

  console.log(
    "QUALITY:",
    result.quality.score,
  )

  console.log("")
  console.log("=== WARNINGS ===")

  if (!result.warnings.length) {
    console.log("NINGUNA")
  } else {
    for (const warning of result.warnings) {
      console.log(`- ${warning}`)
    }
  }

  console.log("")
  console.log("=== TRACE ===")

  for (const step of result.trace) {
    console.log(`✓ ${step}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
