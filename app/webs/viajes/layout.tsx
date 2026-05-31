"use client"
import Link from "next/link"
import { Compass, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/viajes", label: "Inicio" },
  { href: "/webs/viajes/destinos", label: "Destinos" },
  { href: "/webs/viajes/paquetes", label: "Paquetes" },
  { href: "/webs/viajes/nosotros", label: "Nosotros" },
  { href: "/webs/viajes/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-orange-500",
  iconTo: "to-rose-700",
  accentText: "text-orange-400",
  accentBg: "bg-orange-600",
  accentHover: "hover:bg-orange-500",
  accentShadow: "shadow-orange-900/40",
  accentBorder: "border-orange-700/25",
  accentSubtext: "text-orange-500/70",
  accentPill: "bg-orange-900/20",
  mobileBg: "#08080f",
  progressFrom: "from-orange-400",
  progressTo: "to-rose-500",
}

export default function ViajesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080f] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/viajes/contacto", label: "Cotizar viaje" }}
        Icon={Compass}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/5 bg-[#050508] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Compass className="w-5 h-5 text-orange-500" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed mb-3">Agencia certificada {brand.iata}. {new Date().getFullYear() - parseInt(brand.founded)} años conectando a México con el mundo.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-700/60 uppercase tracking-wider mb-4">Viajes</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Paquetes nacionales", "Internacionales", "Cruceros", "Luna de miel", "Grupos", "Aventura"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-700/60 uppercase tracking-wider mb-4">Agencia</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-orange-900/50 pt-1">Lun–Sáb 9:00–20:00 · Dom 10:00–16:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/4 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} · {brand.sub} · Todos los derechos reservados</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/35">Privacidad</a>
              <a href="#" className="hover:text-white/35">Términos</a>
            </div>
          </div>
        </div>
      <OrvenixBadge />
      </footer>
    </div>
  )
}


