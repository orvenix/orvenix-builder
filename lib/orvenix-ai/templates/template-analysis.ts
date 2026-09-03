import type { EditorTree } from "@/types/editor"
import type {
  OrvenixTemplateDescriptor,
  TemplateMatch,
} from "./template-types"

function normalize(value: string | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

export function analyzeTemplateTree(params: {
  id: string
  name: string
  category: string
  source: string
  description?: string
  tree: EditorTree
}): OrvenixTemplateDescriptor {
  const nodes = Object.values(params.tree.nodes ?? {})

  const blockTypes = Array.from(
    new Set(nodes.map((node) => node.type)),
  )

  const root = params.tree.nodes[params.tree.rootId]

  return {
    id: params.id,
    name: params.name,
    category: params.category,
    description: params.description,
    source: params.source,
    tree: params.tree,
    blockTypes,
    sectionCount: root?.children?.length ?? 0,
  }
}

export function scoreTemplateForBusiness(params: {
  template: OrvenixTemplateDescriptor
  industry?: string
  objective?: string
  preferredCategory?: string
}): TemplateMatch {
  const {
    template,
    industry,
    objective,
    preferredCategory,
  } = params

  let score = 50
  const reasons: string[] = []

  const category = normalize(template.category)
  const name = normalize(template.name)
  const description = normalize(template.description)
  const industryNormalized = normalize(industry)
  const objectiveNormalized = normalize(objective)
  const preferred = normalize(preferredCategory)

  if (
    preferred &&
    category.includes(preferred)
  ) {
    score += 20
    reasons.push("Coincide con la categoría preferida.")
  }

  if (
    industryNormalized &&
    (
      category.includes(industryNormalized) ||
      name.includes(industryNormalized) ||
      description.includes(industryNormalized)
    )
  ) {
    score += 20
    reasons.push("Coincide con la industria del negocio.")
  }

  if (
    objectiveNormalized &&
    description.includes(objectiveNormalized)
  ) {
    score += 10
    reasons.push("Coincide con el objetivo comercial.")
  }

  if (template.sectionCount >= 5) {
    score += 5
    reasons.push("Tiene una estructura suficientemente completa.")
  }

  if (template.blockTypes.length >= 4) {
    score += 5
    reasons.push("Tiene variedad de bloques reutilizables.")
  }

  return {
    template,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  }
}

export function rankTemplates(
  templates: OrvenixTemplateDescriptor[],
  params: {
    industry?: string
    objective?: string
    preferredCategory?: string
  },
): TemplateMatch[] {
  return templates
    .map((template) =>
      scoreTemplateForBusiness({
        template,
        ...params,
      }),
    )
    .sort((a, b) => b.score - a.score)
}
