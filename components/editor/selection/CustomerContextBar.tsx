"use client"

import { AlignCenter, ChevronDown, ChevronUp, Copy, GripVertical, Image as ImageIcon, Link2, Lock, Menu, Palette, PencilLine, Trash2, Type } from "lucide-react"
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"

import {
  ALIGN_OPTIONS,
  BUTTON_VARIANT_OPTIONS,
  IMAGE_FIT_OPTIONS,
  getNodeEditCapabilities,
  parseNavLabelOverrides,
  sanitizeCustomerHrefV1,
  serializeNavLabelOverrides,
} from "@/lib/editor/context-capabilities"
import { computeSectionStep } from "@/lib/editor/selection-model"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import type { NodeId } from "@/types/editor"

import type { SectionDragHandle } from "./customer-canvas-context"

type Panel = "link" | "align" | "variant" | "alt" | "fit" | "nav" | null

const PROTECTED_NOTES = {
  commerce: "Precio, inventario y SKU se editan en Productos.",
  "data-bound": "Este contenido viene de tus datos y se actualiza automáticamente.",
} as const

/**
 * VE-2: compact contextual bar for the selected node. Actions come from
 * getNodeEditCapabilities (never from raw block types in the UI) and every
 * action uses the canonical store mutations, so history/dirty/persistence
 * behave exactly like any other edit. Lives in the customer overlay: never
 * part of the website markup, hidden in preview.
 */
export function CustomerContextBar({ selectedId, dragHandle }: { selectedId: NodeId; dragHandle?: SectionDragHandle }) {
  const tree = useEditorStore((s) => s.tree)
  const editingNodeId = useEditorStore((s) => s.editingNodeId)
  const availablePages = useEditorStore((s) => s.availablePages)
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps)
  const setEditingNode = useEditorStore((s) => s.setEditingNode)
  const openAssetPicker = useEditorStore((s) => s.openAssetPicker)
  const reorderChildren = useEditorStore((s) => s.reorderChildren)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const removeNode = useEditorStore((s) => s.removeNode)
  const [panel, setPanel] = useState<Panel>(null)

  const node = tree.nodes[selectedId]
  const capabilities = getNodeEditCapabilities(tree, selectedId)
  const pages = availablePages.map((page) => ({ slug: page.slug, name: page.name }))
  const pageSlugs = pages.map((page) => page.slug)
  const toggle = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next))
  const commit = (props: Record<string, unknown>) => {
    // Unchanged values are not committed (no empty history entries, no false dirty state).
    const changed = Object.fromEntries(Object.entries(props).filter(([key, value]) => node?.props[key] !== value))
    if (Object.keys(changed).length) updateNodeProps(selectedId, changed)
  }
  const moveSection = (direction: "up" | "down") => {
    const next = computeSectionStep(tree, selectedId, direction)
    if (next) reorderChildren(tree.rootId, next)
  }
  // Escape closes the open panel first, before it can change the selection.
  const onPanelKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      setPanel(null)
    }
  }

  if (!node) return null

  return (
    <div className="flex max-w-[min(420px,calc(100vw-16px))] flex-col items-start gap-1.5" onKeyDown={onPanelKeyDown}>
      <div
        role="toolbar"
        aria-label={`Acciones de ${capabilities.label}`}
        className="flex flex-wrap items-center gap-1 rounded-full border border-cyan-300/20 bg-slate-950/90 p-1 text-[10px] font-black text-cyan-100 shadow-2xl shadow-black/35 backdrop-blur-xl"
      >
        <span className="px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">{capabilities.label}</span>

        {capabilities.protected && (
          <span className="flex items-center gap-1.5 px-2 text-[11px] font-semibold normal-case text-slate-300">
            <Lock size={12} aria-hidden="true" />
            {PROTECTED_NOTES[capabilities.protected]}
          </span>
        )}

        {capabilities.text && editingNodeId !== selectedId && (
          <BarButton label="Editar texto" icon={<PencilLine size={13} />} onClick={() => setEditingNode(selectedId)} />
        )}
        {capabilities.link && <BarButton label="Enlace" icon={<Link2 size={13} />} pressed={panel === "link"} onClick={() => toggle("link")} />}
        {capabilities.align && <BarButton label="Alinear" icon={<AlignCenter size={13} />} pressed={panel === "align"} onClick={() => toggle("align")} />}
        {capabilities.buttonVariant && <BarButton label="Estilo" icon={<Palette size={13} />} pressed={panel === "variant"} onClick={() => toggle("variant")} />}
        {capabilities.image && (
          <>
            <BarButton label="Cambiar imagen" icon={<ImageIcon size={13} />} onClick={() => openAssetPicker({ nodeId: selectedId, propKey: capabilities.image!.srcKey })} />
            <BarButton label="Texto alternativo" icon={<Type size={13} />} pressed={panel === "alt"} onClick={() => toggle("alt")} />
          </>
        )}
        {capabilities.imageFit && <BarButton label="Ajuste" icon={<ImageIcon size={13} />} pressed={panel === "fit"} onClick={() => toggle("fit")} />}
        {capabilities.navigation && <BarButton label="Editar menú" icon={<Menu size={13} />} pressed={panel === "nav"} onClick={() => toggle("nav")} />}

        {capabilities.section && (
          <>
            {dragHandle && (
              <span
                {...dragHandle.attributes}
                {...dragHandle.listeners}
                role="button"
                tabIndex={-1}
                title="Arrastra para mover la sección"
                aria-label="Arrastrar sección"
                className="grid h-8 w-8 cursor-grab place-items-center rounded-full text-cyan-100/75 transition hover:bg-white/10 hover:text-white active:cursor-grabbing"
              >
                <GripVertical size={13} />
              </span>
            )}
            <IconButton label="Subir sección" disabled={!computeSectionStep(tree, selectedId, "up")} onClick={() => moveSection("up")}><ChevronUp size={13} /></IconButton>
            <IconButton label="Bajar sección" disabled={!computeSectionStep(tree, selectedId, "down")} onClick={() => moveSection("down")}><ChevronDown size={13} /></IconButton>
            <IconButton label="Duplicar sección" onClick={() => duplicateNode(selectedId)}><Copy size={13} /></IconButton>
            <IconButton
              label="Eliminar sección"
              danger
              onClick={() => {
                if (window.confirm("¿Eliminar esta sección de la página?")) removeNode(selectedId)
              }}
            >
              <Trash2 size={13} />
            </IconButton>
          </>
        )}
      </div>

      {panel === "align" && (
        <Popover title="Alineación">
          <Choice options={ALIGN_OPTIONS} value={String(node.props.align ?? "left")} onChange={(value) => commit({ align: value })} />
        </Popover>
      )}
      {panel === "variant" && (
        <Popover title="Estilo del botón">
          <Choice options={BUTTON_VARIANT_OPTIONS} value={String(node.props.variant ?? "primary")} onChange={(value) => commit({ variant: value })} />
        </Popover>
      )}
      {panel === "fit" && (
        <Popover title="Ajuste de la imagen">
          <Choice options={IMAGE_FIT_OPTIONS} value={String(node.props.objectFit ?? "cover")} onChange={(value) => commit({ objectFit: value })} />
        </Popover>
      )}
      {panel === "alt" && (
        <Popover title="Texto alternativo">
          <TextForm
            label="Describe la imagen para lectores de pantalla"
            initial={String(node.props.alt ?? "")}
            maxLength={160}
            onSubmit={(value) => {
              commit({ alt: value.trim() })
              setPanel(null)
            }}
          />
        </Popover>
      )}
      {panel === "link" && (
        <Popover title="¿A dónde lleva este botón?">
          <LinkForm
            pages={pages}
            initial={String(node.props.href ?? "")}
            validate={(value) => sanitizeCustomerHrefV1(value, pageSlugs)}
            onSubmit={(href) => {
              commit({ href })
              setPanel(null)
            }}
          />
        </Popover>
      )}
      {panel === "nav" && (
        <Popover title="Menú del sitio">
          <NavForm
            pages={pages}
            brand={String(node.props.title ?? "")}
            labels={parseNavLabelOverrides(node.props.labelOverrides)}
            ctaLabel={String(node.props.ctaLabel ?? "")}
            ctaHref={String(node.props.ctaHref ?? "")}
            validate={(value) => sanitizeCustomerHrefV1(value, pageSlugs)}
            onSubmit={(values) => {
              commit({
                title: values.brand,
                labelOverrides: serializeNavLabelOverrides(values.labels, pageSlugs),
                ctaLabel: values.ctaLabel,
                ctaHref: values.ctaHref,
              })
              setPanel(null)
            }}
          />
        </Popover>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function BarButton({ label, icon, onClick, pressed }: { label: string; icon: ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 transition hover:bg-cyan-300/10 hover:text-white", pressed && "bg-cyan-300/15 text-white")}
    >
      {icon}
      {label}
    </button>
  )
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30",
        danger ? "text-red-200/80 hover:bg-red-400/15 hover:text-red-100" : "text-cyan-100/75 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  )
}

function Popover({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="dialog" aria-label={title} className="w-[min(340px,calc(100vw-16px))] rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-2xl">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      {children}
    </div>
  )
}

function Choice<T extends string>({ options, value, onChange }: { options: ReadonlyArray<{ value: T; label: string }>; value: string; onChange: (value: T) => void }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            value === option.value ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 text-slate-700 hover:border-slate-300",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const INPUT = "w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-cyan-500"
const SUBMIT = "rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"

function TextForm({ label, initial, maxLength, onSubmit }: { label: string; initial: string; maxLength: number; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <label className="text-xs text-slate-600">
        {label}
        <input autoFocus className={cn(INPUT, "mt-1")} value={value} maxLength={maxLength} onChange={(event) => setValue(event.target.value)} />
      </label>
      <button type="submit" className={cn(SUBMIT, "self-end")}>Aplicar</button>
    </form>
  )
}

/** Destination: one of the site's pages, or a validated URL / email / phone. */
function DestinationField({ pages, value, onChange, error }: { pages: Array<{ slug: string; name: string }>; value: string; onChange: (value: string) => void; error?: string }) {
  const isPage = value.startsWith("page:")
  return (
    <div className="flex flex-col gap-1.5">
      <select className={INPUT} value={isPage ? value : "custom"} onChange={(event) => onChange(event.target.value === "custom" ? "" : event.target.value)}>
        {pages.map((page) => (
          <option key={page.slug} value={`page:${page.slug}`}>Página: {page.name}</option>
        ))}
        <option value="custom">Otra dirección (web, correo o teléfono)…</option>
      </select>
      {!isPage && (
        <input className={INPUT} value={value} placeholder="https://… · mailto:… · tel:…" onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
      )}
      {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  )
}

const INVALID_DESTINATION = "Esa dirección no es válida o no es segura. Usa una página del sitio, https://, mailto: o tel:."

function LinkForm({ pages, initial, validate, onSubmit }: { pages: Array<{ slug: string; name: string }>; initial: string; validate: (value: string) => string | null; onSubmit: (href: string) => void }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string>()
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        const safe = validate(value)
        if (!safe) return setError(INVALID_DESTINATION)
        onSubmit(safe)
      }}
    >
      <DestinationField pages={pages} value={value} onChange={(next) => { setValue(next); setError(undefined) }} error={error} />
      <button type="submit" className={cn(SUBMIT, "self-end")}>Aplicar</button>
    </form>
  )
}

function NavForm({
  pages,
  brand,
  labels,
  ctaLabel,
  ctaHref,
  validate,
  onSubmit,
}: {
  pages: Array<{ slug: string; name: string }>
  brand: string
  labels: Record<string, string>
  ctaLabel: string
  ctaHref: string
  validate: (value: string) => string | null
  onSubmit: (values: { brand: string; labels: Record<string, string>; ctaLabel: string; ctaHref: string }) => void
}) {
  const [values, setValues] = useState({ brand, labels: { ...labels }, ctaLabel, ctaHref })
  const [error, setError] = useState<string>()
  return (
    <form
      className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto"
      onSubmit={(event: FormEvent) => {
        event.preventDefault()
        // An empty destination keeps the current one (never writes an empty link).
        const safeHref = values.ctaHref.trim() ? validate(values.ctaHref) : ctaHref
        if (safeHref === null) return setError(INVALID_DESTINATION)
        onSubmit({ ...values, brand: values.brand.trim(), ctaLabel: values.ctaLabel.trim(), ctaHref: safeHref })
      }}
    >
      <label className="text-xs text-slate-600">
        Nombre del negocio
        <input className={cn(INPUT, "mt-1")} value={values.brand} maxLength={60} onChange={(event) => setValues({ ...values, brand: event.target.value })} />
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs text-slate-600">Nombres en el menú</legend>
        {pages.map((page) => (
          <input
            key={page.slug}
            className={INPUT}
            aria-label={`Nombre en el menú para ${page.name}`}
            placeholder={page.name}
            maxLength={40}
            value={values.labels[page.slug] ?? ""}
            onChange={(event) => setValues({ ...values, labels: { ...values.labels, [page.slug]: event.target.value } })}
          />
        ))}
      </fieldset>
      <label className="text-xs text-slate-600">
        Texto del botón del menú
        <input className={cn(INPUT, "mt-1")} value={values.ctaLabel} maxLength={30} onChange={(event) => setValues({ ...values, ctaLabel: event.target.value })} />
      </label>
      <div className="text-xs text-slate-600">
        Destino del botón del menú
        <div className="mt-1">
          <DestinationField pages={pages} value={values.ctaHref} onChange={(next) => { setValues({ ...values, ctaHref: next }); setError(undefined) }} error={error} />
        </div>
      </div>
      <button type="submit" className={cn(SUBMIT, "self-end")}>Guardar menú</button>
    </form>
  )
}
