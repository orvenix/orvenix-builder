import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star, Truck, Shield, Gift, HeartHandshake } from 'lucide-react'
import { categorias, juguetes, badgeColors } from '@/lib/data'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 min-h-[80vh] flex items-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl animate-bounce">🪀</div>
          <div className="absolute top-20 right-20 text-6xl animate-pulse">🧸</div>
          <div className="absolute bottom-20 left-1/4 text-5xl animate-bounce delay-200">🚂</div>
          <div className="absolute bottom-10 right-1/3 text-7xl animate-pulse delay-300">🎮</div>
          <div className="absolute top-1/2 left-1/3 text-5xl">🎨</div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                🎉 ¡Más de 500 juguetes esperándote!
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
                Donde cada<br />
                <span className="text-yellow-300">juguete</span><br />
                cuenta una historia
              </h1>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Juguetes educativos y divertidos para chicos de <strong className="text-white">0 a 14 años</strong>. Envío gratis en todo el país.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/catalogo" className="bg-white text-blue-600 font-black px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all inline-flex items-center gap-2 text-base shadow-lg">
                  Explorar juguetes <ArrowRight size={18} />
                </Link>
                <Link href="/catalogo/educativos" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black px-8 py-4 rounded-2xl transition-all inline-flex items-center gap-2 text-base shadow-lg">
                  🔬 Educativos
                </Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {juguetes.slice(0,4).map((j, i) => (
                <div key={j.id} className={`bg-white rounded-3xl p-4 shadow-2xl ${i % 2 === 1 ? 'mt-8' : ''}`}>
                  <div className="aspect-square bg-gray-50 rounded-2xl mb-3 overflow-hidden relative">
                    <Image src={j.img} alt={j.nombre} fill className="object-cover" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 mb-0.5">{j.edadMin}–{j.edadMax === 99 ? '14' : j.edadMax} años</p>
                  <p className="font-black text-dark text-sm line-clamp-1">{j.nombre}</p>
                  <p className="text-blue-600 font-black">${j.precio.toLocaleString('es-MX')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Truck, title: 'Envío gratis', desc: 'En compras +$800', color: 'bg-blue-50 text-blue-600' },
              { icon: Shield, title: 'Juguetes seguros', desc: 'Certificados CE y NOM', color: 'bg-green-50 text-green-600' },
              { icon: Gift, title: 'Envuelto para regalo', desc: 'Sin costo extra', color: 'bg-purple-50 text-purple-600' },
              { icon: HeartHandshake, title: 'Garantía 30 días', desc: 'Devolución fácil', color: 'bg-pink-50 text-pink-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>
                  <Icon size={19} />
                </div>
                <div>
                  <p className="font-black text-dark text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías por edad */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-3">🎯 Encontrá el juguete ideal</h2>
          <p className="text-center text-gray-500 mb-10">Seleccionado por expertos según la edad de tu hijo</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categorias.map(cat => (
              <Link
                key={cat.slug}
                href={`/catalogo/${cat.slug}`}
                className="group bg-white border-2 border-gray-100 hover:border-blue-300 rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300"
              >
                <span className="text-5xl mb-3 block group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                <div className={`inline-block text-xs font-black px-3 py-1 rounded-full mb-2 ${cat.color}`}>
                  {cat.nombre}
                </div>
                <p className="text-xs text-gray-500">{cat.desc}</p>
                <p className="text-blue-600 text-xs font-bold mt-2">{cat.count} productos →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">⭐ Los más queridos</h2>
              <p className="text-gray-500 mt-1">Los favoritos de los chicos (y sus papás)</p>
            </div>
            <Link href="/catalogo" className="hidden md:flex items-center gap-1 text-blue-600 font-bold text-sm hover:gap-2 transition-all">
              Ver todo <ArrowRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {juguetes.map(j => (
              <div key={j.id} className="toy-card">
                <div className="relative aspect-square bg-gray-50">
                  <Image src={j.img} alt={j.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  {j.badge && (
                    <span className={`absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-xl ${badgeColors[j.badge]}`}>
                      {j.badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-lg">
                    {j.edadMin}–{j.edadMax === 99 ? '14' : j.edadMax} años
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-dark text-sm line-clamp-2 mb-1.5 leading-snug">{j.nombre}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-600">{j.rating}</span>
                    <span className="text-xs text-gray-400">({j.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-dark">${j.precio.toLocaleString('es-MX')}</span>
                    <button className="btn-primary text-xs py-2 px-3">Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner educativos */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-4xl mb-3 block">🔬</span>
              <h2 className="text-3xl font-black mb-2">¡Aprender jugando es la clave!</h2>
              <p className="text-blue-100 max-w-md">Nuestra línea de juguetes educativos estimula la creatividad, la lógica y la ciencia desde pequeños.</p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/catalogo/educativos" className="bg-white text-blue-600 font-black px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all inline-flex items-center gap-2 text-base">
                Ver juguetes educativos <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-10">💬 Familias felices</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { nombre:'Mamá de Sofía (6 años)', texto:'El kit de ciencias fue un hit. Mi hija no para de hacer experimentos. ¡Excelente calidad y llegó en 2 días!', stars:5 },
              { nombre:'Papá de Mateo (3 años)', texto:'El tren de madera es increíble. Muy resistente y los colores son vibrantes. Vale cada peso.', stars:5 },
              { nombre:'Abuela de los mellizos', texto:'Los peluches son suavísimos y el empaque era perfecto para regalar. Los chicos lo amaron.', stars:5 },
            ].map(t => (
              <div key={t.nombre} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">{[...Array(t.stars)].map((_,i)=><Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.texto}"</p>
                <p className="font-bold text-dark text-sm">{t.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
