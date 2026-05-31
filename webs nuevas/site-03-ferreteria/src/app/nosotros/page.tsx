import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Nosotros — 20 años de trayectoria' }

export default function NosotrosPage() {
  return (
    <>
      <section className="bg-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black mb-4">20 años construyendo confianza</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">Desde 2005, somos el proveedor de confianza de miles de constructores, plomeros, electricistas y particulares en CDMX.</p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-black text-dark mb-4">Nuestra historia</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ferretería El Constructor comenzó en 2005 como un pequeño local familiar en el corazón de la Ciudad de México. Don Felipe Gutiérrez, con más de 30 años en el rubro de la construcción, decidió abrir una ferretería diferente: una donde el cliente no solo compra un producto, sino que recibe asesoramiento profesional.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hoy somos una empresa de 45 empleados con uno de los catálogos más completos de la región: más de 5,000 productos de las mejores marcas del mercado.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Nuestra filosofía no ha cambiado: calidad, honestidad y servicio personalizado en cada venta.
            </p>
          </div>
          <div className="relative h-96 rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800" alt="Nuestra ferretería" fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-16">
          {[
            { valor: '20+', label: 'Años de experiencia' },
            { valor: '5,000+', label: 'Productos en stock' },
            { valor: '15,000+', label: 'Clientes activos' },
            { valor: '45', label: 'Colaboradores' },
          ].map(stat => (
            <div key={stat.label} className="bg-brand-50 rounded-2xl p-6">
              <p className="text-4xl font-black text-brand-600 mb-1">{stat.valor}</p>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
