import {
  getDesignRecipe,
  parseDesignIntent,
} from "@/lib/orvenix-ai/design"

const cases = [
  "Haz que el sitio se vea más premium",
  "Quiero un diseño minimalista",
  "Haz que la página se vea moderna",
  "Dale un estilo más elegante",
  "Haz todo más compacto",
  "Quiero más espacio entre los elementos",
  "Cambia el título del hero",
]

console.log(
  "========================================",
)
console.log(
  "ORVENIX AI — DESIGN INTENT",
)
console.log(
  "========================================",
)

for (const request of cases) {
  const parsed =
    parseDesignIntent(request)

  const recipe =
    getDesignRecipe(
      parsed.intent,
    )

  console.log()
  console.log(
    "REQUEST:",
    request,
  )

  console.log(
    "PARSED:",
    parsed,
  )

  console.log(
    "RECIPE:",
    recipe?.intent ?? null,
  )

  console.log(
    "THEME MUTATIONS:",
    recipe?.theme.length ?? 0,
  )

  console.log(
    "MULTI MUTATIONS:",
    recipe?.multi.length ?? 0,
  )
}

console.log()
console.log(
  "DESIGN INTENT VALIDADO.",
)
