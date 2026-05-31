import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Filter } from 'lucide-react'
import { juguetes, categorias, badgeColors } from '@/app/webs/jugueteria/_site/lib/data'

export const metadata: Metadata = { title: 'Catálogo — Todos los juguetes' }

export default function CatalogoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-dark mb-2">🧸 Todos los juguetes</h1>
      <p className="text-gray-500 mb-8">{juguetes.length * 8} juguetes disponibles para todas las edades</p>

      {/* Filtros por edad */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button className="btn-primary text-sm py-2 px-4">Todos</button>
        {categorias.map(cat => (
          <Link key={cat.slug} href={`/webs/jugueteria/catalogo/${cat.slug}`}
            className="border-2 border-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl text-sm hover:border-blue-500 hover:text-blue-600 transition-all inline-flex items-center gap-1.5">
            <span>{cat.emoji}</span> {cat.nombre}
          </Link>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <Filter size={16} className="text-blue-600" />
              <span className="font-black text-dark">Filtros</span>
            </div>

            <div className="mb-5">
              <p className="text-xs font-black text-dark mb-3 uppercase tracking-wider">Precio</p>
              <div className="space-y-1.5">
                {['Hasta $500', '$500–$1,000', '$1,000–$2,000', 'Más de $2,000'].map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-blue-600">
                    <input type="checkbox" className="accent-blue-600 rounded" /> {r}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-black text-dark mb-3 uppercase tracking-wider">Edad</p>
              <div className="space-y-1.5">
                {['0–3 años', '4–8 años', '9–12 años', '12+ años'].map(e => (
                  <label key={e} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-blue-600">
                    <input type="checkbox" className="accent-blue-600 rounded" /> {e}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full justify-center text-sm">Aplicar</button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-gray-500">Mostrando {juguetes.length} de {juguetes.length * 8} resultados</p>
            <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-500">
              <option>Más populares</option>
              <option>Precio: menor a mayor</option>
              <option>Precio: mayor a menor</option>
              <option>Mejor valorado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {juguetes.map(j => (
              <div key={j.id} className="toy-card">
                <div className="relative aspect-square bg-gray-50">
                  <Image src={j.img} alt={j.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  {j.badge && (
                    <span className={`absolute top-2 left-2 text-xs font-black px-2 py-0.5 rounded-lg ${badgeColors[j.badge]}`}>{j.badge}</span>
                  )}
                  <span className="absolute bottom-2 left-2 bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-lg">
                    {j.edadMin}–{j.edadMax === 99 ? '14' : j.edadMax} años
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-dark text-sm line-clamp-2 mb-1.5 leading-snug">{j.nombre}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">{j.rating}</span>
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
      </div>
    </div>
  )
}
