import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Nosotros — 15 años de tradición' }

export default function NosotrosPage() {
  return (
    <>
      <section className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>15 años de tradición carnicera</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Una historia familiar de dedicación, calidad y amor por la buena carne.</p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-black text-dark mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Don Rubén y la herencia familiar</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              La Res Premium nació en 2010 de las manos de Don Rubén Castellanos, maestro carnicero con más de 30 años en el oficio. Lo que comenzó como un pequeño puesto en el Mercado Central hoy es la carnicería de referencia para miles de familias mexicanas.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nuestra filosofía es simple: elegir personalmente cada pieza, trabajar solo con ranchos certificados y tratar cada corte como una obra de arte.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Hoy, junto a sus hijos Andrés y Valeria, La Res Premium continúa creciendo sin perder la esencia: la atención personalizada y el compromiso con la calidad.
            </p>
          </div>
          <div className="relative h-96 rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800" alt="La Res Premium" fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { valor:'15+', label:'Años de experiencia' },
            { valor:'50+', label:'Tipos de cortes' },
            { valor:'3,000+', label:'Clientes frecuentes' },
            { valor:'10', label:'Ranchos proveedores' },
          ].map(s => (
            <div key={s.label} className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <p className="text-4xl font-black text-meat mb-1">{s.valor}</p>
              <p className="text-gray-600 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
