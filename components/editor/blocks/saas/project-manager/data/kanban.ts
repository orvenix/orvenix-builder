import type { KanbanColumn } from "../types"

export const kanbanColumns: KanbanColumn[] = [
  {
    id: "backlog", label: "Backlog", colorKey: "slate",
    cards: [
      { id: "B-01", title: "Crear sistema de notificaciones push", tag: "Feature",     tagColorKey: "violet",  points: 5, assigneeInitials: "SC", assigneeColorKey: "violet"  },
      { id: "B-02", title: "Integración con Slack",                tag: "Integration", tagColorKey: "blue",    points: 3, assigneeInitials: "JK", assigneeColorKey: "blue"    },
      { id: "B-03", title: "Panel de analytics exportable",        tag: "Feature",     tagColorKey: "violet",  points: 8, assigneeInitials: "MR", assigneeColorKey: "emerald" },
    ],
  },
  {
    id: "todo", label: "To Do", colorKey: "slate",
    cards: [
      { id: "T-01", title: "Rediseño de onboarding flow",   tag: "UI/UX",    tagColorKey: "emerald", points: 5, assigneeInitials: "AL", assigneeColorKey: "amber"  },
      { id: "T-02", title: "Implementar MFA con TOTP",      tag: "Security", tagColorKey: "red",     points: 3, assigneeInitials: "SC", assigneeColorKey: "violet" },
    ],
  },
  {
    id: "in_progress", label: "En Progreso", colorKey: "amber",
    cards: [
      { id: "P-01", title: "OAuth 2.0 Google & GitHub",    tag: "Feature",     tagColorKey: "violet",  points: 5, assigneeInitials: "SC", assigneeColorKey: "violet"  },
      { id: "P-02", title: "Optimización de queries DB",   tag: "Performance", tagColorKey: "blue",    points: 3, assigneeInitials: "JK", assigneeColorKey: "blue"    },
      { id: "P-03", title: "Virtualización de tablas",     tag: "UI/UX",       tagColorKey: "emerald", points: 8, assigneeInitials: "MR", assigneeColorKey: "emerald" },
    ],
  },
  {
    id: "review", label: "En Revisión", colorKey: "indigo",
    cards: [
      { id: "R-01", title: "CI/CD con GitHub Actions", tag: "DevOps",  tagColorKey: "amber", points: 2, assigneeInitials: "AL", assigneeColorKey: "amber" },
      { id: "R-02", title: "Tests E2E checkout",        tag: "Testing", tagColorKey: "red",   points: 4, assigneeInitials: "JK", assigneeColorKey: "blue"  },
    ],
  },
  {
    id: "done", label: "Completado", colorKey: "emerald",
    cards: [
      { id: "D-01", title: "Migración de dependencias LTS", tag: "Chore", tagColorKey: "slate",  points: 2, assigneeInitials: "AL", assigneeColorKey: "amber"  },
      { id: "D-02", title: "Documentación OpenAPI 3.1",     tag: "Docs",  tagColorKey: "cyan",   points: 3, assigneeInitials: "SC", assigneeColorKey: "violet" },
    ],
  },
]
