"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Layers } from "lucide-react";
import { BRAND, NAV_LINKS, NAVBAR } from "@/lib/content";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: "rgba(251,249,246,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-lg tracking-tight flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "var(--coral)" }}
          >
            <Layers size={16} color="#fff8f5" />
          </span>
          {BRAND.name}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted hover:opacity-80 transition-opacity">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href={NAVBAR.loginHref} className="text-sm text-muted hover:opacity-80 transition-opacity">
            {NAVBAR.loginLabel}
          </Link>
          <Link href={NAVBAR.ctaHref} className="btn-primary text-sm px-4 py-2 rounded-full">
            {NAVBAR.ctaLabel}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menú">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-4" style={{ borderColor: "var(--border)" }}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-muted" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href={NAVBAR.ctaHref} className="btn-primary text-sm px-4 py-2 rounded-full text-center">
            {NAVBAR.ctaLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
