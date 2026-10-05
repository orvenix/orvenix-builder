"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { Check, Loader2 } from "lucide-react"

import { useEditorStore } from "@/store/useEditorStore"
import { getBusinessFieldsSummaryAction, updateBusinessFieldsAction } from "@/app/actions/business-fields"
import {
  BUSINESS_SOCIAL_NETWORKS_V1,
  businessFieldValueV1,
  readBusinessFieldsV1,
  type BusinessFieldKeyV1,
  type BusinessFieldsErrorsV1,
  type BusinessFieldsPatchV1,
  type BusinessFieldsV1,
  type BusinessSocialNetworkV1,
} from "@/lib/commercial/business-fields"

/**
 * CV1-3: the Business panel of Simple mode. One edit updates every bound
 * representation on every page (server action, one transaction); the canvas
 * then shows the saved page. Content only -- the design never changes.
 */

const SOCIAL_LABELS: Record<BusinessSocialNetworkV1, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
}

const INPUT_CLASS = "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"

type Draft = Record<BusinessFieldKeyV1, string>

function toDraft(fields: BusinessFieldsV1): Draft {
  const draft = {} as Draft
  for (const key of ["businessName", "logo", "phone", "whatsapp", "email", "address", "hours"] as const) draft[key] = businessFieldValueV1(fields, key)
  for (const network of BUSINESS_SOCIAL_NETWORKS_V1) draft[`social.${network}`] = fields.social[network] ?? ""
  return draft
}

function toPatch(draft: Draft, fields: BusinessFieldsV1): BusinessFieldsPatchV1 {
  const patch: BusinessFieldsPatchV1 = {}
  for (const key of ["businessName", "logo", "phone", "whatsapp", "email", "address", "hours"] as const) {
    if (draft[key] !== businessFieldValueV1(fields, key)) patch[key] = draft[key]
  }
  const social: BusinessFieldsPatchV1["social"] = {}
  for (const network of BUSINESS_SOCIAL_NETWORKS_V1) {
    if (draft[`social.${network}`] !== (fields.social[network] ?? "")) social[network] = draft[`social.${network}`]
  }
  return Object.keys(social).length ? { ...patch, social } : patch
}

export function BusinessFieldsPanel() {
  const tree = useEditorStore((state) => state.tree)
  const websiteId = useEditorStore((state) => state.websiteId)
  const assetLibrary = useEditorStore((state) => state.assetLibrary)
  const fields = readBusinessFieldsV1(tree)
  const [draft, setDraft] = useState<Draft | null>(() => (fields ? toDraft(fields) : null))
  const [uses, setUses] = useState<Partial<Record<BusinessFieldKeyV1, number>>>({})
  const [errors, setErrors] = useState<BusinessFieldsErrorsV1>({})
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)
  const [isSaving, startSaving] = useTransition()

  useEffect(() => {
    if (!websiteId) return
    let active = true
    void getBusinessFieldsSummaryAction(websiteId).then((result) => {
      if (active && "uses" in result) setUses(result.uses)
    })
    return () => {
      active = false
    }
  }, [websiteId])

  if (!fields || !draft) return null

  const set = (key: BusinessFieldKeyV1, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setMessage(null)
  }

  const patch = toPatch(draft, fields)
  const dirty = Object.keys(patch).length > 0

  function save() {
    if (!websiteId || !dirty || isSaving) return
    setMessage(null)
    startSaving(async () => {
      const state = useEditorStore.getState()
      const flushed = await state.flushPendingSave()
      if (!flushed.success) {
        setMessage({ tone: "error", text: flushed.error ?? "Guarda tus cambios antes de actualizar tus datos." })
        return
      }
      const result = await updateBusinessFieldsAction({ siteId: websiteId, pageSlug: state.activePageSlug, patch })
      if ("message" in result) {
        setErrors(result.errors ?? {})
        setMessage({ tone: "error", text: result.message })
        return
      }
      const latest = useEditorStore.getState()
      // Show the saved page: the same tree every page now holds (no local re-derivation).
      latest.initialize(websiteId, result.tree, latest.purchaseType, {
        activePageSlug: latest.activePageSlug,
        activePageName: latest.activePageName,
        availablePages: latest.availablePages,
        serverVersion: result.serverVersion,
      })
      setDraft(toDraft(result.fields))
      setUses(result.uses)
      setErrors({})
      setMessage({ tone: "ok", text: "Listo: tu sitio se actualizó en todas sus páginas." })
    })
  }

  const usage = (key: BusinessFieldKeyV1) => {
    const count = uses[key] ?? 0
    return count ? `Aparece en ${count} ${count === 1 ? "lugar" : "lugares"} de tu sitio` : "Tu diseño no muestra este dato"
  }

  const logoChoices = assetLibrary.filter((asset) => typeof asset.url === "string" && (/^https:\/\//i.test(asset.url) || asset.url.startsWith("/uploads/")))

  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-slate-400">
        Cambia un dato una vez y se actualiza en todas las páginas de tu sitio. El diseño no cambia.
      </p>

      <Field label="Nombre del negocio" hint={usage("businessName")} error={errors.businessName}>
        <input value={draft.businessName} onChange={(event) => set("businessName", event.target.value)} maxLength={120} className={INPUT_CLASS} />
      </Field>
      <Field label="WhatsApp" hint={usage("whatsapp")} error={errors.whatsapp}>
        <input value={draft.whatsapp} onChange={(event) => set("whatsapp", event.target.value)} inputMode="tel" maxLength={40} placeholder="10 dígitos" className={INPUT_CLASS} />
      </Field>
      <Field label="Teléfono" hint={usage("phone")} error={errors.phone}>
        <input value={draft.phone} onChange={(event) => set("phone", event.target.value)} inputMode="tel" maxLength={40} placeholder="10 dígitos" className={INPUT_CLASS} />
      </Field>
      <Field label="Correo público" hint={usage("email")} error={errors.email}>
        <input value={draft.email} onChange={(event) => set("email", event.target.value)} type="email" maxLength={160} placeholder="contacto@negocio.com" className={INPUT_CLASS} />
      </Field>
      <Field label="Dirección" hint={usage("address")} error={errors.address}>
        <input value={draft.address} onChange={(event) => set("address", event.target.value)} maxLength={200} className={INPUT_CLASS} />
      </Field>
      <Field label="Horario" hint={usage("hours")} error={errors.hours}>
        <input value={draft.hours} onChange={(event) => set("hours", event.target.value)} maxLength={120} placeholder="Lunes a sábado, 9:00 a 18:00" className={INPUT_CLASS} />
      </Field>

      <Field label="Logotipo" hint={usage("logo")} error={errors.logo}>
        <div className="space-y-2">
          {logoChoices.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {logoChoices.slice(0, 8).map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => set("logo", asset.url)}
                  aria-pressed={draft.logo === asset.url}
                  title={asset.name ?? "Imagen de tu biblioteca"}
                  className={`aspect-square overflow-hidden rounded-lg border bg-white/[0.04] ${draft.logo === asset.url ? "border-cyan-300" : "border-white/[0.08]"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- library thumbnails, any origin */}
                  <img src={asset.url} alt={asset.alt ?? ""} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-5 text-slate-500">Tu biblioteca aún no tiene imágenes. Puedes pegar el enlace https de tu logo.</p>
          )}
          <input value={draft.logo} onChange={(event) => set("logo", event.target.value)} placeholder="https://… o elige arriba" className={INPUT_CLASS} />
        </div>
      </Field>

      <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
        <p className="text-xs font-bold text-slate-200">Redes sociales</p>
        {BUSINESS_SOCIAL_NETWORKS_V1.map((network) => (
          <Field key={network} label={SOCIAL_LABELS[network]} hint={usage(`social.${network}`)} error={errors[`social.${network}`]}>
            <input value={draft[`social.${network}`]} onChange={(event) => set(`social.${network}`, event.target.value)} type="url" maxLength={300} placeholder="https://" className={INPUT_CLASS} />
          </Field>
        ))}
      </div>

      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-xs ${message.tone === "error" ? "border border-red-400/30 bg-red-500/10 text-red-100" : "border border-emerald-400/25 bg-emerald-500/10 text-emerald-100"}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!dirty || isSaving}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        {isSaving ? "Actualizando tu sitio…" : "Guardar datos del negocio"}
      </button>
    </div>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      {children}
      {error ? <span className="text-[11px] text-red-300">{error}</span> : hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  )
}
