'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme/ThemeMode';

const navLinks = [
  { href: '/servicios', label: 'Características' },
  { href: '/webs', label: 'Sitios' },
  { href: '/proceso', label: 'Proceso' },
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/precios', label: 'Precios' },
  { href: '/faq', label: 'FAQ' },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const onScroll = useCallback(() => {
    const y = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;

    /* Progreso de lectura */
    setScrollProgress(total > 0 ? Math.min((y / total) * 100, 100) : 0);

    /* Estado scrolled */
    setScrolled(prev => (prev ? y > 10 : y > 30));

    /* Auto-hide: ocultar al bajar, mostrar al subir */
    if (!menuOpen) {
      if (y > lastScrollY + 8 && y > 120) setNavVisible(false);
      else if (y < lastScrollY - 8 || y < 80) setNavVisible(true);
    }
    setLastScrollY(y);
  }, [lastScrollY, menuOpen]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  /* Al abrir el menú siempre mostrar la nav */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* Cerrar menú al cambiar de ruta */
  useEffect(() => {
    const closeMenu = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(closeMenu);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div
        className="nav-reading-progress"
        style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 2 ? 1 : 0 }}
        aria-hidden="true"
      />

      <nav
        className={`nav ${scrolled ? 'scrolled' : ''} ${navVisible || menuOpen ? '' : 'nav-hidden'} ${menuOpen ? 'menu-open' : ''}`}
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="mk-container nav-shell">
          <div className="nav-inner">

            {/* ── LOGO ── */}
            <div className="nav-zone nav-zone-left">
              <Link href="/" aria-label="Orvenix — inicio" className="logo logo-enhanced" onClick={() => setMenuOpen(false)}>
                <span className="logo-glow-ring" aria-hidden="true" />
                <Image
                  src="/img/logo-main.png"
                  alt="Orvenix"
                  width={196}
                  height={66}
                  className="logo-image"
                  priority
                />
              </Link>
            </div>

            {/* ── THEME TOGGLE ── */}
            <div className="nav-zone nav-zone-center">
              <ThemeToggle />
            </div>

            {/* ── LINKS + HAMBURGER ── */}
            <div className="nav-zone nav-zone-right">
              <button
                type="button"
                className={`nav-menu-backdrop ${menuOpen ? 'active' : ''}`}
                aria-label="Cerrar menú"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
              />

              <ul
                id="primary-navigation"
                className={`nav-links ${menuOpen ? 'active' : ''}`}
              >
                {navLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={isActive(href) ? 'active' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      {isActive(href) && <span className="nav-active-dot" aria-hidden="true" />}
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/plataforma"
                    className={`nav-plat ${isActive('/plataforma') ? 'active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Plataforma <span className="nav-plat-badge">nuevo</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={session ? '/dashboard' : '/login'}
                    className="nav-panel-btn"
                    onClick={() => setMenuOpen(false)}
                  >
                    {session ? 'Mi panel' : 'Ingresar'}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacto"
                    className="nav-cta nav-cta-enhanced"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="nav-cta-shimmer" aria-hidden="true" />
                    Contacto
                  </Link>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen ? 'true' : 'false'}
                aria-controls="primary-navigation"
                className={`nav-toggle ${menuOpen ? 'active' : ''}`}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
