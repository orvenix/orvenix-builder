export {}
async function main() {
  /*
   * Fundamental:
   * cargar producción antes de importar
   * editorPersistence/editor-db.
   */
  process.loadEnvFile(".env")

  const {
    createRealSiteDryRun,
  } = await import("@/lib/orvenix-ai")

  const siteId =
    "site_1a9dba45c3ad"

  const plan =
    await createRealSiteDryRun({
      siteId,

      pageSlug: "home",

      request:
        "Transforma este sitio en una clínica dental profesional en Monterrey orientada a conseguir citas",

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
    "========================================",
  )

  console.log(
    "ORVENIX AI — REAL SITE DRY RUN",
  )

  console.log(
    "========================================",
  )

  console.log("SITE:", plan.siteId)
  console.log("SAFE:", plan.safe)

  console.log(
    "SAFETY SCORE:",
    plan.safetyScore,
  )

  console.log(
    "READY TO APPLY:",
    plan.readyToApply,
  )

  console.log("")
  console.log("=== ARBOL REAL ACTUAL ===")

  console.log(
    "NODOS:",
    Object.keys(plan.before.nodes).length,
  )

  console.log(
    "ROOT:",
    plan.before.rootId,
  )

  console.log("")
  console.log("=== PROPUESTA ORVENIX AI ===")

  console.log(
    "NODOS:",
    Object.keys(plan.after.nodes).length,
  )

  console.log(
    "ROOT:",
    plan.after.rootId,
  )

  console.log("")
  console.log("=== MUTACION PROPUESTA ===")

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
  console.log("=== SNAPSHOT EN MEMORIA ===")

  console.log(
    "ID:",
    plan.snapshot.id,
  )

  console.log(
    "NODOS:",
    Object.keys(
      plan.snapshot.tree.nodes,
    ).length,
  )

  console.log("")
  console.log("=== WARNINGS ===")

  if (!plan.warnings.length) {
    console.log("NINGUNO")
  } else {
    for (const warning of plan.warnings) {
      console.log(`- ${warning}`)
    }
  }

  console.log("")
  console.log(
    "IMPORTANTE: DRY RUN. NO SE GUARDO NADA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "REAL SITE DRY RUN ERROR:",
    error,
  )

  process.exit(1)
})
