import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { categorias, productos } from '@/lib/data'

export async function generateStaticParams() {
  return categorias.map(c => ({ categoria: c.slug }))
}

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const cat = categorias.find(c => c.slug === params.categoria)
  return { title: cat?.nombre ?? 'Categoría' }
}

export default function CategoriaPage({ params }: { params: { categoria: string } }) {
  const cat = categorias.find(c => c.slug === params.categoria) ?? categorias[0]
  const prods = productos.filter(p => p.cat === params.categoria)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-brand-600">Catálogo</Link>
        <span>/</span>
        <span className="text-dark font-medium">{cat.nombre}</span>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{cat.icon}</span>
        <div>
          <h1 className="text-3xl font-black text-dark">{cat.nombre}</h1>
          <p className="text-gray-500">{cat.count} productos en esta categoría</p>
        </div>
      </div>

      {prods.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {prods.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative aspect-square bg-gray-50">
                <Image src={p.img} alt={p.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{p.marca}</p>
                <h3 className="font-semibold text-dark text-sm line-clamp-2 mb-3">{p.nombre}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-black text-dark">${p.precio.toLocaleString('es-MX')}</span>
                  <button className="btn-primary text-xs py-2 px-3">Agregar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">No hay productos en esta categoría todavía.</p>
          <Link href="/catalogo" className="btn-outline">Ver todo el catálogo</Link>
        </div>
      )}
    </div>
  )
}
