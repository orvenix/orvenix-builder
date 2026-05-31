import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cortes, categorias } from '@/app/webs/carniceria/_site/lib/data'

export const metadata: Metadata = { title: 'Nuestros cortes — Carta completa' }

export default function CortesPage() {
  return (
    <>
      <section className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Nuestra carta de cortes</h1>
          <p className="text-gray-300 max-w-xl mx-auto">Cada corte seleccionado a mano por nuestros maestros carniceros.</p>
        </div>
      </section>

      {categorias.map(cat => {
        const cortesDeCategoria = cortes.filter(c => c.categoria === cat.slug)
        if (!cortesDeCategoria.length) return null
        return (
          <section key={cat.slug} id={cat.slug} className="py-12 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-8">
                <span className="text-3xl">{cat.emoji}</span>
                <div>
                  <h2 className="text-2xl font-black text-dark">{cat.nombre}</h2>
                  <p className="text-gray-500 text-sm">{cat.desc}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {cortesDeCategoria.map(corte => (
                  <div key={corte.id} className="card group bg-white border border-gray-100">
                    <div className="relative h-44 overflow-hidden">
                      <Image src={corte.img} alt={corte.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      {corte.popular && <div className="absolute top-2 left-2 bg-meat text-white text-xs font-bold px-2 py-0.5 rounded">⭐ Popular</div>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-black text-dark mb-1">{corte.nombre}</h3>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{corte.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-meat">${corte.precio}<span className="text-xs text-gray-400 font-normal">/{corte.por}</span></span>
                        <Link href="/webs/carniceria/pedidos" className="btn-primary text-xs py-2 px-3">Pedir</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-black text-dark mb-3">¿No encontraste lo que buscabas?</h2>
          <p className="text-gray-500 mb-6">Hacemos cortes especiales bajo pedido. Consultanos.</p>
          <Link href="/webs/carniceria/pedidos" className="btn-primary">
            Solicitar corte personalizado <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
