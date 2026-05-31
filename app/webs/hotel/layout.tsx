"use client"
import Link from "next/link"
import { Building2, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/hotel", label: "Inicio" },
  { href: "/webs/hotel/habitaciones", label: "Habitaciones" },
  { href: "/webs/hotel/servicios", label: "Servicios" },
  { href: "/webs/hotel/blog", label: "Experiencias" },
  { href: "/webs/hotel/contacto", label: "Reservar" },
]

const theme = {
  iconFrom: "from-stone-500", iconTo: "to-amber-800",
  accentText: "text-amber-300", accentBg: "bg-amber-700", accentHover: "hover:bg-amber-600",
  accentShadow: "shadow-amber-900/40", accentBorder: "border-amber-700/30",
  accentSubtext: "text-amber-400/70", accentPill: "bg-amber-900/20",
  mobileBg: "#100c06", progressFrom: "from-amber-300", progressTo: "to-stone-400",
}

export default function Building2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#100c06] text-white font-sans">
      <EnhancedSiteNav brand={{ name: brand.name, sub: brand.sub }} links={navLinks}
        cta={{ href: "/webs/hotel/contacto", label: "Reservar ahora" }} Icon={Building2} theme={theme} />
      <main className="pt-16">{children}</main>
      <footer className="border-t border-white/[0.04] bg-[#0c0904] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">{brand.tripadvisor} · {brand.rating}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Alojamiento</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Suite Presidencial","Suite Junior Deluxe","Habitación Superior","Habitación Estándar"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Building2</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50 transition-colors">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-amber-900/50 pt-1">Check-in 15:00 · Check-out 12:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.sub} · Todos los derechos reservados</p>
            <div className="flex gap-5"><a href="#" className="hover:text-white/35">Privacidad</a><a href="#" className="hover:text-white/35">Términos</a></div>
          </div>
        </div>
        <OrvenixBadge />
      </footer>
    </div>
  )
}
