import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Integraciones — Orvenix',
  description: 'Conecta las herramientas que ya usas con tu plataforma Orvenix.',
};

const categories = [
  {
    name: 'Pagos',
    icon: '💳',
    integrations: [
      { name: 'Stripe', desc: 'Procesa pagos con tarjeta, suscripciones y reembolsos automáticos.' },
      { name: 'MercadoPago', desc: 'La pasarela líder en Latinoamérica. Acepta todas las tarjetas y efectivo.' },
      { name: 'PayPal', desc: 'Pagos internacionales y checkout express para clientes globales.' },
    ],
  },
  {
    name: 'Analíticas',
    icon: '📊',
    integrations: [
      { name: 'Google Analytics 4', desc: 'Métricas completas de tráfico, conversiones y comportamiento de usuarios.' },
      { name: 'Meta Pixel', desc: 'Seguimiento de conversiones y retargeting en Facebook e Instagram.' },
      { name: 'Google Search Console', desc: 'Monitoreo de rendimiento SEO, palabras clave e indexación.' },
    ],
  },
  {
    name: 'Comunicación',
    icon: '💬',
    integrations: [
      { name: 'WhatsApp Business', desc: 'Notificaciones automáticas y atención al cliente vía WhatsApp.' },
      { name: 'Gmail / Google Workspace', desc: 'Envío de correos transaccionales y sincronización de contactos.' },
      { name: 'Push Notifications', desc: 'Notificaciones en tiempo real para usuarios de tu plataforma.' },
    ],
  },
  {
    name: 'Automatización',
    icon: '⚙️',
    integrations: [
      { name: 'Zapier', desc: 'Conecta con más de 6,000 apps sin escribir código.' },
      { name: 'Google Calendar', desc: 'Sincronización bidireccional de citas y eventos.' },
      { name: 'Make / Integromat', desc: 'Automatizaciones avanzadas con flujos visuales — Próximamente.', soon: true },
    ],
  },
  {
    name: 'Almacenamiento',
    icon: '🗄️',
    integrations: [
      { name: 'Dropbox', desc: 'Sincronización de archivos y carpetas compartidas con clientes.' },
      { name: 'Google Drive', desc: 'Gestión de documentos y colaboración en tiempo real.' },
    ],
  },
  {
    name: 'Seguridad',
    icon: '🔒',
    integrations: [
      { name: 'Cloudflare', desc: 'Protección DDoS, CDN global y certificado SSL automático.' },
      { name: 'Auth0', desc: 'Autenticación empresarial con SSO, MFA y gestión de identidades.' },
    ],
  },
];

export default function IntegracionesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Integraciones
          </p>
          <h1 className="mk-hero-title">
            Conecta las herramientas{' '}
            <span className="mk-gradient-text">que ya usas</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Orvenix se integra con las plataformas más populares del mercado. Pagos, analíticas, comunicación y mucho más.
          </p>
        </div>
      </section>

      {/* Integration categories */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Ecosistema"
            title={<>Todas las <em className="not-italic mk-accent-text">integraciones</em></>}
            description="Conecta tu plataforma con las herramientas que tu equipo ya conoce y usa."
            center
          />
          <div className="mt-12 space-y-12">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="text-lg font-bold text-orvenix-text">{cat.name}</h3>
                  <div className="flex-1 mk-divider" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.integrations.map((intg) => (
                    <div key={intg.name} className="mk-glass-card p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-orvenix-text">{intg.name}</h4>
                        {'soon' in intg && intg.soon && (
                          <span className="mk-feature-tag text-xs shrink-0">Próximamente</span>
                        )}
                      </div>
                      <p className="text-sm text-orvenix-secondary leading-relaxed">{intg.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zapier callout */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <div className="mk-guarantee-banner flex flex-col md:flex-row items-center gap-6 p-8">
            <span className="text-4xl shrink-0">⚡</span>
            <div>
              <h3 className="text-lg font-bold text-orvenix-text mb-1">Conecta con más de 6,000 apps vía Zapier</h3>
              <p className="text-orvenix-secondary">
                Con Zapier conectas Orvenix con más de 6,000 aplicaciones sin programar. CRMs, ERPs, herramientas de marketing, contabilidad y más.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Necesitas una integración específica?"
        description="Cuéntanos qué herramientas usas y lo integramos en tu plataforma."
        buttonLabel="Solicitar integración →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
