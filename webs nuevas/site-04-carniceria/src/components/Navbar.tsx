'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Phone, ShoppingBag } from 'lucide-react'

const navLinks = [
  { href: '/cortes', label: 'Nuestros cortes' },
  { href: '/pedidos', label: 'Hacer pedido' },
  { href: '/galeria', label: 'Galería' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-2xl">🥩</span>
            <div>
              <p className="font-black text-meat leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                La Res Premium
              </p>
              <p className="text-xs text-gray-500 font-medium leading-none tracking-wider uppercase">Carnicería Artesanal</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-700 hover:text-meat transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+525511223344" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-meat">
              <Phone size={14} /> 55 1122 3344
            </a>
            <Link href="/pedidos" className="btn-primary text-sm py-2.5">
              <ShoppingBag size={15} /> Hacer pedido
            </Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-medium py-2 text-gray-700 hover:text-meat">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
