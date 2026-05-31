import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Portafolio de Proyectos — Orvenix',
  description: 'Casos de éxito que transforman negocios. Más de 150 proyectos completados.',
};

const stats = [
  { value: '150+', label: 'Proyectos' },
  { value: '45+', label: 'Clientes' },
  { value: '10+', label: 'Años' },
  { value: '98%', label: 'Satisfacción' },
];

const projects = [
  {
    name: 'Modavida Store',
    type: 'E-Commerce',
    tech: 'React + Shopify',
    result: '+340% en ventas en 6 meses',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80&auto=format&fit=crop',
  },
  {
    name: 'DataPulse Dashboard',
    type: 'SaaS Platform',
    tech: 'React + Node.js + PostgreSQL',
    result: '12,000 usuarios activos',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop',
  },
  {
    name: 'GrandHotel Resort',
    type: 'Web Corporativa',
    tech: 'Next.js + Contentful',
    result: '+180% en reservas online',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop',
  },
  {
    name: 'FitTrack Pro',
    type: 'App Móvil',
    tech: 'React Native + Firebase',
    result: '50,000 descargas en 3 meses',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop',
  },
];

const demos = [
  { name: 'AI Dashboard', href: '#', desc: 'Panel de inteligencia artificial con métricas en tiempo real.' },
  { name: 'CRM Platform', href: '#', desc: 'Gestión de clientes, pipeline de ventas y automatizaciones.' },
  { name: 'E-Commerce', href: '#', desc: 'Tienda online con carrito, pagos y panel de pedidos.' },
];

export default function PortafolioPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Portafolio
          </p>
          <h1 className="mk-hero-title">
            Casos de éxito que{' '}
            <span className="mk-gradient-text">transforman negocios</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            150+ proyectos completados para clientes en México, Latinoamérica y España.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 mk-section-alt">
        <div className="mk-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-black mk-gradient-text mb-2">{s.value}</div>
                <div className="text-sm text-orvenix-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Proyectos destacados"
            title={<>Resultados <em className="not-italic mk-accent-text">reales</em></>}
            description="Cada proyecto es una historia de crecimiento. Aquí algunos de los más destacados."
            center
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {projects.map((p) => (
              <div key={p.name} className="mk-glass-card overflow-hidden group">
                <div className="relative aspect-4/3 overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-orvenix-bg/40" />
                  <span className="mk-feature-tag absolute top-4 left-4">{p.type}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-orvenix-text mb-1">{p.name}</h3>
                  <p className="text-sm text-orvenix-muted mb-3">{p.tech}</p>
                  <div className="mk-guarantee-banner py-2 px-4 text-sm font-semibold">
                    {p.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo templates */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Demos en vivo"
            title={<>Plataformas y <em className="not-italic mk-accent-text">demos</em></>}
            description="Explora nuestras demos interactivas y descubre lo que podemos construir para tu negocio."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {demos.map((d) => (
              <Link key={d.name} href={d.href} className="mk-glass-card p-6 block hover:border-orvenix-accent transition-colors">
                <h3 className="font-bold text-orvenix-text mb-2">{d.name}</h3>
                <p className="text-sm text-orvenix-secondary mb-4">{d.desc}</p>
                <span className="mk-accent-text text-sm font-semibold">Ver demo →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="Tu proyecto podría ser el siguiente"
        description="Cuéntanos tu idea y la convertimos en un caso de éxito."
        buttonLabel="Empezar mi proyecto →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
