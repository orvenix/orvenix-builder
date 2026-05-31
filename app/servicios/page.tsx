import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

export const metadata: Metadata = {
  title: 'Características de la Plataforma — Orvenix SaaS',
  description: 'Conoce todas las características de la plataforma Orvenix: panel privado, dominio propio, tienda online, citas, almacenamiento, analíticas y más. Todo desde $349 MXN/mes.',
  openGraph: {
    url: 'https://orvenix.com.mx/servicios/',
    title: 'Características de la Plataforma — Orvenix SaaS',
    description: 'Panel privado, dominio propio, tienda online, citas, almacenamiento, analíticas y más. Tu negocio digital todo-en-uno.',
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

const storageRows = [
  { plan: 'Plan Básico', capacity: '10 GB' },
  { plan: 'Plan Pro', capacity: '50 GB' },
  { plan: 'Plan Empresa', capacity: '200 GB' },
];

const comparisonRows = [
  { feature: 'Panel privado',         basico: '✓',         pro: '✓',               empresa: '✓'             },
  { feature: 'Sitio web con dominio', basico: 'Subdominio', pro: '✓ .com.mx',       empresa: '✓ personalizado' },
  { feature: 'Tienda online',         basico: '—',         pro: '✓',               empresa: '✓ avanzada'    },
  { feature: 'Sistema de citas',      basico: '✓ básico',  pro: '✓ completo',      empresa: '✓ con cobro'   },
  { feature: 'Almacenamiento',        basico: '10 GB',     pro: '50 GB',           empresa: '200 GB'        },
  { feature: 'Analíticas',           basico: 'Básicas',   pro: 'Avanzadas',       empresa: 'Completas + export' },
  { feature: 'Integraciones',        basico: '2',         pro: '10',              empresa: 'Ilimitadas'    },
  { feature: 'Soporte',              basico: 'Email',     pro: 'Chat prioritario', empresa: 'Dedicado 24/7' },
];

const appointmentCards = [
  { icon: '📅', title: 'Reservas online', desc: 'Tus clientes ven tu disponibilidad real y reservan el horario que les conviene — sin llamadas ni WhatsApps.' },
  { icon: '🔔', title: 'Recordatorios automáticos', desc: 'El sistema manda recordatorios al cliente 24h y 1h antes de la cita. Reduce las ausencias hasta un 60%.' },
  { icon: '⚙️', title: 'Control total', desc: 'Define tus horarios, bloquea fechas, establece duración de citas y habilita cobro anticipado al reservar.' },
];

const heroHighlights = [
  { value: '24h', label: 'para activar tu plataforma' },
  { value: '1 panel', label: 'para operar todo tu negocio' },
  { value: '3 planes', label: 'para crecer sin migraciones' },
];

const overviewCards = [
  {
    title: 'Presencia digital lista',
    desc: 'Sitio web, dominio, SSL y páginas base para empezar a recibir clientes desde el primer día.',
    tags: ['Sitio web', 'SEO básico', 'Dominio'],
  },
  {
    title: 'Operación centralizada',
    desc: 'Panel privado para controlar clientes, servicios, productos, citas y archivos en un solo lugar.',
    tags: ['Dashboard', 'CRM', 'Agenda'],
  },
  {
    title: 'Cobro y crecimiento',
    desc: 'Tienda online, pasarelas de pago, analíticas e integraciones para vender y escalar sin fricción.',
    tags: ['Checkout', 'Analíticas', 'Integraciones'],
  },
];

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
              <span className="text-sm font-medium text-orvenix-secondary">Plataforma todo-en-uno</span>
            </div>
            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Todo lo que necesita<br />tu negocio, en un panel
            </h1>
            <p className="text-base leading-relaxed mb-8 text-orvenix-secondary">
              Sin conocimientos técnicos. Sin pagar por separado cada herramienta.
              Activa tu plataforma en menos de 24 horas y empieza a operar desde el día uno.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/precios" className="mk-btn-primary">Ver planes desde $349 ↗</Link>
              <Link href="/plataforma" className="mk-btn-outline">Ver demo</Link>
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
            description="Antes de entrar a cada módulo, esto es lo que realmente resuelve la plataforma Orvenix para tu negocio."
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
          <SectionHeader tag="Característica 01" title="Panel de control privado" description="Tu negocio, centralizado en un dashboard elegante y fácil de usar. Gestiona clientes, ventas, citas y contenido desde un solo lugar." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">¿Qué puedes hacer?</h3>
              <ul className="space-y-3">
                <CheckItem>Ver métricas clave en tiempo real: visitas, ventas, citas del día</CheckItem>
                <CheckItem>Administrar tu catálogo de productos o servicios sin tocar código</CheckItem>
                <CheckItem>Gestionar clientes y su historial de compras o interacciones</CheckItem>
                <CheckItem>Responder mensajes y formularios directamente desde el panel</CheckItem>
                <CheckItem>Acceso seguro desde celular, tablet o computadora</CheckItem>
              </ul>
            </div>
            <GlassCard icon="🖥️" title="Incluido desde el plan Básico">
              <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">
                El panel privado está activo desde el momento en que activas tu cuenta.
                Sin configuraciones complejas, sin instalaciones.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Dashboard en tiempo real', 'Modo oscuro / claro', '100% responsive'].map((t) => (
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
          <SectionHeader tag="Característica 02" title="Sitio web con dominio propio" description="Tu presencia digital profesional incluida. Dominio personalizado, diseño de marca y páginas listas para recibir clientes desde el día uno." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <GlassCard icon="🌐" title="Tu marca en línea">
              <ul className="space-y-2 text-sm text-orvenix-secondary">
                {['Dominio .com.mx incluido en plan Pro y Empresa', 'SSL gratuito y renovación automática', 'Páginas: inicio, servicios, contacto, blog', 'Diseño adaptado a tu marca y colores', 'Optimizado para Google (SEO básico incluido)'].map((item) => (
                  <li key={item}>✓ {item}</li>
                ))}
              </ul>
            </GlassCard>
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Sin complicaciones técnicas</h3>
              <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">
                No necesitas contratar hosting por separado, configurar servidores ni instalar WordPress.
                Tu sitio está alojado en nuestra infraestructura con 99.9% de uptime garantizado.
              </p>
              <p className="text-sm leading-relaxed text-orvenix-secondary">
                Edita textos, sube imágenes y actualiza tu contenido desde el panel — sin tocar una sola línea de código.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 03 — Tienda online */}
      <section id="tienda" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Característica 03" title="Tienda online integrada" description="Vende productos físicos o digitales directamente desde tu plataforma. Pagos con Stripe, MercadoPago o transferencia — tú decides." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Vende sin intermediarios</h3>
              <ul className="space-y-3">
                <CheckItem>Catálogo ilimitado de productos con fotos, variantes y stock</CheckItem>
                <CheckItem>Carrito de compra y checkout optimizado para conversión</CheckItem>
                <CheckItem>Cobros con tarjeta, transferencia, MercadoPago y Stripe</CheckItem>
                <CheckItem>Notificaciones automáticas de pedido al cliente y a ti</CheckItem>
                <CheckItem>Reportes de ventas diarios, semanales y mensuales</CheckItem>
              </ul>
            </div>
            <GlassCard icon="🛒" title="Comisiones y disponibilidad">
              <p className="text-sm leading-relaxed text-orvenix-secondary mb-4">
                Tienda disponible en plan Pro y Empresa. Sin comisión por venta de nuestra parte — solo pagas la tarifa de tu pasarela de pago.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Stripe', 'MercadoPago', 'Transferencia'].map((t) => (
                  <span key={t} className="mk-feature-tag">{t}</span>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Feature 04 — Citas */}
      <section id="citas" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader tag="Característica 04" title="Sistema de citas y agenda" description="Deja que tus clientes reserven citas 24/7 sin que tengas que contestar mensajes. Confirmaciones automáticas por email y WhatsApp." />
          <div className="mt-10 grid sm:grid-cols-3 gap-5">
            {appointmentCards.map((c) => (
              <div key={c.title} className="mk-glass-card p-6">
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-base mb-2 text-orvenix-text">{c.title}</h3>
                <p className="text-sm leading-relaxed text-orvenix-secondary">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 05 — Almacenamiento */}
      <section id="almacenamiento" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Característica 05" title="Almacenamiento seguro en la nube" description="Guarda y comparte archivos con tus clientes de forma segura. Contratos, facturas, fotos, videos — todo en un lugar con acceso controlado." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="mk-glass-card p-8">
              <div className="text-5xl mb-4">☁️</div>
              <h4 className="font-bold text-base mb-4 text-orvenix-text">Capacidad por plan</h4>
              <ul className="divide-y divide-white/6">
                {storageRows.map((r) => (
                  <li key={r.plan} className="flex justify-between py-3 text-sm">
                    <span className="text-orvenix-secondary">{r.plan}</span>
                    <span className="font-bold mk-accent-text">{r.capacity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Más que guardar archivos</h3>
              <ul className="space-y-3">
                <CheckItem>Comparte documentos con clientes mediante enlaces seguros con expiración</CheckItem>
                <CheckItem>Organiza por carpetas: contratos, facturas, proyectos, clientes</CheckItem>
                <CheckItem>Backups automáticos diarios — nunca perderás información</CheckItem>
                <CheckItem>Encriptación en tránsito y en reposo (AES-256)</CheckItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 06 — Analíticas */}
      <section id="analiticas" className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader tag="Característica 06" title="Analíticas e integraciones" description="Toma decisiones basadas en datos reales. Conecta las herramientas que ya usas para que todo funcione en automático." />
          <div className="mt-10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Métricas que importan</h3>
              <ul className="space-y-3">
                <CheckItem>Visitas, fuente de tráfico y páginas más visitadas</CheckItem>
                <CheckItem>Ventas, ticket promedio y productos más vendidos</CheckItem>
                <CheckItem>Tasa de conversión de formularios y llamadas a la acción</CheckItem>
                <CheckItem>Reportes exportables en PDF o CSV</CheckItem>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 mk-accent-text">Integra tus herramientas</h3>
              <div className="flex flex-wrap gap-2">
                {['Stripe', 'MercadoPago', 'Gmail', 'WhatsApp Business', 'Zapier', 'Google Analytics', 'Facebook Pixel', 'Mailchimp', 'Google Calendar', 'Webhooks API'].map((t) => (
                  <span key={t} className="mk-integration-pill">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparacion" className="mk-section bg-orvenix-bg">
        <div className="mk-container">
          <SectionHeader tag="Resumen" title="¿Qué incluye cada plan?" description="Todas las características, distribuidas según el plan que elijas." center />
          <p className="text-center text-sm leading-relaxed text-orvenix-secondary max-w-2xl mx-auto mt-4">
            Si hoy solo necesitas salir rápido, el plan Básico cubre lo esencial. Si ya vendes o atiendes clientes con frecuencia,
            Pro suele ser el mejor punto de equilibrio entre operación, imagen y crecimiento.
          </p>
          <div className="mt-10 overflow-x-auto">
            <table className="mk-cmp-table">
              <thead>
                <tr>
                  <th scope="col">Característica</th>
                  <th scope="col">Básico<br /><span className="mk-accent-text font-normal normal-case">$349/mes</span></th>
                  <th scope="col" className="highlight">Pro<br /><span className="font-normal normal-case">$699/mes</span></th>
                  <th scope="col">Empresa<br /><span className="mk-accent-text font-normal normal-case">$1,399/mes</span></th>
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
        title="¿Listo para activar tu plataforma?"
        description="Sin permanencia forzada. Tu panel listo en menos de 24 horas."
        buttonLabel="Ver planes desde $349 →"
        buttonHref="/precios"
      />
    </MarketingLayout>
  );
}
