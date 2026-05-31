import { Metadata } from 'next'
import { SlidersHorizontal, Grid2X2, List } from 'lucide-react'
import ProductCard from '@/app/webs/vistamoda/_site/components/ProductCard'
import { products, categories } from '@/app/webs/vistamoda/_site/lib/products'

export const metadata: Metadata = { title: 'Tienda — Todos los productos' }

export default function TiendaPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-dark">Tienda</h1>
        <p className="text-gray-500 mt-1">{products.length} productos disponibles</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filtros */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-5">
              <SlidersHorizontal size={18} className="text-brand-600" />
              <span className="font-semibold text-dark">Filtros</span>
            </div>

            {/* Categorías */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Categoría</h3>
              <ul className="space-y-2">
                <li>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-brand-600">
                    <input type="checkbox" className="rounded accent-brand-600" defaultChecked />
                    Todos ({products.length})
                  </label>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-brand-600">
                      <input type="checkbox" className="rounded accent-brand-600" />
                      {cat.name} ({cat.count})
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precio */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Precio</h3>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="Mín" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                <span className="text-gray-400">—</span>
                <input type="number" placeholder="Máx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
              </div>
            </div>

            {/* Talle */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Talle</h3>
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                  <button key={s} className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:border-brand-600 hover:text-brand-600 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full btn-primary justify-center text-sm">
              Aplicar filtros
            </button>
          </div>
        </aside>

        {/* Grid Productos */}
        <div className="flex-1">
          {/* Controles */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-brand-500">
                <option>Más relevante</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
                <option>Más nuevo</option>
                <option>Mejor valorado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-200 rounded-lg hover:border-brand-600 transition-colors">
                <Grid2X2 size={16} />
              </button>
              <button className="p-2 border border-gray-200 rounded-lg hover:border-brand-600 transition-colors">
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Paginación */}
          <div className="flex justify-center gap-2 mt-10">
            {[1, 2, 3, '...', 8].map((n, i) => (
              <button
                key={i}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  n === 1
                    ? 'bg-brand-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-brand-600 hover:text-brand-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
