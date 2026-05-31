import { Activity, CheckCircle2, Clock3, SkipForward, TriangleAlert } from "lucide-react"
import { getWebhookEventStats, listRecentWebhookEvents } from "@/lib/webhook-events"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Clock3 }> = {
  processed: { label: "Procesado", color: "text-[color:var(--accent)] bg-[rgba(0,181,246,0.10)] border-[color:var(--glass-border-hover)]", icon: CheckCircle2 },
  failed: { label: "Fallido", color: "text-red-300 bg-red-500/10 border-red-500/25", icon: TriangleAlert },
  skipped: { label: "Omitido", color: "text-[color:var(--text-secondary)] bg-white/[0.04] border-white/[0.08]", icon: SkipForward },
  received: { label: "Recibido", color: "text-amber-200 bg-amber-400/10 border-amber-400/25", icon: Clock3 },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.received
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[color:var(--text)]">{value}</p>
    </div>
  )
}

export default async function AdminWebhooksPage() {
  const [events, stats] = await Promise.all([
    listRecentWebhookEvents(75),
    getWebhookEventStats(),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[color:var(--accent)]" />
        <h1 className="text-xl font-bold text-[color:var(--text)]">Webhooks</h1>
      </div>
      <p className="mb-8 text-sm text-[color:var(--text-secondary)]">
        Ultimos eventos recibidos desde Stripe y MercadoPago. Usa esta vista para confirmar pagos, errores y eventos omitidos.
      </p>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Procesados" value={stats.processed} />
        <StatCard label="Fallidos" value={stats.failed} />
        <StatCard label="Omitidos" value={stats.skipped} />
        <StatCard label="Recibidos" value={stats.received} />
      </div>

      {events.length === 0 ? (
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] py-16 text-center text-[color:var(--text-muted)]">
          Aun no hay eventos de webhook registrados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/15">
          <div className="hidden grid-cols-[0.8fr_1.2fr_1fr_1fr_0.8fr_1fr] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)] md:grid">
            <span>Proveedor</span>
            <span>Evento</span>
            <span>Recurso</span>
            <span>Estado</span>
            <span>Recibido</span>
            <span>Error</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {events.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[0.8fr_1.2fr_1fr_1fr_0.8fr_1fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-bold capitalize text-[color:var(--text)]">{event.provider}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-[color:var(--text-muted)]">{event.eventId ?? event.id}</p>
                </div>
                <p className="truncate font-mono text-xs text-[color:var(--text-secondary)]">{event.eventType}</p>
                <p className="truncate font-mono text-xs text-[color:var(--text-secondary)]">{event.resourceId ?? "—"}</p>
                <div><StatusBadge status={event.status} /></div>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  {new Date(event.createdAt).toLocaleString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="truncate text-xs text-red-200/70">{event.error ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
