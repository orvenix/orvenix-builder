import Link from 'next/link';

export function PlatPromoBanner() {
  return (
    <section className="pb-24 bg-orvenix-bg">
      <div className="mk-container">
        <Link
          href="/plataforma"
          className="mk-promo-banner group"
          aria-label="Conoce la Plataforma Orvenix"
        >
          {/* Decorative glow */}
          <div className="mk-promo-glow" aria-hidden="true" />

          {/* Left */}
          <div className="relative flex-1 min-w-60">
            <span className="mk-promo-badge">✦ Nuevo</span>
            <h2 className="mk-promo-title">Plataforma Orvenix</h2>
            <p className="mk-promo-desc">
              Sitio web + panel privado + gestión de clientes + almacenamiento en la nube.{' '}
              <strong>Todo en un solo sistema.</strong>
            </p>
            <div className="mk-promo-pills">
              {['🌐 Sitio profesional', '🔐 Panel privado', '☁️ Almacenamiento', '👥 Gestión de clientes'].map((p) => (
                <span key={p} className="mk-promo-pill">{p}</span>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative flex flex-col items-center gap-4 shrink-0">
            <div className="text-center">
              <span className="block text-xs text-orvenix-muted mb-1">desde</span>
              <span className="mk-promo-price">$399</span>
              <span className="block text-xs text-orvenix-muted mt-1">MXN/mes</span>
            </div>
            <span className="mk-promo-cta group-hover:scale-105 transition-transform duration-200">
              Ver planes →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
