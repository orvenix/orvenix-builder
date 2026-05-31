import Link from 'next/link'
import { Globe, Megaphone, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300">
      {/* Newsletter */}
      <div className="border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white text-xl font-bold">Suscribite a nuestra newsletter</h3>
              <p className="text-gray-400 text-sm mt-1">Recibí ofertas exclusivas y las últimas tendencias</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 md:w-72 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
              />
              <button className="btn-primary whitespace-nowrap text-sm">
                Suscribirme
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-2xl font-black text-white">
              Vista<span className="text-brand-500">Moda</span>
            </span>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Moda que te define. Prendas de calidad para cada ocasión, con envío a todo el país.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-brand-600 transition-colors">
                <Mail size={16} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-brand-600 transition-colors">
                <Globe size={16} />
              </a>
              <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-brand-600 transition-colors">
                <Megaphone size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Tienda</h4>
            <ul className="space-y-2 text-sm">
              {['Mujer', 'Hombre', 'Accesorios', 'Calzado', 'Ofertas'].map(item => (
                <li key={item}>
                  <Link href={`/webs/vistamoda/tienda?cat=${item.toLowerCase()}`} className="hover:text-brand-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm">
              {['Guía de talles', 'Envíos y devoluciones', 'Seguí tu pedido', 'Preguntas frecuentes', 'Contacto'].map(item => (
                <li key={item}>
                  <Link href="/webs/vistamoda/contacto" className="hover:text-brand-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-brand-400 flex-shrink-0" />
                hola@vistamoda.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-brand-400 flex-shrink-0" />
                +52 55 1234 5678
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-brand-400 flex-shrink-0 mt-0.5" />
                Av. Principal 123, Ciudad de México
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2025 VistaModa. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-300">Privacidad</Link>
            <Link href="#" className="hover:text-gray-300">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
