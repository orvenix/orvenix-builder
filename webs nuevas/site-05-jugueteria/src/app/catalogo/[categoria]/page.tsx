import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ArrowLeft } from 'lucide-react'
import { categorias, juguetes, badgeColors } from '@/lib/data'

export async function generateStaticParams() {
  return categorias.map(c => ({ categoria: c.slug }))
}

export async function generateMetadata({ params }: { params: { categoria: string } }): Promise<Metadata> {
  const cat = categorias.find(c => c.slug === params.categoria)
  return { title: `${cat?.nombre ?? 'Categoría'} — Juguetes` }
}

export default function CategoriaPage({ params }: { params: { categoria: string } }) {
  const cat = categorias.find(c => c.slug === params.categoria) ?? categorias[0]
  const catJuguetes = juguetes.filter(j => j.cat === params.categoria)
  const todos = catJuguetes.length ? catJuguetes : juguetes

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/catalogo" className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-6 hover:gap-3 transition-all">
        <ArrowLeft size={15} /> Volver al catálogo
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">{cat.emoji}</span>
        <div>
          <div className={`inline-block text-sm font-black px-3 py-1 rounded-full mb-1 ${cat.color}`}>{cat.nombre}</div>
          <p className="text-gray-500 text-sm">{cat.desc} — {cat.count} productos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {todos.map(j => (
          <div key={j.id} className="toy-card">
            <div className="relative aspect-square bg-gray-50">
              <Image src={j.img} alt={j.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              {j.badge && (
                <span className={`absolute top-2 left-2 text-xs font-black px-2 py-0.5 rounded-lg ${badgeColors[j.badge]}`}>{j.badge}</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-black text-dark text-sm line-clamp-2 mb-1.5 leading-snug">{j.nombre}</h3>
              <div className="flex items-center gap-1 mb-3">
                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold">{j.rating}</span>
                <span className="text-xs text-gray-400">({j.reviews})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-dark">${j.precio.toLocaleString('es-MX')}</span>
                <button className="btn-primary text-xs py-2 px-3">Agregar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
