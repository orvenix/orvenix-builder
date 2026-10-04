"use client"

import { AlignCenter, ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, GripVertical, Image as ImageIcon, Link2, Lock, Menu, PaintBucket, Palette, PencilLine, Smartphone, Trash2, Type } from "lucide-react"
import { useState, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

import {
  ALIGN_OPTIONS,
  BUTTON_VARIANT_OPTIONS,
  IMAGE_FIT_OPTIONS,
  getNodeEditCapabilities,
  parseNavLabelOverrides,
  sanitizeCustomerHrefV1,
  serializeNavLabelOverrides,
} from "@/lib/editor/context-capabilities"
import { computeSectionStep, getParentId } from "@/lib/editor/selection-model"
import {
  PROTECTED_NAV_SLUGS,
  computeBackgroundTreatmentPatch,
  computeCompositionSwap,
  computeSiblingStep,
  getStructureCapabilities,
  parseHiddenNavSlugs,
  serializeHiddenNavSlugs,
} from "@/lib/editor/structure-rules"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"
import type { NodeId } from "@/types/editor"

import type { SectionDragHandle } from "./customer-canvas-context"

type Panel = "link" | "align" | "variant" | "alt" | "fit" | "nav" | "size" | "background" | null

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
export function CustomerContextBar({
  selectedId,
  dragHandle,
  onStartSiblingDrag,
}: {
  selectedId: NodeId
  dragHandle?: SectionDragHandle
  onStartSiblingDrag?: (event: ReactPointerEvent, id: NodeId) => void
}) {
  const tree = useEditorStore((s) => s.tree)
  const editingNodeId = useEditorStore((s) => s.editingNodeId)
  const availablePages = useEditorStore((s) => s.availablePages)
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps)
  const setEditingNode = useEditorStore((s) => s.setEditingNode)
  const openAssetPicker = useEditorStore((s) => s.openAssetPicker)
  const reorderChildren = useEditorStore((s) => s.reorderChildren)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const removeNode = useEditorStore((s) => s.removeNode)
  const execute = useEditorStore((s) => s.execute)
  const [panel, setPanel] = useState<Panel>(null)

  const node = tree.nodes[selectedId]
  const capabilities = getNodeEditCapabilities(tree, selectedId)
  const structure = getStructureCapabilities(tree, selectedId)
  const pages = availablePages.map((page) => ({ slug: page.slug, name: page.name }))
  const pageSlugs = pages.map((page) => page.slug)
  const toggle = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next))
  const commit = (props: Record<string, unknown>) => {
    // Unchanged values are not committed (no empty history entries, no false dirty state).
    const changed = Object.fromEntries(Object.entries(props).filter(([key, value]) => node?.props[key] !== value))
    if (Object.keys(changed).length) updateNodeProps(selectedId, changed)
  }
  const moveWithinParent = (direction: "before" | "after") => {
    const next = computeSiblingStep(tree, selectedId, direction)
    const parentId = next ? getParentId(tree, selectedId) : null
    if (next && parentId) reorderChildren(parentId, next)
  }
  const swapComposition = () => {
    if (!structure.split) return
    const next = computeCompositionSwap(tree, structure.split.containerId)
    if (next) reorderChildren(structure.split.containerId, next)
  }
  // One transaction (one undo): the section background and any foreground colour that would lose contrast.
  const applyBackground = (color: string) => {
    const patch = computeBackgroundTreatmentPatch(tree, selectedId, color)
    if (!patch) return
    execute(`section-background:${selectedId}`, (draft) => {
      for (const [nodeId, props] of Object.entries(patch)) {
        const target = draft.tree.nodes[nodeId]
        if (!target) continue
        target.props = { ...target.props, ...props }
        target.version = (target.version ?? 0) + 1
      }
    })
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
        {structure.sizes.length > 0 && <BarButton label="Tamaño" icon={<Type size={13} />} pressed={panel === "size"} onClick={() => toggle("size")} />}
        {structure.split && (
          <BarButton label={structure.split.mediaFirst ? "Imagen a la derecha" : "Imagen a la izquierda"} icon={<ArrowLeftRight size={13} />} onClick={swapComposition} />
        )}
        {structure.background.length > 0 && <BarButton label="Fondo" icon={<PaintBucket size={13} />} pressed={panel === "background"} onClick={() => toggle("background")} />}
        {structure.hideOnMobile && (
          <BarButton
            label={node.props.hideOnMobile === true ? "Mostrar en celular" : "Ocultar en celular"}
            icon={<Smartphone size={13} />}
            pressed={node.props.hideOnMobile === true}
            onClick={() => commit({ hideOnMobile: node.props.hideOnMobile !== true })}
          />
        )}
        {structure.reorder && (
          <>
            {onStartSiblingDrag && (
              <span
                role="button"
                tabIndex={-1}
                title="Arrastra para cambiar el orden"
                aria-label="Arrastrar para reordenar"
                onPointerDown={(event) => onStartSiblingDrag(event, selectedId)}
                className="grid h-8 w-8 cursor-grab touch-none place-items-center rounded-full text-cyan-100/75 transition hover:bg-white/10 hover:text-white active:cursor-grabbing"
              >
                <GripVertical size={13} />
              </span>
            )}
            <IconButton label="Mover antes" disabled={!computeSiblingStep(tree, selectedId, "before")} onClick={() => moveWithinParent("before")}><ChevronLeft size={13} /></IconButton>
            <IconButton label="Mover después" disabled={!computeSiblingStep(tree, selectedId, "after")} onClick={() => moveWithinParent("after")}><ChevronRight size={13} /></IconButton>
          </>
        )}

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
      {panel === "size" && (
        <Popover title="Tamaño">
          <Choice options={structure.sizes} value={String(node.props.size ?? "")} onChange={(value) => commit({ size: value })} />
        </Popover>
      )}
      {panel === "background" && (
        <Popover title="Fondo de la sección">
          <div role="radiogroup" className="flex flex-wrap gap-1.5">
            {structure.background.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={String(node.props.background ?? "").toLowerCase() === option.color.toLowerCase()}
                onClick={() => applyBackground(option.color)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 aria-checked:border-cyan-600 aria-checked:ring-1 aria-checked:ring-cyan-600"
              >
                <span className="h-4 w-4 rounded-full border border-slate-300" style={{ background: option.color }} aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Los textos se ajustan para seguir siendo legibles.</p>
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
            hidden={parseHiddenNavSlugs(node.props.hiddenSlugs)}
            validate={(value) => sanitizeCustomerHrefV1(value, pageSlugs)}
            onSubmit={(values) => {
              commit({
                title: values.brand,
                labelOverrides: serializeNavLabelOverrides(values.labels, pageSlugs),
                ctaLabel: values.ctaLabel,
                ctaHref: values.ctaHref,
                hiddenSlugs: serializeHiddenNavSlugs(values.hidden, pageSlugs),
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
  hidden,
  validate,
  onSubmit,
}: {
  pages: Array<{ slug: string; name: string }>
  brand: string
  labels: Record<string, string>
  ctaLabel: string
  ctaHref: string
  hidden: Set<string>
  validate: (value: string) => string | null
  onSubmit: (values: { brand: string; labels: Record<string, string>; ctaLabel: string; ctaHref: string; hidden: string[] }) => void
}) {
  const [values, setValues] = useState({ brand, labels: { ...labels }, ctaLabel, ctaHref, hidden: Array.from(hidden) })
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
        {pages.map((page) => {
          const isProtected = PROTECTED_NAV_SLUGS.has(page.slug)
          const shown = isProtected || !values.hidden.includes(page.slug)
          return (
            <div key={page.slug} className="flex items-center gap-2">
              <input
                className={INPUT}
                aria-label={`Nombre en el menú para ${page.name}`}
                placeholder={page.name}
                maxLength={40}
                value={values.labels[page.slug] ?? ""}
                onChange={(event) => setValues({ ...values, labels: { ...values.labels, [page.slug]: event.target.value } })}
              />
              <label className="flex shrink-0 items-center gap-1 text-[11px] text-slate-600" title={isProtected ? "Esta página siempre aparece en el menú" : "Ocultar del menú no borra la página"}>
                <input
                  type="checkbox"
                  checked={shown}
                  disabled={isProtected}
                  onChange={(event) => setValues({ ...values, hidden: event.target.checked ? values.hidden.filter((slug) => slug !== page.slug) : [...values.hidden, page.slug] })}
                />
                Mostrar
              </label>
            </div>
          )
        })}
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
