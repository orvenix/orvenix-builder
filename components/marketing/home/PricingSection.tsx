'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PricingCheckoutButton } from './PricingCheckoutButton';

export interface PricingPlanView {
  id: string;
  name: string;
  priceMonthMxn: number;
  priceYearMxn: number;
  features: string[];
  maxWebsites: number;
  maxVisits: number;
  hasEcommerce: boolean;
  hasExport: boolean;
  isAvailableMonth: boolean;
  isAvailableYear: boolean;
  priceMonthLabel?: string;
  priceYearLabel?: string;
  annualEquivalentLabel?: string;
  annualSavingLabel?: string;
  taxNote?: string;
}

const PLAN_META: Record<string, { icon: string; desc: string; featured?: boolean; cta: string }> = {
  starter: {
    icon: '🚀',
    desc: 'Para presencia institucional administrada',
    cta: 'Empezar con Starter →',
  },
  pro: {
    icon: '⚡',
    desc: 'Para negocios con tienda, CRM, IA y varios sitios',
    featured: true,
    cta: 'Activar plan Pro →',
  },
  commerce: {
    icon: '🏢',
    desc: 'Para funnels, automatizaciones y soporte omnicanal',
    cta: 'Activar Business →',
  },
  business: {
    icon: '🏢',
    desc: 'Para funnels, automatizaciones y soporte omnicanal',
    cta: 'Activar Business →',
  },
};

function formatMxn(value: number) {
  return value.toLocaleString('es-MX');
}

function priceLabel(plan: PricingPlanView, annual: boolean) {
  if (annual && plan.annualEquivalentLabel) return plan.annualEquivalentLabel;
  if (!annual && plan.priceMonthLabel) return plan.priceMonthLabel;
  const monthlyEquivalent = annual ? Math.round(plan.priceYearMxn / 12) : plan.priceMonthMxn;
  return '$' + formatMxn(monthlyEquivalent);
}

function billingNote(plan: PricingPlanView, annual: boolean) {
  if (annual && plan.priceYearLabel) return 'Facturado ' + plan.priceYearLabel + ' / año';
  return (plan.taxNote ?? 'USD/mes · IVA no incluido') + ' · facturado ' + (annual ? 'anualmente' : 'mensualmente');
}

type BillingInterval = 'month' | 'year';

interface PricingSectionProps {
  plans: PricingPlanView[];
  currentPlanId?: string | null;
  currentInterval?: BillingInterval | null;
  currentStatus?: string | null;
  currentEndsAt?: string | null;
  autoCheckoutPlanId?: string | null;
  autoCheckoutInterval?: BillingInterval;
}

function planFeatures(plan: PricingPlanView) {
  const base = plan.features.map((label) => ({ included: true, label }));
  return [
    ...base,
    { included: plan.hasEcommerce, label: 'E-commerce integrado' },
    { included: plan.hasExport, label: 'Exportacion de codigo limpio' },
  ];
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'el fin del periodo actual';
  return new Date(value).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PricingSection({ plans, currentPlanId, currentInterval, currentStatus, currentEndsAt, autoCheckoutPlanId, autoCheckoutInterval = 'month' }: PricingSectionProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const autoCheckoutStartedRef = useRef(false);
  const [annual, setAnnual] = useState(autoCheckoutInterval === 'year');
  const [autoCheckoutError, setAutoCheckoutError] = useState<string | null>(null);
  const hasPendingSubscription = currentStatus === 'pending';
  const hasScheduledCancellation = currentStatus === 'cancelled' || currentStatus === 'canceled';
  const pendingPlan = hasPendingSubscription ? plans.find((plan) => plan.id === currentPlanId) : null;
  const currentPlan = currentPlanId ? plans.find((plan) => plan.id === currentPlanId) : null;

  useEffect(() => {
    if (!autoCheckoutPlanId || autoCheckoutStartedRef.current) return;

    const targetPlan = plans.find((plan) => plan.id === autoCheckoutPlanId);
    const interval = autoCheckoutInterval === 'year' ? 'year' : 'month';
    const isAvailable = interval === 'year' ? targetPlan?.isAvailableYear : targetPlan?.isAvailableMonth;

    if (!targetPlan) {
      window.setTimeout(() => {
        setAutoCheckoutError('No encontramos el plan seleccionado. Elige otro plan para continuar.');
      }, 0);
      autoCheckoutStartedRef.current = true;
      return;
    }

    if (!isAvailable) {
      window.setTimeout(() => {
        setAutoCheckoutError('Este plan todavia no tiene pagos configurados para el intervalo seleccionado.');
      }, 0);
      autoCheckoutStartedRef.current = true;
      return;
    }

    if (sessionStatus === 'loading') return;

    if (!session) {
      const checkoutReturn = '/precios?checkout=' + encodeURIComponent(autoCheckoutPlanId) + '&interval=' + interval;
      router.replace('/register?plan=' + encodeURIComponent(autoCheckoutPlanId) + '&interval=' + interval + '&callbackUrl=' + encodeURIComponent(checkoutReturn));
      autoCheckoutStartedRef.current = true;
      return;
    }

    autoCheckoutStartedRef.current = true;

    void (async () => {
      setAutoCheckoutError(null);
      try {
        const res = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: autoCheckoutPlanId, interval }),
        });
        const data = await res.json() as { initPoint?: string; error?: string; code?: string };

        if (data.initPoint) {
          window.location.href = data.initPoint;
          return;
        }

        if (data.code === 'ACTIVE_SUBSCRIPTION_EXISTS') {
          router.replace('/dashboard');
          return;
        }

        setAutoCheckoutError(data.error ?? 'No se pudo iniciar el pago automaticamente. Intenta desde el boton del plan.');
      } catch {
        setAutoCheckoutError('No se pudo conectar con el checkout. Intenta desde el boton del plan.');
      }
    })();
  }, [autoCheckoutInterval, autoCheckoutPlanId, plans, router, session, sessionStatus]);

  return (
    <section id="planes" className="mk-section bg-orvenix-bg">
      <div className="mk-container">
        {autoCheckoutPlanId && !autoCheckoutError && (
          <div className="mb-8 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
            Preparando checkout seguro para tu plan seleccionado...
          </div>
        )}
        {autoCheckoutError && (
          <div className="mb-8 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            <strong className="text-red-200">No se pudo abrir el checkout:</strong> {autoCheckoutError}
          </div>
        )}
        {pendingPlan && (
          <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            <strong className="text-amber-200">Pago pendiente:</strong> tu plan {pendingPlan.name} esta esperando confirmacion de la pasarela. Si ya pagaste, el acceso se activara automaticamente cuando llegue el webhook.
          </div>
        )}
        {hasScheduledCancellation && currentPlan && (
          <div className="mb-8 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            <strong className="text-red-200">Cancelacion programada:</strong> tu plan {currentPlan.name} sigue activo hasta {formatDate(currentEndsAt)}. Reactivalo desde el dashboard o el portal de Stripe para no abrir una suscripcion duplicada.
          </div>
        )}

        <div className="mb-12 flex items-center justify-center gap-4">
          <span className={(!annual ? 'mk-accent-text' : 'text-orvenix-secondary') + ' text-sm font-bold transition-colors'}>Mensual</span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Cambiar a facturacion anual"
            onClick={() => setAnnual(!annual)}
            className="mk-billing-toggle"
          >
            <span className={'mk-billing-thumb ' + (annual ? 'mk-billing-thumb-on' : '')} />
          </button>
          <span className={(annual ? 'mk-accent-text' : 'text-orvenix-secondary') + ' text-sm font-bold transition-colors'}>
            Anual <span className="ml-1 rounded-full bg-orvenix-accent px-2 py-0.5 text-xs font-extrabold text-orvenix-bg">2 meses gratis</span>
          </span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.id] ?? {
              icon: '✨',
              desc: (plan.maxWebsites >= 9999 ? 'Sitios ilimitados' : plan.maxWebsites + ' sitios') + ' · ' + plan.maxVisits.toLocaleString('es-MX') + ' visitas',
              cta: 'Activar ' + plan.name + ' →',
            };
            const featured = Boolean(meta.featured);
            const saving = Math.max(0, plan.priceMonthMxn * 12 - plan.priceYearMxn);
            const available = annual ? plan.isAvailableYear : plan.isAvailableMonth;
            const isCurrentPlan = currentPlanId === plan.id;
            const isPendingPlan = hasPendingSubscription && isCurrentPlan;
            const isCancelledPlan = hasScheduledCancellation && isCurrentPlan;
            const currentIntervalLabel = currentInterval === 'year' ? 'anual' : 'mensual';

            return (
              <div key={plan.id} className={'mk-plan-card relative ' + (featured ? 'mk-plan-card-featured lg:scale-[1.02]' : '')}>
                {featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orvenix-accent px-4 py-1.5 text-xs font-extrabold text-orvenix-bg">
                    MAS POPULAR
                  </div>
                )}
                {isCurrentPlan && (
                  <div className={(isPendingPlan ? 'bg-amber-500' : 'bg-emerald-500') + ' absolute -top-4 right-4 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold text-white'}>
                    {isPendingPlan ? 'Pago pendiente' : 'Plan actual'}
                  </div>
                )}
                {featured && <div className="mt-4" />}

                <div className="mb-3 text-4xl">{meta.icon}</div>
                <h3 className="mb-1 text-xl font-extrabold text-orvenix-text">{plan.name}</h3>
                <p className="mb-4 text-sm text-orvenix-secondary">{meta.desc}</p>

                <div className="mb-5">
                  <div className={(featured ? 'mk-accent-text' : 'text-orvenix-text') + ' text-4xl font-extrabold leading-none'}>{priceLabel(plan, annual)}</div>
                  <p className="mt-1 text-xs text-orvenix-secondary">{billingNote(plan, annual)}</p>
                  {annual && plan.priceYearLabel && <p className="mt-0.5 text-xs text-orvenix-secondary">Total anual: {plan.priceYearLabel}</p>}
                  {(annual && (plan.annualSavingLabel || saving > 0)) && (
                    <div className="mk-saving-badge">{plan.annualSavingLabel ?? 'Ahorro anual aplicado vs el plan mensual'}</div>
                  )}
                </div>

                {isCurrentPlan ? (
                  <Link
                    href="/dashboard"
                    className={(featured ? 'mk-btn-primary' : 'mk-btn-outline') + ' mb-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all duration-200'}
                    aria-current="true"
                  >
                    {isPendingPlan ? 'Ver estado en dashboard' : isCancelledPlan ? 'Reactivar desde dashboard' : 'Plan actual · ' + currentIntervalLabel}
                  </Link>
                ) : (
                  <PricingCheckoutButton
                    planId={plan.id}
                    interval={annual ? 'year' : 'month'}
                    label={available ? meta.cta : 'Configurar pagos →'}
                    featured={featured}
                    unavailable={!available}
                  />
                )}

                <ul className="space-y-2.5">
                  {planFeatures(plan).map((f) => (
                    <li key={f.label} className={'flex items-start gap-2 text-sm ' + (f.included ? 'text-orvenix-text' : 'text-orvenix-muted')}>
                      <span className={'shrink-0 ' + (f.included ? 'mk-accent-text' : '')}>{f.included ? '✓' : '—'}</span>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-orvenix-secondary">
          Precios oficiales en USD · IVA no incluido salvo donde se indique · Cancelacion con 5 dias naturales de anticipacion
        </p>

        <div className="mk-guarantee-banner mt-8">
          <span className="shrink-0 text-2xl" aria-hidden="true">🛡️</span>
          <div>
            <p className="text-sm font-bold mk-accent-text">Condiciones oficiales 2026</p>
            <p className="mt-0.5 text-xs text-orvenix-secondary">
              Planes mensuales sin reembolso despues de activarse. En anual, la ventana de reembolso inicial es de 7 dias naturales con retencion administrativa del 15%.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/contacto?plan=enterprise" className="text-sm font-bold mk-accent-text hover:underline">
            ¿Necesitas Enterprise? Hablar con ventas →
          </Link>
        </div>
      </div>
    </section>
  );
}
