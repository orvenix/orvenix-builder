import Link from 'next/link'
import { Phone, Mail, MapPin, Clock, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1a0a00' }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🥩</span>
              <div>
                <p className="font-black text-white text-sm">La Res Premium</p>
                <p className="text-amber-500/70 text-xs uppercase tracking-wider">Carnicería Artesanal</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Cortes artesanales de la más alta calidad. Seleccionados con cuidado por nuestros carniceros expertos desde 2010.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-meat/40 transition-colors"><Instagram size={15} /></a>
              <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-meat/40 transition-colors"><Facebook size={15} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Nuestros cortes</h4>
            <ul className="space-y-2 text-sm">
              {['Res premium', 'Cerdo artesanal', 'Cordero', 'Pollo de campo', 'Embutidos propios', 'Marinados'].map(i => (
                <li key={i}><Link href="/cortes" className="hover:text-amber-400 transition-colors">{i}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Links</h4>
            <ul className="space-y-2 text-sm">
              {[{href:'/pedidos',l:'Hacer pedido'},{href:'/galeria',l:'Galería'},{href:'/nosotros',l:'Nosotros'},{href:'/contacto',l:'Contacto'}].map(({href,l})=>(
                <li key={l}><Link href={href} className="hover:text-amber-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone size={13} className="text-amber-500" /> 55 1122 3344</li>
              <li className="flex items-center gap-2"><Mail size={13} className="text-amber-500" /> hola@larespremium.mx</li>
              <li className="flex items-start gap-2"><MapPin size={13} className="text-amber-500 mt-0.5" /> Mercado Central, Local 12, CDMX</li>
              <li className="flex items-center gap-2"><Clock size={13} className="text-amber-500" /> Mar-Dom 7:00-19:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex justify-between text-xs text-gray-600">
          <p>© 2025 La Res Premium. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
