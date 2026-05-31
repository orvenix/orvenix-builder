'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'

const navLinks = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/catalogo/0-3', label: '0–3 años' },
  { href: '/catalogo/4-8', label: '4–8 años' },
  { href: '/catalogo/9-mas', label: '9+ años' },
  { href: '/nosotros', label: 'Nosotros' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white text-xs text-center py-2 font-semibold">
        🎉 ¡Envío gratis en compras +$800! Usá el código <span className="font-black">JUEGA10</span> y obtené 10% OFF
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🪀</span>
            <div>
              <p className="font-black text-dark text-lg leading-tight">Mundo Mágico</p>
              <p className="text-blue-600 text-xs font-semibold leading-none">Juguetería</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden md:block p-2 text-gray-600 hover:text-blue-600"><Search size={19} /></button>
            <Link href="/catalogo" className="relative p-2 text-gray-700 hover:text-blue-600">
              <ShoppingCart size={22} />
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">2</span>
            </Link>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2">{open ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block font-bold py-2 text-gray-700 hover:text-blue-600">{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  )
}
