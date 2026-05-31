import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { randomUUID } from "crypto"
import { join } from "path"
import { editorPrisma } from "@/lib/editor-db"
import { isFileStorageMode } from "@/lib/storage-mode"
import { sendEmail } from "@/lib/email"
import {
  getCmsWorkflowPublishedAt,
  isCmsWorkflowStatus,
  withCmsWorkflowStatus,
} from "@/lib/cms/workflow"
import {
  AUTOMATION_CMS_WORKFLOW_STATUSES,
  AUTOMATION_ORDER_STATUSES,
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_OPERATORS,
  getAutomationTriggerFieldDefinition,
  type AutomationAction,
  type AutomationCondition,
  type AutomationGraph,
  type AutomationStatus,
  type AutomationTriggerType,
} from "@/lib/automation/config"

export interface AutomationRecord {
  id: string
  siteId: string
  name: string
  triggerType: string
  actionGraph: unknown
  status: string
  createdAt: Date
  updatedAt: Date
}

type DynamicAutomationDelegate = {
  findMany: (args: {
    where?: Record<string, unknown>
    orderBy?: Record<string, "asc" | "desc">
  }) => Promise<AutomationRecord[]>
  create: (args: {
    data: Record<string, unknown>
  }) => Promise<AutomationRecord>
  update: (args: {
    where: { id: string }
    data: Record<string, unknown>
  }) => Promise<AutomationRecord>
  delete: (args: { where: { id: string } }) => Promise<AutomationRecord>
  findFirst: (args: {
    where?: Record<string, unknown>
  }) => Promise<AutomationRecord | null>
}

export interface AutomationRunRecord {
  id: string
  siteId: string
  automationId: string
  triggerType: string
  payload: unknown
  result: "processed" | "skipped" | "failed"
  error?: string | null
  createdAt: string
}

const SISTEMA_DIR = join(process.cwd(), "sistema")
const AUTOMATION_LOG_FILE = join(SISTEMA_DIR, "automation-runs.json")

function getAutomationDelegate(): DynamicAutomationDelegate | null {
  return (editorPrisma as unknown as { automation?: DynamicAutomationDelegate }).automation ?? null
}

function loadAutomationLog(): AutomationRunRecord[] {
  try {
    if (!existsSync(AUTOMATION_LOG_FILE)) return []
    return JSON.parse(readFileSync(AUTOMATION_LOG_FILE, "utf-8")) as AutomationRunRecord[]
  } catch {
    return []
  }
}

function saveAutomationLog(entries: AutomationRunRecord[]) {
  if (!existsSync(SISTEMA_DIR)) mkdirSync(SISTEMA_DIR, { recursive: true })
  writeFileSync(AUTOMATION_LOG_FILE, JSON.stringify(entries, null, 2), "utf-8")
}

function parseActions(value: unknown): AutomationAction[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      type: String(entry.type ?? ""),
      config: typeof entry.config === "object" && entry.config !== null ? entry.config as Record<string, unknown> : {},
    }))
    .filter((entry): entry is AutomationAction => AUTOMATION_ACTION_TYPES.includes(entry.type as AutomationAction["type"]))
}

function parseConditions(value: unknown, triggerType: AutomationTriggerType): AutomationCondition[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      field: String(entry.field ?? "").trim(),
      operator: String(entry.operator ?? ""),
      value: String(entry.value ?? "").trim(),
    }))
    .filter((entry): entry is AutomationCondition => {
      if (!entry.field || !entry.value) return false
      if (!AUTOMATION_CONDITION_OPERATORS.includes(entry.operator as AutomationCondition["operator"])) return false
      const fieldConfig = getAutomationTriggerFieldDefinition(triggerType, entry.field)
      return Boolean(fieldConfig && fieldConfig.operators.includes(entry.operator))
    })
}

function normalizeAutomationGraph(
  triggerType: AutomationTriggerType,
  value: unknown
): AutomationGraph {
  if (Array.isArray(value)) {
    return {
      conditions: [],
      actions: parseActions(value),
    }
  }

  if (typeof value !== "object" || value === null) {
    return {
      conditions: [],
      actions: [],
    }
  }

  const raw = value as { conditions?: unknown; actions?: unknown }
  return {
    conditions: parseConditions(raw.conditions, triggerType),
    actions: parseActions(raw.actions),
  }
}

function getActionGraph(record: AutomationRecord) {
  return normalizeAutomationGraph(record.triggerType as AutomationTriggerType, record.actionGraph)
}

function matchesCondition(condition: AutomationCondition, payload: Record<string, unknown>) {
  const rawValue = payload[condition.field]
  if (rawValue === undefined || rawValue === null) return false

  if (condition.operator === "number_gte") {
    const payloadNumber = Number(rawValue)
    const conditionNumber = Number(condition.value)
    return Number.isFinite(payloadNumber) && Number.isFinite(conditionNumber) && payloadNumber >= conditionNumber
  }

  const payloadText = String(rawValue).trim().toLowerCase()
  const conditionText = condition.value.trim().toLowerCase()

  if (condition.operator === "contains") {
    return payloadText.includes(conditionText)
  }

  return payloadText === conditionText
}

function shouldRunAutomation(graph: AutomationGraph, payload: Record<string, unknown>) {
  if (graph.conditions.length === 0) return true
  return graph.conditions.every((condition) => matchesCondition(condition, payload))
}

function normalizeAutomationRecord(record: AutomationRecord) {
  return {
    ...record,
    triggerType: record.triggerType as AutomationTriggerType,
    status: record.status as AutomationStatus,
    actionGraph: getActionGraph(record),
  }
}

async function appendOrderNote(orderId: string, note: string) {
  const current = await editorPrisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, notes: true },
  })
  if (!current) return
  const parts = [current.notes?.trim(), note.trim()].filter(Boolean)
  await editorPrisma.order.update({
    where: { id: orderId },
    data: { notes: parts.join("|") },
  })
}

async function tagContact(contactId: number, tag: string) {
  const contact = await editorPrisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, servicio: true },
  })
  if (!contact) return
  const nextServicio = [contact.servicio?.trim(), `tag:${tag.trim()}`].filter(Boolean).join(" | ")
  await editorPrisma.contact.update({
    where: { id: contactId },
    data: { servicio: nextServicio },
  })
}

async function setContactService(contactId: number, service: string) {
  const nextService = service.trim()
  if (!nextService) return
  await editorPrisma.contact.update({
    where: { id: contactId },
    data: { servicio: nextService },
  })
}

async function setOrderStatus(orderId: string, status: string) {
  const nextStatus = status.trim()
  if (!nextStatus || !AUTOMATION_ORDER_STATUSES.includes(nextStatus as typeof AUTOMATION_ORDER_STATUSES[number])) return
  await editorPrisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  })
}

async function setRecordWorkflowStatus(recordId: string, status: string) {
  if (!isCmsWorkflowStatus(status) || !AUTOMATION_CMS_WORKFLOW_STATUSES.includes(status)) return
  const record = await editorPrisma.record.findUnique({
    where: { id: recordId },
    select: { id: true, data: true, publishedAt: true },
  })
  if (!record) return
  await editorPrisma.record.update({
    where: { id: recordId },
    data: {
      data: withCmsWorkflowStatus(record.data, status),
      publishedAt: getCmsWorkflowPublishedAt(status, record.publishedAt),
    },
  })
}

async function runAutomationAction(action: AutomationAction, payload: Record<string, unknown>) {
  if (action.type === "append_order_note") {
    const orderId = typeof payload.orderId === "string" ? payload.orderId : ""
    const note = String(action.config?.note ?? payload.eventLabel ?? "automation")
    if (orderId && note.trim()) {
      await appendOrderNote(orderId, `automation:${note.trim()}`)
    }
    return
  }

  if (action.type === "tag_contact") {
    const contactId = typeof payload.contactId === "number" ? payload.contactId : null
    const tag = String(action.config?.tag ?? payload.tag ?? "").trim()
    if (contactId && tag) {
      await tagContact(contactId, tag)
    }
    return
  }

  if (action.type === "set_contact_service") {
    const contactId = typeof payload.contactId === "number" ? payload.contactId : null
    const service = String(action.config?.service ?? "").trim()
    if (contactId && service) {
      await setContactService(contactId, service)
    }
    return
  }

  if (action.type === "email_admin") {
    const to = String(action.config?.to ?? process.env.ORVENIX_ADMIN_EMAILS?.split(",")[0] ?? "").trim()
    const subject = String(action.config?.subject ?? payload.subject ?? "Nueva automatización ejecutada").trim()
    const html = `<div style="font-family:Arial,sans-serif"><h2>${subject}</h2><pre style="white-space:pre-wrap">${JSON.stringify(payload, null, 2)}</pre></div>`
    if (to) {
      await sendEmail({ to, subject, html })
    }
    return
  }

  if (action.type === "email_contact") {
    const to = String(
      action.config?.to
      ?? payload.email
      ?? payload.customerEmail
      ?? ""
    ).trim()
    const subject = String(action.config?.subject ?? "Seguimiento de Orvenix").trim()
    const message = String(
      action.config?.message
      ?? "Gracias por tu interes. Te contactaremos pronto."
    ).trim()
    const html = `<div style="font-family:Arial,sans-serif"><p>${message}</p></div>`
    if (to) {
      await sendEmail({ to, subject, html })
    }
    return
  }

  if (action.type === "set_order_status") {
    const orderId = typeof payload.orderId === "string" ? payload.orderId : ""
    const status = String(action.config?.status ?? "").trim()
    if (orderId && status) {
      await setOrderStatus(orderId, status)
    }
    return
  }

  if (action.type === "set_record_workflow_status") {
    const recordId = typeof payload.recordId === "string" ? payload.recordId : ""
    const status = String(action.config?.status ?? "").trim()
    if (recordId && status) {
      await setRecordWorkflowStatus(recordId, status)
    }
  }
}

async function logAutomationRun(entry: AutomationRunRecord) {
  const entries = loadAutomationLog()
  entries.unshift(entry)
  saveAutomationLog(entries.slice(0, 500))
}

export function isAutomationsReady() {
  return Boolean(getAutomationDelegate())
}

export async function listAutomations(siteId: string) {
  const delegate = getAutomationDelegate()
  if (!delegate) return []
  const records = await delegate.findMany({
    where: { siteId },
    orderBy: { createdAt: "desc" },
  })
  return records.map((record) => normalizeAutomationRecord(record))
}

export async function listAutomationRuns(siteId: string, limit = 50) {
  const entries = loadAutomationLog()
  return entries
    .filter((entry) => entry.siteId === siteId)
    .slice(0, limit)
}

export async function createAutomation(siteId: string, input: {
  name: string
  triggerType: AutomationTriggerType
  status?: AutomationStatus
  actionGraph?: AutomationGraph
}) {
  const delegate = getAutomationDelegate()
  if (!delegate) {
    throw new Error("AUTOMATIONS_NOT_READY")
  }

  const actionGraph = normalizeAutomationGraph(input.triggerType, input.actionGraph)

  const record = await delegate.create({
    data: {
      siteId,
      name: input.name,
      triggerType: input.triggerType,
      status: input.status ?? "draft",
      actionGraph,
    },
  })
  return normalizeAutomationRecord(record)
}

export async function updateAutomation(siteId: string, automationId: string, input: {
  name?: string
  triggerType?: AutomationTriggerType
  status?: AutomationStatus
  actionGraph?: AutomationGraph
}) {
  const delegate = getAutomationDelegate()
  if (!delegate) {
    throw new Error("AUTOMATIONS_NOT_READY")
  }

  const existing = await delegate.findFirst({ where: { id: automationId, siteId } })
  if (!existing) throw new Error("AUTOMATION_NOT_FOUND")

  const nextTriggerType = (input.triggerType ?? existing.triggerType) as AutomationTriggerType
  const nextActionGraph = input.actionGraph !== undefined
    ? normalizeAutomationGraph(nextTriggerType, input.actionGraph)
    : undefined

  const record = await delegate.update({
    where: { id: automationId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.triggerType !== undefined ? { triggerType: input.triggerType } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(nextActionGraph !== undefined ? { actionGraph: nextActionGraph } : {}),
    },
  })
  return normalizeAutomationRecord(record)
}

export async function deleteAutomation(siteId: string, automationId: string) {
  const delegate = getAutomationDelegate()
  if (!delegate) {
    throw new Error("AUTOMATIONS_NOT_READY")
  }

  const existing = await delegate.findFirst({ where: { id: automationId, siteId } })
  if (!existing) throw new Error("AUTOMATION_NOT_FOUND")
  await delegate.delete({ where: { id: automationId } })
}

export async function triggerAutomations(
  siteId: string,
  triggerType: AutomationTriggerType,
  payload: Record<string, unknown>
) {
  const delegate = getAutomationDelegate()
  if (!delegate && !isFileStorageMode()) return

  const records = delegate
    ? await delegate.findMany({
        where: { siteId, triggerType, status: "active" },
        orderBy: { createdAt: "desc" },
      })
    : []

  for (const record of records) {
    try {
      const graph = getActionGraph(record)
      if (!shouldRunAutomation(graph, payload)) {
        await logAutomationRun({
          id: randomUUID(),
          siteId,
          automationId: record.id,
          triggerType,
          payload,
          result: "skipped",
          error: "CONDITIONS_NOT_MATCHED",
          createdAt: new Date().toISOString(),
        })
        continue
      }
      for (const action of graph.actions) {
        await runAutomationAction(action, payload)
      }
      await logAutomationRun({
        id: randomUUID(),
        siteId,
        automationId: record.id,
        triggerType,
        payload,
        result: "processed",
        error: null,
        createdAt: new Date().toISOString(),
      })
    } catch (error) {
      await logAutomationRun({
        id: randomUUID(),
        siteId,
        automationId: record.id,
        triggerType,
        payload,
        result: "failed",
        error: error instanceof Error ? error.message : "AUTOMATION_FAILED",
        createdAt: new Date().toISOString(),
      })
    }
  }
}
