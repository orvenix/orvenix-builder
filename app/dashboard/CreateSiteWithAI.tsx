"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Bot, Eye, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react"

import { runOrvenixSiteCreationAction, type OrvenixSiteCreationActionResult } from "@/app/actions/ai"
import type { EditorTree } from "@/types/editor"

type ServiceField = {
  id: string
  name: string
  description: string
}

type PreviewState = {
  previewId: string
  previewHash: string
  tree: EditorTree
  message: string
}

function createServiceField(): ServiceField {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    description: "",
  }
}

function getPreviewTree(result: OrvenixSiteCreationActionResult): EditorTree | null {
  if (!result.success) return null
  return result.result.plan?.after ?? result.result.tree ?? null
}

function getPublicError(result: OrvenixSiteCreationActionResult) {
  return "message" in result ? result.message : "Orvenix AI no pudo completar la solicitud."
}

function getRootSections(tree: EditorTree) {
  const root = tree.nodes[tree.rootId]
  return (root?.children ?? [])
    .map((id) => tree.nodes[id])
    .filter(Boolean)
    .slice(0, 9)
}

export function CreateSiteWithAI() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [services, setServices] = useState<ServiceField[]>([createServiceField(), createServiceField(), createServiceField()])
  const [isGenerating, startGenerating] = useTransition()
  const [isCreating, startCreating] = useTransition()

  const previewSections = useMemo(() => preview ? getRootSections(preview.tree) : [], [preview])

  function updateService(id: string, patch: Partial<ServiceField>) {
    setServices((current) => current.map((service) => service.id === id ? { ...service, ...patch } : service))
  }

  function removeService(id: string) {
    setServices((current) => current.length <= 1 ? current : current.filter((service) => service.id !== id))
  }

  function resetPreview() {
    setPreview(null)
    setError(null)
  }

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPreview(null)

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()
    const industry = String(formData.get("industry") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const objective = String(formData.get("objective") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const preferredStyle = String(formData.get("preferredStyle") ?? "").trim()
    const cleanServices = services
      .map((service) => ({
        name: service.name.trim(),
        description: service.description.trim(),
      }))
      .filter((service) => service.name)

    const message = [
      name ? `Negocio: ${name}.` : null,
      industry ? `Industria: ${industry}.` : null,
      location ? `Ubicacion: ${location}.` : null,
      objective ? `Objetivo: ${objective}.` : null,
      description || null,
      preferredStyle ? `Estilo visual: ${preferredStyle}.` : null,
      cleanServices.length ? `Servicios: ${cleanServices.map((service) => service.name).join(", ")}.` : null,
    ].filter(Boolean).join(" ")

    startGenerating(async () => {
      const result = await runOrvenixSiteCreationAction({
        mode: "preview",
        message,
        business: {
          name,
          industry,
          location,
          objective,
          description,
          preferredStyle,
          services: cleanServices,
        },
      })

      if (!result.success) {
        setError(getPublicError(result))
        return
      }

      const tree = getPreviewTree(result)
      if (!result.previewId || !result.previewHash || !tree) {
        setError("Orvenix AI no pudo preparar una vista previa valida. Intenta de nuevo.")
        return
      }

      setPreview({
        previewId: result.previewId,
        previewHash: result.previewHash,
        tree,
        message: result.result.message,
      })
    })
  }

  function handleCreate() {
    if (!preview || isCreating) return
    setError(null)

    startCreating(async () => {
      const result = await runOrvenixSiteCreationAction({
        mode: "execute",
        confirmed: true,
        previewId: preview.previewId,
        expectedPreviewHash: preview.previewHash,
      })

      if (!result.success) {
        setError(getPublicError(result))
        return
      }

      const nextRoute = result.nextRoute ?? result.result.createdSite?.nextRoute
      if (!nextRoute) {
        setError("El sitio se creo, pero no recibimos la ruta del editor. Actualiza el dashboard.")
        return
      }

      setOpen(false)
      router.push(nextRoute)
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="relative flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #1BB3FA 0%, #1379A8 100%)",
            boxShadow: "0 18px 42px rgba(19,121,168,0.20), 0 0 0 1px rgba(27,179,250,0.18)",
          }}
        >
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-[100%]" />
          <Bot size={16} className="relative z-10" />
          <span className="relative z-10">Crear con Orvenix AI</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md editor-anim-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[90vh] w-[min(1080px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-white/[0.1] bg-[color:var(--bg)] shadow-2xl shadow-black/45 editor-anim-scale-in lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1fr)]">
          <div className="overflow-y-auto p-6 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(27,179,250,0.22)] bg-[rgba(27,179,250,0.10)]">
                  <Sparkles size={16} className="text-[color:var(--accent)]" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold leading-tight text-[color:var(--text)]">
                    Crear sitio con Orvenix AI
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Genera un borrador editable antes de publicarlo.</p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--text)]">
                  <X size={14} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handlePreview} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" name="name" placeholder="Ej. Clínica Aurora" required />
                <Field label="Industria" name="industry" placeholder="Salud, restaurante, inmobiliaria" required />
                <Field label="Ubicación" name="location" placeholder="Ciudad o zona" />
                <Field label="Objetivo" name="objective" placeholder="Agendar citas, vender, captar leads" />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Descripción del negocio</label>
                <textarea name="description" required rows={4} placeholder="Cuenta qué vende, a quién atiende y qué lo hace diferente." className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-[color:var(--text)] transition-all placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)] focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_4px_rgba(27,179,250,0.08)]" />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Servicios principales</label>
                  <button type="button" onClick={() => setServices((current) => [...current, createServiceField()].slice(0, 8))} className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-[color:var(--accent)] transition-all hover:bg-[rgba(27,179,250,0.08)]">
                    <Plus size={13} /> Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {services.map((service, index) => (
                    <div key={service.id} className="grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 sm:grid-cols-[0.8fr_1fr_auto]">
                      <input value={service.name} onChange={(event) => updateService(service.id, { name: event.target.value })} placeholder={`Servicio ${index + 1}`} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                      <input value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} placeholder="Descripción breve" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                      <button type="button" onClick={() => removeService(service.id)} className="grid h-9 w-9 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label="Eliminar servicio">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Estilo visual</label>
                <select name="preferredStyle" className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-[color:var(--text)] outline-none focus:border-[rgba(27,179,250,0.45)]">
                  <option value="Premium claro, moderno y confiable">Premium claro</option>
                  <option value="Editorial elegante con mucho aire visual">Editorial elegante</option>
                  <option value="Comercial dinamico con CTAs vivos">Comercial dinamico</option>
                  <option value="Local profesional, cercano y confiable">Local profesional</option>
                </select>
              </div>

              {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs text-red-300">{error}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={isGenerating || isCreating} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  {isGenerating ? "Generando Preview" : preview ? "Generar otro Preview" : "Generar Preview"}
                </button>
                <button type="button" onClick={handleCreate} disabled={!preview || isGenerating || isCreating} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(27,179,250,0.24)] px-5 text-sm font-bold text-[color:var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40">
                  {isCreating && <Loader2 size={15} className="animate-spin" />}
                  {isCreating ? "Creando sitio" : "Confirmar y crear"}
                </button>
                {preview && <button type="button" onClick={resetPreview} className="h-11 rounded-2xl px-4 text-sm font-semibold text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]">Descartar Preview</button>}
              </div>
            </form>
          </div>

          <aside className="min-h-[420px] overflow-y-auto border-t border-white/[0.08] bg-white/[0.025] p-6 lg:border-l lg:border-t-0 md:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--accent)]">Preview seguro</p>
                <h3 className="mt-1 text-xl font-black text-[color:var(--text)]">Estructura editable</h3>
              </div>
              {preview && <span className="rounded-full border border-[rgba(27,179,250,0.20)] bg-[rgba(27,179,250,0.08)] px-3 py-1 text-[10px] font-bold text-[color:var(--accent)]">Borrador</span>}
            </div>

            {!preview ? (
              <div className="grid min-h-[300px] place-items-center rounded-[24px] border border-dashed border-white/[0.10] bg-white/[0.025] p-8 text-center">
                <div>
                  <Bot className="mx-auto h-9 w-9 text-[color:var(--accent)]" />
                  <p className="mt-4 text-sm font-semibold text-[color:var(--text)]">Completa el formulario para ver la propuesta.</p>
                  <p className="mt-2 text-xs leading-6 text-[color:var(--text-secondary)]">El Preview no crea ni publica sitios hasta que confirmes.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-xs leading-6 text-[color:var(--text-secondary)]">{preview.message}</p>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    <span>Home</span>
                    <span>{Object.keys(preview.tree.nodes).length} bloques</span>
                  </div>
                  <div className="space-y-2">
                    {previewSections.map((section, index) => (
                      <div key={section.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-[rgba(27,179,250,0.10)] text-xs font-black text-[color:var(--accent)]">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[color:var(--text)]">{section.displayName || section.type}</p>
                          <p className="truncate text-[11px] text-[color:var(--text-muted)]">{section.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Field({ label, name, placeholder, required }: { label: string; name: string; placeholder: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">{label}</label>
      <input name={name} required={required} placeholder={placeholder} className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm text-[color:var(--text)] transition-all placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)] focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_4px_rgba(27,179,250,0.08)]" />
    </div>
  )
}
