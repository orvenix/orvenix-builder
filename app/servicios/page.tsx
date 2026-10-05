import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { officialPlanComparison2026 } from '@/lib/orvenix-official-2026';

export const metadata: Metadata = {
  title: 'Características — Orvenix',
  description: 'Diseños Orvenix: sitios profesionales multipágina con editor, hosting, SSL y dominio propio con asistencia de Orvenix. Desde 15 USD/mes + IVA.',
  openGraph: {
    url: 'https://orvenix.com.mx/servicios/',
    title: 'Características — Orvenix',
    description: 'Elige un Diseño Orvenix, edita tu sitio y publícalo con hosting, SSL y dominio propio con asistencia de Orvenix.',
    images: ['/img/logo-main.png'],
  },
};

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start text-sm leading-relaxed text-orvenix-secondary">
      <Check className="mk-accent-text h-5 w-5 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

function GlassCard({
  icon,
  title,
  children,
}: {
  icon: React.ElementType | string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mk-glass-card p-8">
      {typeof icon === "string" ? (
        <div className="mb-4 text-4xl">{icon}</div>
      ) : (
        (() => {
          const Icon = icon;
          return <Icon className="h-10 w-10 mb-4 mk-accent-text" />;
        })()
      )}
      <h4 className="font-bold text-base mb-3 text-orvenix-text">{title}</h4>
      {children}
    </div>
  );
}

const heroHighlights = [
  { value: '5', label: 'Diseños Orvenix por industria' },
  { value: 'Multipágina', label: 'tu sitio llega con todas las páginas del diseño' },
  { value: 'SSL', label: 'hosting y certificado incluidos' },
];

const overviewCards = [
  {
    title: 'Diseños profesionales',
    desc: 'Elige un Diseño Orvenix por industria, mira su demo completa y crea tu sitio con todas sus páginas.',
    tags: ['Express', 'Profesional', 'Signature'],
  },
  {
    title: 'Editor y publicación',
    desc: 'Cambia textos e imágenes sin tocar código, guarda tus cambios y publica cuando quieras.',
    tags: ['Editor', 'Multipágina', 'Publicación'],
  },
  {
    title: 'Hosting, SSL y dominio',
    desc: 'Tu sitio queda alojado en Orvenix con SSL. Conecta tu dominio con asistencia de Orvenix.',
    tags: ['Hosting', 'SSL', 'Dominio propio'],
  },
];

// The per-plan rows come from the same official comparison /precios shows.
const PLAN_ROWS = ['Numero de sitios web', 'Paginas internas', 'Editor visual', 'Orvenix IA', 'Infraestructura', 'Soporte'];
const comparisonRows = officialPlanComparison2026
  .filter(([feature]) => PLAN_ROWS.includes(feature))
  .map(([feature, basico, pro, empresa]) => ({ feature, basico, pro, empresa }));

export default function ServiciosPage() {
  return (
    <MarketingLayout>

      {/* Hero */}
      <section className="mk-hero bg-orvenix-bg" aria-label="Características de la Plataforma">
        <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
        <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />
        <div className="mk-container relative">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="mk-eyebrow-dot" aria-hidden="true" />
              <span className="text-sm font-medium text-orvenix-secondary">Diseños Orvenix</span>
            </div>
            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Tu sitio profesional,<br />listo para editar y publicar
            </h1>
            <p className="text-base leading-relaxed mb-8 text-orvenix-secondary">
              Sin conocimientos técnicos. Eliges un Diseño Orvenix, escribes los datos de tu negocio
              y tu sitio se crea con todas sus páginas. Lo editas y lo publicas cuando quieras.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/precios" className="mk-btn-primary">Ver planes desde 15 USD ↗</Link>
              <Link href="/templates" className="mk-btn-outline">Ver Diseños Orvenix</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-10">
              {heroHighlights.map((item) => (
                <div key={item.label} className="mk-glass-card p-4">
                  <div className="text-xl font-extrabold mk-accent-text mb-1">{item.value}</div>
                  <p className="text-xs leading-relaxed text-orvenix-secondary">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-12">
        <div className="mk-container">
          <SectionHeader
            tag="Resumen rápido"
            title="Lo esencial, incluido desde el inicio"
            description="Esto es lo que incluye hoy tu sitio con Orvenix."
          />
          <div className="mt-10 grid lg:grid-cols-3 gap-5">
            {overviewCards.map((card) => (
              <article key={card.title} className="mk-glass-card p-6">
                <h3 className="text-lg font-bold text-orvenix-text mb-3">{card.title}</h3>
                <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">{card.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="mk-feature-tag">{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 01 — Panel privado */}
      <section id="panel" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Característica 01" title="Tu panel" description="Desde tu panel abres tus sitios, ves sus visitas y administras tu plan." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">¿Qué puedes hacer?</h3>
              <ul className="space-y-3">
                <CheckItem>Abrir y editar tus sitios</CheckItem>
                <CheckItem>Ver las visitas de tu sitio publicado</CheckItem>
                <CheckItem>Administrar tu plan y tu facturación</CheckItem>
                <CheckItem>Solicitar ajustes a nuestro equipo</CheckItem>
              </ul>
            </div>
            <GlassCard icon="🖥️" title="Incluido desde el plan Starter">
              <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">
                Tu panel está activo desde el momento en que activas tu cuenta.
                Sin configuraciones complejas, sin instalaciones.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Tus sitios', 'Visitas', 'Facturación'].map((t) => (
                  <span key={t} className="mk-feature-tag">{t}</span>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Feature 02 — Sitio web */}
      <section id="sitio" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader tag="Característica 02" title="Sitio web con dominio propio" description="Tu presencia digital profesional incluida: conecta tu dominio con asistencia de Orvenix, con diseño de marca y páginas listas para recibir clientes desde el día uno." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <GlassCard icon="🌐" title="Tu marca en línea">
              <ul className="space-y-2 text-sm text-orvenix-secondary">
                {['Conecta tu dominio con asistencia de Orvenix', 'SSL gratuito y renovación automática', 'Páginas según el Diseño Orvenix que elijas', 'Diseño adaptado a tu marca y colores', 'Optimizado para Google (SEO básico incluido)'].map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </GlassCard>
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Sin complicaciones técnicas</h3>
              <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">
                No necesitas contratar hosting por separado, configurar servidores ni instalar WordPress.
                Tu sitio está alojado en nuestra infraestructura, con SSL y backups diarios.
              </p>
              <p className="text-sm leading-relaxed text-orvenix-secondary">
                Edita textos, sube imágenes y actualiza tu contenido desde el panel — sin tocar una sola línea de código.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 03 — Editor */}
      <section id="editor" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Característica 03" title="Editor y datos de tu negocio" description="Ajusta tu sitio sin tocar código y mantén tus datos al día en todas las páginas." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Edita a tu ritmo</h3>
              <ul className="space-y-3">
                <CheckItem>Cambia textos e imágenes de cada página</CheckItem>
                <CheckItem>Nombre, teléfono, WhatsApp, horario y redes se actualizan en todas las páginas desde un solo lugar</CheckItem>
                <CheckItem>Guarda tus cambios y publica cuando quieras</CheckItem>
              </ul>
            </div>
            <GlassCard icon="✏️" title="Incluido en todos los planes">
              <p className="text-sm leading-relaxed text-orvenix-secondary">
                El editor trabaja sobre el mismo diseño que viste en la demo: lo que editas es lo que se publica.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Feature 04 — Visitas y soporte */}
      <section id="soporte" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader tag="Característica 04" title="Visitas y soporte" description="Sigue cómo responde tu sitio y apóyate en nuestro equipo cuando lo necesites." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <ul className="space-y-3">
                <CheckItem>Consulta las visitas de tu sitio publicado desde tu panel</CheckItem>
                <CheckItem>Solicita ajustes a nuestro equipo desde tu panel</CheckItem>
                <CheckItem>Soporte incluido desde el primer día</CheckItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparacion" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Resumen" title="¿Qué incluye cada plan?" description="Todas las características, distribuidas según el plan que elijas." center />
          <p className="text-center text-sm leading-relaxed text-orvenix-secondary max-w-2xl mx-auto mt-4">
            Si hoy necesitas presencia institucional administrada, Starter cubre lo esencial. Si ya vendes o atiendes clientes con frecuencia,
            Pro suele ser el mejor punto de equilibrio entre operación, imagen y crecimiento.
          </p>
          <div className="mt-10 overflow-x-auto">
            <table className="mk-cmp-table">
              <thead>
                <tr>
                  <th scope="col">Característica</th>
                  <th scope="col">Starter<br /><span className="mk-accent-text font-normal normal-case">15 USD/mes</span></th>
                  <th scope="col" className="highlight">Pro<br /><span className="font-normal normal-case">39 USD/mes</span></th>
                  <th scope="col">Business<br /><span className="mk-accent-text font-normal normal-case">79 USD/mes</span></th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r) => (
                  <tr key={r.feature}>
                    <td>{r.feature}</td>
                    <td>{r.basico}</td>
                    <td className="highlight">{r.pro}</td>
                    <td>{r.empresa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/precios" className="mk-btn-primary">Ver planes y precios →</Link>
            <Link href="/contacto" className="mk-btn-outline">Hablar con un asesor</Link>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para crear tu sitio?"
        description="Planes oficiales en USD + IVA. Elige tu Diseño Orvenix y publica cuando quieras."
        buttonLabel="Ver planes desde 15 USD →"
        buttonHref="/precios"
      />
    </MarketingLayout>
  );
}
