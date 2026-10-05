"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, LayoutTemplate, X } from "lucide-react"

import { PENDING_DESIGN_STORAGE_KEY, parsePendingDesign } from "@/lib/commercial/sales-funnel"

const CHANGE_EVENT = "orvenix:pending-design-change"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(PENDING_DESIGN_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * SALES-1: after sign-up and checkout (which always land on the dashboard),
 * take the customer back to the Orvenix design they chose before paying.
 * SALES-2: the design returned by checkout (?design=, validated on the
 * server) wins; this browser's memory is only the fallback.
 */
export function PendingDesignBanner({ returnedDesign = null }: { returnedDesign?: { templateId: string; name: string; href: string } | null }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  const [dismissed, setDismissed] = useState(false)
  const design = returnedDesign ?? parsePendingDesign(raw)
  if (!design || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.removeItem(PENDING_DESIGN_STORAGE_KEY)
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] p-4 text-sm text-cyan-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <LayoutTemplate className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
        <p>
          Tu diseño <strong>{design.name}</strong> te está esperando. Continúa para crear tu sitio con los datos de tu negocio.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={design.href} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black text-slate-950 hover:bg-white/90">
          Continuar con mi diseño
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <button type="button" onClick={dismiss} aria-label="Descartar" className="grid h-9 w-9 place-items-center rounded-xl text-cyan-100/70 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export const PENDING_DESIGN_CHANGE_EVENT = CHANGE_EVENT
