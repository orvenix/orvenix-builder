import { Metadata } from 'next'
import Image from 'next/image'
import { Heart, Award, Users, Globe } from 'lucide-react'

export const metadata: Metadata = { title: 'Nosotros — Nuestra misión' }

export default function NosotrosPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-5xl mb-4 block">🪀</span>
          <h1 className="text-5xl font-black mb-4">Jugamos en serio</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Más de 10 años eligiendo los mejores juguetes del mundo para que cada niño descubra su potencial jugando.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-black text-dark mb-4">¿Por qué Mundo Mágico?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Fundada en 2015 por dos papás apasionados por la educación temprana, Mundo Mágico nació con un propósito claro: ofrecer juguetes que no solo diviertan, sino que también estimulen el desarrollo cognitivo, emocional y social de los niños.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cada producto que ofrecemos pasa por un riguroso proceso de selección: seguridad, calidad de materiales, valor educativo y por supuesto, que sea ¡super divertido!
            </p>
            <p className="text-gray-600 leading-relaxed">
              Trabajamos con las mejores marcas del mundo y también apoyamos a emprendedores locales que crean juguetes únicos y artesanales.
            </p>
          </div>
          <div className="relative h-80 rounded-3xl overflow-hidden">
            <Image src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800" alt="Mundo Mágico" fill className="object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
          {[
            { icon: Users, value: '50,000+', label: 'Familias felices', color: 'bg-blue-50 text-blue-600' },
            { icon: Award, value: '500+', label: 'Juguetes en catálogo', color: 'bg-purple-50 text-purple-600' },
            { icon: Globe, value: '15+', label: 'Marcas internacionales', color: 'bg-pink-50 text-pink-600' },
            { icon: Heart, value: '10', label: 'Años de experiencia', color: 'bg-amber-50 text-amber-600' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className={`rounded-2xl p-6 text-center ${color}`}>
              <Icon size={24} className="mx-auto mb-2" />
              <p className="text-3xl font-black">{value}</p>
              <p className="text-sm font-semibold mt-1 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Nuestra promesa</h2>
          <p className="text-gray-800 max-w-2xl mx-auto">
            &ldquo;Cada juguete en Mundo Mágico está elegido con amor, porque creemos que el juego es la forma más poderosa de aprendizaje que existe.&rdquo;
          </p>
          <p className="text-gray-700 text-sm font-bold mt-3">— María y Carlos, fundadores</p>
        </div>
      </section>
    </>
  )
}
