"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_CMS_WORKFLOW_STATUSES,
  AUTOMATION_CONDITION_OPERATOR_LABELS,
  AUTOMATION_ORDER_STATUSES,
  AUTOMATION_TRIGGER_FIELD_DEFS,
  AUTOMATION_TRIGGER_LABELS,
  type AutomationAction,
  type AutomationActionType,
  type AutomationCondition,
  type AutomationConditionOperator,
  type AutomationGraph,
  type AutomationStatus,
  type AutomationTriggerType,
} from "@/lib/automation/config"
import {
  ArrowLeft, Package, Plus, Trash2, ShoppingCart,
  Tag, CheckCircle, Clock, XCircle, Eye, EyeOff, Workflow, Pencil, Save, ExternalLink, ChevronDown, ChevronUp, Zap,
} from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Variant {
  id: string
  sku: string
  name: string
  priceMxn: number
  comparePriceMxn?: number | null
  stock: number
  attributes?: Record<string, string>
}

interface Product {
  id: string
  name: string
  description: string
  type: string
  status: string
  media: unknown
  variants: Variant[]
}

interface Order {
  id: string
  customerEmail: string
  customerName: string | null
  status: string
  totalMxn: number
  createdAt: string | Date
}

interface FunnelStep {
  id: string
  kind: "landing" | "checkout" | "upsell" | "downsell" | "thankyou"
  position: number
  pageId?: string | null
  settings?: Record<string, unknown> | null
}

interface Funnel {
  id: string
  name: string
  slug: string
  status: string
  steps?: FunnelStep[]
  createdAt: string | Date
}

interface SitePageOption {
  id: string
  name: string
  slug: string
}

interface EditableFunnelStep {
  id: string
  kind: FunnelStep["kind"]
  position: number
  pageId: string | null
  settings?: Record<string, unknown> | null
}

interface FunnelDraft {
  name: string
  slug: string
  steps: EditableFunnelStep[]
}

interface ExperimentDraft {
  name: string
  targetType: "page" | "funnel"
  pageId: string
  funnelId: string
  variantBPageId: string
  variantBFunnelId: string
  splitA: string
}

interface FunnelAnalyticsSummary {
  funnelId: string
  stepViews: number
  checkoutStarts: number
  checkoutPending: number
  checkoutFailed: number
  checkoutSuccess: number
  checkoutStartRate: number
  successRateFromViews: number
  successRateFromStarts: number
}

interface Experiment {
  id: string
  siteId: string
  pageId?: string | null
  funnelId?: string | null
  name: string
  status: "draft" | "active" | "archived"
  targetType: "page" | "funnel"
  trafficSplit: {
    a?: number
    b?: number
    variants?: {
      B?: {
        pageId?: string | null
        funnelId?: string | null
      }
    }
  }
}

interface ExperimentAnalyticsSummary {
  experimentId: string
  assignmentsA: number
  assignmentsB: number
  checkoutStartsA: number
  checkoutStartsB: number
  checkoutSuccessA: number
  checkoutSuccessB: number
  totalAssignments: number
  totalCheckoutStarts: number
  totalCheckoutSuccess: number
  checkoutStartRate: number
  successRateFromAssignments: number
  successRateFromStarts: number
}

interface EditableAutomationAction {
  type: AutomationActionType
  value: string
}

interface EditableAutomationCondition {
  field: string
  operator: AutomationConditionOperator
  value: string
}

interface Automation {
  id: string
  siteId: string
  name: string
  triggerType: AutomationTriggerType
  status: AutomationStatus
  actionGraph: AutomationGraph
}

interface AutomationDraft {
  name: string
  triggerType: AutomationTriggerType
  conditions: EditableAutomationCondition[]
  actions: EditableAutomationAction[]
}

interface AutomationRun {
  id: string
  siteId: string
  automationId: string
  triggerType: AutomationTriggerType
  payload: unknown
  result: "processed" | "skipped" | "failed"
  error?: string | null
  createdAt: string
}

interface NewVariantDraft {
  sku: string
  name: string
  priceMxn: string
  comparePriceMxn: string
  stock: string
  attributesText: string
}

interface AttributeEntry {
  key: string
  value: string
}

interface Props {
  siteId: string
  siteName: string
  initialProducts: Product[]
  initialOrders: Order[]
  initialFunnels: Funnel[]
  initialExperiments: Experiment[]
  initialAutomations: Automation[]
  initialAutomationRuns: AutomationRun[]
  funnelsReady: boolean
  experimentsReady: boolean
  automationsReady: boolean
  funnelAnalytics: Record<string, FunnelAnalyticsSummary>
  experimentAnalytics: Record<string, ExperimentAnalyticsSummary>
  availablePages: SitePageOption[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  physical: "Físico", digital: "Digital",
  subscription: "Suscripción", service: "Servicio",
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:    { label: "Borrador",  color: "text-slate-500 bg-white/[0.04]",      icon: <Clock size={10} /> },
  active:   { label: "Activo",    color: "text-emerald-400 bg-emerald-500/10",  icon: <CheckCircle size={10} /> },
  paused:   { label: "Pausada",   color: "text-amber-300 bg-amber-500/10",      icon: <Clock size={10} /> },
  archived: { label: "Archivado", color: "text-slate-600 bg-white/[0.03]",      icon: <XCircle size={10} /> },
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendiente",  color: "text-amber-400 bg-amber-400/10" },
  paid:      { label: "Pagado",     color: "text-emerald-400 bg-emerald-500/10" },
  fulfilled: { label: "Enviado",    color: "text-blue-400 bg-blue-500/10" },
  refunded:  { label: "Reembolsado",color: "text-orange-400 bg-orange-400/10" },
  canceled:  { label: "Cancelado",  color: "text-red-400 bg-red-500/10" },
}

const FUNNEL_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "text-slate-500 bg-white/[0.04]" },
  active: { label: "Activo", color: "text-emerald-400 bg-emerald-500/10" },
  archived: { label: "Archivado", color: "text-slate-600 bg-white/[0.03]" },
}

const FUNNEL_STEP_LABEL: Record<FunnelStep["kind"], string> = {
  landing: "Landing",
  checkout: "Checkout",
  upsell: "Upsell",
  downsell: "Downsell",
  thankyou: "Thank you",
}

const LOW_STOCK_THRESHOLD = 5

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
}

function getVariantStockState(stock: number) {
  if (stock <= 0) {
    return {
      label: "Agotado",
      className: "border border-red-500/20 bg-red-500/10 text-red-300",
    }
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: `Stock bajo (${stock})`,
      className: "border border-amber-500/20 bg-amber-500/10 text-amber-300",
    }
  }

  return {
    label: `Stock ok (${stock})`,
    className: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  }
}

function getAutomationActionValue(action: AutomationAction) {
  if (action.type === "tag_contact") return String(action.config?.tag ?? "")
  if (action.type === "set_contact_service") return String(action.config?.service ?? "")
  if (action.type === "email_contact") return String(action.config?.message ?? "")
  if (action.type === "append_order_note") return String(action.config?.note ?? "")
  if (action.type === "set_order_status") return String(action.config?.status ?? "")
  if (action.type === "set_record_workflow_status") return String(action.config?.status ?? "")
  return String(action.config?.to ?? "")
}

function buildAutomationActionGraph(
  triggerType: AutomationTriggerType,
  conditions: EditableAutomationCondition[],
  actions: EditableAutomationAction[]
): AutomationGraph {
  const fieldDefinitions = AUTOMATION_TRIGGER_FIELD_DEFS[triggerType]
  const normalizedConditions: AutomationCondition[] = conditions
    .map((condition) => ({
      field: condition.field,
      operator: condition.operator,
      value: condition.value.trim(),
    }))
    .filter((condition) => {
      if (!condition.field || !condition.value) return false
      const definition = fieldDefinitions.find((entry) => entry.field === condition.field)
      return Boolean(definition && definition.operators.includes(condition.operator))
    })

  const normalizedActions: AutomationAction[] = actions.map((action) => ({
    type: action.type,
    config: action.type === "tag_contact"
      ? { tag: action.value.trim() || "nuevo-lead" }
      : action.type === "set_contact_service"
        ? { service: action.value.trim() || "asesoria" }
        : action.type === "email_contact"
          ? {
            message: action.value.trim() || "Gracias por tu interes. Te contactaremos pronto.",
            subject: "Seguimiento de Orvenix",
          }
      : action.type === "append_order_note"
        ? { note: action.value.trim() || "checkout-track" }
        : action.type === "set_order_status"
          ? { status: action.value.trim() || "pending" }
          : action.type === "set_record_workflow_status"
            ? { status: action.value.trim() || "review" }
        : { to: action.value.trim() || undefined, subject: "Nueva automatización ejecutada" },
  }))

  return {
    conditions: normalizedConditions,
    actions: normalizedActions,
  }
}

function createDefaultAutomationCondition(triggerType: AutomationTriggerType): EditableAutomationCondition {
  const definition = AUTOMATION_TRIGGER_FIELD_DEFS[triggerType][0]
  return {
    field: definition?.field ?? "",
    operator: definition?.operators[0] ?? "equals",
    value: "",
  }
}

function getAutomationConditionDrafts(
  triggerType: AutomationTriggerType,
  graph: AutomationGraph
): EditableAutomationCondition[] {
  if (graph.conditions.length > 0) {
    return graph.conditions.map((condition) => ({
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
    }))
  }
  return [createDefaultAutomationCondition(triggerType)]
}

function getAutomationConditionLabel(condition: AutomationCondition) {
  const definition = Object.values(AUTOMATION_TRIGGER_FIELD_DEFS)
    .flat()
    .find((entry) => entry.field === condition.field)
  return definition?.label ?? condition.field
}

function getAutomationActionPlaceholder(type: AutomationActionType) {
  if (type === "append_order_note") return "checkout-track"
  if (type === "email_admin") return "admin@orvenix.com.mx"
  if (type === "tag_contact") return "nuevo-lead"
  if (type === "set_contact_service") return "branding | tienda | embudo"
  if (type === "email_contact") return "Gracias por tu interes. Te contactaremos pronto."
  if (type === "set_order_status") return "pending | paid | fulfilled"
  return "draft | review | published"
}

function getAutomationActionOptions(type: AutomationActionType) {
  if (type === "set_order_status") {
    return AUTOMATION_ORDER_STATUSES.map((status) => ({ value: status, label: status }))
  }
  if (type === "set_record_workflow_status") {
    return AUTOMATION_CMS_WORKFLOW_STATUSES.map((status) => ({ value: status, label: status }))
  }
  return null
}

function formatAutomationRunTime(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function getAutomationPayloadSummary(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Sin contexto adicional"
  const record = payload as Record<string, unknown>
  if (typeof record.customerEmail === "string" && record.customerEmail) {
    return `Cliente: ${record.customerEmail}`
  }
  if (typeof record.email === "string" && record.email) {
    return `Contacto: ${record.email}`
  }
  if (typeof record.collectionSlug === "string" && record.collectionSlug) {
    return `Colección: ${record.collectionSlug}`
  }
  if (typeof record.eventLabel === "string" && record.eventLabel) {
    return `Evento: ${record.eventLabel}`
  }
  return "Ejecución registrada"
}

function formatAttributes(attributes?: Record<string, string>) {
  if (!attributes || Object.keys(attributes).length === 0) return ""
  return Object.entries(attributes)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ")
}

function parseAttributesText(value: string) {
  const attributes: Record<string, string> = {}
  for (const chunk of value.split(",")) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    const separatorIndex = trimmed.indexOf(":")
    if (separatorIndex === -1) {
      attributes[trimmed] = ""
      continue
    }
    const key = trimmed.slice(0, separatorIndex).trim()
    const attrValue = trimmed.slice(separatorIndex + 1).trim()
    if (!key) continue
    attributes[key] = attrValue
  }
  return attributes
}

function parseAttributeEntries(value: string): AttributeEntry[] {
  const parsed = parseAttributesText(value)
  const entries = Object.entries(parsed).map(([key, attrValue]) => ({ key, value: attrValue }))
  return entries.length > 0 ? entries : [{ key: "", value: "" }]
}

function serializeAttributeEntries(entries: AttributeEntry[]) {
  return entries
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value.trim(),
    }))
    .filter((entry) => entry.key)
    .map((entry) => `${entry.key}:${entry.value}`)
    .join(", ")
}

function getPageForStep(step: FunnelStep | EditableFunnelStep, availablePages: SitePageOption[]) {
  if (!step.pageId) return null
  return availablePages.find((page) => page.id === step.pageId) ?? null
}

function getStepPublicPath(siteId: string, funnelId: string, step: FunnelStep["kind"], page: SitePageOption | null) {
  if (page) {
    return page.slug === "home"
      ? `/p/${encodeURIComponent(siteId)}?funnelId=${encodeURIComponent(funnelId)}&funnelStep=${encodeURIComponent(step)}`
      : `/p/${encodeURIComponent(siteId)}/${encodeURIComponent(page.slug)}?funnelId=${encodeURIComponent(funnelId)}&funnelStep=${encodeURIComponent(step)}`
  }

  return `/p/${encodeURIComponent(siteId)}/funnel/${encodeURIComponent(funnelId)}/${encodeURIComponent(step)}`
}

// ─── Formulario rápido de producto ───────────────────────────────────────────

function NewProductForm({ siteId, onCreated }: { siteId: string; onCreated: (p: Product) => void }) {
  const [name, setName]     = useState("")
  const [type, setType]     = useState("physical")
  const [price, setPrice]   = useState("")
  const [stock]             = useState("0")
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  const submit = async () => {
    if (!name.trim() || !price) return
    setSaving(true)
    setError("")
    try {
      // Crear producto
      const pRes = await fetch(`/api/store/${siteId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, media: [], metadata: {} }),
      })
      const { product } = await pRes.json() as { product: Product }

      // Crear variante por defecto
      await fetch(`/api/store/${siteId}/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku:      name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 20) + "-001",
          name:     "Default",
          priceMxn: Math.round(parseFloat(price) * 100),
          stock:    parseInt(stock, 10),
          attributes: {},
        }),
      })

      // Activar producto
      const updated = await fetch(`/api/store/${siteId}/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      })
      const { product: final } = await updated.json() as { product: Product }
      onCreated(final)
    } catch {
      setError("Error al crear el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 mb-6">
      <h3 className="text-sm font-semibold text-white mb-4">Nuevo producto</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="col-span-2">
          <label className="block text-[11px] text-slate-500 mb-1.5">Nombre</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Camiseta Orvenix"
            className="w-full h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1.5">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipo de producto"
            className="w-full h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none">
            {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1.5">Precio (MXN)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
            placeholder="299.00" min={0} step={0.01}
            className="w-full h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50" />
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={saving || !name.trim() || !price}
          className="h-8 px-4 rounded-lg bg-[#00b5f6] text-[#112540] text-sm font-bold hover:bg-[#00ceff] disabled:opacity-50 transition-colors">
          {saving ? "Creando..." : "Crear producto"}
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function StoreImpl({ siteId, siteName, initialProducts, initialOrders, initialFunnels, initialExperiments, initialAutomations, initialAutomationRuns, funnelsReady: initialFunnelsReady, experimentsReady: initialExperimentsReady, automationsReady: initialAutomationsReady, funnelAnalytics, experimentAnalytics, availablePages }: Props) {
  const [tab, setTab]           = useState<"products" | "orders" | "funnels" | "experiments" | "automations">("products")
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders]     = useState<Order[]>(initialOrders)
  const [funnels, setFunnels]   = useState<Funnel[]>(initialFunnels)
  const [experiments, setExperiments] = useState<Experiment[]>(initialExperiments)
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations)
  const [showForm, setShowForm] = useState(false)
  const [productQuery, setProductQuery] = useState("")
  const [productStatusFilter, setProductStatusFilter] = useState<"all" | "draft" | "active" | "archived">("all")
  const [productStockFilter, setProductStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
  const [productSort, setProductSort] = useState<"newest" | "name_asc" | "price_desc" | "stock_asc">("newest")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [variantDrafts, setVariantDrafts] = useState<Record<string, Variant>>({})
  const [variantAttributeDrafts, setVariantAttributeDrafts] = useState<Record<string, string>>({})
  const [newVariantDrafts, setNewVariantDrafts] = useState<Record<string, NewVariantDraft>>({})
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null)
  const [creatingVariantForProductId, setCreatingVariantForProductId] = useState<string | null>(null)
  const [inventoryError, setInventoryError] = useState("")
  const [funnelName, setFunnelName] = useState("")
  const [creatingFunnel, setCreatingFunnel] = useState(false)
  const [funnelsReady, setFunnelsReady] = useState(initialFunnelsReady)
  const [funnelError, setFunnelError] = useState("")
  const [experimentName, setExperimentName] = useState("")
  const [experimentTargetType, setExperimentTargetType] = useState<"page" | "funnel">("page")
  const [experimentPageId, setExperimentPageId] = useState("")
  const [experimentFunnelId, setExperimentFunnelId] = useState("")
  const [experimentVariantBPageId, setExperimentVariantBPageId] = useState("")
  const [experimentVariantBFunnelId, setExperimentVariantBFunnelId] = useState("")
  const [experimentSplitA, setExperimentSplitA] = useState("50")
  const [experimentsReady, setExperimentsReady] = useState(initialExperimentsReady)
  const [experimentError, setExperimentError] = useState("")
  const [creatingExperiment, setCreatingExperiment] = useState(false)
  const [automationName, setAutomationName] = useState("")
  const [automationTriggerType, setAutomationTriggerType] = useState<AutomationTriggerType>("store_checkout_started")
  const [automationConditions, setAutomationConditions] = useState<EditableAutomationCondition[]>([
    createDefaultAutomationCondition("store_checkout_started"),
  ])
  const [automationActions, setAutomationActions] = useState<EditableAutomationAction[]>([
    { type: "append_order_note", value: "" },
  ])
  const [automationError, setAutomationError] = useState("")
  const [creatingAutomation, setCreatingAutomation] = useState(false)
  const [automationsReady, setAutomationsReady] = useState(initialAutomationsReady)
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null)
  const [automationDrafts, setAutomationDrafts] = useState<Record<string, AutomationDraft>>({})
  const [savingAutomationId, setSavingAutomationId] = useState<string | null>(null)
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null)
  const [experimentDrafts, setExperimentDrafts] = useState<Record<string, ExperimentDraft>>({})
  const [savingExperimentId, setSavingExperimentId] = useState<string | null>(null)
  const [editingFunnelId, setEditingFunnelId] = useState<string | null>(null)
  const [funnelDrafts, setFunnelDrafts] = useState<Record<string, FunnelDraft>>({})
  const [savingFunnelId, setSavingFunnelId] = useState<string | null>(null)
  const automationNameMap = new Map(automations.map((automation) => [automation.id, automation.name]))

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este producto y sus variantes?")) return
    setDeletingId(id)
    await fetch(`/api/store/${siteId}/products/${id}`, { method: "DELETE" })
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
  }

  const toggleStatus = async (product: Product) => {
    const next = product.status === "active" ? "draft" : "active"
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: next } : p))
    await fetch(`/api/store/${siteId}/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    await fetch(`/api/store/${siteId}/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const totalRevenue = orders
    .filter((o) => o.status === "paid" || o.status === "fulfilled")
    .reduce((sum, o) => sum + o.totalMxn, 0)
  const lowStockVariants = products.reduce(
    (sum, product) => sum + product.variants.filter((variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD).length,
    0
  )
  const outOfStockVariants = products.reduce(
    (sum, product) => sum + product.variants.filter((variant) => variant.stock <= 0).length,
    0
  )
  const filteredProducts = products
    .filter((product) => {
      if (productStatusFilter !== "all" && product.status !== productStatusFilter) {
        return false
      }

      const matchesQuery = productQuery.trim()
        ? `${product.name} ${product.description} ${product.variants.map((variant) => `${variant.name} ${variant.sku}`).join(" ")}`
            .toLowerCase()
            .includes(productQuery.trim().toLowerCase())
        : true

      if (!matchesQuery) {
        return false
      }

      const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0)
      const hasLowStock = product.variants.some((variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD)
      const hasOutOfStock = product.variants.some((variant) => variant.stock <= 0)

      if (productStockFilter === "in_stock" && totalStock <= 0) return false
      if (productStockFilter === "low_stock" && !hasLowStock) return false
      if (productStockFilter === "out_of_stock" && !hasOutOfStock) return false

      return true
    })
    .sort((left, right) => {
      if (productSort === "name_asc") {
        return left.name.localeCompare(right.name, "es")
      }

      if (productSort === "price_desc") {
        const leftPrice = left.variants.length > 0 ? Math.max(...left.variants.map((variant) => variant.priceMxn)) : 0
        const rightPrice = right.variants.length > 0 ? Math.max(...right.variants.map((variant) => variant.priceMxn)) : 0
        return rightPrice - leftPrice
      }

      if (productSort === "stock_asc") {
        const leftStock = left.variants.reduce((sum, variant) => sum + variant.stock, 0)
        const rightStock = right.variants.reduce((sum, variant) => sum + variant.stock, 0)
        return leftStock - rightStock
      }

      return 0
    })

  const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const startEditingFunnel = (funnel: Funnel) => {
    setEditingFunnelId(funnel.id)
    setFunnelError("")
    setFunnelDrafts((prev) => ({
      ...prev,
      [funnel.id]: {
        name: funnel.name,
        slug: funnel.slug,
        steps: (funnel.steps ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((step, index) => ({
            id: step.id,
            kind: step.kind,
            position: index,
            pageId: step.pageId ?? null,
            settings: step.settings ?? {},
          })),
      },
    }))
  }

  const stopEditingFunnel = () => {
    setEditingFunnelId(null)
    setFunnelError("")
  }

  const updateFunnelDraft = (funnelId: string, patch: Partial<FunnelDraft>) => {
    setFunnelDrafts((prev) => {
      const current = prev[funnelId]
      if (!current) return prev
      return {
        ...prev,
        [funnelId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  const updateFunnelDraftStep = (
    funnelId: string,
    stepIndex: number,
    patch: Partial<EditableFunnelStep>
  ) => {
    setFunnelDrafts((prev) => {
      const current = prev[funnelId]
      if (!current) return prev
      const steps = current.steps.map((step, index) =>
        index === stepIndex ? { ...step, ...patch } : step
      )
      return {
        ...prev,
        [funnelId]: { ...current, steps },
      }
    })
  }

  const addFunnelDraftStep = (funnelId: string) => {
    setFunnelDrafts((prev) => {
      const current = prev[funnelId]
      if (!current) return prev
      return {
        ...prev,
        [funnelId]: {
          ...current,
          steps: [
            ...current.steps,
            {
              id: `draft-${Date.now()}`,
              kind: "landing",
              position: current.steps.length,
              pageId: null,
              settings: {},
            },
          ],
        },
      }
    })
  }

  const removeFunnelDraftStep = (funnelId: string, stepIndex: number) => {
    setFunnelDrafts((prev) => {
      const current = prev[funnelId]
      if (!current) return prev
      return {
        ...prev,
        [funnelId]: {
          ...current,
          steps: current.steps
            .filter((_, index) => index !== stepIndex)
            .map((step, index) => ({ ...step, position: index })),
        },
      }
    })
  }

  const saveFunnelDraft = async (funnel: Funnel) => {
    const draft = funnelDrafts[funnel.id]
    if (!draft) return

    if (!draft.name.trim() || !draft.slug.trim()) {
      setFunnelError("Cada funnel necesita nombre y slug.")
      return
    }

    setSavingFunnelId(funnel.id)
    setFunnelError("")
    try {
      const res = await fetch(`/api/store/${siteId}/funnels/${funnel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          slug: slugify(draft.slug),
          steps: draft.steps.map((step, index) => ({
            pageId: step.pageId || null,
            kind: step.kind,
            position: index,
            settings: step.settings ?? {},
          })),
        }),
      })

      const data = await res.json() as { funnel?: Funnel; error?: string; message?: string }
      if (!res.ok || !data.funnel) {
        setFunnelError(data.message ?? data.error ?? "No se pudo guardar el funnel.")
        return
      }

      setFunnels((prev) => prev.map((item) => item.id === funnel.id ? data.funnel! : item))
      setEditingFunnelId(null)
    } catch {
      setFunnelError("No se pudo guardar el funnel.")
    } finally {
      setSavingFunnelId(null)
    }
  }

  const createBaseFunnel = async () => {
    if (!funnelName.trim()) return
    setCreatingFunnel(true)
    setFunnelError("")
    try {
      const name = funnelName.trim()
      const res = await fetch(`/api/store/${siteId}/funnels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slugify(name),
          status: "draft",
          settings: { goal: "conversion" },
          steps: [
            { kind: "landing", position: 0, settings: { headline: "Landing principal" } },
            { kind: "checkout", position: 1, settings: { checkoutMode: "store" } },
            { kind: "thankyou", position: 2, settings: { message: "Gracias por tu compra" } },
          ],
        }),
      })

      const data = await res.json() as { funnel?: Funnel; error?: string; message?: string }
      if (!res.ok || !data.funnel) {
        setFunnelsReady(res.status !== 503 ? funnelsReady : false)
        setFunnelError(data.message ?? data.error ?? "No se pudo crear el funnel.")
        return
      }

      setFunnelsReady(true)
      setFunnels((prev) => [data.funnel!, ...prev])
      setFunnelName("")
    } catch {
      setFunnelError("No se pudo crear el funnel.")
    } finally {
      setCreatingFunnel(false)
    }
  }

  const updateFunnelStatus = async (funnelId: string, status: string) => {
    setFunnels((prev) => prev.map((funnel) => funnel.id === funnelId ? { ...funnel, status } : funnel))
    await fetch(`/api/store/${siteId}/funnels/${funnelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const removeFunnel = async (funnelId: string) => {
    if (!confirm("¿Eliminar este funnel?")) return
    await fetch(`/api/store/${siteId}/funnels/${funnelId}`, { method: "DELETE" })
    setFunnels((prev) => prev.filter((funnel) => funnel.id !== funnelId))
  }

  const createExperimentDraft = async () => {
    if (!experimentName.trim()) return
    if (experimentTargetType === "page" && !experimentPageId) {
      setExperimentError("Selecciona la pagina base de la variante A.")
      return
    }
    if (experimentTargetType === "funnel" && !experimentFunnelId) {
      setExperimentError("Selecciona el funnel base de la variante A.")
      return
    }
    setCreatingExperiment(true)
    setExperimentError("")
    try {
      const splitA = Math.max(1, Math.min(99, Number(experimentSplitA) || 50))
      const splitB = 100 - splitA
      const res = await fetch(`/api/store/${siteId}/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: experimentName.trim(),
          targetType: experimentTargetType,
          pageId: experimentTargetType === "page" ? (experimentPageId || null) : null,
          funnelId: experimentTargetType === "funnel" ? (experimentFunnelId || null) : null,
          status: "draft",
          trafficSplit: {
            a: splitA,
            b: splitB,
            variants: {
              B: experimentTargetType === "page"
                ? { pageId: experimentVariantBPageId || null }
                : { funnelId: experimentVariantBFunnelId || null },
            },
          },
        }),
      })
      const data = await res.json() as { experiment?: Experiment; error?: string; message?: string }
      if (!res.ok || !data.experiment) {
        setExperimentsReady(res.status !== 503 ? experimentsReady : false)
        setExperimentError(data.message ?? data.error ?? "No se pudo crear el experimento.")
        return
      }

      setExperimentsReady(true)
      setExperiments((prev) => [data.experiment!, ...prev])
      setExperimentName("")
      setExperimentPageId("")
      setExperimentFunnelId("")
      setExperimentVariantBPageId("")
      setExperimentVariantBFunnelId("")
      setExperimentSplitA("50")
    } catch {
      setExperimentError("No se pudo crear el experimento.")
    } finally {
      setCreatingExperiment(false)
    }
  }

  const updateExperimentStatus = async (experimentId: string, status: Experiment["status"]) => {
    setExperiments((prev) => prev.map((experiment) => experiment.id === experimentId ? { ...experiment, status } : experiment))
    await fetch(`/api/store/${siteId}/experiments/${experimentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const startEditingExperiment = (experiment: Experiment) => {
    setEditingExperimentId(experiment.id)
    setExperimentError("")
    setExperimentDrafts((prev) => ({
      ...prev,
      [experiment.id]: {
        name: experiment.name,
        targetType: experiment.targetType,
        pageId: experiment.pageId ?? "",
        funnelId: experiment.funnelId ?? "",
        variantBPageId: experiment.trafficSplit?.variants?.B?.pageId ?? "",
        variantBFunnelId: experiment.trafficSplit?.variants?.B?.funnelId ?? "",
        splitA: String(Number(experiment.trafficSplit?.a) || 50),
      },
    }))
  }

  const stopEditingExperiment = () => {
    setEditingExperimentId(null)
    setExperimentError("")
  }

  const updateExperimentDraft = (experimentId: string, patch: Partial<ExperimentDraft>) => {
    setExperimentDrafts((prev) => {
      const current = prev[experimentId]
      if (!current) return prev
      return {
        ...prev,
        [experimentId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  const saveExperimentDraft = async (experiment: Experiment) => {
    const draft = experimentDrafts[experiment.id]
    if (!draft) return
    if (!draft.name.trim()) {
      setExperimentError("Cada experimento necesita nombre.")
      return
    }
    if (draft.targetType === "page" && !draft.pageId) {
      setExperimentError("Selecciona la pagina base de la variante A.")
      return
    }
    if (draft.targetType === "funnel" && !draft.funnelId) {
      setExperimentError("Selecciona el funnel base de la variante A.")
      return
    }

    setSavingExperimentId(experiment.id)
    setExperimentError("")
    try {
      const splitA = Math.max(1, Math.min(99, Number(draft.splitA) || 50))
      const splitB = 100 - splitA
      const res = await fetch(`/api/store/${siteId}/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          targetType: draft.targetType,
          pageId: draft.targetType === "page" ? (draft.pageId || null) : null,
          funnelId: draft.targetType === "funnel" ? (draft.funnelId || null) : null,
          trafficSplit: {
            a: splitA,
            b: splitB,
            variants: {
              B: draft.targetType === "page"
                ? { pageId: draft.variantBPageId || null }
                : { funnelId: draft.variantBFunnelId || null },
            },
          },
        }),
      })

      const data = await res.json() as { experiment?: Experiment; error?: string; message?: string }
      if (!res.ok || !data.experiment) {
        setExperimentError(data.message ?? data.error ?? "No se pudo guardar el experimento.")
        return
      }

      setExperiments((prev) => prev.map((item) => item.id === experiment.id ? data.experiment! : item))
      setEditingExperimentId(null)
    } catch {
      setExperimentError("No se pudo guardar el experimento.")
    } finally {
      setSavingExperimentId(null)
    }
  }

  const removeExperiment = async (experimentId: string) => {
    if (!confirm("¿Eliminar este experimento?")) return
    await fetch(`/api/store/${siteId}/experiments/${experimentId}`, { method: "DELETE" })
    setExperiments((prev) => prev.filter((experiment) => experiment.id !== experimentId))
  }

  const createAutomationDraft = async () => {
    if (!automationName.trim()) return
    setCreatingAutomation(true)
    setAutomationError("")
    try {
      const actionGraph = buildAutomationActionGraph(automationTriggerType, automationConditions, automationActions)
      const res = await fetch(`/api/store/${siteId}/automations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: automationName.trim(),
          triggerType: automationTriggerType,
          status: "draft",
          actionGraph,
        }),
      })
      const data = await res.json() as { automation?: Automation; error?: string; message?: string }
      if (!res.ok || !data.automation) {
        setAutomationsReady(res.status !== 503 ? automationsReady : false)
        setAutomationError(data.message ?? data.error ?? "No se pudo crear la automatización.")
        return
      }

      setAutomationsReady(true)
      setAutomations((prev) => [data.automation!, ...prev])
      setAutomationName("")
      setAutomationConditions([createDefaultAutomationCondition(automationTriggerType)])
      setAutomationActions([{ type: "append_order_note", value: "" }])
    } catch {
      setAutomationError("No se pudo crear la automatización.")
    } finally {
      setCreatingAutomation(false)
    }
  }

  const updateCreateAutomationAction = (index: number, patch: Partial<EditableAutomationAction>) => {
    setAutomationActions((prev) => prev.map((action, actionIndex) => actionIndex === index ? { ...action, ...patch } : action))
  }

  const updateCreateAutomationCondition = (index: number, patch: Partial<EditableAutomationCondition>) => {
    setAutomationConditions((prev) => prev.map((condition, conditionIndex) => {
      if (conditionIndex !== index) return condition
      const next = { ...condition, ...patch }
      if (patch.field) {
        const definition = AUTOMATION_TRIGGER_FIELD_DEFS[automationTriggerType].find((entry) => entry.field === patch.field)
        if (definition && !definition.operators.includes(next.operator)) {
          next.operator = definition.operators[0]
        }
      }
      return next
    }))
  }

  const addCreateAutomationCondition = () => {
    setAutomationConditions((prev) => [...prev, createDefaultAutomationCondition(automationTriggerType)])
  }

  const removeCreateAutomationCondition = (index: number) => {
    setAutomationConditions((prev) => prev.length <= 1 ? prev : prev.filter((_, conditionIndex) => conditionIndex !== index))
  }

  const addCreateAutomationAction = () => {
    setAutomationActions((prev) => [...prev, { type: "append_order_note", value: "" }])
  }

  const removeCreateAutomationAction = (index: number) => {
    setAutomationActions((prev) => prev.length <= 1 ? prev : prev.filter((_, actionIndex) => actionIndex !== index))
  }

  const updateAutomationStatus = async (automationId: string, status: Automation["status"]) => {
    setAutomations((prev) => prev.map((automation) => automation.id === automationId ? { ...automation, status } : automation))
    await fetch(`/api/store/${siteId}/automations/${automationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  const removeAutomation = async (automationId: string) => {
    if (!confirm("¿Eliminar esta automatización?")) return
    await fetch(`/api/store/${siteId}/automations/${automationId}`, { method: "DELETE" })
    setAutomations((prev) => prev.filter((automation) => automation.id !== automationId))
  }

  const startEditingAutomation = (automation: Automation) => {
    setEditingAutomationId(automation.id)
    setAutomationError("")
    setAutomationDrafts((prev) => ({
      ...prev,
      [automation.id]: {
        name: automation.name,
        triggerType: automation.triggerType,
        conditions: getAutomationConditionDrafts(automation.triggerType, automation.actionGraph),
        actions: automation.actionGraph.actions.length > 0
          ? automation.actionGraph.actions.map((action) => ({ type: action.type, value: getAutomationActionValue(action) }))
          : [{ type: "append_order_note", value: "" }],
      },
    }))
  }

  const stopEditingAutomation = () => {
    setEditingAutomationId(null)
    setAutomationError("")
  }

  const updateAutomationDraft = (automationId: string, patch: Partial<AutomationDraft>) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  const updateAutomationDraftAction = (automationId: string, index: number, patch: Partial<EditableAutomationAction>) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          actions: current.actions.map((action, actionIndex) => actionIndex === index ? { ...action, ...patch } : action),
        },
      }
    })
  }

  const updateAutomationDraftCondition = (automationId: string, index: number, patch: Partial<EditableAutomationCondition>) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          conditions: current.conditions.map((condition, conditionIndex) => {
            if (conditionIndex !== index) return condition
            const next = { ...condition, ...patch }
            if (patch.field) {
              const definition = AUTOMATION_TRIGGER_FIELD_DEFS[current.triggerType].find((entry) => entry.field === patch.field)
              if (definition && !definition.operators.includes(next.operator)) {
                next.operator = definition.operators[0]
              }
            }
            return next
          }),
        },
      }
    })
  }

  const addAutomationDraftCondition = (automationId: string) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          conditions: [...current.conditions, createDefaultAutomationCondition(current.triggerType)],
        },
      }
    })
  }

  const removeAutomationDraftCondition = (automationId: string, index: number) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current || current.conditions.length <= 1) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          conditions: current.conditions.filter((_, conditionIndex) => conditionIndex !== index),
        },
      }
    })
  }

  const addAutomationDraftAction = (automationId: string) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          actions: [...current.actions, { type: "append_order_note", value: "" }],
        },
      }
    })
  }

  const removeAutomationDraftAction = (automationId: string, index: number) => {
    setAutomationDrafts((prev) => {
      const current = prev[automationId]
      if (!current || current.actions.length <= 1) return prev
      return {
        ...prev,
        [automationId]: {
          ...current,
          actions: current.actions.filter((_, actionIndex) => actionIndex !== index),
        },
      }
    })
  }

  const saveAutomationDraft = async (automation: Automation) => {
    const draft = automationDrafts[automation.id]
    if (!draft) return
    if (!draft.name.trim()) {
      setAutomationError("Cada automatización necesita nombre.")
      return
    }

    setSavingAutomationId(automation.id)
    setAutomationError("")
    try {
      const res = await fetch(`/api/store/${siteId}/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          triggerType: draft.triggerType,
          actionGraph: buildAutomationActionGraph(draft.triggerType, draft.conditions, draft.actions),
        }),
      })
      const data = await res.json() as { automation?: Automation; error?: string; message?: string }
      if (!res.ok || !data.automation) {
        setAutomationError(data.message ?? data.error ?? "No se pudo guardar la automatización.")
        return
      }

      setAutomations((prev) => prev.map((item) => item.id === automation.id ? data.automation! : item))
      setEditingAutomationId(null)
    } catch {
      setAutomationError("No se pudo guardar la automatización.")
    } finally {
      setSavingAutomationId(null)
    }
  }

  const startEditingProductInventory = (product: Product) => {
    setExpandedProductId((current) => current === product.id ? null : product.id)
    setInventoryError("")
    setVariantDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries(product.variants.map((variant) => [variant.id, { ...variant }])),
    }))
    setVariantAttributeDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries(product.variants.map((variant) => [variant.id, formatAttributes(variant.attributes)])),
    }))
    setNewVariantDrafts((prev) => ({
      ...prev,
      [product.id]: prev[product.id] ?? {
        sku: "",
        name: "",
        priceMxn: "",
        comparePriceMxn: "",
        stock: "0",
        attributesText: "",
      },
    }))
  }

  const updateVariantDraft = (variantId: string, patch: Partial<Variant>) => {
    setVariantDrafts((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] ?? {
          id: variantId,
          sku: "",
          name: "",
          priceMxn: 0,
          comparePriceMxn: null,
          stock: 0,
          attributes: {},
        }),
        ...patch,
      },
    }))
  }

  const saveVariantDraft = async (productId: string, variantId: string) => {
    const draft = variantDrafts[variantId]
    if (!draft) return

    setSavingVariantId(variantId)
    setInventoryError("")
    try {
      const res = await fetch(`/api/store/${siteId}/products/${productId}/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: draft.sku,
          name: draft.name,
          priceMxn: draft.priceMxn,
          comparePriceMxn: draft.comparePriceMxn ?? null,
          stock: draft.stock,
          attributes: parseAttributesText(variantAttributeDrafts[variantId] ?? ""),
        }),
      })
      const data = await res.json() as { variant?: Variant; error?: string }
      if (!res.ok || !data.variant) {
        setInventoryError(data.error ?? "No se pudo guardar la variante.")
        return
      }

      setProducts((prev) => prev.map((product) => product.id !== productId ? product : {
        ...product,
        variants: product.variants.map((variant) => variant.id === variantId ? data.variant! : variant),
      }))
      setVariantAttributeDrafts((prev) => ({
        ...prev,
        [variantId]: formatAttributes(data.variant.attributes),
      }))
    } catch {
      setInventoryError("No se pudo guardar la variante.")
    } finally {
      setSavingVariantId(null)
    }
  }

  const deleteVariant = async (productId: string, variantId: string) => {
    if (!confirm("¿Eliminar esta variante?")) return
    setInventoryError("")
    await fetch(`/api/store/${siteId}/products/${productId}/variants/${variantId}`, { method: "DELETE" })
    setProducts((prev) => prev.map((product) => product.id !== productId ? product : {
      ...product,
      variants: product.variants.filter((variant) => variant.id !== variantId),
    }))
  }

  const updateNewVariantDraft = (productId: string, patch: Partial<NewVariantDraft>) => {
    setNewVariantDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? {
          sku: "",
          name: "",
          priceMxn: "",
          comparePriceMxn: "",
          stock: "0",
          attributesText: "",
        }),
        ...patch,
      },
    }))
  }

  const updateVariantAttributeRow = (variantId: string, rowIndex: number, patch: Partial<AttributeEntry>) => {
    const entries = parseAttributeEntries(variantAttributeDrafts[variantId] ?? "")
    const next = entries.map((entry, index) => index === rowIndex ? { ...entry, ...patch } : entry)
    setVariantAttributeDrafts((prev) => ({
      ...prev,
      [variantId]: serializeAttributeEntries(next),
    }))
  }

  const addVariantAttributeRow = (variantId: string) => {
    const entries = parseAttributeEntries(variantAttributeDrafts[variantId] ?? "")
    setVariantAttributeDrafts((prev) => ({
      ...prev,
      [variantId]: serializeAttributeEntries([...entries, { key: "", value: "" }]),
    }))
  }

  const removeVariantAttributeRow = (variantId: string, rowIndex: number) => {
    const entries = parseAttributeEntries(variantAttributeDrafts[variantId] ?? "")
    const next = entries.filter((_, index) => index !== rowIndex)
    setVariantAttributeDrafts((prev) => ({
      ...prev,
      [variantId]: serializeAttributeEntries(next.length > 0 ? next : [{ key: "", value: "" }]),
    }))
  }

  const updateNewVariantAttributeRow = (productId: string, rowIndex: number, patch: Partial<AttributeEntry>) => {
    const entries = parseAttributeEntries(newVariantDrafts[productId]?.attributesText ?? "")
    const next = entries.map((entry, index) => index === rowIndex ? { ...entry, ...patch } : entry)
    updateNewVariantDraft(productId, { attributesText: serializeAttributeEntries(next) })
  }

  const addNewVariantAttributeRow = (productId: string) => {
    const entries = parseAttributeEntries(newVariantDrafts[productId]?.attributesText ?? "")
    updateNewVariantDraft(productId, { attributesText: serializeAttributeEntries([...entries, { key: "", value: "" }]) })
  }

  const removeNewVariantAttributeRow = (productId: string, rowIndex: number) => {
    const entries = parseAttributeEntries(newVariantDrafts[productId]?.attributesText ?? "")
    const next = entries.filter((_, index) => index !== rowIndex)
    updateNewVariantDraft(productId, {
      attributesText: serializeAttributeEntries(next.length > 0 ? next : [{ key: "", value: "" }]),
    })
  }

  const createVariant = async (productId: string) => {
    const draft = newVariantDrafts[productId]
    if (!draft?.sku.trim() || !draft.name.trim() || !draft.priceMxn.trim()) {
      setInventoryError("La nueva variante necesita SKU, nombre y precio.")
      return
    }

    setCreatingVariantForProductId(productId)
    setInventoryError("")
    try {
      const res = await fetch(`/api/store/${siteId}/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: draft.sku.trim(),
          name: draft.name.trim(),
          priceMxn: Number(draft.priceMxn) || 0,
          comparePriceMxn: draft.comparePriceMxn.trim() ? Number(draft.comparePriceMxn) || 0 : undefined,
          stock: Number(draft.stock) || 0,
          attributes: parseAttributesText(draft.attributesText),
        }),
      })
      const data = await res.json() as { variant?: Variant; error?: string }
      if (!res.ok || !data.variant) {
        setInventoryError(data.error ?? "No se pudo crear la variante.")
        return
      }

      setProducts((prev) => prev.map((product) => product.id !== productId ? product : {
        ...product,
        variants: [...product.variants, data.variant!],
      }))
      setVariantDrafts((prev) => ({ ...prev, [data.variant!.id]: data.variant! }))
      setVariantAttributeDrafts((prev) => ({ ...prev, [data.variant!.id]: formatAttributes(data.variant!.attributes) }))
      setNewVariantDrafts((prev) => ({
        ...prev,
        [productId]: {
          sku: "",
          name: "",
          priceMxn: "",
          comparePriceMxn: "",
          stock: "0",
          attributesText: "",
        },
      }))
    } catch {
      setInventoryError("No se pudo crear la variante.")
    } finally {
      setCreatingVariantForProductId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package size={18} className="text-[#00b5f6]" />
              <h1 className="text-xl font-bold text-white">Tienda — {siteName}</h1>
            </div>
            <p className="text-sm text-slate-500">
              {products.length} productos · {orders.length} pedidos · {formatMxn(totalRevenue)} ingresos
            </p>
            {(lowStockVariants > 0 || outOfStockVariants > 0) && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {lowStockVariants > 0 && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 font-semibold text-amber-300">
                    {lowStockVariants} variante{lowStockVariants !== 1 ? "s" : ""} con stock bajo
                  </span>
                )}
                {outOfStockVariants > 0 && (
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 font-semibold text-red-300">
                    {outOfStockVariants} variante{outOfStockVariants !== 1 ? "s" : ""} agotada{outOfStockVariants !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
          {tab === "products" && (
            <button type="button" onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#00b5f6]/15 border border-[#00b5f6]/30 text-[#00b5f6] text-sm font-semibold hover:bg-[#00b5f6]/25 transition-colors">
              <Plus size={14} /> Nuevo producto
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 w-fit">
        {([["products", "Productos", Package], ["orders", "Pedidos", ShoppingCart], ["funnels", "Funnels", Workflow], ["experiments", "Experimentos", CheckCircle], ["automations", "Automatizaciones", Zap]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-lg text-sm font-semibold transition-colors ${
              tab === id ? "bg-[#00b5f6]/20 text-[#00b5f6]" : "text-slate-500 hover:text-slate-300"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Productos */}
      {tab === "products" && (
        <>
          {showForm && (
            <NewProductForm
              siteId={siteId}
              onCreated={(p) => { setProducts((prev) => [p, ...prev]); setShowForm(false) }}
            />
          )}

          <div className="mb-4 grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1.5 block text-[11px] text-slate-500">Buscar producto o variante</label>
              <input
                type="text"
                value={productQuery}
                onChange={(event) => setProductQuery(event.target.value)}
                placeholder="Ej: camiseta, negro, SKU..."
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] text-slate-500">Estado</label>
              <select
                value={productStatusFilter}
                onChange={(event) => setProductStatusFilter(event.target.value as typeof productStatusFilter)}
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="draft">Borrador</option>
                <option value="archived">Archivados</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] text-slate-500">Stock</label>
              <select
                value={productStockFilter}
                onChange={(event) => setProductStockFilter(event.target.value as typeof productStockFilter)}
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="in_stock">Con stock</option>
                <option value="low_stock">Stock bajo</option>
                <option value="out_of_stock">Agotados</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] text-slate-500">Ordenar</label>
              <select
                value={productSort}
                onChange={(event) => setProductSort(event.target.value as typeof productSort)}
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
              >
                <option value="newest">Más recientes</option>
                <option value="name_asc">Nombre A-Z</option>
                <option value="price_desc">Mayor precio</option>
                <option value="stock_asc">Menor stock</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
              <Package size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-500 mb-1">
                {products.length === 0 ? "Sin productos" : "Sin resultados con esos filtros"}
              </p>
              <p className="text-xs text-slate-600">
                {products.length === 0 ? "Crea tu primer producto para empezar a vender" : "Ajusta búsqueda, estado o stock para ver más productos."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((product) => {
                const st = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft
                const media = Array.isArray(product.media) ? product.media as string[] : []
                const minPrice = product.variants.length > 0
                  ? Math.min(...product.variants.map((v) => v.priceMxn))
                  : null
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
                const hasOutOfStock = product.variants.some((variant) => variant.stock <= 0)
                const hasLowStock = product.variants.some((variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD)

                return (
                  <div key={product.id}
                    className={`group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.10] transition-all ${deletingId === product.id ? "opacity-50" : ""}`}>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] shrink-0 overflow-hidden grid place-items-center">
                      {media[0]
                        ? <Image unoptimized width={48} height={48} src={media[0]} alt={product.name} className="w-full h-full object-cover" />
                        : <Package size={20} className="text-slate-700" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white truncate">{product.name}</span>
                        <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[9px] font-bold ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                        {hasOutOfStock && (
                          <span className="inline-flex h-5 items-center rounded-full border border-red-500/20 bg-red-500/10 px-1.5 text-[9px] font-bold text-red-300">
                            Agotado
                          </span>
                        )}
                        {!hasOutOfStock && hasLowStock && (
                          <span className="inline-flex h-5 items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 text-[9px] font-bold text-amber-300">
                            Stock bajo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1"><Tag size={9} /> {TYPE_LABEL[product.type] ?? product.type}</span>
                        {minPrice !== null && <span className="text-emerald-400/80 font-semibold">{formatMxn(minPrice)}</span>}
                        <span>{product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}</span>
                        <span>{totalStock} en stock</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => startEditingProductInventory(product)}
                        className="flex h-7 items-center gap-1 rounded-lg px-2 text-slate-600 hover:bg-white/[0.04] hover:text-white transition-colors">
                        {expandedProductId === product.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span className="text-[11px] font-semibold">Variantes</span>
                      </button>
                      <button type="button" onClick={() => toggleStatus(product)}
                        title={product.status === "active" ? "Desactivar" : "Activar"}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:text-[#00b5f6] hover:bg-[#00b5f6]/10 transition-colors">
                        {product.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button type="button" onClick={() => deleteProduct(product.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {expandedProductId === product.id && (
                      <div className="mt-3 rounded-2xl border border-white/[0.06] bg-black/10 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">Inventario y variantes</h4>
                          <span className="text-[11px] text-slate-500">
                            {product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {inventoryError && (
                          <p className="mb-3 text-xs text-amber-300">{inventoryError}</p>
                        )}
                        <div className="space-y-3">
                          {product.variants.map((variant) => {
                            const draft = variantDrafts[variant.id] ?? variant
                            const stockState = getVariantStockState(draft.stock)
                            return (
                              <div key={variant.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                <div className="mb-3 flex items-center justify-between">
                                  <span className="text-sm font-semibold text-white">{draft.name || "Variante"}</span>
                                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${stockState.className}`}>
                                    {stockState.label}
                                  </span>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                  <div>
                                    <label className="mb-1.5 block text-[11px] text-slate-500">SKU</label>
                                    <input
                                      type="text"
                                      value={draft.sku}
                                      onChange={(event) => updateVariantDraft(variant.id, { sku: event.target.value })}
                                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                                    <input
                                      type="text"
                                      value={draft.name}
                                      onChange={(event) => updateVariantDraft(variant.id, { name: event.target.value })}
                                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-[11px] text-slate-500">Precio</label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={100}
                                      value={draft.priceMxn}
                                      onChange={(event) => updateVariantDraft(variant.id, { priceMxn: Number(event.target.value) || 0 })}
                                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-[11px] text-slate-500">Precio anterior</label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={100}
                                      value={draft.comparePriceMxn ?? ""}
                                      onChange={(event) => updateVariantDraft(variant.id, {
                                        comparePriceMxn: event.target.value ? Number(event.target.value) || 0 : null,
                                      })}
                                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-[11px] text-slate-500">Stock</label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={draft.stock}
                                      onChange={(event) => updateVariantDraft(variant.id, { stock: Number(event.target.value) || 0 })}
                                      className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <div className="mb-1.5 flex items-center justify-between">
                                    <label className="block text-[11px] text-slate-500">Atributos</label>
                                    <button
                                      type="button"
                                      onClick={() => addVariantAttributeRow(variant.id)}
                                      className="text-[11px] font-semibold text-[#00b5f6] hover:text-[#33d1ff]"
                                    >
                                      + atributo
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {parseAttributeEntries(variantAttributeDrafts[variant.id] ?? "").map((entry, rowIndex) => (
                                      <div key={`${variant.id}-attr-${rowIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_40px]">
                                        <input
                                          type="text"
                                          value={entry.key}
                                          onChange={(event) => updateVariantAttributeRow(variant.id, rowIndex, { key: event.target.value })}
                                          placeholder="Clave"
                                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                        />
                                        <input
                                          type="text"
                                          value={entry.value}
                                          onChange={(event) => updateVariantAttributeRow(variant.id, rowIndex, { value: event.target.value })}
                                          placeholder="Valor"
                                          className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeVariantAttributeRow(variant.id, rowIndex)}
                                          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-red-400/10 hover:text-red-400"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => deleteVariant(product.id, variant.id)}
                                    className="h-8 rounded-lg border border-red-500/20 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                                  >
                                    Eliminar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveVariantDraft(product.id, variant.id)}
                                    disabled={savingVariantId === variant.id}
                                    className="h-8 rounded-lg bg-[#00b5f6] px-3 text-xs font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
                                  >
                                    {savingVariantId === variant.id ? "Guardando..." : "Guardar variante"}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-4">
                          <h5 className="mb-3 text-sm font-semibold text-white">Nueva variante</h5>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <div>
                              <label className="mb-1.5 block text-[11px] text-slate-500">SKU</label>
                              <input
                                type="text"
                                value={newVariantDrafts[product.id]?.sku ?? ""}
                                onChange={(event) => updateNewVariantDraft(product.id, { sku: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                              <input
                                type="text"
                                value={newVariantDrafts[product.id]?.name ?? ""}
                                onChange={(event) => updateNewVariantDraft(product.id, { name: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] text-slate-500">Precio</label>
                              <input
                                type="number"
                                min={0}
                                step={100}
                                value={newVariantDrafts[product.id]?.priceMxn ?? ""}
                                onChange={(event) => updateNewVariantDraft(product.id, { priceMxn: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] text-slate-500">Precio anterior</label>
                              <input
                                type="number"
                                min={0}
                                step={100}
                                value={newVariantDrafts[product.id]?.comparePriceMxn ?? ""}
                                onChange={(event) => updateNewVariantDraft(product.id, { comparePriceMxn: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[11px] text-slate-500">Stock</label>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={newVariantDrafts[product.id]?.stock ?? "0"}
                                onChange={(event) => updateNewVariantDraft(product.id, { stock: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1.5 flex items-center justify-between">
                              <label className="block text-[11px] text-slate-500">Atributos</label>
                              <button
                                type="button"
                                onClick={() => addNewVariantAttributeRow(product.id)}
                                className="text-[11px] font-semibold text-[#00b5f6] hover:text-[#33d1ff]"
                              >
                                + atributo
                              </button>
                            </div>
                            <div className="space-y-2">
                              {parseAttributeEntries(newVariantDrafts[product.id]?.attributesText ?? "").map((entry, rowIndex) => (
                                <div key={`${product.id}-new-attr-${rowIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_40px]">
                                  <input
                                    type="text"
                                    value={entry.key}
                                    onChange={(event) => updateNewVariantAttributeRow(product.id, rowIndex, { key: event.target.value })}
                                    placeholder="Clave"
                                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                  />
                                  <input
                                    type="text"
                                    value={entry.value}
                                    onChange={(event) => updateNewVariantAttributeRow(product.id, rowIndex, { value: event.target.value })}
                                    placeholder="Valor"
                                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeNewVariantAttributeRow(product.id, rowIndex)}
                                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-red-400/10 hover:text-red-400"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => createVariant(product.id)}
                              disabled={creatingVariantForProductId === product.id}
                              className="h-8 rounded-lg bg-[#00b5f6] px-3 text-xs font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
                            >
                              {creatingVariantForProductId === product.id ? "Creando..." : "Agregar variante"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === "funnels" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Workflow size={16} className="text-[#00b5f6]" />
              <h3 className="text-sm font-semibold text-white">Funnels de conversión</h3>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Base inicial para landings, checkout, upsells y thank-you pages conectadas a la tienda.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={funnelName}
                onChange={(e) => setFunnelName(e.target.value)}
                placeholder="Ej: Funnel lanzamiento Q3"
                className="h-9 min-w-[260px] flex-1 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
              />
              <button
                type="button"
                onClick={createBaseFunnel}
                disabled={creatingFunnel || !funnelName.trim()}
                className="h-9 px-4 rounded-lg bg-[#00b5f6] text-[#112540] text-sm font-bold hover:bg-[#00ceff] disabled:opacity-50 transition-colors"
              >
                {creatingFunnel ? "Creando..." : "Crear funnel base"}
              </button>
            </div>
            {funnelError && (
              <p className="mt-3 text-xs text-amber-300">{funnelError}</p>
            )}
            {!funnelsReady && (
              <p className="mt-3 text-xs text-slate-500">
                Si ves este aviso, falta aplicar el schema nuevo de funnels en la base antes de usarlos realmente.
              </p>
            )}
          </div>

          {funnels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
              <Workflow size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-500 mb-1">Sin funnels</p>
              <p className="text-xs text-slate-600">Crea el primero para empezar a estructurar conversiones y recorridos de compra.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {funnels.map((funnel) => {
                const state = FUNNEL_STATUS[funnel.status] ?? FUNNEL_STATUS.draft
                const steps = Array.isArray(funnel.steps) ? [...funnel.steps].sort((a, b) => a.position - b.position) : []
                const analytics = funnelAnalytics[funnel.id]
                return (
                  <div key={funnel.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{funnel.name}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.color}`}>
                            {state.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                            /{funnel.slug}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {steps.length > 0 ? steps.map((step) => (
                            <span key={step.id} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                              {step.position + 1}. {FUNNEL_STEP_LABEL[step.kind] ?? step.kind}
                            </span>
                          )) : <span>Sin pasos definidos</span>}
                        </div>
                        {steps.length > 0 && (
                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            {steps.map((step) => {
                              const page = getPageForStep(step, availablePages)
                              const href = getStepPublicPath(siteId, funnel.id, step.kind, page)
                              return (
                                <div key={`${funnel.id}-${step.id}-link`} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                                  <div className="mb-1 text-[11px] font-semibold text-slate-300">
                                    {FUNNEL_STEP_LABEL[step.kind]}
                                  </div>
                                  <div className="mb-2 text-[10px] text-slate-500">
                                    {page ? `${page.name} (/${page.slug})` : "Resolver por runtime del funnel"}
                                  </div>
                                  <Link
                                    href={href}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00b5f6] hover:text-[#33d1ff]"
                                  >
                                    Abrir paso <ExternalLink size={11} />
                                  </Link>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {analytics && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-slate-300">
                              Vistas: {analytics.stepViews}
                            </span>
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-slate-300">
                              Checkouts: {analytics.checkoutStarts}
                            </span>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                              Exitosos: {analytics.checkoutSuccess}
                            </span>
                            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-300">
                              View → Checkout: {analytics.checkoutStartRate}%
                            </span>
                            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-300">
                              Checkout → Venta: {analytics.successRateFromStarts}%
                            </span>
                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-300">
                              View → Venta: {analytics.successRateFromViews}%
                            </span>
                            {analytics.checkoutPending > 0 && (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
                                Pendientes: {analytics.checkoutPending}
                              </span>
                            )}
                            {analytics.checkoutFailed > 0 && (
                              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-red-300">
                                Fallidos: {analytics.checkoutFailed}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(["draft", "active", "archived"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateFunnelStatus(funnel.id, status)}
                            className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                              funnel.status === status
                                ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                                : "border-white/[0.08] text-slate-400 hover:text-white"
                            }`}
                          >
                            {FUNNEL_STATUS[status].label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => editingFunnelId === funnel.id ? stopEditingFunnel() : startEditingFunnel(funnel)}
                          className={`flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                            editingFunnelId === funnel.id
                              ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                              : "border-white/[0.08] text-slate-400 hover:text-white"
                          }`}
                        >
                          <Pencil size={12} /> {editingFunnelId === funnel.id ? "Cerrar" : "Editar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFunnel(funnel.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {editingFunnelId === funnel.id && funnelDrafts[funnel.id] && (
                      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/10 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                            <input
                              type="text"
                              value={funnelDrafts[funnel.id].name}
                              onChange={(event) => updateFunnelDraft(funnel.id, { name: event.target.value })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Slug</label>
                            <input
                              type="text"
                              value={funnelDrafts[funnel.id].slug}
                              onChange={(event) => updateFunnelDraft(funnel.id, { slug: event.target.value })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-white">Pasos del funnel</h4>
                            <button
                              type="button"
                              onClick={() => addFunnelDraftStep(funnel.id)}
                              className="flex h-8 items-center gap-1 rounded-lg border border-white/[0.08] px-3 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
                            >
                              <Plus size={12} /> Agregar paso
                            </button>
                          </div>

                          <div className="space-y-3">
                            {funnelDrafts[funnel.id].steps.map((step, stepIndex) => (
                              <div key={step.id} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:grid-cols-[80px_1fr_1fr_44px]">
                                <div>
                                  <label className="mb-1.5 block text-[11px] text-slate-500">Orden</label>
                                  <div className="flex h-9 items-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm font-semibold text-slate-300">
                                    {stepIndex + 1}
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-[11px] text-slate-500">Tipo</label>
                                  <select
                                    value={step.kind}
                                    onChange={(event) => updateFunnelDraftStep(funnel.id, stepIndex, {
                                      kind: event.target.value as FunnelStep["kind"],
                                    })}
                                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                                  >
                                    {(Object.entries(FUNNEL_STEP_LABEL) as Array<[FunnelStep["kind"], string]>).map(([value, label]) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-[11px] text-slate-500">Página asociada</label>
                                  <select
                                    value={step.pageId ?? ""}
                                    onChange={(event) => updateFunnelDraftStep(funnel.id, stepIndex, {
                                      pageId: event.target.value || null,
                                    })}
                                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                                  >
                                    <option value="">Sin página</option>
                                    {availablePages.map((page) => (
                                      <option key={page.id || page.slug} value={page.id}>
                                        {page.name} (/{page.slug})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => removeFunnelDraftStep(funnel.id, stepIndex)}
                                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-red-400/10 hover:text-red-400"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="md:col-span-4">
                                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
                                    URL resultante:{" "}
                                    <span className="font-mono text-slate-300">
                                      {getStepPublicPath(siteId, funnel.id, step.kind, getPageForStep(step, availablePages))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveFunnelDraft(funnel)}
                            disabled={savingFunnelId === funnel.id}
                            className="flex h-9 items-center gap-2 rounded-lg bg-[#00b5f6] px-4 text-sm font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
                          >
                            <Save size={13} />
                            {savingFunnelId === funnel.id ? "Guardando..." : "Guardar funnel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === "experiments" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-[#00b5f6]" />
              <h3 className="text-sm font-semibold text-white">Experimentos A/B</h3>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Define pruebas por página o funnel con split básico de tráfico y, si quieres, manda la variante B a un destino distinto.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="xl:col-span-2">
                <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                <input
                  type="text"
                  value={experimentName}
                  onChange={(event) => setExperimentName(event.target.value)}
                  placeholder="Ej: Hero variante B"
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">Objetivo</label>
                <select
                  value={experimentTargetType}
                  onChange={(event) => setExperimentTargetType(event.target.value as "page" | "funnel")}
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                >
                  <option value="page">Página</option>
                  <option value="funnel">Funnel</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">{experimentTargetType === "page" ? "Página" : "Funnel"}</label>
                {experimentTargetType === "page" ? (
                  <select
                    value={experimentPageId}
                    onChange={(event) => setExperimentPageId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">Selecciona página</option>
                    {availablePages.map((page) => (
                      <option key={page.id || page.slug} value={page.id}>{page.name} (/{page.slug})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={experimentFunnelId}
                    onChange={(event) => setExperimentFunnelId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">Selecciona funnel</option>
                    {funnels.map((funnel) => (
                      <option key={funnel.id} value={funnel.id}>{funnel.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">
                  Variante B {experimentTargetType === "page" ? "Página" : "Funnel"} opcional
                </label>
                {experimentTargetType === "page" ? (
                  <select
                    value={experimentVariantBPageId}
                    onChange={(event) => setExperimentVariantBPageId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">Mismo destino que A</option>
                    {availablePages.map((page) => (
                      <option key={`b-${page.id || page.slug}`} value={page.id}>{page.name} (/{page.slug})</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={experimentVariantBFunnelId}
                    onChange={(event) => setExperimentVariantBFunnelId(event.target.value)}
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                  >
                    <option value="">Mismo destino que A</option>
                    {funnels.map((funnel) => (
                      <option key={`b-${funnel.id}`} value={funnel.id}>{funnel.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">Split A (%)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={experimentSplitA}
                  onChange={(event) => setExperimentSplitA(event.target.value)}
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">Split resultante: A {Math.max(1, Math.min(99, Number(experimentSplitA) || 50))}% / B {100 - Math.max(1, Math.min(99, Number(experimentSplitA) || 50))}%</p>
              <button
                type="button"
                onClick={createExperimentDraft}
                disabled={
                  creatingExperiment
                  || !experimentName.trim()
                  || (experimentTargetType === "page" && !experimentPageId)
                  || (experimentTargetType === "funnel" && !experimentFunnelId)
                }
                className="h-9 rounded-lg bg-[#00b5f6] px-4 text-sm font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
              >
                {creatingExperiment ? "Creando..." : "Crear experimento"}
              </button>
            </div>
            {experimentError && (
              <p className="mt-3 text-xs text-amber-300">{experimentError}</p>
            )}
            {!experimentsReady && (
              <p className="mt-3 text-xs text-slate-500">
                Si ves este aviso, falta aplicar el schema nuevo de experimentos en la base antes de usarlos realmente.
              </p>
            )}
          </div>

          {experiments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-500 mb-1">Sin experimentos</p>
              <p className="text-xs text-slate-600">Crea el primero para empezar a probar variantes y splits de tráfico.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {experiments.map((experiment) => {
                const state = FUNNEL_STATUS[experiment.status] ?? FUNNEL_STATUS.draft
                const page = experiment.pageId ? availablePages.find((entry) => entry.id === experiment.pageId) : null
                const funnel = experiment.funnelId ? funnels.find((entry) => entry.id === experiment.funnelId) : null
                const splitA = Number(experiment.trafficSplit?.a) || 50
                const splitB = Number(experiment.trafficSplit?.b) || (100 - splitA)
                const variantBPageId = experiment.trafficSplit?.variants?.B?.pageId ?? null
                const variantBFunnelId = experiment.trafficSplit?.variants?.B?.funnelId ?? null
                const variantBPage = variantBPageId ? availablePages.find((entry) => entry.id === variantBPageId) : null
                const variantBFunnel = variantBFunnelId ? funnels.find((entry) => entry.id === variantBFunnelId) : null
                return (
                  <div key={experiment.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{experiment.name}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.color}`}>
                            {state.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                            Objetivo: {experiment.targetType === "page" ? "Página" : "Funnel"}
                          </span>
                          {page && (
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                              {page.name} (/{page.slug})
                            </span>
                          )}
                          {funnel && (
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                              {funnel.name}
                            </span>
                          )}
                          <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                            A: {experiment.targetType === "page"
                              ? (page ? `${page.name} (/${page.slug})` : "sin pagina")
                              : (funnel ? funnel.name : "sin funnel")}
                          </span>
                          <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-300">
                            B: {experiment.targetType === "page"
                              ? (variantBPage ? `${variantBPage.name} (/${variantBPage.slug})` : page ? `${page.name} (/${page.slug})` : "mismo destino")
                              : (variantBFunnel ? variantBFunnel.name : funnel ? funnel.name : "mismo destino")}
                          </span>
                          <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-sky-300">
                            A {splitA}% / B {splitB}%
                          </span>
                          <Link
                            href={`/p/${encodeURIComponent(siteId)}/experiment/${encodeURIComponent(experiment.id)}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[#00b5f6]/20 bg-[#00b5f6]/10 px-2 py-0.5 text-[#00b5f6] hover:text-[#33d1ff]"
                          >
                            Abrir experimento <ExternalLink size={11} />
                          </Link>
                        </div>
                        {experimentAnalytics[experiment.id] && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-slate-300">
                              Asignaciones: {experimentAnalytics[experiment.id].totalAssignments}
                            </span>
                            <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-slate-300">
                              Checkouts: {experimentAnalytics[experiment.id].totalCheckoutStarts}
                            </span>
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                              Ventas: {experimentAnalytics[experiment.id].totalCheckoutSuccess}
                            </span>
                            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-300">
                              Assign → Checkout: {experimentAnalytics[experiment.id].checkoutStartRate}%
                            </span>
                            <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-300">
                              Assign → Venta: {experimentAnalytics[experiment.id].successRateFromAssignments}%
                            </span>
                            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-300">
                              Checkout → Venta: {experimentAnalytics[experiment.id].successRateFromStarts}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editingExperimentId === experiment.id ? stopEditingExperiment() : startEditingExperiment(experiment)}
                          className={`inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                            editingExperimentId === experiment.id
                              ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                              : "border-white/[0.08] text-slate-400 hover:text-white"
                          }`}
                        >
                          <Pencil size={12} /> {editingExperimentId === experiment.id ? "Cerrar" : "Editar"}
                        </button>
                        {(["draft", "active", "archived"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateExperimentStatus(experiment.id, status)}
                            className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                              experiment.status === status
                                ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                                : "border-white/[0.08] text-slate-400 hover:text-white"
                            }`}
                          >
                            {FUNNEL_STATUS[status].label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => removeExperiment(experiment.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {editingExperimentId === experiment.id && experimentDrafts[experiment.id] && (
                      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Editar experimento</p>
                            <p className="text-[11px] text-slate-500">Ajusta nombre, destino base, variante B y split.</p>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                          <div className="xl:col-span-2">
                            <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                            <input
                              type="text"
                              value={experimentDrafts[experiment.id].name}
                              onChange={(event) => updateExperimentDraft(experiment.id, { name: event.target.value })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Objetivo</label>
                            <select
                              value={experimentDrafts[experiment.id].targetType}
                              onChange={(event) => updateExperimentDraft(experiment.id, {
                                targetType: event.target.value as "page" | "funnel",
                                pageId: event.target.value === "page" ? experimentDrafts[experiment.id].pageId : "",
                                funnelId: event.target.value === "funnel" ? experimentDrafts[experiment.id].funnelId : "",
                                variantBPageId: event.target.value === "page" ? experimentDrafts[experiment.id].variantBPageId : "",
                                variantBFunnelId: event.target.value === "funnel" ? experimentDrafts[experiment.id].variantBFunnelId : "",
                              })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                            >
                              <option value="page">Página</option>
                              <option value="funnel">Funnel</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">
                              {experimentDrafts[experiment.id].targetType === "page" ? "Página A" : "Funnel A"}
                            </label>
                            {experimentDrafts[experiment.id].targetType === "page" ? (
                              <select
                                value={experimentDrafts[experiment.id].pageId}
                                onChange={(event) => updateExperimentDraft(experiment.id, { pageId: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                              >
                                <option value="">Selecciona página</option>
                                {availablePages.map((entry) => (
                                  <option key={`edit-a-page-${entry.id}`} value={entry.id}>{entry.name} (/{entry.slug})</option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={experimentDrafts[experiment.id].funnelId}
                                onChange={(event) => updateExperimentDraft(experiment.id, { funnelId: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                              >
                                <option value="">Selecciona funnel</option>
                                {funnels.map((entry) => (
                                  <option key={`edit-a-funnel-${entry.id}`} value={entry.id}>{entry.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">
                              {experimentDrafts[experiment.id].targetType === "page" ? "Página B" : "Funnel B"} opcional
                            </label>
                            {experimentDrafts[experiment.id].targetType === "page" ? (
                              <select
                                value={experimentDrafts[experiment.id].variantBPageId}
                                onChange={(event) => updateExperimentDraft(experiment.id, { variantBPageId: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                              >
                                <option value="">Mismo destino que A</option>
                                {availablePages.map((entry) => (
                                  <option key={`edit-b-page-${entry.id}`} value={entry.id}>{entry.name} (/{entry.slug})</option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={experimentDrafts[experiment.id].variantBFunnelId}
                                onChange={(event) => updateExperimentDraft(experiment.id, { variantBFunnelId: event.target.value })}
                                className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                              >
                                <option value="">Mismo destino que A</option>
                                {funnels.map((entry) => (
                                  <option key={`edit-b-funnel-${entry.id}`} value={entry.id}>{entry.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Split A (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={experimentDrafts[experiment.id].splitA}
                              onChange={(event) => updateExperimentDraft(experiment.id, { splitA: event.target.value })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white focus:outline-none focus:border-[#00b5f6]/50"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] text-slate-500">
                            Split resultante: A {Math.max(1, Math.min(99, Number(experimentDrafts[experiment.id].splitA) || 50))}% / B {100 - Math.max(1, Math.min(99, Number(experimentDrafts[experiment.id].splitA) || 50))}%
                          </p>
                          <button
                            type="button"
                            onClick={() => saveExperimentDraft(experiment)}
                            disabled={savingExperimentId === experiment.id}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#00b5f6] px-3 text-xs font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
                          >
                            <Save size={12} /> {savingExperimentId === experiment.id ? "Guardando..." : "Guardar experimento"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === "automations" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#00b5f6]" />
              <h3 className="text-sm font-semibold text-white">Automatizaciones</h3>
            </div>
            <p className="mb-4 text-xs text-slate-500">
              Crea reglas simples sobre contactos, checkout y CMS para ejecutar acciones sin salir del flujo.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                <input
                  type="text"
                  value={automationName}
                  onChange={(event) => setAutomationName(event.target.value)}
                  placeholder="Ej: Avisar checkout iniciado"
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] text-slate-500">Trigger</label>
                <select
                  value={automationTriggerType}
                  onChange={(event) => {
                    const nextTriggerType = event.target.value as AutomationTriggerType
                    setAutomationTriggerType(nextTriggerType)
                    setAutomationConditions([createDefaultAutomationCondition(nextTriggerType)])
                  }}
                  className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                >
                  <option value="store_checkout_started">Checkout iniciado</option>
                  <option value="cms_record_created">Record CMS creado</option>
                  <option value="contact_created">Contacto creado</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {automationTriggerType === "contact_created" && (
                <p className="text-[11px] text-slate-500">
                  Este trigger funciona en formularios que envían `siteId` o en `/contacto` si configuras `ORVENIX_MARKETING_SITE_ID`.
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400">Condiciones</p>
                <button
                  type="button"
                  onClick={addCreateAutomationCondition}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:text-white"
                >
                  <Plus size={12} /> Agregar condición
                </button>
              </div>
              {automationConditions.map((condition, index) => {
                const fieldDefinitions = AUTOMATION_TRIGGER_FIELD_DEFS[automationTriggerType]
                const currentField = fieldDefinitions.find((entry) => entry.field === condition.field) ?? fieldDefinitions[0]
                return (
                  <div key={`create-condition-${index}`} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:grid-cols-[190px_180px_minmax(0,1fr)_auto]">
                    <select
                      value={condition.field}
                      onChange={(event) => updateCreateAutomationCondition(index, { field: event.target.value })}
                      className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                    >
                      {fieldDefinitions.map((field) => (
                        <option key={field.field} value={field.field}>{field.label}</option>
                      ))}
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(event) => updateCreateAutomationCondition(index, { operator: event.target.value as AutomationConditionOperator })}
                      className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                    >
                      {currentField.operators.map((operator) => (
                        <option key={operator} value={operator}>{AUTOMATION_CONDITION_OPERATOR_LABELS[operator]}</option>
                      ))}
                    </select>
                    <input
                      type={condition.operator === "number_gte" ? "number" : "text"}
                      value={condition.value}
                      onChange={(event) => updateCreateAutomationCondition(index, { value: event.target.value })}
                      placeholder={currentField.placeholder}
                      className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeCreateAutomationCondition(index)}
                      disabled={automationConditions.length <= 1}
                      className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400">Acciones</p>
                <button
                  type="button"
                  onClick={addCreateAutomationAction}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:text-white"
                >
                  <Plus size={12} /> Agregar acción
                </button>
              </div>
              {automationActions.map((action, index) => (
                <div key={`create-action-${index}`} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <select
                    value={action.type}
                    onChange={(event) => updateCreateAutomationAction(index, { type: event.target.value as AutomationActionType, value: "" })}
                    className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                  >
                    <option value="append_order_note">Agregar nota al pedido</option>
                    <option value="email_admin">Email al admin</option>
                    <option value="email_contact">Email al contacto</option>
                    <option value="tag_contact">Etiquetar contacto</option>
                    <option value="set_contact_service">Cambiar servicio del contacto</option>
                    <option value="set_order_status">Cambiar estado del pedido</option>
                    <option value="set_record_workflow_status">Cambiar workflow CMS</option>
                  </select>
                  {getAutomationActionOptions(action.type) ? (
                    <select
                      value={action.value || getAutomationActionOptions(action.type)?.[0]?.value || ""}
                      onChange={(event) => updateCreateAutomationAction(index, { value: event.target.value })}
                      className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                    >
                      {getAutomationActionOptions(action.type)?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={action.value}
                      onChange={(event) => updateCreateAutomationAction(index, { value: event.target.value })}
                      placeholder={getAutomationActionPlaceholder(action.type)}
                      className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeCreateAutomationAction(index)}
                    disabled={automationActions.length <= 1}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Se crea en borrador; luego puedes activarla o pausarla.
              </p>
              <button
                type="button"
                onClick={createAutomationDraft}
                disabled={creatingAutomation || !automationName.trim()}
                className="h-9 rounded-lg bg-[#00b5f6] px-4 text-sm font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
              >
                {creatingAutomation ? "Creando..." : "Crear automatización"}
              </button>
            </div>
            {automationError && (
              <p className="mt-3 text-xs text-amber-300">{automationError}</p>
            )}
            {!automationsReady && (
              <p className="mt-3 text-xs text-slate-500">
                Si ves este aviso, falta aplicar el schema nuevo de automatizaciones en la base.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Ultimas ejecuciones</h4>
                <p className="text-xs text-slate-500">Revisa si una regla se proceso, se salto por condiciones o fallo.</p>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                {initialAutomationRuns.length} registros
              </span>
            </div>
            {initialAutomationRuns.length === 0 ? (
              <p className="text-xs text-slate-500">Todavia no hay ejecuciones registradas para este sitio.</p>
            ) : (
              <div className="space-y-2">
                {initialAutomationRuns.slice(0, 12).map((run) => {
                  const resultClass =
                    run.result === "processed"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : run.result === "skipped"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300"

                  return (
                    <div key={run.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {automationNameMap.get(run.automationId) ?? "Automatización"}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${resultClass}`}>
                            {run.result === "processed" ? "Procesada" : run.result === "skipped" ? "Saltada" : "Fallida"}
                          </span>
                          <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400">
                            {AUTOMATION_TRIGGER_LABELS[run.triggerType]}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {getAutomationPayloadSummary(run.payload)}
                        </p>
                        {run.error && run.error !== "CONDITIONS_NOT_MATCHED" && (
                          <p className="mt-1 text-[11px] text-red-300">{run.error}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-[11px] text-slate-500">
                        {formatAutomationRunTime(run.createdAt)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {automations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
              <Zap size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-500 mb-1">Sin automatizaciones</p>
              <p className="text-xs text-slate-600">Crea la primera para reaccionar a contactos, CMS o checkout.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {automations.map((automation) => {
                const state = STATUS_CONFIG[automation.status] ?? STATUS_CONFIG.draft
                return (
                  <div key={automation.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{automation.name}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.color}`}>
                            {state.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                            Trigger: {AUTOMATION_TRIGGER_LABELS[automation.triggerType]}
                          </span>
                          {automation.actionGraph.conditions.map((condition, index) => (
                            <span key={`${automation.id}-condition-${index}`} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                              {getAutomationConditionLabel(condition)} {AUTOMATION_CONDITION_OPERATOR_LABELS[condition.operator]} {condition.value}
                            </span>
                          ))}
                          {automation.actionGraph.actions.map((action, index) => (
                            <span key={`${automation.id}-${index}`} className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-sky-300">
                              {AUTOMATION_ACTION_LABELS[action.type]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => editingAutomationId === automation.id ? stopEditingAutomation() : startEditingAutomation(automation)}
                          className={`inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                            editingAutomationId === automation.id
                              ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                              : "border-white/[0.08] text-slate-400 hover:text-white"
                          }`}
                        >
                          <Pencil size={12} /> {editingAutomationId === automation.id ? "Cerrar" : "Editar"}
                        </button>
                        {(["draft", "active", "paused"] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateAutomationStatus(automation.id, status)}
                            className={`h-8 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                              automation.status === status
                                ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                                : "border-white/[0.08] text-slate-400 hover:text-white"
                            }`}
                          >
                            {status === "paused" ? "Pausada" : STATUS_CONFIG[status].label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => removeAutomation(automation.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {editingAutomationId === automation.id && automationDrafts[automation.id] && (
                      <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">Editar automatización</p>
                            <p className="text-[11px] text-slate-500">Ajusta trigger y encadena varias acciones.</p>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Nombre</label>
                            <input
                              type="text"
                              value={automationDrafts[automation.id].name}
                              onChange={(event) => updateAutomationDraft(automation.id, { name: event.target.value })}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[11px] text-slate-500">Trigger</label>
                            <select
                              value={automationDrafts[automation.id].triggerType}
                              onChange={(event) => {
                                const nextTriggerType = event.target.value as AutomationTriggerType
                                updateAutomationDraft(automation.id, {
                                  triggerType: nextTriggerType,
                                  conditions: [createDefaultAutomationCondition(nextTriggerType)],
                                })
                              }}
                              className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                            >
                              <option value="store_checkout_started">Checkout iniciado</option>
                              <option value="cms_record_created">Record CMS creado</option>
                              <option value="contact_created">Contacto creado</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-400">Condiciones</p>
                            <button
                              type="button"
                              onClick={() => addAutomationDraftCondition(automation.id)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:text-white"
                            >
                              <Plus size={12} /> Agregar condición
                            </button>
                          </div>
                          {automationDrafts[automation.id].conditions.map((condition, index) => {
                            const fieldDefinitions = AUTOMATION_TRIGGER_FIELD_DEFS[automationDrafts[automation.id].triggerType]
                            const currentField = fieldDefinitions.find((entry) => entry.field === condition.field) ?? fieldDefinitions[0]
                            return (
                              <div key={`${automation.id}-condition-${index}`} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:grid-cols-[190px_180px_minmax(0,1fr)_auto]">
                                <select
                                  value={condition.field}
                                  onChange={(event) => updateAutomationDraftCondition(automation.id, index, { field: event.target.value })}
                                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                                >
                                  {fieldDefinitions.map((field) => (
                                    <option key={field.field} value={field.field}>{field.label}</option>
                                  ))}
                                </select>
                                <select
                                  value={condition.operator}
                                  onChange={(event) => updateAutomationDraftCondition(automation.id, index, { operator: event.target.value as AutomationConditionOperator })}
                                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                                >
                                  {currentField.operators.map((operator) => (
                                    <option key={operator} value={operator}>{AUTOMATION_CONDITION_OPERATOR_LABELS[operator]}</option>
                                  ))}
                                </select>
                                <input
                                  type={condition.operator === "number_gte" ? "number" : "text"}
                                  value={condition.value}
                                  onChange={(event) => updateAutomationDraftCondition(automation.id, index, { value: event.target.value })}
                                  placeholder={currentField.placeholder}
                                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeAutomationDraftCondition(automation.id, index)}
                                  disabled={automationDrafts[automation.id].conditions.length <= 1}
                                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-slate-400">Acciones</p>
                            <button
                              type="button"
                              onClick={() => addAutomationDraftAction(automation.id)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:text-white"
                            >
                              <Plus size={12} /> Agregar acción
                            </button>
                          </div>
                          {automationDrafts[automation.id].actions.map((action, index) => (
                            <div key={`${automation.id}-action-${index}`} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
                              <select
                                value={action.type}
                                onChange={(event) => updateAutomationDraftAction(automation.id, index, { type: event.target.value as AutomationActionType, value: "" })}
                                className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                              >
                                <option value="append_order_note">Agregar nota al pedido</option>
                                <option value="email_admin">Email al admin</option>
                                <option value="email_contact">Email al contacto</option>
                                <option value="tag_contact">Etiquetar contacto</option>
                                <option value="set_contact_service">Cambiar servicio del contacto</option>
                                <option value="set_order_status">Cambiar estado del pedido</option>
                                <option value="set_record_workflow_status">Cambiar workflow CMS</option>
                              </select>
                              {getAutomationActionOptions(action.type) ? (
                                <select
                                  value={action.value || getAutomationActionOptions(action.type)?.[0]?.value || ""}
                                  onChange={(event) => updateAutomationDraftAction(automation.id, index, { value: event.target.value })}
                                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-2 text-sm text-white focus:outline-none"
                                >
                                  {getAutomationActionOptions(action.type)?.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={action.value}
                                  onChange={(event) => updateAutomationDraftAction(automation.id, index, { value: event.target.value })}
                                  placeholder={getAutomationActionPlaceholder(action.type)}
                                  className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => removeAutomationDraftAction(automation.id, index)}
                                disabled={automationDrafts[automation.id].actions.length <= 1}
                                className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-red-400/10 hover:text-red-300 disabled:opacity-40"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => saveAutomationDraft(automation)}
                            disabled={savingAutomationId === automation.id}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#00b5f6] px-3 text-xs font-bold text-[#112540] transition-colors hover:bg-[#00ceff] disabled:opacity-50"
                          >
                            <Save size={12} /> {savingAutomationId === automation.id ? "Guardando..." : "Guardar automatización"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Pedidos */}
      {tab === "orders" && (
        <>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
              <ShoppingCart size={32} className="mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-semibold text-slate-500 mb-1">Sin pedidos aún</p>
              <p className="text-xs text-slate-600">Los pedidos aparecerán aquí cuando los clientes compren</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">ID</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Cliente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Estado</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Total</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const st = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
                    const date = new Date(order.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                    return (
                      <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-600">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white">{order.customerName ?? "—"}</div>
                          <div className="text-[10px] text-slate-600">{order.customerEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-400/80 text-sm">
                          {formatMxn(order.totalMxn)}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500">{date}</td>
                        <td className="px-4 py-3">
                          {order.status === "paid" && (
                            <button type="button"
                              onClick={() => updateOrderStatus(order.id, "fulfilled")}
                              className="h-6 px-2.5 rounded-lg bg-blue-500/15 text-blue-400 text-[10px] font-semibold hover:bg-blue-500/25 transition-colors">
                              Marcar enviado
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
