'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Phone, Menu, X, Hammer, MapPin } from 'lucide-react'

const navLinks = [
  { href: '/webs/ferreteria/catalogo', label: 'Catálogo' },
  { href: '/webs/ferreteria/servicios', label: 'Servicios' },
  { href: '/webs/ferreteria/nosotros', label: 'Nosotros' },
  { href: '/webs/ferreteria/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-dark text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Phone size={12} /> +52 55 9876 5432</span>
            <span className="flex items-center gap-1.5"><MapPin size={12} /> Av. Industria 456, CDMX</span>
          </div>
          <span className="hidden md:block">🕐 Lun-Vie 8:00-18:00 · Sáb 8:00-14:00</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/webs/ferreteria" className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-600 rounded-lg">
              <Hammer size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-dark leading-tight text-lg">El Constructor</p>
              <p className="text-brand-600 text-xs font-medium leading-none">FERRETERÍA</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+525598765432" className="btn-primary text-sm py-2.5">
              <Phone size={15} /> Llamar ahora
            </a>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-medium py-2 text-gray-700 hover:text-brand-600">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
