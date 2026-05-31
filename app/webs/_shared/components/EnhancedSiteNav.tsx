"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

export interface NavLink { href: string; label: string }
export interface NavTheme {
  /* Logo icon gradient bg */
  iconFrom: string        // "from-amber-600"
  iconTo: string          // "to-stone-700"
  /* Accent color for active links, underlines, progress bar */
  accentText: string      // "text-amber-400"
  accentBg: string        // "bg-amber-700"
  accentHover: string     // "hover:bg-amber-600"
  accentShadow: string    // "shadow-amber-900/40"
  accentBorder: string    // "border-amber-700/25"
  accentSubtext: string   // "text-amber-600/70"
  accentPill: string      // "bg-amber-900/20"
  /* Mobile menu overlay base color */
  mobileBg: string        // "#070b14"
  /* Progress bar */
  progressFrom: string    // "from-amber-400"
  progressTo: string      // "to-orange-500"
}

interface EnhancedSiteNavProps {
  brand: { name: string; sub?: string }
  links: NavLink[]
  cta: { href: string; label: string }
  Icon: LucideIcon
  theme: NavTheme
  isAnchor?: boolean  // true si los links son anclas (#section) en lugar de rutas
}

export default function EnhancedSiteNav({ brand, links, cta, Icon, theme, isAnchor = false }: EnhancedSiteNavProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY
    const total = document.body.scrollHeight - window.innerHeight
    setScrollProgress(total > 0 ? Math.min((currentY / total) * 100, 100) : 0)
    setScrolled(currentY > 30)
    /* Ocultar al bajar, mostrar al subir */
    if (currentY > lastScrollY + 5 && currentY > 100) setVisible(false)
    else if (currentY < lastScrollY - 5 || currentY < 80) setVisible(true)
    setLastScrollY(currentY)
  }, [lastScrollY])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  /* Cerrar menú en cambio de ruta */
  useEffect(() => {
    const closeMenu = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(closeMenu)
  }, [pathname])

  /* Bloquear scroll del body cuando menú está abierto */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const isActive = (href: string) => {
    if (isAnchor) return false
    return pathname === href
  }

  return (
    <>
      {/* ── BARRA DE PROGRESO ── */}
      <div
        className={`fixed top-0 left-0 z-[70] h-[2px] bg-gradient-to-r ${theme.progressFrom} ${theme.progressTo} transition-all duration-150 ease-out`}
        style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 0 ? 1 : 0 }}
      />

      {/* ── NAV PRINCIPAL ── */}
      <nav
        className={`fixed inset-x-0 z-50 transition-all duration-500 ease-in-out ${
          visible ? "top-[2px]" : "-top-24"
        } ${
          scrolled
            ? "border-b border-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-3xl"
            : "border-b border-white/[0.03] backdrop-blur-xl"
        }`}
        style={{ backgroundColor: scrolled ? `${theme.mobileBg}f0` : `${theme.mobileBg}cc` }}
      >
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-[72px]"}`}>

          {/* ── LOGO ── */}
          {isAnchor ? (
            <a href="#" className="flex items-center gap-3 group">
              <LogoIcon Icon={Icon} theme={theme} scrolled={scrolled} />
              <LogoBrand brand={brand} theme={theme} />
            </a>
          ) : (
            <Link href={links[0]?.href ?? "/"} className="flex items-center gap-3 group">
              <LogoIcon Icon={Icon} theme={theme} scrolled={scrolled} />
              <LogoBrand brand={brand} theme={theme} />
            </Link>
          )}

          {/* ── LINKS DESKTOP ── */}
          <div className="hidden md:flex items-center gap-1">
            {links.slice(1).map(l => (
              <NavLinkItem key={l.href} link={l} active={isActive(l.href)} theme={theme} isAnchor={isAnchor} />
            ))}
          </div>

          {/* ── CTA + HAMBURGER ── */}
          <div className="flex items-center gap-3">
            <Link
              href={cta.href}
              className={`hidden md:inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl ${theme.accentBg} ${theme.accentHover} text-white transition-all duration-300 shadow-lg ${theme.accentShadow} hover:scale-[1.03] hover:shadow-xl active:scale-95 relative overflow-hidden group`}
            >
              <span className="relative z-10">{cta.label}</span>
              {/* Shimmer */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out" />
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpen(o => !o)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300"
            >
              <span className={`block h-[1.5px] w-5 rounded-full transition-all duration-300 ease-in-out origin-center ${open ? `rotate-45 translate-y-[6.5px] ${theme.accentText} bg-current` : "bg-white/60"}`} />
              <span className={`block h-[1.5px] w-5 rounded-full transition-all duration-300 ease-in-out ${open ? "opacity-0 scale-x-0" : "bg-white/60"}`} />
              <span className={`block h-[1.5px] w-5 rounded-full transition-all duration-300 ease-in-out origin-center ${open ? `-rotate-45 -translate-y-[6.5px] ${theme.accentText} bg-current` : "bg-white/60"}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── OVERLAY MÓVIL ── */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      >
        {/* Fondo blur */}
        <div
          className="absolute inset-0 backdrop-blur-2xl"
          style={{ backgroundColor: `${theme.mobileBg}e0` }}
        />
      </div>

      {/* ── PANEL MÓVIL ── */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[55] w-full max-w-xs border-l border-white/[0.06] flex flex-col transition-all duration-500 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: theme.mobileBg }}
      >
        {/* Header panel */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.iconFrom} ${theme.iconTo} flex items-center justify-center shadow-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-black text-white">{brand.name}</div>
              {brand.sub && <div className={`text-[9px] ${theme.accentSubtext} uppercase tracking-widest`}>{brand.sub}</div>}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((l, i) => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  active
                    ? `${theme.accentPill} ${theme.accentText} border border-current/20`
                    : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
                }`}
                style={{ transitionDelay: open ? `${i * 50 + 50}ms` : "0ms", transform: open ? "translateX(0)" : "translateX(24px)", opacity: open ? 1 : 0 }}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${active ? `${theme.accentBg}` : "bg-white/20 group-hover:bg-white/40"}`} />
                {l.label}
                {active && <span className={`ml-auto text-[10px] font-bold ${theme.accentText}`}>●</span>}
              </Link>
            )
          })}
        </nav>

        {/* CTA móvil */}
        <div className="px-4 pb-8 pt-4 border-t border-white/[0.05]"
          style={{ transitionDelay: open ? `${links.length * 50 + 80}ms` : "0ms", transform: open ? "translateY(0)" : "translateY(20px)", opacity: open ? 1 : 0, transition: "all 0.4s ease" }}
        >
          <Link
            href={cta.href}
            onClick={() => setOpen(false)}
            className={`block w-full py-3.5 text-center text-sm font-bold rounded-xl ${theme.accentBg} ${theme.accentHover} text-white transition-all duration-300 shadow-lg ${theme.accentShadow} active:scale-95 relative overflow-hidden group`}
          >
            <span className="relative z-10">{cta.label}</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700" />
          </Link>
        </div>
      </div>
    </>
  )
}

/* ── SUB-COMPONENTS ── */

function LogoIcon({ Icon, theme, scrolled }: { Icon: LucideIcon; theme: NavTheme; scrolled: boolean }) {
  return (
    <div className={`relative transition-all duration-300 ${scrolled ? "w-8 h-8" : "w-9 h-9"} rounded-xl bg-gradient-to-br ${theme.iconFrom} ${theme.iconTo} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-[8deg] group-hover:shadow-xl`}
      style={{ transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
      <Icon className={`${scrolled ? "w-3.5 h-3.5" : "w-4 h-4"} text-white transition-all duration-300`} />
      {/* Glow ring on hover */}
      <span className={`absolute inset-0 rounded-xl bg-gradient-to-br ${theme.iconFrom} ${theme.iconTo} opacity-0 group-hover:opacity-60 blur-md transition-all duration-400 -z-10`} />
    </div>
  )
}

function LogoBrand({ brand, theme }: { brand: { name: string; sub?: string }; theme: NavTheme }) {
  return (
    <div className="leading-none">
      <div className="text-sm font-black tracking-tight text-white group-hover:text-white transition-colors">{brand.name}</div>
      {brand.sub && <div className={`text-[9px] ${theme.accentSubtext} tracking-widest uppercase mt-0.5`}>{brand.sub}</div>}
    </div>
  )
}

function NavLinkItem({ link, active, theme, isAnchor }: { link: NavLink; active: boolean; theme: NavTheme; isAnchor: boolean }) {
  const cls = `relative px-3 py-2 text-sm font-medium transition-colors duration-200 group ${
    active ? theme.accentText : "text-white/40 hover:text-white/80"
  }`
  const inner = (
    <>
      {link.label}
      {/* Underline animada */}
      <span className={`absolute bottom-0.5 left-3 right-3 h-[1.5px] rounded-full transition-all duration-300 ease-out ${
        active ? `${theme.accentBg} w-auto` : "bg-white/30 scale-x-0 group-hover:scale-x-100 origin-left"
      }`} />
      {/* Dot activo */}
      {active && <span className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${theme.accentBg} animate-pulse`} />}
    </>
  )
  return isAnchor
    ? <a href={link.href} className={cls}>{inner}</a>
    : <Link href={link.href} className={cls}>{inner}</Link>
}
