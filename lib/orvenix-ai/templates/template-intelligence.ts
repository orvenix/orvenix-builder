import type {
  OrvenixTemplateCatalogEntry,
} from "./catalog"

export interface TemplateSelectionContext {
  siteType?: string
  industry?: string
  objective?: string
  preferredStyle?: string

  requiredCapabilities?: string[]
}

export interface RankedTemplate {
  template: OrvenixTemplateCatalogEntry
  score: number
  confidence: number
  reasons: string[]
}

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function words(value?: string) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length >= 4),
  )
}

function overlapScore(
  query?: string,
  target?: string,
) {
  const queryWords = words(query)
  const targetWords = words(target)

  if (!queryWords.size) return 0

  let matches = 0

  for (const word of queryWords) {
    if (targetWords.has(word)) {
      matches++
    }
  }

  return matches / queryWords.size
}

export function scoreTemplate(
  template: OrvenixTemplateCatalogEntry,
  context: TemplateSelectionContext,
): RankedTemplate {
  let score = 0
  const reasons: string[] = []

  const requestedType =
    normalize(context.siteType)

  const templateTypes =
    template.siteTypes.map(normalize)

  /*
   * Coincidencia estructural.
   * Tiene el peso mayor.
   */
  if (
    requestedType &&
    templateTypes.includes(requestedType)
  ) {
    score += 50

    reasons.push(
      "Coincidencia directa con el tipo de sitio.",
    )
  }

  if (
  requestedType &&
  templateTypes.length > 0 &&
  !templateTypes.includes(requestedType) &&
  !templateTypes.includes("business") &&
  !templateTypes.includes("professional-services")
) {
  score -= 25

  reasons.push(
    "Pertenece principalmente a otro tipo de sitio (-25).",
  )
}

  const searchable = [
    template.name,
    template.category,
    template.description,
    ...template.tags,
  ].join(" ")

  /*
   * Industria.
   */
  const industryMatch =
    overlapScore(
      context.industry,
      searchable,
    )

  if (industryMatch > 0) {
    const points =
      Math.round(industryMatch * 25)

    score += points

    reasons.push(
      `Afinidad con la industria (+${points}).`,
    )
  }

  /*
   * Objetivo comercial.
   */
  const objectiveMatch =
    overlapScore(
      context.objective,
      searchable,
    )

  if (objectiveMatch > 0) {
    const points =
      Math.round(objectiveMatch * 10)

    score += points

    reasons.push(
      `Afinidad con el objetivo (+${points}).`,
    )
  }

  /*
   * Capacidades requeridas.
   */
  for (
    const capability
    of context.requiredCapabilities ?? []
  ) {
    const match =
      overlapScore(
        capability,
        searchable,
      )

    if (match > 0) {
      const points =
        Math.max(
          2,
          Math.round(match * 5),
        )

      score += points

      reasons.push(
        `Soporta "${capability}" (+${points}).`,
      )
    }
  }

  /*
   * Preferencia visual.
   */
  const styleMatch =
    overlapScore(
      context.preferredStyle,
      searchable,
    )

  if (styleMatch > 0) {
    const points =
      Math.round(styleMatch * 5)

    score += points

    reasons.push(
      `Afinidad visual (+${points}).`,
    )
  }

  /*
   * Bonus si existe árbol real.
   */
  if (template.tree) {
    score += 5

    reasons.push(
      "Dispone de EditorTree real reutilizable.",
    )
  }

  /*
   * El score puede crecer cuando agreguemos
   * más señales. Confidence se mantiene 0–100.
   */
  const confidence =
    Math.max(
      0,
      Math.min(100, score),
    )

  return {
    template,
    score,
    confidence,
    reasons,
  }
}

export function rankTemplateCatalog(
  templates: OrvenixTemplateCatalogEntry[],
  context: TemplateSelectionContext,
): RankedTemplate[] {
  return templates
    .map((template) =>
      scoreTemplate(template, context),
    )
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      return a.template.name.localeCompare(
        b.template.name,
      )
    })
}

export function selectBestTemplate(
  templates: OrvenixTemplateCatalogEntry[],
  context: TemplateSelectionContext,
): RankedTemplate | null {
  return (
    rankTemplateCatalog(
      templates,
      context,
    )[0] ?? null
  )
}
