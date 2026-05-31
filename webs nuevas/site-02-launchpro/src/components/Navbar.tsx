'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'

const links = [
  { href: '/#features', label: 'Funciones' },
  { href: '/#pricing', label: 'Precios' },
  { href: '/#testimonials', label: 'Testimonios' },
  { href: '/#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-600 rounded-lg">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">Launch<span className="gradient-text">Pro</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/contacto" className="text-sm text-gray-400 hover:text-white px-4 py-2">Iniciar sesión</Link>
            <Link href="/#pricing" className="btn-primary text-sm px-5 py-2.5">Empezar gratis</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-400">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-white/10 px-4 py-4 space-y-3">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-gray-300 py-2">
              {l.label}
            </Link>
          ))}
          <Link href="/#pricing" className="btn-primary w-full justify-center mt-2">Empezar gratis</Link>
        </div>
      )}
    </header>
  )
}
