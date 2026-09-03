import {
  runAutonomousSiteBuilder,
  validateEditorTreeSafety,
} from "@/lib/orvenix-ai"

async function main() {
  const result =
    await runAutonomousSiteBuilder({
      request:
        "Hazme un sitio para una clínica dental en Monterrey",

      business: {
        name:
          "Clínica Dental Monterrey",

        industry:
          "clínica dental",

        location:
          "Monterrey",

        description:
          "Atención dental profesional con un proceso claro, cercano y personalizado.",

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

  const safety =
    validateEditorTreeSafety(
      result.tree,
    )

  console.log(
    "================================",
  )

  console.log(
    "ORVENIX AI — SAFETY VALIDATOR",
  )

  console.log(
    "================================",
  )

  console.log(
    "SAFE:",
    safety.safe,
  )

  console.log(
    "SCORE:",
    safety.score,
  )

  console.log(
    "ISSUES:",
    safety.issues.length,
  )

  for (
    const issue
    of safety.issues
  ) {
    console.log(
      `${issue.level.toUpperCase()} | ${issue.code} | ${issue.nodeId ?? "-"} | ${issue.message}`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
