import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Truck, Shield, Gift, Heart } from 'lucide-react'
import { juguetes, badgeColors } from '@/app/webs/jugueteria/_site/lib/data'

export async function generateStaticParams() {
  return juguetes.map(j => ({ slug: j.id }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const toy = juguetes.find(j => j.id === params.slug)
  return { title: toy?.nombre ?? 'Juguete' }
}

export default function ProductoPage({ params }: { params: { slug: string } }) {
  const toy = juguetes.find(j => j.id === params.slug) ?? juguetes[0]
  const related = juguetes.filter(j => j.id !== toy.id).slice(0, 4)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/webs/jugueteria" className="hover:text-blue-600">Inicio</Link>
        <span>/</span>
        <Link href="/webs/jugueteria/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span>/</span>
        <span className="text-dark font-semibold">{toy.nombre}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden">
          <Image src={toy.img} alt={toy.nombre} fill className="object-cover" />
          {toy.badge && (
            <span className={`absolute top-4 left-4 text-sm font-black px-3 py-1.5 rounded-xl ${badgeColors[toy.badge]}`}>{toy.badge}</span>
          )}
          <button className="absolute top-4 right-4 p-2.5 bg-white rounded-full shadow hover:text-red-500 transition-colors">
            <Heart size={18} />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full">
              🎯 {toy.edadMin}–{toy.edadMax === 99 ? '14' : toy.edadMax} años
            </span>
          </div>

          <h1 className="text-3xl font-black text-dark mb-3">{toy.nombre}</h1>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_,i) => (
                <Star key={i} size={16} className={i < Math.floor(toy.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm font-bold">{toy.rating}</span>
            <span className="text-sm text-gray-400">({toy.reviews} reseñas)</span>
          </div>

          <p className="text-3xl font-black text-dark mb-6">${toy.precio.toLocaleString('es-MX')}</p>

          <p className="text-gray-600 leading-relaxed mb-6">
            Un juguete diseñado para estimular la creatividad, la lógica y la imaginación de los chicos. Material certificado libre de BPA, resistente y de larga duración. Ideal para regalar.
          </p>

          <div className="flex gap-3 mb-6">
            <div className="flex items-center border-2 border-gray-200 rounded-xl">
              <button className="px-4 py-3 font-bold text-lg hover:bg-gray-50">-</button>
              <span className="px-5 font-bold">1</span>
              <button className="px-4 py-3 font-bold text-lg hover:bg-gray-50">+</button>
            </div>
            <button className="flex-1 btn-primary justify-center">Agregar al carrito 🛒</button>
          </div>
          <button className="btn-secondary w-full justify-center mb-6">Comprar ahora ⚡</button>

          <div className="space-y-2.5 border-t border-gray-100 pt-5">
            {[
              { icon: Truck, text: 'Envío gratis en compras +$800' },
              { icon: Shield, text: 'Juguete certificado y seguro' },
              { icon: Gift, text: 'Envuelto para regalo sin costo' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-gray-600">
                <Icon size={14} className="text-blue-600" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-black text-dark mb-6">También te puede gustar 🎁</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map(j => (
            <Link key={j.id} href={`/webs/jugueteria/producto/${j.id}`} className="toy-card block group">
              <div className="relative aspect-square bg-gray-50">
                <Image src={j.img} alt={j.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <h3 className="font-black text-dark text-sm line-clamp-2">{j.nombre}</h3>
                <p className="font-black text-blue-600 mt-1">${j.precio.toLocaleString('es-MX')}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
