"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Copy, Check, TrendingUp, Users, DollarSign, Clock,
  ArrowLeft, ExternalLink, Loader2, Sparkles, ChevronRight,
  CreditCard, CheckCircle2, AlertCircle,
} from "lucide-react"
import type { Affiliate, Referral } from "@/lib/affiliates"

interface AffiliatesDashboardProps {
  userName: string
  userEmail: string
  appUrl: string
}

type Tab = "overview" | "referrals" | "payments" | "calculator"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  registered: { label: "Registrado", color: "text-blue-400" },
  active: { label: "Cliente activo", color: "text-[color:var(--accent)]" },
  churned: { label: "Canceló", color: "text-red-400/70" },
}

const TIER_INFO = [
  { pct: 20, plan: "Plan Básico", monthly: 349, label: null },
  { pct: 25, plan: "Plan Pro", monthly: 699, label: "Más rentable" },
  { pct: 30, plan: "Plan Empresa", monthly: 1399, label: null },
]

export default function AffiliatesDashboard({ userName, appUrl }: AffiliatesDashboardProps) {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [tab, setTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [paypalEmail, setPaypalEmail] = useState("")
  const [bankInfo, setBankInfo] = useState("")
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)
  const [calcReferrals, setCalcReferrals] = useState(5)
  const [calcPlan, setCalcPlan] = useState(1)

  const refLink = affiliate ? `${appUrl}/?ref=${affiliate.code}` : ""

  const load = useCallback(async () => {
    setLoading(true)
    const [meRes, refRes] = await Promise.all([
      fetch("/api/affiliates/me"),
      fetch("/api/affiliates/referrals"),
    ])
    const meData = await meRes.json() as { affiliate: Affiliate | null }
    const refData = await refRes.json() as { referrals: Referral[] }
    setAffiliate(meData.affiliate)
    setReferrals(refData.referrals ?? [])
    if (meData.affiliate?.paypalEmail) setPaypalEmail(meData.affiliate.paypalEmail)
    if (meData.affiliate?.bankInfo) setBankInfo(meData.affiliate.bankInfo)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  async function handleJoin() {
    setJoining(true)
    await fetch("/api/affiliates/me", { method: "POST" })
    await load()
    setJoining(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function savePayment(e: React.FormEvent) {
    e.preventDefault()
    setSavingPayment(true)
    await fetch("/api/affiliates/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paypalEmail, bankInfo }),
    })
    setSavingPayment(false)
    setPaymentSaved(true)
    setTimeout(() => setPaymentSaved(false), 3000)
  }

  const tier = TIER_INFO[calcPlan]
  const calcMonthly = tier ? Math.round(tier.monthly * (tier.pct / 100) * calcReferrals) : 0
  const calcAnnual = calcMonthly * 12

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[color:var(--accent)]" size={32} />
      </div>
    )
  }

  // ── Sin perfil: pantalla de bienvenida al programa ─────────────────────────
  if (!affiliate) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.08)] px-3 py-1.5 text-xs text-[color:var(--accent)]">
          <Sparkles size={12} />
          Programa de afiliados
        </div>
        <h1 className="mb-4 text-4xl font-black text-white md:text-5xl">
          Gana hasta <span className="text-[color:var(--accent)]">30%</span> de comisión mensual
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-[color:var(--text-secondary)]">
          Comparte tu link único. Cada cliente que contraten genera comisión recurrente mientras mantengan su plan activo.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
          {TIER_INFO.map(t => (
            <div key={t.pct} className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-center">
              <p className="text-2xl font-black text-[color:var(--accent)]">{t.pct}%</p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{t.plan}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent-2)] px-8 py-4 font-bold text-white shadow-xl shadow-[rgba(0,131,179,0.30)] transition-all hover:bg-[color:var(--accent)] disabled:opacity-60"
        >
          {joining ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {joining ? "Activando..." : "Unirme al programa"}
        </button>

        <p className="mt-4 text-xs text-[color:var(--text-muted)]">Gratis. Sin cuota de entrada. Sin mínimos.</p>
      </div>
    )
  }

  // ── Dashboard principal ────────────────────────────────────────────────────
  const pendingMXN = (affiliate.pendingCents / 100).toFixed(2)
  const totalMXN = (affiliate.totalEarnedCents / 100).toFixed(2)
  const paidMXN = (affiliate.paidCents / 100).toFixed(2)
  const conversionRate = affiliate.totalReferrals > 0
    ? Math.round((affiliate.activeReferrals / affiliate.totalReferrals) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dashboard" className="text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl font-black text-white">Panel de Afiliado</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              affiliate.status === "active"
                ? "bg-[rgba(0,181,246,0.10)] border-[color:var(--glass-border-hover)] text-[color:var(--accent)]"
                : "bg-yellow-500/10 border-yellow-500/25 text-yellow-400"
            }`}>
              {affiliate.status === "active" ? "ACTIVO" : "PENDIENTE"}
            </span>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">Hola, {userName} · Comisión: {affiliate.commissionPct}%</p>
        </div>
        <Link href="/afiliados" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          Página del programa <ExternalLink size={12} />
        </Link>
      </div>

      {/* Link de referido */}
      <div className="mb-8 rounded-2xl border border-[rgba(0,131,179,0.26)] bg-[rgba(0,131,179,0.12)] p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--accent-3)]">Tu link único de referido</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-white/70 bg-black/30 px-4 py-2.5 rounded-xl border border-white/[0.07] truncate">
            {refLink}
          </code>
          <button
            onClick={copyLink}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[color:var(--accent-2)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[color:var(--accent)]"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
          Comparte este link en redes sociales, WhatsApp, email o tu sitio web. Cada registro que llegue por aquí se contará como tu referido.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {(["overview", "referrals", "payments", "calculator"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === t
                ? "bg-[color:var(--accent-2)] text-white"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text)]"
            }`}
          >
            {{ overview: "Resumen", referrals: "Referidos", payments: "Cobro", calculator: "Calculadora" }[t]}
          </button>
        ))}
      </div>

      {/* TAB: RESUMEN */}
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Total referidos", value: affiliate.totalReferrals, sub: `${affiliate.activeReferrals} activos`, color: "text-blue-400" },
              { icon: TrendingUp, label: "Tasa de conversión", value: `${conversionRate}%`, sub: "Registrados → activos", color: "text-[color:var(--accent)]" },
              { icon: Clock, label: "Pendiente de cobro", value: `$${pendingMXN}`, sub: "MXN", color: "text-amber-400" },
              { icon: DollarSign, label: "Total ganado", value: `$${totalMXN}`, sub: `$${paidMXN} pagado`, color: "text-[color:var(--accent-2)]" },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                  <Icon size={16} className={`${stat.color} mb-3`} />
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-[color:var(--text-secondary)]">{stat.label}</p>
                  <p className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">{stat.sub}</p>
                </div>
              )
            })}
          </div>

          {/* Comisiones por plan */}
          <div className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <h3 className="font-bold text-white mb-4">Cuánto ganas por plan referido</h3>
            <div className="space-y-3">
              {TIER_INFO.map(t => (
                <div key={t.pct} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{t.plan}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">${t.monthly}/mes · {t.pct}% comisión</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[color:var(--accent)]">${Math.round(t.monthly * t.pct / 100)}/mes</p>
                    <p className="text-xs text-[color:var(--text-muted)]">${Math.round(t.monthly * t.pct / 100 * 12)}/año</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos pasos si tiene 0 referidos */}
          {affiliate.totalReferrals === 0 && (
            <div className="rounded-2xl border border-[rgba(0,131,179,0.24)] bg-[rgba(0,131,179,0.12)] p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles size={15} className="text-[color:var(--accent)]" />
                Empieza a compartir
              </h3>
              <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
                {[
                  "Comparte tu link en LinkedIn y redes sociales",
                  "Envíalo a clientes o conocidos con negocios locales",
                  "Agrégalo en la firma de tu correo electrónico",
                  "Incluye un testimonio personal para más credibilidad",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-[color:var(--accent-2)]" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: REFERIDOS */}
      {tab === "referrals" && (
        <div>
          {referrals.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Users size={40} className="mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Aún no tienes referidos</p>
              <p className="text-sm mt-1">Comparte tu link y aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[11px] uppercase tracking-wider text-[color:var(--text-muted)]">
                <span>Email</span><span>Estado</span><span>Plan</span><span>Comisión</span>
              </div>
              {referrals.map(r => {
                const st = STATUS_LABELS[r.status] ?? { label: r.status, color: "text-[color:var(--text-secondary)]" }
                return (
                  <div key={r.id} className="grid grid-cols-4 gap-4 items-center px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                    <span className="text-sm text-white/60 font-mono truncate">{r.referredEmail}</span>
                    <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    <span className="text-xs text-[color:var(--text-secondary)]">{r.plan ?? "—"}</span>
                    <span className="text-sm font-bold text-[color:var(--accent-2)]">
                      {r.commissionCents > 0 ? `$${(r.commissionCents / 100).toFixed(0)}/mes` : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: COBRO */}
      {tab === "payments" && (
        <div className="max-w-xl">
          <div className="p-5 rounded-2xl border border-amber-800/25 bg-amber-950/15 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
                Los pagos se procesan el primer día hábil de cada mes. Se requiere al menos $500 MXN acumulados para procesar una transferencia.
              </p>
            </div>
          </div>

          <form onSubmit={savePayment} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">PayPal (recomendado)</label>
              <input
                type="email"
                placeholder="tu@paypal.com"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[rgba(0,131,179,0.45)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Transferencia bancaria (CLABE/SPEI)</label>
              <textarea
                rows={3}
                placeholder="Banco, CLABE, nombre del titular..."
                value={bankInfo}
                onChange={e => setBankInfo(e.target.value)}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-[rgba(0,131,179,0.45)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingPayment}
              className="flex items-center gap-2 rounded-xl bg-[color:var(--accent-2)] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[color:var(--accent)] disabled:opacity-60"
            >
              {savingPayment ? <Loader2 size={15} className="animate-spin" /> : paymentSaved ? <CheckCircle2 size={15} /> : <CreditCard size={15} />}
              {savingPayment ? "Guardando..." : paymentSaved ? "¡Guardado!" : "Guardar datos de cobro"}
            </button>
          </form>
        </div>
      )}

      {/* TAB: CALCULADORA */}
      {tab === "calculator" && (
        <div className="max-w-xl">
          <h3 className="font-bold text-white mb-6">¿Cuánto podrías ganar?</h3>
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">
                Número de clientes referidos activos: <span className="text-[color:var(--accent)]">{calcReferrals}</span>
              </label>
              <input
                type="range"
                min={1} max={50} value={calcReferrals}
                onChange={e => setCalcReferrals(Number(e.target.value))}
                className="w-full accent-[color:var(--accent)]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[color:var(--text-muted)]">
                <span>1</span><span>25</span><span>50</span>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Plan promedio del cliente</label>
              <div className="grid grid-cols-3 gap-2">
                {TIER_INFO.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCalcPlan(i)}
                    className={`py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      calcPlan === i
                        ? "bg-[color:var(--accent-2)] border-[color:var(--accent)] text-white"
                        : "border-white/10 text-[color:var(--text-secondary)] hover:border-white/20"
                    }`}
                  >
                    {t.plan}
                    <span className="block text-[10px] mt-0.5 opacity-70">{t.pct}% com.</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(0,131,179,0.28)] bg-[rgba(0,131,179,0.12)] p-6 text-center">
              <p className="mb-3 text-xs uppercase tracking-wider text-[color:var(--accent-3)]">Tu ingreso estimado</p>
              <p className="text-5xl font-black text-[color:var(--accent)]">${calcMonthly.toLocaleString()}</p>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">MXN / mes</p>
              <div className="mt-4 border-t border-[rgba(0,81,111,0.35)] pt-4">
                <p className="text-2xl font-black text-white">${calcAnnual.toLocaleString()} <span className="text-base font-normal text-[color:var(--text-muted)]">MXN / año</span></p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[color:var(--text-muted)]">
              Estimación basada en {calcReferrals} clientes en {tier?.plan} a ${tier?.monthly}/mes con {tier?.pct}% de comisión mensual recurrente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
