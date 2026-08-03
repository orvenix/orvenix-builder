import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { PricingSection, type PricingPlanView } from '@/components/marketing/home/PricingSection';
import { REAL_TEMPLATES } from '@/lib/realTemplates';
import { ArrowRight, CreditCard, CheckCircle } from 'lucide-react';
import { formatUsd, getOfficialPlan, officialPlanComparison2026, officialPlans2026 } from '@/lib/orvenix-official-2026';
import { editorPrisma } from '@/lib/editor-db';
import { getAuthSession } from '@/lib/auth-session';
import { serverWarn } from '@/lib/server-log';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Planes y Precios 2026 — Orvenix SaaS desde 15 USD/mes',
  description: 'Planes oficiales Orvenix 2026 en USD + IVA: Starter, Pro, Business y Enterprise. Hosting administrado, editor visual, IA, CRM, eCommerce y soporte segun plan.',
  openGraph: {
    url: 'https://orvenix.com.mx/precios/',
    title: 'Planes y Precios — Orvenix SaaS',
    description: 'Planes oficiales 2026 en USD + IVA. Editor visual, hosting administrado, IA, CRM, eCommerce y soporte segun plan.',
    images: ['/img/logo-main.png'],
  },
};

const guaranteeItems = [
  { icon: '🔒', title: 'Infraestructura gestionada', desc: 'Hosting premium, SSL/TLS, monitoreo Core Web Vitals y soporte tecnico de continuidad operativa.' },
  { icon: '📦', title: 'Datos exportables', desc: 'En planes Pro, Business y Enterprise puedes exportar codigo y datos en formatos estandar.' },
  { icon: '⚡', title: 'Marco legal claro', desc: 'Condiciones 2026 documentadas: facturacion, renovaciones, SLA, backups, reembolsos y compra definitiva.' },
];

const comparisonRows = officialPlanComparison2026.map(([feature, , pro, business, enterprise]) => ({
  feature,
  orvenix: pro,
  wix: business,
  agencia: enterprise,
}));

const faqItems = [
  { question: '¿Los precios incluyen IVA?', answer: 'Los precios oficiales se expresan en USD antes de IVA. En Mexico se puede cobrar en MXN usando el tipo de cambio vigente de Banco de Mexico en la fecha de cobro o factura.' },
  { question: '¿Puedo cancelar mi plan?', answer: 'Si. La cancelacion debe solicitarse desde el panel administrativo al menos 5 dias naturales antes del corte del servicio. El acceso se mantiene hasta el final del periodo pagado.' },
  { question: '¿Hay reembolsos?', answer: 'Los planes mensuales y add-ons ejecutados no tienen reembolso. En anual, la ventana inicial es de 7 dias naturales posteriores al primer pago, con retencion administrativa del 15%.' },
  { question: '¿Qué pasa si se atrasa un pago?', answer: 'Hay 3 dias de gracia. Despues puede suspenderse la plataforma y el sitio publico. Tras 30 dias naturales de suspension por falta de pago, los archivos pueden eliminarse del servidor.' },
  { question: '¿Qué incluye el SLA?', answer: 'Orvenix compromete 99.9% de disponibilidad mensual, soporte por severidad y backups diarios. Starter conserva historial de 7 dias; Pro y Business conservan 30 dias.' },
  { question: '¿Puedo comprar definitivamente mi sitio?', answer: 'Si. La compra definitiva transfiere derechos patrimoniales sobre el codigo personalizado entregado, mientras Orvenix conserva sus librerias base y componentes propietarios.' },
];

function toPricingPlanView(plan: (typeof officialPlans2026)[number]): PricingPlanView | null {
  if (plan.id === 'enterprise') return null;
  const billingId = 'billingId' in plan ? plan.billingId : plan.id;
  const monthlyUsd = plan.monthlyUsd ?? 0;
  const annualUsd = plan.annualUsd ?? 0;

  return {
    id: billingId,
    name: plan.name,
    priceMonthMxn: Math.round(monthlyUsd * 100),
    priceYearMxn: Math.round(annualUsd * 100),
    maxWebsites: plan.maxWebsites,
    maxVisits: plan.maxVisits,
    hasEcommerce: plan.id !== 'starter',
    hasExport: plan.id !== 'starter',
    features: [...plan.features],
    isAvailableMonth: Boolean(process.env['STRIPE_PRICE_' + plan.stripeEnvAlias + '_MONTH'] || ('legacyStripeEnvAlias' in plan && process.env['STRIPE_PRICE_' + plan.legacyStripeEnvAlias + '_MONTH'])),
    isAvailableYear: Boolean(process.env['STRIPE_PRICE_' + plan.stripeEnvAlias + '_YEAR'] || ('legacyStripeEnvAlias' in plan && process.env['STRIPE_PRICE_' + plan.legacyStripeEnvAlias + '_YEAR'])),
    priceMonthLabel: formatUsd(plan.monthlyUsd),
    priceYearLabel: formatUsd(plan.annualTotalUsd),
    annualEquivalentLabel: plan.annualUsd ? formatUsd(plan.annualUsd / 12) : undefined,
    annualSavingLabel: plan.annualUsd ? 'Ahorro anual oficial: ' + formatUsd(plan.monthlyUsd! * 12 - plan.annualUsd) : undefined,
    taxNote: plan.monthlyTotalUsd ? formatUsd(plan.monthlyTotalUsd) + ' con IVA / mes' : 'Cotizacion segun alcance',
  };
}

const FALLBACK_PRICING_PLANS: PricingPlanView[] = officialPlans2026
  .map(toPricingPlanView)
  .filter((plan): plan is PricingPlanView => Boolean(plan));

async function getPricingPlans(): Promise<PricingPlanView[]> {
  try {
    const plans = await editorPrisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthMxn: 'asc' },
    });

    if (plans.length === 0) {
      serverWarn('[precios] No active plans found in DB, rendering fallback pricing plans');
      return FALLBACK_PRICING_PLANS;
    }

    return plans.map((plan) => {
      const official = getOfficialPlan(plan.id);
      const officialView = official ? toPricingPlanView(official) : null;
      return {
        id: plan.id,
        name: officialView?.name ?? plan.name,
        priceMonthMxn: plan.priceMonthMxn,
        priceYearMxn: plan.priceYearMxn,
        maxWebsites: officialView?.maxWebsites ?? plan.maxWebsites,
        maxVisits: officialView?.maxVisits ?? plan.maxVisits,
        hasEcommerce: officialView?.hasEcommerce ?? plan.hasEcommerce,
        hasExport: officialView?.hasExport ?? plan.hasExport,
        features: officialView?.features ?? (Array.isArray(plan.features)
          ? plan.features.filter((feature): feature is string => typeof feature === 'string')
          : []),
        isAvailableMonth: Boolean(
          plan.stripePriceIdMonth || officialView?.isAvailableMonth || process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_MONTH`]
        ),
        isAvailableYear: Boolean(
          plan.stripePriceIdYear || officialView?.isAvailableYear || process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_YEAR`]
        ),
        priceMonthLabel: officialView?.priceMonthLabel,
        priceYearLabel: officialView?.priceYearLabel,
        annualEquivalentLabel: officialView?.annualEquivalentLabel,
        annualSavingLabel: officialView?.annualSavingLabel,
        taxNote: officialView?.taxNote,
      };
    });
  } catch (error) {
    serverWarn('[precios] Falling back to static pricing plans because DB lookup failed', error);
    return FALLBACK_PRICING_PLANS;
  }
}

type CurrentPlanView = {
  currentPlanId: string | null;
  currentInterval: 'month' | 'year' | null;
  currentStatus: string | null;
  currentEndsAt: string | null;
};

async function getCurrentPlan(userId?: string | null): Promise<CurrentPlanView> {
  if (!userId) {
    return { currentPlanId: null, currentInterval: null, currentStatus: null, currentEndsAt: null };
  }

  let subscription;
  try {
    subscription = await editorPrisma.subscription.findUnique({
      where: { userId },
      select: { planId: true, interval: true, status: true, canceledAt: true, currentPeriodEnd: true },
    });
  } catch (error) {
    serverWarn('[precios] Unable to read current subscription from DB', { userId, error });
    return { currentPlanId: null, currentInterval: null, currentStatus: null, currentEndsAt: null };
  }

  const currentEndsAt = subscription?.canceledAt ?? subscription?.currentPeriodEnd ?? null;
  const isScheduledCancellation =
    (subscription?.status === 'cancelled' || subscription?.status === 'canceled') &&
    currentEndsAt instanceof Date &&
    currentEndsAt.getTime() > Date.now();
  const isVisibleStatus =
    subscription?.status === 'active' ||
    subscription?.status === 'authorized' ||
    subscription?.status === 'pending' ||
    isScheduledCancellation;
  if (!subscription || !isVisibleStatus) {
    return { currentPlanId: null, currentInterval: null, currentStatus: null, currentEndsAt: null };
  }

  return {
    currentPlanId: subscription.planId,
    currentInterval: subscription.interval === 'year' ? 'year' : 'month',
    currentStatus: subscription.status,
    currentEndsAt: currentEndsAt?.toISOString() ?? null,
  };
}

type PreciosPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PreciosPage({ searchParams }: PreciosPageProps) {
  let session = null;
  try {
    session = await getAuthSession();
  } catch (error) {
    serverWarn('[precios] Auth session unavailable, rendering pricing without current plan context', error);
  }
  const rawSearchParams = await searchParams;
  const autoCheckoutPlanId = firstSearchValue(rawSearchParams?.checkout) ?? null;
  const autoCheckoutInterval = firstSearchValue(rawSearchParams?.interval) === 'year' ? 'year' : 'month';

  const [plans, currentPlan] = await Promise.all([
    getPricingPlans(),
    getCurrentPlan(session?.user?.id),
  ]);

  return (
    <MarketingLayout>

      {/* Hero */}
      <section className="mk-hero bg-orvenix-bg" aria-label="Planes y Precios">
        <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
        <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />
        <div className="mk-container relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="mk-eyebrow-dot" aria-hidden="true" />
              <span className="text-sm font-medium text-orvenix-secondary">Planes oficiales 2026</span>
            </div>
            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Planes Orvenix,<br />marco 2026
            </h1>
            <p className="text-base leading-relaxed mb-6 text-orvenix-secondary">
              Elige Starter, Pro, Business o Enterprise con precios oficiales en USD + IVA, infraestructura gestionada, SLA, backups y reglas comerciales claras.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="mk-urgency-pill">
                <span className="mk-live-dot" aria-hidden="true" />
                <strong>2026</strong> dossier oficial publicado
              </span>
              <span className="mk-urgency-pill mk-urgency-pill-red">
                SLA, contrato y facturacion documentados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive billing toggle + pricing cards */}
      <PricingSection
        plans={plans}
        currentPlanId={currentPlan.currentPlanId}
        currentInterval={currentPlan.currentInterval}
        currentStatus={currentPlan.currentStatus}
        currentEndsAt={currentPlan.currentEndsAt}
        autoCheckoutPlanId={autoCheckoutPlanId}
        autoCheckoutInterval={autoCheckoutInterval}
      />

      {/* Trust items */}
      <section className="mk-section-alt">
        <div className="mk-container">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {guaranteeItems.map((g) => (
              <div key={g.title}>
                <div className="text-4xl mb-3">{g.icon}</div>
                <h3 className="font-bold text-base mb-2 text-orvenix-text">{g.title}</h3>
                <p className="text-sm leading-relaxed text-orvenix-secondary">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader
            tag="¿Por qué Orvenix?"
            title="Comparativa oficial de planes"
            description="Starter, Pro, Business y Enterprise comparados con los criterios del dossier corporativo 2026."
            center
          />
          <div className="mt-10 overflow-x-auto">
            <table className="mk-cmp-table" aria-label="Comparación Orvenix vs alternativas">
              <thead>
                <tr>
                  <th scope="col">Característica</th>
                  <th scope="col" className="highlight">Pro</th>
                  <th scope="col">Business</th>
                  <th scope="col">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r) => (
                  <tr key={r.feature}>
                    <td>{r.feature}</td>
                    <td className="highlight mk-accent-text font-semibold">{r.orvenix}</td>
                    <td>{r.wix}</td>
                    <td>{r.agencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8">
            <Link href="#planes" className="mk-btn-primary">Ver planes de Orvenix →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader title="Preguntas frecuentes" center />
          <div className="mt-10 max-w-2xl mx-auto">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          SECCIÓN: Dos modelos de contratación
      ────────────────────────────────────────────────────────────── */}
      <section className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader
            tag="¿Suscripción o compra única?"
            title="Dos formas de tener tu sitio"
            description="Elige el modelo que mejor se adapta a tu negocio. Ambos incluyen editor visual, soporte y publicación inmediata."
            center
          />
          <div className="mt-10 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                icon: "🔄",
                title: "Plataforma mensual",
                subtitle: "Desde 15 USD/mes",
                badge: "Sin pago inicial",
                badgeColor: "bg-[rgba(0,131,179,0.10)] text-[color:var(--accent-3)] border-[rgba(0,131,179,0.22)]",
                desc: "Paga mes a mes y ten acceso a plataforma, editor visual, publicacion, hosting administrado y soporte segun el plan elegido.",
                pros: ["Sin pago inicial grande", "Actualizaciones automáticas", "Soporte incluido", "Cancela con 5 dias de anticipacion"],
                cta: "Ver planes →",
                href: "#planes",
                primary: false,
              },
              {
                icon: "💎",
                title: "Compra o renta un sitio",
                subtitle: "Cotizacion a medida",
                badge: "Pago único disponible",
                badgeColor: "bg-[rgba(0,181,246,0.10)] text-[color:var(--accent)] border-[color:var(--glass-border-hover)]",
                desc: "Solicita compra definitiva de tu desarrollo para recibir el codigo personalizado y migrarlo o mantenerlo en infraestructura Orvenix.",
                pros: ["Precio fijo sin sorpresas", "Cesion patrimonial del codigo personalizado", "Templates por industria", "Editable sin código"],
                cta: "Ver templates →",
                href: "/templates",
                primary: true,
              },
            ].map(item => (
              <div key={item.title} className={`rounded-3xl border p-8 flex flex-col ${item.primary ? "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.04)]" : "border-white/8 bg-white/2"}`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className={`inline-flex items-center self-start rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3 ${item.badgeColor}`}>
                  {item.badge}
                </div>
                <h3 className="text-xl font-black text-orvenix-text mb-1">{item.title}</h3>
                <p className="text-sm font-bold text-orvenix-secondary mb-3">{item.subtitle}</p>
                <p className="text-sm text-orvenix-secondary leading-relaxed mb-5">{item.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {item.pros.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-orvenix-secondary">
                      <CheckCircle size={14} className="shrink-0 text-[color:var(--accent)]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={item.href}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl font-bold text-sm transition ${item.primary ? "bg-[color:var(--accent-2)] hover:bg-[color:var(--accent)] text-white" : "border border-white/10 bg-white/4 hover:bg-white/8 text-orvenix-text"}`}
                >
                  {item.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────
          SECCIÓN: Templates disponibles con precios
      ────────────────────────────────────────────────────────────── */}
      <section className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Catálogo de sitios"
            title="Elige tu sitio por industria"
            description="Templates profesionales listos para activar. Edita textos, colores e imágenes sin tocar código."
            center
          />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REAL_TEMPLATES.slice(0, 6).map(t => {
              const Icon = t.Icon
              return (
                <div key={t.id} className="rounded-2xl border border-white/8 bg-white/2 p-5 flex flex-col gap-4 hover:border-white/16 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-orvenix-secondary uppercase tracking-wider mb-1">{t.category}</p>
                      <h3 className="font-black text-orvenix-text text-sm leading-tight">{t.name}</h3>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${t.gradient} shadow`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-2 text-center">
                    <div className="flex-1 rounded-lg bg-white/3 border border-white/6 py-2 px-3">
                      <p className="text-[10px] text-orvenix-secondary mb-0.5">Compra</p>
                      <p className="text-sm font-black text-orvenix-text">${t.purchasePriceMxn.toLocaleString("es-MX")}</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-white/3 border border-white/6 py-2 px-3">
                      <p className="text-[10px] text-orvenix-secondary mb-0.5">Renta/mes</p>
                      <p className="text-sm font-black text-orvenix-text">${t.rentalPriceMxn.toLocaleString("es-MX")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link href={t.livePath} target="_blank" rel="noopener noreferrer" className="flex-1 h-8 flex items-center justify-center gap-1 rounded-lg border border-white/10 text-[11px] font-bold text-orvenix-secondary hover:text-orvenix-text transition">
                      Ver demo <ArrowRight size={11} />
                    </Link>
                    <Link href="/templates" className="flex-1 h-8 flex items-center justify-center gap-1 rounded-lg bg-[color:var(--accent-2)] hover:bg-[color:var(--accent)] text-[11px] font-bold text-white transition">
                      <CreditCard size={11} /> Adquirir
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/templates" className="mk-btn-primary inline-flex items-center gap-2">
              Ver todos los templates
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para empezar?"
        description="Activa tu plataforma hoy. Nuestro equipo la deja lista en menos de 24 horas."
        buttonLabel="Elegir plan oficial →"
        buttonHref="/precios#planes"
      />
    </MarketingLayout>
  );
}
