'use client';

import { useState } from 'react';
import Link from 'next/link';
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
}

const PLAN_META: Record<string, { icon: string; desc: string; featured?: boolean; cta: string }> = {
  starter: {
    icon: '🚀',
    desc: 'Para emprendedores y negocios nuevos',
    cta: 'Empezar ahora →',
  },
  pro: {
    icon: '⚡',
    desc: 'Para negocios en crecimiento',
    featured: true,
    cta: 'Activar plan Pro →',
  },
  commerce: {
    icon: '🛒',
    desc: 'Para tiendas, funnels y ventas online',
    cta: 'Activar Commerce →',
  },
};

function formatMxn(value: number) {
  return value.toLocaleString('es-MX');
}

type BillingInterval = 'month' | 'year';

interface PricingSectionProps {
  plans: PricingPlanView[];
  currentPlanId?: string | null;
  currentInterval?: BillingInterval | null;
  currentStatus?: string | null;
  currentEndsAt?: string | null;
}

function planFeatures(plan: PricingPlanView) {
  const base = plan.features.map((label) => ({ included: true, label }));
  return [
    ...base,
    { included: plan.hasEcommerce, label: 'E-commerce integrado' },
    { included: plan.hasExport, label: 'Exportación de código limpio' },
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

export function PricingSection({ plans, currentPlanId, currentInterval, currentStatus, currentEndsAt }: PricingSectionProps) {
  const [annual, setAnnual] = useState(false);
  const hasPendingSubscription = currentStatus === 'pending';
  const hasScheduledCancellation = currentStatus === 'cancelled' || currentStatus === 'canceled';
  const pendingPlan = hasPendingSubscription
    ? plans.find((plan) => plan.id === currentPlanId)
    : null;
  const currentPlan = currentPlanId ? plans.find((plan) => plan.id === currentPlanId) : null;

  return (
    <section id="planes" className="mk-section bg-orvenix-bg">
      <div className="mk-container">
        {pendingPlan && (
          <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            <strong className="text-amber-200">Pago pendiente:</strong>{' '}
            tu plan {pendingPlan.name} esta esperando confirmacion de la pasarela. Si ya pagaste, el acceso se activara automaticamente cuando llegue el webhook.
          </div>
        )}
        {hasScheduledCancellation && currentPlan && (
          <div className="mb-8 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            <strong className="text-red-200">Cancelacion programada:</strong>{' '}
            tu plan {currentPlan.name} sigue activo hasta {formatDate(currentEndsAt)}. Reactivalo desde el dashboard o el portal de Stripe para no abrir una suscripcion duplicada.
          </div>
        )}

        {/* Toggle mensual / anual */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-bold transition-colors ${!annual ? 'mk-accent-text' : 'text-orvenix-secondary'}`}>
            Mensual
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            aria-label="Cambiar a facturación anual"
            onClick={() => setAnnual(!annual)}
            className="mk-billing-toggle"
          >
            <span className={`mk-billing-thumb ${annual ? 'mk-billing-thumb-on' : ''}`} />
          </button>
          <span className={`text-sm font-bold transition-colors ${annual ? 'mk-accent-text' : 'text-orvenix-secondary'}`}>
            Anual{' '}
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-orvenix-accent text-orvenix-bg ml-1">
              -20%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            (() => {
              const meta = PLAN_META[plan.id] ?? {
                icon: '✨',
                desc: `${plan.maxWebsites >= 9999 ? 'Sitios ilimitados' : `${plan.maxWebsites} sitios`} · ${plan.maxVisits.toLocaleString('es-MX')} visitas`,
                cta: `Activar ${plan.name} →`,
              };
              const featured = Boolean(meta.featured);
              const monthlyEquivalent = annual ? Math.round(plan.priceYearMxn / 12) : plan.priceMonthMxn;
              const saving = Math.max(0, plan.priceMonthMxn * 12 - plan.priceYearMxn);
              const available = annual ? plan.isAvailableYear : plan.isAvailableMonth;
              const isCurrentPlan = currentPlanId === plan.id;
              const isPendingPlan = hasPendingSubscription && isCurrentPlan;
              const isCancelledPlan = hasScheduledCancellation && isCurrentPlan;
              const currentIntervalLabel = currentInterval === 'year' ? 'anual' : 'mensual';

              return (
            <div
              key={plan.id}
              className={`mk-plan-card relative ${featured ? 'mk-plan-card-featured lg:scale-[1.02]' : ''}`}
            >
              {featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orvenix-accent text-orvenix-bg text-xs font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
                  ⭐ MÁS POPULAR
                </div>
              )}
              {isCurrentPlan && (
                <div className={`absolute -top-4 right-4 text-white text-xs font-extrabold px-3 py-1.5 rounded-full whitespace-nowrap ${isPendingPlan ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                  {isPendingPlan ? 'Pago pendiente' : 'Plan actual'}
                </div>
              )}
              {featured && <div className="mt-4" />}

              <div className="text-4xl mb-3">{meta.icon}</div>
              <h3 className="text-xl font-extrabold mb-1 text-orvenix-text">{plan.name}</h3>
              <p className="text-sm text-orvenix-secondary mb-4">{meta.desc}</p>

              <div className="mb-5">
                <div className={`text-4xl font-extrabold leading-none ${featured ? 'mk-accent-text' : 'text-orvenix-text'}`}>
                  ${formatMxn(monthlyEquivalent)}
                </div>
                <p className="text-xs text-orvenix-secondary mt-1">
                  MXN/mes · facturado {annual ? 'anualmente' : 'mensualmente'}
                </p>
                {annual && (
                  <>
                    <p className="text-xs text-orvenix-secondary mt-0.5">
                      Facturado ${formatMxn(plan.priceYearMxn)} MXN / año
                    </p>
                    {saving > 0 && (
                      <div className="mk-saving-badge">
                        🎁 Ahorras ${formatMxn(saving)} MXN vs el plan mensual
                      </div>
                    )}
                  </>
                )}
              </div>

              {isCurrentPlan ? (
                <Link
                  href="/dashboard"
                  className={`block w-full text-center py-3 rounded-xl text-sm font-bold mb-6 transition-all duration-200 ${
                    featured ? 'mk-btn-primary' : 'mk-btn-outline'
                  }`}
                  aria-current="true"
                >
                  {isPendingPlan
                    ? 'Ver estado en dashboard'
                    : isCancelledPlan
                      ? 'Reactivar desde dashboard'
                      : `Plan actual · ${currentIntervalLabel}`}
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
                  <li
                    key={f.label}
                    className={`flex gap-2 items-start text-sm ${f.included ? 'text-orvenix-text' : 'text-orvenix-muted'}`}
                  >
                    <span className={`shrink-0 ${f.included ? 'mk-accent-text' : ''}`}>
                      {f.included ? '✓' : '—'}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
              );
            })()
          ))}
        </div>

        <p className="text-center text-xs text-orvenix-secondary mt-6">
          Todos los precios en MXN · IVA no incluido · Cancela en cualquier momento
        </p>

        <div className="mk-guarantee-banner mt-8">
          <span className="text-2xl shrink-0" aria-hidden="true">🛡️</span>
          <div>
            <p className="font-bold text-sm mk-accent-text">Garantía de 30 días — sin preguntas</p>
            <p className="text-xs text-orvenix-secondary mt-0.5">
              Si en los primeros 30 días no estás satisfecho, te devolvemos el 100% de tu pago. Sin formularios complicados, sin letra chica.
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
