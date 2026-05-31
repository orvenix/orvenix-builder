import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Plataforma Orvenix | Sitio web y panel en un solo lugar',
  description: 'Plataforma Orvenix: sitio web, panel privado, editor visual, plantillas y publicación en un solo sistema.',
  openGraph: {
    url: 'https://orvenix.com.mx/plataforma/',
    title: 'Plataforma Orvenix | Sitio web y panel en un solo lugar',
    images: ['/img/logo-main.png'],
  },
};

const quickCards = [
  { icon: '📊', title: 'Dashboard', desc: 'Gestiona tus sitios, publicaciones y borradores desde un panel centralizado.', href: '/dashboard', tags: ['Panel', 'Sitios', 'Borradores'] },
  { icon: '🎨', title: 'Plantillas', desc: 'Diseños base listos para personalizar y lanzar sin partir desde cero.', href: '/templates', tags: ['Diseño', 'Editor', '1 clic'] },
  { icon: '🚀', title: 'Demos SaaS', desc: 'Verticales de industria listos: CRM, finanzas, ecommerce, HR y DevOps.', href: '/webs', tags: ['CRM', 'Ecommerce', 'HR'] },
  { icon: '✨', title: 'Servicio profesional', desc: 'El equipo Orvenix adapta y configura toda la plataforma por ti.', href: '/contacto', tags: ['Setup', 'Soporte', 'A medida'] },
];

const plans = [
  {
    name: 'Básico',
    price: '$349',
    period: 'MXN/mes',
    desc: 'Sitio profesional, acceso al panel y configuración inicial para negocios que están empezando.',
    cta: 'Empezar',
    ctaHref: '/register',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$699',
    period: 'MXN/mes',
    desc: 'Editor visual, plantillas, publicación y mejoras para equipos que necesitan crecer con ritmo.',
    cta: 'Crear cuenta',
    ctaHref: '/register',
    featured: true,
  },
  {
    name: 'Empresa',
    price: '$1,399',
    period: 'MXN/mes',
    desc: 'Acompañamiento, personalización y soporte para operaciones con más usuarios o flujos internos.',
    cta: 'Cotizar',
    ctaHref: '/contacto',
    featured: false,
  },
];

const proofStats = [
  { value: '9', label: 'verticales SaaS listas para adaptar' },
  { value: '1 clic', label: 'para publicar tu sitio editable' },
  { value: '24h', label: 'para activar tu presencia digital' },
];

const modules = [
  { title: 'Editor visual', status: 'Activo', pct: 86 },
  { title: 'Plantillas profesionales', status: 'Listas', pct: 72 },
  { title: 'Panel privado', status: 'Seguro', pct: 94 },
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
            <span className="mk-promo-badge mb-5 inline-flex">Plataforma integrada</span>

            <h1
              className="font-extrabold leading-[0.96] mb-5 text-orvenix-text"
              style={{ fontSize: 'clamp(2.45rem, 7vw, 5.5rem)', letterSpacing: '-0.04em' }}
            >
              Tu sitio y tu panel{' '}
              <em className="not-italic mk-accent-text">en un solo sistema</em>
            </h1>

            <p className="text-lg leading-relaxed mb-8 text-orvenix-secondary max-w-xl">
              Entra desde orvenix.com.mx, crea tu cuenta, edita plantillas, publica sitios y gestiona tu presencia digital sin salir del ecosistema Orvenix.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link href="/register" className="mk-btn-primary">Crear cuenta</Link>
              <Link href="/login" className="mk-btn-outline">Entrar al panel</Link>
              <Link href="/webs" className="mk-btn-outline">Ver demos</Link>
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
              <span>orvenix / plataforma</span>
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
              title={<>Elige como activar<br /><em className="not-italic mk-accent-text">tu plataforma</em></>}
            />
            <p className="text-sm text-orvenix-secondary max-w-xs leading-relaxed">
              Los planes conectan el sitio público con el panel privado y el editor. Puedes iniciar por tu cuenta o pedir acompañamiento del equipo Orvenix.
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
            Todos los precios en MXN · IVA no incluido · Cancela en cualquier momento
          </p>
        </div>
      </section>

      <CtaSection
        title="¿Listo para activar tu plataforma?"
        description="El equipo Orvenix la configura por ti en menos de 24 horas. Sin complicaciones."
        buttonLabel="Crear cuenta →"
        buttonHref="/register"
      />

    </MarketingLayout>
  );
}
