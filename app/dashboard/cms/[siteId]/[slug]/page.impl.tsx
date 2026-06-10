"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Check, ChevronDown, Database, Search,
  Plus, Settings2, Trash2, Upload, X, AlertCircle, CheckSquare2, Square,
} from "lucide-react"
import {
  getDefaultFieldValue,
  getRelationIds,
  getRelationRecordLabel,
  normalizeCmsFieldValue,
  parseCmsFields,
} from "@/lib/cms/schema"
import type { CmsFieldDef } from "@/lib/cms/schema"
import {
  getCmsWorkflowStatus,
  type CmsWorkflowStatus,
} from "@/lib/cms/workflow"
import {
  applyBulkWorkflowStatus,
  removeBulkSelectedRecords,
  summarizeSelectedWorkflow,
} from "@/lib/cms/bulk-actions"
import { buildCmsRecordsViewQuery } from "@/lib/cms/view-state"

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldDef = CmsFieldDef

interface CollectionData {
  id: string
  name: string
  slug: string
  fields: unknown
  siteId: string
}

interface RecordRow {
  id: string
  data: Record<string, unknown>
  publishedAt: Date | string | null
  createdAt: Date | string
  workflowStatus?: CmsWorkflowStatus
}

interface RelationSourceRecord {
  id: string
  data: Record<string, unknown>
}

interface RelationSource {
  id: string
  name: string
  slug: string
  fields: CmsFieldDef[]
  records: RelationSourceRecord[]
}

interface Props {
  siteId: string
  siteName: string
  collection: CollectionData
  initialRecords: RecordRow[]
  relationSources: RelationSource[]
  initialQuery?: string
  initialRecordId?: string
  initialStatusFilter?: "all" | CmsWorkflowStatus
  initialSort?: RecordsSortValue
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Texto", number: "Número", date: "Fecha",
  toggle: "Toggle", select: "Selección", relation: "Relación", media: "Media", richtext: "Rich Text",
}

const FIELD_TYPE_ICON: Record<string, string> = {
  text: "Aa", number: "#", date: "📅", toggle: "⊙", select: "▼", relation: "⇒", media: "🖼", richtext: "¶",
}

const WORKFLOW_STATUS_META: Record<CmsWorkflowStatus, { label: string; chip: string; button: string }> = {
  draft: {
    label: "Draft",
    chip: "bg-white/[0.04] text-slate-500",
    button: "border-white/[0.08] text-slate-500 hover:border-white/[0.14] hover:text-slate-300",
  },
  review: {
    label: "Review",
    chip: "bg-amber-500/15 text-amber-300",
    button: "border-amber-500/20 text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10",
  },
  published: {
    label: "Published",
    chip: "bg-emerald-500/15 text-emerald-400",
    button: "border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10",
  },
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function Cell({
  value,
  field,
  onSave,
  relationSources,
}: {
  value: unknown
  field: FieldDef
  onSave: (v: unknown) => void
  relationSources: RelationSource[]
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ""))

  const commit = () => {
    onSave(normalizeCmsFieldValue(field, draft))
    setEditing(false)
  }

  if (field.type === "toggle") {
    const bool = Boolean(value)
    return (
      <button type="button" onClick={() => onSave(!bool)}
        className={`flex h-5 w-9 items-center rounded-full transition-colors ${bool ? "bg-[#00b5f6]" : "bg-white/10"}`}>
        <span className={`ml-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${bool ? "translate-x-4" : ""}`} />
      </button>
    )
  }

  if (field.type === "select" && field.options?.length) {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onSave(e.target.value)}
        className="h-7 w-full rounded bg-transparent text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00b5f6]/40 cursor-pointer"
      >
        <option value="">—</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (field.type === "relation" && field.relation) {
    const source = relationSources.find((item) => item.slug === field.relation?.collectionSlug)
    const selectedIds = getRelationIds(field, value)

    if (!source) {
      return <span className="text-xs text-amber-300/80">Relacion sin coleccion destino</span>
    }

    if (field.relation.multiple) {
      return (
        <div className="space-y-1">
          <select
            multiple
            value={selectedIds}
            onChange={(e) => {
              const next = Array.from(e.currentTarget.selectedOptions).map((option) => option.value)
              onSave(next)
            }}
            className="min-h-[88px] w-full rounded bg-transparent px-1 py-1 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00b5f6]/40"
          >
            {source.records.map((record) => (
              <option key={record.id} value={record.id}>
                {getRelationRecordLabel(source.fields, record, field.relation?.displayField)}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-600">
            {selectedIds.length > 0 ? `${selectedIds.length} relacionado(s)` : "Sin relaciones"}
          </p>
        </div>
      )
    }

    return (
      <select
        value={selectedIds[0] ?? ""}
        onChange={(e) => onSave(e.target.value)}
        className="h-7 w-full rounded bg-transparent text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#00b5f6]/40 cursor-pointer"
      >
        <option value="">—</option>
        {source.records.map((record) => (
          <option key={record.id} value={record.id}>
            {getRelationRecordLabel(source.fields, record, field.relation?.displayField)}
          </option>
        ))}
      </select>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(String(value ?? "")); setEditing(true) }}
        onFocus={() => setEditing(true)}
        className="min-h-[28px] w-full cursor-text truncate rounded px-1.5 py-1 text-left text-sm text-slate-300 hover:bg-white/[0.04]"
      >
        {String(value ?? "")}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className="flex-1 rounded bg-[#0a1628] border border-[#00b5f6]/40 px-2 py-1 text-sm text-white focus:outline-none"
      />
      <button type="button" onClick={commit} className="grid h-6 w-6 place-items-center rounded text-emerald-400 hover:bg-emerald-400/10">
        <Check size={11} />
      </button>
      <button type="button" onClick={() => setEditing(false)} className="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-white/[0.06]">
        <X size={11} />
      </button>
    </div>
  )
}

// ─── FieldBuilder ─────────────────────────────────────────────────────────────

function FieldBuilder({ fields, siteId, collectionSlug, availableCollections, onUpdated }: {
  fields: FieldDef[]
  siteId: string
  collectionSlug: string
  availableCollections: Pick<RelationSource, "id" | "name" | "slug" | "fields">[]
  onUpdated: () => void
}) {
  const [name, setName]           = useState("")
  const [type, setType]           = useState<FieldDef["type"]>("text")
  const [required, setRequired]   = useState(false)
  const [options, setOptions]     = useState("")  // comma-separated for select
  const [min, setMin]             = useState("")
  const [max, setMax]             = useState("")
  const [maxLength, setMaxLength] = useState("")
  const [relationCollectionSlug, setRelationCollectionSlug] = useState("")
  const [relationDisplayField, setRelationDisplayField] = useState("")
  const [relationMultiple, setRelationMultiple] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState<string | null>(null)

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

  const saveFields = async (updatedFields: FieldDef[]) => {
    await fetch(`/api/cms/${siteId}/collections/${collectionSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: updatedFields }),
    })
    onUpdated()
  }

  const addField = async () => {
    if (!name.trim()) return
    setSaving(true)
    const slug = slugify(name.trim())
    const newField: FieldDef = {
      id: slug, name: name.trim(), slug, type,
      required: required || undefined,
      options: type === "select" && options.trim()
        ? options.split(",").map((o) => o.trim()).filter(Boolean)
        : undefined,
      min: type === "number" && min ? Number(min) : undefined,
      max: type === "number" && max ? Number(max) : undefined,
      maxLength: type === "text" && maxLength ? Number(maxLength) : undefined,
      relation: type === "relation" && relationCollectionSlug
        ? {
            collectionSlug: relationCollectionSlug,
            multiple: relationMultiple || undefined,
            displayField: relationDisplayField.trim() || undefined,
          }
        : undefined,
    }
    await saveFields([...fields, newField])
    setName(""); setOptions(""); setMin(""); setMax(""); setMaxLength(""); setRequired(false)
    setRelationCollectionSlug(""); setRelationDisplayField(""); setRelationMultiple(false)
    setSaving(false)
  }

  const deleteField = async (id: string) => {
    if (!confirm("¿Eliminar este campo? Los datos existentes en este campo se conservarán pero no serán visibles.")) return
    setDeleteId(id)
    await saveFields(fields.filter((f) => f.id !== id))
    setDeleteId(null)
  }

  return (
    <div className="max-w-7xl mx-auto mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Esquema de campos</h3>

      {/* Existing fields */}
      {fields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-slate-400">
              <span className="font-mono text-[10px] text-[#00b5f6]/70">{FIELD_TYPE_ICON[f.type]}</span>
              <span className="font-medium">{f.name}</span>
              {f.required && <span className="text-red-400/70 text-[10px]">*</span>}
              <button type="button" onClick={() => deleteField(f.id)}
                disabled={deleteId === f.id}
                className="ml-1 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add field form */}
      <div className="flex flex-wrap items-start gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del campo" onKeyDown={(e) => e.key === "Enter" && addField()}
          className="h-8 w-44 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50" />

        <select value={type} onChange={(e) => setType(e.target.value as FieldDef["type"])}
          className="h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none">
          {Object.entries(FIELD_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {/* Type-specific options */}
        {type === "select" && (
          <input type="text" value={options} onChange={(e) => setOptions(e.target.value)}
            placeholder="Opciones separadas por coma"
            className="h-8 flex-1 min-w-32 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/50" />
        )}
        {type === "number" && (
          <>
            <input type="number" value={min} onChange={(e) => setMin(e.target.value)}
              placeholder="Mín" className="h-8 w-16 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none" />
            <input type="number" value={max} onChange={(e) => setMax(e.target.value)}
              placeholder="Máx" className="h-8 w-16 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none" />
          </>
        )}
        {type === "text" && (
          <input type="number" value={maxLength} onChange={(e) => setMaxLength(e.target.value)}
            placeholder="Max chars"
            className="h-8 w-24 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none" />
        )}
        {type === "relation" && (
          <>
            <select
              value={relationCollectionSlug}
              onChange={(e) => {
                setRelationCollectionSlug(e.target.value)
                setRelationDisplayField("")
              }}
              className="h-8 min-w-40 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none"
            >
              <option value="">Coleccion destino</option>
              {availableCollections.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={relationDisplayField}
              onChange={(e) => setRelationDisplayField(e.target.value)}
              disabled={!relationCollectionSlug}
              className="h-8 min-w-40 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-sm text-white focus:outline-none disabled:opacity-50"
            >
              <option value="">Campo visible</option>
              {(availableCollections.find((item) => item.slug === relationCollectionSlug)?.fields ?? []).map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={relationMultiple}
                onChange={(e) => setRelationMultiple(e.target.checked)}
                className="accent-[#00b5f6]"
              />
              <span className="text-xs text-slate-400">Multiple</span>
            </label>
          </>
        )}

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-white/[0.06] cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)}
            className="accent-[#00b5f6]" />
          <span className="text-xs text-slate-400">Requerido</span>
        </label>

        <button
          type="button"
          onClick={addField}
          disabled={saving || !name.trim() || (type === "relation" && !relationCollectionSlug)}
          className="h-8 px-3 rounded-lg bg-[#00b5f6] text-[#112540] text-xs font-bold hover:bg-[#00ceff] disabled:opacity-50 transition-colors">
          {saving ? "Guardando…" : "+ Añadir campo"}
        </button>
      </div>
    </div>
  )
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

function CsvImporter({ fields, siteId, collectionSlug, onImported }: {
  fields: FieldDef[]
  siteId: string
  collectionSlug: string
  onImported: (count: number) => void
}) {
  const [open, setOpen]         = useState(false)
  const [rows, setRows]         = useState<string[][]>([])
  const [headers, setHeaders]   = useState<string[]>([])
  const [mapping, setMapping]   = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [error, setError]       = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const parseFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "")
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) { setError("El archivo debe tener al menos 2 filas (encabezado + datos)"); return }
      const parseRow = (line: string): string[] => {
        const result: string[] = []
        let inQuotes = false
        let current = ""
        for (const ch of line) {
          if (ch === '"') { inQuotes = !inQuotes; continue }
          if (ch === "," && !inQuotes) { result.push(current); current = ""; continue }
          current += ch
        }
        result.push(current)
        return result
      }
      const hdrs = parseRow(lines[0])
      const dataRows = lines.slice(1, 101).map(parseRow) // preview up to 100 rows
      setHeaders(hdrs)
      setRows(dataRows)
      // Auto-map: try to match CSV header to field slug
      const autoMap: Record<string, string> = {}
      hdrs.forEach((h) => {
        const slug = h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
        if (fields.find((f) => f.slug === slug)) autoMap[h] = slug
      })
      setMapping(autoMap)
      setError("")
    }
    reader.readAsText(file, "utf-8")
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const doImport = async () => {
    setImporting(true)
    setError("")
    let count = 0
    try {
      for (const row of rows) {
        const data: Record<string, unknown> = {}
        headers.forEach((h, i) => {
          const fieldSlug = mapping[h]
          if (!fieldSlug) return
          const field = fields.find((f) => f.slug === fieldSlug)
          if (!field) return
          const raw = row[i] ?? ""
          data[fieldSlug] = normalizeCmsFieldValue(field, raw)
        })
        if (Object.keys(data).length === 0) continue
        const res = await fetch(`/api/cms/${siteId}/collections/${collectionSlug}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        })
        if (res.ok) count++
      }
      onImported(count)
      setOpen(false)
      setRows([]); setHeaders([]); setMapping({})
    } catch {
      setError("Error al importar. Revisa el formato del archivo.")
    } finally {
      setImporting(false)
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-slate-400 hover:text-white transition-colors">
        <Upload size={12} /> CSV
      </button>
    )
  }

  return (
    <div className="max-w-7xl mx-auto mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Importar CSV</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300">
          <X size={14} />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#00b5f6]/15 border border-[#00b5f6]/30 text-[#00b5f6] text-xs font-semibold cursor-pointer hover:bg-[#00b5f6]/25 transition-colors">
            <Upload size={12} />
            Seleccionar archivo CSV
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
          <p className="text-xs text-slate-600">Primera fila = encabezados · hasta 100 registros por importación</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Column mapping */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {headers.map((h) => (
              <div key={h} className="space-y-0.5">
                <p className="text-[10px] text-slate-500 truncate font-mono">{h}</p>
                <select value={mapping[h] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                  className="h-7 w-full rounded-lg bg-white/[0.05] border border-white/[0.08] px-2 text-xs text-white focus:outline-none">
                  <option value="">— ignorar —</option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.slug}>{f.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {headers.map((h) => (
                    <th key={h} className="px-2 py-1.5 text-left text-slate-500 font-mono whitespace-nowrap">
                      {mapping[h] ? <span className="text-[#00b5f6]/80">{mapping[h]}</span> : <span className="line-through opacity-40">{h}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-1 text-slate-400 truncate max-w-[120px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={doImport} disabled={importing}
              className="h-8 px-4 rounded-lg bg-[#00b5f6] text-[#112540] text-xs font-bold hover:bg-[#00ceff] disabled:opacity-50 transition-colors">
              {importing ? "Importando…" : `Importar ${rows.length} registros`}
            </button>
            <button type="button" onClick={() => { setRows([]); setHeaders([]) }}
              className="h-8 px-3 rounded-lg border border-white/[0.08] text-xs text-slate-400 hover:text-white transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CmsRecordsImpl({
  siteId,
  siteName,
  collection,
  initialRecords,
  relationSources,
  initialQuery = "",
  initialRecordId = "",
  initialStatusFilter = "all",
  initialSort = "createdAt_desc",
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fields = useMemo(() => parseCmsFields(collection.fields), [collection.fields])
  const [records, setRecords] = useState<RecordRow[]>(() =>
    initialRecords.map((record) => ({
      ...record,
      workflowStatus: record.workflowStatus ?? getCmsWorkflowStatus(record.data, record.publishedAt),
    }))
  )
  const [showFields, setShowFields] = useState(false)
  const [showCsv, setShowCsv]       = useState(false)
  const [addingRow, setAddingRow]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [recordIdFilter, setRecordIdFilter] = useState(initialRecordId)
  const [statusFilter, setStatusFilter] = useState<"all" | CmsWorkflowStatus>(initialStatusFilter)
  const [sort, setSort] = useState<RecordsSortValue>(initialSort)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState<false | "delete" | CmsWorkflowStatus>(false)

  const hydrateRecords = useCallback((nextRecords: RecordRow[]) => (
    nextRecords.map((record) => ({
      ...record,
      workflowStatus: record.workflowStatus ?? getCmsWorkflowStatus(record.data, record.publishedAt),
    }))
  ), [])

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const visibleSelectedCount = useMemo(
    () => records.filter((record) => selectedIdSet.has(record.id)).length,
    [records, selectedIdSet]
  )
  const selectedSummary = useMemo(
    () => summarizeSelectedWorkflow(records, selectedIds),
    [records, selectedIds]
  )
  const allVisibleSelected = records.length > 0 && visibleSelectedCount === records.length
  const viewQuery = useMemo(() => buildCmsRecordsViewQuery({
    q: query,
    recordId: recordIdFilter,
    status: statusFilter,
    sort,
  }), [query, recordIdFilter, statusFilter, sort])

  const loadRecords = useCallback(async (options?: { preserveNotice?: boolean }) => {
    setLoadingRecords(true)
    const params = new URLSearchParams({
      limit: "200",
      sort,
    })
    if (query.trim()) params.set("q", query.trim())
    if (recordIdFilter.trim()) params.set("recordId", recordIdFilter.trim())
    if (statusFilter !== "all") params.set("status", statusFilter)

    try {
      const res = await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records?${params.toString()}`)
      const data = await res.json() as { records?: RecordRow[] }
      const nextRecords = hydrateRecords(data.records ?? [])
      setRecords(nextRecords)
      setSelectedIds((prev) => prev.filter((id) => nextRecords.some((record) => record.id === id)))
      setActionError(null)
      if (!options?.preserveNotice) setImportNotice(null)
    } finally {
      setLoadingRecords(false)
    }
  }, [collection.slug, hydrateRecords, query, recordIdFilter, siteId, sort, statusFilter])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadRecords({ preserveNotice: true })
    }, query.trim() ? 220 : 0)

    return () => window.clearTimeout(handle)
  }, [loadRecords, query, recordIdFilter])

  useEffect(() => {
    const currentQuery = searchParams?.toString() ?? ""
    if (currentQuery === viewQuery) return
    router.replace(viewQuery ? `${pathname}?${viewQuery}` : pathname, { scroll: false })
  }, [pathname, router, searchParams, viewQuery])

  const updateCell = useCallback(async (recordId: string, fieldSlug: string, value: unknown) => {
    const record = records.find((r) => r.id === recordId)
    if (!record) return
    const field = fields.find((item) => item.slug === fieldSlug)
    const nextValue = field ? normalizeCmsFieldValue(field, value) : value
    const nextData = { ...record.data, [fieldSlug]: nextValue }
    setRecords((prev) => prev.map((r) => r.id === recordId ? { ...r, data: nextData } : r))
    setActionError(null)
    const res = await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: nextData }),
    })
    if (!res.ok) {
      setActionError("No pudimos guardar ese cambio. Recargamos la tabla para mantener consistencia.")
      void loadRecords({ preserveNotice: true })
    }
  }, [records, fields, siteId, collection.slug, loadRecords])

  const setWorkflowStatus = useCallback(async (record: RecordRow, status: CmsWorkflowStatus) => {
    const nextPublishedAt = status === "published" ? new Date().toISOString() : null
    setRecords((prev) => prev.map((r) => r.id === record.id
      ? { ...r, data: applyBulkWorkflowStatus([r], [r.id], status, nextPublishedAt)[0].data, publishedAt: nextPublishedAt, workflowStatus: status }
      : r))
    setActionError(null)
    const res = await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowStatus: status }),
    })
    if (!res.ok) {
      setActionError("No pudimos actualizar el estado. Recargamos la tabla para evitar inconsistencias.")
      void loadRecords({ preserveNotice: true })
      return
    }
    if (statusFilter !== "all" || query.trim() || recordIdFilter.trim() || sort !== "createdAt_desc") {
      void loadRecords({ preserveNotice: true })
    }
  }, [siteId, collection.slug, statusFilter, query, recordIdFilter, sort, loadRecords])

  const addRow = useCallback(async () => {
    setAddingRow(true)
    const emptyData = Object.fromEntries(
      fields.map((f) => [f.slug, getDefaultFieldValue(f)])
    )
    const res = await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: emptyData }),
    })
    const { record } = await res.json() as { record: RecordRow }
    if (statusFilter === "all" && !query.trim() && !recordIdFilter.trim() && sort === "createdAt_desc") {
      setRecords((prev) => [{
        ...record,
        workflowStatus: record.workflowStatus ?? getCmsWorkflowStatus(record.data, record.publishedAt),
      }, ...prev])
    } else {
      void loadRecords({ preserveNotice: true })
    }
    setAddingRow(false)
  }, [fields, siteId, collection.slug, statusFilter, query, recordIdFilter, sort, loadRecords])

  const deleteRow = useCallback(async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return
    setDeletingId(id)
    await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records/${id}`, { method: "DELETE" })
    setRecords((prev) => prev.filter((r) => r.id !== id))
    if (statusFilter !== "all" || query.trim() || recordIdFilter.trim() || sort !== "createdAt_desc") {
      void loadRecords({ preserveNotice: true })
    }
    setDeletingId(null)
  }, [siteId, collection.slug, statusFilter, query, recordIdFilter, sort, loadRecords])

  const toggleRecordSelection = useCallback((recordId: string) => {
    setSelectedIds((prev) => (
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    ))
  }, [])

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      if (records.length === 0) return prev
      const visibleIds = records.map((record) => record.id)
      const hasAllVisible = visibleIds.every((id) => prev.includes(id))
      if (hasAllVisible) {
        return prev.filter((id) => !visibleIds.includes(id))
      }

      return Array.from(new Set([...prev, ...visibleIds]))
    })
  }, [records])

  const runBulkAction = useCallback(async (action: "delete" | "setWorkflowStatus", workflowStatus?: CmsWorkflowStatus) => {
    if (selectedIds.length === 0) return
    if (action === "delete" && !confirm(`¿Eliminar ${selectedIds.length} registro(s)?`)) return

    setBulkBusy(action === "delete" ? "delete" : (workflowStatus ?? false))
    setActionError(null)
    const previousRecords = records
    const previousSelectedIds = selectedIds

    const optimisticSelected = new Set(selectedIds)
    if (action === "delete") {
      setRecords((prev) => removeBulkSelectedRecords(prev, optimisticSelected))
    } else if (workflowStatus) {
      setRecords((prev) => applyBulkWorkflowStatus(prev, optimisticSelected, workflowStatus))
    }

    setSelectedIds([])

    try {
      const res = await fetch(`/api/cms/${siteId}/collections/${collection.slug}/records/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          recordIds: selectedIds,
          workflowStatus,
        }),
      })
      if (!res.ok) {
        setRecords(previousRecords)
        setSelectedIds(previousSelectedIds)
        setActionError(
          action === "delete"
            ? "No pudimos eliminar la selección. Restauramos la tabla."
            : "No pudimos actualizar la selección. Restauramos los estados anteriores."
        )
        return
      }
      setImportNotice(
        action === "delete"
          ? `${previousSelectedIds.length} registro${previousSelectedIds.length === 1 ? "" : "s"} eliminado${previousSelectedIds.length === 1 ? "" : "s"} correctamente.`
          : `${previousSelectedIds.length} registro${previousSelectedIds.length === 1 ? "" : "s"} movido${previousSelectedIds.length === 1 ? "" : "s"} a ${workflowStatus}.`
      )
    } finally {
      setBulkBusy(false)
      if (statusFilter !== "all" || query.trim() || recordIdFilter.trim() || sort !== "createdAt_desc" || action === "delete") {
        void loadRecords({ preserveNotice: true })
      }
    }
  }, [selectedIds, siteId, collection.slug, statusFilter, query, recordIdFilter, sort, loadRecords, records])

  return (
    <div className="px-4 py-8">

      {/* Header */}
      <div className="mb-6 max-w-7xl mx-auto">
        <Link href={`/dashboard/cms/${siteId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors">
          <ArrowLeft size={12} /> {siteName} / CMS
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00b5f6]/10 border border-[#00b5f6]/20 grid place-items-center">
              <Database size={16} className="text-[#00b5f6]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{collection.name}</h1>
              <p className="text-xs text-slate-600 font-mono">
                /{collection.slug} · {records.length} registros · {fields.length} campos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setShowFields(!showFields); setShowCsv(false) }}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-colors ${
                showFields
                  ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
              }`}>
              <Settings2 size={12} />
              Campos
              <ChevronDown size={11} className={`transition-transform ${showFields ? "rotate-180" : ""}`} />
            </button>
            <button type="button" onClick={() => { setShowCsv(!showCsv); setShowFields(false) }}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-colors ${
                showCsv
                  ? "border-[#00b5f6]/40 bg-[#00b5f6]/10 text-[#00b5f6]"
                  : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
              }`}>
              <Upload size={12} /> CSV
            </button>
            <button type="button" onClick={addRow} disabled={addingRow || fields.length === 0}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#00b5f6]/15 border border-[#00b5f6]/30 text-[#00b5f6] text-xs font-semibold hover:bg-[#00b5f6]/25 transition-colors disabled:opacity-50">
              <Plus size={12} /> {addingRow ? "Añadiendo…" : "Añadir registro"}
            </button>
          </div>
        </div>
        {importNotice && (
          <div className="mt-4 rounded-xl border border-[rgba(0,181,246,0.28)] bg-[rgba(0,181,246,0.10)] px-4 py-3 text-sm text-[#9fe8ff]">
            {importNotice}
          </div>
        )}
        {actionError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={14} /> {actionError}
          </div>
        )}
        {(statusFilter !== "all" || query.trim() || recordIdFilter.trim() || sort !== "createdAt_desc") && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Vista activa</span>
            {statusFilter !== "all" && (
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${WORKFLOW_STATUS_META[statusFilter].chip}`}
              >
                {WORKFLOW_STATUS_META[statusFilter].label}
                <X size={11} />
              </button>
            )}
            {query.trim() && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300"
              >
                Busqueda: {query.trim()}
                <X size={11} />
              </button>
            )}
            {recordIdFilter.trim() && (
              <button
                type="button"
                onClick={() => setRecordIdFilter("")}
                className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-200"
              >
                Record ID: {recordIdFilter.trim()}
                <X size={11} />
              </button>
            )}
            {sort !== "createdAt_desc" && (
              <button
                type="button"
                onClick={() => setSort("createdAt_desc")}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300"
              >
                Orden personalizado
                <X size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all")
                setQuery("")
                setRecordIdFilter("")
                setSort("createdAt_desc")
              }}
              className="ml-auto h-8 rounded-lg border border-white/[0.08] px-3 text-xs text-slate-400 transition-colors hover:text-white"
            >
              Limpiar vista
            </button>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en registros..."
              className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b5f6]/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | CmsWorkflowStatus)}
            className="h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-300 focus:outline-none focus:border-[#00b5f6]/40"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="published">Published</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as RecordsSortValue)}
            className="h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-300 focus:outline-none focus:border-[#00b5f6]/40"
          >
            <option value="createdAt_desc">Mas nuevos</option>
            <option value="createdAt_asc">Mas antiguos</option>
            <option value="updatedAt_desc">Actualizados reciente</option>
            <option value="updatedAt_asc">Actualizados antes</option>
            <option value="status_asc">Estado A-Z</option>
            <option value="status_desc">Estado Z-A</option>
          </select>
          <div className="min-w-[88px] text-right text-xs text-slate-500">
            {loadingRecords ? "Cargando..." : `${records.length} visible(s)`}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#00b5f6]/20 bg-[#00b5f6]/8 p-3">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[#8adfff]">Seleccion</span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white">
              {selectedIds.length} marcado(s)
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              Draft {selectedSummary.draft}
            </span>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
              Review {selectedSummary.review}
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              Published {selectedSummary.published}
            </span>
            <button
              type="button"
              onClick={() => void runBulkAction("setWorkflowStatus", "draft")}
              disabled={Boolean(bulkBusy)}
              className="h-8 rounded-lg border border-white/[0.08] px-3 text-xs text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            >
              {bulkBusy === "draft" ? "Moviendo..." : "Pasar a Draft"}
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("setWorkflowStatus", "review")}
              disabled={Boolean(bulkBusy)}
              className="h-8 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 text-xs text-amber-300 transition-colors hover:bg-amber-500/15 disabled:opacity-50"
            >
              {bulkBusy === "review" ? "Moviendo..." : "Mandar a Review"}
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("setWorkflowStatus", "published")}
              disabled={Boolean(bulkBusy)}
              className="h-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/15 disabled:opacity-50"
            >
              {bulkBusy === "published" ? "Publicando..." : "Publicar seleccion"}
            </button>
            <button
              type="button"
              onClick={() => void runBulkAction("delete")}
              disabled={Boolean(bulkBusy)}
              className="ml-auto h-8 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-50"
            >
              {bulkBusy === "delete" ? "Eliminando..." : "Eliminar seleccion"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={Boolean(bulkBusy)}
              className="h-8 rounded-lg border border-white/[0.08] px-3 text-xs text-slate-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Limpiar seleccion
            </button>
          </div>
        )}
      </div>

      {/* Field builder */}
      {showFields && (
        <FieldBuilder
          fields={fields}
          siteId={siteId}
          collectionSlug={collection.slug}
          availableCollections={relationSources.map(({ id, name, slug, fields: sourceFields }) => ({
            id,
            name,
            slug,
            fields: sourceFields,
          }))}
          onUpdated={() => window.location.reload()}
        />
      )}

      {/* CSV import */}
      {showCsv && (
        <CsvImporter
          fields={fields}
          siteId={siteId}
          collectionSlug={collection.slug}
          onImported={(count) => {
            setShowCsv(false)
            setImportNotice(`${count} registro${count === 1 ? "" : "s"} importado${count === 1 ? "" : "s"} correctamente.`)
            void loadRecords({ preserveNotice: true })
          }}
        />
      )}

      {/* Table */}
      {fields.length === 0 ? (
        <div className="max-w-7xl mx-auto rounded-2xl border border-dashed border-white/[0.08] p-16 text-center">
          <Settings2 size={28} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm font-semibold text-slate-500 mb-1">Sin campos definidos</p>
          <p className="text-xs text-slate-600">Abre &quot;Campos&quot; para añadir la estructura de datos</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="w-11 shrink-0 px-2 py-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="grid h-6 w-6 place-items-center rounded text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title={allVisibleSelected ? "Deseleccionar visibles" : "Seleccionar visibles"}
                  >
                    {allVisibleSelected ? <CheckSquare2 size={14} /> : <Square size={14} />}
                  </button>
                </th>
                {fields.map((f) => (
                  <th key={f.id} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-white/[0.04] px-1 rounded font-mono text-[#00b5f6]/60">
                        {FIELD_TYPE_ICON[f.type]}
                      </span>
                      {f.name}
                      {f.required && <span className="text-red-400/60">*</span>}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 text-center w-[220px]">Estado</th>
                <th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 3} className="py-12 text-center text-xs text-slate-700">
                    {statusFilter === "all"
                      ? "Sin registros — haz clic en \"Añadir registro\""
                      : `Sin registros en ${WORKFLOW_STATUS_META[statusFilter].label} — prueba con otra vista o crea contenido nuevo`}
                  </td>
                </tr>
              )}
              {records.map((record, i) => {
                const workflowStatus = record.workflowStatus ?? getCmsWorkflowStatus(record.data, record.publishedAt)
                const workflowMeta = WORKFLOW_STATUS_META[workflowStatus]
                const selected = selectedIdSet.has(record.id)

                return (
                  <tr key={record.id}
                    className={`border-b border-white/[0.04] transition-colors ${selected ? "bg-[#00b5f6]/6" : "hover:bg-white/[0.02]"} ${deletingId === record.id ? "opacity-50" : ""}`}>
                    <td className="px-2 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRecordSelection(record.id)}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 transition-colors hover:text-white"
                        title={selected ? "Deseleccionar registro" : "Seleccionar registro"}
                      >
                        {selected ? <CheckSquare2 size={14} className="text-[#8adfff]" /> : <Square size={14} />}
                        <span className="font-mono">{i + 1}</span>
                      </button>
                    </td>
                    {fields.map((f) => (
                      <td key={f.id} className="px-2 py-1 min-w-[120px] max-w-[260px]">
                        <Cell value={record.data[f.slug]} field={f}
                          relationSources={relationSources}
                          onSave={(v) => updateCell(record.id, f.slug, v)} />
                      </td>
                    ))}
                    <td className="px-3 py-1 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold ${workflowMeta.chip}`}>
                          {workflowMeta.label}
                        </span>
                        <div className="flex items-center gap-1">
                          {(["draft", "review", "published"] as CmsWorkflowStatus[]).map((status) => {
                            const meta = WORKFLOW_STATUS_META[status]
                            const active = workflowStatus === status
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => setWorkflowStatus(record, status)}
                                className={`h-6 rounded-full border px-2 text-[10px] font-semibold transition-colors ${
                                  active ? meta.chip : meta.button
                                }`}
                              >
                                {meta.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <button type="button" onClick={() => deleteRow(record.id)}
                        className="grid h-6 w-6 place-items-center rounded text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
