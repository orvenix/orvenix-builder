import { Metadata } from 'next'
import Image from 'next/image'
import { Users, Award, Heart, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Nosotros — Nuestra historia' }

const stats = [
  { icon: Users, label: 'Clientes felices', value: '10,000+' },
  { icon: Award, label: 'Años de experiencia', value: '8' },
  { icon: Heart, label: 'Prendas vendidas', value: '50,000+' },
  { icon: TrendingUp, label: 'Ciudades con envío', value: '32' },
]

const team = [
  { name: 'Sofía Ramírez', role: 'Directora Creativa', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' },
  { name: 'Carlos Vega', role: 'Jefe de Diseño', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' },
  { name: 'Valentina Cruz', role: 'Directora Comercial', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300' },
]

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-24 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black text-white mb-4">Nuestra historia</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Desde 2017, vestimos a miles de personas con prendas que combinan estilo, calidad y comodidad.
          </p>
        </div>
      </section>

      {/* Misión */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-dark mb-4">
                Moda con propósito y <span className="text-brand-600">calidad real</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                VistaModa nació con una visión clara: democratizar la moda de calidad en América Latina. Creemos que cada persona merece vestir bien sin sacrificar su presupuesto.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Trabajamos directamente con los mejores fabricantes para eliminar intermediarios y ofrecerte precios justos con materiales premium.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Cada prenda pasa por un riguroso control de calidad antes de llegar a tus manos. Tu satisfacción es nuestra prioridad número uno.
              </p>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800"
                alt="Nuestro equipo"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label}>
                <Icon size={28} className="text-brand-200 mx-auto mb-3" />
                <p className="text-4xl font-black text-white mb-1">{value}</p>
                <p className="text-brand-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-2">El equipo detrás de VistaModa</h2>
          <p className="text-center text-gray-500 mb-10">Apasionados por la moda y el servicio al cliente</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {team.map(member => (
              <div key={member.name} className="text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-brand-100">
                  <Image src={member.img} alt={member.name} fill className="object-cover" />
                </div>
                <h3 className="font-bold text-dark">{member.name}</h3>
                <p className="text-brand-600 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
