"use client"
import Link from "next/link"
import { Scale, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/abogados", label: "Inicio" },
  { href: "/webs/abogados/servicios", label: "Servicios" },
  { href: "/webs/abogados/nosotros", label: "Nosotros" },
  { href: "/webs/abogados/blog", label: "Blog" },
  { href: "/webs/abogados/testimonios", label: "Testimonios" },
  { href: "/webs/abogados/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-amber-600",
  iconTo: "to-amber-800",
  accentText: "text-amber-400",
  accentBg: "bg-amber-700",
  accentHover: "hover:bg-amber-600",
  accentShadow: "shadow-amber-900/40",
  accentBorder: "border-amber-700/25",
  accentSubtext: "text-amber-600/70",
  accentPill: "bg-amber-900/20",
  mobileBg: "#070b14",
  progressFrom: "from-amber-400",
  progressTo: "to-orange-500",
}

export default function AbogadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/abogados/contacto", label: "Consulta gratuita" }}
        Icon={Scale}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/[0.04] bg-[#05080f] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-amber-600" />
                <span className="font-black text-white tracking-tight">{brand.name} {brand.sub}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">
                Despacho jurídico integral con {new Date().getFullYear() - parseInt(brand.founded)} años de experiencia. CDMX, Jalisco, Nuevo León y Estado de México.
              </p>
              <p className="text-[11px] text-amber-900/50">{brand.barNumber}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Áreas</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Laboral", "Mercantil", "Familiar", "Penal", "Inmobiliario", "Corporativo"].map(a => <p key={a}>{a}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Despacho</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => (
                  <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-amber-900/60 pt-1">Lun–Vie 9:00–19:00 · Urgencias 24/7</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.sub} · Todos los derechos reservados</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Aviso de privacidad</a>
              <a href="#" className="hover:text-white/35">Términos de servicio</a>
            </div>
          </div>
        </div>
      <OrvenixBadge />
      </footer>
    </div>
  )
}


