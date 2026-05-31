import Link from 'next/link';

interface CtaSectionProps {
  title?: string;
  description?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

export function CtaSection({
  title = '¿Listo para empezar?',
  description = 'Activa tu plataforma hoy. Nuestro equipo la deja lista en menos de 24 horas.',
  buttonLabel = 'Elegir mi plan →',
  buttonHref = '/precios',
}: CtaSectionProps) {
  return (
    <section className="mk-cta-section">
      <div className="mk-container text-center">
        <p className="mk-section-tag justify-center">Activación rápida</p>
        <h2 className="mk-section-title">{title}</h2>
        <p className="mk-section-desc mb-8 max-w-lg mx-auto">{description}</p>
        <Link href={buttonHref} className="mk-btn-primary">
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}
