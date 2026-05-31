"use client"

import { useState } from "react"
import { Loader2, ShieldCheck, CreditCard } from "lucide-react"
import type { CheckoutAction } from "@/lib/pendingDesignDraft"

interface CheckoutConfirmButtonProps {
  action: CheckoutAction
  siteId: string
  templateId?: string | null
  priceMxn?: number | null
}

export function CheckoutConfirmButton({ action, siteId, templateId, priceMxn }: CheckoutConfirmButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, siteId, templateId: templateId ?? null, priceMxn: priceMxn ?? null }),
      })

      const payload = (await response.json()) as {
        ok?: boolean
        redirectUrl?: string
        mode?: string
        error?: string
      }

      if (!response.ok || !payload.redirectUrl) {
        throw new Error(payload.error ?? "No se pudo iniciar el pago.")
      }

      // Para MercadoPago usamos window.location.href para salir de la SPA
      // Para modo manual usamos router.push
      if (payload.mode === "live" || payload.mode === "sandbox") {
        window.location.href = payload.redirectUrl
      } else {
        window.location.href = payload.redirectUrl
      }
    } catch (caughtError) {
      setLoading(false)
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo iniciar el pago.")
    }
  }

  const buttonLabel = priceMxn
    ? `Pagar ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(priceMxn)} con MercadoPago`
    : "Continuar al pago"

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #009ee3 0%, #0070f3 100%)",
          boxShadow: "0 18px 48px rgba(0,158,227,0.25)",
        }}
      >
        {loading
          ? <Loader2 size={17} className="animate-spin" />
          : priceMxn ? <CreditCard size={17} /> : <ShieldCheck size={17} />}
        <span>{loading ? "Preparando pago..." : buttonLabel}</span>
      </button>

      {priceMxn && (
        <p className="text-center text-[11px] text-white/25 flex items-center justify-center gap-1.5">
          <ShieldCheck size={11} className="text-white/30" />
          Pago procesado de forma segura por MercadoPago
        </p>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
