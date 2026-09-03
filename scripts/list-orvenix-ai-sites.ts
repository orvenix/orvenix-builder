export {}
async function main() {
  process.loadEnvFile(".env")

  const {
    editorPrisma,
  } = await import("@/lib/editor-db")

  console.log(
    "STORAGE MODE:",
    process.env.ORVENIX_STORAGE_MODE ?? "NO DEFINIDO",
  )

  const sites =
    await editorPrisma.editorWebsite.findMany({
      orderBy: {
        id: "asc",
      },

      select: {
        id: true,
        name: true,
        published: true,
      },
    })

  console.log(
    "================================",
  )

  console.log(
    "ORVENIX AI — SITIOS DISPONIBLES",
  )

  console.log(
    "================================",
  )

  console.log(
    "TOTAL:",
    sites.length,
  )

  for (const site of sites.slice(0, 20)) {
    console.log("")
    console.log("ID:", site.id)
    console.log("NOMBRE:", site.name)
    console.log(
      "PUBLICADO:",
      site.published ? "SI" : "NO",
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
