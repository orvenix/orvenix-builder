export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    createRealSiteDryRun,
    hashEditorTree,
  } = await import("@/lib/orvenix-ai")

  const {
    validateTree,
  } = await import("@/types/validateTree")

  const {
    getResolvedSiteTheme,
  } = await import("@/lib/builder-core/tree/sitePages")

  const siteId = "site_1a9dba45c3ad"
  const pageSlug = "home"

  const plan =
    await createRealSiteDryRun({
      siteId,
      pageSlug,

      request:
        "Transforma este sitio en una clínica dental profesional en Monterrey orientada a conseguir citas",

      business: {
        name: "Clínica Dental Monterrey",
        industry: "clínica dental",
        location: "Monterrey",

        description:
          "Atención dental profesional con un proceso claro, cercano y personalizado.",

        objective:
          "Conseguir citas y generar confianza",

        services: [
          {
            name: "Odontología general",
            description:
              "Evaluación, prevención y atención para mantener una sonrisa saludable.",
          },
          {
            name: "Limpieza dental",
            description:
              "Cuidado preventivo para mantener dientes y encías en mejores condiciones.",
          },
          {
            name: "Valoración dental",
            description:
              "Revisión inicial para conocer tus necesidades y definir los siguientes pasos.",
          },
        ],
      },
    })

  const raw = plan.after
  const validated = validateTree(raw)

  const resolvedTheme =
    await getResolvedSiteTheme(siteId)

  const resolvedLikeRead = {
    ...validated,
    theme: resolvedTheme.tokens,
    globalTheme: resolvedTheme.tokens,
  }

  console.log(
    "========================================",
  )
  console.log(
    "ORVENIX AI — NORMALIZATION DIAGNOSTIC",
  )
  console.log(
    "========================================",
  )

  console.log("")
  console.log("RAW HASH:")
  console.log(hashEditorTree(raw))

  console.log("")
  console.log("VALIDATED HASH:")
  console.log(hashEditorTree(validated))

  console.log("")
  console.log("RESOLVED-LIKE-READ HASH:")
  console.log(hashEditorTree(resolvedLikeRead))

  console.log("")
  console.log("=== TOP LEVEL KEYS ===")

  console.log(
    "RAW:",
    Object.keys(raw).sort(),
  )

  console.log(
    "VALIDATED:",
    Object.keys(validated).sort(),
  )

  console.log(
    "RESOLVED:",
    Object.keys(resolvedLikeRead).sort(),
  )

  console.log("")
  console.log("=== THEME ===")

  console.log(
    "RAW THEME:",
    Boolean(raw.theme),
  )

  console.log(
    "RAW GLOBAL THEME:",
    Boolean(raw.globalTheme),
  )

  console.log(
    "VALIDATED THEME:",
    Boolean(validated.theme),
  )

  console.log(
    "VALIDATED GLOBAL THEME:",
    Boolean(validated.globalTheme),
  )

  console.log(
    "RESOLVED THEME:",
    Boolean(resolvedLikeRead.theme),
  )

  console.log(
    "RESOLVED GLOBAL THEME:",
    Boolean(resolvedLikeRead.globalTheme),
  )

  console.log("")
  console.log("=== NODE COUNT ===")

  console.log(
    "RAW:",
    Object.keys(raw.nodes).length,
  )

  console.log(
    "VALIDATED:",
    Object.keys(validated.nodes).length,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
