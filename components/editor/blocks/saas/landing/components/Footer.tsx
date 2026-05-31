import Link from "next/link"
import { ArrowRight, Send, Code2, Globe } from "lucide-react"

const footerLinks: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: "Features", href: "/servicios" },
    { label: "Pricing", href: "/precios" },
    { label: "Changelog", href: "/estado" },
    { label: "Roadmap", href: "/plataforma" },
    { label: "Status", href: "/estado" },
  ],
  Empresa: [
    { label: "Sobre nosotros", href: "/proceso" },
    { label: "Blog", href: "/faq" },
    { label: "Careers", href: "/contacto" },
    { label: "Press", href: "/contacto" },
    { label: "Contacto", href: "/contacto" },
  ],
  Legal: [
    { label: "Privacy", href: "/legal/privacidad" },
    { label: "Terms", href: "/legal/terminos" },
    { label: "DPA", href: "/legal/privacidad" },
    { label: "Security", href: "/seguridad" },
    { label: "GDPR", href: "/legal/privacidad" },
  ],
  Developers: [
    { label: "Docs", href: "/faq" },
    { label: "API Reference", href: "/integraciones" },
    { label: "SDKs", href: "/integraciones" },
    { label: "Webhooks", href: "/integraciones" },
    { label: "GitHub", href: "/webs" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#040408] border-t border-white/[0.07]">
      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative rounded-3xl overflow-hidden p-12 text-center" style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.15) 50%, rgba(236,72,153,0.15) 100%)",
          border: "1px solid rgba(99,102,241,0.3)"
        }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Empieza hoy, gratis.
            </h2>
            <p className="text-lg text-white/50 mb-8 max-w-lg mx-auto">
              14 días de prueba con acceso completo al plan Pro. Sin tarjeta de crédito requerida.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-0 bg-white/[0.07] rounded-xl border border-white/10 overflow-hidden">
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  className="px-5 py-3.5 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none w-64"
                />
                <button className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors flex items-center gap-2 shrink-0">
                  Empezar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-white/25 mt-4">
              Sin tarjeta · 14 días gratis · Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-white/[0.07]">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-black text-sm text-white">
                O
              </div>
              <span className="font-bold text-white">Orvenix</span>
            </div>
            <p className="text-sm text-white/35 leading-relaxed mb-6 max-w-xs">
              La plataforma SaaS de nueva generación para equipos que quieren moverse rápido.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: Send, href: "https://wa.me/528128985846" },
                { Icon: Code2, href: "/integraciones" },
                { Icon: Globe, href: "https://orvenix.com.mx" },
              ].map(({ Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/[0.07] flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/40" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/35 hover:text-white/70 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2026 Orvenix. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/legal/privacidad" },
              { label: "Terms", href: "/legal/terminos" },
              { label: "Cookies", href: "/legal/cookies" },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-xs text-white/20 hover:text-white/40 transition-colors">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
