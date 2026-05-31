import type { SprintStat } from "../types"

export const sprintMeta = {
  name: "Sprint 24",
  totalIssues: 34,
  completedIssues: 18,
  daysLeft: 6,
  totalDays: 14,
}

export const sprintStats: SprintStat[] = [
  { label: "Issues totales", value: String(sprintMeta.totalIssues) },
  { label: "Completadas",    value: String(sprintMeta.completedIssues) },
  { label: "En progreso",    value: "8" },
  { label: "Días restantes", value: String(sprintMeta.daysLeft) },
]
