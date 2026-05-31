import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Novedades — Orvenix',
  description:
    'Cambios recientes, mejoras de plataforma y avances del ecosistema Orvenix.',
};

const releases = [
  {
    date: 'Mayo 2026',
    title: 'Páginas completas para plataforma',
    description:
      'Se agregaron páginas dedicadas para dashboard, plantillas y servicios profesionales, evitando flujos vacíos o dependientes del constructor privado.',
    items: [
      'Nueva página de Dashboard con módulos, flujo y acceso a demo.',
      'Nueva biblioteca de Plantillas con categorías por industria.',
      'Nueva página de Servicios para explicar entregables y configuración.',
    ],
  },
  {
    date: 'Abril 2026',
    title: 'Secciones de confianza y soporte',
    description:
      'Se reforzaron las páginas de seguridad, integraciones, estado del sistema y programa de afiliados para dar más contexto comercial.',
    items: [
      'Mensajes más claros para visitantes que comparan planes.',
      'Footer unificado con accesos a legal, contacto y plataforma.',
      'Mejor estructura SEO en páginas informativas.',
    ],
  },
  {
    date: 'Marzo 2026',
    title: 'Base comercial de Orvenix',
    description:
      'Se consolidaron páginas principales para servicios, precios, proceso, portafolio y contacto.',
    items: [
      'Planes de plataforma con comparativa de beneficios.',
      'Contenido para explicar el proceso de activación.',
      'Casos y demos para mostrar usos reales por industria.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <MarketingLayout>
      <section className="mk-hero min-h-[38vh] flex flex-col justify-center">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10">
          <div className="max-w-3xl">
            <p className="mk-section-tag mb-4">
              <span className="mk-eyebrow-dot" />
              Novedades
            </p>
            <h1 className="mk-hero-title">Mejoras recientes de Orvenix</h1>
            <p className="mk-section-desc mt-6 max-w-2xl">
              Este registro resume cambios relevantes en la plataforma, plantillas, contenido
              público y mejoras de estabilidad del ecosistema.
            </p>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container max-w-5xl">
          <div className="space-y-6">
            {releases.map((release) => (
              <article
                key={release.date}
                className="grid gap-5 border-b border-white/8 py-8 md:grid-cols-[180px_minmax(0,1fr)]"
              >
                <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                  {release.date}
                </div>
                <div className="mk-glass-card p-6">
                  <h2 className="text-2xl font-bold text-orvenix-text">{release.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-orvenix-secondary">
                    {release.description}
                  </p>
                  <ul className="mt-5 space-y-2 text-sm leading-7 text-orvenix-secondary">
                    {release.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres seguir de cerca la evolución de Orvenix?"
        description="Podemos mostrarte el roadmap y las mejoras que más impactan a tu operación."
        buttonLabel="Hablar con el equipo →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
