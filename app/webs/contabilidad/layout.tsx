"use client"
import Link from "next/link"
import { TrendingUp, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/contabilidad", label: "Inicio" },
  { href: "/webs/contabilidad/servicios", label: "Servicios" },
  { href: "/webs/contabilidad/planes", label: "Planes" },
  { href: "/webs/contabilidad/nosotros", label: "Nosotros" },
  { href: "/webs/contabilidad/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-teal-600",
  iconTo: "to-cyan-800",
  accentText: "text-teal-400",
  accentBg: "bg-teal-600",
  accentHover: "hover:bg-teal-500",
  accentShadow: "shadow-teal-900/40",
  accentBorder: "border-teal-700/25",
  accentSubtext: "text-teal-500/70",
  accentPill: "bg-teal-900/20",
  mobileBg: "#070f14",
  progressFrom: "from-teal-400",
  progressTo: "to-cyan-500",
}

export default function ContabilidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070f14] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/contabilidad/contacto", label: "Consulta fiscal gratis" }}
        Icon={TrendingUp}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/5 bg-[#040c10] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed mb-3">{brand.rfc} · Miembro IMCP · Fundado {brand.founded}.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Servicios</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Contabilidad mensual", "Declaraciones SAT", "Nómina & IMSS", "Auditoría", "Planeación fiscal", "Apertura de empresas"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Despacho</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-teal-900/60 pt-1">Lun–Vie 9:00–19:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/4 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
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


