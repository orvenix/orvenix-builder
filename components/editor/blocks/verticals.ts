import type { SettingsField } from "@/types/editor";

/**
 * Definiciones para las verticales restantes del Hub de Webs
 */
export const verticalBlockDefinitions = {
  // AI ANALYTICS DASHBOARD
  "ai-metrics-grid": {
    label: "Métricas de IA",
    icon: "BarChart3",
    category: "analytics",
    description: "Grilla de métricas con predicciones inteligentes",
    settings: [
      { kind: "toggle", key: "showPredictions", label: "Mostrar Predicciones IA" },
      { kind: "select", key: "refreshInterval", label: "Frecuencia de Actualización", 
        options: [{label: "Tiempo Real", value: "live"}, {label: "1h", value: "1h"}] }
    ] as SettingsField[],
  },

  // CRM ENTERPRISE
  "crm-pipeline": {
    label: "Pipeline de Ventas",
    icon: "Users2",
    category: "crm",
    description: "Visualización del embudo de ventas y leads",
    settings: [
      { kind: "number", key: "stages", label: "Número de Etapas", min: 3, max: 7 },
      { kind: "toggle", key: "enableAiScoring", label: "Lead Scoring Automático" }
    ] as SettingsField[],
  },

  // PROJECT MANAGEMENT
  "pm-kanban": {
    label: "Tablero Kanban",
    icon: "KanbanSquare",
    category: "productivity",
    description: "Gestión de tareas y sprints",
    settings: [
      { kind: "toggle", key: "showAvatars", label: "Mostrar Responsables" },
      { kind: "color", key: "accentColor", label: "Color del Sprint" }
    ] as SettingsField[],
  },

  // SAAS LANDING
  "saas-pricing": {
    label: "Tabla de Precios",
    icon: "Zap",
    category: "marketing",
    description: "Tabla de planes modular y convertible",
    settings: [
      { kind: "toggle", key: "highlightPopular", label: "Destacar Plan Popular" },
      { kind: "segmented", key: "currency", label: "Moneda", 
        options: [{label: "USD", value: "usd"}, {label: "EUR", value: "eur"}] }
    ] as SettingsField[],
  }
};

export const VERTICAL_CATEGORIES = {
  analytics: { key: "analytics", label: "AI & Data", icon: "BarChart3" },
  crm: { key: "crm", label: "CRM", icon: "Users2" },
  productivity: { key: "productivity", label: "Gestión", icon: "KanbanSquare" },
  marketing: { key: "marketing", label: "Marketing", icon: "Rocket" },
};
