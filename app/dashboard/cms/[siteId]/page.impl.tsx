"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Database, Plus, Trash2, ArrowLeft, Rows3, ChevronRight, CircleDot, Eye, FileClock, Layers3 } from "lucide-react"
import { mergeCmsWorkflowSummaries, type CmsWorkflowSummary } from "@/lib/cms/collection-summary"

interface Collection {
  id: string
  name: string
  slug: string
  fields: unknown
  _count: { records: number }
  workflow: CmsWorkflowSummary
  createdAt: Date | string
}

interface Props {
  siteId: string
  siteName: string
  initialCollections: Collection[]
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: "Aa", number: "123", date: "📅", toggle: "⊙",
  select: "▼", relation: "⇒", media: "🖼", richtext: "¶",
}

const WORKFLOW_CHIP_STYLES = {
  draft: "border-white/[0.08] bg-white/[0.04] text-slate-300",
  review: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  published: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
} satisfies Record<"draft" | "review" | "published", string>

function buildCollectionStatusHref(siteId: string, slug: string, status?: "draft" | "review" | "published") {
  if (!status) return `/dashboard/cms/${siteId}/${slug}`
  return `/dashboard/cms/${siteId}/${slug}?status=${encodeURIComponent(status)}`
}

export default function CmsCollectionsImpl({ siteId, siteName, initialCollections }: Props) {
  const router = useRouter()
  const [collections, setCollections] = useState(initialCollections)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const workflowTotals = mergeCmsWorkflowSummaries(collections.map((collection) => collection.workflow))
  const collectionsWithReviewQueue = collections.filter((collection) => collection.workflow.review > 0).length

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const handleNameChange = (v: string) => {
    setNewName(v)
    setNewSlug(slugify(v))
  }

  const createCollection = async () => {
    if (!newName.trim() || !newSlug.trim()) return
    setCreating(true)
    setError("")
    try {
      const res = await fetch(`/api/cms/${siteId}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), fields: [] }),
      })
      const data = await res.json() as { collection?: Collection; error?: unknown }
      if (!res.ok) { setError("Error al crear la colección"); return }
      setCollections((prev) => [...prev, data.collection!])
      setNewName("")
      setNewSlug("")
      setShowNewForm(false)
    } finally {
      setCreating(false)
    }
  }

  const deleteCollection = async (slug: string, id: string) => {
    if (!confirm("¿Eliminar esta colección y todos sus registros?")) return
    setDeletingId(id)
    await fetch(`/api/cms/${siteId}/collections/${slug}`, { method: "DELETE" })
    setCollections((prev) => prev.filter((c) => c.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database size={18} className="text-[#00b5f6]" />
              <h1 className="text-xl font-bold text-white">CMS — {siteName}</h1>
            </div>
            <p className="text-sm text-slate-500">
              {collections.length} {collections.length === 1 ? "colección" : "colecciones"} · gestiona tus datos dinámicos
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#00b5f6]/15 border border-[#00b5f6]/30 text-[#00b5f6] text-sm font-semibold hover:bg-[#00b5f6]/25 transition-colors"
          >
            <Plus size={14} /> Nueva colección
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <SummaryCard
          icon={<Layers3 size={16} className="text-[#00b5f6]" />}
          label="Colecciones"
          value={String(collections.length)}
          hint={`${workflowTotals.total} registros en total`}
        />
        <SummaryCard
          icon={<FileClock size={16} className="text-slate-300" />}
          label="Draft"
          value={String(workflowTotals.draft)}
          hint="Pendientes de edición o aprobación"
        />
        <SummaryCard
          icon={<CircleDot size={16} className="text-amber-300" />}
          label="Review"
          value={String(workflowTotals.review)}
          hint={`${collectionsWithReviewQueue} colecciones con cola de revisión`}
        />
        <SummaryCard
          icon={<Eye size={16} className="text-emerald-300" />}
          label="Published"
          value={String(workflowTotals.published)}
          hint="Listos para bindings y runtime público"
        />
      </div>

      {/* Formulario nueva colección */}
      {showNewForm && (
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Nueva colección</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5">Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Productos"
                className="w-full h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1.5">Slug (URL)</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(slugify(e.target.value))}
                placeholder="productos"
                className="w-full h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50 font-mono"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createCollection}
              disabled={creating || !newName.trim()}
              className="h-8 px-4 rounded-lg bg-[#00b5f6] text-[#112540] text-sm font-bold hover:bg-[#00ceff] transition-colors disabled:opacity-50"
            >
              {creating ? "Creando..." : "Crear colección"}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setNewName(""); setNewSlug(""); setError("") }}
              className="h-8 px-4 rounded-lg border border-white/[0.08] text-slate-400 text-sm hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de colecciones */}
      {collections.length === 0 && !showNewForm ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
          <Database size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm font-semibold text-slate-500 mb-1">Sin colecciones</p>
          <p className="text-xs text-slate-600 mb-4">Crea tu primera colección para gestionar datos dinámicos en tu sitio</p>
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="h-8 px-4 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-slate-400 hover:text-white transition-colors"
          >
            + Nueva colección
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {collections.map((col) => {
            const fields = Array.isArray(col.fields) ? col.fields as Array<{ type: string }> : []
            return (
              <div
                key={col.id}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-[#00b5f6]/20 hover:bg-white/[0.04] transition-all"
              >
                {/* Icono */}
                <div className="w-10 h-10 rounded-xl bg-[#00b5f6]/10 border border-[#00b5f6]/20 grid place-items-center shrink-0">
                  <Rows3 size={18} className="text-[#00b5f6]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{col.name}</span>
                    <span className="font-mono text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      /{col.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span>{col._count.records} {col._count.records === 1 ? "registro" : "registros"}</span>
                    <span>·</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <WorkflowChip label="Draft" count={col.workflow.draft} tone="draft" />
                      <WorkflowChip label="Review" count={col.workflow.review} tone="review" />
                      <WorkflowChip label="Published" count={col.workflow.published} tone="published" />
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      {fields.slice(0, 5).map((f, i) => (
                        <span key={i} className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] font-mono">
                          {FIELD_TYPE_ICONS[f.type] ?? "?"}
                        </span>
                      ))}
                      {fields.length > 5 && <span>+{fields.length - 5}</span>}
                      {fields.length === 0 && <span className="text-slate-700">sin campos</span>}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => deleteCollection(col.slug, col.id)}
                    disabled={deletingId === col.id}
                    className="grid h-7 w-7 place-items-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {col.workflow.review > 0 && (
                    <Link
                      href={buildCollectionStatusHref(siteId, col.slug, "review")}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/15 transition-all"
                      onClick={() => router.push(buildCollectionStatusHref(siteId, col.slug, "review"))}
                    >
                      Review ({col.workflow.review}) <ChevronRight size={12} />
                    </Link>
                  )}
                  {col.workflow.draft > 0 && (
                    <Link
                      href={buildCollectionStatusHref(siteId, col.slug, "draft")}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-slate-300 hover:text-white hover:border-white/[0.14] transition-all"
                      onClick={() => router.push(buildCollectionStatusHref(siteId, col.slug, "draft"))}
                    >
                      Drafts ({col.workflow.draft}) <ChevronRight size={12} />
                    </Link>
                  )}
                  <Link
                    href={buildCollectionStatusHref(siteId, col.slug)}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 hover:text-white hover:border-white/[0.12] transition-all"
                    onClick={() => router.push(buildCollectionStatusHref(siteId, col.slug))}
                  >
                    Ver registros <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function WorkflowChip({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: "draft" | "review" | "published"
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${WORKFLOW_CHIP_STYLES[tone]}`}>
      <span>{label}</span>
      <span className="rounded-full bg-black/10 px-1.5 py-[1px] text-[9px]">{count}</span>
    </span>
  )
}
