import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'Términos de Uso — Orvenix',
  description: 'Condiciones de uso de los servicios Orvenix.',
};

export default function TerminosPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">Legal</p>
          <h1 className="mk-hero-title">
            Términos de <span className="mk-gradient-text">Uso</span>
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
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Aceptación de términos</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Al acceder y utilizar los servicios de Orvenix, incluyendo nuestro sitio web (orvenix.com.mx), plataforma SaaS y cualquier servicio relacionado, aceptas cumplir con estos Términos de Uso y nuestra Política de Privacidad.
              </p>
              <p className="text-orvenix-secondary leading-relaxed">
                Si no estás de acuerdo con alguno de estos términos, te pedimos que no utilices nuestros servicios. El uso continuado de los servicios después de cualquier modificación constituye tu aceptación de los nuevos términos.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Servicios ofrecidos</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Orvenix ofrece servicios de desarrollo web, diseño digital, plataformas SaaS y consultoría tecnológica. Los servicios específicos contratados se detallan en la propuesta comercial y/o contrato de servicio correspondiente.
              </p>
              <ul className="space-y-2">
                {[
                  'Desarrollo de sitios web y landing pages',
                  'Diseño de experiencia de usuario (UI/UX)',
                  'Plataformas SaaS y aplicaciones web',
                  'Optimización SEO y velocidad web',
                  'Integración con servicios de terceros',
                  'Soporte técnico y mantenimiento',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-orvenix-secondary">
                    <span className="mk-accent-text shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Nuestras responsabilidades</h2>
              <div className="space-y-4 text-sm text-orvenix-secondary leading-relaxed">
                <p>
                  Nos comprometemos a entregar los servicios acordados con la calidad y en los plazos establecidos en la propuesta comercial. Mantendremos comunicación constante sobre el avance del proyecto y notificaremos con anticipación cualquier cambio en el cronograma.
                </p>
                <p>
                  Garantizamos la confidencialidad de la información que nos compartas y no la utilizaremos para fines distintos a los acordados. Implementaremos medidas de seguridad adecuadas para proteger tus datos y los de tus clientes.
                </p>
                <p>
                  Ofrecemos soporte post-lanzamiento según las condiciones del plan contratado. Las correcciones de errores producidos por nuestro desarrollo están cubiertas durante el periodo de garantía especificado en cada proyecto.
                </p>
              </div>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Propiedad intelectual</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Una vez completado el pago íntegro del proyecto, los derechos sobre el diseño y código desarrollado específicamente para tu proyecto te son transferidos. Esto incluye archivos de diseño, código fuente y activos digitales creados durante el proyecto.
              </p>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Los componentes, librerías y frameworks de código abierto utilizados se rigen por sus propias licencias. Orvenix se reserva el derecho de exhibir el trabajo realizado en nuestro portafolio, salvo acuerdo de confidencialidad explícito.
              </p>
              <p className="text-orvenix-secondary leading-relaxed">
                Las marcas, logos y contenidos del sitio web de Orvenix (orvenix.com.mx) son propiedad exclusiva de Orvenix y no pueden ser reproducidos sin autorización escrita.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Limitación de responsabilidad</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Orvenix no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso de los servicios, incluyendo pero no limitado a pérdida de ingresos, datos o negocios.
              </p>
              <p className="text-orvenix-secondary leading-relaxed mb-4">
                Nuestra responsabilidad total ante cualquier reclamación no excederá el monto pagado por los servicios en los últimos 6 meses previos al evento que dio lugar a la reclamación.
              </p>
              <p className="text-orvenix-secondary leading-relaxed">
                No somos responsables por interrupciones de servicios causadas por terceros (proveedores de hosting, CDN, pasarelas de pago) ni por eventos de fuerza mayor.
              </p>
            </div>

            <div className="mk-glass-card p-8">
              <h2 className="text-xl font-bold text-orvenix-text mb-4">Contacto</h2>
              <p className="text-orvenix-secondary leading-relaxed mb-3">
                Si tienes preguntas sobre estos términos, puedes contactarnos en:
              </p>
              <p className="text-sm text-orvenix-secondary">
                Correo:{' '}
                <a href="mailto:contacto_directo@orvenix.com.mx" className="mk-accent-text hover:underline">
                  contacto_directo@orvenix.com.mx
                </a>
              </p>
              <p className="text-sm text-orvenix-secondary mt-2">
                O bien, utiliza nuestro{' '}
                <Link href="/contacto" className="mk-accent-text hover:underline">
                  formulario de contacto
                </Link>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
