import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Plataforma Orvenix | Suscríbete y publica tu sitio',
  description: 'Activa Orvenix, elige un plan y publica tu sitio con editor visual, hosting, panel privado y soporte incluido.',
  openGraph: {
    url: 'https://orvenix.com.mx/plataforma/',
    title: 'Plataforma Orvenix | Suscríbete y publica tu sitio',
    images: ['/img/logo-main.png'],
  },
};

const quickCards = [
  { icon: '📊', title: 'Dashboard', desc: 'Entra al panel, elige tu sitio y publica cambios sin depender de terceros.', href: '/precios?checkout=pro&interval=month', tags: ['Panel', 'Sitios', 'Borradores'] },
  { icon: '🎨', title: 'Plantillas', desc: 'Elige una base profesional y conviértela en tu sitio en minutos.', href: '/precios?checkout=starter&interval=month', tags: ['Diseño', 'Editor', '30 dias'] },
  { icon: '🚀', title: 'Demos SaaS', desc: 'Explora ejemplos reales y activa el plan que mejor encaja con tu negocio.', href: '/precios?checkout=pro&interval=month', tags: ['CRM', 'Ecommerce', 'HR'] },
  { icon: '✨', title: 'Servicio profesional', desc: 'Si quieres avanzar mas rapido, nuestro equipo te acompaña en la activacion.', href: '/precios?checkout=commerce&interval=month', tags: ['Setup', 'Soporte', 'A medida'] },
];

const plans = [
  {
    name: 'Starter',
    price: '15 USD',
    period: '/mes + IVA',
    desc: 'Para publicar tu primera web profesional con hosting, SSL, editor y soporte incluido.',
    cta: 'Suscribirme',
    ctaHref: '/precios?checkout=starter&interval=month',
    featured: false,
  },
  {
    name: 'Pro',
    price: '39 USD',
    period: '/mes + IVA',
    desc: 'La opcion recomendada para vender, usar IA, administrar varios sitios y crecer sin rehacer tu sistema.',
    cta: 'Activar Pro',
    ctaHref: '/precios?checkout=pro&interval=month',
    featured: true,
  },
  {
    name: 'Business',
    price: '79 USD',
    period: '/mes + IVA',
    desc: 'Para operar ventas, funnels, automatizaciones y eCommerce con una base mas robusta.',
    cta: 'Activar Business',
    ctaHref: '/precios?checkout=commerce&interval=month',
    featured: false,
  },
];

const proofStats = [
  { value: '3', label: 'planes claros para empezar hoy' },
  { value: '30 dias', label: 'para probar tu plan' },
  { value: 'Pago seguro', label: 'con Stripe y acceso inmediato' },
];

const modules = [
  { title: 'Constructor editable', status: 'Activo', pct: 86 },
  { title: 'Diseños listos', status: 'Listas', pct: 72 },
  { title: 'Panel incluido', status: 'Seguro', pct: 94 },
];

export default function PlataformaPage() {
  return (
    <MarketingLayout>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden flex items-center"
        style={{ minHeight: '100vh', paddingTop: '132px', paddingBottom: '72px' }}
      >
        <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
        <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />

        <div className="mk-container relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left */}
          <div>
            <span className="mk-promo-badge mb-5 inline-flex">Activa tu sitio hoy</span>

            <h1
              className="font-extrabold leading-[0.96] mb-5 text-orvenix-text"
              style={{ fontSize: 'clamp(2.45rem, 7vw, 5.5rem)', letterSpacing: '-0.04em' }}
            >
              Suscríbete, edita y publica{' '}
              <em className="not-italic mk-accent-text">sin complicarte</em>
            </h1>

            <p className="text-lg leading-relaxed mb-8 text-orvenix-secondary max-w-xl">
              Elige un plan, paga de forma segura y entra al constructor para lanzar una web profesional con panel, hosting y soporte incluidos.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/precios?checkout=pro&interval=month" className="mk-btn-primary">Activar Pro</Link>
              <Link href="/precios?checkout=starter&interval=month" className="mk-btn-outline">Ver Starter</Link>
              <Link href="/webs" className="mk-btn-outline">Ver ejemplos</Link>
            </div>

            {/* Proof stats */}
            <div className="grid grid-cols-3 gap-3 max-w-xl">
              {proofStats.map((s) => (
                <div key={s.label} className="mk-glass-card p-4">
                  <div className="text-xl font-extrabold text-orvenix-text mb-1">{s.value}</div>
                  <div className="text-xs text-orvenix-muted leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — console card */}
          <aside
            className="mk-code-card"
            aria-label="Vista previa del sistema Orvenix"
          >
            {/* Browser bar */}
            <div className="mk-code-bar">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-orvenix-accent-3" />
                <span className="w-2.5 h-2.5 rounded-full bg-orvenix-accent-2" />
                <span className="w-2.5 h-2.5 rounded-full bg-orvenix-accent" />
              </div>
              <span>orvenix / listo para publicar</span>
            </div>

            {/* Modules */}
            <div className="p-5 space-y-3">
              {modules.map((m) => (
                <div key={m.title} className="mk-glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-orvenix-text">{m.title}</span>
                    <span className="text-xs font-bold mk-accent-text uppercase tracking-wider">{m.status}</span>
                  </div>
                  <div className="h-2 rounded-full mk-progress-track overflow-hidden">
                    <div
                      className="h-full rounded-full mk-progress-bar"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Quick access cards ── */}
      <section className="mk-section-alt">
        <div className="mk-container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickCards.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="mk-glass-card p-6 block"
              >
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-base mb-2 text-orvenix-text">{c.title}</h3>
                <p className="text-sm leading-relaxed mb-4 text-orvenix-secondary">{c.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="mk-feature-tag">{t}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section id="planes" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <SectionHeader
              tag="Planes"
              title={<>Elige tu plan y<br /><em className="not-italic mk-accent-text">empieza hoy</em></>}
            />
            <p className="text-sm text-orvenix-secondary max-w-xs leading-relaxed">
              Pro es la ruta recomendada para negocios que quieren publicar, vender y escalar sin perder tiempo comparando demasiadas opciones.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <article
                key={p.name}
                className={`mk-glass-card p-7 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)] ${p.featured ? 'mk-plan-card-featured' : ''}`}
              >
                <strong className="mk-accent-text text-xs font-bold uppercase tracking-widest mb-3 block">
                  {p.name}
                </strong>
                <div className="text-3xl font-extrabold text-orvenix-text leading-none mb-1">
                  {p.price} <span className="text-sm font-semibold text-orvenix-muted">{p.period}</span>
                </div>
                <p className="text-sm text-orvenix-secondary leading-relaxed my-4 flex-1">{p.desc}</p>
                <Link
                  href={p.ctaHref}
                  className={p.featured ? 'mk-btn-primary text-center' : 'mk-btn-outline text-center'}
                >
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>

          <p className="text-center text-xs text-orvenix-muted mt-6">
            Pago seguro con Stripe · acceso inmediato · cancela desde tu panel
          </p>
        </div>
      </section>

      <CtaSection
        title="¿Listo para publicar con Orvenix?"
        description="Activa tu plan, entra al constructor y convierte una base profesional en tu propio sitio."
        buttonLabel="Activar Pro →"
        buttonHref="/precios?checkout=pro&interval=month"
      />

    </MarketingLayout>
  );
}
