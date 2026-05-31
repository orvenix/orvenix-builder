export type SuperBuilderStageStatus = "completed" | "partial" | "active" | "next" | "planned"

export interface SuperBuilderStage {
  code: string
  title: string
  status: SuperBuilderStageStatus
  summary: string
}

export interface SuperBuilderProgressReport {
  totalStages: number
  completedStages: number
  strongStages: number
  percent: number
  current: SuperBuilderStage | null
  next: SuperBuilderStage | null
  stages: SuperBuilderStage[]
}

const STAGES: SuperBuilderStage[] = [
  {
    code: "SB1",
    title: "SitePage",
    status: "completed",
    summary: "Multipágina real con slug, navegación automática, export y publicación multipágina.",
  },
  {
    code: "SB2",
    title: "SiteTheme",
    status: "partial",
    summary: "Tema persistido y propagado a primitivos, bloques y runtime principal.",
  },
  {
    code: "SB3",
    title: "builder-core",
    status: "active",
    summary: "La arquitectura base ya existe, pero falta seguir separando dominio, compiler y runtime compartido.",
  },
  {
    code: "SB4",
    title: "CMS relations",
    status: "partial",
    summary: "Relaciones, workflow editorial, filtros y bindings visuales mucho más fuertes.",
  },
  {
    code: "SB5",
    title: "Funnel",
    status: "partial",
    summary: "Funnels, runtime por step, tracking, conversión y operación comercial base.",
  },
  {
    code: "SB6",
    title: "Experiment",
    status: "partial",
    summary: "A/B con split configurable, persistencia por visitante y analytics básicos.",
  },
  {
    code: "SB7",
    title: "AiGenerationJob",
    status: "partial",
    summary: "Trazabilidad de generación y fixes auditables para SEO, WCAG y performance.",
  },
  {
    code: "SB8",
    title: "Automation",
    status: "partial",
    summary: "Triggers, condiciones, historial y acciones útiles sobre contactos, pedidos y CMS.",
  },
  {
    code: "SB9",
    title: "Cierre operativo",
    status: "next",
    summary: "Consolidar prioridades visibles, producción pública y endurecimiento final para salida real.",
  },
]

export function getSuperBuilderProgressReport(): SuperBuilderProgressReport {
  const completedStages = STAGES.filter((stage) => stage.status === "completed").length
  const strongStages = STAGES.filter((stage) => stage.status === "completed" || stage.status === "partial").length
  const current = STAGES.find((stage) => stage.status === "active") ?? null
  const next = STAGES.find((stage) => stage.status === "next") ?? null
  const totalStages = STAGES.length
  const progressUnits = STAGES.reduce((sum, stage) => {
    if (stage.status === "completed") return sum + 1
    if (stage.status === "partial") return sum + 0.65
    if (stage.status === "active") return sum + 0.4
    return sum
  }, 0)
  const percent = Math.round((progressUnits / totalStages) * 100)

  return {
    totalStages,
    completedStages,
    strongStages,
    percent,
    current,
    next,
    stages: STAGES,
  }
}
