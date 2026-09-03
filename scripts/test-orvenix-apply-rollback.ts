export {}
async function main() {
  process.loadEnvFile(".env")

  const {
    createRealSiteDryRun,
    applyMutation,
    rollbackMutation,
    hashEditorTree,
  } = await import("@/lib/orvenix-ai")

  const {
    getEditorTreeFromDb,
  } = await import("@/lib/editorPersistence")

  const siteId =
    "site_1a9dba45c3ad"

  const pageSlug =
    "home"

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — APPLY / VERIFY / ROLLBACK",
  )

  console.log(
    "========================================",
  )

  /*
   * 1. Estado original
   */
  const original =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const originalHash =
    hashEditorTree(original)

  console.log("")
  console.log("=== ORIGINAL ===")
  console.log(
    "NODOS:",
    Object.keys(
      original.nodes,
    ).length,
  )
  console.log(
    "HASH:",
    originalHash,
  )

  /*
   * 2. Dry-run real
   */
  const plan =
    await createRealSiteDryRun({
      siteId,
      pageSlug,

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

  console.log("")
  console.log("=== DRY RUN ===")
  console.log(
    "SAFE:",
    plan.safe,
  )
  console.log(
    "SCORE:",
    plan.safetyScore,
  )
  console.log(
    "READY:",
    plan.readyToApply,
  )
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

  if (
    !plan.safe ||
    !plan.readyToApply
  ) {
    throw new Error(
      "Dry-run no autorizado para apply.",
    )
  }

  /*
   * 3. APPLY
   */
  console.log("")
  console.log("=== APPLY ===")

  const applied =
    await applyMutation({
      plan,
      pageSlug,
    })

  console.log(
    "SAFETY SCORE:",
    applied.safetyScore,
  )

  console.log(
    "EXPECTED HASH:",
    applied.expectedAfterHash,
  )

  console.log(
    "SAVED HASH:",
    applied.savedHash,
  )

  console.log(
    "VERIFIED:",
    applied.verified,
  )

  if (!applied.verified) {
    /*
     * Si algo raro ocurre durante
     * verify, intentamos restaurar.
     */
    console.log("")
    console.log(
      "VERIFY FALLO. EJECUTANDO ROLLBACK...",
    )

    const emergency =
      await rollbackMutation({
        snapshot:
          plan.snapshot,
        pageSlug,
      })

    console.log(
      "ROLLBACK:",
      emergency.verified,
    )

    throw new Error(
      "Apply no pudo verificarse.",
    )
  }

  /*
   * 4. Leer estado aplicado
   */
  const afterApply =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  console.log("")
  console.log(
    "NODOS DESPUES APPLY:",
    Object.keys(
      afterApply.nodes,
    ).length,
  )

  /*
   * 5. ROLLBACK
   */
  console.log("")
  console.log("=== ROLLBACK ===")

  const rollback =
    await rollbackMutation({
      snapshot:
        plan.snapshot,

      pageSlug,
    })

  console.log(
    "SNAPSHOT HASH:",
    rollback.snapshotHash,
  )

  console.log(
    "RESTORED HASH:",
    rollback.restoredHash,
  )

  console.log(
    "VERIFIED:",
    rollback.verified,
  )

  /*
   * 6. Verificación final independiente
   */
  const finalTree =
    await getEditorTreeFromDb(
      siteId,
      pageSlug,
    )

  const finalHash =
    hashEditorTree(
      finalTree,
    )

  console.log("")
  console.log(
    "=== VERIFICACION FINAL ===",
  )

  console.log(
    "ORIGINAL HASH:",
    originalHash,
  )

  console.log(
    "FINAL HASH:",
    finalHash,
  )

  console.log(
    "RESTAURACION EXACTA:",
    originalHash === finalHash,
  )

  if (
    originalHash !== finalHash
  ) {
    throw new Error(
      "El rollback no restauró exactamente el árbol original.",
    )
  }

  console.log("")
  console.log(
    "PRUEBA COMPLETA EXITOSA.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "ORVENIX AI MUTATION TEST ERROR:",
    error,
  )

  process.exit(1)
})
