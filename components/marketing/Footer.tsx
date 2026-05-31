import Link from 'next/link';
import Image from 'next/image';

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-3.5 h-3.5">
    <path d="M22.675 0h-21.35C.592 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24h11.495v-9.294h-3.128v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.407 24 24 23.407 24 22.676V1.325C24 .593 23.407 0 22.675 0z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className="w-3.5 h-3.5">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.825.733 5.476 2.016 7.785L0 32l8.333-2.187A15.93 15.93 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.28 13.28 0 01-6.604-1.722l-.474-.264-4.505 1.182 1.203-4.42-.292-.464A13.267 13.267 0 012.667 16C2.667 8.649 8.649 2.667 16 2.667S29.333 8.649 29.333 16 23.351 29.333 16 29.333zm7.283-9.99c-.359-.18-2.125-1.047-2.453-1.167-.328-.12-.568-.18-.807.18s-.927 1.167-1.135 1.406c-.213.239-.422.269-.781.09-.359-.18-1.516-.557-2.885-1.779-1.063-.948-1.781-2.119-1.99-2.479-.213-.359-.021-.553.158-.732.163-.161.359-.419.536-.628s.239-.359.359-.598c.12-.239.06-.449-.03-.628s-.807-1.946-1.106-2.665c-.293-.701-.589-.606-.807-.617-.208-.01-.448-.01-.688-.01s-.628.09-.957.449c-.328.359-1.255 1.226-1.255 2.99s1.286 3.468 1.465 3.708c.18.239 2.531 3.865 6.131 5.416.857.368 1.526.589 2.047.755.86.273 1.643.235 2.261.143.69-.103 2.125-.868 2.422-1.706.297-.838.297-1.556.208-1.706s-.328-.239-.688-.419z" />
  </svg>
);

const NAV_LINKS = [
  { href: '/plataforma',  label: 'Plataforma' },
  { href: '/servicios',   label: 'Servicios' },
  { href: '/precios',     label: 'Precios' },
  { href: '/portafolio',  label: 'Portafolio' },
  { href: '/proceso',     label: 'Proceso' },
  { href: '/afiliados',   label: 'Afiliados' },
  { href: '/contacto',    label: 'Contacto' },
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/terminos',   label: 'Términos' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer mt-auto">
      <div className="mk-container py-3.5">
        <div className="footer-content">
          <div className="footer-brand">
            <Link href="/" className="footer-logo" aria-label="Orvenix — inicio">
              <Image src="/img/logo-main.png" alt="Orvenix" width={218} height={70} className="footer-logo-image" />
            </Link>
            <p>
              Plataforma SaaS para lanzar, administrar y hacer crecer tu presencia digital
              con el look original de Orvenix.
            </p>
            <div className="social-links" aria-label="Redes sociales">
              <a
                href="https://www.facebook.com/profile.php?id=61575345702466"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="social-link"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://wa.me/528128985846"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="social-link"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Navegación</h4>
            <ul>
              {NAV_LINKS.slice(0, 5).map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4>Plataforma</h4>
            <ul>
              <li><Link href="/templates">Plantillas</Link></li>
              <li><Link href="/webs">Demos SaaS</Link></li>
              <li><Link href="/register">Crear cuenta</Link></li>
              <li><Link href="/contacto">Soporte</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <ul>
              {NAV_LINKS.slice(7).map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
            <p className="footer-address">
              <a href="mailto:hola@orvenix.com.mx">hola@orvenix.com.mx</a>
              <br />
              Monterrey, México
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Orvenix. Todos los derechos reservados.</span>
          <span>Diseño, plataforma y operación digital en un solo lugar.</span>
        </div>
      </div>
    </footer>
  );
}
