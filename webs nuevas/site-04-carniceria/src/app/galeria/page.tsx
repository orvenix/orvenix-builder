import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Galería' }

const fotos = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
  'https://images.unsplash.com/photo-1558030006-450675393462?w=600',
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600',
  'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600',
  'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600',
  'https://images.unsplash.com/photo-1558030006-450675393462?w=600',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600',
  'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=600',
]

export default function GaleriaPage() {
  return (
    <>
      <section className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Galería</h1>
          <p className="text-gray-300">Nuestros cortes, nuestro local y el arte de la carnicería artesanal</p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fotos.map((foto, i) => (
            <div key={i} className={`relative rounded-2xl overflow-hidden ${i === 0 || i === 5 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}>
              <Image src={foto} alt={`Galería ${i+1}`} fill className="object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
