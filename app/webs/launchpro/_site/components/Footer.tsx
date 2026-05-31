import Link from 'next/link'
import { Zap, Globe, Mail, BriefcaseBusiness } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <Link href="/webs/launchpro" className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-brand-600 rounded-lg"><Zap size={14} className="text-white" /></div>
              <span className="text-lg font-black text-white">Launch<span className="gradient-text">Pro</span></span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              La plataforma todo-en-uno para emprendedores que quieren lanzar y escalar sus negocios digitales.
            </p>
            <div className="flex gap-3 mt-5">
              {[Globe, Mail, BriefcaseBusiness].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-white/5 rounded-lg hover:bg-brand-600/20 hover:text-brand-400 transition-colors text-gray-400">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: 'Producto', links: ['Funciones', 'Precios', 'Novedades', 'Hoja de ruta'] },
            { title: 'Empresa', links: ['Nosotros', 'Blog', 'Prensa', 'Contacto'] },
            { title: 'Legal', links: ['Privacidad', 'Términos', 'Cookies', 'Seguridad'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between text-sm text-gray-600">
          <p>© 2025 LaunchPro. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0">Hecho con ❤ para emprendedores latinoamericanos</p>
        </div>
      </div>
    </footer>
  )
}
