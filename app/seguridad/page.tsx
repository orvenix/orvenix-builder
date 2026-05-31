import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';

export const metadata: Metadata = {
  title: 'Seguridad y Privacidad — Orvenix',
  description: 'Tu información, siempre protegida. Conoce las medidas de seguridad de Orvenix.',
};

const pillars = [
  {
    icon: '🔐',
    title: 'Cifrado SSL/TLS',
    desc: 'Toda la comunicación entre tu navegador y nuestros servidores está cifrada con TLS 1.3, el estándar más moderno y seguro disponible.',
  },
  {
    icon: '🇲🇽',
    title: 'Servidores en México',
    desc: 'Tus datos se almacenan en centros de datos ubicados en Ciudad de México y Guadalajara, cumpliendo con la normativa local.',
  },
  {
    icon: '💾',
    title: 'Backups automáticos',
    desc: 'Realizamos respaldos completos cada 24 horas con retención de 30 días. Tu información siempre tiene un punto de restauración.',
  },
  {
    icon: '🛡️',
    title: 'Control de acceso estricto',
    desc: 'Autenticación de dos factores, roles y permisos granulares en cada cuenta. Solo tú y quienes tú autorices tienen acceso.',
  },
];

const compliance = [
  'Aviso de privacidad conforme a LFPDPPP',
  'Tus datos son tuyos — puedes exportarlos o eliminarlos en cualquier momento',
  'Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)',
  'No vendemos ni compartimos datos con terceros sin tu consentimiento',
  'Contratos de procesamiento con todos nuestros proveedores de infraestructura',
  'Notificación de incidentes de seguridad en menos de 72 horas',
];

const infraRows = [
  { feature: 'Protocolo SSL/TLS', value: 'TLS 1.3' },
  { feature: 'Ubicación de servidores', value: 'CDMX / Guadalajara' },
  { feature: 'Backups', value: 'Diarios — 30 días de retención' },
  { feature: 'Firewall de aplicaciones (WAF)', value: 'Activo' },
  { feature: 'SLA de disponibilidad', value: '99.9% uptime garantizado' },
  { feature: 'Autenticación 2FA', value: 'Incluida en todos los planes' },
  { feature: 'CDN', value: 'Cloudflare — global' },
];

const faqs = [
  {
    question: '¿Quién puede acceder a mis datos?',
    answer: 'Solo tú y los miembros de tu equipo que autorices. Nuestro personal técnico puede acceder en casos de soporte, siempre bajo tu solicitud y con registro de actividad.',
  },
  {
    question: '¿Qué pasa con mis datos si cancelo?',
    answer: 'Al cancelar, tienes 30 días para exportar toda tu información. Después se elimina permanentemente de nuestros servidores. Nunca te dejamos sin acceso inmediato.',
  },
  {
    question: '¿Cómo protegen los datos de mis clientes?',
    answer: 'Los datos de tus clientes se almacenan cifrados y segmentados. Nosotros no tenemos acceso a ellos salvo que nos lo otorgues explícitamente para soporte técnico.',
  },
  {
    question: '¿Cómo reporto una vulnerabilidad?',
    answer: 'Escríbenos a seguridad@orvenix.com.mx. Respondemos en menos de 48 horas y mantenemos confidencialidad total en el proceso de divulgación.',
  },
];

export default function SeguridadPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Seguridad y Privacidad
          </p>
          <h1 className="mk-hero-title">
            Tu información,{' '}
            <span className="mk-gradient-text">siempre protegida</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Implementamos las mejores prácticas de seguridad para proteger tu plataforma y los datos de tus clientes en todo momento.
          </p>
        </div>
      </section>

      {/* Security pillars */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Fundamentos"
            title={<>4 pilares de <em className="not-italic mk-accent-text">seguridad</em></>}
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            {pillars.map((p) => (
              <div key={p.title} className="mk-glass-card p-6 flex gap-4">
                <span className="text-3xl shrink-0">{p.icon}</span>
                <div>
                  <h3 className="font-bold text-orvenix-text mb-2">{p.title}</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal compliance */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Cumplimiento legal"
            title={<>Comprometidos con tu <em className="not-italic mk-accent-text">privacidad</em></>}
            center
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {compliance.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                <span className="text-sm text-orvenix-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infrastructure table */}
      <section className="mk-section">
        <div className="mk-container max-w-2xl mx-auto">
          <SectionHeader
            tag="Infraestructura"
            title={<>Especificaciones <em className="not-italic mk-accent-text">técnicas</em></>}
            center
          />
          <div className="mt-10 mk-glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orvenix-border">
                  <th className="text-left px-6 py-3 text-orvenix-muted font-semibold">Característica</th>
                  <th className="text-left px-6 py-3 text-orvenix-muted font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {infraRows.map((row, i) => (
                  <tr key={row.feature} className={i < infraRows.length - 1 ? 'border-b border-orvenix-border' : ''}>
                    <td className="px-6 py-4 text-orvenix-secondary">{row.feature}</td>
                    <td className="px-6 py-4 text-orvenix-text font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container max-w-3xl mx-auto">
          <SectionHeader
            tag="Preguntas frecuentes"
            title={<>Seguridad sin <em className="not-italic mk-accent-text">complicaciones</em></>}
            center
          />
          <div className="mt-10">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Tienes dudas sobre seguridad?"
        description="Nuestro equipo técnico resuelve cualquier inquietud sobre la protección de tus datos."
        buttonLabel="Contactar al equipo →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
