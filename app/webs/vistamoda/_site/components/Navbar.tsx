'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Menu, X, Search, Heart } from 'lucide-react'

const navLinks = [
  { href: '/webs/vistamoda/tienda', label: 'Tienda' },
  { href: '/webs/vistamoda/tienda?cat=mujer', label: 'Mujer' },
  { href: '/webs/vistamoda/tienda?cat=hombre', label: 'Hombre' },
  { href: '/webs/vistamoda/tienda?cat=accesorios', label: 'Accesorios' },
  { href: '/webs/vistamoda/nosotros', label: 'Nosotros' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      {/* Barra de anuncio */}
      <div className="bg-dark text-white text-center text-xs py-2 px-4">
        🚚 Envío gratis en compras mayores a $1,500 MXN — Usá el código{' '}
        <span className="font-bold text-brand-400">BIENVENIDO10</span> y obtené 10% off
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/webs/vistamoda" className="flex items-center gap-2">
            <span className="text-2xl font-black text-dark tracking-tight">
              Vista<span className="text-brand-600">Moda</span>
            </span>
          </Link>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            <button className="hidden md:block p-2 text-gray-600 hover:text-brand-600 transition-colors">
              <Search size={20} />
            </button>
            <button className="hidden md:block p-2 text-gray-600 hover:text-brand-600 transition-colors">
              <Heart size={20} />
            </button>
            <Link href="/webs/vistamoda/carrito" className="relative p-2 text-gray-700 hover:text-brand-600 transition-colors">
              <ShoppingBag size={22} />
              <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                3
              </span>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 text-gray-700"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-gray-700 font-medium py-2 hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/webs/vistamoda/contacto" onClick={() => setOpen(false)} className="block text-gray-700 font-medium py-2 hover:text-brand-600">
            Contacto
          </Link>
        </div>
      )}
    </header>
  )
}
