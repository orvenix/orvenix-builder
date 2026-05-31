import { CreditCard, CheckCircle2, CircleAlert, Rocket, TriangleAlert } from "lucide-react"
import { getBillingConfigReport, type BillingConfigCheck } from "@/lib/billing-config"
import { getProductionReadinessReport, type ProductionReadinessStatus } from "@/lib/production-readiness"

export const dynamic = "force-dynamic"

const STATUS_META = {
  ok: {
    label: "Configurado",
    icon: CheckCircle2,
    className: "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.12)] text-[color:var(--accent)]",
  },
  warning: {
    label: "Parcial",
    icon: TriangleAlert,
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
  missing: {
    label: "Falta",
    icon: CircleAlert,
    className: "border-red-400/25 bg-red-400/10 text-red-200",
  },
}

const READINESS_META: Record<ProductionReadinessStatus, { label: string; className: string }> = {
  ready: {
    label: "Listo",
    className: "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.12)] text-[color:var(--accent)]",
  },
  attention: {
    label: "Atencion",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
  manual: {
    label: "Manual",
    className: "border-[rgba(0,131,179,0.24)] bg-[rgba(0,131,179,0.12)] text-[color:var(--accent-3)]",
  },
}

function StatusBadge({ status }: { status: BillingConfigCheck["status"] }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${meta.className}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

export default function AdminBillingPage() {
  const report = getBillingConfigReport()
  const readiness = getProductionReadinessReport()
  const summary = STATUS_META[report.status]
  const SummaryIcon = summary.icon

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-[color:var(--accent)]" />
        <h1 className="text-xl font-bold text-[color:var(--text)]">Billing</h1>
      </div>

      <div className={`mb-8 rounded-[28px] border p-6 shadow-xl shadow-black/15 ${summary.className}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-current/20 bg-black/10">
              <SummaryIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em]">{summary.label}</h2>
              <p className="mt-1 text-sm leading-6 opacity-80">
                Stripe {report.stripeReady ? "esta listo para suscripciones" : "todavia necesita configuracion"}.
                {" "}MercadoPago {report.mercadoPagoReady ? "esta disponible para tienda y flujos de respaldo" : "no esta listo para tienda o respaldo"}.
                {report.warnings > 0 ? ` Hay ${report.warnings} advertencia${report.warnings === 1 ? "" : "s"} de consistencia por revisar.` : ""}
              </p>
            </div>
          </div>
          <div className="text-sm font-bold opacity-80">
            {report.missing} pendiente{report.missing === 1 ? "" : "s"}{report.warnings > 0 ? ` · ${report.warnings} advertencia${report.warnings === 1 ? "" : "s"}` : ""}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/15">
        <div className="hidden grid-cols-[1fr_auto_1.2fr] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] md:grid">
          <span>Variable / Requisito</span>
          <span>Estado</span>
          <span>Detalle</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {report.checks.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1fr_auto_1.2fr] md:items-center"
            >
              <p className="text-sm font-bold text-[color:var(--text)]">{item.label}</p>
              <div><StatusBadge status={item.status} /></div>
              <p className="text-xs leading-5 text-[color:var(--text-secondary)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/15">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-[color:var(--accent)]" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">Salida a produccion</h2>
            </div>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${READINESS_META[readiness.summary].className}`}>
              {READINESS_META[readiness.summary].label}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">
            Este bloque separa lo que el entorno actual ya confirma automaticamente de lo que todavia necesita validacion manual en Vercel, DB, Stripe publico y checkout real de tienda.
          </p>
        </div>

        <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Detectado en este entorno</p>
            <div className="space-y-3">
              {readiness.automaticChecks.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[color:var(--text)]">{item.label}</p>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${READINESS_META[item.status].className}`}>
                      {READINESS_META[item.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Validacion externa pendiente</p>
            <div className="space-y-3">
              {readiness.manualChecks.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[color:var(--text)]">{item.label}</p>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${READINESS_META[item.status].className}`}>
                      {READINESS_META[item.status].label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
