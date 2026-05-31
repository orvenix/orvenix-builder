import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Blog de Desarrollo Web y SEO — Orvenix',
  description:
    'Guías, tendencias y consejos de expertos sobre desarrollo web, SEO, e-commerce y transformación digital en México y LATAM.',
  openGraph: {
    url: 'https://orvenix.com.mx/blog/',
    title: 'Blog de Desarrollo Web y SEO — Orvenix',
    description:
      'Guías, tendencias y consejos de expertos sobre desarrollo web, SEO, e-commerce y transformación digital en México.',
    images: ['/img/logo-main.png'],
  },
};

const stats = [
  { value: '24+', label: 'Guías publicadas' },
  { value: '8', label: 'Temas activos' },
  { value: '3x', label: 'Enfoque en crecimiento' },
  { value: 'LATAM', label: 'Perspectiva regional' },
];

const categories = ['SEO', 'E-commerce', 'SaaS', 'UX', 'Conversión', 'Automatización'];

const posts = [
  {
    title: 'Desarrollo web en México: el momento de escalar ya empezó',
    description:
      'Panorama actual del ecosistema digital en México, qué tecnologías están empujando el crecimiento y cómo decidir una base técnica que no se quede corta.',
    href: '/blog-desarrollo-web-mexico',
    category: 'Tendencias',
    readTime: '8 min',
  },
  {
    title: 'Cómo estructurar una landing que convierta visitas en reuniones',
    description:
      'Mensajes, prueba social y arquitectura visual para negocios que necesitan vender servicios de alto valor sin depender de tráfico masivo.',
    href: '/contacto',
    category: 'Conversión',
    readTime: '6 min',
  },
  {
    title: 'SEO técnico para sitios SaaS pequeños',
    description:
      'Un checklist práctico para mejorar indexación, Core Web Vitals y claridad semántica desde una base moderna en App Router.',
    href: '/seguridad',
    category: 'SEO',
    readTime: '7 min',
  },
];

export default function BlogPage() {
  return (
    <MarketingLayout>
      <section className="mk-hero min-h-[52vh] flex flex-col justify-center">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10">
          <div className="max-w-3xl">
            <p className="mk-section-tag mb-4">
              <span className="mk-eyebrow-dot" />
              Ideas para crecer mejor
            </p>
            <h1 className="mk-hero-title">
              Blog de <span className="mk-gradient-text">desarrollo web y SEO</span>
            </h1>
            <p className="mk-section-desc mt-6 max-w-2xl">
              Publicamos guías tácticas para negocios que quieren vender más, lanzar más rápido
              y construir una presencia digital con bases sólidas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {categories.map((category) => (
                <span key={category} className="mk-feature-tag">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-12">
        <div className="mk-container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-black mk-gradient-text">{stat.value}</div>
                <div className="text-sm text-orvenix-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Destacado"
            title="Lectura recomendada de esta semana"
            description="Un punto de entrada claro para equipos que están evaluando rediseño, performance o migración a una plataforma más moderna."
          />
          <div className="mk-glass-card mt-10 overflow-hidden p-8">
            <div className="mb-4 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Artículo principal
            </div>
            <h2 className="text-3xl font-black text-orvenix-text">
              El impacto del desarrollo web en México en la economía digital global
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-orvenix-secondary">
              Analizamos por qué México se volvió un punto estratégico para productos web,
              e-commerce y software a medida, y qué implica eso para marcas que quieren crecer
              con una base técnica premium.
            </p>
            <div className="mt-6">
              <Link href="/blog-desarrollo-web-mexico" className="mk-btn-primary">
                Leer artículo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Más lecturas"
            title="Notas y guías del ecosistema Orvenix"
            description="Contenido orientado a decisión comercial, claridad técnica y experiencia digital."
            center
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <article key={post.title} className="mk-glass-card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="mk-feature-tag">{post.category}</span>
                  <span className="text-xs uppercase tracking-[0.18em] text-orvenix-secondary">
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-orvenix-text">{post.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-orvenix-secondary">
                  {post.description}
                </p>
                <div className="mt-6">
                  <Link href={post.href} className="mk-accent-text text-sm font-semibold">
                    Explorar →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres que escribamos la estrategia para tu sitio?"
        description="Podemos convertir tus objetivos comerciales en una experiencia digital lista para posicionar, captar y vender."
        buttonLabel="Hablar con Orvenix →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
