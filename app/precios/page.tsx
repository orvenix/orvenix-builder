import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { PricingSection, type PricingPlanView } from '@/components/marketing/home/PricingSection';
import { REAL_TEMPLATES } from '@/lib/realTemplates';
import { ArrowRight, CreditCard, CheckCircle } from 'lucide-react';
import { editorPrisma } from '@/lib/editor-db';
import { getAuthSession } from '@/lib/auth-session';
import { serverWarn } from '@/lib/server-log';

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: 'Planes y Precios — Orvenix SaaS desde $349 MXN/mes',
  description: 'Planes SaaS Orvenix desde $349 MXN/mes. Panel privado, sitio web, tienda online, citas y más. Sin permanencia forzada. Cancela cuando quieras.',
  openGraph: {
    url: 'https://orvenix.com.mx/precios/',
    title: 'Planes y Precios — Orvenix SaaS',
    description: 'Planes desde $349 MXN/mes. Panel privado, tienda, citas, almacenamiento y más. Sin costos ocultos.',
    images: ['/img/logo-main.png'],
  },
};

const guaranteeItems = [
  { icon: '🔒', title: 'Sin permanencia', desc: 'Cancela cuando quieras, sin penalizaciones. Tu cuenta se mantiene activa hasta el final del periodo pagado.' },
  { icon: '📦', title: 'Tu data es tuya', desc: 'Exporta todos tus datos — clientes, productos, archivos — en cualquier momento. Sin restricciones ni rehenes.' },
  { icon: '⚡', title: 'Activación en 24 horas', desc: 'Tu plataforma queda lista en menos de un día hábil. Nuestro equipo la configura con tu marca y datos.' },
];

const comparisonRows = [
  { feature: 'Sitio web profesional',          orvenix: '✓',              wix: '✓',               agencia: '✓' },
  { feature: 'Panel privado para tus clientes', orvenix: '✓ Incluido',     wix: '✗ No existe',     agencia: 'Desarrollo extra' },
  { feature: 'Almacenamiento en la nube',       orvenix: '✓ 50 GB',        wix: '✗ No incluido',   agencia: '✗ No incluido' },
  { feature: 'Gestión de proyectos',           orvenix: '✓ Integrado',    wix: '✗ Requiere apps', agencia: 'Costo extra' },
  { feature: 'Sistema de citas y pagos',        orvenix: '✓ Incluido',     wix: 'Plan premium +$', agencia: 'Desarrollo extra' },
  { feature: 'Dominio .com.mx incluido',        orvenix: '✓ Plan Pro+',    wix: 'Costo adicional', agencia: 'Costo adicional' },
  { feature: 'Soporte en español',              orvenix: '✓ WhatsApp',     wix: 'Chat en inglés',  agencia: 'Depende' },
  { feature: 'Servidores en México',            orvenix: '✓ CDMX y GDL',  wix: '✗ USA / Europa',  agencia: 'Depende' },
  { feature: 'Actualizaciones de plataforma',   orvenix: '✓ Automáticas',  wix: '✓',               agencia: '✗ Cobro extra' },
  { feature: 'Costo de setup',                 orvenix: '$0 — Incluido',  wix: '$0',              agencia: '$2,000–$15,000 MXN' },
  { feature: 'Precio mensual',                 orvenix: 'Desde $349 MXN', wix: '$549+ MXN',       agencia: '$2,000+/mes mantenimiento' },
];

const faqItems = [
  { question: '¿Puedo cambiar de plan en cualquier momento?', answer: 'Sí. Puedes subir o bajar de plan cuando quieras desde tu panel. El cambio aplica en el siguiente ciclo de facturación. Si subes de plan, el acceso a las nuevas funciones es inmediato.' },
  { question: '¿Qué pasa si cancelo? ¿Pierdo mis datos?', answer: 'No. Al cancelar tienes 30 días para exportar todos tus datos (clientes, archivos, configuraciones) antes de que la cuenta se cierre. Nunca te dejamos sin acceso de forma inmediata.' },
  { question: '¿El precio incluye IVA?', answer: 'Los precios publicados son antes de IVA. Al facturar se agrega el 16% correspondiente. Para empresas que requieren factura, la emitimos automáticamente al cierre de cada periodo.' },
  { question: '¿Cómo funciona el ahorro anual?', answer: 'Al elegir facturación anual pagas el equivalente a 9.6 meses en lugar de 12 — un ahorro del 20%. El cargo se hace una sola vez al inicio del año y no hay renovación automática sorpresa.' },
  { question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos tarjeta de crédito o débito (Visa, Mastercard, Amex), transferencia bancaria SPEI y MercadoPago. Para plan Empresa también aceptamos pago por factura con crédito a 30 días.' },
  { question: '¿Hay costos adicionales por uso?', answer: 'No. El precio del plan cubre todo lo incluido en él. El único costo adicional posible es la comisión de tu pasarela de pagos (Stripe o MercadoPago) sobre las ventas que proceses — esto lo cobran ellos directamente, no nosotros.' },
];

const FALLBACK_PRICING_PLANS: PricingPlanView[] = [
  {
    id: 'starter',
    name: 'Basico',
    priceMonthMxn: 349,
    priceYearMxn: 3350,
    maxWebsites: 1,
    maxVisits: 15000,
    hasEcommerce: false,
    hasExport: false,
    features: [
      '1 sitio publicado',
      'Editor visual completo',
      'SSL y hosting administrado',
      'Soporte por email y WhatsApp',
    ],
    isAvailableMonth: Boolean(process.env.STRIPE_PRICE_STARTER_MONTH),
    isAvailableYear: Boolean(process.env.STRIPE_PRICE_STARTER_YEAR),
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthMxn: 699,
    priceYearMxn: 6710,
    maxWebsites: 3,
    maxVisits: 75000,
    hasEcommerce: true,
    hasExport: true,
    features: [
      'Hasta 3 sitios',
      'CMS editable por colecciones',
      'Tienda online integrada',
      'Exportacion de codigo',
    ],
    isAvailableMonth: Boolean(process.env.STRIPE_PRICE_PRO_MONTH),
    isAvailableYear: Boolean(process.env.STRIPE_PRICE_PRO_YEAR),
  },
  {
    id: 'commerce',
    name: 'Empresa',
    priceMonthMxn: 1399,
    priceYearMxn: 13430,
    maxWebsites: 9999,
    maxVisits: 500000,
    hasEcommerce: true,
    hasExport: true,
    features: [
      'Sitios ilimitados',
      'Billing y operaciones avanzadas',
      'Webhooks y automatizaciones',
      'Soporte prioritario',
    ],
    isAvailableMonth: Boolean(process.env.STRIPE_PRICE_COMMERCE_MONTH),
    isAvailableYear: Boolean(process.env.STRIPE_PRICE_COMMERCE_YEAR),
  },
];

async function getPricingPlans(): Promise<PricingPlanView[]> {
  try {
    const plans = await editorPrisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthMxn: 'asc' },
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      priceMonthMxn: plan.priceMonthMxn,
      priceYearMxn: plan.priceYearMxn,
      maxWebsites: plan.maxWebsites,
      maxVisits: plan.maxVisits,
      hasEcommerce: plan.hasEcommerce,
      hasExport: plan.hasExport,
      features: Array.isArray(plan.features)
        ? plan.features.filter((feature): feature is string => typeof feature === 'string')
        : [],
      isAvailableMonth: Boolean(
        plan.stripePriceIdMonth || process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_MONTH`]
      ),
      isAvailableYear: Boolean(
        plan.stripePriceIdYear || process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_YEAR`]
      ),
    }));
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

export default async function PreciosPage() {
  let session = null;
  try {
    session = await getAuthSession();
  } catch (error) {
    serverWarn('[precios] Auth session unavailable, rendering pricing without current plan context', error);
  }
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
              <span className="text-sm font-medium text-orvenix-secondary">Precios claros y transparentes</span>
            </div>
            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Planes simples,<br />sin sorpresas
            </h1>
            <p className="text-base leading-relaxed mb-6 text-orvenix-secondary">
              Paga mensual o anual y ahorra 20%. Sin permanencia forzada, sin costos ocultos.
              Cancela cuando quieras — tu data siempre es tuya.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="mk-urgency-pill">
                <span className="mk-live-dot" aria-hidden="true" />
                <strong>18</strong> personas viendo estos planes ahora
              </span>
              <span className="mk-urgency-pill mk-urgency-pill-red">
                🔥 Solo <strong>3</strong> cupos para activación inmediata
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
            title="Orvenix vs. las alternativas"
            description="Una comparación directa para que puedas decidir con información completa."
            center
          />
          <div className="mt-10 overflow-x-auto">
            <table className="mk-cmp-table" aria-label="Comparación Orvenix vs alternativas">
              <thead>
                <tr>
                  <th scope="col">Característica</th>
                  <th scope="col" className="highlight">Orvenix Pro</th>
                  <th scope="col">Wix / Squarespace</th>
                  <th scope="col">Contratar agencia</th>
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
                subtitle: "Desde $349 MXN/mes",
                badge: "Sin pago inicial",
                badgeColor: "bg-[rgba(0,131,179,0.10)] text-[color:var(--accent-3)] border-[rgba(0,131,179,0.22)]",
                desc: "Paga mes a mes y ten acceso completo a la plataforma: panel privado, editor visual, templates, publicación y soporte. Cancela cuando quieras.",
                pros: ["Sin pago inicial grande", "Actualizaciones automáticas", "Soporte incluido", "Cancela sin penalidad"],
                cta: "Ver planes →",
                href: "#planes",
                primary: false,
              },
              {
                icon: "💎",
                title: "Compra o renta un sitio",
                subtitle: "Desde $1,199 MXN/mes",
                badge: "Pago único disponible",
                badgeColor: "bg-[rgba(0,181,246,0.10)] text-[color:var(--accent)] border-[color:var(--glass-border-hover)]",
                desc: "Elige un template específico por industria, paga una vez (tuyo para siempre) o renta mensualmente a precio fijo. Sin plataforma, solo tu sitio.",
                pros: ["Precio fijo sin sorpresas", "Compra única = tuyo para siempre", "Templates por industria", "Editable sin código"],
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
        buttonLabel="Elegir mi plan →"
        buttonHref="/precios#planes"
      />
    </MarketingLayout>
  );
}
