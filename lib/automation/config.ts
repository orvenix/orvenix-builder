export const AUTOMATION_TRIGGER_TYPES = [
  "contact_created",
  "store_checkout_started",
  "cms_record_created",
] as const

export const AUTOMATION_STATUSES = ["draft", "active", "paused"] as const

export const AUTOMATION_ACTION_TYPES = [
  "tag_contact",
  "set_contact_service",
  "email_contact",
  "append_order_note",
  "email_admin",
  "set_order_status",
  "set_record_workflow_status",
] as const

export const AUTOMATION_CONDITION_OPERATORS = [
  "equals",
  "contains",
  "number_gte",
] as const

export const AUTOMATION_ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "refunded",
  "canceled",
] as const

export const AUTOMATION_CMS_WORKFLOW_STATUSES = [
  "draft",
  "review",
  "published",
] as const

export type AutomationTriggerType = typeof AUTOMATION_TRIGGER_TYPES[number]
export type AutomationStatus = typeof AUTOMATION_STATUSES[number]
export type AutomationActionType = typeof AUTOMATION_ACTION_TYPES[number]
export type AutomationConditionOperator = typeof AUTOMATION_CONDITION_OPERATORS[number]
export type AutomationOrderStatus = typeof AUTOMATION_ORDER_STATUSES[number]
export type AutomationCmsWorkflowStatus = typeof AUTOMATION_CMS_WORKFLOW_STATUSES[number]

export interface AutomationAction {
  type: AutomationActionType
  config?: Record<string, unknown>
}

export interface AutomationCondition {
  field: string
  operator: AutomationConditionOperator
  value: string
}

export interface AutomationGraph {
  conditions: AutomationCondition[]
  actions: AutomationAction[]
}

export interface AutomationTriggerFieldDefinition {
  field: string
  label: string
  placeholder: string
  operators: AutomationConditionOperator[]
}

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  contact_created: "Contacto creado",
  store_checkout_started: "Checkout iniciado",
  cms_record_created: "Record CMS creado",
}

export const AUTOMATION_ACTION_LABELS: Record<AutomationActionType, string> = {
  tag_contact: "Etiquetar contacto",
  set_contact_service: "Cambiar servicio del contacto",
  email_contact: "Email al contacto",
  append_order_note: "Agregar nota al pedido",
  email_admin: "Email al admin",
  set_order_status: "Cambiar estado del pedido",
  set_record_workflow_status: "Cambiar workflow CMS",
}

export const AUTOMATION_CONDITION_OPERATOR_LABELS: Record<AutomationConditionOperator, string> = {
  equals: "Es igual a",
  contains: "Contiene",
  number_gte: "Es mayor o igual a",
}

export const AUTOMATION_TRIGGER_FIELD_DEFS: Record<
  AutomationTriggerType,
  AutomationTriggerFieldDefinition[]
> = {
  contact_created: [
    {
      field: "servicio",
      label: "Servicio",
      placeholder: "Ej: branding",
      operators: ["equals", "contains"],
    },
    {
      field: "email",
      label: "Email",
      placeholder: "cliente@dominio.com",
      operators: ["equals", "contains"],
    },
    {
      field: "presupuesto",
      label: "Presupuesto",
      placeholder: "10000",
      operators: ["equals", "number_gte"],
    },
  ],
  store_checkout_started: [
    {
      field: "totalMxn",
      label: "Total MXN",
      placeholder: "5000",
      operators: ["equals", "number_gte"],
    },
    {
      field: "itemCount",
      label: "Cantidad de items",
      placeholder: "2",
      operators: ["equals", "number_gte"],
    },
    {
      field: "customerEmail",
      label: "Email del cliente",
      placeholder: "cliente@dominio.com",
      operators: ["equals", "contains"],
    },
    {
      field: "funnelStep",
      label: "Paso del funnel",
      placeholder: "checkout",
      operators: ["equals", "contains"],
    },
  ],
  cms_record_created: [
    {
      field: "collectionSlug",
      label: "Colección",
      placeholder: "blog",
      operators: ["equals", "contains"],
    },
    {
      field: "workflowStatus",
      label: "Estado editorial",
      placeholder: "published",
      operators: ["equals", "contains"],
    },
  ],
}

export function getAutomationTriggerFieldDefinition(
  triggerType: AutomationTriggerType,
  field: string
) {
  return AUTOMATION_TRIGGER_FIELD_DEFS[triggerType].find((entry) => entry.field === field) ?? null
}
