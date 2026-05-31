'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Props {
  planId: string
  interval: 'month' | 'year'
  label: string
  featured?: boolean
  unavailable?: boolean
}

export function PricingCheckoutButton({ planId, interval, label, featured, unavailable }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)

    if (unavailable) {
      setError('Las suscripciones de esta pagina se habilitan solo cuando Stripe esta configurado para el plan elegido.')
      return
    }

    // Si no hay sesión → registrar con el plan preseleccionado
    if (!session) {
      router.push(`/register?plan=${planId}&interval=${interval}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      })
      const data = await res.json() as { initPoint?: string; error?: string; code?: string }

      if (data.initPoint) {
        window.location.href = data.initPoint
      } else if (data.code === 'ACTIVE_SUBSCRIPTION_EXISTS') {
        router.push('/dashboard')
      } else if (data.code === 'REACTIVATE_VIA_DASHBOARD') {
        setError('Tu cancelacion ya esta programada y tu acceso sigue vigente. Reactiva o cambia el plan desde el dashboard.')
      } else if (data.code === 'STRIPE_SUBSCRIPTIONS_REQUIRED') {
        setError('Las suscripciones nuevas estan disponibles solo con Stripe en este entorno.')
      } else if (data.code === 'STRIPE_PLAN_NOT_READY') {
        setError('Este plan todavia no tiene el Price ID de Stripe configurado para este intervalo.')
      } else {
        setError(data.error ?? 'Error al iniciar el pago. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`block w-full text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${
          featured ? 'mk-btn-primary' : 'mk-btn-outline'
        }`}
      >
        {loading ? 'Redirigiendo...' : label}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200">
          {error}
        </p>
      )}
    </div>
  )
}
