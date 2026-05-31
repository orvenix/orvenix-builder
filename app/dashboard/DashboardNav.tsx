"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LayoutTemplate, Share2 } from "lucide-react";
import { OrvenixBrand } from "@/components/OrvenixLogo";
import { ThemeToggle } from "@/components/theme/ThemeMode";

interface DashboardNavProps {
  initials: string;
  email: string;
  isAdmin: boolean;
  role: string;
}

export function DashboardNav({ initials, email, isAdmin }: DashboardNavProps) {
  const [scrolled, setScrolled] = useState(false);

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 24);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <nav className={`dashboard-nav sticky top-0 z-20 transition-all duration-300 ${scrolled ? "dashboard-nav-scrolled" : ""}`}>
      {/* Línea de acento inferior al hacer scroll — igual que nav del sitio */}
      <div className={`absolute bottom-0 left-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(0,181,246,0.40)] to-transparent transition-all duration-500 ${scrolled ? "w-[80%] opacity-100" : "w-0 opacity-0"}`} />

      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">

        {/* ── Logo + badge ── */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group relative flex items-center gap-0.5 transition-opacity hover:opacity-90">
            {/* Glow detrás del logo — cyan en lugar de indigo */}
            <span className="absolute inset-[-4px_-8px] rounded-xl bg-transparent transition-all duration-400 group-hover:bg-[rgba(0,181,246,0.06)]" />
            <OrvenixBrand iconSize={32} textSize="lg" />
          </Link>

          <div className="hidden h-5 w-px bg-white/[0.10] sm:block" />

          <span className="hidden text-sm font-semibold text-[color:var(--text-secondary)] sm:inline transition-colors">
            Panel privado
          </span>

          {/* Badge rol — usa el mismo estilo mk-promo-badge del sitio */}
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all duration-300 ${
            isAdmin
              ? "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] text-[color:var(--accent)] shadow-[0_0_12px_rgba(0,181,246,0.15)]"
              : "border-[rgba(0,181,246,0.20)] bg-[rgba(0,181,246,0.08)] text-[rgba(0,181,246,0.80)]"
          }`}>
            {isAdmin ? "ADMIN" : "CLIENTE"}
          </span>
        </div>

        {/* ── Acciones ── */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/dashboard/afiliados"
            className="hidden h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 text-sm font-semibold text-white/60 transition-all duration-300 hover:border-[color:var(--glass-border-hover)] hover:bg-[rgba(0,131,179,0.10)] hover:text-[color:var(--accent)] hover:-translate-y-0.5 sm:flex"
          >
            <Share2 size={14} />
            Afiliados
          </Link>

          <Link
            href="/webs"
            className="hidden h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 text-sm font-semibold text-white/60 transition-all duration-300 hover:border-[color:var(--glass-border-hover)] hover:bg-[rgba(0,181,246,0.08)] hover:text-[color:var(--accent)] hover:-translate-y-0.5 sm:flex"
          >
            <LayoutTemplate size={14} />
            Plantillas
          </Link>

          {/* ── User section ── */}
          <div className="flex items-center gap-2.5 border-l border-white/[0.08] pl-3">
            <div className="group relative">
              {/* Avatar — cyan en lugar de indigo */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,181,246,0.25)] bg-[rgba(0,181,246,0.10)] text-xs font-bold text-[color:var(--accent)] shadow-[0_0_24px_rgba(0,181,246,0.12)] transition-all duration-300 group-hover:border-[rgba(0,181,246,0.50)] group-hover:shadow-[0_0_32px_rgba(0,181,246,0.30)] group-hover:scale-110">
                {initials}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#112540] bg-[color:var(--accent-3)] shadow-[0_0_6px_rgba(0,156,212,0.6)]">
                <span className="absolute inset-0 rounded-full bg-[color:var(--accent-3)] animate-ping opacity-60" />
              </span>
            </div>

            <span className="hidden max-w-[140px] truncate text-xs text-[color:var(--text-secondary)] sm:inline">
              {email}
            </span>

            <Link
              href="/api/auth/signout"
              className="rounded-full px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)] transition-all duration-200 hover:bg-red-500/[0.08] hover:text-red-300"
            >
              Salir
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
