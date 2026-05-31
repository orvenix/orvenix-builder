import Link from 'next/link'
import { Globe, PlayCircle, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-white font-black text-xl">🎁 ¡Suscribite y obtené 15% OFF!</h3>
            <p className="text-blue-100 text-sm mt-1">Recibí novedades, ofertas y guías de regalo para cada edad</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto">
            <input type="email" placeholder="tu@email.com" className="flex-1 md:w-64 px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 text-sm focus:outline-none" />
            <button className="bg-white text-blue-600 font-black px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm">¡Quiero!</button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🪀</span>
              <div>
                <p className="font-black text-white">Mundo Mágico</p>
                <p className="text-blue-400 text-xs">Juguetería</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">Juguetes de calidad para chicos de todas las edades. Aprendizaje, diversión y mucha magia.</p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors"><Mail size={14} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 transition-colors"><Globe size={14} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-red-600 transition-colors"><PlayCircle size={14} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Por edad</h4>
            <ul className="space-y-2 text-sm">
              {['0–1 año', '1–3 años', '4–6 años', '7–10 años', '11–14 años'].map(e => (
                <li key={e}><Link href="/webs/jugueteria/catalogo" className="hover:text-blue-400 transition-colors">{e}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Categorías</h4>
            <ul className="space-y-2 text-sm">
              {['Peluches', 'Juegos de mesa', 'Educativos', 'Acción y aventura', 'Arte y manualidades', 'Vehículos'].map(c => (
                <li key={c}><Link href="/webs/jugueteria/catalogo" className="hover:text-blue-400 transition-colors">{c}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail size={13} className="text-blue-400" /> hola@mundomagico.mx</li>
              <li className="flex items-center gap-2"><Phone size={13} className="text-blue-400" /> 55 8899 0011</li>
              <li className="flex items-start gap-2"><MapPin size={13} className="text-blue-400 mt-0.5" /> Centro Comercial Las Americas, Local 45</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between text-xs text-gray-600">
          <p>© 2025 Mundo Mágico Juguetería. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-2 md:mt-0">
            <Link href="#" className="hover:text-gray-400">Privacidad</Link>
            <Link href="#" className="hover:text-gray-400">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
