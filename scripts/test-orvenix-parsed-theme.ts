export {}

async function main() {
  const {
    applyParsedThemeMutation,
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
      "Inter",

    fontBody:
      "Inter",

    spacing: {
      sectionX: "1.5rem",
      sectionY: "3rem",
      stack: "1.5rem",
    },

    radius: {
      card: "1rem",
      button: "999px",
    },

    shadow: {
      soft:
        "0 12px 32px rgba(15,23,42,0.08)",

      strong:
        "0 24px 60px rgba(15,23,42,0.18)",
    },

    motion: {
      duration: "240ms",

      easing:
        "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  }

  const result =
    applyParsedThemeMutation({
      theme,

      parsed: {
        path:
          "spacing.sectionY",

        value:
          "5rem",
      },
    })

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — PARSED THEME",
  )

  console.log(
    "========================================",
  )

  console.log(
    "OK:",
    result.ok,
  )

  console.log(
    "CHANGED:",
    result.changedTokens,
  )

  console.log(
    "BEFORE:",
    result.beforeTheme
      .spacing
      ?.sectionY,
  )

  console.log(
    "AFTER:",
    result.afterTheme
      .spacing
      ?.sectionY,
  )

  console.log(
    "WARNINGS:",
    result.warnings,
  )

  if (
    !result.ok ||
    result.beforeTheme
      .spacing
      ?.sectionY !==
      "3rem" ||
    result.afterTheme
      .spacing
      ?.sectionY !==
      "5rem"
  ) {
    throw new Error(
      "Parsed Theme Mutation falló.",
    )
  }

  console.log("")
  console.log(
    "PARSED THEME VALIDADO.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "PARSED THEME TEST ERROR:",
    error,
  )

  process.exit(1)
})
