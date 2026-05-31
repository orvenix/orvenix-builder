"use client"
import Link from "next/link"
import { Users, Phone, Mail, MapPin } from "lucide-react"
import { brand } from "./data/index"
import EnhancedSiteNav from "@/app/webs/_shared/components/EnhancedSiteNav"
import { OrvenixBadge } from "@/components/OrvenixBadge"

const navLinks = [
  { href: "/webs/rrhh", label: "Inicio" },
  { href: "/webs/rrhh/servicios", label: "Servicios" },
  { href: "/webs/rrhh/casos", label: "Casos de éxito" },
  { href: "/webs/rrhh/nosotros", label: "Nosotros" },
  { href: "/webs/rrhh/contacto", label: "Contacto" },
]

const theme = {
  iconFrom: "from-violet-600",
  iconTo: "to-purple-800",
  accentText: "text-violet-400",
  accentBg: "bg-violet-600",
  accentHover: "hover:bg-violet-500",
  accentShadow: "shadow-violet-900/40",
  accentBorder: "border-violet-700/25",
  accentSubtext: "text-violet-400/70",
  accentPill: "bg-violet-900/20",
  mobileBg: "#090714",
  progressFrom: "from-violet-400",
  progressTo: "to-fuchsia-500",
}

export default function RRHHLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#090714] text-white font-sans">
      <EnhancedSiteNav
        brand={{ name: brand.name, sub: brand.sub }}
        links={navLinks}
        cta={{ href: "/webs/rrhh/contacto", label: "Diagnóstico gratuito" }}
        Icon={Users}
        theme={theme}
      />

      <main className="pt-16">{children}</main>

      <footer className="border-t border-white/5 bg-[#060411] py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-violet-500" />
                <span className="font-black text-white">{brand.name}</span>
              </div>
              <p className="text-xs text-white/25 leading-relaxed mb-3">{new Date().getFullYear() - parseInt(brand.founded)} años transformando organizaciones. LinkedIn: {brand.linkedin}.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-violet-700/60 uppercase tracking-wider mb-4">Servicios</h4>
              <div className="space-y-2 text-xs text-white/25">
                {["Reclutamiento & selección", "Administración de nómina", "Capacitación & desarrollo", "Clima organizacional", "Gestión del desempeño", "Outplacement"].map(s => <p key={s}>{s}</p>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-violet-700/60 uppercase tracking-wider mb-4">Consultora</h4>
              <div className="space-y-2 text-xs text-white/25">
                {navLinks.slice(1).map(l => <Link key={l.href} href={l.href} className="block hover:text-white/50">{l.label}</Link>)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-violet-700/60 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="space-y-2 text-xs text-white/25">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {brand.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {brand.email}</div>
                <div className="flex items-start gap-2"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {brand.address}</div>
                <p className="text-violet-900/50 pt-1">Lun–Vie 8:30–18:30</p>
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


