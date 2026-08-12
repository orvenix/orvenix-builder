"use client"

import {
  ArrowLeft,
  FileText,
  LayoutTemplate,
  MousePointerClick,
  Type,
} from "lucide-react"

import { blockRegistry } from "@/components/editor/blocks/registry"
import { useEditorStore } from "@/store/useEditorStore"
import type { EditorNode } from "@/types/editor"

type EditableField = {
  node: EditorNode
  key: "text" | "content" | "label"
  label: string
  multiline: boolean
}

export function ClientContentPanel() {
  const tree = useEditorStore((state) => state.tree)
  const selectedId = useEditorStore((state) => state.selectedId)
  const select = useEditorStore((state) => state.select)
  const setEditingNode = useEditorStore((state) => state.setEditingNode)
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps)

  const root = tree.nodes[tree.rootId]
  const selectedNode = selectedId ? tree.nodes[selectedId] : null

  const sections = (root?.children ?? [])
    .map((id) => tree.nodes[id])
    .filter(Boolean)

  const selectedSection = selectedNode
    ? findTopLevelSection(selectedNode.id, tree.nodes, root?.children ?? []) ?? selectedNode
    : null
  const editableFields = selectedSection
    ? collectEditableFields(selectedSection.id, tree.nodes)
    : []

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#091321] text-slate-200">
      <header className="shrink-0 border-b border-white/[0.06] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-400">
          Contenido
        </p>

        <h2 className="mt-1 text-sm font-black text-white">
          {selectedSection ? friendlyLabel(selectedSection.type, selectedSection.displayName ?? "Sección", 0) : "Personaliza lo básico"}
        </h2>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {selectedSection
            ? "Edita textos y botones desde aquí. Los cambios se reflejan directo en el lienzo."
            : "Elige una sección para modificar sus textos principales sin tocar la estructura profesional."}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {selectedSection ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                select(null)
                setEditingNode(null)
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-left text-xs font-bold text-slate-300 transition hover:border-cyan-300/20 hover:bg-white/[0.055] hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Ver secciones
            </button>

            {editableFields.length === 0 ? (
              <EmptyNotice
                title="No hay textos simples en esta sección"
                detail="Selecciona otra sección o usa el modo Pro para cambios más profundos."
              />
            ) : (
              editableFields.map((field) => (
                <EditableContentField
                  key={`${field.node.id}:${field.key}`}
                  field={field}
                  value={String(field.node.props[field.key] ?? "")}
                  onFocus={() => {
                    select(field.node.id)
                    setEditingNode(null)
                  }}
                  onChange={(value) => updateNodeProps(field.node.id, { [field.key]: value })}
                />
              ))
            )}
          </div>
        ) : sections.length === 0 ? (
          <EmptyNotice
            title="Esta página todavía no tiene contenido"
            detail="Agrega o carga una página para empezar a editar."
          />
        ) : (
          <div className="space-y-2">
            {sections.map((node, index) => {
              const definition = blockRegistry[node.type]
              const label =
                node.displayName ??
                definition?.label ??
                `Sección ${index + 1}`

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    select(node.id)
                    setEditingNode(null)
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-left transition hover:border-cyan-300/20 hover:bg-white/[0.045]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-cyan-300">
                    <LayoutTemplate className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-slate-200">
                      {friendlyLabel(node.type, label, index)}
                    </span>

                    <span className="mt-0.5 block text-[10px] text-emerald-400">
                      Abrir campos editables
                    </span>
                  </span>

                  <span className="text-sm text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300">
                    ›
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function EditableContentField({
  field,
  value,
  onFocus,
  onChange,
}: {
  field: EditableField
  value: string
  onFocus: () => void
  onChange: (value: string) => void
}) {
  const Icon = field.key === "label" ? MousePointerClick : Type

  return (
    <label className="block rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
        {field.label}
      </span>

      {field.multiline ? (
        <textarea
          value={value}
          rows={4}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS + " resize-none leading-5"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      )}
    </label>
  )
}

function EmptyNotice({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
      <FileText className="mx-auto h-5 w-5 text-slate-500" />
      <p className="mt-3 text-xs font-bold text-slate-300">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{detail}</p>
    </div>
  )
}

function collectEditableFields(rootId: string, nodes: Record<string, EditorNode>) {
  const fields: EditableField[] = []
  const visit = (id: string) => {
    const node = nodes[id]
    if (!node) return

    if (node.type === "heading" && typeof node.props.text === "string") {
      fields.push({ node, key: "text", label: node.displayName ?? "Título", multiline: false })
    }

    if (node.type === "text" && typeof node.props.content === "string") {
      fields.push({ node, key: "content", label: node.displayName ?? "Texto", multiline: true })
    }

    if (node.type === "ctaButton" && typeof node.props.label === "string") {
      fields.push({ node, key: "label", label: node.displayName ?? "Botón", multiline: false })
    }

    node.children.forEach(visit)
  }

  visit(rootId)
  return fields.slice(0, 18)
}

function findTopLevelSection(
  selectedId: string,
  nodes: Record<string, EditorNode>,
  topLevelIds: string[],
) {
  if (topLevelIds.includes(selectedId)) return nodes[selectedId] ?? null

  return topLevelIds
    .map((id) => nodes[id])
    .find((node) => node && containsNode(node.id, selectedId, nodes)) ?? null
}

function containsNode(rootId: string, targetId: string, nodes: Record<string, EditorNode>): boolean {
  const root = nodes[rootId]
  if (!root) return false
  if (root.children.includes(targetId)) return true
  return root.children.some((childId) => containsNode(childId, targetId, nodes))
}

function friendlyLabel(
  type: string,
  fallback: string,
  index: number,
): string {
  const normalized = `${type} ${fallback}`.toLowerCase()
  if (normalized.includes("hero") || normalized.includes("portada")) return "Portada"
  if (normalized.includes("service") || normalized.includes("servicio")) return "Servicios"
  if (normalized.includes("about") || normalized.includes("nosotros")) return "Nosotros"
  if (normalized.includes("gallery") || normalized.includes("galer")) return "Galería"
  if (normalized.includes("testimonial")) return "Testimonios"
  if (normalized.includes("contact")) return "Contacto"
  if (normalized.includes("footer") || normalized.includes("pie")) return "Pie de página"
  if (normalized.includes("pricing") || normalized.includes("precio")) return "Precios"
  if (type === "section") return fallback || `Sección ${index + 1}`

  return fallback
}

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/35 focus:bg-white/[0.05]"
