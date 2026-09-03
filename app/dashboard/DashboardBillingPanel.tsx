"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, ExternalLink, Loader2, XCircle } from "lucide-react";
import type { PlanEntitlements } from "@/lib/billing/plan-entitlements";

interface DashboardBillingPanelProps {
  plan: {
    id: string;
    name: string;
    maxWebsites: number;
    maxVisits: number;
    hasEcommerce: boolean;
    hasExport: boolean;
  } | null;
  entitlements: PlanEntitlements | null;
  subscription: {
    status: string;
    planId?: string | null;
    interval: string;
    currentPeriodEnd: string | null;
    canceledAt?: string | null;
    provider?: string | null;
    stripeCustomerId?: string | null;
    pendingPlanId?: string | null;
    pendingInterval?: string | null;
    pendingStartsAt?: string | null;
  } | null;
  websitesUsed: number;
  isActive: boolean;
}

function formatNumber(value: number) {
  return value >= 9999 ? "Ilimitado" : value.toLocaleString("es-MX");
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha de corte";

  return new Date(value).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getBillingStatusMeta(status: string, isActive: boolean) {
  if (isActive) {
    return {
      label: "Plan activo",
      className: "border-[rgba(0,181,246,0.22)] bg-[rgba(0,181,246,0.10)] text-[#8fe7ff]",
      message: "Tu plan está activo y las funciones incluidas están disponibles.",
    };
  }

  const normalized = status.toLowerCase();

  if (normalized === "pending" || normalized === "incomplete") {
    return {
      label: "Pago pendiente",
      className: "border-amber-300/25 bg-amber-300/10 text-amber-200",
      message:
        "Estamos esperando la confirmación de pago. Si ya completaste Checkout, esto se actualizará cuando llegue el webhook.",
    };
  }

  if (normalized === "paused") {
    return {
      label: "Plan pausado",
      className: "border-[rgba(0,131,179,0.25)] bg-[rgba(0,131,179,0.12)] text-[#8fdfff]",
      message: "La suscripción está pausada. Algunas funciones pueden quedar limitadas hasta reactivarla.",
    };
  }

  if (normalized === "past_due" || normalized === "unpaid") {
    return {
      label: "Pago atrasado",
      className: "border-orange-300/25 bg-orange-300/10 text-orange-200",
      message: "Stripe no pudo cobrar el periodo actual. Actualiza tu método de pago para evitar suspensión.",
    };
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return {
      label: "Cancelado",
      className: "border-red-300/20 bg-red-300/10 text-red-100",
      message: "La suscripción está cancelada. Puedes elegir un plan para reactivar la cuenta.",
    };
  }

  return {
    label: status,
    className: "border-white/[0.08] bg-white/[0.04] text-white/50",
    message: "Estado recibido desde la pasarela de pago.",
  };
}

function isScheduledCancellation(subscription: DashboardBillingPanelProps["subscription"]) {
  if (!subscription?.canceledAt) return false;

  const normalized = subscription.status.toLowerCase();
  return normalized === "cancelled" || normalized === "canceled";
}

function getPendingPlanLabel(planId: string) {
  if (planId === "commerce" || planId === "business") return "Business";
  if (planId === "pro") return "Pro";
  if (planId === "starter") return "Starter";

  return planId;
}

export function DashboardBillingPanel({
  plan,
  entitlements,
  subscription,
  websitesUsed,
  isActive,
}: DashboardBillingPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingErrorCode, setBillingErrorCode] = useState<string | null>(null);

  async function cancelSubscription() {
    if (!window.confirm("¿Cancelar tu suscripción? Tu acceso puede cambiar según el estado del ciclo actual.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setBillingErrorCode(null);

    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo cancelar la suscripción.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la suscripción.");
    } finally {
      setLoading(false);
    }
  }

  async function reactivateSubscription() {
    if (!window.confirm("¿Reactivar tu suscripción y conservar la renovación automática?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setBillingErrorCode(null);

    try {
      const res = await fetch("/api/billing/reactivate", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo reactivar la suscripción.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reactivar la suscripción.");
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    setLoading(true);
    setError(null);
    setBillingErrorCode(null);

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; code?: string };

      if (!res.ok || !data.url) {
        setBillingErrorCode(data.code ?? null);
        throw new Error(data.error ?? "No se pudo abrir el portal de facturación.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el portal de facturación.");
      setLoading(false);
    }
  }

  if (!plan || !subscription) {
    return (
      <section className="mb-8 overflow-hidden rounded-[26px] border border-amber-300/15 bg-amber-300/[0.06] p-5 shadow-xl shadow-black/15 editor-anim-fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
              <CreditCard size={18} className="text-amber-200" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">Sin plan activo</h2>
              <p className="mt-1 text-sm leading-6 text-amber-50/75">
                Elige un plan para desbloquear el editor completo, publicación y límites de producción.
              </p>
            </div>
          </div>
          <Link
            href="/precios"
            className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 text-sm font-black text-slate-950 transition hover:bg-amber-200"
          >
            Ver planes
            <ExternalLink size={14} />
          </Link>
        </div>
      </section>
    );
  }

  const intervalLabel = subscription.interval === "year" ? "Anual" : "Mensual";
  const canUseStripePortal = subscription.provider === "stripe" && Boolean(subscription.stripeCustomerId);
  const statusMeta = getBillingStatusMeta(subscription.status, isActive);
  const scheduledCancellation = isScheduledCancellation(subscription);
  const websiteLimit = formatNumber(
  entitlements?.limits.websites ?? plan.maxWebsites,
);
  const websitePercent =
    (entitlements?.limits.websites ?? plan.maxWebsites) === null ||
(entitlements?.limits.websites ?? plan.maxWebsites) >= 9999 ? 8 : Math.min(100, Math.round((websitesUsed / Math.max(plan.maxWebsites, 1)) * 100));

  return (
    <section className="mb-8 overflow-hidden rounded-[26px] border border-[rgba(0,181,246,0.16)] bg-[rgba(0,181,246,0.05)] p-5 shadow-xl shadow-black/15 editor-anim-fade-up">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
              {intervalLabel}
            </span>
            {subscription.provider && (
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                {subscription.provider === "stripe" ? "Stripe" : "MercadoPago"}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-white">{plan.name}</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Corte: {formatDate(subscription.currentPeriodEnd)} · {formatNumber(plan.maxVisits)} visitas incluidas
          </p>

          {subscription.pendingPlanId && (
            <div className="mt-3 max-w-xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Cambio programado</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-cyan-50">
                Tu plan cambiará a <span className="font-black">{getPendingPlanLabel(subscription.pendingPlanId)}</span>
                {subscription.pendingInterval
                  ? ` ${subscription.pendingInterval === "year" ? "anual" : "mensual"}`
                  : ""}
                {subscription.pendingStartsAt ? ` el ${formatDate(subscription.pendingStartsAt)}` : ""}.
              </p>
            </div>
          )}

          {scheduledCancellation && (
            <p className="mt-3 max-w-xl rounded-2xl border border-red-300/20 bg-red-300/[0.08] px-4 py-3 text-xs font-semibold leading-5 text-red-100">
              La cancelación ya está programada. Tu acceso permanece disponible hasta{" "}
              {formatDate(subscription.canceledAt ?? subscription.currentPeriodEnd)}.
            </p>
          )}

          {!isActive && (
            <p className={`mt-3 max-w-xl rounded-2xl border px-4 py-3 text-xs font-semibold leading-5 ${statusMeta.className}`}>
              {statusMeta.message}
            </p>
          )}
        </div>

        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3 xl:max-w-xl">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/20">Sitios</div>
            <div className="mt-2 text-xl font-black text-white">
              {websitesUsed} / {websiteLimit}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-[color:var(--accent)]" style={{ width: `${websitePercent}%` }} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/20">Tienda</div>
            <div className="mt-2 text-sm font-bold text-white/70">{plan.hasEcommerce ? "Incluida" : "No incluida"}</div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/20">Export</div>
            <div className="mt-2 text-sm font-bold text-white/70">{plan.hasExport ? "Habilitado" : "No incluido"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {canUseStripePortal && (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Gestionar facturación
            </button>
          )}

          <Link
            href="/precios"
            className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
          >
            Cambiar plan
          </Link>

          {canUseStripePortal && scheduledCancellation ? (
            <button
              type="button"
              onClick={reactivateSubscription}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CreditCard size={14} />
              )}
              Reactivar suscripción
            </button>
          ) : isActive && canUseStripePortal ? (
            <button
              type="button"
              onClick={cancelSubscription}
              disabled={loading}
              className="flex h-10 items-center gap-2 rounded-2xl border border-red-300/15 bg-red-300/[0.06] px-4 text-sm font-semibold text-red-100 transition hover:bg-red-300/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-300/[0.08] px-4 py-3 text-xs font-semibold text-red-100">
          <p>{error}</p>
          {billingErrorCode === "STRIPE_MODE_MISMATCH" && (
            <Link
              href={`/precios?checkout=${encodeURIComponent(subscription.planId ?? plan.id)}&interval=${subscription.interval === "year" ? "year" : "month"}&billingRepair=1`}
              className="mt-3 inline-flex h-9 items-center rounded-xl bg-red-100 px-3 text-xs font-black text-red-900 transition hover:bg-white"
            >
              Activar plan en producción
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
