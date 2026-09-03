import {
  runAutonomousSiteBuilder,
} from "@/lib/orvenix-ai"

async function main() {
  const result =
    await runAutonomousSiteBuilder({
      request:
        "Hazme un sitio profesional para una clínica dental en Monterrey que consiga citas",

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
          "Conseguir citas y generar confianza",

        services: [
          {
            name:
              "Odontología general",

            description:
              "Evaluación, prevención y atención para mantener una sonrisa saludable.",
          },

          {
            name:
              "Limpieza dental",

            description:
              "Cuidado preventivo para mantener dientes y encías en mejores condiciones.",
          },

          {
            name:
              "Valoración dental",

            description:
              "Revisión inicial para conocer tus necesidades y definir los siguientes pasos.",
          },
        ],
      },

      minimumQuality: 70,
    })

  console.log(
    "====================================",
  )

  console.log(
    "ORVENIX AI — AUTONOMOUS BUILDER",
  )

  console.log(
    "====================================",
  )

  console.log("")
  console.log("OK:", result.ok)

  console.log(
    "TIPO:",
    result.architecture.siteType,
  )

  console.log(
    "TEMPLATE:",
    result.selectedTemplate
      ?.template.name ??
      "COMPOSICIÓN AUTÓNOMA",
  )

  console.log(
    "CONFIDENCE:",
    result.selectedTemplate
      ?.confidence ??
      "N/A",
  )

  console.log(
    "NODOS:",
    Object.keys(
      result.tree.nodes,
    ).length,
  )

  console.log(
    "QUALITY:",
    result.quality.score,
  )

  console.log(
    "REPAIRED:",
    result.repaired,
  )

  console.log("")
  console.log("=== TRACE ===")

  for (const step of result.trace) {
    console.log(`✓ ${step}`)
  }

  console.log("")
  console.log("=== WARNINGS ===")

  if (!result.warnings.length) {
    console.log("NINGUNA")
  } else {
    for (
      const warning
      of result.warnings
    ) {
      console.log(
        `- ${warning}`,
      )
    }
  }

  console.log("")
  console.log(
    "=== ROOT SECTIONS ===",
  )

  const root =
    result.tree.nodes[
      result.tree.rootId
    ]

  for (
    const childId
    of root?.children ?? []
  ) {
    const node =
      result.tree.nodes[
        childId
      ]

    if (!node) continue

    console.log(
      `${node.type.padEnd(18)} ${node.displayName ?? ""}`,
    )
  }
}

main().catch((error) => {
  console.error("")
  console.error(
    "ORVENIX AI TEST ERROR:",
    error,
  )

  process.exit(1)
})
