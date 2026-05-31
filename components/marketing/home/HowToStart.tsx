import { SectionHeader } from '../sections/SectionHeader';

const steps = [
  { num: '01', title: 'Elige tu plan', description: 'Selecciona el plan que se ajuste al tamaño de tu negocio. Puedes escalar en cualquier momento.' },
  { num: '02', title: 'Crea tu cuenta', description: 'Registra tu empresa en minutos. Sin contratos largos ni papeleos. Solo datos básicos.' },
  { num: '03', title: 'Tu panel listo', description: 'En menos de 24h tu panel privado está activo con tu dominio, tu logo y tu marca.' },
  { num: '04', title: 'Opera y crece', description: 'Invita clientes, sube archivos y gestiona proyectos. Soporte incluido desde el primer día.' },
];

const integrations = [
  '💳 Stripe', '📧 Gmail', '📅 Google Calendar', '📊 Google Analytics',
  '🔗 Zapier', '💬 WhatsApp', '📦 Dropbox', '🔧 Slack',
  '🌐 Cloudflare', '🔒 Auth0', '💰 PayPal', '📱 Push Notifications',
];

export function HowToStart() {
  return (
    <section id="como-empezar" className="mk-section-alt">
      <div className="mk-container">
        <SectionHeader
          tag="Cómo empezar"
          title={
            <>
              Activa tu plataforma
              <br />
              <em className="not-italic mk-accent-text">en 4 pasos</em>
            </>
          }
          center
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div
                  className="mk-step-connector hidden lg:block absolute top-7 left-full w-full h-px"
                  aria-hidden="true"
                />
              )}
              <div className="mk-step-num">{s.num}</div>
              <h3 className="font-bold text-base mb-2 text-orvenix-text">{s.title}</h3>
              <p className="text-sm leading-relaxed text-orvenix-secondary">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-12 mk-divider">
          <p className="mk-section-tag mb-6">Integraciones</p>
          <h3 className="text-xl font-bold mb-6 text-orvenix-text">
            Conecta con las herramientas que ya usas
          </h3>
          <div className="flex flex-wrap gap-2">
            {integrations.map((item) => (
              <span key={item} className="mk-integration-pill">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
