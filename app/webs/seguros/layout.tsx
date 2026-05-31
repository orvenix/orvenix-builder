"use client"
import Link from "next/link"
import { Shield, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/seguros", label: "Inicio" },
  { href: "/webs/seguros/productos", label: "Productos" },
  { href: "/webs/seguros/nosotros", label: "Nosotros" },
  { href: "/webs/seguros/blog", label: "Blog" },
  { href: "/webs/seguros/testimonios", label: "Testimonios" },
  { href: "/webs/seguros/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-blue-600",
  iconTo: "to-indigo-800",
  accentText: "text-blue-400",
  accentBg: "bg-blue-600",
  accentHover: "hover:bg-blue-500",
  accentShadow: "shadow-blue-900/40",
  accentBorder: "border-blue-700/25",
  accentSubtext: "text-blue-500/70",
  accentPill: "bg-blue-900/20",
  mobileBg: "#06090f",
  progressFrom: "from-blue-400",
  progressTo: "to-indigo-500",
}

export default function SegurosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#06090f] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/seguros/contacto", label: "Cotizar gratis" }}
        Icon={Shield}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/[0.04] bg-[#040609] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="font-black text-white">{brand.name} <span className="font-normal text-white/40">{brand.sub}</span></span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">
                Corredor independiente de seguros con {new Date().getFullYear() - parseInt(brand.founded)} años en el mercado. Trabajamos para ti, no para las aseguradoras.
              </p>
              <p className="text-[11px] text-blue-900/50">{brand.license}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-700/60 uppercase tracking-wider mb-4">Productos</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Vida", "Gastos Médicos", "Auto", "Empresarial", "Hogar", "Retiro"].map(p => <p key={p}>{p}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-700/60 uppercase tracking-wider mb-4">Agencia</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => (
                  <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-blue-900/50 pt-1">Lun–Vie 9:00–19:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.sub} · Todos los derechos reservados · {brand.license}</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Aviso de privacidad</a>
              <a href="#" className="hover:text-white/35">Términos</a>
            </div>
          </div>
        </div>
      <OrvenixBadge />
      </footer>
    </div>
  )
}


