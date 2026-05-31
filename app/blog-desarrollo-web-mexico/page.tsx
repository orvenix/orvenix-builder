import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Desarrollo Web en México: Guía Estratégica — Orvenix',
  description:
    'Descubre por qué el desarrollo web en México está liderando la transformación digital en LATAM y qué tecnologías están marcando la diferencia.',
  openGraph: {
    url: 'https://orvenix.com.mx/blog-desarrollo-web-mexico/',
    title: 'El auge del desarrollo web en México',
    description:
      'Exploramos las tendencias tecnológicas y por qué México es un hub clave para el desarrollo premium.',
    images: ['/img/logo-main.png'],
  },
};

const pillars = [
  {
    title: 'Proximidad y alineación',
    description:
      'La cercanía operativa con Norteamérica permite procesos ágiles, comunicación sin desfase y feedback continuo durante diseño y desarrollo.',
  },
  {
    title: 'Ecosistema e-commerce',
    description:
      'El crecimiento del pago digital obliga a construir experiencias rápidas, seguras y listas para integrarse con operaciones reales.',
  },
];

const stack = [
  'Next.js para Core Web Vitals',
  'React para interfaces dinámicas',
  'Arquitectura cloud para escalar con orden',
  'SEO técnico desde el inicio',
];

export default function BlogMexicoPage() {
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Desarrollo Web en México: El Futuro de la Transformación Digital',
    image: '/img/logo-main.png',
    author: { '@type': 'Organization', name: 'Orvenix' },
    publisher: {
      '@type': 'Organization',
      name: 'Orvenix',
      logo: { '@type': 'ImageObject', url: '/img/logo-main.png' },
    },
    datePublished: '2024-05-25',
    description:
      'Análisis sobre el ecosistema de desarrollo web en México y su impacto en la transformación digital regional.',
  };

  return (
    <MarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <section className="mk-hero min-h-[46vh] flex flex-col justify-center">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10">
          <div className="max-w-3xl">
            <p className="mk-section-tag mb-4">
              <span className="mk-eyebrow-dot" />
              Estrategia digital en México
            </p>
            <h1 className="mk-hero-title">
              El impacto del <span className="mk-gradient-text">desarrollo web en México</span>
            </h1>
            <p className="mt-6 max-w-2xl border-l-2 border-cyan-300/40 pl-4 text-base leading-relaxed text-orvenix-secondary">
              Cómo las empresas mexicanas están redefiniendo el estándar de calidad en software,
              diseño UI/UX y ejecución comercial para toda la región.
            </p>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <article className="mk-container max-w-4xl">
          <div className="mx-auto max-w-3xl space-y-8 text-orvenix-secondary">
            <p className="text-lg leading-8">
              En la era de la inmediatez, el <strong className="text-orvenix-text">desarrollo web en México</strong>{' '}
              dejó de ser una opción táctica para convertirse en una ventaja competitiva. Startups,
              despachos, clínicas, tiendas y equipos SaaS están usando una mejor base técnica para
              capturar demanda, automatizar procesos y operar con más claridad.
            </p>

            <div>
              <h2 className="mb-4 text-3xl font-bold text-orvenix-text">
                Ventajas reales de construir desde México
              </h2>
              <p className="leading-8">
                No se trata solo de costos. La combinación de talento, cercanía horaria,
                comprensión del mercado regional y adopción de stacks modernos hace que México sea
                especialmente competitivo para productos digitales que necesitan crecer sin
                improvisación.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="mk-glass-card p-6">
                  <h3 className="mb-3 text-xl font-bold text-orvenix-text">{pillar.title}</h3>
                  <p className="text-sm leading-7 text-orvenix-secondary">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="mb-4 text-3xl font-bold text-orvenix-text">
                Tecnologías que hoy dominan el mercado
              </h2>
              <p className="leading-8">
                Las marcas que destacan no lo hacen solo por diseño. Lo logran porque combinan SEO,
                rendimiento, claridad visual y una arquitectura preparada para evolucionar.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {stack.map((item) => (
                  <span key={item} className="mk-feature-tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mk-glass-card rounded-[24px] border border-cyan-300/20 bg-gradient-to-br from-white/[0.08] to-cyan-400/[0.04] p-8 text-center">
              <h2 className="text-3xl font-bold text-orvenix-text">
                ¿Listo para escalar tu negocio en México?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-orvenix-secondary">
                Si tu empresa necesita una experiencia digital más rápida, más clara y mejor
                conectada con ventas, podemos ayudarte a definir el siguiente paso.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link href="/contacto" className="mk-btn-primary">
                  Hablar con un especialista →
                </Link>
                <Link href="/blog" className="mk-btn-outline">
                  Volver al blog
                </Link>
              </div>
            </div>
          </div>
        </article>
      </section>

      <CtaSection
        title="Tu sitio puede convertirse en una ventaja competitiva"
        description="Diseñamos y construimos plataformas pensadas para posicionar, convertir y soportar crecimiento real."
        buttonLabel="Solicitar propuesta →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
