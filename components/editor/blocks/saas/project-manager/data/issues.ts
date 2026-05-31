import type { Issue } from "../types"

export const issues: Issue[] = [
  { id: "ENG-142", title: "Implementar autenticación OAuth 2.0 con Google y GitHub", status: "in_progress", priority: "urgent", assigneeInitials: "SC", assigneeColorKey: "violet",  labelText: "Feature",     labelColorKey: "violet",  estimate: 5, project: "Backend"  },
  { id: "ENG-141", title: "Optimizar queries de base de datos en endpoint /analytics",status: "in_progress", priority: "high",   assigneeInitials: "JK", assigneeColorKey: "blue",    labelText: "Performance", labelColorKey: "blue",    estimate: 3, project: "Backend"  },
  { id: "ENG-140", title: "Rediseñar componente de tablas con virtualización",        status: "in_review",   priority: "high",   assigneeInitials: "MR", assigneeColorKey: "emerald", labelText: "UI/UX",       labelColorKey: "emerald", estimate: 8, project: "Frontend" },
  { id: "ENG-139", title: "Configurar pipeline CI/CD con GitHub Actions",             status: "in_review",   priority: "medium", assigneeInitials: "AL", assigneeColorKey: "amber",   labelText: "DevOps",      labelColorKey: "amber",   estimate: 2, project: "Infra"    },
  { id: "ENG-138", title: "Agregar soporte para webhooks en API pública",             status: "todo",        priority: "medium", assigneeInitials: "SC", assigneeColorKey: "violet",  labelText: "Feature",     labelColorKey: "violet",  estimate: 5, project: "Backend"  },
  { id: "ENG-137", title: "Escribir tests E2E para flujo de checkout",                status: "todo",        priority: "medium", assigneeInitials: "JK", assigneeColorKey: "blue",    labelText: "Testing",     labelColorKey: "red",     estimate: 4, project: "QA"       },
  { id: "ENG-136", title: "Implementar dark mode con CSS custom properties",          status: "todo",        priority: "low",    assigneeInitials: "MR", assigneeColorKey: "emerald", labelText: "UI/UX",       labelColorKey: "emerald", estimate: 3, project: "Frontend" },
  { id: "ENG-135", title: "Migrar dependencias a versiones LTS estables",             status: "done",        priority: "low",    assigneeInitials: "AL", assigneeColorKey: "amber",   labelText: "Chore",       labelColorKey: "slate",   estimate: 2, project: "Infra"    },
  { id: "ENG-134", title: "Documentar API endpoints con OpenAPI 3.1",                 status: "done",        priority: "medium", assigneeInitials: "SC", assigneeColorKey: "violet",  labelText: "Docs",        labelColorKey: "cyan",    estimate: 3, project: "Backend"  },
]
