"use client"

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Eye, Loader2, PencilLine, Sparkles } from "lucide-react"

import { createSiteFromCommercialDesignAction } from "@/app/actions/ai"
import { PublicRenderer } from "@/components/PublicRenderer"
import {
  EMPTY_COMMERCIAL_START_FORM,
  buildCommercialStartFacts,
  confirmCommercialSite,
  createCommercialAttemptKey,
  requestCommercialPreview,
  type CommercialPreview,
  type CommercialStartField,
  type CommercialStartFormValues,
} from "@/lib/commercial/start-flow"
import { PENDING_DESIGN_STORAGE_KEY } from "@/lib/commercial/sales-funnel"

interface CommercialStartFormProps {
  designId: string
  version: number
  templateName: string
  summary: string
  accent: string
  demoHref: string
  backHref: string
}

export function CommercialStartForm({ designId, version, templateName, summary, accent, demoHref, backHref }: CommercialStartFormProps) {
  const router = useRouter()
  // SALES-1: the design chosen before checkout has been reached; forget the reminder.
  useEffect(() => {
    try {
      window.localStorage.removeItem(PENDING_DESIGN_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])
  const [values, setValues] = useState<CommercialStartFormValues>(EMPTY_COMMERCIAL_START_FORM)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CommercialStartField, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CommercialPreview | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [isPreparing, startPreparing] = useTransition()
  const [isCreating, startCreating] = useTransition()

  function update(field: CommercialStartField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPreparing) return
    setError(null)

    const built = buildCommercialStartFacts(values)
    if ("errors" in built) {
      setFieldErrors(built.errors)
      return
    }

    // A fresh attempt per submit: edited answers must never reuse an older preview.
    const clientAttemptKey = createCommercialAttemptKey()
    startPreparing(async () => {
      const result = await requestCommercialPreview(createSiteFromCommercialDesignAction, {
        designId,
        version,
        facts: built.facts,
        clientAttemptKey,
      })
      if ("message" in result) {
        setError(result.message)
        return
      }
      setPreview(result.preview)
      setSelectedSlug(result.preview.pages.find((page) => page.isHome)?.slug ?? result.preview.pages[0].slug)
    })
  }

  function handleConfirm() {
    if (!preview || isCreating) return
    setError(null)
    startCreating(async () => {
      const result = await confirmCommercialSite(createSiteFromCommercialDesignAction, { designId, version, preview })
      if ("message" in result) {
        setError(result.message)
        return
      }
      router.push(result.nextRoute)
    })
  }

  function handleEdit() {
    if (isCreating) return
    setPreview(null)
    setSelectedSlug(null)
    setError(null)
  }

  const selectedPage = preview?.pages.find((page) => page.slug === selectedSlug) ?? preview?.pages[0]

  return (
    <main className="min-h-screen bg-[#07080d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07080d]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={backHref}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              title="Volver al diseño"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{templateName}</div>
              <div className="truncate text-[11px] text-white/40">{preview ? "Paso 2 de 2 · Revisa tu sitio" : "Paso 1 de 2 · Datos de tu negocio"}</div>
            </div>
          </div>
          <Link
            href={demoHref}
            className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex"
          >
            <Eye size={14} />
            Ver demo
          </Link>
        </div>
      </header>

      {!preview ? (
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div>
            <div
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
              style={{ borderColor: `${accent}55`, backgroundColor: `${accent}1f`, color: "#ffffff" }}
            >
              <Sparkles size={14} />
              Usar este diseño
            </div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight md:text-5xl">Cuéntanos de tu negocio</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/60">{summary}</p>
            <ul className="mt-7 grid gap-3 text-sm text-white/65">
              <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Usamos solo los datos que escribas aquí. Los datos de la demo no pasan a tu sitio.</li>
              <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Antes de crear nada te mostramos cómo quedará.</li>
              <li className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Después podrás agregar fotos, precios y más desde el editor.</li>
            </ul>
          </div>

          <form onSubmit={handlePreview} noValidate className="rounded-2xl border border-white/[0.1] bg-[#0c0f18] p-6">
            <div className="grid gap-5">
              <Field label="Nombre del negocio" required error={fieldErrors.businessName}>
                <input
                  value={values.businessName}
                  onChange={(event) => update("businessName", event.target.value)}
                  maxLength={120}
                  autoComplete="organization"
                  placeholder="Ej. Plomería Hernández"
                  className={inputClassName(Boolean(fieldErrors.businessName))}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="WhatsApp" hint="Botón principal de contacto" error={fieldErrors.whatsapp}>
                  <input
                    value={values.whatsapp}
                    onChange={(event) => update("whatsapp", event.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    placeholder="10 dígitos"
                    className={inputClassName(Boolean(fieldErrors.whatsapp))}
                  />
                </Field>
                <Field label="Teléfono" hint="Opcional si das WhatsApp" error={fieldErrors.phone}>
                  <input
                    value={values.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={40}
                    placeholder="10 dígitos"
                    className={inputClassName(Boolean(fieldErrors.phone))}
                  />
                </Field>
              </div>
              <Field label="Servicios principales" hint="Uno por línea · hasta 6" error={fieldErrors.services}>
                <textarea
                  value={values.services}
                  onChange={(event) => update("services", event.target.value)}
                  rows={4}
                  maxLength={1200}
                  placeholder={"Instalación de boilers\nReparación de fugas\nMantenimiento preventivo"}
                  className={inputClassName(Boolean(fieldErrors.services))}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ciudad" error={fieldErrors.location}>
                  <input
                    value={values.location}
                    onChange={(event) => update("location", event.target.value)}
                    maxLength={80}
                    autoComplete="address-level2"
                    placeholder="Ej. Monterrey"
                    className={inputClassName(Boolean(fieldErrors.location))}
                  />
                </Field>
                <Field label="Zonas que atiendes" hint="Separadas por coma" error={fieldErrors.serviceArea}>
                  <input
                    value={values.serviceArea}
                    onChange={(event) => update("serviceArea", event.target.value)}
                    maxLength={400}
                    placeholder="San Pedro, Cumbres"
                    className={inputClassName(Boolean(fieldErrors.serviceArea))}
                  />
                </Field>
              </div>
            </div>

            {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}

            <button
              type="submit"
              disabled={isPreparing}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
            >
              {isPreparing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              {isPreparing ? "Preparando tu vista previa…" : "Ver cómo queda mi sitio"}
            </button>
          </form>
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-5 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Así quedará tu sitio</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                {preview.pages.length === 1 ? "Una página" : `${preview.pages.length} páginas`} con tus datos. Todavía no se ha creado nada: confirma para guardarlo y abrir el editor.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleEdit}
                disabled={isCreating}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-bold text-white/75 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <PencilLine size={16} />
                Cambiar mis datos
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCreating}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
              >
                {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {isCreating ? "Creando tu sitio…" : "Crear mi sitio"}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>}

          <nav aria-label="Páginas de tu sitio" className="mt-6 flex flex-wrap gap-2">
            {preview.pages.map((page) => (
              <button
                key={page.slug}
                type="button"
                onClick={() => setSelectedSlug(page.slug)}
                aria-current={page.slug === selectedPage?.slug ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${page.slug === selectedPage?.slug ? "bg-white text-zinc-950" : "border border-white/10 text-white/70 hover:bg-white/10"}`}
              >
                {page.title}
              </button>
            ))}
          </nav>

          {selectedPage && (
            // translateZ keeps the site's fixed/sticky chrome inside this frame.
            <div className="mt-4 max-h-[72vh] overflow-auto rounded-2xl border border-white/10 bg-white [transform:translateZ(0)]">
              <PublicRenderer
                key={selectedPage.slug}
                siteId=""
                tree={selectedPage.tree}
                activePageSlug={selectedPage.slug}
                activePageName={selectedPage.title}
                availablePages={preview.pages.map((page) => ({
                  id: page.slug,
                  siteId: "",
                  slug: page.slug,
                  name: page.title,
                  isHome: page.isHome,
                  published: true,
                  source: "site-page" as const,
                }))}
              />
            </div>
          )}
        </section>
      )}
    </main>
  )
}

function inputClassName(invalid: boolean) {
  return `w-full rounded-lg border bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:bg-white/[0.07] ${invalid ? "border-red-400/60 focus:border-red-300" : "border-white/10 focus:border-white/35"}`
}

function Field({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
        <span>
          {label}
          {required && <span className="text-white/35"> *</span>}
        </span>
        {hint && <span className="text-[11px] font-medium normal-case tracking-normal text-white/35">{hint}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  )
}
