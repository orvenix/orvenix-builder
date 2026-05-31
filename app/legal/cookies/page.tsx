import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'Política de Cookies — Orvenix',
  description: 'Información sobre el uso de cookies en orvenix.com.mx',
};

export default function CookiesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">Legal</p>
          <h1 className="mk-hero-title">
            Política de <span className="mk-gradient-text">Cookies</span>
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
              <h2 className="text-xl font-bold text-orvenix-text mb-4">¿Qué son las cookies?</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Sirven para recordar tus preferencias, mantener tu sesión activa y recopilar información estadística sobre el uso del sitio.
              </p>
              <p className="text-orvenix-secondary leading-relaxed">
                Las cookies no contienen información personal identificable por sí solas y no pueden dañar tu dispositivo.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Cookies que utilizamos</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-orvenix-text mb-2">Cookies técnicas / necesarias</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">
                    Son imprescindibles para el funcionamiento del sitio. Permiten la navegación, el acceso a áreas seguras y el mantenimiento de tu sesión. Sin estas cookies el sitio no puede funcionar correctamente. No requieren tu consentimiento.
                  </p>
                </div>
                <div className="mk-divider" />
                <div>
                  <h3 className="font-semibold text-orvenix-text mb-2">Cookies analíticas</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">
                    Utilizamos Google Analytics 4 para comprender cómo los usuarios interactúan con nuestro sitio. Esta información nos ayuda a mejorar la experiencia. Los datos se recopilan de forma anónima y agregada.
                  </p>
                </div>
                <div className="mk-divider" />
                <div>
                  <h3 className="font-semibold text-orvenix-text mb-2">Cookies de preferencias</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">
                    Recuerdan tus preferencias de idioma, tema y configuración para personalizar tu experiencia en futuras visitas.
                  </p>
                </div>
              </div>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Control de cookies en tu navegador</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Puedes configurar tu navegador para rechazar o eliminar cookies en cualquier momento. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
              </p>
              <ul className="space-y-2">
                {[
                  'Google Chrome: Configuración → Privacidad y seguridad → Cookies',
                  'Mozilla Firefox: Preferencias → Privacidad y seguridad',
                  'Safari: Preferencias → Privacidad',
                  'Microsoft Edge: Configuración → Cookies y permisos del sitio',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-orvenix-secondary">
                    <span className="mk-accent-text shrink-0 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Contacto</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Si tienes preguntas sobre nuestra política de cookies, puedes contactarnos en:
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-orvenix-secondary">
                  Correo:{' '}
                  <a href="mailto:contacto_directo@orvenix.com.mx" className="mk-accent-text hover:underline">
                    contacto_directo@orvenix.com.mx
                  </a>
                </p>
                <p className="text-orvenix-secondary">
                  También puedes consultar nuestra{' '}
                  <Link href="/legal/privacidad" className="mk-accent-text hover:underline">
                    Política de Privacidad
                  </Link>{' '}
                  o{' '}
                  <Link href="/contacto" className="mk-accent-text hover:underline">
                    contactarnos directamente
                  </Link>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
