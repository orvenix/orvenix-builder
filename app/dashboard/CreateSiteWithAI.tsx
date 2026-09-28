"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Bot, ChevronDown, Eye, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react"

import {
  runOrvenixSiteCreationAction,
  type OrvenixSiteCreationActionResult,
  type SiteCreationPreviewPageV1,
  type SiteCreationQualityGatePreviewV1,
} from "@/app/actions/ai"
import type { EditorTree } from "@/types/editor"
import {
  countPlannedStoreProductsInTreesV1,
  createCommerceBriefDraftV1,
  validateCommerceBriefV1,
  type CommerceBriefDraftV1,
  type CommerceBriefErrorsV1,
} from "@/lib/orvenix-ai/commerce/commerce-brief"
import { CommerceBriefEditor } from "./CommerceBriefEditor"

type ServiceField = {
  id: string
  name: string
  description: string
}

// V2-5F: real, caller-supplied business evidence only -- optional,
// collapsed by default (see the "Informacion adicional" disclosure below).
// Never pre-filled or inferred; empty rows are simply omitted on submit.
type PersonField = {
  id: string
  name: string
  role: string
}

type TestimonialField = {
  id: string
  quote: string
  author: string
  role: string
}

const MAX_EVIDENCE_PEOPLE = 3
const MAX_EVIDENCE_TESTIMONIALS = 3

type PreviewState = {
  previewId: string
  previewHash: string
  tree: EditorTree
  pages: SiteCreationPreviewPageV1[]
  selectedSlug: string
  message: string
  qualityGate?: SiteCreationQualityGatePreviewV1
  /** COMMERCE-2B: how many structured products this preview was generated from (UX messaging only). */
  submittedProductCount: number
}

function createServiceField(): ServiceField {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    description: "",
  }
}

function createPersonField(): PersonField {
  return { id: Math.random().toString(36).slice(2), name: "", role: "" }
}

function createTestimonialField(): TestimonialField {
  return { id: Math.random().toString(36).slice(2), quote: "", author: "", role: "" }
}

function createClientAttemptKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `client:${crypto.randomUUID()}`
  }

  return `client:${Date.now().toString(36)}:${Math.random().toString(36).slice(2)}`
}

function getPreviewTree(result: OrvenixSiteCreationActionResult): EditorTree | null {
  if (!result.success) return null
  return result.result.plan?.after ?? result.result.tree ?? null
}

function getPublicError(result: OrvenixSiteCreationActionResult) {
  return "message" in result ? result.message : "Orvenix AI no pudo completar la solicitud."
}

function getPreviewPages(result: OrvenixSiteCreationActionResult, homeTree: EditorTree): SiteCreationPreviewPageV1[] {
  if (result.success && Array.isArray(result.previewPages) && result.previewPages.length > 0) {
    return result.previewPages
  }

  return [{ slug: "home", title: "Home", isHome: true, tree: homeTree }]
}

function getInitialPreviewSlug(pages: SiteCreationPreviewPageV1[]) {
  return pages.find((page) => page.isHome)?.slug ?? pages[0]?.slug ?? "home"
}

function getSelectedPreviewPage(preview: PreviewState) {
  return preview.pages.find((page) => page.slug === preview.selectedSlug) ?? preview.pages.find((page) => page.isHome) ?? preview.pages[0]
}

function getRootSections(tree: EditorTree) {
  const root = tree.nodes[tree.rootId]
  return (root?.children ?? [])
    .map((id) => tree.nodes[id])
    .filter(Boolean)
    .slice(0, 9)
}

/**
 * COMMERCE-2B: `commerceAvailable` is display-only (computed server-side by
 * the dashboard page from the user's own plan). It never authorizes
 * anything: the Site Creation action re-checks the ecommerce entitlement at
 * preview and the confirm transaction re-checks it again.
 */
export function CreateSiteWithAI({ commerceAvailable = false }: { commerceAvailable?: boolean } = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [services, setServices] = useState<ServiceField[]>([createServiceField(), createServiceField(), createServiceField()])
  const [people, setPeople] = useState<PersonField[]>([])
  const [testimonials, setTestimonials] = useState<TestimonialField[]>([])
  const [showEvidence, setShowEvidence] = useState(false)
  const [commerceDraft, setCommerceDraft] = useState<CommerceBriefDraftV1>(createCommerceBriefDraftV1)
  const [commerceErrors, setCommerceErrors] = useState<CommerceBriefErrorsV1>({})
  const [commerceChangedSincePreview, setCommerceChangedSincePreview] = useState(false)
  const [isGenerating, startGenerating] = useTransition()
  const [isCreating, startCreating] = useTransition()

  const selectedPreviewPage = useMemo(() => preview ? getSelectedPreviewPage(preview) : null, [preview])
  const previewSections = useMemo(() => selectedPreviewPage ? getRootSections(selectedPreviewPage.tree) : [], [selectedPreviewPage])

  function updateService(id: string, patch: Partial<ServiceField>) {
    setServices((current) => current.map((service) => service.id === id ? { ...service, ...patch } : service))
  }

  function removeService(id: string) {
    setServices((current) => current.length <= 1 ? current : current.filter((service) => service.id !== id))
  }

  function addPerson() {
    setPeople((current) => current.length >= MAX_EVIDENCE_PEOPLE ? current : [...current, createPersonField()])
  }

  function updatePerson(id: string, patch: Partial<PersonField>) {
    setPeople((current) => current.map((person) => person.id === id ? { ...person, ...patch } : person))
  }

  function removePerson(id: string) {
    setPeople((current) => current.filter((person) => person.id !== id))
  }

  function addTestimonial() {
    setTestimonials((current) => current.length >= MAX_EVIDENCE_TESTIMONIALS ? current : [...current, createTestimonialField()])
  }

  function updateTestimonial(id: string, patch: Partial<TestimonialField>) {
    setTestimonials((current) => current.map((testimonial) => testimonial.id === id ? { ...testimonial, ...patch } : testimonial))
  }

  function removeTestimonial(id: string) {
    setTestimonials((current) => current.filter((testimonial) => testimonial.id !== id))
  }

  function resetPreview() {
    setPreview(null)
    setError(null)
    setCommerceChangedSincePreview(false)
  }

  function updateCommerceDraft(next: CommerceBriefDraftV1) {
    setCommerceDraft(next)
    setCommerceErrors({})
    // An approved preview is never mutated client-side: product changes require a new Preview.
    if (preview) setCommerceChangedSincePreview(true)
  }

  const plannedStoreProducts = useMemo(
    () => preview ? countPlannedStoreProductsInTreesV1(preview.pages.map((page) => page.tree)) : 0,
    [preview],
  )

  function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    // COMMERCE-2B: UX validation before any request (the server re-validates everything).
    const commerce = validateCommerceBriefV1(commerceDraft)
    if ("errors" in commerce) {
      setCommerceErrors(commerce.errors)
      setError(`Revisa los productos: ${commerce.firstError}`)
      return
    }
    setCommerceErrors({})
    const commerceProducts = commerce.products

    setPreview(null)
    setCommerceChangedSincePreview(false)

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
    // V2-5F: real, caller-supplied evidence only. Cleaned client-side the
    // same way services are; the server-side evidence-normalization module
    // re-validates/bounds everything regardless, so this is a UX nicety,
    // not the trust boundary.
    const whatsapp = String(formData.get("whatsapp") ?? "").trim()
    const phone = String(formData.get("phone") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const hasContact = Boolean(whatsapp || phone || email)

    const cleanPeople = people
      .map((person) => ({ name: person.name.trim(), role: person.role.trim() }))
      .filter((person) => person.name)
      .slice(0, MAX_EVIDENCE_PEOPLE)
      .map((person) => person.role ? person : { name: person.name })

    const cleanTestimonials = testimonials
      .map((testimonial) => ({ quote: testimonial.quote.trim(), author: testimonial.author.trim(), role: testimonial.role.trim() }))
      .filter((testimonial) => testimonial.quote && testimonial.author)
      .slice(0, MAX_EVIDENCE_TESTIMONIALS)
      .map((testimonial) => testimonial.role ? testimonial : { quote: testimonial.quote, author: testimonial.author })

    const businessEvidence = hasContact || cleanPeople.length > 0 || cleanTestimonials.length > 0
      ? {
          ...(hasContact ? { contact: { ...(whatsapp ? { whatsapp } : {}), ...(phone ? { phone } : {}), ...(email ? { email } : {}) } } : {}),
          ...(cleanPeople.length ? { people: cleanPeople } : {}),
          ...(cleanTestimonials.length ? { testimonials: cleanTestimonials } : {}),
        }
      : undefined

    const clientAttemptKey = createClientAttemptKey()

    const message = [
      name ? `Negocio: ${name}.` : null,
      industry ? `Industria: ${industry}.` : null,
      location ? `Ubicacion: ${location}.` : null,
      objective ? `Objetivo: ${objective}.` : null,
      description || null,
      preferredStyle ? `Estilo visual: ${preferredStyle}.` : null,
      cleanServices.length ? `Servicios: ${cleanServices.map((service) => service.name).join(", ")}.` : null,
      // COMMERCE-2B: the customer's explicit "vender productos" choice, stated in the brief itself.
      commerceProducts?.length ? `Tienda en linea con productos: ${commerceProducts.map((product) => product.name).join(", ")}.` : null,
    ].filter(Boolean).join(" ")

    startGenerating(async () => {
      const result = await runOrvenixSiteCreationAction({
        mode: "preview",
        message,
        clientAttemptKey,
        business: {
          name,
          industry,
          location,
          objective,
          description,
          preferredStyle,
          services: cleanServices,
          ...(commerceProducts?.length ? { products: commerceProducts } : {}),
          ...(businessEvidence ? { businessEvidence } : {}),
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

      const pages = getPreviewPages(result, tree)

      setPreview({
        previewId: result.previewId,
        previewHash: result.previewHash,
        tree,
        pages,
        selectedSlug: getInitialPreviewSlug(pages),
        message: result.result.message,
        qualityGate: result.qualityGate,
        submittedProductCount: commerceProducts?.length ?? 0,
      })
    })
  }

  function handleCreate() {
    if (!preview || isCreating || commerceChangedSincePreview) return
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
        {/*
          COMMERCE-2B layout: the dialog is a viewport-bounded flex container
          (column on mobile, row on desktop). Inside the left column the <form>
          is itself a bounded flex column -- ONE scrolling field region plus a
          persistent footer that stays inside the form (submit semantics
          unchanged) -- so the actions are always reachable however long the
          commerce brief grows.
        */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(1080px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-white/[0.1] bg-[color:var(--bg)] shadow-2xl shadow-black/45 editor-anim-scale-in lg:max-h-[90dvh] lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-[0.92]">
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6 md:px-7 md:pt-7">
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

            <form onSubmit={handlePreview} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-6 pb-6 md:px-7">
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

              <CommerceBriefEditor draft={commerceDraft} errors={commerceErrors} available={commerceAvailable} onChange={updateCommerceDraft} />

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setShowEvidence((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={showEvidence}
                >
                  <div>
                    <p className="text-sm font-bold text-[color:var(--text)]">Información adicional</p>
                    <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Agrega información real para personalizar mejor tu sitio (opcional).</p>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 text-[color:var(--text-muted)] transition-transform ${showEvidence ? "rotate-180" : ""}`} />
                </button>

                {showEvidence && (
                  <div className="space-y-5 border-t border-white/[0.06] px-4 pb-4 pt-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Contacto</label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input name="whatsapp" placeholder="WhatsApp, ej. +52 81 1234 5678" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                        <input name="phone" placeholder="Teléfono" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                        <input name="email" type="email" placeholder="Correo electrónico" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Equipo (máx. {MAX_EVIDENCE_PEOPLE})</label>
                        <button type="button" onClick={addPerson} disabled={people.length >= MAX_EVIDENCE_PEOPLE} className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-[color:var(--accent)] transition-all hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40">
                          <Plus size={13} /> Agregar
                        </button>
                      </div>
                      {people.length > 0 && (
                        <div className="space-y-2">
                          {people.map((person, index) => (
                            <div key={person.id} className="grid gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 sm:grid-cols-[1fr_1fr_auto]">
                              <input value={person.name} onChange={(event) => updatePerson(person.id, { name: event.target.value })} placeholder={`Nombre ${index + 1}`} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                              <input value={person.role} onChange={(event) => updatePerson(person.id, { role: event.target.value })} placeholder="Cargo (opcional)" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                              <button type="button" onClick={() => removePerson(person.id)} className="grid h-9 w-9 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label="Eliminar persona">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Testimonios (máx. {MAX_EVIDENCE_TESTIMONIALS})</label>
                        <button type="button" onClick={addTestimonial} disabled={testimonials.length >= MAX_EVIDENCE_TESTIMONIALS} className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-[color:var(--accent)] transition-all hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40">
                          <Plus size={13} /> Agregar
                        </button>
                      </div>
                      {testimonials.length > 0 && (
                        <div className="space-y-2">
                          {testimonials.map((testimonial, index) => (
                            <div key={testimonial.id} className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                              <div className="flex items-start gap-2">
                                <textarea value={testimonial.quote} onChange={(event) => updateTestimonial(testimonial.id, { quote: event.target.value })} rows={2} placeholder={`Testimonio ${index + 1}`} className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                                <button type="button" onClick={() => removeTestimonial(testimonial.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label="Eliminar testimonio">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input value={testimonial.author} onChange={(event) => updateTestimonial(testimonial.id, { author: event.target.value })} placeholder="Autor" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                                <input value={testimonial.role} onChange={(event) => updateTestimonial(testimonial.id, { role: event.target.value })} placeholder="Cargo o relación (opcional)" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              </div>

              <div className="shrink-0 space-y-2 border-t border-white/[0.08] bg-[color:var(--bg)] px-6 py-3 md:px-7">
              {error && <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs text-red-300">{error}</p>}
              {preview && commerceChangedSincePreview && (
                <p role="status" className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3 text-xs text-amber-200">
                  Cambiaste tus productos. Genera un nuevo Preview para revisarlos antes de crear el sitio.
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={isGenerating || isCreating} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  {isGenerating ? "Generando Preview" : preview ? "Generar otro Preview" : "Generar Preview"}
                </button>
                <button type="button" onClick={handleCreate} disabled={!preview || isGenerating || isCreating || commerceChangedSincePreview} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(27,179,250,0.24)] px-5 text-sm font-bold text-[color:var(--accent)] transition-all hover:-translate-y-0.5 hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40">
                  {isCreating && <Loader2 size={15} className="animate-spin" />}
                  {isCreating ? "Creando sitio" : "Confirmar y crear"}
                </button>
                {preview && <button type="button" onClick={resetPreview} className="h-11 rounded-2xl px-4 text-sm font-semibold text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]">Descartar Preview</button>}
              </div>
              </div>
            </form>
          </div>

          <aside className="max-h-[38dvh] min-h-0 shrink-0 overflow-y-auto overflow-x-hidden border-t border-white/[0.08] bg-white/[0.025] p-6 md:p-7 lg:max-h-none lg:min-w-[360px] lg:flex-1 lg:shrink lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--accent)]">Preview seguro</p>
                <h3 className="mt-1 text-xl font-black text-[color:var(--text)]">Estructura editable</h3>
              </div>
              {preview && <span className="rounded-full border border-[rgba(27,179,250,0.20)] bg-[rgba(27,179,250,0.08)] px-3 py-1 text-[10px] font-bold text-[color:var(--accent)]">Borrador</span>}
            </div>

            {!preview ? (
              <div className="grid min-h-[140px] place-items-center rounded-[24px] border border-dashed lg:min-h-[300px] border-white/[0.10] bg-white/[0.025] p-8 text-center">
                <div>
                  <Bot className="mx-auto h-9 w-9 text-[color:var(--accent)]" />
                  <p className="mt-4 text-sm font-semibold text-[color:var(--text)]">Completa el formulario para ver la propuesta.</p>
                  <p className="mt-2 text-xs leading-6 text-[color:var(--text-secondary)]">El Preview no crea ni publica sitios hasta que confirmes.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="rounded-2xl border border-white/[0.06] bg-white/[0.035] px-4 py-3 text-xs leading-6 text-[color:var(--text-secondary)]">{preview.message}</p>
                {plannedStoreProducts > 0 ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs leading-6 text-[color:var(--text-secondary)]">
                    <p className="font-bold text-emerald-300">Tienda planeada: {preview.submittedProductCount} producto{preview.submittedProductCount === 1 ? "" : "s"}</p>
                    <p>Los precios e inventario que mostramos son los que ingresaste. Tus productos aún no se han creado: se crearán al confirmar, y el carrito se activará cuando tu sitio exista.</p>
                  </div>
                ) : preview.submittedProductCount > 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-xs leading-6 text-[color:var(--text-secondary)]">
                    <p className="font-bold text-[color:var(--text)]">Productos como catálogo informativo</p>
                    <p>En este sitio tus productos se mostrarán sin carrito de compra. La tienda con carrito requiere un plan con e-commerce y un sitio de tipo tienda.</p>
                  </div>
                ) : null}
                {preview.qualityGate && (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-xs text-[color:var(--text-secondary)]">
                    <span className="font-bold text-[color:var(--text)]">Quality Gate</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${preview.qualityGate.decision === "pass" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                      {preview.qualityGate.decision === "pass" ? "PASS" : "REVIEW"}
                    </span>
                    <span>{Math.round(preview.qualityGate.score)} pts</span>
                    {preview.qualityGate.reasonCodes.slice(0, 2).map((code) => (
                      <span key={code} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-[color:var(--text-muted)]">{code}</span>
                    ))}
                  </div>
                )}
                {preview.pages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {preview.pages.map((page) => {
                      const selected = page.slug === preview.selectedSlug
                      return (
                        <button
                          key={page.slug}
                          type="button"
                          onClick={() => setPreview((current) => current ? { ...current, selectedSlug: page.slug } : current)}
                          className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition-all ${selected ? "border-[rgba(27,179,250,0.35)] bg-[rgba(27,179,250,0.12)] text-[color:var(--accent)]" : "border-white/[0.08] bg-white/[0.03] text-[color:var(--text-secondary)] hover:border-white/[0.16] hover:text-[color:var(--text)]"}`}
                        >
                          {page.isHome ? "Inicio" : page.title}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    <span>{selectedPreviewPage?.title ?? "Home"}</span>
                    <span>{selectedPreviewPage ? Object.keys(selectedPreviewPage.tree.nodes).length : Object.keys(preview.tree.nodes).length} bloques</span>
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
