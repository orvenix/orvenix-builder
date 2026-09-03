import {
  buildRealTemplateCatalog,
  rankTemplateCatalog,
} from "@/lib/orvenix-ai"

const catalog =
  buildRealTemplateCatalog()

const tests = [
  {
    name: "Clínica dental",
    context: {
      siteType: "health",
      industry: "clínica dental",
      objective:
        "Conseguir citas y generar confianza",
      requiredCapabilities: [
        "citas",
        "servicios",
        "faq",
      ],
    },
  },

  {
    name: "Restaurante italiano",
    context: {
      siteType: "restaurant",
      industry: "restaurante italiano",
      objective:
        "Conseguir reservaciones y visitas",
      requiredCapabilities: [
        "reservaciones",
        "menu",
        "galeria",
      ],
    },
  },

  {
    name: "Agencia de marketing",
    context: {
      siteType: "agency",
      industry: "agencia de marketing",
      objective:
        "Conseguir prospectos",
      requiredCapabilities: [
        "servicios",
        "casos de exito",
        "formulario",
      ],
    },
  },

  {
    name: "Productos artesanales",
    context: {
      siteType: "ecommerce",
      industry:
        "tienda de productos artesanales",
      objective:
        "Vender productos",
      requiredCapabilities: [
        "catalogo",
        "carrito",
        "checkout",
      ],
    },
  },
]

console.log(
  "================================",
)
console.log(
  "ORVENIX AI — TEMPLATE INTELLIGENCE",
)
console.log(
  "================================",
)

console.log(
  "TEMPLATES DISPONIBLES:",
  catalog.entries.length,
)

for (const test of tests) {
  console.log("")
  console.log(
    "================================",
  )
  console.log(test.name.toUpperCase())
  console.log(
    "================================",
  )

  const ranked =
    rankTemplateCatalog(
      catalog.entries,
      test.context,
    )

  for (
    const candidate
    of ranked.slice(0, 3)
  ) {
    console.log("")
    console.log(
      `${candidate.template.name}`,
    )

    console.log(
      "ID:",
      candidate.template.id,
    )

    console.log(
      "SCORE:",
      candidate.score,
    )

    console.log(
      "CONFIDENCE:",
      candidate.confidence,
    )

    console.log(
      "TREE:",
      candidate.template.tree
        ? "SI"
        : "NO",
    )

    for (
      const reason
      of candidate.reasons
    ) {
      console.log(
        `  - ${reason}`,
      )
    }
  }
}
