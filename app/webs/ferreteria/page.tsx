import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone, Truck, Award, Clock, ChevronRight } from 'lucide-react'
import { categorias, productos } from '@/app/webs/ferreteria/_site/lib/data'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center bg-dark overflow-hidden">
        <div className="absolute inset-0">
          <Image src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1600" alt="Ferretería" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/90 via-dark/70 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-brand-600/20 border border-brand-500/30 text-brand-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              🏆 20 años de confianza en el rubro
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
              Todo para<br />
              <span className="text-brand-500">tu obra</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              La ferretería de confianza de miles de profesionales y particulares. Herramientas, materiales y asesoramiento experto.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/webs/ferreteria/catalogo" className="btn-primary px-8 py-4">
                Ver catálogo <ArrowRight size={18} />
              </Link>
              <a href="tel:+525598765432" className="flex items-center gap-2 text-white border-2 border-white/30 hover:border-white px-6 py-4 rounded-lg font-semibold transition-colors">
                <Phone size={18} /> Llamar ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-white">
            {[
              { icon: Truck, text: 'Envío en el día' },
              { icon: Award, text: 'Garantía oficial' },
              { icon: Clock, text: '20 años de experiencia' },
              { icon: Phone, text: 'Asesoramiento gratis' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 py-1.5">
                <Icon size={16} className="text-red-200" />
                <span className="text-sm font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Nuestro catálogo</h2>
              <p className="text-gray-500 mt-1">Más de 5,000 productos disponibles</p>
            </div>
            <Link href="/webs/ferreteria/catalogo" className="hidden md:flex items-center gap-1 text-brand-600 font-semibold text-sm hover:gap-2 transition-all">
              Ver todo <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categorias.map(cat => (
              <Link key={cat.slug} href={`/webs/ferreteria/catalogo/${cat.slug}`} className="group text-center">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-100">
                  <Image src={cat.img} alt={cat.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-dark/30 group-hover:bg-dark/50 transition-colors" />
                  <span className="absolute inset-0 flex items-center justify-center text-3xl">{cat.icon}</span>
                </div>
                <p className="text-sm font-semibold text-dark group-hover:text-brand-600 transition-colors leading-tight">{cat.nombre}</p>
                <p className="text-xs text-gray-400">{cat.count} productos</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title mb-8">Productos más vendidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {productos.map(p => (
              <div key={p.id} className="card group bg-white border border-gray-100">
                <div className="relative aspect-square bg-gray-50">
                  <Image src={p.img} alt={p.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  {!p.stock && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-bold bg-gray-700 text-white px-2 py-1 rounded">Sin stock</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{p.marca}</p>
                  <h3 className="text-sm font-semibold text-dark line-clamp-2 leading-tight mb-2">{p.nombre}</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-dark">${p.precio.toLocaleString('es-MX')}</span>
                    <button disabled={!p.stock} className="text-xs bg-brand-600 text-white px-2 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors font-semibold">
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner servicios */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-dark rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-black text-white mb-3">¿Necesitás un presupuesto?</h2>
              <p className="text-gray-300">Elaboramos presupuestos de materiales gratis para tu próximo proyecto de obra.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a href="tel:+525598765432" className="btn-primary">
                <Phone size={16} /> Llamar gratis
              </a>
              <Link href="/webs/ferreteria/contacto" className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-6 py-3 rounded-lg transition-all inline-flex items-center gap-2">
                Solicitar presupuesto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-10">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nombre: 'Arq. Carlos Mendoza', cargo: 'Constructor independiente', texto: 'Llevo 10 años comprando en El Constructor. La calidad de los productos y la atención son incomparables.' },
              { nombre: 'Ernesto Silva', cargo: 'Maestro plomero', texto: 'Me dan crédito, me asesoran y entregan en tiempo. No necesito ir a otro lugar para mi trabajo.' },
              { nombre: 'Mónica Torres', cargo: 'Propietaria', texto: 'Hice toda la remodelación de mi casa con materiales de El Constructor. Excelente relación precio-calidad.' },
            ].map(t => (
              <div key={t.nombre} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">{'★★★★★'.split('').map((s,i)=><span key={i} className="text-amber-400">{s}</span>)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.texto}&rdquo;</p>
                <div>
                  <p className="font-bold text-dark text-sm">{t.nombre}</p>
                  <p className="text-gray-400 text-xs">{t.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
