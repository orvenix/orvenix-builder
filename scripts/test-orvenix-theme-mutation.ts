export {}

async function main() {
  const {
    parseThemeMutation,
    planThemeMutation,
  } = await import(
    "@/lib/orvenix-ai/theme"
  )

  const theme = {
    colors: {
      primary: "#000000",
      secondary: "#111111",
      background: "#ffffff",
      text: "#222222",
      accent: "#333333",
    },

    fontHeading:
      "Arial",

    fontBody:
      "Arial",

    spacing: {
      sectionX: "1rem",
      sectionY: "2rem",
      stack: "1rem",
    },

    radius: {
      card: "0.5rem",
      button: "0.5rem",
    },

    shadow: {
      soft:
        "0 4px 12px rgba(0,0,0,.08)",
      strong:
        "0 12px 30px rgba(0,0,0,.16)",
    },

    motion: {
      duration: "240ms",
      easing: "ease",
    },
  }

  const requests = [
    "Cambia el color principal a #315c57",
    "Pon el color secundario en #28415e",
    "Cambia el color de fondo a #f8f6f1",
    "Pon el color de texto en #1f2933",
    "Cambia el color de acento a #c48b5f",
    "Pon la tipografía de títulos en Inter",
    "Pon la tipografía del cuerpo en Roboto",
    "Pon el espaciado vertical global en 4rem",
    "Pon el espaciado horizontal global en 2rem",
    "Pon el espaciado entre elementos en 1.5rem",
    "Pon el radio de las tarjetas en 1rem",
    "Pon el radio de los botones en 999px",
  ]

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — THEME MUTATION",
  )

  console.log(
    "========================================",
  )

  for (
    const request of requests
  ) {
    const parsed =
      parseThemeMutation(
        request,
      )

    const plan =
      planThemeMutation({
        theme,
        request,
      })

    console.log("")
    console.log(
      "REQUEST:",
      request,
    )

    console.log(
      "PARSED:",
      parsed,
    )

    console.log(
      "OK:",
      plan.ok,
    )

    console.log(
      "CHANGED:",
      plan.changedTokens,
    )

    console.log(
      "WARNINGS:",
      plan.warnings,
    )

    if (!plan.ok) {
      throw new Error(
        `Theme mutation falló: ${request}`,
      )
    }

    if (
      plan.changedTokens.length !==
      1
    ) {
      throw new Error(
        `Changed tokens inválido: ${request}`,
      )
    }
  }

  console.log("")
  console.log(
    "THEME MUTATION VALIDADO.",
  )
}

main().catch(
  (error) => {
    console.error(error)
    process.exit(1)
  },
)
