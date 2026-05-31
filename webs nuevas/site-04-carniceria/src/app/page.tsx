import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone, Clock, MapPin, Star, Award, Leaf, Users } from 'lucide-react'
import { cortes, categorias } from '@/lib/data'

export default function HomePage() {
  const populares = cortes.filter(c => c.popular)

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1600"
            alt="La Res Premium"
            fill className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/60 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Award size={14} /> Selección de calidad premium
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
              El arte de la<br />
              <span className="text-amber-400">carnicería</span><br />
              artesanal
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Cortes seleccionados a mano por nuestros maestros carniceros. Más de 15 años llevando la mejor carne a tu mesa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/cortes" className="btn-primary px-8 py-4">
                Ver cortes <ArrowRight size={18} />
              </Link>
              <Link href="/pedidos" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-xl transition-all inline-flex items-center gap-2">
                Hacer pedido
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Info bar */}
      <div className="bg-meat text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="flex items-center justify-center md:justify-start gap-2 py-2 md:py-0">
              <Phone size={14} className="text-amber-300" /> <span>55 1122 3344 — Pedidos online</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 md:py-0 md:pl-4">
              <Clock size={14} className="text-amber-300" /> <span>Mar-Dom 7:00-19:00</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-2 py-2 md:py-0">
              <MapPin size={14} className="text-amber-300" /> <span>Mercado Central, Local 12, CDMX</span>
            </div>
          </div>
        </div>
      </div>

      {/* Por qué elegirnos */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: 'Calidad garantizada', desc: 'Seleccionamos personalmente cada pieza. Solo trabajamos con proveedores de confianza y trato humanitario.' },
              { icon: Leaf, title: 'Sin aditivos', desc: 'Carne 100% natural. Sin conservantes, sin hormonas, sin antibióticos. Lo que la naturaleza produce.' },
              { icon: Users, title: 'Atención personalizada', desc: 'Nuestros carniceros te asesoran en el corte ideal para cada preparación. Experiencia de más de 15 años.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="p-4 bg-amber-50 rounded-2xl w-fit mx-auto mb-4">
                  <Icon size={24} className="text-meat" />
                </div>
                <h3 className="text-lg font-bold text-dark mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-10">Nuestras especialidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categorias.map(cat => (
              <Link key={cat.slug} href={`/cortes#${cat.slug}`} className="bg-white rounded-2xl p-6 text-center border-2 border-transparent hover:border-meat hover:shadow-lg transition-all group">
                <span className="text-4xl mb-3 block">{cat.emoji}</span>
                <h3 className="font-bold text-dark group-hover:text-meat transition-colors">{cat.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cortes populares */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Los favoritos de nuestros clientes</h2>
              <p className="text-gray-500 mt-1">Cortes más pedidos de la semana</p>
            </div>
            <Link href="/cortes" className="hidden md:flex items-center gap-1 text-meat font-semibold text-sm hover:gap-2 transition-all">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {populares.map(corte => (
              <div key={corte.id} className="card group bg-white border border-amber-100">
                <div className="relative h-52 overflow-hidden">
                  <Image src={corte.img} alt={corte.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-meat text-white text-xs font-bold px-2 py-1 rounded-lg">Popular</div>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-dark text-lg mb-1">{corte.nombre}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{corte.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-meat">${corte.precio}<span className="text-sm font-normal text-gray-400">/{corte.por}</span></span>
                    <Link href="/pedidos" className="btn-primary text-xs py-2 px-3">Pedir</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA con foto */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1558030006-450675393462?w=1400" alt="Carnicería" width={1400} height={400} className="w-full h-64 object-cover" />
            <div className="absolute inset-0 bg-dark/70 flex items-center">
              <div className="max-w-7xl mx-auto px-8 md:px-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">¿Necesitás un corte especial?</h2>
                  <p className="text-gray-300">Pedidos personalizados para eventos, asados y celebraciones.</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <Link href="/pedidos" className="btn-primary">Hacer pedido</Link>
                  <a href="tel:+525511223344" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2">
                    <Phone size={16} /> Llamar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-amber-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-10">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nombre:'Ricardo Molina', texto:'El ribeye es espectacular. Llevamos 3 años comprando aquí y nunca nos defraudaron.', stars:5 },
              { nombre:'Familia Hernández', texto:'Hacemos los asados familiares todos los domingos con carne de La Res. Calidad insuperable.', stars:5 },
              { nombre:'Chef Mario Vega', texto:'Como chef, solo uso La Res Premium en mi restaurante. La consistencia en calidad es extraordinaria.', stars:5 },
            ].map(t => (
              <div key={t.nombre} className="bg-white rounded-2xl p-6 border border-amber-100">
                <div className="flex gap-0.5 mb-3">{[...Array(t.stars)].map((_,i)=><Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.texto}"</p>
                <p className="font-bold text-dark text-sm">{t.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
