"use client"
import Link from "next/link"
import { Scale, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/notaria", label: "Inicio" },
  { href: "/webs/notaria/tramites", label: "Trámites" },
  { href: "/webs/notaria/tarifas", label: "Tarifas" },
  { href: "/webs/notaria/nosotros", label: "Nosotros" },
  { href: "/webs/notaria/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-yellow-700",
  iconTo: "to-amber-800",
  accentText: "text-yellow-400",
  accentBg: "bg-yellow-700",
  accentHover: "hover:bg-yellow-600",
  accentShadow: "shadow-yellow-900/40",
  accentBorder: "border-yellow-700/25",
  accentSubtext: "text-yellow-600/70",
  accentPill: "bg-yellow-900/20",
  mobileBg: "#080a0e",
  progressFrom: "from-yellow-400",
  progressTo: "to-amber-500",
}

export default function NotariaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080a0e] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: `${brand.name} ${brand.numero}`, sub: "CDMX · Fe Pública" }}
        links={navLinks}
        cta={{ href: "/webs/notaria/contacto", label: "Solicitar cita" }}
        Icon={Scale}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/5 bg-[#05070a] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-yellow-600" />
                <span className="font-black text-white">{brand.name} {brand.numero}</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed mb-3">{new Date().getFullYear() - parseInt(brand.founded)} años de servicio. {brand.protocolo}.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Trámites</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Escrituración", "Testamentos", "Poderes notariales", "Sociedades mercantiles", "Actas & certificaciones", "Sucesiones"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Notaría</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-yellow-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-yellow-900/50 pt-1">Lun–Vie 9:00–18:00 · Sáb 10:00–13:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/4 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-white/15">
            <p>© {new Date().getFullYear()} {brand.name} {brand.numero} · {brand.notario}</p>
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


