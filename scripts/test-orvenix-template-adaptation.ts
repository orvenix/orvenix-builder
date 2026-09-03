import {
  getEditorTreeForWeb,
} from "@/lib/editorWebs"

import {
  adaptArtisanTemplate,
} from "@/lib/orvenix-ai"

const original =
  getEditorTreeForWeb("clinica")

const result =
  adaptArtisanTemplate({
    tree: original,

    business: {
      name: "Clínica Dental Monterrey",
      industry: "clínica dental",
      location: "Monterrey",
      description:
        "Atención dental profesional con un proceso claro, cercano y personalizado.",
      objective:
        "Conseguir citas y generar confianza",
    },

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
  })

console.log(
  "========================================",
)
console.log(
  "ORVENIX AI — TEMPLATE ADAPTATION",
)
console.log(
  "========================================",
)

console.log("")
console.log("REPORTE")
console.log(result.report)

console.log("")
console.log("=== CONTENIDO ADAPTADO ===")

for (
  const node
  of Object.values(result.tree.nodes)
) {
  if (node.type === "heading") {
    console.log(
      `HEADING | ${node.displayName} | ${node.props.text}`,
    )
  }

  if (node.type === "text") {
    console.log(
      `TEXT    | ${node.displayName} | ${node.props.content}`,
    )
  }

  if (node.type === "ctaButton") {
    console.log(
      `CTA     | ${node.displayName} | ${node.props.label}`,
    )
  }

  if (node.type === "siteNav") {
    console.log(
      `NAV     | ${node.props.title} | ${node.props.ctaLabel}`,
    )
  }
}

console.log("")
console.log("=== ADVERTENCIAS SANITIZER ===")

for (
  const warning
  of result.report.warnings
) {
  console.log(`- ${warning}`)
}
