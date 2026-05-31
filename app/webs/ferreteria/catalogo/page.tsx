import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { categorias, productos } from '@/app/webs/ferreteria/_site/lib/data'

export const metadata: Metadata = { title: 'Catálogo — Todos los productos' }

export default function CatalogoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-dark mb-2">Catálogo completo</h1>
      <p className="text-gray-500 mb-8">Más de 5,000 productos para profesionales y particulares</p>

      {/* Categorías */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-dark mb-5">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categorias.map(cat => (
            <Link key={cat.slug} href={`/webs/ferreteria/catalogo/${cat.slug}`} className="group bg-white border border-gray-100 rounded-2xl p-4 text-center hover:border-brand-500 hover:shadow-md transition-all">
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-xl overflow-hidden">
                <Image src={cat.img} alt={cat.nombre} fill className="object-cover" />
              </div>
              <p className="text-sm font-semibold text-dark group-hover:text-brand-600 transition-colors">{cat.nombre}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cat.count} productos</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Todos los productos */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-dark">Todos los productos</h2>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-brand-500">
            <option>Más relevante</option>
            <option>Precio: menor a mayor</option>
            <option>Precio: mayor a menor</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {productos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative aspect-square bg-gray-50">
                <Image src={p.img} alt={p.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                {!p.stock && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs font-bold bg-gray-700 text-white px-3 py-1 rounded-lg">Sin stock</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{p.marca}</p>
                <h3 className="font-semibold text-dark text-sm line-clamp-2 mb-3">{p.nombre}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-dark">${p.precio.toLocaleString('es-MX')}</span>
                  <button disabled={!p.stock} className="btn-primary text-xs py-2 px-3 disabled:opacity-40">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
