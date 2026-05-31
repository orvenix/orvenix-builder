"use client"
import Link from "next/link"
import { UtensilsCrossed, Phone, Mail, MapPin, AtSign } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/restaurante", label: "Inicio" },
  { href: "/webs/restaurante/menu", label: "Menú" },
  { href: "/webs/restaurante/nosotros", label: "Nosotros" },
  { href: "/webs/restaurante/blog", label: "Blog" },
  { href: "/webs/restaurante/contacto", label: "Reservaciones" },
]

const theme = {
  iconFrom: "from-amber-600", iconTo: "to-orange-900",
  accentText: "text-amber-400", accentBg: "bg-amber-600", accentHover: "hover:bg-amber-500",
  accentShadow: "shadow-amber-900/40", accentBorder: "border-amber-700/25",
  accentSubtext: "text-amber-500/70", accentPill: "bg-amber-900/20",
  mobileBg: "#120b04", progressFrom: "from-amber-400", progressTo: "to-orange-500",
}

export default function RestauranteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#120b04] text-white font-sans">
      <EnhancedSiteNav brand={{ name: brand.name, sub: brand.sub }} links={navLinks}
        cta={{ href: "/webs/restaurante/contacto", label: "Reservar mesa" }} Icon={UtensilsCrossed} theme={theme} />
      <main className="pt-16">{children}</main>
      <footer className="border-t border-white/[0.04] bg-[#0a0502] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                <span className="font-black text-white italic">{brand.name}</span>
              </div>
              <p className="text-xs text-white/20 leading-relaxed mb-3">
                Cocina italo-mexicana de autor en Polanco desde {brand.founded}. {brand.tripadvisor}.
              </p>
              <p className="text-[11px] text-amber-900/50">{brand.instagram}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Menú</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Entradas", "Platos Fuertes", "Postres", "Vinos & Cocktails", "Menú Degustación"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-700/60 uppercase tracking-wider mb-4">Restaurante</h4>
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
                <div className="flex items-center gap-2"><AtSign className="w-3 h-3" /> {brand.instagram}</div>
                <p className="text-amber-900/50 pt-1">Lun–Sáb 13:00–23:00 · Dom 13:00–18:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.sub} · Todos los derechos reservados</p>
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
