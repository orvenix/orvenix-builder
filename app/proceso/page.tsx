import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Nuestro Proceso — Orvenix',
  description: 'Cómo llevamos tu idea al éxito con metodología ágil probada.',
};

const steps = [
  {
    num: '01',
    title: 'Descubrimiento & Estrategia',
    desc: 'Análisis de tu negocio, competencia y objetivos. Definimos el alcance, tecnologías y roadmap del proyecto para garantizar que cada decisión esté alineada con tus metas.',
    icon: '🔍',
  },
  {
    num: '02',
    title: 'Diseño de Experiencia (UI/UX)',
    desc: 'Wireframes, prototipos y diseño visual. Iteramos hasta que la experiencia sea perfecta antes de escribir código. Tu aprobación es el paso más importante.',
    icon: '🎨',
  },
  {
    num: '03',
    title: 'Desarrollo Ágil',
    desc: 'Sprints de 2 semanas con entregas parciales. Feedback continuo y ajustes en tiempo real durante todo el proceso. Siempre sabrás en qué estamos trabajando.',
    icon: '⚙️',
  },
  {
    num: '04',
    title: 'QA, Lanzamiento & Soporte',
    desc: 'Testing exhaustivo en múltiples dispositivos, despliegue y soporte post-lanzamiento incluido. Tu proyecto no termina en el lanzamiento, apenas comienza.',
    icon: '🚀',
  },
];

const guarantees = [
  {
    icon: '📦',
    title: 'Código Limpio',
    desc: 'Código mantenible, documentado y siguiendo las mejores prácticas de la industria para que cualquier developer pueda continuarlo.',
  },
  {
    icon: '⚡',
    title: 'Velocidad Extrema',
    desc: 'Tiempo de carga menor a 2 segundos y puntuación de 90+ en Lighthouse. La velocidad es una característica, no una opción.',
  },
  {
    icon: '🔒',
    title: 'Seguridad Primero',
    desc: 'SSL, WAF, backups automáticos y prácticas de seguridad desde el día uno. Tu plataforma y la de tus usuarios siempre protegidas.',
  },
];

export default function ProcesoPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Metodología ágil probada
          </p>
          <h1 className="mk-hero-title">
            Cómo llevamos tu idea{' '}
            <span className="mk-gradient-text">al éxito</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Un proceso claro, transparente y orientado a resultados. Sin sorpresas, sin bloqueos, sin retrasos.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="El proceso"
            title={<>4 pasos hacia el <em className="not-italic mk-accent-text">éxito</em></>}
            description="Cada fase del proyecto tiene entregables claros y tu aprobación explícita antes de avanzar."
            center
          />
          <div className="mt-12 space-y-6">
            {steps.map((step, i) => (
              <div key={step.num} className={`mk-glass-card p-8 flex flex-col md:flex-row gap-6 items-start ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="shrink-0 flex flex-col items-center md:items-start gap-3">
                  <span className="text-5xl">{step.icon}</span>
                  <span className="text-4xl font-black mk-gradient-text">{step.num}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-orvenix-text mb-3">{step.title}</h3>
                  <p className="text-orvenix-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality guarantees */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Garantías de calidad"
            title={<>Lo que <em className="not-italic mk-accent-text">garantizamos</em> siempre</>}
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {guarantees.map((g) => (
              <div key={g.title} className="mk-glass-card p-6 text-center">
                <div className="text-4xl mb-4">{g.icon}</div>
                <h3 className="font-bold text-orvenix-text mb-2">{g.title}</h3>
                <p className="text-sm text-orvenix-secondary leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline callout */}
      <section className="mk-section">
        <div className="mk-container">
          <div className="mk-guarantee-banner flex flex-col md:flex-row items-center gap-6 p-8">
            <span className="text-4xl shrink-0">📅</span>
            <div>
              <h3 className="text-lg font-bold text-orvenix-text mb-1">Tiempos de entrega realistas</h3>
              <p className="text-orvenix-secondary">
                La mayoría de proyectos se completan en <strong className="text-orvenix-text">3 a 8 semanas</strong> según complejidad. Te damos un cronograma detallado desde el primer día y lo cumplimos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para iniciar tu proyecto?"
        description="Cuéntanos tu idea y en 24 horas tendrás una propuesta detallada."
        buttonLabel="Iniciar ahora →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
