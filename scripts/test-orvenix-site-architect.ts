import {
  buildSiteArchitecture,
} from "@/lib/orvenix-ai"

const examples = [
  "Hazme un sitio para una clínica dental en Monterrey",
  "Quiero una página para mi restaurante italiano",
  "Necesito un sitio para mi agencia de marketing",
  "Crea una tienda para vender productos artesanales",
]

for (const request of examples) {
  const architecture = buildSiteArchitecture({
    request,
    business: {},
  })

  console.log("")
  console.log("====================================")
  console.log(request)
  console.log("====================================")

  console.log("TIPO:", architecture.siteType)
  console.log("OBJETIVO:", architecture.objective)
  console.log("PÁGINAS:", architecture.pages.length)

  for (const page of architecture.pages) {
    console.log("")
    console.log(`  ${page.name} /${page.slug}`)

    for (const section of page.sections) {
      console.log(
        `    ${section.role.padEnd(14)} -> ${section.blockType ?? "PRIMITIVES"}`
      )
    }
  }
}
