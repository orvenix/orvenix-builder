import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Orvenix',
  description: 'Cómo recopilamos, usamos y protegemos tu información en Orvenix.',
};

export default function PrivacidadPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">Legal</p>
          <h1 className="mk-hero-title">
            Política de <span className="mk-gradient-text">Privacidad</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-4 max-w-xl">
            Última actualización: 1 de enero de 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mk-section">
        <div className="mk-container max-w-3xl mx-auto">
          <div className="space-y-10">

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Información que recopilamos</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Recopilamos información que nos proporcionas directamente, como cuando completas un formulario de contacto, creas una cuenta o nos escribes por correo o WhatsApp. Esta información puede incluir:
              </p>
              <ul className="space-y-2">
                {[
                  'Nombre completo',
                  'Dirección de correo electrónico',
                  'Número de teléfono o WhatsApp',
                  'Información sobre tu empresa o proyecto',
                  'Datos de pago (procesados de forma segura por terceros como Stripe)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-orvenix-secondary">
                    <span className="mk-accent-text shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-orvenix-secondary leading-relaxed mt-4">
                También recopilamos información técnica de forma automática: dirección IP, tipo de navegador, páginas visitadas y tiempo en el sitio, a través de herramientas como Google Analytics.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Cómo usamos tu información</h2>
              <div className="space-y-3">
                {[
                  { title: 'Prestación del servicio', desc: 'Para gestionar tu proyecto, enviarte propuestas y mantener comunicación sobre el desarrollo.' },
                  { title: 'Soporte técnico', desc: 'Para responder tus consultas y resolver incidencias de manera eficiente.' },
                  { title: 'Facturación', desc: 'Para procesar pagos y emitir los comprobantes fiscales correspondientes.' },
                  { title: 'Mejoras al servicio', desc: 'Para analizar el uso del sitio y mejorar la experiencia de usuario de forma continua.' },
                  { title: 'Comunicaciones', desc: 'Para enviarte actualizaciones sobre tu proyecto o información relevante de nuestros servicios (siempre con tu consentimiento).' },
                ].map((item) => (
                  <div key={item.title}>
                    <h3 className="font-semibold text-orvenix-text mb-1">{item.title}</h3>
                    <p className="text-sm text-orvenix-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Protección de datos</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Implementamos medidas técnicas y organizativas apropiadas para proteger tu información personal contra acceso no autorizado, pérdida, alteración o divulgación. Esto incluye cifrado SSL/TLS, acceso restringido por roles y auditorías periódicas de seguridad.
              </p>
              <p className="text-orvenix-secondary leading-relaxed">
                No vendemos, alquilamos ni compartimos tu información personal con terceros con fines comerciales. Solo compartimos datos con proveedores de servicios que necesitan acceso para operar en nuestro nombre (como plataformas de pago o infraestructura en la nube), siempre bajo acuerdos de confidencialidad.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Tus derechos (ARCO)</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), tienes derecho a:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { letra: 'A', title: 'Acceso', desc: 'Conocer qué datos personales tenemos sobre ti.' },
                  { letra: 'R', title: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
                  { letra: 'C', title: 'Cancelación', desc: 'Solicitar la eliminación de tus datos.' },
                  { letra: 'O', title: 'Oposición', desc: 'Oponerte al tratamiento de tus datos.' },
                ].map((right) => (
                  <div key={right.letra} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-orvenix-accent/20 border border-orvenix-accent/40 flex items-center justify-center shrink-0 font-black mk-accent-text text-sm">
                      {right.letra}
                    </div>
                    <div>
                      <h3 className="font-semibold text-orvenix-text text-sm">{right.title}</h3>
                      <p className="text-xs text-orvenix-secondary mt-0.5">{right.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-orvenix-secondary leading-relaxed mt-6">
                Para ejercer cualquiera de estos derechos, envía una solicitud a{' '}
                <a href="mailto:contacto_directo@orvenix.com.mx" className="mk-accent-text hover:underline">
                  contacto_directo@orvenix.com.mx
                </a>. Respondemos en un plazo máximo de 20 días hábiles.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Contacto</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-3">
                Si tienes preguntas sobre esta política, puedes contactarnos en:
              </p>
              <p className="text-sm text-orvenix-secondary">
                Correo:{' '}
                <a href="mailto:contacto_directo@orvenix.com.mx" className="mk-accent-text hover:underline">
                  contacto_directo@orvenix.com.mx
                </a>
              </p>
              <p className="text-sm text-orvenix-secondary mt-2">
                También puedes{' '}
                <Link href="/contacto" className="mk-accent-text hover:underline">
                  contactarnos directamente
                </Link>{' '}
                a través de nuestro formulario.
              </p>
            </div>

          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
