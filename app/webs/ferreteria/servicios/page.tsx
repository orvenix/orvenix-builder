import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, ArrowRight } from 'lucide-react'
import { servicios } from '@/app/webs/ferreteria/_site/lib/data'

export const metadata: Metadata = { title: 'Servicios' }

export default function ServiciosPage() {
  return (
    <>
      <section className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4">Nuestros servicios</h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            Más que una ferretería: somos tu aliado en cada proyecto de obra.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map(s => (
            <div key={s.titulo} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-brand-500 hover:shadow-md transition-all">
              <span className="text-4xl mb-4 block">{s.icon}</span>
              <h3 className="text-xl font-bold text-dark mb-3">{s.titulo}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">¿Necesitás más información?</h2>
            <p className="text-red-100">Consultá con nuestro equipo técnico de forma gratuita.</p>
          </div>
          <div className="flex gap-3">
            <a href="tel:+525598765432" className="bg-white text-brand-700 font-bold px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-red-50 transition-colors">
              <Phone size={16} /> Llamar ahora
            </a>
            <Link href="/webs/ferreteria/contacto" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:bg-white/10 transition-colors">
              Contactar <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
