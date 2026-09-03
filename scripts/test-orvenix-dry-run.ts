import {
  getEditorTreeForWeb,
} from "@/lib/editorWebs"

import {
  createDryRunMutationPlan,
  runAutonomousSiteBuilder,
} from "@/lib/orvenix-ai"

async function main() {
  /*
   * Simulamos que el sitio actual
   * parte del template clínica original.
   */
  const before =
    getEditorTreeForWeb("clinica")

  /*
   * Orvenix AI genera la versión adaptada.
   */
  const result =
    await runAutonomousSiteBuilder({
      request:
        "Adapta este sitio para Clínica Dental Monterrey y optimízalo para conseguir citas",

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
    })

  const plan =
    createDryRunMutationPlan({
      siteId:
        "diagnostico-clinica",

      before,

      after:
        result.tree,
    })

  console.log(
    "================================",
  )

  console.log(
    "ORVENIX AI — DRY RUN MUTATION",
  )

  console.log(
    "================================",
  )

  console.log(
    "SITE:",
    plan.siteId,
  )

  console.log(
    "SNAPSHOT:",
    plan.snapshot.id,
  )

  console.log(
    "SAFE:",
    plan.safe,
  )

  console.log(
    "SAFETY SCORE:",
    plan.safetyScore,
  )

  console.log(
    "READY TO APPLY:",
    plan.readyToApply,
  )

  console.log("")
  console.log("=== CAMBIOS ===")

  console.log(
    "AGREGADOS:",
    plan.addedNodes,
  )

  console.log(
    "ELIMINADOS:",
    plan.removedNodes,
  )

  console.log(
    "MODIFICADOS:",
    plan.changedNodes,
  )

  console.log("")
  console.log("=== WARNINGS ===")

  if (!plan.warnings.length) {
    console.log("NINGUNO")
  } else {
    for (
      const warning
      of plan.warnings
    ) {
      console.log(
        `- ${warning}`,
      )
    }
  }

  console.log("")
  console.log(
    "=== SNAPSHOT ===",
  )

  console.log(
    "NODOS SNAPSHOT:",
    Object.keys(
      plan.snapshot.tree.nodes,
    ).length,
  )

  console.log(
    "CREATED AT:",
    plan.snapshot.createdAt,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
