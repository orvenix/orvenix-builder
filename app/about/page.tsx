import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Orvenix',
  description: 'Transformamos ideas en realidad digital',
};

const values = [
  { icon: '⭐', name: 'Excelencia', desc: 'Entregamos trabajo de la más alta calidad en cada proyecto, sin excepción.' },
  { icon: '🤝', name: 'Colaboración', desc: 'Trabajamos junto a nuestros clientes como socios, no como proveedores.' },
  { icon: '💡', name: 'Innovación', desc: 'Adoptamos las mejores tecnologías para ofrecer soluciones que perduran.' },
  { icon: '✅', name: 'Responsabilidad', desc: 'Cumplimos plazos, promesas y estándares de calidad en todo momento.' },
];

const stats = [
  { value: '150+', label: 'Proyectos completados' },
  { value: '45+', label: 'Clientes satisfechos' },
  { value: '10+', label: 'Años de experiencia' },
  { value: '98%', label: 'Tasa de satisfacción' },
];

const team = [
  { name: 'Carlos Mendez', role: 'CTO / Lead Developer', initials: 'CM' },
  { name: 'Marina Gutierrez', role: 'Design Director / UI·UX', initials: 'MG' },
  { name: 'Roberto Lopez', role: 'Project Manager / Dev', initials: 'RL' },
];

const timeline = [
  { year: '2015', title: 'Inicio', desc: 'Fundamos Orvenix con la misión de democratizar el acceso a soluciones digitales de alta calidad en Latinoamérica.' },
  { year: '2017', title: 'Crecimiento', desc: 'Superamos los 30 proyectos entregados y comenzamos a trabajar con clientes internacionales.' },
  { year: '2019', title: 'Expansión', desc: 'Ampliamos nuestro equipo y lanzamos nuestra plataforma SaaS para gestión de sitios web.' },
  { year: '2024', title: 'Presente', desc: 'Más de 150 proyectos, 45 clientes activos y presencia en México, España y Latinoamérica.' },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Sobre Nosotros
          </p>
          <h1 className="mk-hero-title">
            Transformamos ideas en{' '}
            <span className="mk-gradient-text">realidad digital</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-2xl">
            Somos un equipo apasionado por el desarrollo web y la innovación tecnológica. Creamos soluciones digitales a medida que impulsan el crecimiento de negocios en toda Latinoamérica.
          </p>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Propósito"
            title={<>Misión y <em className="not-italic mk-accent-text">Visión</em></>}
            center
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="mk-glass-card p-8">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-orvenix-text mb-3">Misión</h3>
              <p className="text-orvenix-secondary leading-relaxed">
                Crear soluciones digitales innovadoras y de alta calidad que ayuden a empresas y emprendedores a alcanzar sus metas en el mundo digital. Combinamos diseño, tecnología y estrategia para entregar productos que generan resultados reales.
              </p>
            </div>
            <div className="mk-glass-card p-8">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-orvenix-text mb-3">Visión</h3>
              <p className="text-orvenix-secondary leading-relaxed">
                Ser la agencia de desarrollo web de referencia en Latinoamérica, reconocida por la calidad de nuestro trabajo, la innovación de nuestras soluciones y el impacto positivo que generamos en los negocios de nuestros clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Valores"
            title={<>Lo que nos <em className="not-italic mk-accent-text">define</em></>}
            description="Los principios que guían cada decisión y cada línea de código que escribimos."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            {values.map((v) => (
              <div key={v.name} className="mk-glass-card p-6 flex gap-4">
                <span className="text-3xl shrink-0">{v.icon}</span>
                <div>
                  <h3 className="font-bold text-orvenix-text mb-1">{v.name}</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mk-section-alt py-16">
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

      {/* Team */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="El equipo"
            title={<>Las personas <em className="not-italic mk-accent-text">detrás del código</em></>}
            description="Un equipo multidisciplinar unido por la pasión de crear productos digitales excepcionales."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            {team.map((member) => (
              <div key={member.name} className="mk-glass-card p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-linear-to-br from-orvenix-accent to-cyan-400 flex items-center justify-center mx-auto mb-4 text-xl font-black text-orvenix-bg">
                  {member.initials}
                </div>
                <h3 className="font-bold text-orvenix-text mb-1">{member.name}</h3>
                <p className="text-sm mk-accent-text">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Historia"
            title={<>Nuestra <em className="not-italic mk-accent-text">trayectoria</em></>}
            center
          />
          <div className="mt-12 relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-orvenix-border -translate-x-1/2" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={item.year} className={`flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={`flex-1 ${i % 2 === 1 ? 'md:text-right' : ''}`}>
                    <div className="mk-glass-card p-6">
                      <div className="text-2xl font-black mk-accent-text mb-1">{item.year}</div>
                      <h3 className="font-bold text-orvenix-text mb-2">{item.title}</h3>
                      <p className="text-sm text-orvenix-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-4 h-4 rounded-full bg-orvenix-accent shrink-0 z-10 ring-4 ring-orvenix-surface" />
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para trabajar juntos?"
        description="Cuéntanos tu proyecto y construyamos algo extraordinario."
        buttonLabel="Contáctanos →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
