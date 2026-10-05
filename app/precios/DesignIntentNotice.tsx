"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, LayoutTemplate } from "lucide-react"

import { PENDING_DESIGN_STORAGE_KEY, serializePendingDesign } from "@/lib/commercial/sales-funnel"

/**
 * SALES-1: a visitor sent here by "Usar este diseño" sees which design is
 * waiting for them, and the choice is remembered in this browser so the
 * dashboard can take them back to it after sign-up and checkout (the
 * billing flow itself is unchanged).
 */
export function DesignIntentNotice({ target }: { target: { templateId: string; name: string; href: string } }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(PENDING_DESIGN_STORAGE_KEY, serializePendingDesign(target))
    } catch {
      // Convenience only: without storage the visitor can still return from the catalog.
    }
  }, [target])

  return (
    <div role="status" className="mt-6 flex flex-col gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] p-4 text-sm text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <LayoutTemplate className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
        <p>
          Elegiste el diseño <strong>{target.name}</strong>. Activa un plan para crear tu sitio; al terminar podrás continuar con tu diseño desde tu panel.
        </p>
      </div>
      <Link href={`/templates/${encodeURIComponent(target.templateId)}`} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-cyan-200 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Volver al diseño
      </Link>
    </div>
  )
}
